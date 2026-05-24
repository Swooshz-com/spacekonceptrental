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
const validatorPath = path.join(repoRoot, 'scripts', 'validate-n8n-workflows.cjs');

function makeTempRoot() {
  const baseDir = path.join(repoRoot, '.tmp');
  fs.mkdirSync(baseDir, { recursive: true });
  return fs.mkdtempSync(path.join(baseDir, 'n8n-validation-test-'));
}

function readCustomerSupportWorkflow() {
  return JSON.parse(fs.readFileSync(workflowPath, 'utf8').replace(/^\uFEFF/, ''));
}

function readErrorHandlerWorkflow() {
  return JSON.parse(fs.readFileSync(errorHandlerWorkflowPath, 'utf8').replace(/^\uFEFF/, ''));
}

function findNode(workflow, nodeName) {
  const node = workflow.nodes.find((candidate) => candidate.name === nodeName);
  assert.ok(node, `fixture must include ${nodeName}`);
  return node;
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
