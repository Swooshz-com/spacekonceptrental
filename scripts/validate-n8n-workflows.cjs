const fs = require('node:fs');
const path = require('node:path');

const CANONICAL_WORKFLOW_DIR = 'n8n-workflows';
const DEFAULT_POLICY_FILE = 'n8n-workflow-policy.json';

function parseArgs(argv) {
  let workflowDirArg = null;
  let policyArg = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--policy') {
      policyArg = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--policy=')) {
      policyArg = arg.slice('--policy='.length);
      continue;
    }
    if (!arg.startsWith('--') && !workflowDirArg) {
      workflowDirArg = arg;
    }
  }

  return { workflowDirArg, policyArg };
}

function loadPolicy(root, policyArg) {
  const policyPath = policyArg
    ? path.resolve(policyArg)
    : path.join(root, DEFAULT_POLICY_FILE);

  const defaults = {
    allowedPlaceholders: [
      '^[A-Z0-9_]+_(ID|URL|EMAIL|NAME|TOKEN|TOKEN_PLACEHOLDER|PLACEHOLDER|KEY|HOST|DOMAIN|PATH|USER|USER_ID|PROJECT_ID|WEBHOOK)$',
      '^[A-Z0-9_]+_PLACEHOLDER$',
    ],
    allowedEmailDomains: ['example.com'],
    allowedUrlHosts: ['example.com', 'n8n.example.com'],
    allowedLiteralValues: [],
    warnOnGoogleIds: true,
    failOnWarnings: false,
  };

  if (!fs.existsSync(policyPath)) {
    if (policyArg) {
      throw new Error(`Policy file does not exist: ${policyPath}`);
    }
    return {
      ...defaults,
      policyPath: null,
    };
  }

  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8').replace(/^\uFEFF/, ''));
  return {
    ...defaults,
    ...policy,
    allowedPlaceholders: [
      ...defaults.allowedPlaceholders,
      ...(Array.isArray(policy.allowedPlaceholders) ? policy.allowedPlaceholders : []),
    ],
    allowedEmailDomains: Array.isArray(policy.allowedEmailDomains) ? policy.allowedEmailDomains : defaults.allowedEmailDomains,
    allowedUrlHosts: Array.isArray(policy.allowedUrlHosts) ? policy.allowedUrlHosts : defaults.allowedUrlHosts,
    allowedLiteralValues: Array.isArray(policy.allowedLiteralValues) ? policy.allowedLiteralValues : defaults.allowedLiteralValues,
    warnOnGoogleIds: policy.warnOnGoogleIds !== undefined ? Boolean(policy.warnOnGoogleIds) : defaults.warnOnGoogleIds,
    failOnWarnings: policy.failOnWarnings !== undefined ? Boolean(policy.failOnWarnings) : defaults.failOnWarnings,
    policyPath,
  };
}

function workflowFilesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => path.join(dir, file));
}

function resolveWorkflowDir(root, workflowDirArg) {
  if (workflowDirArg) {
    const workflowDir = path.resolve(workflowDirArg);
    if (path.basename(workflowDir) !== CANONICAL_WORKFLOW_DIR) {
      throw new Error('Only n8n-workflows is supported. Validate n8n-workflows/ or a fixture directory named n8n-workflows.');
    }
    return {
      workflowDir,
      workflowDirName: path.relative(root, workflowDir) || path.basename(workflowDir),
      explicit: true,
    };
  }

  const canonicalDir = path.join(root, CANONICAL_WORKFLOW_DIR);
  return {
    workflowDir: canonicalDir,
    workflowDirName: CANONICAL_WORKFLOW_DIR,
    explicit: false,
  };
}

const secretPatterns = [
  { label: 'sk-prefixed API key', regex: /sk-[A-Za-z0-9_-]{20,}/g },
  { label: 'Google API key', regex: /AIza[0-9A-Za-z_-]{20,}/g },
  { label: 'Pinecone-looking API key', regex: /pcsk_[A-Za-z0-9_-]{20,}/gi },
  { label: 'Bearer token', regex: /Bearer\s+[A-Za-z0-9._-]{20,}/gi },
  { label: 'JWT-looking token', regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
];

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const urlRegex = /https?:\/\/[^\s"'<>)]+/gi;
const googleIdRegex = /\b[0-9A-Za-z_-]{33,}\b/g;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const currentNodeTypeVersions = {
  '@n8n/n8n-nodes-langchain.agent': '3.1',
  '@n8n/n8n-nodes-langchain.chat': '1.3',
  '@n8n/n8n-nodes-langchain.chatTrigger': '1.4',
  '@n8n/n8n-nodes-langchain.documentDefaultDataLoader': '1.1',
  '@n8n/n8n-nodes-langchain.embeddingsOpenAi': '1.2',
  '@n8n/n8n-nodes-langchain.lmChatGoogleGemini': '1.1',
  '@n8n/n8n-nodes-langchain.memoryBufferWindow': '1.4',
  '@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter': '1',
  '@n8n/n8n-nodes-langchain.vectorStorePinecone': '1.3',
  'n8n-nodes-base.code': '2',
  'n8n-nodes-base.errorTrigger': '1',
  'n8n-nodes-base.gmail': '2.2',
  'n8n-nodes-base.googleDrive': '3',
  'n8n-nodes-base.googleDriveTrigger': '1',
  'n8n-nodes-base.googleSheets': '4.7',
  'n8n-nodes-base.httpRequest': '4.4',
  'n8n-nodes-base.if': '2.3',
  'n8n-nodes-base.set': '3.4',
  'n8n-nodes-base.stickyNote': '1',
};

function compilePlaceholderPatterns(policy) {
  return policy.allowedPlaceholders.map((pattern) => new RegExp(pattern));
}

function walk(value, visitor, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, trail.concat(index)));
    return;
  }

  if (value && typeof value === 'object') {
    visitor(value, trail);
    for (const [key, child] of Object.entries(value)) {
      walk(child, visitor, trail.concat(key));
    }
  }
}

function trailString(trail) {
  return trail.join('.');
}

function hostMatches(host, allowedHost) {
  const lowerHost = host.toLowerCase();
  const lowerAllowed = allowedHost.toLowerCase();
  return lowerHost === lowerAllowed || lowerHost.endsWith(`.${lowerAllowed}`);
}

function createPolicyHelpers(policy) {
  const placeholderPatterns = compilePlaceholderPatterns(policy);
  const allowedLiteralValues = new Set(policy.allowedLiteralValues.map((value) => String(value)));

  const isAllowedPlaceholder = (value) =>
    typeof value === 'string' && placeholderPatterns.some((pattern) => pattern.test(value));

  const isAllowedLiteral = (value) =>
    typeof value === 'string' && allowedLiteralValues.has(value);

  const allowedEmail = (email) => {
    if (isAllowedPlaceholder(email) || isAllowedLiteral(email)) return true;
    const domain = email.split('@').pop().toLowerCase();
    return policy.allowedEmailDomains.some((allowedDomain) => domain === allowedDomain.toLowerCase());
  };

  const allowedUrl = (url) => {
    if (isAllowedPlaceholder(url) || isAllowedLiteral(url)) return true;
    try {
      const parsed = new URL(url);
      return policy.allowedUrlHosts.some((allowedHost) => hostMatches(parsed.hostname, allowedHost));
    } catch {
      return false;
    }
  };

  return {
    isAllowedPlaceholder,
    isAllowedLiteral,
    allowedEmail,
    allowedUrl,
  };
}

function checkCountFieldsStayNumeric(workflow, relative) {
  const stringifiedCountPattern = /\b[A-Za-z0-9_]*_count\s*:\s*String\s*\(/;

  for (const node of workflow.nodes || []) {
    if (node.type === 'n8n-nodes-base.code') {
      const jsCode = node.parameters?.jsCode;
      if (typeof jsCode === 'string' && stringifiedCountPattern.test(jsCode)) {
        fail(`${relative} stringifies a *_count field in Code node "${node.name}". Count fields should stay numeric before Sheets writes them.`);
      }
    }

    if (node.type !== 'n8n-nodes-base.googleSheets') {
      continue;
    }

    const columns = node.parameters?.columns;
    const values = columns?.value;
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      continue;
    }

    const schema = Array.isArray(columns.schema) ? columns.schema : [];
    for (const columnId of Object.keys(values)) {
      if (!/_count$/i.test(columnId)) {
        continue;
      }

      const field = schema.find((entry) => entry && entry.id === columnId);
      if (!field) {
        fail(`${relative} maps count column "${columnId}" in Google Sheets node "${node.name}" but has no schema entry for it.`);
        continue;
      }

      if (field.type !== 'number') {
        fail(`${relative} maps count column "${columnId}" in Google Sheets node "${node.name}" as ${JSON.stringify(field.type)}; use "number".`);
      }
    }
  }
}

function checkIngestionFileNamePlainText(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - KB Ingestion to Pinecone') {
    return;
  }

  const prepareLogNode = findWorkflowNode(workflow, 'Prepare Ingestion Log');
  const prepareLogCode = String(prepareLogNode?.parameters?.jsCode || '');
  if (!prepareLogCode.includes("return String(value || '').trim() || 'unknown_file_name';")) {
    fail(`${relative} Prepare Ingestion Log must return raw file_name text before Google Sheets writes.`);
  }
  if (prepareLogCode.includes('return \'="\'') || prepareLogCode.includes('return "=\\"')) {
    fail(`${relative} Prepare Ingestion Log must not write file_name as a formula string; formulas can become clickable sheet links.`);
  }
  if (prepareLogCode.includes('return "\'" + text;')) {
    fail(`${relative} Prepare Ingestion Log must not prefix file_name with a leading apostrophe; RAW writes should receive the display value directly.`);
  }

  const appendLogNode = findWorkflowNode(workflow, 'Append KB Ingestion Log');
  if (appendLogNode?.parameters?.options?.cellFormat !== 'RAW') {
    fail(`${relative} Append KB Ingestion Log must set options.cellFormat to RAW so file_name values stay plain text.`);
  }

  const formatNode = findWorkflowNode(workflow, 'Disable File Name Hyperlinks');
  if (!formatNode) {
    fail(`${relative} must format the file_name column with Disable File Name Hyperlinks.`);
    return;
  }

  if (!hasConnection(workflow, 'Append KB Ingestion Log', 0, 'Disable File Name Hyperlinks')) {
    fail(`${relative} must run Disable File Name Hyperlinks after Append KB Ingestion Log.`);
  }
  if (formatNode.type !== 'n8n-nodes-base.httpRequest') {
    fail(`${relative} Disable File Name Hyperlinks must be an HTTP Request node.`);
  }
  if (formatNode.parameters?.authentication !== 'predefinedCredentialType' || formatNode.parameters?.nodeCredentialType !== 'googleSheetsOAuth2Api') {
    fail(`${relative} Disable File Name Hyperlinks must use the Google Sheets OAuth credential type.`);
  }

  const spreadsheetId = appendLogNode?.parameters?.documentId?.value;
  const expectedUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  if (formatNode.parameters?.url !== expectedUrl) {
    fail(`${relative} Disable File Name Hyperlinks url must match the Append KB Ingestion Log spreadsheet ID.`);
  }

  let formatBody = null;
  try {
    formatBody = JSON.parse(String(formatNode.parameters?.jsonBody || ''));
  } catch (error) {
    fail(`${relative} Disable File Name Hyperlinks jsonBody is not valid JSON: ${error.message}`);
  }

  const repeatCell = formatBody?.requests?.[0]?.repeatCell;
  const range = repeatCell?.range || {};
  const userEnteredFormat = repeatCell?.cell?.userEnteredFormat || {};
  const fields = String(repeatCell?.fields || '');
  if (range.sheetId !== 0 || range.startRowIndex !== 1 || range.startColumnIndex !== 1 || range.endColumnIndex !== 2) {
    fail(`${relative} Disable File Name Hyperlinks must target kb_ingestion file_name cells only.`);
  }
  if (userEnteredFormat.hyperlinkDisplayType !== 'PLAIN_TEXT') {
    fail(`${relative} Disable File Name Hyperlinks must set hyperlinkDisplayType to PLAIN_TEXT.`);
  }
  if (userEnteredFormat.numberFormat?.type !== 'TEXT') {
    fail(`${relative} Disable File Name Hyperlinks must set file_name numberFormat to TEXT.`);
  }
  if (!fields.includes('userEnteredFormat.hyperlinkDisplayType') || !fields.includes('userEnteredFormat.numberFormat')) {
    fail(`${relative} Disable File Name Hyperlinks must update hyperlinkDisplayType and numberFormat fields.`);
  }
}

function compareVersion(a, b) {
  const aParts = String(a).split('.').map((part) => Number.parseInt(part, 10));
  const bParts = String(b).split('.').map((part) => Number.parseInt(part, 10));
  const length = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < length; index += 1) {
    const aPart = Number.isFinite(aParts[index]) ? aParts[index] : 0;
    const bPart = Number.isFinite(bParts[index]) ? bParts[index] : 0;
    if (aPart !== bPart) return aPart - bPart;
  }

  return 0;
}

function checkCurrentNodeTypeVersions(workflow, relative) {
  for (const node of workflow.nodes || []) {
    const currentVersion = currentNodeTypeVersions[node.type];
    if (!currentVersion) {
      continue;
    }

    if (node.typeVersion === undefined || node.typeVersion === null) {
      fail(`${relative} node "${node.name}" is missing typeVersion; expected ${currentVersion} for ${node.type}.`);
      continue;
    }

    if (compareVersion(node.typeVersion, currentVersion) < 0) {
      fail(`${relative} node "${node.name}" uses ${node.type} typeVersion ${node.typeVersion}; update to ${currentVersion}.`);
    }
  }
}

function hasConnection(workflow, sourceName, outputIndex, targetName) {
  const output = workflow.connections?.[sourceName]?.main?.[outputIndex];
  return Array.isArray(output) && output.some((connection) => connection.node === targetName);
}

function findWorkflowNode(workflow, nodeName) {
  return (workflow.nodes || []).find((node) => node.name === nodeName);
}

function checkCustomerSupportAgentFallback(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - RAG Customer Support Agent') {
    return;
  }

  const agentNode = findWorkflowNode(workflow, 'SpaceKonceptRental AI Agent');
  if (!agentNode) {
    fail(`${relative} is missing SpaceKonceptRental AI Agent.`);
    return;
  }

  if (agentNode.onError !== 'continueErrorOutput') {
    fail(`${relative} must route AI/RAG failures using onError: continueErrorOutput on "SpaceKonceptRental AI Agent".`);
  }

  const requiredNodes = [
    ['Build Agent Failure Fallback', 'n8n-nodes-base.set'],
    ['Upsert Conversation Failed', 'n8n-nodes-base.googleSheets'],
    ['Send Fallback Reply', '@n8n/n8n-nodes-langchain.chat'],
  ];

  for (const [nodeName, expectedType] of requiredNodes) {
    const node = findWorkflowNode(workflow, nodeName);
    if (!node) {
      fail(`${relative} is missing fallback node "${nodeName}".`);
      continue;
    }
    if (node.type !== expectedType) {
      fail(`${relative} fallback node "${nodeName}" has type ${JSON.stringify(node.type)}; expected ${expectedType}.`);
    }
  }

  if (!hasConnection(workflow, 'SpaceKonceptRental AI Agent', 1, 'Build Agent Failure Fallback')) {
    fail(`${relative} must connect the AI Agent error output to "Build Agent Failure Fallback".`);
  }

  if (!hasConnection(workflow, 'Build Agent Failure Fallback', 0, 'Upsert Conversation Failed')) {
    fail(`${relative} must update the conversation row on the agent fallback path.`);
  }

  if (!hasConnection(workflow, 'Build Agent Failure Fallback', 0, 'Send Fallback Reply')) {
    fail(`${relative} must send a customer fallback reply on the agent fallback path.`);
  }

  const fallbackLogNode = findWorkflowNode(workflow, 'Upsert Conversation Failed');
  const fallbackValues = fallbackLogNode?.parameters?.columns?.value || {};
  if (fallbackValues.status !== 'failed') {
    fail(`${relative} fallback conversation log must write status "failed".`);
  }
  if (!String(fallbackValues.needs_escalation || '').includes('needs_escalation')) {
    fail(`${relative} fallback conversation log must preserve needs_escalation from the fallback row.`);
  }
}

function checkCustomerSupportAgentDedupeAndResponseMode(workflow, relative) {
  if (workflow.name !== 'SpaceKonceptRental - RAG Customer Support Agent') {
    return;
  }

  const triggerNode = findWorkflowNode(workflow, 'When Chat Message Received');
  if (!triggerNode) {
    fail(`${relative} is missing When Chat Message Received.`);
  } else if (triggerNode.parameters?.options?.responseMode !== 'responseNodes') {
    fail(`${relative} Chat Trigger must set options.responseMode to "responseNodes" because the workflow uses Chat response nodes.`);
  } else if (Number(triggerNode.typeVersion || 0) < 1.3) {
    fail(`${relative} Chat Trigger must use typeVersion 1.3 or newer so the responseNodes mode is supported and preserved by n8n.`);
  } else if (triggerNode.parameters?.mode === 'webhook') {
    fail(`${relative} Chat Trigger must use Hosted Chat mode when Chat response nodes are present.`);
  }

  const lookupNode = findWorkflowNode(workflow, 'Lookup Conversation State');
  if (!lookupNode) {
    fail(`${relative} is missing Lookup Conversation State.`);
    return;
  }

  if (lookupNode.type !== 'n8n-nodes-base.googleSheets') {
    fail(`${relative} Lookup Conversation State must use the Google Sheets node.`);
  }

  if ((lookupNode.parameters?.operation || 'read') !== 'read') {
    fail(`${relative} Lookup Conversation State must read the conversation log before the processing guard.`);
  }

  const filters = Array.isArray(lookupNode.parameters?.filtersUI?.values)
    ? lookupNode.parameters.filtersUI.values
    : [];
  const hasSessionFilter = filters.some((filter) =>
    filter?.lookupColumn === 'session_id' &&
    String(filter?.lookupValue || '').includes('session_id')
  );
  const hasProcessingStatusFilter = filters.some((filter) =>
    filter?.lookupColumn === 'status' &&
    String(filter?.lookupValue || '') === 'processing'
  );

  if (!hasSessionFilter || !hasProcessingStatusFilter) {
    fail(`${relative} Lookup Conversation State must filter by session_id and status=processing before the wait reply guard.`);
  }

  if (lookupNode.parameters?.combineFilters !== 'AND') {
    fail(`${relative} Lookup Conversation State must combine session_id and processing status filters with AND.`);
  }

  if (lookupNode.parameters?.options?.returnFirstMatch === true) {
    fail(`${relative} Lookup Conversation State must return all same-session processing rows so the freshest active row can be selected.`);
  }

  if (lookupNode.alwaysOutputData !== true) {
    fail(`${relative} Lookup Conversation State must keep alwaysOutputData true so new messages can continue when no row is found.`);
  }

  const selectorNode = findWorkflowNode(workflow, 'Select Active Processing Row');
  const selectorCode = String(selectorNode?.parameters?.jsCode || '');
  if (!selectorNode) {
    fail(`${relative} is missing Select Active Processing Row.`);
  } else if (
    !selectorCode.includes('maxProcessingAgeMs') ||
    !selectorCode.includes('2 * 60 * 1000') ||
    !selectorCode.includes('active_processing') ||
    !selectorCode.includes('sort((a, b) => b.startedAt - a.startedAt)')
  ) {
    fail(`${relative} Select Active Processing Row must choose the freshest processing row inside the guard window.`);
  }

  const lookupTargets = workflow.connections?.['Lookup Conversation State']?.main?.[0] || [];
  const selectorTargets = workflow.connections?.['Select Active Processing Row']?.main?.[0] || [];
  if (!lookupTargets.some((target) => target?.node === 'Select Active Processing Row')) {
    fail(`${relative} Lookup Conversation State must feed Select Active Processing Row.`);
  }
  if (!selectorTargets.some((target) => target?.node === 'Already Processing or Completed?')) {
    fail(`${relative} Select Active Processing Row must feed Already Processing or Completed?.`);
  }

  const gateNode = findWorkflowNode(workflow, 'Already Processing or Completed?');
  const gateConditions = gateNode?.parameters?.conditions || {};
  const gateConditionsText = JSON.stringify(gateConditions);
  if (!gateNode) {
    fail(`${relative} is missing Already Processing or Completed?.`);
  } else {
    const gatesOnActiveProcessing = gateConditionsText.includes('active_processing') &&
      gateConditionsText.includes('"true"') &&
      gateConditionsText.includes('"operation":"equals"');

    if (!gatesOnActiveProcessing || gateConditions?.combinator !== 'and') {
      fail(`${relative} Already Processing or Completed? must only block when Select Active Processing Row sets active_processing=true.`);
    }
  }

  const duplicateReplyNode = findWorkflowNode(workflow, 'Duplicate Safe Reply');
  const duplicateReplyMessage = String(duplicateReplyNode?.parameters?.message || '').toLowerCase();
  if (!duplicateReplyNode) {
    fail(`${relative} is missing Duplicate Safe Reply.`);
  } else if (!duplicateReplyMessage.includes('still working') || !duplicateReplyMessage.includes('previous message')) {
    fail(`${relative} Duplicate Safe Reply must ask the user to wait while the previous message is still processing.`);
  }

  const redactNode = findWorkflowNode(workflow, 'Redact PII for Logs');
  const redactCode = String(redactNode?.parameters?.jsCode || '');
  if (!redactCode.includes('dedupe_key') || !redactCode.includes('hashText')) {
    fail(`${relative} Redact PII for Logs must build a hashed dedupe_key for audit logging.`);
  }

  const conversationLogNodes = [
    'Upsert Conversation Processing',
    'Upsert Conversation Completed',
    'Upsert Conversation Failed',
  ];

  for (const nodeName of conversationLogNodes) {
    const node = findWorkflowNode(workflow, nodeName);
    const values = node?.parameters?.columns?.value || {};
    const schema = Array.isArray(node?.parameters?.columns?.schema) ? node.parameters.columns.schema : [];
    const dedupeSchema = schema.find((entry) => entry?.id === 'dedupe_key');

    for (const key of Object.keys(values)) {
      if (key.trim() === 'dedupe_key' && key !== 'dedupe_key') {
        fail(`${relative} ${nodeName} must write to "dedupe_key" without trailing spaces.`);
      }
    }
    for (const entry of schema) {
      if (
        (typeof entry?.id === 'string' && entry.id.trim() === 'dedupe_key' && entry.id !== 'dedupe_key') ||
        (typeof entry?.displayName === 'string' && entry.displayName.trim() === 'dedupe_key' && entry.displayName !== 'dedupe_key')
      ) {
        fail(`${relative} ${nodeName} schema must use "dedupe_key" without trailing spaces.`);
      }
    }

    if (!String(values.dedupe_key || '').includes('dedupe_key')) {
      fail(`${relative} ${nodeName} must write dedupe_key to the conversations sheet.`);
    }

    if (!dedupeSchema || dedupeSchema.type !== 'string') {
      fail(`${relative} ${nodeName} must include a string schema entry for dedupe_key.`);
    }
  }
}

const root = process.cwd();
const parsedArgs = parseArgs(process.argv.slice(2));
const messages = [];
let errors = 0;
let warnings = 0;

function fail(message) {
  errors += 1;
  console.error(`FAIL: ${message}`);
}

function warn(message) {
  warnings += 1;
  console.warn(`WARN: ${message}`);
}

let policy;
try {
  policy = loadPolicy(root, parsedArgs.policyArg);
} catch (error) {
  fail(error.message);
  policy = loadPolicy(root, null);
}

const helpers = createPolicyHelpers(policy);
let resolvedWorkflowDir;
try {
  resolvedWorkflowDir = resolveWorkflowDir(root, parsedArgs.workflowDirArg);
} catch (error) {
  fail(error.message);
  resolvedWorkflowDir = {
    workflowDir: path.join(root, CANONICAL_WORKFLOW_DIR),
    workflowDirName: CANONICAL_WORKFLOW_DIR,
  };
}
const { workflowDir, workflowDirName } = resolvedWorkflowDir;

if (policy.policyPath) {
  messages.push(`Using policy ${path.relative(root, policy.policyPath) || policy.policyPath}.`);
}

if (!fs.existsSync(workflowDir)) {
  fail(`Workflow directory not found: n8n-workflows. Create n8n-workflows/ or run AllLive export to bootstrap from live n8n.`);
}

const files = workflowFilesIn(workflowDir);

if (fs.existsSync(workflowDir) && files.length === 0) {
  fail(`No workflow JSON files found in ${workflowDirName}/.`);
}

for (const filePath of files) {
  const relative = path.relative(root, filePath);
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  let workflow;

  try {
    workflow = JSON.parse(text);
  } catch (error) {
    fail(`${relative} is not valid JSON: ${error.message}`);
    continue;
  }

  const required = [
    ['name', typeof workflow.name === 'string' && workflow.name.trim()],
    ['nodes array', Array.isArray(workflow.nodes)],
    ['connections object', workflow.connections && typeof workflow.connections === 'object' && !Array.isArray(workflow.connections)],
    ['settings object', workflow.settings && typeof workflow.settings === 'object' && !Array.isArray(workflow.settings)],
  ];

  for (const [label, ok] of required) {
    if (!ok) {
      fail(`${relative} is missing required ${label}.`);
    }
  }

  if (workflow.active !== false) {
    fail(`${relative} must have active: false. Workflow templates must be inactive.`);
  }

  const nodeNames = new Set((workflow.nodes || []).map((node) => node.name));
  for (const [sourceName, outputs] of Object.entries(workflow.connections || {})) {
    if (!nodeNames.has(sourceName)) {
      fail(`${relative} has connection source "${sourceName}" that does not match any node name.`);
    }

    for (const outputGroups of Object.values(outputs || {})) {
      for (const branch of outputGroups || []) {
        for (const connection of branch || []) {
          if (!nodeNames.has(connection.node)) {
            fail(`${relative} has connection target "${connection.node}" that does not match any node name.`);
          }
        }
      }
    }
  }

  walk(workflow, (node, trail) => {
    if (node.credentials && typeof node.credentials === 'object') {
      for (const [credentialName, credentialValue] of Object.entries(node.credentials)) {
        if (credentialValue && typeof credentialValue === 'object' && 'id' in credentialValue) {
          fail(`${relative} contains credentials.id at ${trailString(trail.concat(['credentials', credentialName, 'id']))}.`);
        }
      }
    }

    if (node.meta && typeof node.meta === 'object' && 'instanceId' in node.meta) {
      fail(`${relative} contains private meta.instanceId at ${trailString(trail.concat(['meta', 'instanceId']))}.`);
    }

    if (
      'webhookId' in node &&
      node.webhookId &&
      !helpers.isAllowedPlaceholder(node.webhookId) &&
      !helpers.isAllowedLiteral(node.webhookId)
    ) {
      fail(`${relative} contains real-looking webhookId at ${trailString(trail.concat(['webhookId']))}.`);
    }
  });

  for (const pattern of secretPatterns) {
    const matches = text.match(pattern.regex) || [];
    if (matches.length > 0) {
      fail(`${relative} contains possible secret: ${pattern.label}.`);
    }
  }

  const emails = text.match(emailRegex) || [];
  const unsafeEmails = [...new Set(emails.filter((email) => !helpers.allowedEmail(email)))];
  if (unsafeEmails.length > 0) {
    warn(`${relative} contains non-placeholder email(s): ${unsafeEmails.join(', ')}`);
  }

  const urls = text.match(urlRegex) || [];
  const unsafeUrls = [...new Set(urls.filter((url) => !helpers.allowedUrl(url)))];
  if (unsafeUrls.length > 0) {
    warn(`${relative} contains production-looking URL(s): ${unsafeUrls.join(', ')}`);
  }

  if (policy.warnOnGoogleIds) {
    walk(workflow, (node, trail) => {
      for (const [key, value] of Object.entries(node)) {
        if (
          typeof value !== 'string' ||
          helpers.isAllowedPlaceholder(value) ||
          helpers.isAllowedLiteral(value) ||
          uuidRegex.test(value)
        ) {
          continue;
        }

        const matches = value.match(googleIdRegex) || [];
        if (matches.length === 0) {
          continue;
        }

        const keyPath = trailString(trail.concat(key));
        const looksLikeGoogleIdField = /(?:documentId|folderToWatch|folderId|fileId|spreadsheetId|driveId|sheetId|value)$/i.test(key);
        if (looksLikeGoogleIdField) {
          warn(`${relative} contains possible Google Drive/Sheets ID at ${keyPath}. Review before committing.`);
        }
      }
    });
  }

  checkCountFieldsStayNumeric(workflow, relative);
  checkIngestionFileNamePlainText(workflow, relative);
  checkCurrentNodeTypeVersions(workflow, relative);
  checkCustomerSupportAgentFallback(workflow, relative);
  checkCustomerSupportAgentDedupeAndResponseMode(workflow, relative);

  console.log(`Checked ${relative}: ${workflow.nodes?.length ?? 0} node(s).`);
}

for (const message of messages) {
  console.log(message);
}

if (policy.failOnWarnings && warnings > 0) {
  errors += 1;
  console.error('FAIL: Policy failOnWarnings is true and warnings were found.');
}

const result = errors > 0 ? 'FAIL' : 'PASS';
const summary = `Summary: workflows checked ${files.length}, errors ${errors}, warnings ${warnings}, result ${result}.`;

if (errors > 0) {
  console.error(`\n${summary}`);
  process.exit(1);
}

console.log(`\n${summary}`);
