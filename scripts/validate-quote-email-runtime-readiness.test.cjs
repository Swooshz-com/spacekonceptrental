const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'validate-quote-email-runtime-readiness.cjs');

function runReadiness(env = {}) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      WINDIR: process.env.WINDIR,
      ...env,
    },
  });
}

test('quote enquiry n8n handoff runtime readiness passes with safe configured env', () => {
  const result = runReadiness({
    N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: 'https://example.invalid/n8n/enquiry',
    N8N_ENQUIRY_HANDOFF_SHARED_SECRET: 'test-secret-value',
    N8N_ENQUIRY_HANDOFF_TIMEOUT_MS: '5000',
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /configured/i);
  assert.doesNotMatch(result.stdout + result.stderr, /test-secret-value/);
  assert.doesNotMatch(result.stdout + result.stderr, /https:\/\/example\.invalid/);
});

test('quote enquiry n8n handoff runtime readiness reports missing names and never values', () => {
  const result = runReadiness({
    N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: '',
    N8N_ENQUIRY_HANDOFF_SHARED_SECRET: '',
    N8N_ENQUIRY_HANDOFF_TIMEOUT_MS: '',
  });
  const output = result.stdout + result.stderr;

  assert.notEqual(result.status, 0);
  assert.match(output, /N8N_ENQUIRY_HANDOFF_WEBHOOK_URL/);
  assert.match(output, /N8N_ENQUIRY_HANDOFF_SHARED_SECRET/);
  assert.match(output, /missing server-side n8n webhook URL/i);
  assert.match(output, /missing server-side shared secret/i);
});

test('quote enquiry n8n handoff runtime readiness reports invalid URL without echoing it', () => {
  const result = runReadiness({
    N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: 'ftp://example.invalid/secret-webhook',
    N8N_ENQUIRY_HANDOFF_SHARED_SECRET: 'test-secret-value',
  });
  const output = result.stdout + result.stderr;

  assert.notEqual(result.status, 0);
  assert.match(output, /N8N_ENQUIRY_HANDOFF_WEBHOOK_URL/);
  assert.match(output, /invalid server-side n8n webhook URL/i);
  assert.doesNotMatch(output, /secret-webhook/);
  assert.doesNotMatch(output, /test-secret-value/);
});

test('quote enquiry n8n handoff runtime readiness reports invalid timeout safely', () => {
  const result = runReadiness({
    N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: 'https://example.invalid/n8n/enquiry',
    N8N_ENQUIRY_HANDOFF_SHARED_SECRET: 'test-secret-value',
    N8N_ENQUIRY_HANDOFF_TIMEOUT_MS: '60000',
  });
  const output = result.stdout + result.stderr;

  assert.notEqual(result.status, 0);
  assert.match(output, /N8N_ENQUIRY_HANDOFF_TIMEOUT_MS/);
  assert.match(output, /timeout/i);
  assert.doesNotMatch(output, /test-secret-value/);
});

test('quote email readiness command is separate from normal local release validation', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const localReleaseValidator = fs.readFileSync(
    path.join(repoRoot, 'scripts', 'validate-local-release-candidate.cjs'),
    'utf8',
  );

  assert.equal(
    packageJson.scripts['validate:quote-email-runtime-readiness'],
    'node scripts/validate-quote-email-runtime-readiness.cjs',
  );
  assert.doesNotMatch(localReleaseValidator, /validate-quote-email-runtime-readiness/);
});
