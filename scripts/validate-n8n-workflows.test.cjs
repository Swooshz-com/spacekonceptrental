const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const workflowPath = path.join(
  repoRoot,
  'n8n-workflows',
  'spacekonceptrental-customer-support-agent.workflow.json',
);
const errorHandlerWorkflowPath = path.join(
  repoRoot,
  'n8n-workflows',
  'spacekonceptrental-error-handler.workflow.json',
);
const ragIngestionWorkflowPath = path.join(
  repoRoot,
  'n8n-workflows',
  'spacekonceptrental-rag-ingestion.workflow.json',
);
const validatorPath = path.join(repoRoot, 'scripts', 'validate-n8n-workflows.cjs');
const exportHelperPath = path.join(repoRoot, 'scripts', 'export-n8n-workflows-live.ps1');

function makeTempRoot() {
  const baseDir = os.tmpdir();
  fs.mkdirSync(baseDir, { recursive: true });
  return fs.mkdtempSync(path.join(baseDir, 'spacekonceptrental-n8n-validation-test-'));
}

function readCustomerSupportWorkflow() {
  return JSON.parse(fs.readFileSync(workflowPath, 'utf8').replace(/^\uFEFF/, ''));
}

function readErrorHandlerWorkflow() {
  return JSON.parse(fs.readFileSync(errorHandlerWorkflowPath, 'utf8').replace(/^\uFEFF/, ''));
}

function readRagIngestionWorkflow() {
  return JSON.parse(fs.readFileSync(ragIngestionWorkflowPath, 'utf8').replace(/^\uFEFF/, ''));
}

function findNode(workflow, nodeName) {
  const node = workflow.nodes.find((candidate) => candidate.name === nodeName);
  assert.ok(node, `fixture must include ${nodeName}`);
  return node;
}

function runParseStrictJsonResponse(workflow, original, agentOutput) {
  const node = findNode(workflow, 'Parse Strict JSON Response');
  const code = String(node.parameters.jsCode || '');
  const selectNode = (nodeName) => {
    assert.equal(nodeName, 'Restore Processing Context');
    return {
      first() {
        return { json: original };
      },
    };
  };

  return new Function('items', '$', code)([
    { json: { output: JSON.stringify(agentOutput) } },
  ], selectNode)[0].json;
}

function removeNode(workflow, nodeName) {
  workflow.nodes = workflow.nodes.filter((candidate) => candidate.name !== nodeName);
  delete workflow.connections[nodeName];

  for (const connection of Object.values(workflow.connections)) {
    for (const outputs of Object.values(connection)) {
      if (!Array.isArray(outputs)) continue;
      for (const output of outputs) {
        if (!Array.isArray(output)) continue;
        for (let index = output.length - 1; index >= 0; index -= 1) {
          if (output[index]?.node === nodeName) {
            output.splice(index, 1);
          }
        }
      }
    }
  }
}

function setDebounceWaitParameters(workflow, parameters) {
  const node = findNode(workflow, 'Debounce Chat Batch');
  node.parameters = parameters;
  return workflow;
}

function writeWorkflow(dir, fileName, workflow) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), `${JSON.stringify(workflow, null, 2)}\n`);
}

function runValidator(args, options = {}) {
  return spawnSync(process.execPath, [validatorPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

function gitLsFiles(args) {
  const result = spawnSync('git', ['ls-files', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

function findPowerShell() {
  for (const command of process.platform === 'win32' ? ['powershell', 'pwsh'] : ['pwsh', 'powershell']) {
    const result = spawnSync(command, ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'], { encoding: 'utf8' });
    if (result.status === 0) return command;
  }
  return null;
}

function psSingleQuoted(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function writeRunDirectoryHarness(root) {
  const safeDir = path.join(root, '.tmp', 'n8n-live-exports');
  const safeForwardDir = `${root.replace(/\\/g, '/')}/.tmp/n8n-live-exports-forward`;
  const tmpRoot = path.join(root, '.tmp');
  const repoOutsideTmp = path.join(root, 'n8n-workflows');
  const outsideRoot = path.join(root, '..', `${path.basename(root)}-outside`);
  const outsideTmp = path.join(outsideRoot, 'n8n-live-exports');
  const traversalOutsideTmp = path.join(root, '.tmp', 'n8n-live-exports', '..', '..', 'outside-tmp');
  const filesystemRoot = path.parse(root).root;

  fs.mkdirSync(safeDir, { recursive: true });
  fs.writeFileSync(path.join(safeDir, 'old.txt'), 'old staging payload', 'utf8');
  fs.mkdirSync(tmpRoot, { recursive: true });
  fs.mkdirSync(repoOutsideTmp, { recursive: true });
  fs.mkdirSync(outsideTmp, { recursive: true });

  const harnessPath = path.join(root, 'run-directory-harness.ps1');
  fs.writeFileSync(harnessPath, `
$ErrorActionPreference = "Stop"
$RepoRoot = ${psSingleQuoted(root)}
$sourceFile = ${psSingleQuoted(exportHelperPath)}
$tokens = $null
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($sourceFile, [ref]$tokens, [ref]$errors)
if ($errors.Count -gt 0) {
  throw "Could not parse source helper: $($errors[0].Message)"
}
$functionNames = @(
  "Get-PathStringComparison",
  "Get-NormalizedFullPath",
  "Test-PathIsStrictChild",
  "Test-PathItemIsUnsafeLink",
  "Assert-RunDirectoryPathHasNoUnsafeLinks",
  "Initialize-RunDirectory"
)
$functions = $ast.FindAll({
  param($node)
  $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $functionNames -contains $node.Name
}, $true)
foreach ($function in $functions) {
  Invoke-Expression $function.Extent.Text
}
if (-not (Get-Command Initialize-RunDirectory -ErrorAction SilentlyContinue)) {
  throw "Initialize-RunDirectory not loaded"
}

function Assert-Rejected($Label, $RunDirectory) {
  try {
    Initialize-RunDirectory $RunDirectory
    throw "accepted unsafe path: $Label"
  } catch {
    if ($_.Exception.Message -like "accepted unsafe path:*") {
      throw
    }
    Write-Output "REJECTED=$Label"
  }
}

Initialize-RunDirectory ${psSingleQuoted(safeDir)}
if (-not (Test-Path -LiteralPath ${psSingleQuoted(safeDir)} -PathType Container)) {
  throw "safe child was not recreated"
}
if (Test-Path -LiteralPath ${psSingleQuoted(path.join(safeDir, 'old.txt'))}) {
  throw "safe child was not cleared"
}
Write-Output "ACCEPTED=safe child"

Initialize-RunDirectory ${psSingleQuoted(safeForwardDir)}
if (-not (Test-Path -LiteralPath ${psSingleQuoted(safeForwardDir)} -PathType Container)) {
  throw "forward-separator safe child was not created"
}
Write-Output "ACCEPTED=forward separator child"

Assert-Rejected ".tmp itself" ${psSingleQuoted(tmpRoot)}
Assert-Rejected "repo root" ${psSingleQuoted(root)}
Assert-Rejected "filesystem root" ${psSingleQuoted(filesystemRoot)}
Assert-Rejected "repo child outside .tmp" ${psSingleQuoted(repoOutsideTmp)}
Assert-Rejected "outside repo" ${psSingleQuoted(outsideTmp)}
Assert-Rejected "traversal outside .tmp" ${psSingleQuoted(traversalOutsideTmp)}
`, 'utf8');

  return { harnessPath, cleanupPaths: [outsideRoot] };
}

function tryCreateDirectoryLink(targetPath, linkPath) {
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  try {
    fs.symlinkSync(targetPath, linkPath, linkType);
    return null;
  } catch (error) {
    return `${error.code || error.name}: ${error.message}`;
  }
}

function writeRunDirectoryLinkHarness(root) {
  const tmpRoot = path.join(root, '.tmp');
  const outsideRoot = path.join(root, 'outside-targets');
  const directTarget = path.join(outsideRoot, 'direct-target');
  const nestedTarget = path.join(outsideRoot, 'nested-target');
  const nestedTargetChild = path.join(nestedTarget, 'n8n-live-exports');
  const directLink = path.join(tmpRoot, 'n8n-live-exports');
  const nestedLink = path.join(tmpRoot, 'link');
  const nestedLinkedRunDirectory = path.join(nestedLink, 'n8n-live-exports');
  const directSentinel = path.join(directTarget, 'outside-target.txt');
  const nestedSentinel = path.join(nestedTargetChild, 'outside-target.txt');

  fs.mkdirSync(tmpRoot, { recursive: true });
  fs.mkdirSync(directTarget, { recursive: true });
  fs.mkdirSync(nestedTargetChild, { recursive: true });
  fs.writeFileSync(directSentinel, 'direct outside target must remain', 'utf8');
  fs.writeFileSync(nestedSentinel, 'nested outside target must remain', 'utf8');

  const directLinkError = tryCreateDirectoryLink(directTarget, directLink);
  if (directLinkError) return { skipped: `could not create direct directory link: ${directLinkError}` };

  const nestedLinkError = tryCreateDirectoryLink(nestedTarget, nestedLink);
  if (nestedLinkError) return { skipped: `could not create nested directory link: ${nestedLinkError}` };

  const harnessPath = path.join(root, 'run-directory-link-harness.ps1');
  fs.writeFileSync(harnessPath, `
$ErrorActionPreference = "Stop"
$RepoRoot = ${psSingleQuoted(root)}
$sourceFile = ${psSingleQuoted(exportHelperPath)}
$tokens = $null
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($sourceFile, [ref]$tokens, [ref]$errors)
if ($errors.Count -gt 0) {
  throw "Could not parse source helper: $($errors[0].Message)"
}
$functionNames = @(
  "Get-PathStringComparison",
  "Get-NormalizedFullPath",
  "Test-PathIsStrictChild",
  "Test-PathItemIsUnsafeLink",
  "Assert-RunDirectoryPathHasNoUnsafeLinks",
  "Initialize-RunDirectory"
)
$functions = $ast.FindAll({
  param($node)
  $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $functionNames -contains $node.Name
}, $true)
foreach ($function in $functions) {
  Invoke-Expression $function.Extent.Text
}

function Assert-Rejected($Label, $RunDirectory) {
  try {
    Initialize-RunDirectory $RunDirectory
    throw "accepted unsafe path: $Label"
  } catch {
    if ($_.Exception.Message -like "accepted unsafe path:*") {
      throw
    }
    Write-Output "REJECTED=$Label"
  }
}

Assert-Rejected "run directory link" ${psSingleQuoted(directLink)}
Assert-Rejected "nested link component" ${psSingleQuoted(nestedLinkedRunDirectory)}

if (-not (Test-Path -LiteralPath ${psSingleQuoted(directSentinel)} -PathType Leaf)) {
  throw "direct outside target was removed"
}
if (-not (Test-Path -LiteralPath ${psSingleQuoted(nestedSentinel)} -PathType Leaf)) {
  throw "nested outside target was removed"
}
Write-Output "PRESERVED=direct outside target"
Write-Output "PRESERVED=nested outside target"
`, 'utf8');

  return { harnessPath };
}

test('export helper keeps toolkit run-directory hardening', () => {
  const text = readText(exportHelperPath);
  const initStart = text.indexOf('function Initialize-RunDirectory');
  const initEnd = text.indexOf('\nfunction Resolve-WorkflowDirPath', initStart);
  assert.notEqual(initStart, -1);
  assert.notEqual(initEnd, -1);
  const initializeBlock = text.slice(initStart, initEnd);

  assert.match(text, /\[string\]\$ExportDir = "\.tmp\/n8n-live-exports"/);
  assert.match(text, /function Get-PathStringComparison/);
  assert.match(text, /function Get-NormalizedFullPath\(\$Path\)/);
  assert.match(text, /function Test-PathIsStrictChild\(\$Path, \$ParentPath\)/);
  assert.match(text, /function Test-PathItemIsUnsafeLink\(\$Item\)/);
  assert.match(text, /function Assert-RunDirectoryPathHasNoUnsafeLinks\(\$Path, \$TmpRoot\)/);
  assert.match(text, /DirectorySeparatorChar/);
  assert.match(text, /ReparsePoint/);
  assert.match(initializeBlock, /Test-PathIsStrictChild \$resolvedPath \$tmpRoot/);
  assert.match(initializeBlock, /Assert-RunDirectoryPathHasNoUnsafeLinks \$resolvedPath \$tmpRoot/);
  assert.doesNotMatch(initializeBlock, /\$tmpPrefix\s*=\s*\$tmpRoot\s*\+\s*'\\'/);
  assert.doesNotMatch(initializeBlock, /TrimEnd\('\\'\)/);
});

test('export helper run-directory guard accepts only strict .tmp children', { skip: !findPowerShell() }, () => {
  const shell = findPowerShell();
  const tempRoot = makeTempRoot();
  const cleanupPaths = [];
  try {
    const harness = writeRunDirectoryHarness(tempRoot);
    cleanupPaths.push(...harness.cleanupPaths);
    const result = spawnSync(shell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', harness.harnessPath], {
      cwd: tempRoot,
      encoding: 'utf8',
    });
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 0, output);
    assert.match(output, /ACCEPTED=safe child/);
    assert.match(output, /ACCEPTED=forward separator child/);
    assert.match(output, /REJECTED=\.tmp itself/);
    assert.match(output, /REJECTED=repo root/);
    assert.match(output, /REJECTED=filesystem root/);
    assert.match(output, /REJECTED=repo child outside \.tmp/);
    assert.match(output, /REJECTED=outside repo/);
    assert.match(output, /REJECTED=traversal outside \.tmp/);
  } finally {
    for (const cleanupPath of cleanupPaths) {
      fs.rmSync(cleanupPath, { recursive: true, force: true });
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('export helper run-directory guard rejects link escapes under .tmp', { skip: !findPowerShell() }, (t) => {
  const shell = findPowerShell();
  const tempRoot = makeTempRoot();
  try {
    const harness = writeRunDirectoryLinkHarness(tempRoot);
    if (harness.skipped) {
      t.skip(harness.skipped);
      return;
    }

    const result = spawnSync(shell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', harness.harnessPath], {
      cwd: tempRoot,
      encoding: 'utf8',
    });
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 0, output);
    assert.match(output, /REJECTED=run directory link/);
    assert.match(output, /REJECTED=nested link component/);
    assert.match(output, /PRESERVED=direct outside target/);
    assert.match(output, /PRESERVED=nested outside target/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation loads repo-specific rules and rejects missing debounce wait parameters', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = setDebounceWaitParameters(readCustomerSupportWorkflow(), {});
    writeWorkflow(workflowDir, 'spacekonceptrental-customer-support-agent.workflow.json', workflow);

    const result = runValidator([workflowDir], {
      env: {
        N8N_WORKFLOW_VALIDATION_RULES_AUTOLOAD: '',
      },
    });

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Debounce Chat Batch must wait at least 5 seconds before reading same-session rows/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('prepared-import validation keeps repo-specific rules enabled for prepared workflow payloads', () => {
  const tempRoot = makeTempRoot();
  try {
    const preparedDir = path.join(tempRoot, 'prepared-import');
    const workflow = setDebounceWaitParameters(readCustomerSupportWorkflow(), {
      resume: 'timeInterval',
      amount: 5,
      unit: 'seconds',
    });
    writeWorkflow(preparedDir, 'spacekonceptrental-customer-support-agent.live-import.json', workflow);

    const result = runValidator(['--mode', 'prepared-import', preparedDir], {
      env: {
        N8N_WORKFLOW_VALIDATION_RULES_AUTOLOAD: '',
      },
    });

    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Using prepared-import validation mode\./);
    assert.match(result.stdout, /Using validation rule/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects public chat workflows with AI memory connections', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readCustomerSupportWorkflow();
    if (!workflow.nodes.some((node) => node.name === 'Simple Conversation Memory')) {
      workflow.nodes.push({
        parameters: {},
        id: 'test-simple-conversation-memory',
        name: 'Simple Conversation Memory',
        type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
        typeVersion: 1.4,
        position: [-352, 1680],
      });
    }
    workflow.connections['Simple Conversation Memory'] = {
      ai_memory: [[{ node: 'SpaceKonceptRental AI Agent', type: 'ai_memory', index: 0 }]],
    };
    writeWorkflow(workflowDir, 'spacekonceptrental-customer-support-agent.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /public Chat Trigger workflows must not connect AI Agent nodes to AI memory/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('tracked frontend config and docs do not commit real chat webhook URLs', () => {
  const trackedFiles = gitLsFiles(['--', 'README.md', 'testing-plan.md', 'docs', 'website']);
  const realChatWebhookUrls = [];

  for (const file of trackedFiles) {
    if (!/\.(?:html|js|md)$/i.test(file)) continue;
    const absolutePath = path.join(repoRoot, file);
    if (!fs.existsSync(absolutePath)) continue;
    const text = readText(absolutePath);
    const urls = text.match(/https?:\/\/[^\s"'`<>)]+/g) || [];
    for (const url of urls) {
      const isChatWebhook = /\/webhook(?:-test)?\//i.test(url);
      const isPlaceholder = url === 'https://your-n8n-host.example/webhook/YOUR_CHAT_TRIGGER_ID/chat';
      if (isChatWebhook && !isPlaceholder) {
        realChatWebhookUrls.push(`${file}: ${url}`);
      }
    }
  }

  assert.deepEqual(realChatWebhookUrls, []);
});

test('normal validation rejects raw customer Gmail HTML interpolation', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readCustomerSupportWorkflow();
    findNode(workflow, 'Send Escalation Alert').parameters.message =
      '=<p>{{ $json.conversation_ref }}</p><p>{{ $json.user_message_redacted }}</p><p>{{ $json.reply }}</p>';
    writeWorkflow(workflowDir, 'spacekonceptrental-customer-support-agent.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Send Escalation Alert must use escaped notification fields for Gmail HTML/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects raw customer Gmail subject interpolation', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readCustomerSupportWorkflow();
    findNode(workflow, 'Send Lead Notification').parameters.subject =
      '=[SKR Lead] {{ $json.name }} - {{ $json.items_needed || $json.lead_id }}';
    writeWorkflow(workflowDir, 'spacekonceptrental-customer-support-agent.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Send Lead Notification subject must use bounded subject-safe fields/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects unbounded transcripts and incomplete ticket suppression', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readCustomerSupportWorkflow();
    findNode(workflow, 'Build Notification Context').parameters.jsCode =
      "return [{ json: { conversation_transcript_html: '<p>' + $json.user_message_redacted + '</p>' } }];";
    findNode(workflow, 'Needs Escalation?').parameters.conditions.conditions[0].leftValue =
      "={{ String($json.needs_escalation === true && $json.ticket_required !== true) }}";
    writeWorkflow(workflowDir, 'spacekonceptrental-customer-support-agent.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Build Notification Context must bound transcript rows and characters/,
    );
    assert.match(
      result.stderr + result.stdout,
      /Needs Escalation\? must allow incomplete escalated support tickets to reach human notifications/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects unanswered routing without deterministic unanswered flag', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readCustomerSupportWorkflow();
    findNode(workflow, 'Unanswered or Low Confidence?').parameters.conditions.conditions =
      findNode(workflow, 'Unanswered or Low Confidence?').parameters.conditions.conditions.filter((condition) =>
        !String(condition.leftValue || '').includes('unanswered_required')
      );
    writeWorkflow(workflowDir, 'spacekonceptrental-customer-support-agent.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Unanswered or Low Confidence\? must check unanswered_required/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects parser without deterministic unanswered derivation', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readCustomerSupportWorkflow();
    findNode(workflow, 'Parse Strict JSON Response').parameters.jsCode =
      findNode(workflow, 'Parse Strict JSON Response').parameters.jsCode
        .replace(/deriveUnansweredReason/g, 'removedDerivation')
        .replace(/unanswered_required/g, 'removedRequiredFlag')
        .replace(/unanswered_reason/g, 'removedReasonField')
        .replace(/unansweredReason/g, 'removedReason');
    writeWorkflow(workflowDir, 'spacekonceptrental-customer-support-agent.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Parse Strict JSON Response must derive unanswered_required and unanswered_reason/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('parse response forces unanswered routing for unsupported off-catalog FAQ confidence 1', () => {
  const workflow = readCustomerSupportWorkflow();
  const parsed = runParseStrictJsonResponse(workflow, {
    session_id: 'smoke-session',
    message_id: 'smoke-message',
    message: 'Do you rent transparent levitating chairs with built-in holograms for orbital events?',
    user_message_redacted: 'Do you rent transparent levitating chairs with built-in holograms for orbital events?',
    channel: 'chat',
    timestamp: '2026-05-26 12:00:00 SGT',
  }, {
    reply: 'I do not have that detail in the current SpaceKonceptRental information, so I cannot confirm that item is available.',
    intent: 'faq',
    confidence: 1,
    needs_escalation: false,
    needs_human_followup: false,
    lead_captured: false,
    ticket_required: false,
    booking_requested: false,
    missing_fields: [],
    lead: {},
    ticket: {},
    booking: {},
    retrieval_summary: {
      used_kb: false,
      source_titles: [],
      source_file_ids: [],
    },
  });
  const unansweredConditions = JSON.stringify(findNode(workflow, 'Unanswered or Low Confidence?').parameters.conditions || {});

  assert.equal(parsed.intent, 'faq');
  assert.equal(parsed.confidence, 1);
  assert.equal(parsed.unanswered_required, true);
  assert.equal(parsed.unanswered_reason, 'unsupported_inventory');
  assert.match(unansweredConditions, /unanswered_required/);
});

test('normal validation rejects raw Sheets writes for customer follow-up records', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readCustomerSupportWorkflow();
    findNode(workflow, 'Upsert Ticket').parameters.columns.value.summary = '={{ $json.summary }}';
    findNode(workflow, 'Upsert Ticket').parameters.columns.value.details = '={{ $json.details }}';
    writeWorkflow(workflowDir, 'spacekonceptrental-customer-support-agent.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Upsert Ticket must write formula-hardened sheet fields/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects unsafe error-handler alert and log fields', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readErrorHandlerWorkflow();
    findNode(workflow, 'Send Failure Alert').parameters.message =
      '=<p>{{ $json.contact_id }}</p><p>{{ $json.error_message }}</p><p>{{ $json.execution_url }}</p>';
    findNode(workflow, 'Append Failure Log').parameters.columns.value.error_message =
      '={{ $json.error_message }}';
    writeWorkflow(workflowDir, 'spacekonceptrental-error-handler.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Send Failure Alert must use escaped notification fields for Gmail HTML/,
    );
    assert.match(
      result.stderr + result.stdout,
      /Append Failure Log must write formula-hardened sheet fields/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects raw error-handler Gmail subject interpolation', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readErrorHandlerWorkflow();
    findNode(workflow, 'Send Failure Alert').parameters.subject =
      '=[SKR Error] {{ $json.workflow_name || "Workflow" }} - {{ $json.error_type || "workflow_failed" }}';
    writeWorkflow(workflowDir, 'spacekonceptrental-error-handler.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Send Failure Alert subject must use bounded subject-safe fields/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects unsafe Pinecone delete filters that combine file ID and filename fallback', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    findNode(workflow, 'Prepare Pinecone Delete Request').parameters.jsCode =
      "return [{ json: { pinecone_delete_body: { namespace: 'SpaceKonceptRental_kb', filter: { $or: [{ source_file_id: { $eq: $json.source_file_id } }, { source_file_name: { $eq: $json.source_file_name } }] } } } }];";
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Prepare Pinecone Delete Request must prefer source_file_id and must not combine source_file_name fallback with source_file_id using \$or/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects missing explicit Pinecone KB namespace', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    findNode(workflow, 'Prepare Chunk Metadata').parameters.assignments.assignments.find((entry) => entry.name === 'namespace').value = '';
    findNode(workflow, 'Insert Chunks into Pinecone').parameters.options.pineconeNamespace = '';
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /RAG ingestion Pinecone operations must explicitly use namespace SpaceKonceptRental_kb/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects modifiedTime-based RAG ingestion keys', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    findNode(workflow, 'Prepare Chunk Metadata').parameters.assignments.assignments.find((entry) => entry.name === 'ingestion_key').value =
      "={{ [($json.source_file_id || $json.fileId), ($json.modifiedTime || 'unknown_modified_time'), 'SpaceKonceptRental_kb'].join('::') }}";
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Prepare Chunk Metadata ingestion_key must not use Google Drive modifiedTime/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects missing downloaded content hash before RAG metadata', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    removeNode(workflow, 'Compute Content Hash');
    workflow.connections['Download KB File'] = {
      main: [[{ node: 'Prepare Chunk Metadata', type: 'main', index: 0 }]],
    };
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Compute Content Hash must hash downloaded binary content before metadata preparation|RAG ingestion must compute content_sha256 between Download KB File and Prepare Chunk Metadata/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects crypto module usage in RAG content hash code', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    findNode(workflow, 'Compute Content Hash').parameters.jsCode =
      "const { createHash } = require('crypto');\nreturn $input.all().map((item) => ({ json: { ...item.json, content_sha256: createHash('sha256').update('x').digest('hex') }, binary: item.binary }));";
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Compute Content Hash must not use the crypto module/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects modified_time fallback in RAG dedupe selector', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    findNode(workflow, 'Select Changed KB File').parameters.jsCode += '\nconst rowModifiedTime = row.modified_time;\nconst sourceModifiedTime = source.modified_time;';
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Select Changed KB File must not use modified_time for dedupe/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects missing RAG current-state dedupe lookup', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    removeNode(workflow, 'Lookup KB Current State');
    removeNode(workflow, 'Select Changed KB File');
    workflow.connections['Prepare Chunk Metadata'] = {
      main: [[{ node: 'Resolve Pinecone Index Host', type: 'main', index: 0 }]],
    };
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /RAG ingestion must lookup kb_current_state by file_id and namespace before Pinecone cleanup/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects historical kb_ingestion dedupe lookup', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    const lookup = findNode(workflow, 'Lookup KB Current State');
    lookup.name = 'Lookup KB Ingestion Log';
    lookup.parameters.sheetName = {
      __rl: true,
      value: 'gid=0',
      mode: 'list',
      cachedResultName: 'kb_ingestion',
    };
    lookup.parameters.filtersUI.values.push({
      lookupColumn: 'ingestion_key',
      lookupValue: '={{ $json.ingestion_key }}',
    });
    workflow.connections['Prepare Chunk Metadata'] = {
      main: [[{ node: 'Lookup KB Ingestion Log', type: 'main', index: 0 }]],
    };
    workflow.connections['Lookup KB Ingestion Log'] = {
      main: [[{ node: 'Select Changed KB File', type: 'main', index: 0 }]],
    };
    delete workflow.connections['Lookup KB Current State'];
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /RAG ingestion must not dedupe from append-only kb_ingestion history/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects current-state lookup without file_id and namespace', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    findNode(workflow, 'Lookup KB Current State').parameters.filtersUI.values = [
      { lookupColumn: 'file_id', lookupValue: '={{ $json.source_file_id }}' },
    ];
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /RAG ingestion must lookup kb_current_state by file_id and namespace before Pinecone cleanup/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects selector that skips from historical ingestion rows', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    findNode(workflow, 'Select Changed KB File').parameters.jsCode +=
      "\nconst unsafeHistoricalSkip = lookupRows.some((row) => row.ingestion_key === source.ingestion_key);";
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Select Changed KB File must not skip from historical kb_ingestion matches/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects missing current-state update after RAG insert', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    removeNode(workflow, 'Upsert KB Current State');
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Upsert KB Current State must appendOrUpdate kb_current_state by file_id and namespace/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects current-state upsert that drops dedupe fields or RAW writes', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    const currentState = findNode(workflow, 'Upsert KB Current State');
    const values = currentState.parameters.columns.value;

    currentState.parameters.columns.matchingColumns = ['file_id', 'namespace'];
    values.current_content_sha256 = '={{ $json.current_content_sha256 }}';
    values.current_ingestion_key = '={{ $json.current_ingestion_key }}';
    values.last_successful_execution_id = '={{ $json.last_successful_execution_id }}';
    values.last_indexed_at = '={{ $json.last_indexed_at }}';
    currentState.parameters.options = {};

    const chunksCountField = currentState.parameters.columns.schema.find((entry) => entry.id === 'chunks_count');
    chunksCountField.type = 'number';

    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Upsert KB Current State must persist current_content_sha256 from content_sha256/,
    );
    assert.match(
      result.stderr + result.stdout,
      /Upsert KB Current State must persist current_ingestion_key from ingestion_key/,
    );
    assert.match(
      result.stderr + result.stdout,
      /Upsert KB Current State must persist last_successful_execution_id from execution_id/,
    );
    assert.match(
      result.stderr + result.stdout,
      /Upsert KB Current State must persist last_indexed_at from ingested_at/,
    );
    assert.match(
      result.stderr + result.stdout,
      /Upsert KB Current State must set options.cellFormat to RAW/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects current-state upsert that depends on append output', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    const currentState = findNode(workflow, 'Upsert KB Current State');
    const values = currentState.parameters.columns.value;

    currentState.parameters.columns.matchingColumns = ['file_id', 'namespace'];
    values.file_id = '={{ $json.file_id }}';
    values.file_name = '={{ $json.file_name }}';
    values.namespace = '={{ $json.namespace }}';
    values.current_content_sha256 = '={{ $json.content_sha256 }}';
    values.current_ingestion_key = '={{ $json.ingestion_key }}';
    values.last_successful_execution_id = '={{ $json.execution_id }}';
    values.last_indexed_at = '={{ $json.ingested_at }}';
    values.status = '={{ $json.status }}';
    values.chunks_count = '={{ $json.chunks_count }}';
    values.modified_time = '={{ $json.modified_time }}';
    values.file_url = '={{ $json.file_url }}';
    currentState.parameters.options = { cellFormat: 'RAW' };

    const chunksCountField = currentState.parameters.columns.schema.find((entry) => entry.id === 'chunks_count');
    chunksCountField.type = 'number';

    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Upsert KB Current State must persist current_ingestion_key from ingestion_key via Prepare Ingestion Log/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects incomplete RAG audit fields and string chunk counts', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    const appendLog = findNode(workflow, 'Append KB Ingestion Log');
    delete appendLog.parameters.columns.value.content_sha256;
    delete appendLog.parameters.columns.value.modified_time;
    delete appendLog.parameters.columns.value.ingestion_key;
    appendLog.parameters.columns.schema.find((entry) => entry.id === 'chunks_count').type = 'string';
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /maps count column "chunks_count".*use "number"/,
    );
    assert.match(
      result.stderr + result.stdout,
      /Append KB Ingestion Log must persist content_sha256/,
    );
    assert.match(
      result.stderr + result.stdout,
      /Append KB Ingestion Log must persist modified_time and ingestion_key/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('normal validation rejects Pinecone delete nodes that bypass retry with neverError', () => {
  const tempRoot = makeTempRoot();
  try {
    const workflowDir = path.join(tempRoot, 'n8n-workflows');
    const workflow = readRagIngestionWorkflow();
    findNode(workflow, 'Delete Existing Pinecone File Chunks').parameters.options.response.response.neverError = true;
    writeWorkflow(workflowDir, 'spacekonceptrental-rag-ingestion.workflow.json', workflow);

    const result = runValidator([workflowDir]);

    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(
      result.stderr + result.stdout,
      /Delete Existing Pinecone File Chunks must not set neverError true because it bypasses retryOnFail for 429 and 5xx responses/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
