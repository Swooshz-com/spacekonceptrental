#!/usr/bin/env node

// Repo-owned n8n workflow hook.
//
// The import/export PowerShell scripts are intentionally generic. They call this
// hook at named phases so this repo can repair SpaceKonceptRental-specific n8n
// UI/export drift without hardcoding those rules into reusable template files.
//
// Keep project-specific workflow names, node names, and schema fixes in this
// file. If the generic template scripts are copied in again later, preserve this
// hook file so the repo-specific normalisations still run.

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      parsed._.push(arg);
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      parsed[key] = next;
      index += 1;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}

function listJsonFiles(dir) {
  if (!dir || !fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(dir, entry.name));
}

function findNode(workflow, nodeName) {
  return Array.isArray(workflow.nodes)
    ? workflow.nodes.find((node) => node && node.name === nodeName)
    : null;
}

function normaliseTrimmedColumnKey(columns, columnName) {
  const values = columns?.value;
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return false;
  }

  let changed = false;
  for (const key of Object.keys(values)) {
    if (key.trim() === columnName && key !== columnName) {
      values[columnName] = values[key];
      delete values[key];
      changed = true;
    }
  }
  return changed;
}

function normaliseSchemaEntry(schemaEntry, columnName, expectedType) {
  let changed = false;

  if (typeof schemaEntry.id === 'string' && schemaEntry.id.trim() === columnName && schemaEntry.id !== columnName) {
    schemaEntry.id = columnName;
    changed = true;
  }

  if (
    typeof schemaEntry.displayName === 'string' &&
    schemaEntry.displayName.trim() === columnName &&
    schemaEntry.displayName !== columnName
  ) {
    schemaEntry.displayName = columnName;
    changed = true;
  }

  if (schemaEntry.id === columnName && schemaEntry.type !== expectedType) {
    schemaEntry.type = expectedType;
    changed = true;
  }

  return changed;
}

function normaliseConversationDedupeColumns(workflow) {
  const nodeNames = [
    'Upsert Conversation Processing',
    'Upsert Conversation Completed',
  ];

  let changed = false;
  for (const nodeName of nodeNames) {
    const node = findNode(workflow, nodeName);
    const columns = node?.parameters?.columns;
    if (!columns) {
      continue;
    }

    changed = normaliseTrimmedColumnKey(columns, 'dedupe_key') || changed;

    if (Array.isArray(columns.schema)) {
      for (const schemaEntry of columns.schema) {
        if (schemaEntry && typeof schemaEntry === 'object') {
          changed = normaliseSchemaEntry(schemaEntry, 'dedupe_key', 'string') || changed;
        }
      }
    }
  }
  return changed;
}

function normaliseDebounceWaitNode(workflow) {
  const debounceNode = findNode(workflow, 'Debounce Chat Batch');
  if (!debounceNode) {
    return false;
  }

  let changed = false;
  if (debounceNode.type !== 'n8n-nodes-base.wait') {
    debounceNode.type = 'n8n-nodes-base.wait';
    changed = true;
  }

  debounceNode.parameters = debounceNode.parameters || {};
  const requiredParameters = {
    resume: 'timeInterval',
    amount: 5,
    unit: 'seconds',
  };

  for (const [key, value] of Object.entries(requiredParameters)) {
    if (debounceNode.parameters[key] !== value) {
      debounceNode.parameters[key] = value;
      changed = true;
    }
  }

  return changed;
}

function normaliseSupportAgentWorkflow(workflow) {
  let changed = false;
  const lookupNode = findNode(workflow, 'Lookup Conversation State');

  if (lookupNode?.parameters && lookupNode.parameters.combineFilters !== 'AND') {
    lookupNode.parameters.combineFilters = 'AND';
    changed = true;
  }

  if (lookupNode?.parameters?.options?.combineFilters !== undefined) {
    delete lookupNode.parameters.options.combineFilters;
    changed = true;
  }

  changed = normaliseConversationDedupeColumns(workflow) || changed;
  changed = normaliseDebounceWaitNode(workflow) || changed;

  return changed;
}

function normaliseRagIngestionWorkflow(workflow) {
  const appendNode = findNode(workflow, 'Append KB Ingestion Log');
  const columns = appendNode?.parameters?.columns;
  if (!columns) {
    return false;
  }

  let changed = normaliseTrimmedColumnKey(columns, 'chunks_count');
  if (Array.isArray(columns.schema)) {
    for (const schemaEntry of columns.schema) {
      if (schemaEntry && typeof schemaEntry === 'object') {
        changed = normaliseSchemaEntry(schemaEntry, 'chunks_count', 'number') || changed;
      }
    }
  }

  return changed;
}

function normaliseWorkflowFile(file) {
  let workflow;
  try {
    workflow = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Could not parse workflow JSON ${file}: ${error.message}`);
  }

  let changed = false;
  changed = normaliseSupportAgentWorkflow(workflow) || changed;
  changed = normaliseRagIngestionWorkflow(workflow) || changed;

  if (changed) {
    fs.writeFileSync(file, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
  }

  return changed;
}

function uniqueExistingDirs(dirs) {
  const seen = new Set();
  const resolved = [];
  for (const dir of dirs) {
    if (!dir) {
      continue;
    }
    const fullPath = path.resolve(dir);
    if (seen.has(fullPath) || !fs.existsSync(fullPath)) {
      continue;
    }
    seen.add(fullPath);
    resolved.push(fullPath);
  }
  return resolved;
}

const args = parseArgs(process.argv.slice(2));
const hookName = args._[0];
const repoRoot = args['repo-root'] ? path.resolve(args['repo-root']) : process.cwd();

const targetDirsByHook = {
  'before-export-sync': [args['export-dir']],
  'after-export-sync': [args['workflow-dir']],
  'before-import-validation': [args['workflow-dir']],
  'before-live-import': [args['prepared-dir']],
};

const targetDirs = uniqueExistingDirs((targetDirsByHook[hookName] || []).map((dir) => {
  if (!dir) {
    return null;
  }
  return path.isAbsolute(dir) ? dir : path.join(repoRoot, dir);
}));

let changedCount = 0;
for (const dir of targetDirs) {
  for (const file of listJsonFiles(dir)) {
    if (normaliseWorkflowFile(file)) {
      changedCount += 1;
    }
  }
}

if (changedCount > 0) {
  console.log(`[n8n-hook] ${hookName}: normalised ${changedCount} workflow file(s).`);
}
