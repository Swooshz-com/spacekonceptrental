const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  assertSourceCheckoutClean,
  calculateInventoryDigest,
  generateProductionBuildProvenance,
} = require('../website/scripts/generate-production-build-provenance.cjs');
const {
  calculateRouteInventoryDigest,
  discoverPublicPageRouteInventory,
} = require('../website/scripts/production-smoke-route-inventory.cjs');
const {
  runProductionReadOnlySmoke,
  safeFailureResult,
} = require('./smoke-production-readonly.cjs');

const apex = 'https://spacekonceptrental.com';
const www = 'https://www.spacekonceptrental.com';
const reviewedSha = 'a'.repeat(40);
const buildId = 'synthetic-reviewed-build';
const assetPath = '/_next/static/chunks/safe.js';
const assetBody = 'globalThis.__safe = true;';
const leakedMaterial = ['sb', 'secret', 'r'.repeat(22), 'c'.repeat(8)].join('_');

function response(status, body = 'safe public response', headers = {}) {
  return new Response(body, { status, headers });
}

function writePage(appDirectory, relativeDirectory) {
  const pageDirectory = path.join(
    appDirectory,
    ...relativeDirectory.split('/').filter(Boolean),
  );
  fs.mkdirSync(pageDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(pageDirectory, 'page.tsx'),
    'export default function Page() { return null; }\n',
  );
}

function createSmokeFixture(
  appDirectory,
  overrides = {},
  routeOverrides,
  manifestOverrides = {},
) {
  const calls = [];
  const asset = {
    path: assetPath,
    sha256: crypto.createHash('sha256').update(assetBody).digest('hex'),
  };
  const routes =
    routeOverrides ??
    discoverPublicPageRouteInventory({ appDirectory }).routes;
  const configured = new Map([
    [`${apex}/`, response(200)],
    [`${apex}/contact`, response(404)],
    [
      `${apex}/admin`,
      response(307, '', { Location: `${apex}/admin/login` }),
    ],
    [`${www}/`, response(308, '', { Location: `${apex}/` })],
    [new URL(assetPath, apex).toString(), response(200, assetBody)],
    [
      `${apex}/.well-known/skr-build-provenance.json`,
      response(
        200,
        JSON.stringify({
          schemaVersion: 2,
          reviewedSha,
          buildId,
          trackedCheckoutClean: true,
          sourceCheckoutClean: true,
          routeCount: routes.length,
          routeInventorySha256: calculateRouteInventoryDigest(routes),
          routes,
          assetCount: 1,
          inventorySha256: calculateInventoryDigest([asset]),
          assets: [asset],
          ...manifestOverrides,
        }),
      ),
    ],
    ...Object.entries(overrides),
  ]);

  return {
    calls,
    run: () =>
      runProductionReadOnlySmoke({
        rawBaseUrl: apex,
        rawExpectedRevision: reviewedSha,
        rawExpectedBuildId: buildId,
        appDirectory,
        fetchImpl: async (target, options) => {
          const url = target.toString();
          calls.push({ url, options });
          const configuredResponse = configured.get(url);

          if (!configuredResponse) {
            throw new Error(`unmocked request: ${url}`);
          }

          return configuredResponse;
        },
      }),
  };
}

test('stale runner route inventory cannot omit a leaking page from the reviewed deployment', async () => {
  const staleAppDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-stale-routes-'),
  );
  writePage(staleAppDirectory, '');
  writePage(staleAppDirectory, 'admin/login');
  const reviewedRoutes = [
    {
      template: '/',
      path: '/',
      kind: 'public-static-page',
      expectedStatuses: [200],
    },
    {
      template: '/admin/login',
      path: '/admin/login',
      kind: 'anonymous-admin-page',
      expectedStatuses: [200],
    },
    {
      template: '/new-public-page',
      path: '/new-public-page',
      kind: 'public-static-page',
      expectedStatuses: [200],
    },
  ];
  const fixture = createSmokeFixture(staleAppDirectory, {
    [`${apex}/admin/login`]: response(200),
    [`${apex}/new-public-page`]: response(200, leakedMaterial),
  }, reviewedRoutes);

  await assert.rejects(
    fixture.run(),
    /public_response_leakage_supabase_key_material|build_provenance_route/,
  );
  assert.ok(
    fixture.calls.some((call) => call.url === `${apex}/new-public-page`),
    'the exact reviewed public route must be scanned or route provenance must fail closed',
  );
});

test('public dynamic catalogue HTML is leakage-scanned through a reviewed concrete probe', async () => {
  const appDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-dynamic-routes-'),
  );
  writePage(appDirectory, '');
  writePage(appDirectory, 'admin/login');
  writePage(appDirectory, 'catalogue/[slug]');
  const probeUrl = `${apex}/catalogue/skr-smoke-probe-reserved`;
  const fixture = createSmokeFixture(appDirectory, {
    [`${apex}/admin/login`]: response(200),
    [probeUrl]: response(404, leakedMaterial),
  });

  await assert.rejects(
    fixture.run(),
    /public_response_leakage_supabase_key_material/,
  );
  assert.ok(
    fixture.calls.some((call) => call.url === probeUrl),
    'the reviewed dynamic probe must be requested',
  );
  assert.ok(fixture.calls.every((call) => call.options.method === 'GET'));
});

test('safe dynamic HTML passes without OAuth, quote, n8n, or mutating requests', async () => {
  const appDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-safe-dynamic-'),
  );
  writePage(appDirectory, '');
  writePage(appDirectory, 'admin/login');
  writePage(appDirectory, 'catalogue/[slug]');
  const fixture = createSmokeFixture(appDirectory, {
    [`${apex}/admin/login`]: response(200),
    [`${apex}/catalogue/skr-smoke-probe-reserved`]: response(200),
  });
  const result = await fixture.run();

  assert.equal(result.outcome, 'passed');
  assert.equal(result.oauthInitiated, false);
  assert.equal(result.quoteSubmissionAttempted, false);
  assert.ok(fixture.calls.every((call) => call.options.method === 'GET'));
  assert.equal(
    fixture.calls.some((call) =>
      /\/api\/(?:admin\/login|quote|chat)|n8n/i.test(call.url),
    ),
    false,
  );
});

test('unsafe dynamic probe redirects fail before any cross-origin request', async () => {
  const appDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-dynamic-redirect-'),
  );
  writePage(appDirectory, '');
  writePage(appDirectory, 'admin/login');
  writePage(appDirectory, 'catalogue/[slug]');
  const fixture = createSmokeFixture(appDirectory, {
    [`${apex}/admin/login`]: response(200),
    [`${apex}/catalogue/skr-smoke-probe-reserved`]: response(307, '', {
      Location: 'https://outside.invalid/catalogue/probe',
    }),
  });

  await assert.rejects(fixture.run(), /redirect_authority_not_canonical/);
  assert.equal(
    fixture.calls.some((call) => call.url.includes('outside.invalid')),
    false,
  );
});

test('missing, malformed, or digest-mismatched route provenance fails closed', async () => {
  const appDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-route-provenance-'),
  );
  writePage(appDirectory, '');
  writePage(appDirectory, 'admin/login');
  const variants = [
    { routes: undefined },
    { routeInventorySha256: '0'.repeat(64) },
    {
      routes: [
        {
          template: '/',
          path: 'https://outside.invalid/',
          kind: 'public-static-page',
          expectedStatuses: [200],
        },
      ],
      routeCount: 1,
      routeInventorySha256: '0'.repeat(64),
    },
  ];

  for (const manifestOverrides of variants) {
    const fixture = createSmokeFixture(
      appDirectory,
      { [`${apex}/admin/login`]: response(200) },
      undefined,
      manifestOverrides,
    );
    await assert.rejects(fixture.run(), /build_provenance_(?:identity|route)/);
  }
});

test('new public dynamic route classes require an explicit reviewed probe', () => {
  const appDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-unprobeable-dynamic-'),
  );
  writePage(appDirectory, '');
  writePage(appDirectory, 'admin/login');
  writePage(appDirectory, 'events/[eventId]');

  assert.throws(
    () => discoverPublicPageRouteInventory({ appDirectory }),
    /public_dynamic_route_probe_missing/,
  );
});

test('an alternate Pages Router source fails closed instead of bypassing the app inventory', () => {
  const websiteRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-pages-router-'),
  );
  const appDirectory = path.join(websiteRoot, 'app');
  writePage(appDirectory, '');
  writePage(appDirectory, 'admin/login');
  const pagesIndex = path.join(websiteRoot, 'pages', 'index.tsx');
  fs.mkdirSync(path.dirname(pagesIndex), { recursive: true });
  fs.writeFileSync(
    pagesIndex,
    'export default function Page() { return null; }\n',
  );

  assert.throws(
    () => discoverPublicPageRouteInventory({ appDirectory }),
    /public_route_inventory_unsupported_pages_router/,
  );
});

test('untracked build-affecting source prevents provenance generation', () => {
  const websiteRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'skr-pr305-untracked-source-'),
  );
  const nextDirectory = path.join(websiteRoot, '.next');
  const assetDirectory = path.join(nextDirectory, 'static', 'chunks');
  const untrackedPage = path.join(
    websiteRoot,
    'app',
    'unreviewed',
    'page.tsx',
  );
  fs.mkdirSync(assetDirectory, { recursive: true });
  fs.mkdirSync(path.dirname(untrackedPage), { recursive: true });
  fs.writeFileSync(path.join(nextDirectory, 'BUILD_ID'), buildId);
  fs.writeFileSync(path.join(assetDirectory, 'safe.js'), assetBody);
  fs.writeFileSync(
    untrackedPage,
    'export default function Page() { return null; }\n',
  );

  assert.throws(
    () =>
      generateProductionBuildProvenance({
        repoRoot: websiteRoot,
        websiteRoot,
        revision: reviewedSha,
        checkoutStatus: '?? website/app/unreviewed/page.tsx\0',
      }),
    /build_provenance_source_checkout_not_clean/,
  );
});

test('only narrow generated output is ignored while untracked build inputs fail closed', () => {
  const approvedGeneratedStatus = [
    '!! website/.next/',
    '!! website/node_modules/',
    '!! website/public/.well-known/skr-build-provenance.json',
    '!! website/tsconfig.tsbuildinfo',
  ].join('\0');

  assert.doesNotThrow(() =>
    assertSourceCheckoutClean(`${approvedGeneratedStatus}\0`),
  );

  const rejectedPaths = [
    'website/app/new/page.tsx',
    'website/app/api/new/route.ts',
    'website/components/NewComponent.tsx',
    'website/lib/new-module.ts',
    'website/next.config.mjs',
    'website/middleware.ts',
    'website/public/new-asset.js',
    'website/package.json',
    'website/.env',
  ];

  for (const candidate of rejectedPaths) {
    const status = candidate === 'website/.env' ? '!!' : '??';
    let error;

    try {
      assertSourceCheckoutClean(`${status} ${candidate}\0`);
    } catch (caught) {
      error = caught;
    }

    assert.equal(error?.message, 'build_provenance_source_checkout_not_clean');
    assert.doesNotMatch(
      JSON.stringify(safeFailureResult(error)),
      new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
});
