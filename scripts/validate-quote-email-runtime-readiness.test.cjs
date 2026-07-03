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

test('quote email runtime readiness passes with safe configured env', () => {
  const result = runReadiness({
    QUOTE_ENQUIRY_EMAIL_PROVIDER: 'resend',
    QUOTE_ENQUIRY_EMAIL_RECIPIENT: 'events@spacekoncept.example',
    QUOTE_ENQUIRY_EMAIL_FROM: 'quotes@spacekoncept.example',
    RESEND_API_KEY: 'test-secret-value',
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /configured/i);
  assert.doesNotMatch(result.stdout + result.stderr, /test-secret-value/);
});

test('quote email runtime readiness reports missing names and never values', () => {
  const result = runReadiness({
    QUOTE_ENQUIRY_EMAIL_PROVIDER: 'resend',
    QUOTE_ENQUIRY_EMAIL_RECIPIENT: '',
    QUOTE_ENQUIRY_EMAIL_FROM: '',
    RESEND_API_KEY: '',
  });
  const output = result.stdout + result.stderr;

  assert.notEqual(result.status, 0);
  assert.match(output, /QUOTE_ENQUIRY_EMAIL_RECIPIENT/);
  assert.match(output, /QUOTE_ENQUIRY_EMAIL_FROM/);
  assert.match(output, /RESEND_API_KEY/);
  assert.match(output, /missing recipient/i);
  assert.match(output, /missing from address/i);
  assert.match(output, /missing provider api key/i);
});

test('quote email runtime readiness reports unsupported provider without echoing it', () => {
  const result = runReadiness({
    QUOTE_ENQUIRY_EMAIL_PROVIDER: 'smtp-secret-provider',
    QUOTE_ENQUIRY_EMAIL_RECIPIENT: 'events@spacekoncept.example',
    QUOTE_ENQUIRY_EMAIL_FROM: 'quotes@spacekoncept.example',
    RESEND_API_KEY: 'test-secret-value',
  });
  const output = result.stdout + result.stderr;

  assert.notEqual(result.status, 0);
  assert.match(output, /QUOTE_ENQUIRY_EMAIL_PROVIDER/);
  assert.match(output, /unsupported provider/i);
  assert.doesNotMatch(output, /smtp-secret-provider/);
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
