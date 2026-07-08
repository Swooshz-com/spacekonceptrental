#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const baseUrlEnvName = 'SKR_OWNER_FLOW_LOCAL_BASE_URL';
const fallbackBaseUrlEnvName = 'SKR_LOCAL_BASE_URL';
const defaultBaseUrl = 'http://localhost:3000';
const requestTimeoutMs = 8_000;

const publicRoutes = [
  {
    path: '/',
    label: 'public route /',
    allowedStatuses: [200],
  },
  {
    path: '/catalogue',
    label: 'public route /catalogue',
    allowedStatuses: [200, 503],
  },
  {
    path: '/listings',
    label: 'public route /listings',
    allowedStatuses: [200, 503],
  },
  {
    path: '/quote',
    label: 'public route /quote',
    allowedStatuses: [200],
  },
];

const protectedAdminRoutes = [
  '/admin',
  '/admin/enquiry-email',
  '/admin/delivery-log',
];

const protectedAdminAllowedStatuses = [200, 302, 303, 307, 308, 401, 403, 503];

const removedAdminRoutes = [
  '/admin/quotes',
  '/admin/quotes/smoke-test-reference',
  '/admin/content-readiness',
  '/admin/public-parity',
  '/admin/release-control',
  '/admin/listings',
  '/admin/categories',
  '/admin/media',
];

const requiredQuoteEmailEnvNames = [
  'N8N_ENQUIRY_HANDOFF_WEBHOOK_URL',
  'N8N_ENQUIRY_HANDOFF_SHARED_SECRET',
];

function safeBaseUrl(env) {
  const rawValue =
    env[baseUrlEnvName]?.trim() ||
    env[fallbackBaseUrlEnvName]?.trim() ||
    defaultBaseUrl;

  try {
    const parsed = new URL(rawValue);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return new URL(defaultBaseUrl);
    }

    parsed.pathname = '/';
    parsed.search = '';
    parsed.hash = '';
    parsed.username = '';
    parsed.password = '';

    return parsed;
  } catch {
    return new URL(defaultBaseUrl);
  }
}

function buildUrl(baseUrl, pathname) {
  return new URL(pathname, baseUrl).toString();
}

function isSuccessStatus(status) {
  return status >= 200 && status < 400;
}

function formatStatus(status) {
  return `status ${status}`;
}

async function fetchRoute(fetchImpl, baseUrl, pathname) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetchImpl(buildUrl(baseUrl, pathname), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'skr-owner-flow-local-smoke',
      },
      signal: controller.signal,
    });

    return {
      ok: true,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function runQuoteEmailReadinessCommand(options) {
  return options.spawnSync('npm', ['run', 'validate:quote-email-runtime-readiness'], {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env,
    windowsHide: true,
  });
}

function recordPass(results, log, label) {
  results.passed += 1;
  log(`PASS ${label}`);
}

function recordSkip(results, log, label) {
  results.skipped += 1;
  log(`SKIP ${label}`);
}

function recordFail(results, error, label) {
  results.failed += 1;
  error(`FAIL ${label}`);
}

function serverUnavailableMessage() {
  return [
    'local SKR server is not reachable.',
    'Manual next step: start it with `cd website && npm run dev`, then rerun `npm run smoke:owner-flow-local`.',
    `If the server is not on ${defaultBaseUrl}, set ${baseUrlEnvName} to the local origin before rerunning.`,
  ].join(' ');
}

async function checkPublicRoutes(options, baseUrl, results) {
  for (const route of publicRoutes) {
    const response = await fetchRoute(options.fetch, baseUrl, route.path);

    if (!response.ok) {
      recordFail(results, options.error, `${route.label} ${serverUnavailableMessage()}`);
      return false;
    }

    if (response.status >= 500 && !route.allowedStatuses.includes(response.status)) {
      recordFail(
        results,
        options.error,
        `${route.label} returned ${response.status}`,
      );
      continue;
    }

    if (!route.allowedStatuses.includes(response.status)) {
      recordFail(
        results,
        options.error,
        `${route.label} returned unexpected ${formatStatus(response.status)}`,
      );
      continue;
    }

    recordPass(results, options.log, `${route.label} responded with ${formatStatus(response.status)}`);
  }

  return true;
}

async function checkProtectedAdminRoutes(options, baseUrl, results) {
  for (const pathname of protectedAdminRoutes) {
    const response = await fetchRoute(options.fetch, baseUrl, pathname);

    if (!response.ok) {
      recordFail(results, options.error, `admin route ${pathname} ${serverUnavailableMessage()}`);
      continue;
    }

    if (!protectedAdminAllowedStatuses.includes(response.status)) {
      recordFail(
        results,
        options.error,
        `admin route ${pathname} returned unexpected ${formatStatus(response.status)}`,
      );
      continue;
    }

    recordPass(
      results,
      options.log,
      `admin route ${pathname} responded with protected ${formatStatus(response.status)}`,
    );
  }
}

async function checkRemovedAdminRoutes(options, baseUrl, results) {
  for (const pathname of removedAdminRoutes) {
    const response = await fetchRoute(options.fetch, baseUrl, pathname);

    if (!response.ok) {
      recordFail(results, options.error, `removed admin route ${pathname} ${serverUnavailableMessage()}`);
      continue;
    }

    if (isSuccessStatus(response.status)) {
      recordFail(
        results,
        options.error,
        `removed admin route ${pathname} unexpectedly returned ${formatStatus(response.status)}`,
      );
      continue;
    }

    recordPass(
      results,
      options.log,
      `removed admin route ${pathname} returned non-success ${formatStatus(response.status)}`,
    );
  }
}

function checkQuoteEmailReadiness(options, results) {
  const result = runQuoteEmailReadinessCommand(options);

  if (result.error) {
    recordFail(
      results,
      options.error,
      'quote email runtime readiness command could not run. Manual next step: run `npm run test:quote-email-runtime-readiness`.',
    );
    return false;
  }

  if (result.status === 0) {
    recordPass(
      results,
      options.log,
      'quote email runtime readiness command ran and reported configured status',
    );
    return true;
  }

  recordSkip(
    results,
    options.log,
    'quote email runtime readiness command ran but handoff env is not configured for live delivery',
  );

  return false;
}

function checkQuoteSubmission(options, results) {
  recordSkip(
    results,
    options.log,
    [
      'quote API live submission skipped.',
      'No local mocked n8n handoff mode exists for the real /api/quote route, so the smoke script will not risk triggering a real handoff.',
      `For live handoff verification, configure server-side ${requiredQuoteEmailEnvNames.join(', ')} and run npm run validate:quote-email-runtime-readiness before manually submitting a safe quote.`,
    ].join(' '),
  );
}

function normalizeOptions(options = {}) {
  return {
    cwd: options.cwd ?? process.cwd(),
    env: options.env ?? process.env,
    error: options.error ?? console.error,
    fetch: options.fetch ?? fetch,
    log: options.log ?? console.log,
    spawnSync: options.spawnSync ?? spawnSync,
  };
}

async function runOwnerFlowSmoke(inputOptions = {}) {
  const options = normalizeOptions(inputOptions);
  const results = {
    failed: 0,
    passed: 0,
    skipped: 0,
  };
  const baseUrl = safeBaseUrl(options.env);

  options.log('PASS owner flow smoke target resolved to local server origin');

  const publicReachable = await checkPublicRoutes(options, baseUrl, results);

  if (publicReachable) {
    checkQuoteEmailReadiness(options, results);
    checkQuoteSubmission(options, results);
    await checkProtectedAdminRoutes(options, baseUrl, results);
    await checkRemovedAdminRoutes(options, baseUrl, results);
  }

  options.log(
    `owner_flow_smoke_summary:pass_${results.passed}:skip_${results.skipped}:fail_${results.failed}`,
  );

  return {
    ok: results.failed === 0,
    ...results,
  };
}

if (require.main === module) {
  runOwnerFlowSmoke().then((result) => {
    process.exit(result.ok ? 0 : 1);
  });
}

module.exports = {
  runOwnerFlowSmoke,
};
