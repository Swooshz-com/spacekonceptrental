const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const helperPath = path.join(repoRoot, 'scripts', 'ensure-docker-running.cjs');

const {
  ensureDockerRunning,
} = require('./ensure-docker-running.cjs');

function makeSpawn(sequence, calls) {
  return (command, args) => {
    calls.push({ command, args });

    const next = sequence.shift();

    if (next instanceof Error) {
      return { error: next };
    }

    return next ?? { status: 0, stdout: '', stderr: '' };
  };
}

function runHelper({
  env = {},
  existsSync = () => false,
  platform = 'win32',
  sequence,
  timeoutMs = 100,
} = {}) {
  const calls = [];
  const stdout = [];
  const stderr = [];
  let currentTime = 0;
  const result = ensureDockerRunning({
    env,
    existsSync,
    platform,
    pollIntervalMs: 25,
    timeoutMs,
    now: () => currentTime,
    sleep: (ms) => {
      currentTime += ms;
    },
    log: (line) => stdout.push(line),
    error: (line) => stderr.push(line),
    spawnSync: makeSpawn(sequence, calls),
  });

  return {
    calls,
    output: [...stdout, ...stderr].join('\n'),
    result,
  };
}

test('Docker already running exits success without attempting startup', () => {
  const { calls, result } = runHelper({
    sequence: [
      { status: 0, stdout: 'Docker version 29', stderr: '' },
      { status: 0, stdout: 'Server ready', stderr: '' },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.cliExists, true);
  assert.equal(result.daemonResponsive, true);
  assert.equal(result.startupAttempted, false);
  assert.deepEqual(calls.map((call) => [call.command, call.args]), [
    ['docker', ['--version']],
    ['docker', ['info']],
  ]);
});

test('missing Docker CLI exits with a clear message', () => {
  const { output, result } = runHelper({
    sequence: [new Error('spawn docker ENOENT')],
  });

  assert.equal(result.ok, false);
  assert.equal(result.cliExists, false);
  assert.match(output, /Docker CLI was not found/i);
  assert.match(output, /Install Docker Desktop/i);
});

test('Docker CLI present with daemon off attempts Windows Docker Desktop startup once', () => {
  const dockerDesktopPath = 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe';
  const { calls, output, result } = runHelper({
    existsSync: (candidate) => candidate === dockerDesktopPath,
    sequence: [
      { status: 0, stdout: 'Docker version 29', stderr: '' },
      { status: 1, stdout: '', stderr: 'daemon unavailable' },
      { status: 0, stdout: '', stderr: '' },
      { status: 0, stdout: 'Server ready', stderr: '' },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.startupAttempted, true);
  assert.match(result.attemptedCommand, /Start-Process/);
  assert.match(result.attemptedCommand, /Docker Desktop\.exe/);
  assert.match(output, /attempting to start Docker once/i);
  assert.equal(
    calls.filter((call) => call.command === 'powershell').length,
    1,
  );
});

test('Docker startup timeout exits non-zero with bounded wait details', () => {
  const { output, result } = runHelper({
    platform: 'darwin',
    sequence: [
      { status: 0, stdout: 'Docker version 29', stderr: '' },
      { status: 1, stdout: '', stderr: 'daemon unavailable' },
      { status: 0, stdout: '', stderr: '' },
      { status: 1, stdout: '', stderr: 'still unavailable' },
      { status: 1, stdout: '', stderr: 'still unavailable' },
      { status: 1, stdout: '', stderr: 'still unavailable' },
      { status: 1, stdout: '', stderr: 'still unavailable' },
    ],
    timeoutMs: 75,
  });

  assert.equal(result.ok, false);
  assert.equal(result.cliExists, true);
  assert.equal(result.startupAttempted, true);
  assert.equal(result.waitedMs, 75);
  assert.match(output, /Docker daemon did not become responsive/i);
  assert.match(output, /Waited 75ms/i);
  assert.match(output, /open -a Docker/i);
});

test('Docker readiness output does not leak environment values', () => {
  const { output } = runHelper({
    env: {
      PATH: process.env.PATH,
      RESEND_API_KEY: 'secret-value-that-must-not-print',
      GH_TOKEN: 'github-token-that-must-not-print',
    },
    sequence: [new Error('spawn docker ENOENT')],
  });

  assert.doesNotMatch(output, /secret-value-that-must-not-print/);
  assert.doesNotMatch(output, /github-token-that-must-not-print/);
});

test('Supabase RLS command is wired through the Docker readiness helper', () => {
  const rlsSource = fs.readFileSync(
    path.join(repoRoot, 'scripts', 'test-supabase-rls.cjs'),
    'utf8',
  );
  const helperSource = fs.readFileSync(helperPath, 'utf8');

  assert.match(rlsSource, /ensure-docker-running\.cjs/);
  assert.match(rlsSource, /ensureDockerRunning/);
  assert.match(helperSource, /timeoutMs/);
});

test('package exposes the Docker readiness helper test command', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  );

  assert.equal(
    packageJson.scripts['test:docker-readiness'],
    'node --test scripts/ensure-docker-running.test.cjs',
  );
});
