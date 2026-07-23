#!/usr/bin/env node

const productionBaseEnvName = 'SKR_PRODUCTION_BASE_URL';
const canonicalApexHost = 'spacekonceptrental.com';
const approvedWwwHost = `www.${canonicalApexHost}`;
const canonicalApexOrigin = `https://${canonicalApexHost}`;
const approvedWwwOrigin = `https://${approvedWwwHost}`;
const requestTimeoutMs = 10_000;
const maxBodyBytes = 128 * 1024;
const maxClientAssetCount = 32;
const safeMethods = new Set(['GET', 'HEAD']);
const redirectStatuses = new Set([301, 302, 303, 307, 308]);

const routeChecks = [
  { path: '/', expectedStatuses: [200] },
  { path: '/catalogue', expectedStatuses: [200] },
  { path: '/setups', expectedStatuses: [200] },
  { path: '/about', expectedStatuses: [200] },
  { path: '/quote', expectedStatuses: [200] },
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

async function readBoundedText(response) {
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

    if (total > maxBodyBytes) {
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

function decodeHtmlAttributeValue(value) {
  return value.replace(
    /&(?:#(\d{1,7})|#x([\da-f]{1,6})|amp|quot|apos|lt|gt);/gi,
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
  const scriptTagPattern = /<script\b[^>]*>/gi;
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

    assetUrls.add(target.toString());

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

async function checkClientAssets(fetchImpl, assetUrls) {
  for (const assetUrl of assetUrls) {
    const target = new URL(assetUrl);
    const response = await safeFetch(fetchImpl, target, {
      method: 'GET',
      accept: 'application/javascript,text/javascript',
    });
    const body = await readBoundedText(response);

    assertNoPublicLeakage(body);

    if (response.status !== 200) {
      fail('client_asset_status_unexpected');
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
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    fail('fetch_unavailable');
  }

  const results = [];
  const clientAssetUrls = new Set();

  for (const check of routeChecks) {
    results.push(await checkRoute(fetchImpl, check, clientAssetUrls));
  }

  results.push(await checkWwwRedirect(fetchImpl));
  await checkClientAssets(fetchImpl, clientAssetUrls);

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
    clientAssetsScanned: clientAssetUrls.size,
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
  runProductionReadOnlySmoke,
  safeFailureResult,
};
