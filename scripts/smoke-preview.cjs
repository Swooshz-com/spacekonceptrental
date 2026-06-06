const previewBaseEnvName = 'SKR_PREVIEW_BASE_URL';
const maxBodyBytes = 128 * 1024;
const requestTimeoutMs = 10_000;

const publicPageChecks = [
  {
    path: '/',
    label: 'public home',
    allowedStatuses: [200],
  },
  {
    path: '/listings',
    label: 'public listings',
    allowedStatuses: [200, 503],
  },
  {
    path: '/categories',
    label: 'public categories',
    allowedStatuses: [200, 503],
  },
  {
    path: '/quote',
    label: 'public quote enquiry',
    allowedStatuses: [200],
  },
  {
    path: '/api/chat',
    label: 'public chat endpoint metadata',
    allowedStatuses: [200, 400, 405, 503],
  },
  {
    path: '/admin',
    label: 'anonymous admin boundary',
    allowedStatuses: [200, 302, 303, 401, 403, 503],
  },
];

const forbiddenPublicTerms = [
  /\bSUPABASE_/i,
  /\bNEXT_PUBLIC_/i,
  /\bN8N_CHAT_WEBHOOK/i,
  /\bADMIN_CSRF_PROOF_SECRET\b/i,
  /\bADMIN_TRUSTED_WORKSPACE_ID\b/i,
  /\bCATALOGUE_WORKSPACE_ID\b/i,
  /\bQUOTE_WORKSPACE_ID\b/i,
  /\bservice[-_ ]?role\b/i,
  /\binternal notes?\b/i,
  /\bcustomer-visible internal\b/i,
  /\bstack trace\b/i,
  /\bunhandled runtime error\b/i,
  /\bSQLSTATE\b/i,
  /\bpostgres(?:ql)?\b/i,
  /\btoken\b/i,
  /\bsecret\b/i,
  /\braw config\b/i,
  /\bworkspace id\b/i,
  /\bretrieval\b/i,
  /\brag\b/i,
  /\bpinecone\b/i,
  /\bembedding\b/i,
  /\brerank(?:ing)?\b/i,
  /\btranscript\b/i,
  /\bcart\b/i,
  /\bcheckout\b/i,
  /\bpayments?\b/i,
  /\bstock reservation\b/i,
  /\border fulfilment\b/i,
  /\bconfirmed booking\b/i,
  /\bonline ordering\b/i,
];

function fail(reason) {
  console.error(`preview_smoke_failed:${reason}`);
  process.exit(1);
}

function redactPreviewBaseUrl() {
  return '<redacted-preview-base-url>';
}

function isPrivateIpv4(hostname) {
  const parts = hostname.split('.').map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

function isPreviewLikeHost(hostname) {
  const previewSignals = [
    'preview',
    'staging',
    'review',
    'deploy-preview',
    '-git-',
    'git-',
    '.vercel.app',
    '.netlify.app',
    '.pages.dev',
    '.onrender.com',
    '.railway.app',
    '.fly.dev',
  ];

  return previewSignals.some((signal) => hostname.includes(signal));
}

function assertSafePreviewBaseUrl(rawValue) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';

  if (!value) {
    fail(`${previewBaseEnvName}_missing`);
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    fail('invalid_preview_base_url');
  }

  const hostname = parsed.hostname.toLowerCase();
  const forbiddenHost =
    hostname === 'localhost' ||
    hostname === '[::1]' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    isPrivateIpv4(hostname);

  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname && parsed.pathname !== '/') ||
    forbiddenHost ||
    !isPreviewLikeHost(hostname)
  ) {
    fail('unsafe_preview_base_url');
  }

  return new URL(parsed.origin);
}

function buildUrl(baseUrl, pathname) {
  const target = new URL(pathname, baseUrl);

  return target;
}

function assertNoForbiddenPublicTerms(label, body) {
  for (const pattern of forbiddenPublicTerms) {
    if (pattern.test(body)) {
      fail(`${label}_leaked_forbidden_public_term`);
    }
  }
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

async function runCheck(baseUrl, check) {
  const target = buildUrl(baseUrl, check.path);
  const response = await fetch(target, {
    method: 'GET',
    redirect: 'manual',
    headers: {
      'User-Agent': 'skr-preview-smoke',
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const body = await readBoundedText(response);

  if (!check.allowedStatuses.includes(response.status)) {
    fail(`${check.label.replace(/\s+/g, '_')}_unexpected_status_${response.status}`);
  }

  assertNoForbiddenPublicTerms(check.label.replace(/\s+/g, '_'), body);

  console.log(`preview_smoke_check:${check.path}:status_${response.status}`);
}

async function main() {
  const baseUrl = assertSafePreviewBaseUrl(process.env[previewBaseEnvName]);

  console.log(`preview_smoke_target:${redactPreviewBaseUrl()}`);
  console.log('preview_smoke_notice:operator_run_only_no_deployment');

  for (const check of publicPageChecks) {
    await runCheck(baseUrl, check);
  }

  console.log('preview_smoke_passed:no_deployment_performed');
}

main().catch((error) => {
  const message =
    error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : 'unknown_error';

  fail(`request_error_${message}`);
});
