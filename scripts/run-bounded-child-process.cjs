const { spawn } = require('node:child_process');

const defaultTimeoutMs = 180_000;
const defaultOutputLimitBytes = 64 * 1024;

const runtimeEnvironmentKeys = [
  'CI',
  'ComSpec',
  'HOME',
  'NODE_ENV',
  'PATH',
  'PATHEXT',
  'SystemRoot',
  'TEMP',
  'TMP',
  'USERPROFILE',
];

const joinedIntegrationEnvironmentKeys = [
  'ADMIN_CSRF_PROOF_SECRET',
  'ADMIN_EXPECTED_HOST',
  'ADMIN_EXPECTED_ORIGIN',
  'ADMIN_MUTATIONS_ENABLED',
  'ADMIN_TRUSTED_WORKSPACE_ID',
  'RUN49_ACCESS_TOKEN',
  'RUN49_CHILD_PRODUCT_ID',
  'RUN49_JOINED',
  'RUN49_SETUP_PRODUCT_ID',
  'RUN49_SUPABASE_URL',
  'RUN49_WORKSPACE_ID',
  'SUPABASE_ANON_KEY',
  'SUPABASE_URL',
];

function createMinimalChildEnvironment(source = process.env) {
  const environment = {};
  const allowedKeys = [
    ...runtimeEnvironmentKeys,
    ...joinedIntegrationEnvironmentKeys,
  ];

  for (const key of allowedKeys) {
    if (typeof source[key] === 'string') {
      environment[key] = source[key];
    }
  }

  return environment;
}

function createChildFailure(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  error.terminationConfirmed = details.terminationConfirmed === true;

  if (typeof details.signal === 'string') {
    error.signal = details.signal;
  }

  return error;
}

function normalizePositiveInteger(value, fallback) {
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function runBoundedChildProcess(command, args, options = {}) {
  const cwd = options.cwd;
  const env = options.env ?? createMinimalChildEnvironment();
  const timeoutMs = normalizePositiveInteger(
    options.timeoutMs,
    defaultTimeoutMs,
  );
  const maxStdoutBytes = normalizePositiveInteger(
    options.maxStdoutBytes,
    defaultOutputLimitBytes,
  );
  const maxStderrBytes = normalizePositiveInteger(
    options.maxStderrBytes,
    defaultOutputLimitBytes,
  );
  const spawnProcess = options.spawnProcess ?? spawn;

  return new Promise((resolve, reject) => {
    let child;
    let closeObserved = false;
    let settled = false;
    let terminationReason = null;
    let terminationTimer = null;
    let timeoutTimer = null;
    let stdoutBytes = 0;
    let stderrBytes = 0;

    const clearTimers = () => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      if (terminationTimer) {
        clearTimeout(terminationTimer);
        terminationTimer = null;
      }
    };

    const removeListeners = () => {
      if (!child) return;

      child.off('error', onError);
      child.off('close', onClose);
      child.stdout?.off('data', onStdout);
      child.stderr?.off('data', onStderr);
    };

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      clearTimers();
      removeListeners();
      callback();
    };

    const terminate = (reason) => {
      if (closeObserved || terminationReason) return;

      terminationReason = reason;
      try {
        child?.kill('SIGTERM');
      } catch {
        // The close event remains the termination confirmation.
      }

      terminationTimer = setTimeout(() => {
        if (closeObserved) return;

        try {
          child?.kill('SIGKILL');
        } catch {
          // The process close event determines the final outcome.
        }
      }, 1_000);
      terminationTimer.unref?.();
    };

    const onStdout = (chunk) => {
      stdoutBytes += Buffer.isBuffer(chunk)
        ? chunk.length
        : Buffer.byteLength(String(chunk));
      if (stdoutBytes > maxStdoutBytes) {
        terminate('child_stdout_overflow');
      }
    };

    const onStderr = (chunk) => {
      stderrBytes += Buffer.isBuffer(chunk)
        ? chunk.length
        : Buffer.byteLength(String(chunk));
      if (stderrBytes > maxStderrBytes) {
        terminate('child_stderr_overflow');
      }
    };

    const onError = () => {
      if (child?.pid == null && !closeObserved) {
        finish(() => reject(createChildFailure('child_spawn_failed', {
          terminationConfirmed: true,
        })));
        return;
      }

      terminate('child_spawn_failed');
    };

    const onClose = (exitCode, signal) => {
      closeObserved = true;

      if (terminationReason) {
        finish(() => reject(createChildFailure(terminationReason, {
          terminationConfirmed: true,
        })));
        return;
      }

      if (signal) {
        finish(() => reject(createChildFailure('child_signaled', {
          signal,
          terminationConfirmed: true,
        })));
        return;
      }

      if (exitCode !== 0) {
        finish(() => reject(createChildFailure('child_exit_nonzero', {
          terminationConfirmed: true,
        })));
        return;
      }

      finish(() => resolve({
        exitCode,
        stdoutBytes,
        stderrBytes,
      }));
    };

    try {
      child = spawnProcess(command, args, {
        cwd,
        env,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch {
      finish(() => reject(createChildFailure('child_spawn_failed', {
        terminationConfirmed: true,
      })));
      return;
    }

    child.once('error', onError);
    child.once('close', onClose);
    child.stdout?.on('data', onStdout);
    child.stderr?.on('data', onStderr);

    timeoutTimer = setTimeout(() => terminate('child_timeout'), timeoutMs);
    timeoutTimer.unref?.();
  });
}

module.exports = {
  createMinimalChildEnvironment,
  runBoundedChildProcess,
};
