const assert = require('node:assert/strict');
const test = require('node:test');
const {
  SmokeContractError,
  assertProductionBaseUrl,
  assertSafeMethod,
  runProductionReadOnlySmoke,
  safeFailureResult,
} = require('./smoke-production-readonly.cjs');

const apex = 'https://spacekonceptrental.com';
const www = 'https://www.spacekonceptrental.com';

function response(status, body = 'safe public response', headers = {}) {
  return new Response(body, { status, headers });
}

function createMockFetch(overrides = {}) {
  const calls = [];
  const defaults = new Map([
    [`${apex}/`, response(200)],
    [`${apex}/catalogue`, response(200)],
    [`${apex}/setups`, response(200)],
    [`${apex}/about`, response(200)],
    [`${apex}/quote`, response(200)],
    [`${apex}/contact`, response(404)],
    [
      `${apex}/admin`,
      response(307, '', { Location: `${apex}/admin/login` }),
    ],
    [
      `${www}/`,
      response(308, '', { Location: `${apex}/` }),
    ],
  ]);
  const configured = new Map([...defaults, ...Object.entries(overrides)]);

  return {
    calls,
    fetch: async (target, options) => {
      const url = target.toString();
      calls.push({ url, options });
      const configuredResponse = configured.get(url);

      if (!configuredResponse) {
        throw new Error('unmocked request');
      }

      return configuredResponse;
    },
  };
}

test('accepts only the canonical HTTPS apex and approved www origin', () => {
  assert.equal(
    assertProductionBaseUrl(apex).suppliedHost,
    'spacekonceptrental.com',
  );
  assert.equal(
    assertProductionBaseUrl(`${www}/`).suppliedHost,
    'www.spacekonceptrental.com',
  );

  const rejected = [
    '',
    'http://spacekonceptrental.com',
    'https://user:pass@spacekonceptrental.com',
    'https://spacekonceptrental.com?probe=1',
    'https://spacekonceptrental.com/#fragment',
    'https://spacekonceptrental.com:443',
    'https://spacekonceptrental.com/catalogue',
    'https://localhost',
    'https://127.0.0.1',
    'https://10.0.0.1',
    'https://preview.spacekonceptrental.com',
    'https://spacekonceptrental.com.example.invalid',
  ];

  for (const candidate of rejected) {
    assert.throws(
      () => assertProductionBaseUrl(candidate),
      SmokeContractError,
      candidate,
    );
  }
});

test('production smoke performs only safe manual-redirect GET requests', async () => {
  const mock = createMockFetch();
  const result = await runProductionReadOnlySmoke({
    rawBaseUrl: apex,
    fetchImpl: mock.fetch,
  });

  assert.equal(result.outcome, 'passed');
  assert.deepEqual(result.methodsUsed, ['GET']);
  assert.equal(result.quoteSubmissionAttempted, false);
  assert.equal(result.oauthInitiated, false);
  assert.equal(result.authenticated, false);
  assert.equal(mock.calls.length, 8);

  for (const call of mock.calls) {
    assert.equal(call.options.method, 'GET');
    assert.equal(call.options.redirect, 'manual');
    assert.doesNotMatch(call.url, /\/api\/admin\/login(?:\?|$)/);
    assert.doesNotMatch(call.url, /\/api\/quote(?:\?|$)/);
  }
});

test('unsafe mutation methods are rejected before a request can be issued', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.throws(() => assertSafeMethod(method), /unsafe_http_method/);
  }

  assert.equal(assertSafeMethod('GET'), 'GET');
  assert.equal(assertSafeMethod('HEAD'), 'HEAD');
});

test('anonymous admin must deny or redirect to the first-party login surface', async () => {
  const denied = createMockFetch({
    [`${apex}/admin`]: response(403),
  });
  const deniedResult = await runProductionReadOnlySmoke({
    rawBaseUrl: apex,
    fetchImpl: denied.fetch,
  });
  assert.equal(
    deniedResult.results.find((entry) => entry.path === '/admin').disposition,
    'denied',
  );

  const externalRedirect = createMockFetch({
    [`${apex}/admin`]: response(307, '', {
      Location: 'https://accounts.example.invalid/oauth',
    }),
  });
  await assert.rejects(
    runProductionReadOnlySmoke({
      rawBaseUrl: apex,
      fetchImpl: externalRedirect.fetch,
    }),
    /redirect_authority_not_canonical/,
  );
});

test('redirects cannot expose localhost or internal proxy authority', async () => {
  const mock = createMockFetch({
    [`${www}/`]: response(308, '', {
      Location: 'http://127.0.0.1:3000/',
    }),
  });

  await assert.rejects(
    runProductionReadOnlySmoke({
      rawBaseUrl: www,
      fetchImpl: mock.fetch,
    }),
    /redirect_authority_not_canonical/,
  );
});

test('public responses fail closed on obvious provider, SQL, stack, env, or secret leakage', async () => {
  const leakSamples = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SQLSTATE 42P01',
    'stack trace',
    'https://localhost:3000/internal',
  ];

  for (const leak of leakSamples) {
    const mock = createMockFetch({
      [`${apex}/about`]: response(200, leak),
    });

    await assert.rejects(
      runProductionReadOnlySmoke({
        rawBaseUrl: apex,
        fetchImpl: mock.fetch,
      }),
      /public_response_leakage/,
    );
  }
});

test('failure output is machine-readable and never includes the supplied URL', () => {
  const supplied = 'https://user:password@spacekonceptrental.com';
  let error;

  try {
    assertProductionBaseUrl(supplied);
  } catch (caught) {
    error = caught;
  }

  const output = JSON.stringify(safeFailureResult(error));
  assert.doesNotMatch(output, /user|password|spacekonceptrental\.com/);
  assert.match(output, /production_base_url_not_approved/);
});
