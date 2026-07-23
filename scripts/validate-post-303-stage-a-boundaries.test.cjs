const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  deriveSupabaseProjectIdentity,
  validateStageARepositoryReadiness: validateStageARepositoryReadinessImpl,
} = require('./validate-stage-a-oauth-deployment-readiness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const nonMutatingAdminPostRoutes = new Set([
  'website/app/api/admin/csrf-proof/route.ts',
  'website/app/api/admin/login/route.ts',
  'website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight/route.ts',
  'website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-sync-dry-run-contract/route.ts',
  'website/app/api/admin/quote-requests/crm-handoff-packet/lifecycle-reconciliation/route.ts',
]);
const testRevision = 'a'.repeat(40);

function validateStageARepositoryReadiness(options = {}) {
  return validateStageARepositoryReadinessImpl({
    ...options,
    expectedRevision: Object.hasOwn(options, 'expectedRevision')
      ? options.expectedRevision
      : testRevision,
  });
}

function syntheticLegacySupabaseJwt(role) {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ iss: 'supabase', role }),
    's'.repeat(43),
  ].join('.');
}

function listRouteFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listRouteFiles(absolutePath);
    }

    return entry.name === 'route.ts'
      ? [path.relative(repoRoot, absolutePath).replace(/\\/g, '/')]
      : [];
  });
}

function resolveImport(fromPath, importPath) {
  const withoutAlias = importPath.startsWith('@/')
    ? path.join(repoRoot, 'website', importPath.slice(2))
    : path.resolve(path.dirname(path.join(repoRoot, fromPath)), importPath);

  for (const candidate of [withoutAlias, `${withoutAlias}.ts`, path.join(withoutAlias, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.relative(repoRoot, candidate).replace(/\\/g, '/');
    }
  }

  return null;
}

function reachesMutationCapability(relativePath, visited = new Set()) {
  if (visited.has(relativePath)) {
    return false;
  }

  visited.add(relativePath);
  const source = read(relativePath);

  if (/requiresMutationCapability:\s*true/.test(source)) {
    return true;
  }

  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    const imported = resolveImport(relativePath, match[1]);

    if (imported && reachesMutationCapability(imported, visited)) {
      return true;
    }
  }

  return false;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectInvokedMutationCapabilityFiles(
  relativePath,
  visited = new Set(),
) {
  if (visited.has(relativePath)) {
    return new Set();
  }

  visited.add(relativePath);
  const source = read(relativePath);
  const matches = new Set();

  if (/requiresMutationCapability:\s*true/.test(source)) {
    matches.add(relativePath);
  }

  for (const match of source.matchAll(
    /import\s*{([^}]+)}\s*from\s*["']([^"']+)["']/g,
  )) {
    const imported = resolveImport(relativePath, match[2]);

    if (!imported || !reachesMutationCapability(imported)) {
      continue;
    }

    const invokedImport = match[1]
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry && !entry.startsWith('type '))
      .map((entry) => entry.split(/\s+as\s+/).at(-1))
      .some((localName) =>
        new RegExp(`\\b${escapeRegex(localName)}\\s*\\(`).test(source),
      );

    if (!invokedImport) {
      continue;
    }

    for (const capabilityFile of collectInvokedMutationCapabilityFiles(
      imported,
      visited,
    )) {
      matches.add(capabilityFile);
    }
  }

  return matches;
}

const stageACompletionEnv = {
  SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  SUPABASE_ANON_KEY: `sb_publishable_${'a1B2c3D4'.repeat(3)}`,
  CATALOGUE_WORKSPACE_ID: '11111111-1111-4111-8111-111111111111',
  ADMIN_TRUSTED_WORKSPACE_ID: '22222222-2222-4222-8222-222222222222',
  ADMIN_EXPECTED_ORIGIN: 'https://spacekonceptrental.com',
  ADMIN_EXPECTED_HOST: 'spacekonceptrental.com',
  ADMIN_CSRF_PROOF_SECRET: 'Synthetic-Csrf-Proof-9zY8xW7vU6tS5rQ4',
  ADMIN_MUTATIONS_ENABLED: 'false',
};

const providerAdmissionEvidence = {
  admissionMechanism: 'new-user-signup-disabled',
  verificationStatus: 'PASS',
  verifiedAt: '2026-07-23T00:00:00.000Z',
  operatorApprovalReference:
    'https://github.com/Swooshz-com/spacekonceptrental/issues/301#issuecomment-1234567890',
  requestedImmutableSha: testRevision,
  existingOwnerReadiness: 'PASS',
  noPublicSignupResult: 'PASS',
  supabaseProjectIdentityFingerprint: deriveSupabaseProjectIdentity(
    stageACompletionEnv.SUPABASE_URL,
  ),
};

const evidenceNowMs = Date.parse('2026-07-23T00:05:00.000Z');

test('all current protected admin mutation routes use the fail-closed capability gate', () => {
  const postRoutes = listRouteFiles(
    path.join(repoRoot, 'website', 'app', 'api', 'admin'),
  ).filter((relativePath) => /export async function POST/.test(read(relativePath)));
  const mutationRoutes = postRoutes.filter(
    (relativePath) => !nonMutatingAdminPostRoutes.has(relativePath),
  );

  assert.equal(postRoutes.length, 23);
  assert.equal(mutationRoutes.length, 18);
  assert.deepEqual(
    postRoutes.filter((relativePath) => !mutationRoutes.includes(relativePath)).sort(),
    [...nonMutatingAdminPostRoutes].sort(),
  );

  for (const relativePath of mutationRoutes) {
    assert.equal(reachesMutationCapability(relativePath), true, relativePath);
  }
});

test('all protected mutation paths gate capability before provider-backed binding', () => {
  const postRoutes = listRouteFiles(
    path.join(repoRoot, 'website', 'app', 'api', 'admin'),
  ).filter((relativePath) => /export async function POST/.test(read(relativePath)));
  const mutationRoutes = postRoutes.filter(
    (relativePath) => !nonMutatingAdminPostRoutes.has(relativePath),
  );
  const capabilityFiles = new Set();

  for (const relativePath of mutationRoutes) {
    const invokedCapabilityFiles = collectInvokedMutationCapabilityFiles(
      relativePath,
    );

    assert.ok(
      invokedCapabilityFiles.size > 0,
      `${relativePath}: route must invoke a guarded mutation handler`,
    );

    for (const capabilityFile of invokedCapabilityFiles) {
      capabilityFiles.add(capabilityFile);
    }
  }

  assert.equal(mutationRoutes.length, 18);
  assert.equal(capabilityFiles.size, 10);

  for (const relativePath of capabilityFiles) {
    const source = read(relativePath);
    const earlyCapabilityIndex = source.indexOf(
      'const mutationCapability = resolveServerAdminMutationCapability(',
    );
    const providerBindingIndexes = [
      source.indexOf('binding = await resolveSessionWorkspaceBinding('),
      source.indexOf(
        'binding = await resolveServerAdminCsrfProofSessionWorkspaceBinding(',
      ),
    ].filter((index) => index >= 0);
    const providerBindingIndex = Math.min(...providerBindingIndexes);

    assert.notEqual(earlyCapabilityIndex, -1, relativePath);
    assert.notEqual(providerBindingIndex, Infinity, relativePath);
    assert.ok(
      earlyCapabilityIndex < providerBindingIndex,
      `${relativePath}: capability must be evaluated before provider binding`,
    );

    const earlyBoundary = source.slice(
      earlyCapabilityIndex,
      providerBindingIndex,
    );
    assert.match(earlyBoundary, /if \(!mutationCapability\.enabled\)/);
    assert.match(earlyBoundary, /mutationCapability\.reason/);
    assert.match(earlyBoundary, /mutationCapability\.statusCode/);
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
  assert.equal(stageA.providerAdmissionEvidence.maximumEvidenceAgeHours, 24);
  assert.equal(
    stageA.providerAdmissionEvidence.timestampFormat,
    'canonical-utc-iso-8601-milliseconds',
  );
  assert.deepEqual(stageA.providerAdmissionEvidence.allowedMechanisms, [
    'new-user-signup-disabled',
    'before-user-created-admission-hook',
  ]);
  assert.deepEqual(stageA.providerAdmissionEvidence.requiredFields, [
    'admissionMechanism',
    'verificationStatus',
    'verifiedAt',
    'operatorApprovalReference',
    'requestedImmutableSha',
    'existingOwnerReadiness',
    'noPublicSignupResult',
    'supabaseProjectIdentityFingerprint',
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

test('Stage A completion rejects malformed provider, workspace, and CSRF configuration', () => {
  const invalidValues = {
    SUPABASE_URL: 'https://example.invalid',
    SUPABASE_ANON_KEY: 'x',
    CATALOGUE_WORKSPACE_ID: 'x',
    ADMIN_TRUSTED_WORKSPACE_ID: 'x',
    ADMIN_CSRF_PROOF_SECRET: 'a'.repeat(32),
  };

  for (const [name, value] of Object.entries(invalidValues)) {
    const issues = validateStageARepositoryReadiness({
      env: { ...stageACompletionEnv, [name]: value },
      providerAdmissionEvidence,
      nowMs: evidenceNowMs,
    });

    assert.ok(issues.includes(`stage_a_runtime_env_invalid:${name}`), name);
  }
});

test('Stage A accepts only a canonical Supabase project-root URL', () => {
  for (const value of [
    'https://abcdefghijklmnopqrst.supabase.co',
    'https://abcdefghijklmnopqrst.supabase.co/',
  ]) {
    const issues = validateStageARepositoryReadiness({
      env: { ...stageACompletionEnv, SUPABASE_URL: value },
      providerAdmissionEvidence,
      nowMs: evidenceNowMs,
    });

    assert.deepEqual(issues, [], value);
  }

  for (const value of [
    'https://abcdefghijklmnopqrst.supabase.co/not-a-project-root',
    'https://abcdefghijklmnopqrst.supabase.co/rest/v1',
    'https://abcdefghijklmnopqrst.supabase.co/%2e%2e/rest',
    'https://abcdefghijklmnopqrst.supabase.co/%2frest',
    'https://abcdefghijklmnopqrst.supabase.co/./',
    'https://abcdefghijklmnopqrst.supabase.co/%2e/',
    'https://abcdefghijklmnopqrst.supabase.co//',
    'https://abcdefghijklmnopqrst.supabase.co\\rest\\v1',
    'https://abcdefghijklmnopqrst.supabase.co?x=1',
    'https://abcdefghijklmnopqrst.supabase.co#fragment',
    'https://user@abcdefghijklmnopqrst.supabase.co',
    'https://abcdefghijklmnopqrst.supabase.co:443',
    'https://abcdefghijklmnopqrst.supabase.co:8443',
  ]) {
    const issues = validateStageARepositoryReadiness({
      env: { ...stageACompletionEnv, SUPABASE_URL: value },
      providerAdmissionEvidence,
      nowMs: evidenceNowMs,
    });

    assert.ok(
      issues.includes('stage_a_runtime_env_invalid:SUPABASE_URL'),
      value,
    );
  }
});

test('Stage A completion cannot pass with a non-root Supabase URL', () => {
  const issues = validateStageARepositoryReadiness({
    env: {
      ...stageACompletionEnv,
      SUPABASE_URL:
        'https://abcdefghijklmnopqrst.supabase.co/not-a-project-root',
    },
    providerAdmissionEvidence,
    nowMs: evidenceNowMs,
  });

  assert.notDeepEqual(issues, []);
  assert.ok(issues.includes('stage_a_runtime_env_invalid:SUPABASE_URL'));
});

test('Stage A accepts a legacy anon JWT but rejects a service-role JWT as SUPABASE_ANON_KEY', () => {
  const accepted = validateStageARepositoryReadiness({
    env: {
      ...stageACompletionEnv,
      SUPABASE_ANON_KEY: syntheticLegacySupabaseJwt('anon'),
    },
    providerAdmissionEvidence,
    nowMs: evidenceNowMs,
  });
  const rejected = validateStageARepositoryReadiness({
    env: {
      ...stageACompletionEnv,
      SUPABASE_ANON_KEY: syntheticLegacySupabaseJwt('service_role'),
    },
    providerAdmissionEvidence,
    nowMs: evidenceNowMs,
  });

  assert.deepEqual(accepted, []);
  assert.ok(rejected.includes('stage_a_runtime_env_invalid:SUPABASE_ANON_KEY'));
});

test('Stage A completion rejects evidence binding from a dirty or unresolved tracked checkout', () => {
  const issues = validateStageARepositoryReadiness({
    env: stageACompletionEnv,
    providerAdmissionEvidence,
    nowMs: evidenceNowMs,
    expectedRevision: null,
  });

  assert.ok(issues.includes('stage_a_repository_revision_not_clean'));
  assert.ok(issues.includes('stage_a_provider_admission_not_verified'));
  assert.match(
    read('scripts/validate-stage-a-oauth-deployment-readiness.cjs'),
    /status', '--porcelain', '--untracked-files=no/,
  );
});

test('Stage A completion rejects unapproved, malformed, stale, future, or unbound admission evidence', () => {
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
    { ...providerAdmissionEvidence, verifiedAt: 'July 23, 2026 00:00:00 UTC' },
    { ...providerAdmissionEvidence, verifiedAt: '2026-02-30T00:00:00.000Z' },
    { ...providerAdmissionEvidence, verifiedAt: '2026-07-21T00:00:00.000Z' },
    { ...providerAdmissionEvidence, operatorApprovalReference: 'self-attested' },
    { ...providerAdmissionEvidence, requestedImmutableSha: 'b'.repeat(40) },
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
  assert.match(combined, /24 hours/i);
  assert.match(combined, /requested immutable SHA/i);
  assert.match(combined, /\/_next\/static\/\*\.js/);
  assert.match(combined, /Local `website\/\.next`.*not.*deployed-build evidence/is);
  assert.match(combined, /SKR_PRODUCTION_EXPECTED_BUILD_ID/);
  assert.match(combined, /hosted provenance manifest/i);
  assert.match(combined, /complete inventory/i);
  assert.match(combined, /never fetches? third-party script origins?/i);
  assert.match(combined, /clean tracked checkout/i);
  assert.match(combined, /legacy\s+[`]?service_role[`]? JWT is rejected/i);
  assert.match(combined, /4,096-character overlap window/i);
  assert.match(combined, /512 KiB total response ceiling/i);
  assert.doesNotMatch(combined, /same 128 KiB (?:per-)?response bound/i);
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

test('canonical contracts require the early access boundary and Supabase project root', () => {
  const combined = [
    'docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md',
    'docs/DEPLOYMENT-ENVIRONMENT-READINESS.md',
    'docs/PRODUCTION-SECURITY-READINESS-GATE.md',
    'docs/templates/DEPLOYMENT-EVIDENCE.md',
  ]
    .map(read)
    .join('\n');

  assert.match(combined, /project origin root/i);
  assert.match(combined, /non-root paths?/i);
  assert.match(combined, /explicit ports?/i);
  assert.match(
    combined,
    /before (?:any )?session, identity, workspace, profile,\s*membership, repository, audit, database/i,
  );
});
