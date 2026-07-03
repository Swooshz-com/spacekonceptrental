const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const {
  runOwnerFlowSmoke,
} = require('./smoke-owner-flow-local.cjs');

const defaultRoutes = new Map([
  ['/', 200],
  ['/catalogue', 200],
  ['/listings', 200],
  ['/quote', 200],
  ['/admin', 401],
  ['/admin/enquiry-email', 401],
  ['/admin/delivery-log', 401],
  ['/admin/quotes', 404],
  ['/admin/quotes/smoke-test-reference', 404],
  ['/admin/content-readiness', 404],
  ['/admin/public-parity', 404],
  ['/admin/release-control', 404],
  ['/admin/listings', 404],
  ['/admin/categories', 404],
  ['/admin/media', 404],
]);

function makeResponse(status) {
  return {
    status,
    text: async () => '',
  };
}

async function runSmoke({
  env = {},
  fetchImpl,
  routes = defaultRoutes,
  spawnResult = { status: 1, stdout: '', stderr: 'not configured' },
} = {}) {
  const calls = [];
  const spawned = [];
  const stdout = [];
  const stderr = [];
  const fetcher =
    fetchImpl ??
    (async (url) => {
      const parsed = new URL(url);
      calls.push(parsed.pathname);

      return makeResponse(routes.get(parsed.pathname) ?? 404);
    });

  const result = await runOwnerFlowSmoke({
    env,
    fetch: fetcher,
    log: (line) => stdout.push(line),
    error: (line) => stderr.push(line),
    spawnSync: (command, args) => {
      spawned.push([command, ...args]);
      return spawnResult;
    },
  });

  return {
    calls,
    output: [...stdout, ...stderr].join('\n'),
    result,
    spawned,
  };
}

test('server unavailable gives a clear manual next step', async () => {
  const { output, result } = await runSmoke({
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:3000');
    },
  });

  assert.equal(result.ok, false);
  assert.match(output, /^FAIL/m);
  assert.match(output, /local SKR server is not reachable/i);
  assert.match(output, /cd website && npm run dev/i);
});

test('public owner-path routes are checked', async () => {
  const { calls, result } = await runSmoke();

  assert.equal(result.ok, true);
  assert.deepEqual(
    ['/', '/catalogue', '/listings', '/quote'].every((route) =>
      calls.includes(route),
    ),
    true,
  );
});

test('protected admin owner routes are checked for unauthenticated behaviour', async () => {
  const { calls, output, result } = await runSmoke();

  assert.equal(result.ok, true);
  assert.deepEqual(
    ['/admin', '/admin/enquiry-email', '/admin/delivery-log'].every((route) =>
      calls.includes(route),
    ),
    true,
  );
  assert.match(output, /PASS admin route \/admin\/enquiry-email/i);
  assert.match(output, /PASS admin route \/admin\/delivery-log/i);
});

test('removed admin routes are checked as non-success', async () => {
  const { calls, output, result } = await runSmoke();

  assert.equal(result.ok, true);
  assert.deepEqual(
    [
      '/admin/quotes',
      '/admin/quotes/smoke-test-reference',
      '/admin/content-readiness',
      '/admin/public-parity',
      '/admin/release-control',
      '/admin/listings',
      '/admin/categories',
      '/admin/media',
    ].every((route) => calls.includes(route)),
    true,
  );
  assert.match(output, /PASS removed admin route \/admin\/quotes/i);
});

test('quote submission is skipped safely when email env is missing', async () => {
  const { output, result } = await runSmoke();

  assert.equal(result.ok, true);
  assert.match(output, /SKIP quote API live submission/i);
  assert.match(output, /QUOTE_ENQUIRY_EMAIL_RECIPIENT/);
  assert.match(output, /QUOTE_ENQUIRY_EMAIL_FROM/);
  assert.match(output, /RESEND_API_KEY/);
});

test('quote email runtime readiness command is invoked', async () => {
  const { output, result, spawned } = await runSmoke({
    spawnResult: { status: 0, stdout: 'configured', stderr: '' },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(spawned, [
    ['npm', 'run', 'validate:quote-email-runtime-readiness'],
  ]);
  assert.match(output, /PASS quote email runtime readiness command ran/i);
});

test('smoke output does not leak env values or customer message text', async () => {
  const { output } = await runSmoke({
    env: {
      SKR_OWNER_FLOW_LOCAL_BASE_URL: 'http://localhost:3000',
      RESEND_API_KEY: 'secret-value-that-must-not-print',
      QUOTE_ENQUIRY_EMAIL_RECIPIENT: 'owner@example.invalid',
    },
  });

  assert.doesNotMatch(output, /secret-value-that-must-not-print/);
  assert.doesNotMatch(output, /owner@example.invalid/);
  assert.doesNotMatch(output, /Please recommend/i);
});

test('unexpected 500 from a public route exits non-zero', async () => {
  const routes = new Map(defaultRoutes);

  routes.set('/catalogue', 500);

  const { output, result } = await runSmoke({ routes });

  assert.equal(result.ok, false);
  assert.match(output, /FAIL public route \/catalogue returned 500/i);
});

test('unexpected 500 from an admin route exits non-zero', async () => {
  const routes = new Map(defaultRoutes);

  routes.set('/admin/enquiry-email', 500);

  const { output, result } = await runSmoke({ routes });

  assert.equal(result.ok, false);
  assert.match(
    output,
    /FAIL admin route \/admin\/enquiry-email returned unexpected status 500/i,
  );
});

test('package exposes the owner flow local smoke script', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  );

  assert.equal(
    packageJson.scripts['smoke:owner-flow-local'],
    'node scripts/smoke-owner-flow-local.cjs',
  );
});
