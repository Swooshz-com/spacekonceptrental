const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  validateStageARepositoryReadiness,
} = require('./validate-stage-a-oauth-deployment-readiness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test('deployment contract PR leaves agent governance byte-identical to its base', () => {
  const expectedBaseBlobIds = new Map([
    ['AGENTS.md', '3453e0b96d302f94dfc4089176fee35121881841'],
    [
      'website/test/phase-2b-g-agents-instructions.test.ts',
      '10501d474aa0cf66c738910e3fdafc83125c5fca',
    ],
  ]);

  for (const [relativePath, expectedBlobId] of expectedBaseBlobIds) {
    const actualBlobId = childProcess
      .execFileSync('git', ['hash-object', relativePath], {
        cwd: repoRoot,
        encoding: 'utf8',
      })
      .trim();

    assert.equal(actualBlobId, expectedBlobId);
  }
});

test('authorised production UAT is Google OAuth only', () => {
  const runbook = read(
    'docs/manual-qa/PROTECTED-ADMIN-AUTHORISED-UAT-RUNBOOK.md',
  );

  assert.match(runbook, /Production admin authentication is Google OAuth only/i);
  assert.match(runbook, /POST \/api\/admin\/login/);
  assert.match(
    runbook,
    /https:\/\/spacekonceptrental\.com\/api\/admin\/login\/callback/,
  );
  assert.match(runbook, /wrong workspace/i);
  assert.match(runbook, /inactive user/i);
  assert.match(runbook, /insufficient role/i);
  assert.match(runbook, /former session is rejected/i);
  assert.doesNotMatch(runbook, /email\s*\/\s*password|temporary password|sign in with[^\n]*password/i);
  assert.doesNotMatch(runbook, /public signup is allowed|create a fake user/i);
});

test('hosted guidance records implemented runtime separately from live gates', () => {
  const hosted = read('docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md');

  assert.match(hosted, /Supabase admin auth runtime\s+wiring/i);
  assert.match(hosted, /server auth-cookie reads and writes/i);
  assert.match(hosted, /login, callback, and\s+logout routes/i);
  assert.match(hosted, /protected admin pages/i);
  assert.match(hosted, /approved admin product, category, and\s+listing writes/i);
  assert.match(hosted, /provider configuration remain\s+separately gated/i);
});

test('Stage A excludes n8n and quote enablement while Stage B retains full handoff readiness', () => {
  const contract = readJson('docs/contracts/server-env-contract.json');
  const stageA = contract.launchReadiness.stages.stageAControlledOAuthDeployment;
  const stageB = contract.launchReadiness.stages.stageBFullEnquiryLaunch;

  assert.equal(stageA.n8nRequired, false);
  assert.equal(stageA.quoteEnablementAllowed, false);
  assert.equal(
    stageA.requiredEnvNames.some(
      (name) => name.startsWith('N8N_') || name.startsWith('QUOTE_'),
    ),
    false,
  );
  assert.equal(stageB.n8nRequired, true);
  assert.equal(stageB.quoteEnablementAllowed, true);
  assert.ok(stageB.requiredEnvNames.includes('N8N_ENQUIRY_HANDOFF_WEBHOOK_URL'));
  assert.ok(stageB.requiredEnvNames.includes('N8N_ENQUIRY_HANDOFF_SHARED_SECRET'));
  assert.ok(stageB.requiredInvariants.includes('timestamped-hmac-verification'));
  assert.ok(stageB.requiredInvariants.includes('timestamp-freshness-enforcement'));
  assert.ok(stageB.requiredInvariants.includes('durable-idempotency'));
  assert.ok(stageB.requiredInvariants.includes('delivery-evidence'));
  assert.ok(stageB.requiredInvariants.includes('quote-email-runtime-readiness'));

  const rootPackage = readJson('package.json');
  assert.equal(
    rootPackage.scripts['validate:production-security-readiness'],
    'node scripts/validate-production-security-readiness.cjs',
  );
});

test('production smoke documentation distinguishes harness calls from application reads', () => {
  const paths = [
    'docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md',
    'docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md',
    'docs/PRODUCTION-SECURITY-READINESS-GATE.md',
    'docs/templates/DEPLOYMENT-EVIDENCE.md',
  ];

  for (const relativePath of paths) {
    const content = read(relativePath);
    assert.match(content, /no direct provider\s+API call by the\s+smoke\s+harness/i);
    assert.match(content, /no mutating\s+provider call/i);
    assert.match(
      content,
      /route rendering\s+may exercise configured\s+read-only Supabase[\s\S]{0,120}application[\s\S]{0,40}paths/i,
    );
    assert.doesNotMatch(content, /\bno (?:n8n\/)?provider call(?: is made| occurs)?\b/i);
  }
});

test('evidence templates require exact revision, immutable deployment, and rollback proof', () => {
  for (const relativePath of [
    'docs/templates/DEPLOYMENT-EVIDENCE.md',
    'docs/templates/rollback-drill-result-template.md',
  ]) {
    const template = read(relativePath);
    assert.match(template, /Repository/);
    assert.match(template, /Requested (?:immutable |rollback target )?SHA/i);
    assert.match(template, /Resolved (?:checkout\/build|post-rollback) SHA/i);
    assert.match(template, /(?:equals resolved SHA|target\/resolved equality result)/i);
    assert.match(template, /deployment UUID or equivalent immutable/i);
    assert.match(template, /deployment identifier/i);
    assert.match(template, /Build context/i);
    assert.match(template, /npm ci/);
    assert.match(template, /Terminal/i);
    assert.match(template, /started at/i);
    assert.match(template, /completed at/i);
    assert.match(template, /Auto-deploy/i);
  }
});

test('rollback evidence distinguishes pre-rollback deployment from known-good target', () => {
  for (const relativePath of [
    'docs/templates/DEPLOYMENT-EVIDENCE.md',
    'docs/templates/rollback-drill-result-template.md',
  ]) {
    const template = read(relativePath);
    assert.match(template, /Pre-rollback deployed SHA/i);
    assert.match(template, /Pre-rollback deployment identifier/i);
    assert.match(template, /Requested rollback target SHA/i);
    assert.match(template, /Requested rollback target deployment identifier/i);
    assert.match(template, /Resolved post-rollback SHA/i);
    assert.match(template, /Resolved post-rollback deployment identifier/i);
    assert.match(template, /target.*resolved.*equality result/i);
    assert.doesNotMatch(template, /Previous known-good/i);
  }
});

test('rollback evidence is strict for Stage A and target-specific for Stage B', () => {
  const deployment = read('docs/templates/DEPLOYMENT-EVIDENCE.md');
  const rollback = read('docs/templates/rollback-drill-result-template.md');
  const combined = `${deployment}\n${rollback}`;

  assert.match(combined, /Rollback-target stage classification/i);
  assert.match(combined, /Stage A rollback target[\s\S]{0,500}quote submission disabled/i);
  assert.match(combined, /Stage A rollback target[\s\S]{0,500}n8n inactive/i);
  assert.match(combined, /Stage A rollback target[\s\S]{0,500}no customer quote submission/i);
  assert.match(
    combined,
    /Stage B rollback target[\s\S]{0,700}separately reviewed rollback-target contract/i,
  );
  assert.match(
    combined,
    /Stage B rollback target[\s\S]{0,700}intended target state/i,
  );
  assert.doesNotMatch(
    combined,
    /Stage B rollback target[\s\S]{0,500}(?:quote submission disabled|n8n inactive)/i,
  );
});

test('unrun real-owner OAuth UAT keeps Stage A on hold', () => {
  const paths = [
    'docs/templates/DEPLOYMENT-EVIDENCE.md',
    'docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md',
    'docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md',
  ];

  for (const relativePath of paths) {
    const content = read(relativePath);
    assert.match(content, /PASS\s*\|\s*HOLD - NOT RUN\s*\|\s*FAIL/i);
    assert.match(
      content,
      /Stage A\s+remains (?:incomplete and )?held until[\s\S]{0,100}real-owner Google\s+OAuth UAT[\s\S]{0,50}passes/i,
    );
    assert.doesNotMatch(
      content,
      /Google OAuth owner UAT:(?![^\n]*HOLD - NOT RUN)[^\n]*NOT[- ]RUN/i,
    );
  }
});

test('enquiry evidence is tied to persisted api quote processing, never chatbot smoke', () => {
  const deploymentTemplate = read('docs/templates/DEPLOYMENT-EVIDENCE.md');
  const smokeRunbook = read('docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md');
  const combined = `${deploymentTemplate}\n${smokeRunbook}`;

  assert.match(combined, /persist(?:ed|s)[^\n]*\/api\/quote/i);
  assert.match(combined, /\/api\/chat[^\n]*separate chatbot lane/i);
  assert.match(combined, /chatbot smoke[\s\S]{0,100}not\s+enquiry-delivery evidence/i);
  assert.doesNotMatch(
    deploymentTemplate,
    /Browser calls only `POST \/api\/chat`:[^\n]*confirmed-by/i,
  );
});

test('Node 24 and deterministic npm ci are aligned across repo, CI, lockfile, and hosted docs', () => {
  const rootPackage = readJson('package.json');
  const websitePackage = readJson('website/package.json');
  const lockfile = readJson('website/package-lock.json');
  const ci = read('.github/workflows/ci.yml');
  const hosted = read('docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md');

  assert.equal(rootPackage.engines.node, '>=24 <25');
  assert.equal(websitePackage.engines.node, '>=24 <25');
  assert.equal(lockfile.packages[''].engines.node, '>=24 <25');
  assert.equal(read('.nvmrc').trim(), '24');
  assert.match(ci, /node-version:\s*24\b/g);
  assert.match(ci, /run:\s*npm ci/);
  assert.match(hosted, /exact build context\/base directory is `website\/`/i);
  assert.match(hosted, /runtime is Node 24/i);
  assert.match(hosted, /deterministic install command is `npm ci`/i);
});

test('Stage A repository-safe validator passes without provider env or n8n configuration', () => {
  assert.deepEqual(validateStageARepositoryReadiness(), []);
});

test('Stage A validator rejects contract safety weakening and privileged additions', () => {
  const contract = readJson('docs/contracts/server-env-contract.json');
  const weakened = structuredClone(contract);
  const stageA =
    weakened.launchReadiness.stages.stageAControlledOAuthDeployment;
  const stageB = weakened.launchReadiness.stages.stageBFullEnquiryLaunch;

  stageA.requiredInvariants = [];
  stageA.requiredEnvNames.push('SUPABASE_SERVICE_ROLE_KEY');
  stageB.requiredEnvNames = stageB.requiredEnvNames.filter(
    (name) => !name.startsWith('ADMIN_') && name !== 'SUPABASE_URL',
  );
  stageB.requiredInvariants = stageB.requiredInvariants.filter(
    (name) => name !== 'reviewed-n8n-enquiry-workflow',
  );

  const issues = validateStageARepositoryReadiness({ contract: weakened });

  assert.ok(
    issues.includes(
      'stage_a_required_env_unexpected:SUPABASE_SERVICE_ROLE_KEY',
    ),
  );
  assert.ok(
    issues.includes(
      'stage_a_required_invariant_missing:exact-sha-deployment',
    ),
  );
  assert.ok(issues.includes('stage_b_required_env_missing:SUPABASE_URL'));
  assert.ok(
    issues.includes('stage_b_required_env_missing:ADMIN_EXPECTED_ORIGIN'),
  );
  assert.ok(
    issues.includes(
      'stage_b_required_invariant_missing:reviewed-n8n-enquiry-workflow',
    ),
  );
});

test('production smoke source has an immutable safe-method boundary and preview smoke is separate', () => {
  const productionSmoke = read('scripts/smoke-production-readonly.cjs');
  const previewSmoke = read('scripts/smoke-preview.cjs');

  assert.match(productionSmoke, /new Set\(\['GET', 'HEAD'\]\)/);
  assert.doesNotMatch(productionSmoke, /method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i);
  assert.match(productionSmoke, /SKR_PRODUCTION_BASE_URL/);
  assert.match(productionSmoke, /spacekonceptrental\.com/);
  assert.match(previewSmoke, /SKR_PREVIEW_BASE_URL/);
  assert.doesNotMatch(previewSmoke, /SKR_PRODUCTION_BASE_URL/);
});
