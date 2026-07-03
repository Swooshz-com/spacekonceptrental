const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const {
  runLocalUatOwnerFlow,
} = require('./local-uat-owner-flow.cjs');

class MockChild extends EventEmitter {
  constructor() {
    super();
    this.killedWith = [];
    this.pid = MockChild.nextPid;
    MockChild.nextPid += 1;
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
  }

  kill(signal) {
    this.killedWith.push(signal);
    this.emit('exit', null, signal);

    return true;
  }
}

MockChild.nextPid = 1000;

function makeResponse(status) {
  return {
    status,
  };
}

async function runHelper({
  env = {},
  fetchResults = [200],
  portOpenResults = {},
  platform = 'linux',
  smokeAutoExit = true,
  smokeExit = 0,
  smokeTimeoutMs = 200,
  timeoutMs = 100,
  earlyDevExit = false,
  earlyDevStdout = '',
} = {}) {
  const stdout = [];
  const stderr = [];
  const spawned = [];
  const spawnSyncCalls = [];
  const children = [];
  let now = 0;
  const fetchCalls = [];

  const fetchImpl = async (url) => {
    fetchCalls.push(new URL(url).toString());
    const next = fetchResults.shift();

    if (next instanceof Error) {
      throw next;
    }

    return makeResponse(next ?? 200);
  };

  const spawnImpl = (command, args, options) => {
    const child = new MockChild();

    spawned.push({
      args,
      command,
      cwd: options.cwd,
      env: options.env,
    });
    children.push(child);

    if (args.includes('dev') && earlyDevExit) {
      queueMicrotask(() => {
        if (earlyDevStdout) {
          child.stdout.emit('data', earlyDevStdout);
        }

        child.emit('exit', 1, null);
      });
    }

    if (args.includes('smoke:owner-flow-local') && smokeAutoExit) {
      queueMicrotask(() => child.emit('exit', smokeExit, null));
    }

    return child;
  };

  const result = await runLocalUatOwnerFlow({
    cwd: repoRoot,
    env,
    error: (line) => stderr.push(line),
    fetch: fetchImpl,
    log: (line) => stdout.push(line),
    now: () => now,
    platform,
    pollIntervalMs: 25,
    isPortAvailable: async (port) => portOpenResults[port] ?? true,
    sleep: async (ms) => {
      now += ms;
    },
    smokeTimeoutMs,
    spawn: spawnImpl,
    spawnSync: (command, args) => {
      spawnSyncCalls.push({ args, command });

      return { status: 0, stdout: '', stderr: '' };
    },
    startupTimeoutMs: timeoutMs,
  });

  return {
    children,
    fetchCalls,
    output: [...stdout, ...stderr].join('\n'),
    result,
    spawned,
    spawnSyncCalls,
  };
}

test('server already reachable does not start child server and runs smoke command', async () => {
  const { children, output, result, spawned } = await runHelper({
    fetchResults: [200],
  });

  assert.equal(result.ok, true);
  assert.equal(result.startedServer, false);
  assert.equal(spawned.length, 1);
  assert.deepEqual(spawned[0].args, ['run', 'smoke:owner-flow-local']);
  assert.equal(children[0].killedWith.length, 0);
  assert.match(output, /PASS local SKR server already reachable/i);
});

test('explicit base URL unreachable does not try alternate port fallback', async () => {
  const { output, result, spawned } = await runHelper({
    env: {
      SKR_OWNER_FLOW_LOCAL_BASE_URL: 'http://localhost:3999',
    },
    fetchResults: [
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
    ],
    portOpenResults: {
      3001: true,
    },
    timeoutMs: 75,
  });

  assert.equal(result.ok, false);
  assert.equal(result.fallbackAttempted, false);
  assert.match(output, /INFO explicit local UAT base URL configured/i);
  assert.doesNotMatch(output, /alternate local port/i);
  assert.deepEqual(spawned.map((call) => call.args), [
    ['run', 'dev', '--', '--port', '3999'],
  ]);
});

test('default 3000 unreachable chooses alternate port and starts dev server with PORT', async () => {
  const { output, result, spawned } = await runHelper({
    fetchResults: [
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      200,
    ],
    portOpenResults: {
      3000: false,
      3001: true,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.fallbackAttempted, true);
  assert.equal(result.selectedPort, 3001);
  assert.match(output, /INFO default local UAT base URL was not reachable/i);
  assert.match(output, /INFO selected alternate local port 3001/i);
  assert.equal(spawned[0].cwd, path.join(repoRoot, 'website'));
  assert.equal(spawned[0].env.PORT, '3001');
  assert.deepEqual(spawned[0].args, ['run', 'dev', '--', '--port', '3001']);
});

test('alternate port server becomes reachable and smoke uses alternate base URL', async () => {
  const { result, spawned } = await runHelper({
    fetchResults: [
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      200,
    ],
    portOpenResults: {
      3000: false,
      3001: true,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(spawned[1].env.SKR_OWNER_FLOW_LOCAL_BASE_URL, 'http://localhost:3001');
});

test('unavailable alternate ports fail clearly without killing external server', async () => {
  const { children, output, result, spawned } = await runHelper({
    fetchResults: [new Error('ECONNREFUSED')],
    portOpenResults: {
      3000: false,
      3001: false,
      3002: false,
      3003: false,
      3004: false,
      3005: false,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.fallbackAttempted, true);
  assert.equal(result.startedServer, false);
  assert.deepEqual(spawned, []);
  assert.deepEqual(children, []);
  assert.match(output, /FAIL no alternate local UAT port was available/i);
  assert.match(output, /Candidate ports tried: 3001, 3002, 3003, 3004, 3005/i);
  assert.match(output, /No external server was killed/i);
});

test('alternate port startup early exit reports fallback context without killing external server', async () => {
  const { children, output, result, spawned } = await runHelper({
    earlyDevExit: true,
    earlyDevStdout: 'Another next dev server is already running.\n',
    fetchResults: [new Error('ECONNREFUSED'), new Error('ECONNREFUSED')],
    portOpenResults: {
      3000: false,
      3001: true,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.fallbackAttempted, true);
  assert.equal(result.selectedPort, 3001);
  assert.equal(spawned.length, 1);
  assert.deepEqual(children[0].killedWith, []);
  assert.match(output, /FAIL alternate local UAT server on http:\/\/localhost:3001 could not start/i);
  assert.match(output, /Candidate ports tried: 3001/i);
  assert.match(output, /no external server was killed/i);
  assert.match(output, /Another next dev server is already running/i);
});

test('server initially down starts dev server, waits until reachable, then runs smoke', async () => {
  const { children, output, result, spawned } = await runHelper({
    fetchResults: [
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      200,
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.startedServer, true);
  assert.deepEqual(spawned.map((call) => call.args), [
    ['run', 'dev', '--', '--port', '3000'],
    ['run', 'smoke:owner-flow-local'],
  ]);
  assert.deepEqual(children[0].killedWith, ['SIGTERM']);
  assert.match(output, /INFO starting local SKR website server/i);
  assert.match(output, /PASS local SKR server became reachable/i);
});

test('server never reachable fails with timeout and manual next step', async () => {
  const { output, result } = await runHelper({
    fetchResults: [
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
    ],
    timeoutMs: 75,
  });

  assert.equal(result.ok, false);
  assert.equal(result.timedOut, true);
  assert.match(output, /FAIL local SKR server did not become reachable/i);
  assert.match(output, /http:\/\/localhost:3000/i);
  assert.match(output, /npm run dev/i);
  assert.match(output, /Waited 75ms/i);
});

test('child server exits early before readiness fails clearly', async () => {
  const { output, result } = await runHelper({
    earlyDevExit: true,
    fetchResults: [new Error('ECONNREFUSED'), new Error('ECONNREFUSED')],
  });

  assert.equal(result.ok, false);
  assert.match(output, /FAIL local SKR website server exited before it became reachable/i);
  assert.match(output, /exit code 1/i);
});

test('early child startup output is bounded and redacted', async () => {
  const { output, result } = await runHelper({
    earlyDevExit: true,
    earlyDevStdout:
      'ready hint\nRESEND_API_KEY=secret-value-that-must-not-print\n',
    env: {
      RESEND_API_KEY: 'secret-value-that-must-not-print',
    },
    fetchResults: [new Error('ECONNREFUSED'), new Error('ECONNREFUSED')],
  });

  assert.equal(result.ok, false);
  assert.match(output, /INFO recent startup output/i);
  assert.match(output, /ready hint/i);
  assert.doesNotMatch(output, /secret-value-that-must-not-print/);
});

test('Windows uses npm.cmd for dev server and smoke commands', async () => {
  const { spawned } = await runHelper({
    fetchResults: [new Error('ECONNREFUSED'), 200],
    platform: 'win32',
  });

  assert.deepEqual(
    spawned.map((call) => call.command),
    ['cmd.exe', 'cmd.exe'],
  );
  assert.deepEqual(
    spawned.map((call) => call.args.slice(0, 5)),
    [
      ['/d', '/s', '/c', 'npm.cmd', 'run'],
      ['/d', '/s', '/c', 'npm.cmd', 'run'],
    ],
  );
});

test('Windows cleanup uses taskkill for the dev server process tree it started', async () => {
  const { children, result, spawnSyncCalls } = await runHelper({
    fetchResults: [new Error('ECONNREFUSED'), 200],
    platform: 'win32',
  });

  assert.equal(result.ok, true);
  assert.equal(result.startedServer, true);
  assert.deepEqual(children[0].killedWith, []);
  assert.deepEqual(spawnSyncCalls, [
    {
      args: ['/PID', String(children[0].pid), '/T', '/F'],
      command: 'taskkill',
    },
  ]);
});

test('does not kill an external server it did not start', async () => {
  const { children, result } = await runHelper({
    fetchResults: [200],
  });

  assert.equal(result.startedServer, false);
  assert.equal(children.length, 1);
  assert.deepEqual(children[0].killedWith, []);
});

test('smoke command timeout kills only the smoke child when server was external', async () => {
  const { children, output, result } = await runHelper({
    fetchResults: [200],
    smokeAutoExit: false,
    smokeTimeoutMs: 50,
  });

  assert.equal(result.ok, false);
  assert.equal(result.smokeTimedOut, true);
  assert.deepEqual(children[0].killedWith, ['SIGTERM']);
  assert.match(output, /FAIL owner-flow smoke command timed out/i);
});

test('output does not leak environment secret values', async () => {
  const { output } = await runHelper({
    env: {
      RESEND_API_KEY: 'secret-value-that-must-not-print',
      SKR_OWNER_FLOW_LOCAL_BASE_URL: 'http://user:pass@localhost:3000/path?token=secret',
    },
    fetchResults: [200],
  });

  assert.doesNotMatch(output, /secret-value-that-must-not-print/);
  assert.doesNotMatch(output, /user:pass/);
  assert.doesNotMatch(output, /token=secret/);
});

test('package exposes the local UAT owner flow script', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  );

  assert.equal(
    packageJson.scripts['local-uat:owner-flow'],
    'node scripts/local-uat-owner-flow.cjs',
  );
});
