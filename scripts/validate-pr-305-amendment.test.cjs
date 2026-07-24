const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  calculateInventoryDigest,
  generateProductionBuildProvenance,
  inventoryClientAssets,
} = require('../website/scripts/generate-production-build-provenance.cjs');
const {
  calculateRouteInventoryDigest,
  discoverPublicPageRouteInventory: discoverRouteInventory,
} = require('../website/scripts/production-smoke-route-inventory.cjs');
const {
  SmokeContractError,
  discoverPublicPageRouteInventory,
  runProductionReadOnlySmoke,
  safeFailureResult,
} = require('./smoke-production-readonly.cjs');

const apex = 'https://spacekonceptrental.com';
const www = 'https://www.spacekonceptrental.com';
const reviewedSha = 'a'.repeat(40);
const deployedBuildId = 'synthetic-build-current';
const provenanceUrl =
  `${apex}/.well-known/skr-build-provenance.json`;
const safeAssetPath = '/_next/static/chunks/shared.js';
const safeAssetBody = 'globalThis.__shared = true;';
const productionRouteInventory = discoverRouteInventory({
  appDirectory: path.join(__dirname, '..', 'website', 'app'),
});

function response(status, body = 'safe public response', headers = {}) {
  return new Response(body, { status, headers });
}

function syntheticModernKey() {
  return ['sb', 'secret', 'r'.repeat(22), 'c'.repeat(8)].join('_');
}

function assetEntry(assetPath, body) {
  return {
    path: assetPath,
    sha256: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

function provenanceManifest(overrides = {}) {
  const assets = [
    ...(overrides.assets ?? [assetEntry(safeAssetPath, safeAssetBody)]),
  ].sort((left, right) => left.path.localeCompare(right.path));
  const routes = overrides.routes ?? productionRouteInventory.routes;

  return {
    schemaVersion: 2,
    reviewedSha: reviewedSha,
    buildId: deployedBuildId,
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
    routeCount: routes.length,
    routeInventorySha256: calculateRouteInventoryDigest(routes),
    routes,
    assetCount: assets.length,
    inventorySha256: calculateInventoryDigest(assets),
    ...overrides,
    assets,
  };
}

function createFixture(options = {}) {
  const calls = [];
  const assetBodies = new Map([
    [safeAssetPath, safeAssetBody],
    ...Object.entries(options.assetBodies ?? {}),
  ]);
  const defaults = new Map(
    productionRouteInventory.routes.map((route) => [
      new URL(route.path, apex).toString(),
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
  for (const [assetPath, body] of assetBodies) {
    defaults.set(new URL(assetPath, apex).toString(), response(200, body));
  }

  const manifest =
    options.manifest ??
    provenanceManifest({
      assets: [...assetBodies].map(([assetPath, body]) =>
        assetEntry(assetPath, body),
      ),
    });
  defaults.set(provenanceUrl, response(200, JSON.stringify(manifest)));

  const configured = new Map([
    ...defaults,
    ...Object.entries(options.overrides ?? {}),
  ]);

  return {
    calls,
    fetch: async (target, fetchOptions) => {
      const url = target.toString();
      calls.push({ url, options: fetchOptions });
      const configuredResponse = configured.get(url);

      if (!configuredResponse) {
        throw new Error(`unmocked request: ${url}`);
      }

      return configuredResponse;
    },
  };
}

function runSmoke(mock, overrides = {}) {
  return runProductionReadOnlySmoke({
    rawBaseUrl: apex,
    rawExpectedRevision: reviewedSha,
    rawExpectedBuildId: deployedBuildId,
    fetchImpl: mock.fetch,
    ...overrides,
  });
}

test('anonymous admin login HTML is fetched and leakage-scanned independently of the admin redirect', async () => {
  const leaked = syntheticModernKey();
  const mock = createFixture({
    overrides: {
      [`${apex}/admin/login`]: response(200, leaked),
    },
  });
  let error;

  try {
    await runSmoke(mock);
  } catch (caught) {
    error = caught;
  }

  assert.equal(
    error?.code,
    'public_response_leakage_supabase_key_material',
  );
  assert.ok(mock.calls.some((call) => call.url === `${apex}/admin/login`));
  assert.doesNotMatch(JSON.stringify(safeFailureResult(error)), new RegExp(leaked));
});

test('safe login HTML passes with GET only and never initiates OAuth or posts login', async () => {
  const mock = createFixture();
  const result = await runSmoke(mock);

  assert.equal(result.outcome, 'passed');
  assert.ok(
    result.results.some(
      (entry) => entry.path === '/admin/login' && entry.status === 200,
    ),
  );
  assert.ok(mock.calls.every((call) => call.options.method === 'GET'));
  assert.equal(
    mock.calls.some((call) => /\/api\/admin\/login/.test(call.url)),
    false,
  );
  assert.equal(result.oauthInitiated, false);
});

test('protected admin pages remain excluded and newly added admin pages fail closed', () => {
  const appDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-admin-routes-'),
  );
  const pages = [
    'page.tsx',
    'admin/page.tsx',
    'admin/login/page.tsx',
    'admin/catalogue/page.tsx',
  ];

  for (const relativePath of pages) {
    const pagePath = path.join(appDirectory, ...relativePath.split('/'));
    fs.mkdirSync(path.dirname(pagePath), { recursive: true });
    fs.writeFileSync(pagePath, 'export default function Page() { return null; }\n');
  }

  const inventory = discoverPublicPageRouteInventory({ appDirectory });
  assert.deepEqual(inventory.publicRoutes, ['/', '/admin/login']);
  assert.ok(
    inventory.exclusions.some(
      (entry) =>
        entry.routeTemplate === '/admin/catalogue' &&
        entry.reason === 'protected-admin',
    ),
  );

  const unclassifiedPage = path.join(
    appDirectory,
    'admin',
    'future-public',
    'page.tsx',
  );
  fs.mkdirSync(path.dirname(unclassifiedPage), { recursive: true });
  fs.writeFileSync(
    unclassifiedPage,
    'export default function Page() { return null; }\n',
  );

  assert.throws(
    () => discoverPublicPageRouteInventory({ appDirectory }),
    (error) =>
      error instanceof SmokeContractError &&
      error.code === 'public_route_inventory_unclassified_admin_page',
  );
});

test('a stale local or hosted subset cannot stand in for the expected deployed build', async () => {
  const staleManifest = provenanceManifest({
    buildId: 'synthetic-build-stale',
  });
  const mock = createFixture({ manifest: staleManifest });

  await assert.rejects(
    runSmoke(mock),
    /build_provenance_identity_mismatch/,
  );
  assert.equal(
    mock.calls.some((call) => call.url.includes('/dynamic-current.js')),
    false,
  );
});

test('exact reviewed and deployed build identity scans every hosted first-party JavaScript asset', async () => {
  const dynamicPath = '/_next/static/chunks/app/catalogue/[slug]/page.js';
  const dynamicBody = 'globalThis.__dynamic = true;';
  const mock = createFixture({
    assetBodies: {
      [dynamicPath]: dynamicBody,
    },
  });
  const result = await runSmoke(mock);

  assert.equal(result.reviewedRevisionVerified, true);
  assert.equal(result.deployedBuildIdentityVerified, true);
  assert.equal(result.clientAssetsScanned, 2);
  assert.ok(
    mock.calls.some(
      (call) => call.url === new URL(dynamicPath, apex).toString(),
    ),
  );
});

test('leakage in a hosted dynamic-route chunk is detected without echoing material', async () => {
  const leaked = syntheticModernKey();
  const dynamicPath = '/_next/static/chunks/app/listings/[slug]/page.js';
  const mock = createFixture({
    assetBodies: {
      [dynamicPath]: leaked,
    },
  });
  let error;

  try {
    await runSmoke(mock);
  } catch (caught) {
    error = caught;
  }

  assert.equal(
    error?.code,
    'public_response_leakage_supabase_key_material',
  );
  assert.doesNotMatch(JSON.stringify(safeFailureResult(error)), new RegExp(leaked));
});

test('mismatched SHA, missing metadata, dirty provenance, and incomplete inventory fail closed', async () => {
  const variants = [
    provenanceManifest({ reviewedSha: 'b'.repeat(40) }),
    { schemaVersion: 2 },
    provenanceManifest({ trackedCheckoutClean: false }),
    provenanceManifest({ sourceCheckoutClean: false }),
    provenanceManifest({ routeCount: 1 }),
    provenanceManifest({ routeInventorySha256: '0'.repeat(64) }),
    provenanceManifest({ assetCount: 2 }),
    provenanceManifest({ inventorySha256: '0'.repeat(64) }),
  ];

  for (const manifest of variants) {
    const mock = createFixture({ manifest });
    await assert.rejects(runSmoke(mock), /build_provenance/);
  }
});

test('asset digest mismatch fails closed before accepting incomplete deployed evidence', async () => {
  const assets = [assetEntry(safeAssetPath, 'different hosted content')];
  const mock = createFixture({
    manifest: provenanceManifest({ assets }),
  });

  await assert.rejects(runSmoke(mock), /client_asset_digest_mismatch/);
});

test('third-party and non-JavaScript assets are excluded and every request remains GET-only', async () => {
  const mock = createFixture({
    overrides: {
      [`${apex}/`]: response(
        200,
        '<script src="https://cdn.example.invalid/vendor.js"></script>' +
          '<link rel="stylesheet" href="/_next/static/styles.css">',
      ),
    },
  });
  const result = await runSmoke(mock);

  assert.equal(result.outcome, 'passed');
  assert.equal(
    mock.calls.some((call) => call.url.includes('cdn.example.invalid')),
    false,
  );
  assert.equal(
    mock.calls.some((call) => call.url.endsWith('styles.css')),
    false,
  );
  assert.ok(mock.calls.every((call) => call.options.method === 'GET'));
});

test('local build inventory rejects symlinks and excludes non-JavaScript files', () => {
  const assetDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-build-assets-'),
  );
  const chunkDirectory = path.join(assetDirectory, 'chunks');
  fs.mkdirSync(chunkDirectory, { recursive: true });
  fs.writeFileSync(path.join(chunkDirectory, 'safe.js'), safeAssetBody);
  fs.writeFileSync(path.join(chunkDirectory, 'styles.css'), 'body{}');

  assert.deepEqual(
    inventoryClientAssets(assetDirectory).map((asset) => asset.path),
    ['/_next/static/chunks/safe.js'],
  );
  const generatorSource = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      'website',
      'scripts',
      'generate-production-build-provenance.cjs',
    ),
    'utf8',
  );
  assert.match(generatorSource, /isSymbolicLink\(\)/);
  assert.match(
    generatorSource,
    /build_provenance_asset_entry_not_approved/,
  );
});

test('production build generation binds the complete inventory to revision and build identity', () => {
  const websiteRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-provenance-build-'),
  );
  const nextDirectory = path.join(websiteRoot, '.next');
  const assetDirectory = path.join(nextDirectory, 'static', 'chunks');
  fs.mkdirSync(assetDirectory, { recursive: true });
  const rootPage = path.join(websiteRoot, 'app', 'page.tsx');
  const loginPage = path.join(
    websiteRoot,
    'app',
    'admin',
    'login',
    'page.tsx',
  );
  fs.mkdirSync(path.dirname(rootPage), { recursive: true });
  fs.mkdirSync(path.dirname(loginPage), { recursive: true });
  fs.writeFileSync(path.join(nextDirectory, 'BUILD_ID'), deployedBuildId);
  fs.writeFileSync(path.join(assetDirectory, 'shared.js'), safeAssetBody);
  fs.writeFileSync(rootPage, 'export default function Page() { return null; }\n');
  fs.writeFileSync(loginPage, 'export default function Page() { return null; }\n');

  const generated = generateProductionBuildProvenance({
    repoRoot: websiteRoot,
    websiteRoot,
    revision: reviewedSha,
    checkoutStatus: '',
  });

  assert.equal(generated.manifest.reviewedSha, reviewedSha);
  assert.equal(generated.manifest.buildId, deployedBuildId);
  assert.equal(generated.manifest.trackedCheckoutClean, true);
  assert.equal(generated.manifest.sourceCheckoutClean, true);
  assert.equal(generated.manifest.routeCount, 2);
  assert.equal(generated.manifest.assetCount, 1);
  assert.deepEqual(
    generated.manifest.assets.map((asset) => asset.path),
    [safeAssetPath],
  );
  assert.equal(
    JSON.parse(fs.readFileSync(generated.outputPath, 'utf8')).inventorySha256,
    generated.manifest.inventorySha256,
  );
});

test('canonical smoke contracts require public login coverage and exact hosted build provenance', () => {
  const combined = [
    'docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md',
    'docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md',
    'docs/templates/DEPLOYMENT-EVIDENCE.md',
  ]
    .map((relativePath) =>
      fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8'),
    )
    .join('\n');
  const environmentContract = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        '..',
        'docs',
        'contracts',
        'server-env-contract.json',
      ),
      'utf8',
    ),
  );
  const operatorNames = environmentContract.categories.find(
    (category) => category.name === 'Readiness mode env',
  ).variables;

  assert.match(combined, /anonymously reachable `\/admin\/login`/i);
  assert.match(combined, /never posts the login form|no form submission/i);
  assert.match(combined, /Local `website\/\.next`.*not.*deployed-build evidence/is);
  assert.match(combined, /Missing, stale,\s*mismatched, malformed, or incomplete provenance fails closed/i);
  assert.match(combined, /route-inventory and asset-inventory digests/i);
  assert.match(combined, /public dynamic route without an explicit reviewed probe/i);
  assert.match(combined, /untracked or ignored build inputs/i);
  assert.match(combined, /SKR_PRODUCTION_EXPECTED_SHA/);
  assert.match(combined, /SKR_PRODUCTION_EXPECTED_BUILD_ID/);
  assert.ok(operatorNames.includes('SKR_PRODUCTION_EXPECTED_SHA'));
  assert.ok(operatorNames.includes('SKR_PRODUCTION_EXPECTED_BUILD_ID'));
});
