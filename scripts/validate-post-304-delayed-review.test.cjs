const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  SmokeContractError,
  discoverDeployedClientAssetInventory,
  discoverPublicPageRouteInventory,
  runProductionReadOnlySmoke: runProductionReadOnlySmokeImpl,
  safeFailureResult,
} = require('./smoke-production-readonly.cjs');
const {
  scanStaticSecurity,
} = require('./validate-production-security-readiness.cjs');
const {
  deriveStageAForbiddenEnvNames,
  deriveSupabaseProjectIdentity,
  validateStageARepositoryReadiness,
} = require('./validate-stage-a-oauth-deployment-readiness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const apex = 'https://spacekonceptrental.com';
const www = 'https://www.spacekonceptrental.com';
const expectedPublicRoutes = [
  '/',
  '/about',
  '/catalogue',
  '/categories',
  '/events',
  '/listings',
  '/privacy',
  '/quote',
  '/setups',
  '/terms',
];
const previouslyOmittedRoutes = [
  '/categories',
  '/events',
  '/listings',
  '/privacy',
  '/terms',
];
const syntheticProjectRefA = 'syntheticref00000000';
const syntheticProjectRefB = 'syntheticref00000001';
const syntheticProjectUrlA =
  `https://${syntheticProjectRefA}.supabase.co`;
const syntheticProjectUrlB =
  `https://${syntheticProjectRefB}.supabase.co`;
const testRevision = 'a'.repeat(40);
const evidenceNowMs = Date.parse('2026-07-23T00:05:00.000Z');
const safeClientAssetDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'skr-post-304-client-assets-'),
);
const safeClientAssetPath = path.join(
  safeClientAssetDirectory,
  'chunks',
  'inventory-safe.js',
);
const safeClientAssetUrl =
  `${apex}/_next/static/chunks/inventory-safe.js`;
fs.mkdirSync(path.dirname(safeClientAssetPath), { recursive: true });
fs.writeFileSync(safeClientAssetPath, 'globalThis.__skrSafe = true;\n');

function runProductionReadOnlySmoke(options) {
  return runProductionReadOnlySmokeImpl({
    clientAssetDirectory: safeClientAssetDirectory,
    ...options,
  });
}

function response(status, body = 'safe public response', headers = {}) {
  return new Response(body, { status, headers });
}

function createCompleteMockFetch(overrides = {}) {
  const calls = [];
  const defaults = new Map(
    expectedPublicRoutes.map((route) => [
      new URL(route, apex).toString(),
      response(200),
    ]),
  );
  defaults.set(`${apex}/contact`, response(404));
  defaults.set(
    `${apex}/admin`,
    response(307, '', { Location: `${apex}/admin/login` }),
  );
  defaults.set(
    `${www}/`,
    response(308, '', { Location: `${apex}/` }),
  );
  defaults.set(
    safeClientAssetUrl,
    response(200, 'globalThis.__skrSafe = true;'),
  );
  const configured = new Map([...defaults, ...Object.entries(overrides)]);

  return {
    calls,
    fetch: async (target, options) => {
      const url = target.toString();
      calls.push({ url, options });
      const configuredResponse = configured.get(url);

      if (!configuredResponse) {
        throw new Error(`unmocked request: ${url}`);
      }

      return configuredResponse;
    },
  };
}

function syntheticModernKey(kind) {
  return ['sb', kind, 'r'.repeat(22), 'c'.repeat(8)].join('_');
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

function encodeUtf16(text, endian) {
  const littleEndian = Buffer.from(text, 'utf16le');

  if (endian === 'le') {
    return Buffer.concat([Buffer.from([0xff, 0xfe]), littleEndian]);
  }

  const bigEndian = Buffer.alloc(littleEndian.length);
  for (let index = 0; index < littleEndian.length; index += 2) {
    bigEndian[index] = littleEndian[index + 1];
    bigEndian[index + 1] = littleEndian[index];
  }

  return Buffer.concat([Buffer.from([0xfe, 0xff]), bigEndian]);
}

function encodeBomlessUtf16(text, endian) {
  return encodeUtf16(text, endian).subarray(2);
}

function stageAEnv(overrides = {}) {
  return {
    SUPABASE_URL: syntheticProjectUrlA,
    SUPABASE_ANON_KEY: `sb_publishable_${'a1B2c3D4'.repeat(3)}`,
    CATALOGUE_WORKSPACE_ID: '11111111-1111-4111-8111-111111111111',
    ADMIN_TRUSTED_WORKSPACE_ID: '22222222-2222-4222-8222-222222222222',
    ADMIN_EXPECTED_ORIGIN: apex,
    ADMIN_EXPECTED_HOST: 'spacekonceptrental.com',
    ADMIN_CSRF_PROOF_SECRET: 'Synthetic-Csrf-Proof-9zY8xW7vU6tS5rQ4',
    ADMIN_MUTATIONS_ENABLED: 'false',
    ...overrides,
  };
}

function providerAdmissionEvidence(overrides = {}) {
  return {
    admissionMechanism: 'new-user-signup-disabled',
    verificationStatus: 'PASS',
    verifiedAt: '2026-07-23T00:00:00.000Z',
    operatorApprovalReference:
      'https://github.com/Swooshz-com/spacekonceptrental/issues/301#issuecomment-1234567890',
    requestedImmutableSha: testRevision,
    existingOwnerReadiness: 'PASS',
    noPublicSignupResult: 'PASS',
    supabaseProjectIdentityFingerprint:
      deriveSupabaseProjectIdentity(syntheticProjectUrlA),
    ...overrides,
  };
}

test('production smoke derives every current static public page from the app tree', () => {
  const inventory = discoverPublicPageRouteInventory({
    appDirectory: path.join(repoRoot, 'website', 'app'),
  });

  assert.deepEqual(inventory.publicRoutes, expectedPublicRoutes);
  assert.ok(
    inventory.exclusions.some(
      (entry) =>
        entry.routeTemplate === '/admin' &&
        entry.reason === 'protected-admin',
    ),
  );
  assert.ok(
    inventory.exclusions.some(
      (entry) =>
        entry.routeTemplate === '/catalogue/[slug]' &&
        entry.reason === 'dynamic-parameter-required',
    ),
  );
  assert.ok(
    inventory.exclusions.some(
      (entry) =>
        entry.routeTemplate === '/listings/[slug]' &&
        entry.reason === 'dynamic-parameter-required',
    ),
  );
  assert.equal(
    inventory.publicRoutes.some((route) => route.startsWith('/api')),
    false,
  );
});

test('leakage isolated to every previously omitted public route fails safely', async () => {
  for (const route of previouslyOmittedRoutes) {
    const leaked = syntheticModernKey('secret');
    const mock = createCompleteMockFetch({
      [new URL(route, apex).toString()]: response(200, leaked),
    });
    let error;

    try {
      await runProductionReadOnlySmoke({
        rawBaseUrl: apex,
        fetchImpl: mock.fetch,
      });
    } catch (caught) {
      error = caught;
    }

    assert.equal(
      error?.code,
      'public_response_leakage_supabase_key_material',
      route,
    );
    assert.ok(mock.calls.some((call) => call.url === new URL(route, apex).toString()));
    assert.doesNotMatch(JSON.stringify(safeFailureResult(error)), new RegExp(leaked));
    assert.ok(mock.calls.every((call) => call.options.method === 'GET'));
    assert.equal(
      mock.calls.some((call) => call.url.includes('/api/')),
      false,
    );
  }
});

test('complete deployed client asset inventory covers dynamic-route chunks without crawling invented parameters', async () => {
  const leaked = syntheticModernKey('secret');
  const dynamicAssetUrl = `${apex}/_next/static/chunks/app/catalogue/[slug]/page.js`;
  const assetDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-dynamic-client-assets-'),
  );
  const dynamicAssetPath = path.join(
    assetDirectory,
    'chunks',
    'app',
    'catalogue',
    '[slug]',
    'page.js',
  );
  fs.mkdirSync(path.dirname(dynamicAssetPath), { recursive: true });
  fs.writeFileSync(dynamicAssetPath, 'synthetic built asset fixture\n');
  const mock = createCompleteMockFetch({
    [dynamicAssetUrl]: response(200, leaked),
  });
  let error;

  try {
    await runProductionReadOnlySmoke({
      rawBaseUrl: apex,
      fetchImpl: mock.fetch,
      clientAssetDirectory: assetDirectory,
    });
  } catch (caught) {
    error = caught;
  }

  assert.equal(
    error?.code,
    'public_response_leakage_supabase_key_material',
  );
  assert.ok(mock.calls.some((call) => call.url === dynamicAssetUrl));
  assert.equal(
    mock.calls.some((call) => /\/catalogue\/[^[]/.test(call.url)),
    false,
  );
  assert.ok(mock.calls.every((call) => call.options.method === 'GET'));
  assert.doesNotMatch(JSON.stringify(safeFailureResult(error)), new RegExp(leaked));
});

test('complete deployed client asset inventory includes only bounded first-party JavaScript paths', () => {
  const assetDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-complete-client-assets-'),
  );
  const nestedAsset = path.join(assetDirectory, 'chunks', 'app', 'page.js');
  fs.mkdirSync(path.dirname(nestedAsset), { recursive: true });
  fs.writeFileSync(nestedAsset, 'synthetic built asset fixture\n');
  fs.writeFileSync(
    path.join(assetDirectory, 'chunks', 'styles.css'),
    'body { color: black; }\n',
  );

  assert.deepEqual(
    discoverDeployedClientAssetInventory({ assetDirectory }),
    ['/_next/static/chunks/app/page.js'],
  );
});

test('new unsupported public route syntax fails closed instead of drifting out of inventory', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skr-route-inventory-'));
  const appDirectory = path.join(tempRoot, 'app');
  const unclassifiedPage = path.join(appDirectory, '@slot', 'page.tsx');
  fs.mkdirSync(path.dirname(unclassifiedPage), { recursive: true });
  fs.writeFileSync(unclassifiedPage, 'export default function Page() { return null; }\n');

  assert.throws(
    () => discoverPublicPageRouteInventory({ appDirectory }),
    (error) =>
      error instanceof SmokeContractError &&
      error.code === 'public_route_inventory_unclassified',
  );
});

test('route groups are normalized while API, admin, and dynamic pages remain classified out', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skr-route-groups-'));
  const appDirectory = path.join(tempRoot, 'app');
  const pages = [
    'page.tsx',
    '(marketing)/offers/page.tsx',
    'admin/page.tsx',
    'api/status/page.tsx',
    'catalogue/[slug]/page.tsx',
  ];

  for (const relativePath of pages) {
    const pagePath = path.join(appDirectory, ...relativePath.split('/'));
    fs.mkdirSync(path.dirname(pagePath), { recursive: true });
    fs.writeFileSync(pagePath, 'export default function Page() { return null; }\n');
  }

  const inventory = discoverPublicPageRouteInventory({ appDirectory });
  assert.deepEqual(inventory.publicRoutes, ['/', '/offers']);
  assert.ok(
    inventory.exclusions.some(
      (entry) => entry.routeTemplate === '/admin' && entry.reason === 'protected-admin',
    ),
  );
  assert.ok(
    inventory.exclusions.some(
      (entry) => entry.routeTemplate === '/api/status' && entry.reason === 'api-route',
    ),
  );
  assert.ok(
    inventory.exclusions.some(
      (entry) =>
        entry.routeTemplate === '/catalogue/[slug]' &&
        entry.reason === 'dynamic-parameter-required',
    ),
  );
});

test('UTF-16LE and UTF-16BE tracked text is scanned for every Supabase credential class', () => {
  const materials = [
    ['supabase_secret_key_material', syntheticModernKey('secret')],
    ['supabase_publishable_key_material', syntheticModernKey('publishable')],
    ['supabase_legacy_jwt_material', syntheticLegacySupabaseJwt('anon')],
    ['supabase_legacy_jwt_material', syntheticLegacySupabaseJwt('service_role')],
  ];

  for (const endian of ['le', 'be']) {
    for (const [expectedLabel, material] of materials) {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skr-utf16-scan-'));
      const filePath = path.join(tempRoot, `fixture-${endian}.txt`);
      fs.writeFileSync(filePath, encodeUtf16(`synthetic=${material}\n`, endian));

      const issues = scanStaticSecurity(tempRoot, [filePath]);
      const output = JSON.stringify(issues);
      assert.ok(
        issues.some((issue) => issue.summary === expectedLabel),
        `${endian}:${expectedLabel}`,
      );
      assert.doesNotMatch(
        output,
        new RegExp(material.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
    }
  }
});

test('safe BOM-confirmed UTF-16 text is accepted while ambiguous binary remains excluded', () => {
  for (const endian of ['le', 'be']) {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skr-utf16-safe-'));
    const filePath = path.join(tempRoot, `safe-${endian}.txt`);
    fs.writeFileSync(filePath, encodeUtf16('ordinary safe tracked text\n', endian));
    assert.deepEqual(scanStaticSecurity(tempRoot, [filePath]), []);
  }

  const binaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skr-binary-scan-'));
  const binaryPath = path.join(binaryRoot, 'binary.dat');
  fs.writeFileSync(binaryPath, Buffer.from([0x00, 0xff, 0x01, 0x00, 0x89, 0x50]));
  assert.deepEqual(scanStaticSecurity(binaryRoot, [binaryPath]), []);
});

test('the bounded alternating-NUL heuristic scans defensible BOM-less UTF-16 text', () => {
  for (const endian of ['le', 'be']) {
    const material = syntheticModernKey('secret');
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skr-utf16-bomless-'));
    const filePath = path.join(tempRoot, `bomless-${endian}.txt`);
    fs.writeFileSync(
      filePath,
      encodeBomlessUtf16(`synthetic=${material}\n`, endian),
    );

    const issues = scanStaticSecurity(tempRoot, [filePath]);
    assert.ok(
      issues.some(
        (issue) => issue.summary === 'supabase_secret_key_material',
      ),
      endian,
    );
    assert.doesNotMatch(
      JSON.stringify(issues),
      new RegExp(material.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
});

test('Stage A derives and rejects every Stage B quote and enquiry-handoff variable', () => {
  const contract = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, 'docs', 'contracts', 'server-env-contract.json'),
      'utf8',
    ),
  );
  const expectedForbiddenNames = [
    'QUOTE_WORKSPACE_ID',
    'QUOTE_SUBMISSION_ADMISSION_SECRET',
    'N8N_ENQUIRY_HANDOFF_WEBHOOK_URL',
    'N8N_ENQUIRY_HANDOFF_SHARED_SECRET',
    'N8N_ENQUIRY_HANDOFF_TIMEOUT_MS',
  ];

  assert.deepEqual(
    deriveStageAForbiddenEnvNames(contract),
    expectedForbiddenNames,
  );

  for (const name of expectedForbiddenNames) {
    for (const value of ['', ' ', 'malformed-stage-b-value']) {
      const issues = validateStageARepositoryReadiness({
        env: stageAEnv({ [name]: value }),
        providerAdmissionEvidence: providerAdmissionEvidence(),
        nowMs: evidenceNowMs,
        expectedRevision: testRevision,
      });

      assert.ok(
        issues.includes(`stage_a_forbidden_stage_b_env_present:${name}`),
        `${name}:${JSON.stringify(value)}`,
      );
    }
  }

  const combinedIssues = validateStageARepositoryReadiness({
    env: stageAEnv({
      QUOTE_WORKSPACE_ID: '33333333-3333-4333-8333-333333333333',
      N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: 'https://example.invalid/handoff',
    }),
    providerAdmissionEvidence: providerAdmissionEvidence(),
    nowMs: evidenceNowMs,
    expectedRevision: testRevision,
  });
  assert.ok(
    combinedIssues.includes(
      'stage_a_forbidden_stage_b_env_present:QUOTE_WORKSPACE_ID',
    ),
  );
  assert.ok(
    combinedIssues.includes(
      'stage_a_forbidden_stage_b_env_present:N8N_ENQUIRY_HANDOFF_WEBHOOK_URL',
    ),
  );
});

test('valid Stage A-only config passes repository/runtime checks but still holds without provider evidence', () => {
  const passed = validateStageARepositoryReadiness({
    env: stageAEnv(),
    providerAdmissionEvidence: providerAdmissionEvidence(),
    nowMs: evidenceNowMs,
    expectedRevision: testRevision,
  });
  const held = validateStageARepositoryReadiness({
    env: stageAEnv(),
    nowMs: evidenceNowMs,
    expectedRevision: testRevision,
  });

  assert.deepEqual(passed, []);
  assert.ok(held.includes('stage_a_provider_admission_not_verified'));
});

test('provider admission evidence is bound to the configured canonical Supabase project', () => {
  const exactMatch = validateStageARepositoryReadiness({
    env: stageAEnv(),
    providerAdmissionEvidence: providerAdmissionEvidence(),
    nowMs: evidenceNowMs,
    expectedRevision: testRevision,
  });
  assert.deepEqual(exactMatch, []);

  for (const fingerprint of [
    undefined,
    '',
    syntheticProjectRefA,
    `SHA256:${'a'.repeat(64)}`,
    `sha256:${'A'.repeat(64)}`,
    deriveSupabaseProjectIdentity(syntheticProjectUrlB),
  ]) {
    const evidence = providerAdmissionEvidence();
    if (fingerprint === undefined) {
      delete evidence.supabaseProjectIdentityFingerprint;
    } else {
      evidence.supabaseProjectIdentityFingerprint = fingerprint;
    }

    const issues = validateStageARepositoryReadiness({
      env: stageAEnv(),
      providerAdmissionEvidence: evidence,
      nowMs: evidenceNowMs,
      expectedRevision: testRevision,
    });
    assert.ok(
      issues.includes('stage_a_provider_admission_not_verified'),
      String(fingerprint),
    );
  }

  const projectMismatch = validateStageARepositoryReadiness({
    env: stageAEnv({ SUPABASE_URL: syntheticProjectUrlB }),
    providerAdmissionEvidence: providerAdmissionEvidence(),
    nowMs: evidenceNowMs,
    expectedRevision: testRevision,
  });
  assert.ok(
    projectMismatch.includes('stage_a_provider_admission_not_verified'),
  );
});

test('existing stale, future, wrong-SHA, and unapproved-mechanism evidence remains rejected', () => {
  for (const evidence of [
    providerAdmissionEvidence({ verifiedAt: '2026-07-21T00:00:00.000Z' }),
    providerAdmissionEvidence({ verifiedAt: '2026-07-23T00:05:00.001Z' }),
    providerAdmissionEvidence({ requestedImmutableSha: 'b'.repeat(40) }),
    providerAdmissionEvidence({ admissionMechanism: 'post-callback-denial' }),
  ]) {
    const issues = validateStageARepositoryReadiness({
      env: stageAEnv(),
      providerAdmissionEvidence: evidence,
      nowMs: evidenceNowMs,
      expectedRevision: testRevision,
    });
    assert.ok(issues.includes('stage_a_provider_admission_not_verified'));
  }
});

test('canonical documentation records complete route, Stage B absence, and project binding contracts', () => {
  const combined = [
    'docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md',
    'docs/PRODUCTION-SECURITY-READINESS-GATE.md',
    'docs/DEPLOYMENT-ENVIRONMENT-READINESS.md',
    'docs/manual-qa/PROTECTED-ADMIN-AUTHORISED-UAT-RUNBOOK.md',
    'docs/templates/DEPLOYMENT-EVIDENCE.md',
  ]
    .map((relativePath) =>
      fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    )
    .join('\n');

  for (const route of previouslyOmittedRoutes) {
    assert.match(combined, new RegExp(route.replace('/', '\\/')));
  }
  for (const name of [
    'QUOTE_WORKSPACE_ID',
    'QUOTE_SUBMISSION_ADMISSION_SECRET',
    'N8N_ENQUIRY_HANDOFF_WEBHOOK_URL',
    'N8N_ENQUIRY_HANDOFF_SHARED_SECRET',
    'N8N_ENQUIRY_HANDOFF_TIMEOUT_MS',
  ]) {
    assert.match(combined, new RegExp(name));
  }
  assert.match(combined, /blank, whitespace, or malformed/i);
  assert.match(combined, /SHA-256 fingerprint/i);
  assert.match(combined, /must exactly match/i);
  assert.match(combined, /concrete project reference remains outside tracked/i);
});
