const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  anonymousPublicSecurityDefinerAllowlist,
  authenticatedPublicSecurityDefinerAllowlist,
  finalPublicSecurityDefinerSignatures,
} = require('./security-definer-privilege-contract.cjs');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(
  repoRoot,
  'scripts',
  'validate-production-security-readiness.cjs',
);
const catalogQueryPath = path.join(
  repoRoot,
  'scripts',
  'production-security-definer-catalog.sql',
);

function reviewedPublicSecurityDefinerCatalog() {
  const anonAllowlist = new Set(anonymousPublicSecurityDefinerAllowlist);
  const authenticatedAllowlist = new Set(
    authenticatedPublicSecurityDefinerAllowlist,
  );
  const applicationRows = finalPublicSecurityDefinerSignatures.map(
    (signature) => ({
      signature,
      owner: 'postgres',
      return_type: 'text',
      language: 'sql',
      security_definer: true,
      search_path: 'search_path=',
      event_trigger_name: null,
      event: null,
      enabled: null,
      tags: [],
      public_execute: false,
      anon_execute: anonAllowlist.has(signature),
      authenticated_execute: authenticatedAllowlist.has(signature),
      service_role_execute: false,
      postgres_execute: true,
    }),
  );

  return [
    ...applicationRows,
    {
      signature: 'public.rls_auto_enable()',
      owner: 'postgres',
      return_type: 'event_trigger',
      language: 'plpgsql',
      security_definer: true,
      search_path: 'search_path=pg_catalog',
      event_trigger_name: 'ensure_rls',
      event: 'ddl_command_end',
      enabled: 'O',
      tags: ['CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO'],
      public_execute: false,
      anon_execute: false,
      authenticated_execute: false,
      service_role_execute: false,
      postgres_execute: true,
    },
  ];
}

function writeCatalogFixture(catalog) {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-security-definer-catalog-'),
  );
  const filePath = path.join(tempRoot, 'catalog.json');
  fs.writeFileSync(filePath, `${JSON.stringify(catalog)}\n`, 'utf8');
  return filePath;
}

const reviewedCatalogPath = writeCatalogFixture(
  reviewedPublicSecurityDefinerCatalog(),
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
    QUOTE_SUBMISSION_ADMISSION_SECRET:
      'quote-admission-placeholder-for-tests-only-1234567890',
    N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: 'https://example.invalid/n8n/enquiry',
    N8N_ENQUIRY_HANDOFF_SHARED_SECRET:
      'n8n-handoff-secret-placeholder-for-tests-only',
    ...overrides,
  };
}

function runReadiness(env = {}, args = [], options = {}) {
  const effectiveArgs = [...args];
  const launchRequested =
    env.SKR_PRODUCTION_READINESS_MODE === 'launch' ||
    effectiveArgs.includes('--launch') ||
    effectiveArgs.some(
      (arg, index) => arg === '--mode' && effectiveArgs[index + 1] === 'launch',
    );
  const hasCatalogArg = effectiveArgs.includes(
    '--public-security-definer-catalog',
  );

  if (
    !hasCatalogArg &&
    (options.supplyCatalog ?? launchRequested)
  ) {
    effectiveArgs.push(
      '--public-security-definer-catalog',
      reviewedCatalogPath,
    );
  }

  return spawnSync(process.execPath, [scriptPath, ...effectiveArgs], {
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
  assert.match(output, /QUOTE_SUBMISSION_ADMISSION_SECRET/);
  assert.match(output, /N8N_ENQUIRY_HANDOFF_WEBHOOK_URL/);
  assert.match(output, /N8N_ENQUIRY_HANDOFF_SHARED_SECRET/);
});

test('launch mode passes with safe placeholder env values', () => {
  const result = runReadiness(baseLaunchEnv());
  const output = combinedOutput(result);

  assert.equal(result.status, 0, output);
  assert.match(output, /launch mode/i);
  assert.match(output, /configured/i);
  assert.match(output, /n8n enquiry handoff env is server-only/i);
  assert.match(output, /6 anon and 10 authenticated/i);
});

test('launch mode requires a read-only live public SECURITY DEFINER catalog', () => {
  const result = runReadiness(baseLaunchEnv(), [], { supplyCatalog: false });
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /PUBLIC_SECURITY_DEFINER_CATALOG/);
  assert.match(output, /not supplied/i);
});

test('live catalog fails for any unreviewed API-executable SECURITY DEFINER function', () => {
  const catalog = reviewedPublicSecurityDefinerCatalog();
  catalog.push({
    ...catalog[0],
    signature: 'public.unreviewed_platform_helper()',
    anon_execute: true,
  });
  const catalogPath = writeCatalogFixture(catalog);
  const result = runReadiness(baseLaunchEnv(), [
    '--public-security-definer-catalog',
    catalogPath,
  ]);
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /public\.unreviewed_platform_helper\(\)/);
  assert.match(output, /anon EXECUTE is not reviewed/i);
});

test('live catalog permits an unreviewed function only when it is deny-only', () => {
  const catalog = reviewedPublicSecurityDefinerCatalog();
  catalog.push({
    ...catalog[0],
    signature: 'public.unreviewed_deny_only_helper()',
    anon_execute: false,
    authenticated_execute: false,
  });
  const catalogPath = writeCatalogFixture(catalog);
  const result = runReadiness(baseLaunchEnv(), [
    '--public-security-definer-catalog',
    catalogPath,
  ]);
  const output = combinedOutput(result);

  assert.equal(result.status, 0, output);
  assert.match(output, /unreviewed live function is deny-only/i);
});

test('live catalog enforces the exact deny-only platform helper contract', () => {
  const catalog = reviewedPublicSecurityDefinerCatalog();
  const helper = catalog.find(
    (row) => row.signature === 'public.rls_auto_enable()',
  );
  helper.service_role_execute = true;
  const catalogPath = writeCatalogFixture(catalog);
  const result = runReadiness(baseLaunchEnv(), [
    '--public-security-definer-catalog',
    catalogPath,
  ]);
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /public\.rls_auto_enable\(\)/);
  assert.match(output, /service_role EXECUTE is not reviewed/i);
});

test('read-only catalog query enumerates the complete live public SECURITY DEFINER catalog', () => {
  const sql = fs.readFileSync(catalogQueryPath, 'utf8');

  assert.match(sql, /from pg_catalog\.pg_proc proc/i);
  assert.match(sql, /pg_catalog\.oidvectortypes\(proc\.proargtypes\)/i);
  assert.match(sql, /where namespace\.nspname = 'public'\s+and proc\.prosecdef/i);
  assert.match(sql, /pg_catalog\.has_function_privilege\('anon'/i);
  assert.match(sql, /pg_catalog\.has_function_privilege\('authenticated'/i);
  assert.match(sql, /pg_catalog\.has_function_privilege\('service_role'/i);
  assert.doesNotMatch(sql, /rls_auto_enable|finalize_public_quote_handoff/i);
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
test('too-short quote admission secret fails in launch mode', () => {
  const result = runReadiness(
    baseLaunchEnv({
      QUOTE_SUBMISSION_ADMISSION_SECRET: 'short-secret',
    }),
  );
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /QUOTE_SUBMISSION_ADMISSION_SECRET/);
  assert.match(output, /length/i);
  assert.doesNotMatch(output, /short-secret/);
});


test('invalid n8n enquiry handoff URL fails without echoing the value', () => {
  const result = runReadiness(
    baseLaunchEnv({
      N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: 'ftp://example.invalid/secret-webhook',
    }),
  );
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /N8N_ENQUIRY_HANDOFF_WEBHOOK_URL/);
  assert.match(output, /HTTPS URL/i);
  assert.doesNotMatch(output, /secret-webhook/);
});

test('too-short n8n shared secret fails in launch mode', () => {
  const result = runReadiness(
    baseLaunchEnv({
      N8N_ENQUIRY_HANDOFF_SHARED_SECRET: 'short-secret',
    }),
  );
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /N8N_ENQUIRY_HANDOFF_SHARED_SECRET/);
  assert.match(output, /length|entropy/i);
  assert.doesNotMatch(output, /short-secret/);
});

test('invalid n8n handoff timeout fails in launch mode', () => {
  const result = runReadiness(
    baseLaunchEnv({
      N8N_ENQUIRY_HANDOFF_TIMEOUT_MS: '60000',
    }),
  );
  const output = combinedOutput(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /N8N_ENQUIRY_HANDOFF_TIMEOUT_MS/);
  assert.match(output, /positive number/i);
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
      N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: 'https://sentinel-n8n.example/hook',
      N8N_ENQUIRY_HANDOFF_SHARED_SECRET:
        'n8n-secret-sentinel-value-must-not-print',
      SUPABASE_URL: 'https://sentinel-supabase.example',
    }),
  );
  const output = combinedOutput(result);

  assert.equal(result.status, 0, output);
  assert.doesNotMatch(output, /secret-sentinel-value-must-not-print/);
  assert.doesNotMatch(output, /n8n-secret-sentinel-value-must-not-print/);
  assert.doesNotMatch(output, /https:\/\/sentinel-origin\.example/);
  assert.doesNotMatch(output, /https:\/\/sentinel-n8n\.example/);
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
    '"use client";\nconsole.log("N8N_ENQUIRY_HANDOFF_SHARED_SECRET");\n',
  );
  fs.writeFileSync(
    allowedDoc,
    '{"variables":["N8N_ENQUIRY_HANDOFF_SHARED_SECRET","ADMIN_CSRF_PROOF_SECRET"]}\n',
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
  assert.match(output, /N8N_ENQUIRY_HANDOFF_SHARED_SECRET/);
  assert.match(output, /website\/components\/client-env\.tsx/);
  assert.doesNotMatch(output, /docs\/contracts\/server-env-contract\.json.*N8N_ENQUIRY_HANDOFF_SHARED_SECRET/);
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
