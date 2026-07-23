const assert = require('node:assert/strict');
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

const mutationRoutes = [
  'website/app/api/admin/admin-access/route.ts',
  'website/app/api/admin/categories/route.ts',
  'website/app/api/admin/categories/[categoryId]/route.ts',
  'website/app/api/admin/categories/[categoryId]/archive/route.ts',
  'website/app/api/admin/hero/route.ts',
  'website/app/api/admin/page-media/route.ts',
  'website/app/api/admin/product-images/route.ts',
  'website/app/api/admin/product-images/[imageId]/route.ts',
  'website/app/api/admin/product-images/[imageId]/archive/route.ts',
  'website/app/api/admin/products/route.ts',
  'website/app/api/admin/products/[productId]/route.ts',
  'website/app/api/admin/products/[productId]/publish/route.ts',
  'website/app/api/admin/products/[productId]/archive/route.ts',
  'website/app/api/admin/quote-requests/[quoteRequestId]/status/route.ts',
  'website/app/api/admin/quote-requests/[quoteRequestId]/crm-handoff/route.ts',
  'website/app/api/admin/quote-requests/crm-handoff-packet/route.ts',
  'website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/route.ts',
  'website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome/route.ts',
];

const mutationHandlers = [
  'website/app/api/admin/admin-access/route.ts',
  'website/lib/hero/admin-homepage-hero-write-route.ts',
  'website/lib/page-media/admin-public-page-media-write-route.ts',
  'website/lib/products/media/admin-product-image-upload-route.ts',
  'website/lib/products/persistence/admin-product-write-route.ts',
  'website/lib/quote/admin-write/admin-quote-request-status-route.ts',
  'website/lib/quote/admin-write/admin-quote-request-crm-handoff-route.ts',
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route.ts',
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-route.ts',
  'website/lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-route.ts',
];

const stageACompletionEnv = {
  SUPABASE_URL: 'https://synthetic-project-ref.supabase.co',
  SUPABASE_ANON_KEY: 'synthetic-anon-key-for-tests-only',
  CATALOGUE_WORKSPACE_ID: 'synthetic-catalogue-workspace',
  ADMIN_TRUSTED_WORKSPACE_ID: 'synthetic-admin-workspace',
  ADMIN_EXPECTED_ORIGIN: 'https://spacekonceptrental.com',
  ADMIN_EXPECTED_HOST: 'spacekonceptrental.com',
  ADMIN_CSRF_PROOF_SECRET: 'synthetic-csrf-proof-secret-for-tests-only',
  ADMIN_MUTATIONS_ENABLED: 'false',
};

const providerAdmissionEvidence = {
  admissionMechanism: 'new-user-signup-disabled',
  verificationStatus: 'PASS',
  verifiedAt: '2026-07-23T00:00:00.000Z',
  operatorApprovalReference: 'synthetic-reviewed-reference',
  existingOwnerReadiness: 'PASS',
  noPublicSignupResult: 'PASS',
};

const evidenceNowMs = Date.parse('2026-07-23T00:05:00.000Z');

test('all current protected admin mutation routes use the fail-closed capability gate', () => {
  assert.equal(new Set(mutationRoutes).size, 18);

  for (const relativePath of mutationRoutes) {
    assert.match(read(relativePath), /export async function POST/);
  }

  for (const relativePath of mutationHandlers) {
    assert.match(
      read(relativePath),
      /requiresMutationCapability:\s*true/,
      relativePath,
    );
  }
});

test('read-only protected admin POST helpers are not reclassified as mutations', () => {
  for (const relativePath of [
    'website/lib/quote/admin-read/admin-quote-request-crm-handoff-lifecycle-reconciliation-route.ts',
    'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight-route.ts',
    'website/lib/quote/admin-read/admin-quote-request-hubspot-sync-dry-run-contract-route.ts',
  ]) {
    assert.doesNotMatch(read(relativePath), /requiresMutationCapability:\s*true/);
  }
});

test('Stage A contract requires disabled admin mutations and verified provider admission', () => {
  const contract = readJson('docs/contracts/server-env-contract.json');
  const stageA = contract.launchReadiness.stages.stageAControlledOAuthDeployment;

  assert.equal(stageA.adminMutationsRequiredState, 'disabled');
  assert.ok(stageA.requiredEnvNames.includes('ADMIN_MUTATIONS_ENABLED'));
  assert.ok(stageA.requiredInvariants.includes('admin-mutations-disabled'));
  assert.ok(
    stageA.requiredInvariants.includes('provider-signup-admission-verified'),
  );
  assert.equal(stageA.providerAdmissionEvidence.requiredStatus, 'PASS');
  assert.equal(stageA.providerAdmissionEvidence.repositoryTestsCanSatisfy, false);
  assert.deepEqual(stageA.providerAdmissionEvidence.allowedMechanisms, [
    'new-user-signup-disabled',
    'before-user-created-admission-hook',
  ]);
  assert.deepEqual(stageA.providerAdmissionEvidence.requiredFields, [
    'admissionMechanism',
    'verificationStatus',
    'verifiedAt',
    'operatorApprovalReference',
    'existingOwnerReadiness',
    'noPublicSignupResult',
  ]);
});

test('Stage A validator rejects enabled mutations and missing provider-admission evidence', () => {
  const issues = validateStageARepositoryReadiness({
    env: { ADMIN_MUTATIONS_ENABLED: 'true' },
  });

  assert.ok(issues.includes('stage_a_admin_mutations_not_disabled'));
  assert.ok(issues.includes('stage_a_provider_admission_not_verified'));
});

test('Stage A completion requires explicit disabled mutation evidence', () => {
  for (const value of [undefined, '', 'FALSE', 'disabled', '0', ' false ']) {
    const issues = validateStageARepositoryReadiness({
      env: { ...stageACompletionEnv, ADMIN_MUTATIONS_ENABLED: value },
      nowMs: evidenceNowMs,
    });

    assert.ok(
      issues.includes('stage_a_admin_mutations_not_proven_disabled'),
      String(value),
    );
  }
});

test('Stage A completion validates every declared runtime environment name', () => {
  for (const name of Object.keys(stageACompletionEnv)) {
    const env = { ...stageACompletionEnv };
    delete env[name];
    const issues = validateStageARepositoryReadiness({
      env,
      providerAdmissionEvidence,
      nowMs: evidenceNowMs,
    });

    assert.ok(issues.includes(`stage_a_runtime_env_missing:${name}`), name);
  }
});

test('Stage A completion rejects unapproved admission mechanisms and future timestamps', () => {
  for (const evidence of [
    { ...providerAdmissionEvidence, admissionMechanism: 'none' },
    {
      ...providerAdmissionEvidence,
      admissionMechanism: 'post-callback-membership-denial',
    },
    {
      ...providerAdmissionEvidence,
      verifiedAt: '2026-07-23T00:05:00.001Z',
    },
  ]) {
    const issues = validateStageARepositoryReadiness({
      env: stageACompletionEnv,
      providerAdmissionEvidence: evidence,
      nowMs: evidenceNowMs,
    });

    assert.ok(issues.includes('stage_a_provider_admission_not_verified'));
  }
});

test('Stage A completion accepts only explicit disabled state plus provider admission PASS evidence', () => {
  const issues = validateStageARepositoryReadiness({
    env: stageACompletionEnv,
    providerAdmissionEvidence,
    nowMs: evidenceNowMs,
  });

  assert.deepEqual(issues, []);
});

test('Stage A documents keep provider admission on HOLD until independently verified', () => {
  const combined = [
    'docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md',
    'docs/manual-qa/PROTECTED-ADMIN-AUTHORISED-UAT-RUNBOOK.md',
    'docs/templates/DEPLOYMENT-EVIDENCE.md',
    'docs/PRODUCTION-SECURITY-READINESS-GATE.md',
  ]
    .map(read)
    .join('\n');

  assert.match(combined, /HOLD - NOT VERIFIED/);
  assert.match(combined, /new-user signup disabled/i);
  assert.match(combined, /before-user-created|pre-user-creation admission/i);
  assert.match(combined, /existing-owner readiness/i);
  assert.match(combined, /no-public-signup result/i);
  assert.match(combined, /repository tests cannot prove/i);
  assert.match(combined, /new-user-signup-disabled/);
  assert.match(combined, /before-user-created-admission-hook/);
  assert.match(combined, /must not be (?:later than|in the future)/i);
  assert.match(combined, /\/_next\/static\/\*\.js/);
  assert.match(combined, /never fetches? third-party script origins?/i);
});

test('admin mutation capability remains server-only', () => {
  const contract = readJson('docs/contracts/server-env-contract.json');
  const variable = contract.variables.find(
    (entry) => entry.name === 'ADMIN_MUTATIONS_ENABLED',
  );

  assert.equal(variable.visibility, 'server-only');
  assert.equal(variable.browserAllowed, false);
  assert.doesNotMatch(
    read('website/lib/admin/authorization/server-admin-mutation-capability.ts'),
    /NEXT_PUBLIC_/,
  );
});
