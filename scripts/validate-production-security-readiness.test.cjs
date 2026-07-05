const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(
  repoRoot,
  'scripts',
  'validate-production-security-readiness.cjs',
);

function baseLaunchEnv(overrides = {}) {
  return {
    SKR_PRODUCTION_READINESS_MODE: 'launch',
    SUPABASE_URL: 'https://supabase-placeholder.example',
    SUPABASE_ANON_KEY: 'anon-public-placeholder-key-for-tests-only',
    CATALOGUE_WORKSPACE_ID: 'catalogue-workspace-placeholder',
    QUOTE_WORKSPACE_ID: 'quote-workspace-placeholder',
    ADMIN_TRUSTED_WORKSPACE_ID: 'admin-workspace-placeholder',
    ADMIN_EXPECTED_ORIGIN: 'https://owner.spacekoncept.example',
    ADMIN_EXPECTED_HOST: 'owner.spacekoncept.example',
    ADMIN_CSRF_PROOF_SECRET:
      'csrf-proof-placeholder-for-tests-only-1234567890',
    QUOTE_ENQUIRY_EMAIL_PROVIDER: 'resend',
    QUOTE_ENQUIRY_EMAIL_RECIPIENT: 'events@example.invalid',
    QUOTE_ENQUIRY_EMAIL_FROM: 'quotes@example.invalid',
    RESEND_API_KEY: 'resend-api-key-placeholder-for-tests-only',
    ...overrides,
  };
}

function runReadiness(env = {}, args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
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

function combinedOutput(result) {
  return `${result.stdout}${result.stderr}`;
}

test('local/dev mode reports missing production envs but exits successfully', () => {
  const result = runReadiness({});
  const output = combinedOutput(result);

  assert.equal(result.status, 0, output);
  assert.match(output, /local\/dev mode/i);
  assert.match(output, /SUPABASE_URL/);
  assert.match(output, /QUOTE_WORKSPACE_ID/);
  assert.match(output, /ADMIN_CSRF_PROOF_SECRET/);
  assert.match(output, /warning/i);
});

test('launch mode fails when required envs are missing', () => {
  const result = runReadiness({
    SKR_PRODUCTION_READINESS_MODE: 'launch',
  });
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /launch mode/i);
  assert.match(output, /SUPABASE_URL/);
  assert.match(output, /SUPABASE_ANON_KEY/);
  assert.match(output, /QUOTE_WORKSPACE_ID/);
  assert.match(output, /ADMIN_EXPECTED_ORIGIN/);
  assert.match(output, /RESEND_API_KEY/);
});

test('launch mode passes with safe placeholder env values', () => {
  const result = runReadiness(baseLaunchEnv());
  const output = combinedOutput(result);

  assert.equal(result.status, 0, output);
  assert.match(output, /launch mode/i);
  assert.match(output, /configured/i);
  assert.match(output, /No n8n\/Pinecone\/HubSpot runtime env is required/i);
});

test('invalid HTTP admin origin fails in launch mode', () => {
  const result = runReadiness(
    baseLaunchEnv({
      ADMIN_EXPECTED_ORIGIN: 'http://owner.spacekoncept.example',
    }),
  );
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /ADMIN_EXPECTED_ORIGIN/);
  assert.match(output, /https/i);
  assert.doesNotMatch(output, /http:\/\/owner\.spacekoncept\.example/);
});

test('too-short CSRF proof secret fails in launch mode', () => {
  const result = runReadiness(
    baseLaunchEnv({
      ADMIN_CSRF_PROOF_SECRET: 'short-secret',
    }),
  );
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /ADMIN_CSRF_PROOF_SECRET/);
  assert.match(output, /length/i);
  assert.doesNotMatch(output, /short-secret/);
});

test('unsupported quote email provider fails without echoing the value', () => {
  const result = runReadiness(
    baseLaunchEnv({
      QUOTE_ENQUIRY_EMAIL_PROVIDER: 'smtp-secret-provider',
    }),
  );
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /QUOTE_ENQUIRY_EMAIL_PROVIDER/);
  assert.match(output, /unsupported/i);
  assert.doesNotMatch(output, /smtp-secret-provider/);
});

test('missing Resend API key fails when provider is resend', () => {
  const result = runReadiness(
    baseLaunchEnv({
      RESEND_API_KEY: '',
    }),
  );
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /RESEND_API_KEY/);
  assert.match(output, /missing/i);
});

test('removed public demo content env fails in launch mode without echoing the value', () => {
  const result = runReadiness(
    baseLaunchEnv({
      NEXT_PUBLIC_SKR_DEMO_CONTENT: 'true',
    }),
  );
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /NEXT_PUBLIC_SKR_DEMO_CONTENT/);
  assert.match(output, /removed|forbidden/i);
  assert.doesNotMatch(output, /true/);
});

test('output does not include env values or secret-like values', () => {
  const secretSentinel = 'secret-sentinel-value-must-not-print-12345';
  const originSentinel = 'https://sentinel-origin.example';
  const result = runReadiness(
    baseLaunchEnv({
      ADMIN_EXPECTED_ORIGIN: originSentinel,
      ADMIN_EXPECTED_HOST: 'sentinel-origin.example',
      ADMIN_CSRF_PROOF_SECRET: secretSentinel,
      RESEND_API_KEY: 'resend-secret-sentinel-value-must-not-print',
      SUPABASE_URL: 'https://sentinel-supabase.example',
    }),
  );
  const output = combinedOutput(result);

  assert.equal(result.status, 0, output);
  assert.doesNotMatch(output, /secret-sentinel-value-must-not-print/);
  assert.doesNotMatch(output, /resend-secret-sentinel-value-must-not-print/);
  assert.doesNotMatch(output, /https:\/\/sentinel-origin\.example/);
  assert.doesNotMatch(output, /https:\/\/sentinel-supabase\.example/);
});

test('static scan detects server-only env names in client/public files but allows docs tests and contracts', () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-production-readiness-'),
  );
  const badFile = path.join(tempRoot, 'website/components/client-env.tsx');
  const allowedDoc = path.join(tempRoot, 'docs/contracts/server-env-contract.json');

  fs.mkdirSync(path.dirname(badFile), { recursive: true });
  fs.mkdirSync(path.dirname(allowedDoc), { recursive: true });
  fs.writeFileSync(
    badFile,
    '"use client";\nconsole.log("RESEND_API_KEY");\n',
  );
  fs.writeFileSync(
    allowedDoc,
    '{"variables":["RESEND_API_KEY","ADMIN_CSRF_PROOF_SECRET"]}\n',
  );

  const result = runReadiness(baseLaunchEnv(), [
    '--scan-root',
    tempRoot,
    '--tracked-file-list',
    badFile,
    allowedDoc,
  ]);
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /client\/public runtime file/i);
  assert.match(output, /RESEND_API_KEY/);
  assert.match(output, /website\/components\/client-env\.tsx/);
  assert.doesNotMatch(output, /docs\/contracts\/server-env-contract\.json.*RESEND_API_KEY/);
});

test('static scan rejects removed public demo content env references in runtime source', () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-production-readiness-'),
  );
  const badFile = path.join(tempRoot, 'website/components/public-demo.tsx');
  const allowedDoc = path.join(tempRoot, 'docs/PRODUCTION-SECURITY-READINESS-GATE.md');

  fs.mkdirSync(path.dirname(badFile), { recursive: true });
  fs.mkdirSync(path.dirname(allowedDoc), { recursive: true });
  fs.writeFileSync(
    badFile,
    'export const removed = "NEXT_PUBLIC_SKR_DEMO_CONTENT";\n',
  );
  fs.writeFileSync(
    allowedDoc,
    'Do not configure `NEXT_PUBLIC_SKR_DEMO_CONTENT`; the demo runtime is removed.\n',
  );

  const result = runReadiness(baseLaunchEnv(), [
    '--scan-root',
    tempRoot,
    '--tracked-file-list',
    badFile,
    allowedDoc,
  ]);
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /NEXT_PUBLIC_SKR_DEMO_CONTENT/);
  assert.match(output, /removed|forbidden/i);
  assert.match(output, /website\/components\/public-demo\.tsx/);
  assert.doesNotMatch(output, /docs\/PRODUCTION-SECURITY-READINESS-GATE\.md.*NEXT_PUBLIC_SKR_DEMO_CONTENT/);
});

test('readiness command remains separate from normal local release validation', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  );
  const localReleaseValidator = fs.readFileSync(
    path.join(repoRoot, 'scripts', 'validate-local-release-candidate.cjs'),
    'utf8',
  );

  assert.equal(
    packageJson.scripts['validate:production-security-readiness'],
    'node scripts/validate-production-security-readiness.cjs',
  );
  assert.doesNotMatch(
    localReleaseValidator,
    /validate-production-security-readiness/,
  );
});
