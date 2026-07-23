#!/usr/bin/env node

const crypto = require('node:crypto');
const path = require('node:path');
const {
  calculateInventoryDigest,
} = require('../website/scripts/generate-production-build-provenance.cjs');
const {
  RouteInventoryContractError,
  calculateRouteInventoryDigest,
  discoverPublicPageRouteInventory: discoverPublicPageRouteInventoryImpl,
  maxPublicRouteCount,
  validateRouteInventory,
} = require('../website/scripts/production-smoke-route-inventory.cjs');

const productionBaseEnvName = 'SKR_PRODUCTION_BASE_URL';
const productionExpectedRevisionEnvName = 'SKR_PRODUCTION_EXPECTED_SHA';
const productionExpectedBuildIdEnvName = 'SKR_PRODUCTION_EXPECTED_BUILD_ID';
const canonicalApexHost = 'spacekonceptrental.com';
const approvedWwwHost = `www.${canonicalApexHost}`;
const canonicalApexOrigin = `https://${canonicalApexHost}`;
const approvedWwwOrigin = `https://${approvedWwwHost}`;
const requestTimeoutMs = 10_000;
const maxBodyBytes = 128 * 1024;
const maxBuildProvenanceBytes = 64 * 1024;
const maxClientAssetBytes = 512 * 1024;
const leakageScanOverlapCharacters = 4096;
const maxClientAssetCount = 96;
const safeMethods = new Set(['GET', 'HEAD']);
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const repoRoot = path.resolve(__dirname, '..');
const defaultAppDirectory = path.join(repoRoot, 'website', 'app');
const buildProvenancePath =
  '/.well-known/skr-build-provenance.json';
const revisionPattern = /^[0-9a-f]{40}$/;
const buildIdPattern = /^[A-Za-z0-9._-]{8,128}$/;
const digestPattern = /^[0-9a-f]{64}$/;

const boundaryRouteChecks = [
  { path: '/contact', expectedStatuses: [404] },
  {
    path: '/admin',
    expectedStatuses: [301, 302, 303, 307, 308, 401, 403],
    anonymousAdminBoundary: true,
  },
];

const forbiddenPublicResponsePatterns = [
  {
    code: 'supabase_endpoint_material',
    pattern:
      /https:\/\/[a-z0-9](?:[a-z0-9-]{3,61}[a-z0-9])?\.supabase\.co(?=[:/\s"'<>]|$)/i,
  },
  {
    code: 'supabase_jwt_material',
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{20,}\b/,
  },
  {
    code: 'supabase_key_material',
    pattern: /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{16,}\b/,
  },
  { code: 'server_env_name', pattern: /\b(?:SUPABASE_(?:URL|ANON_KEY|SERVICE_ROLE_KEY)|ADMIN_CSRF_PROOF_SECRET|ADMIN_TRUSTED_WORKSPACE_ID|CATALOGUE_WORKSPACE_ID|QUOTE_WORKSPACE_ID|N8N_(?:CHAT|ENQUIRY_HANDOFF)_[A-Z0-9_]+)\b/i },
  { code: 'sql_detail', pattern: /\b(?:SQLSTATE|PostgreSQL query|relation ["'][^"']+["'] does not exist)\b/i },
  { code: 'stack_trace', pattern: /\b(?:stack trace|Unhandled Runtime Error|Internal Server Error\s+at\s+)\b/i },
  { code: 'secret_material', pattern: /\b(?:github_pat_[A-Za-z0-9_]{20,}|(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}|service[_ -]?role[_ -]?key)\b/i },
  { code: 'internal_authority', pattern: /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?/i },
];

class SmokeContractError extends Error {
  constructor(code) {
    super(code);
    this.name = 'SmokeContractError';
    this.code = code;
  }
}

function fail(code) {
  throw new SmokeContractError(code);
}

function assertProductionBaseUrl(rawValue) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';

  if (!value) {
    fail('production_base_url_missing');
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    fail('production_base_url_invalid');
  }

  const hostname = parsed.hostname.toLowerCase();
  const approvedHost =
    hostname === canonicalApexHost || hostname === approvedWwwHost;
  const exactOriginShape = new RegExp(
    `^https:\\/\\/(?:${canonicalApexHost.replaceAll('.', '\\.')}` +
      `|${approvedWwwHost.replaceAll('.', '\\.')})\\/?$`,
    'i',
  ).test(value);

  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname && parsed.pathname !== '/') ||
    !approvedHost ||
    !exactOriginShape
  ) {
    fail('production_base_url_not_approved');
  }

  return Object.freeze({
    suppliedHost: hostname,
    routeOrigin: canonicalApexOrigin,
    wwwOrigin: approvedWwwOrigin,
  });
}

function assertSafeMethod(method) {
  const normalized = String(method).toUpperCase();

  if (!safeMethods.has(normalized)) {
    fail('unsafe_http_method');
  }

  return normalized;
}

function discoverPublicPageRouteInventory(options = {}) {
  try {
    return discoverPublicPageRouteInventoryImpl({
      appDirectory: options.appDirectory ?? defaultAppDirectory,
    });
  } catch (error) {
    if (error instanceof RouteInventoryContractError) {
      fail(error.code);
    }
    throw error;
  }
}

function assertApprovedClientAssetPath(assetPath) {
  if (typeof assetPath !== 'string' || assetPath.includes('\\')) {
    fail('build_provenance_asset_entry_not_approved');
  }

  let target;

  try {
    target = new URL(assetPath, canonicalApexOrigin);
  } catch {
    fail('build_provenance_asset_entry_not_approved');
  }

  if (
    assetPath !== target.pathname ||
    assetPath.includes('%') ||
    target.origin !== canonicalApexOrigin ||
    target.username ||
    target.password ||
    target.port ||
    target.search ||
    target.hash ||
    !target.pathname.startsWith('/_next/static/') ||
    !target.pathname.endsWith('.js')
  ) {
    fail('build_provenance_asset_entry_not_approved');
  }

  return target.toString();
}

function assertExpectedRevision(rawValue) {
  if (typeof rawValue !== 'string' || !revisionPattern.test(rawValue)) {
    fail('build_provenance_expected_revision_invalid');
  }

  return rawValue;
}

function assertExpectedBuildId(rawValue) {
  if (typeof rawValue !== 'string' || !buildIdPattern.test(rawValue)) {
    fail('build_provenance_expected_build_id_invalid');
  }

  return rawValue;
}

function validateHostedBuildProvenance(
  candidate,
  expectedRevision,
  expectedBuildId,
) {
  if (
    !candidate ||
    typeof candidate !== 'object' ||
    Array.isArray(candidate) ||
    candidate.schemaVersion !== 2 ||
    candidate.reviewedSha !== expectedRevision ||
    candidate.buildId !== expectedBuildId ||
    candidate.trackedCheckoutClean !== true ||
    candidate.sourceCheckoutClean !== true ||
    !Number.isSafeInteger(candidate.routeCount) ||
    candidate.routeCount < 1 ||
    candidate.routeCount > maxPublicRouteCount ||
    !digestPattern.test(candidate.routeInventorySha256 ?? '') ||
    !Array.isArray(candidate.routes) ||
    candidate.routes.length !== candidate.routeCount ||
    !Number.isSafeInteger(candidate.assetCount) ||
    candidate.assetCount < 1 ||
    candidate.assetCount > maxClientAssetCount ||
    !digestPattern.test(candidate.inventorySha256 ?? '') ||
    !Array.isArray(candidate.assets) ||
    candidate.assets.length !== candidate.assetCount
  ) {
    fail('build_provenance_identity_mismatch');
  }

  let routes;

  try {
    routes = validateRouteInventory(candidate.routes);
  } catch (error) {
    if (error instanceof RouteInventoryContractError) {
      fail(error.code);
    }
    throw error;
  }

  if (
    calculateRouteInventoryDigest(routes) !==
    candidate.routeInventorySha256
  ) {
    fail('build_provenance_route_inventory_incomplete');
  }

  const assets = [];
  const seenPaths = new Set();

  for (const entry of candidate.assets) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      Array.isArray(entry) ||
      !digestPattern.test(entry.sha256 ?? '')
    ) {
      fail('build_provenance_asset_entry_not_approved');
    }

    const assetUrl = assertApprovedClientAssetPath(entry.path);
    if (seenPaths.has(entry.path)) {
      fail('build_provenance_asset_inventory_duplicate');
    }

    seenPaths.add(entry.path);
    assets.push(
      Object.freeze({
        path: entry.path,
        url: assetUrl,
        sha256: entry.sha256,
      }),
    );
  }

  const sortedAssets = [...assets].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
  if (
    sortedAssets.some((entry, index) => entry.path !== assets[index].path) ||
    calculateInventoryDigest(sortedAssets) !== candidate.inventorySha256
  ) {
    fail('build_provenance_asset_inventory_incomplete');
  }

  return Object.freeze({
    reviewedSha: candidate.reviewedSha,
    buildId: candidate.buildId,
    routes,
    assets: Object.freeze(sortedAssets),
  });
}

function assertSafeRedirect(location, options = {}) {
  if (!location) {
    fail('redirect_location_missing');
  }

  let target;

  try {
    target = new URL(location, options.sourceOrigin ?? canonicalApexOrigin);
  } catch {
    fail('redirect_location_invalid');
  }

  if (
    target.protocol !== 'https:' ||
    target.username ||
    target.password ||
    target.port ||
    target.hostname !== canonicalApexHost
  ) {
    fail('redirect_authority_not_canonical');
  }

  if (options.expectedPath && target.pathname !== options.expectedPath) {
    fail('redirect_path_unexpected');
  }

  return target;
}

async function readBoundedText(response, byteLimit = maxBodyBytes) {
  const reader = response.body?.getReader();

  if (!reader) {
    return '';
  }

  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    total += value.byteLength;

    if (total > byteLimit) {
      fail('response_body_too_large');
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks).toString('utf8');
}

function assertNoPublicLeakage(body) {
  for (const entry of forbiddenPublicResponsePatterns) {
    if (entry.pattern.test(body)) {
      fail(`public_response_leakage_${entry.code}`);
    }
  }
}

async function scanBoundedClientAsset(response) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    fail('client_asset_body_unreadable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const digest = crypto.createHash('sha256');
  let totalBytes = 0;
  let overlap = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxClientAssetBytes) {
      await reader.cancel();
      fail('client_asset_body_too_large');
    }

    digest.update(value);
    const text = decoder.decode(value, { stream: true });
    const scanWindow = overlap + text;
    assertNoPublicLeakage(scanWindow);
    overlap = scanWindow.slice(-leakageScanOverlapCharacters);
  }

  const finalText = overlap + decoder.decode();
  assertNoPublicLeakage(finalText);
  return digest.digest('hex');
}

function decodeHtmlAttributeValue(value) {
  return value.replace(
    /&(?:#(\d{1,7});?|#x([\da-f]{1,6});?|(?:amp|quot|apos|lt|gt);)/gi,
    (entity, decimal, hexadecimal) => {
      if (decimal || hexadecimal) {
        const codePoint = Number.parseInt(decimal ?? hexadecimal, decimal ? 10 : 16);

        try {
          return String.fromCodePoint(codePoint);
        } catch {
          return entity;
        }
      }

      return {
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': "'",
        '&lt;': '<',
        '&gt;': '>',
      }[entity.toLowerCase()];
    },
  );
}

function collectFirstPartyClientAssets(body, assetUrls) {
  const scriptTagPattern = /<script\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  const scriptSourcePattern =
    /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;

  for (const tagMatch of body.matchAll(scriptTagPattern)) {
    const sourceMatch = scriptSourcePattern.exec(tagMatch[0]);

    if (!sourceMatch) {
      continue;
    }

    const source = decodeHtmlAttributeValue(
      sourceMatch[1] ?? sourceMatch[2] ?? sourceMatch[3],
    );
    let target;

    try {
      target = new URL(source, canonicalApexOrigin);
    } catch {
      continue;
    }

    if (target.origin !== canonicalApexOrigin) {
      continue;
    }

    if (
      target.username ||
      target.password ||
      target.port ||
      target.search ||
      target.hash ||
      !target.pathname.startsWith('/_next/static/') ||
      !target.pathname.endsWith('.js')
    ) {
      fail('client_asset_reference_not_approved');
    }

    assetUrls.add(assertApprovedClientAssetPath(target.pathname));
    if (assetUrls.size > maxClientAssetCount) {
      fail('client_asset_count_exceeded');
    }
  }
}

async function safeFetch(fetchImpl, target, options = {}) {
  const method = assertSafeMethod(options.method ?? 'GET');
  const response = await fetchImpl(target, {
    method,
    redirect: 'manual',
    headers: {
      Accept: options.accept ?? 'text/html,application/xhtml+xml',
      'User-Agent': 'skr-production-readonly-smoke',
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  const location = response.headers.get('location');

  if (location) {
    assertSafeRedirect(location, { sourceOrigin: target.origin });
  }

  return response;
}

async function checkRoute(fetchImpl, check, assetUrls) {
  const target = new URL(check.path, canonicalApexOrigin);
  const response = await safeFetch(fetchImpl, target, { method: 'GET' });
  const body = await readBoundedText(response);

  assertNoPublicLeakage(body);

  if (!check.expectedStatuses.includes(response.status)) {
    fail(`route_${check.path.replace(/\W+/g, '_') || 'home'}_unexpected_status`);
  }

  if (response.status === 200) {
    collectFirstPartyClientAssets(body, assetUrls);
  }

  let disposition = 'served';

  if (check.anonymousAdminBoundary) {
    if (redirectStatuses.has(response.status)) {
      assertSafeRedirect(response.headers.get('location'), {
        sourceOrigin: canonicalApexOrigin,
        expectedPath: '/admin/login',
      });
      disposition = 'redirected_to_first_party_login';
    } else {
      disposition = 'denied';
    }
  }

  return Object.freeze({
    path: check.path,
    status: response.status,
    disposition,
  });
}

async function fetchHostedBuildProvenance(
  fetchImpl,
  expectedRevision,
  expectedBuildId,
) {
  const target = new URL(buildProvenancePath, canonicalApexOrigin);
  const response = await safeFetch(fetchImpl, target, {
    method: 'GET',
    accept: 'application/json',
  });

  if (response.status !== 200) {
    fail('build_provenance_status_unexpected');
  }

  const body = await readBoundedText(response, maxBuildProvenanceBytes);
  assertNoPublicLeakage(body);

  let candidate;

  try {
    candidate = JSON.parse(body);
  } catch {
    fail('build_provenance_invalid');
  }

  return validateHostedBuildProvenance(
    candidate,
    expectedRevision,
    expectedBuildId,
  );
}

async function checkClientAssets(fetchImpl, buildProvenance, referencedAssets) {
  const approvedAssetUrls = new Set(
    buildProvenance.assets.map((asset) => asset.url),
  );

  for (const referencedAsset of referencedAssets) {
    if (!approvedAssetUrls.has(referencedAsset)) {
      fail('client_asset_reference_not_in_build_provenance');
    }
  }

  for (const asset of buildProvenance.assets) {
    const target = new URL(asset.url);
    const response = await safeFetch(fetchImpl, target, {
      method: 'GET',
      accept: 'application/javascript,text/javascript',
    });

    if (response.status !== 200) {
      fail('client_asset_status_unexpected');
    }

    const digest = await scanBoundedClientAsset(response);
    if (digest !== asset.sha256) {
      fail('client_asset_digest_mismatch');
    }
  }
}

async function checkWwwRedirect(fetchImpl) {
  const target = new URL('/', approvedWwwOrigin);
  const response = await safeFetch(fetchImpl, target, { method: 'GET' });
  const body = await readBoundedText(response);

  assertNoPublicLeakage(body);

  if (!redirectStatuses.has(response.status)) {
    fail('www_canonical_redirect_status_unexpected');
  }

  const redirect = assertSafeRedirect(response.headers.get('location'), {
    sourceOrigin: approvedWwwOrigin,
    expectedPath: '/',
  });

  if (redirect.origin !== canonicalApexOrigin || redirect.search || redirect.hash) {
    fail('www_canonical_redirect_target_unexpected');
  }

  return Object.freeze({
    path: '/',
    source: 'approved_www',
    status: response.status,
    disposition: 'redirected_to_canonical_apex',
  });
}

async function runProductionReadOnlySmoke(options = {}) {
  const baseContract = assertProductionBaseUrl(options.rawBaseUrl);
  const expectedRevision = assertExpectedRevision(options.rawExpectedRevision);
  const expectedBuildId = assertExpectedBuildId(options.rawExpectedBuildId);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    fail('fetch_unavailable');
  }

  const results = [];
  const referencedClientAssetUrls = new Set();
  const buildProvenance = await fetchHostedBuildProvenance(
    fetchImpl,
    expectedRevision,
    expectedBuildId,
  );
  const routeChecks = [
    ...buildProvenance.routes.map((route) =>
      Object.freeze({
        path: route.path,
        expectedStatuses: route.expectedStatuses,
      }),
    ),
    ...boundaryRouteChecks,
  ];

  for (const check of routeChecks) {
    results.push(
      await checkRoute(fetchImpl, check, referencedClientAssetUrls),
    );
  }

  results.push(await checkWwwRedirect(fetchImpl));
  await checkClientAssets(
    fetchImpl,
    buildProvenance,
    referencedClientAssetUrls,
  );

  return Object.freeze({
    schemaVersion: 1,
    outcome: 'passed',
    target: 'skr_canonical_production',
    suppliedHostClass:
      baseContract.suppliedHost === canonicalApexHost ? 'apex' : 'approved_www',
    methodsUsed: ['GET'],
    quoteSubmissionAttempted: false,
    oauthInitiated: false,
    authenticated: false,
    publicRoutesDiscovered: buildProvenance.routes.length,
    reviewedRevisionVerified: true,
    deployedBuildIdentityVerified: true,
    deployedClientAssetsDiscovered: buildProvenance.assets.length,
    clientAssetsScanned: buildProvenance.assets.length,
    results,
  });
}

function safeFailureResult(error) {
  return {
    schemaVersion: 1,
    outcome: 'failed',
    errorCode:
      error instanceof SmokeContractError ? error.code : 'request_failed',
  };
}

if (require.main === module) {
  runProductionReadOnlySmoke({
    rawBaseUrl: process.env[productionBaseEnvName],
    rawExpectedRevision: process.env[productionExpectedRevisionEnvName],
    rawExpectedBuildId: process.env[productionExpectedBuildIdEnvName],
  })
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${JSON.stringify(safeFailureResult(error))}\n`);
      process.exitCode = 1;
    });
}

module.exports = {
  SmokeContractError,
  assertProductionBaseUrl,
  assertSafeMethod,
  discoverPublicPageRouteInventory,
  runProductionReadOnlySmoke,
  safeFailureResult,
  validateHostedBuildProvenance,
};
