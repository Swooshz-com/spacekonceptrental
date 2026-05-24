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
const validatorPath = path.join(repoRoot, 'scripts', 'validate-n8n-workflows.cjs');

function makeTempRoot() {
  const baseDir = path.join(repoRoot, '.tmp');
  fs.mkdirSync(baseDir, { recursive: true });
  return fs.mkdtempSync(path.join(baseDir, 'n8n-validation-test-'));
}

function readCustomerSupportWorkflow() {
  return JSON.parse(fs.readFileSync(workflowPath, 'utf8').replace(/^\uFEFF/, ''));
}

function setDebounceWaitParameters(workflow, parameters) {
  const node = workflow.nodes.find((candidate) => candidate.name === 'Debounce Chat Batch');
  assert.ok(node, 'fixture must include Debounce Chat Batch');
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
