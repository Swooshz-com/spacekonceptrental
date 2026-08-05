const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const test = require('node:test');

const {
  createMinimalChildEnvironment,
  runBoundedChildProcess,
} = require('./run-bounded-child-process.cjs');

const nodeExecutable = process.execPath;

function childScript(source) {
  return ['-e', source];
}

async function startProbeServer() {
  const requests = [];
  const server = http.createServer((request, response) => {
    requests.push(request.url);
    request.resume();
    request.on('end', () => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('ok');
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  assert.equal(typeof address, 'object');

  return {
    requests,
    server,
    url: `http://127.0.0.1:${address.port}/rpc/probe`,
  };
}

async function closeProbeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('minimal environment is explicit and excludes unrelated secrets', () => {
  const environment = createMinimalChildEnvironment({
    PATH: 'path-value',
    RUN49_JOINED: '1',
    RUN49_ACCESS_TOKEN: 'token-value',
    RUN49_JWT_SECRET: 'jwt-secret-value',
    RUN49_DIAGNOSTIC_CONTROL_FILE: 'control-path',
    RUN49_OTHER_WORKSPACE_ID: 'other-workspace',
    RUN49_OTHER_SETUP_PRODUCT_ID: 'other-product',
    RUN49_UNAUTHORISED_AUTH_USER_ID: 'unauthorised-user',
    SUPABASE_ANON_KEY: 'anon-value',
    SUPABASE_SERVICE_ROLE_KEY: 'must-not-pass',
    RANDOM_SECRET: 'must-not-pass',
  });

  assert.deepEqual(environment, {
    PATH: 'path-value',
    RUN49_ACCESS_TOKEN: 'token-value',
    RUN49_JWT_SECRET: 'jwt-secret-value',
    RUN49_DIAGNOSTIC_CONTROL_FILE: 'control-path',
    RUN49_OTHER_WORKSPACE_ID: 'other-workspace',
    RUN49_OTHER_SETUP_PRODUCT_ID: 'other-product',
    RUN49_UNAUTHORISED_AUTH_USER_ID: 'unauthorised-user',
    RUN49_JOINED: '1',
    SUPABASE_ANON_KEY: 'anon-value',
  });
});

test('gateway remains responsive while the asynchronous child performs HTTP RPC', async () => {
  const probe = await startProbeServer();

  try {
    const result = await runBoundedChildProcess(
      nodeExecutable,
      childScript(`fetch(process.env.PROBE_URL).then(async (response) => {
        if (!response.ok || (await response.text()) !== "ok") process.exit(2);
      }).catch(() => process.exit(3));`),
      {
        env: { PATH: process.env.PATH ?? '', PROBE_URL: probe.url },
        timeoutMs: 5_000,
      },
    );

    assert.equal(result.exitCode, 0);
    assert.equal(probe.requests.length, 1);
  } finally {
    await closeProbeServer(probe.server);
  }
});

test('successful child execution captures bounded output without returning raw content', async () => {
  let child;
  const result = await runBoundedChildProcess(
    nodeExecutable,
    childScript('process.stdout.write("public-marker"); process.stderr.write("diagnostic-marker");'),
    {
      env: { PATH: process.env.PATH ?? '' },
      timeoutMs: 5_000,
      maxStdoutBytes: 64,
      maxStderrBytes: 64,
      spawnProcess: (...args) => {
        child = spawn(...args);
        return child;
      },
    },
  );

  assert.equal(result.exitCode, 0);
  assert.equal(result.stdoutBytes, 13);
  assert.equal(result.stderrBytes, 17);
  assert.equal(Object.hasOwn(result, 'stdout'), false);
  assert.equal(Object.hasOwn(result, 'stderr'), false);
  assert.equal(child.listenerCount('close'), 0);
  assert.equal(child.stdout.listenerCount('data'), 0);
  assert.equal(child.stderr.listenerCount('data'), 0);
});

test('non-zero exit, spawn failure and signal termination are categorized safely', async () => {
  await assert.rejects(
    runBoundedChildProcess(nodeExecutable, childScript('process.exit(7)'), {
      env: { PATH: process.env.PATH ?? '' },
      timeoutMs: 5_000,
    }),
    (error) => error.code === 'child_exit_nonzero' && error.terminationConfirmed,
  );

  await assert.rejects(
    runBoundedChildProcess('run-49-command-that-does-not-exist', [], {
      env: { PATH: process.env.PATH ?? '' },
      timeoutMs: 5_000,
    }),
    (error) => error.code === 'child_spawn_failed' && error.terminationConfirmed,
  );

  if (process.platform !== 'win32') {
    await assert.rejects(
      runBoundedChildProcess(
        nodeExecutable,
        childScript('process.kill(process.pid, "SIGTERM")'),
        { env: { PATH: process.env.PATH ?? '' }, timeoutMs: 5_000 },
      ),
      (error) => error.code === 'child_signaled' && error.terminationConfirmed,
    );
  }
});

test('timeout terminates the child and settles only after confirmed cleanup', async () => {
  let child;
  const startedAt = Date.now();
  await assert.rejects(
    runBoundedChildProcess(
      nodeExecutable,
      childScript('setInterval(() => {}, 1_000)'),
      {
        env: { PATH: process.env.PATH ?? '' },
        timeoutMs: 100,
        spawnProcess: (...args) => {
          child = spawn(...args);
          return child;
        },
      },
    ),
    (error) => error.code === 'child_timeout' && error.terminationConfirmed,
  );
  assert.ok(Date.now() - startedAt < 5_000);
  assert.equal(child.listenerCount('close'), 0);
  if (process.platform !== 'win32') {
    assert.throws(() => process.kill(child.pid, 0), { code: 'ESRCH' });
  }
});

test('stdout and stderr overflow fail closed and terminate the child', async () => {
  await assert.rejects(
    runBoundedChildProcess(
      nodeExecutable,
      childScript('process.stdout.write("x".repeat(2_000))'),
      {
        env: { PATH: process.env.PATH ?? '' },
        timeoutMs: 5_000,
        maxStdoutBytes: 128,
      },
    ),
    (error) => error.code === 'child_stdout_overflow' && error.terminationConfirmed,
  );

  await assert.rejects(
    runBoundedChildProcess(
      nodeExecutable,
      childScript('process.stderr.write("x".repeat(2_000))'),
      {
        env: { PATH: process.env.PATH ?? '' },
        timeoutMs: 5_000,
        maxStderrBytes: 128,
      },
    ),
    (error) => error.code === 'child_stderr_overflow' && error.terminationConfirmed,
  );
});

test('sequential child calls leave the gateway listener cleanly closable', async () => {
  const probe = await startProbeServer();

  try {
    for (let index = 0; index < 3; index += 1) {
      await runBoundedChildProcess(
        nodeExecutable,
        childScript(`fetch(process.env.PROBE_URL).then(() => {}).catch(() => process.exit(4));`),
        {
          env: { PATH: process.env.PATH ?? '', PROBE_URL: probe.url },
          timeoutMs: 5_000,
        },
      );
    }

    assert.equal(probe.requests.length, 3);
  } finally {
    await closeProbeServer(probe.server);
  }
});
