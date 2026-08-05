const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_POLL_INTERVAL_MS = 250;

function waitForStablePostgres({
  isInitializationComplete,
  probe,
  now = () => Date.now(),
  sleep = (milliseconds) => {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
  },
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}) {
  const startedAt = now();
  const deadline = startedAt + timeoutMs;
  let initializationComplete = false;

  while (now() < deadline) {
    if (!initializationComplete) {
      try {
        initializationComplete = Boolean(isInitializationComplete());
      } catch {
        initializationComplete = false;
      }

      if (!initializationComplete) {
        sleep(pollIntervalMs);
        continue;
      }
    }

    try {
      if (probe()) {
        return { ok: true };
      }
    } catch {
      // Keep polling until the bounded final-server deadline.
    }

    sleep(pollIntervalMs);
  }

  return { ok: false, reason: 'timeout' };
}

module.exports = {
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  waitForStablePostgres,
};
