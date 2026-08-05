const assert = require('node:assert/strict');
const test = require('node:test');
const { waitForStablePostgres } = require('./wait-for-postgres-readiness.cjs');

test('waits through initialization shutdown and socket loss before final readiness', () => {
  const states = [
    { initializationComplete: false, probeReady: true },
    { initializationComplete: false, probeReady: false },
    { initializationComplete: true, probeReady: false },
    { initializationComplete: true, probeReady: true }
  ];
  let stateIndex = 0;
  const probeStates = [];

  const result = waitForStablePostgres({
    isInitializationComplete: () => states[stateIndex].initializationComplete,
    probe: () => {
      probeStates.push(stateIndex);
      return states[stateIndex].probeReady;
    },
    sleep: () => {
      stateIndex += 1;
    },
    now: () => stateIndex,
    timeoutMs: 10,
    pollIntervalMs: 1
  });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(probeStates, [2, 3]);
});

test('times out without exposing probe or connection details', () => {
  let sleeps = 0;
  const result = waitForStablePostgres({
    isInitializationComplete: () => true,
    probe: () => false,
    sleep: () => {
      sleeps += 1;
    },
    now: () => sleeps,
    timeoutMs: 2,
    pollIntervalMs: 1
  });

  assert.deepEqual(result, { ok: false, reason: 'timeout' });
  assert.ok(sleeps > 0);
});
