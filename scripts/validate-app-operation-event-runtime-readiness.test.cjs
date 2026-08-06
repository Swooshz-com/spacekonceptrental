const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(
  repoRoot,
  'scripts',
  'validate-app-operation-event-runtime-readiness.cjs',
);
const secretValue = 'app-operation-event-test-secret-0123456789abcdef';
const shortSecret = 'short';
const enabledEnv = {
  APP_OPERATION_EVENTS_ENABLED: 'true',
  APP_OPERATION_EVENT_ADMISSION_SECRET: secretValue,
  SUPABASE_URL: 'https://project-ref.supabase.co',
  SUPABASE_ANON_KEY: 'anon-token-for-tests',
  QUOTE_WORKSPACE_ID: '10000000-0000-4000-8000-000000000001',
  ADMIN_TRUSTED_WORKSPACE_ID: '30000000-0000-4000-8000-000000000001',
};

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

test('app operation event readiness passes when emission is disabled and secret absent', () => {
  const result = runReadiness({});

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /pass/i);
});

test('app operation event readiness passes with a fixed warning code when disabled and secret present', () => {
  const result = runReadiness({
    APP_OPERATION_EVENT_ADMISSION_SECRET: secretValue,
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(
    result.stderr + result.stdout,
    /APP_OPERATION_EVENT_ADMISSION_SECRET_PRESENT_WHILE_DISABLED/,
  );
});

test('app operation event readiness fails when enabled and the secret is absent', () => {
  const result = runReadiness({
    ...enabledEnv,
    APP_OPERATION_EVENT_ADMISSION_SECRET: '',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /APP_OPERATION_EVENT_ADMISSION_SECRET/);
  assert.match(result.stderr, /missing server admission secret/i);
});

test('app operation event readiness fails when the secret is shorter than 32 UTF-8 bytes', () => {
  const result = runReadiness({
    ...enabledEnv,
    APP_OPERATION_EVENT_ADMISSION_SECRET: shortSecret,
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /at least 32 UTF-8 bytes/i);
});

test('app operation event readiness fails when required Supabase configuration is absent', () => {
  const result = runReadiness({
    ...enabledEnv,
    SUPABASE_URL: '',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SUPABASE_URL/);
});

test('app operation event readiness fails when required workspace configuration is absent', () => {
  const result = runReadiness({
    ...enabledEnv,
    ADMIN_TRUSTED_WORKSPACE_ID: '',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ADMIN_TRUSTED_WORKSPACE_ID/);
});

test('app operation event readiness passes with the complete presence contract', () => {
  const result = runReadiness(enabledEnv);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /pass/i);
});

test('app operation event readiness never echoes supplied values', () => {
  for (const env of [
    enabledEnv,
    { ...enabledEnv, APP_OPERATION_EVENT_ADMISSION_SECRET: shortSecret },
    { APP_OPERATION_EVENT_ADMISSION_SECRET: secretValue },
  ]) {
    const result = runReadiness(env);
    const output = result.stdout + result.stderr;

    assert.doesNotMatch(output, /app-operation-event-test-secret/);
    assert.doesNotMatch(output, /project-ref/);
    assert.doesNotMatch(output, /anon-token-for-tests/);
    assert.doesNotMatch(output, /10000000-0000-4000-8000/);
  }
});

test('app operation event readiness command is explicitly wired and separate', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  );
  const ci = fs.readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'ci.yml'),
    'utf8',
  );

  assert.equal(
    packageJson.scripts['validate:app-operation-event-runtime-readiness'],
    'node scripts/validate-app-operation-event-runtime-readiness.cjs',
  );
  assert.equal(
    packageJson.scripts['test:app-operation-event-runtime-readiness'],
    'node --test scripts/validate-app-operation-event-runtime-readiness.test.cjs',
  );
  assert.match(ci, /npm run validate:app-operation-event-runtime-readiness/);
  assert.match(ci, /npm run test:app-operation-event-runtime-readiness/);
  assert.doesNotMatch(
    packageJson.scripts['validate:app-operation-event-runtime-readiness'],
    /quote-email|release-candidate|local-freeze/,
  );
});
