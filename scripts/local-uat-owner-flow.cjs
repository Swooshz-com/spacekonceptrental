#!/usr/bin/env node

const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');

const baseUrlEnvName = 'SKR_OWNER_FLOW_LOCAL_BASE_URL';
const fallbackBaseUrlEnvName = 'SKR_LOCAL_BASE_URL';
const defaultBaseUrl = 'http://localhost:3000';
const requestTimeoutMs = 5_000;
const defaultStartupTimeoutMs = 75_000;
const defaultSmokeTimeoutMs = 120_000;
const defaultPollIntervalMs = 1_000;
const maxChildLogLines = 20;
const alternatePorts = [3001, 3002, 3003, 3004, 3005];
const sensitiveLogPattern =
  /\b(?:secret|token|password|api[_-]?key|authorization|cookie)\b/i;
const unsafeExternalKillSuggestionPattern =
  /\b(?:taskkill\s+\/PID|kill\s+-|pkill\b|Stop-Process\b)/i;
const nextDevLockPatterns = [
  /another next dev server is already running/i,
  /\block exists\b/i,
  /same-project dev server/i,
  /dev server lock/i,
];

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function npmInvocationForPlatform(platform, args) {
  if (platform === 'win32') {
    return {
      args: ['/d', '/s', '/c', 'npm.cmd', ...args],
      command: 'cmd.exe',
      display: formatCommand('npm.cmd', args),
    };
  }

  return {
    args,
    command: 'npm',
    display: formatCommand('npm', args),
  };
}

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

function hasExplicitBaseUrl(env) {
  return Boolean(
    env[baseUrlEnvName]?.trim() || env[fallbackBaseUrlEnvName]?.trim(),
  );
}

function formatCommand(command, args) {
  return [command, ...args].join(' ');
}

async function isServerReachable(options, baseUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await options.fetch(baseUrl.toString(), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'skr-local-uat-owner-flow',
      },
      signal: controller.signal,
    });

    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.once('error', () => {
      resolve(false);
    });
    server.listen(
      {
        port,
      },
      () => {
        server.close(() => {
          resolve(true);
        });
      },
    );
  });
}

async function selectAlternatePort(options) {
  const tried = [];

  for (const port of alternatePorts) {
    tried.push(port);

    if (await options.isPortAvailable(port)) {
      return {
        port,
        tried,
      };
    }
  }

  return {
    port: null,
    tried,
  };
}

function captureBoundedChildOutput(child, lines) {
  const append = (chunk) => {
    const nextLines = String(chunk)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of nextLines) {
      lines.push(line);

      if (lines.length > maxChildLogLines) {
        lines.shift();
      }
    }
  };

  child.stdout?.on('data', append);
  child.stderr?.on('data', append);
}

function hasSensitiveEnvValue(options, line) {
  return Object.entries(options.env).some(([name, value]) => {
    if (
      !/(?:SECRET|TOKEN|KEY|PASSWORD|RESEND|GITHUB|GH_|SUPABASE|N8N)/i.test(
        name,
      )
    ) {
      return false;
    }

    return typeof value === 'string' && value.length >= 8 && line.includes(value);
  });
}

function redactStartupLine(options, line) {
  if (unsafeExternalKillSuggestionPattern.test(line)) {
    return '[redacted external process kill suggestion]';
  }

  if (sensitiveLogPattern.test(line) || hasSensitiveEnvValue(options, line)) {
    return '[redacted startup log line]';
  }

  return line.slice(0, 240);
}

function printStartupDiagnostics(options, lines) {
  if (lines.length === 0) {
    options.log('INFO no startup output was captured before the server stopped');
    return;
  }

  options.log('INFO recent startup output (bounded and redacted):');

  for (const line of lines.slice(-8)) {
    options.log(`INFO startup ${redactStartupLine(options, line)}`);
  }
}

function parseSafeLocalUrl(line) {
  const match = line.match(/https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:[/?#][^\s]*)?/i);

  if (!match) {
    return null;
  }

  try {
    const parsed = new URL(match[0]);

    parsed.pathname = '/';
    parsed.search = '';
    parsed.hash = '';
    parsed.username = '';
    parsed.password = '';

    return parsed.origin;
  } catch {
    return null;
  }
}

function inspectNextDevLock(lines) {
  const text = lines.join('\n');
  const detected = nextDevLockPatterns.some((pattern) => pattern.test(text));

  if (!detected) {
    return {
      detected: false,
      pid: null,
      url: null,
    };
  }

  let pid = null;
  let url = null;

  for (const line of lines) {
    if (!pid) {
      const pidMatch =
        line.match(/\bPID:\s*(\d{2,})\b/i) ||
        line.match(/\bPID\s*[= ]\s*(\d{2,})\b/i) ||
        line.match(/\/PID\s+(\d{2,})\b/i);

      if (pidMatch) {
        pid = pidMatch[1];
      }
    }

    const nextUrl = parseSafeLocalUrl(line);

    if (nextUrl) {
      url = nextUrl;
    }
  }

  return {
    detected: true,
    pid,
    url,
  };
}

function printNextDevLockDiagnostics(options, context) {
  options.error('FAIL suspected existing Next dev server lock');
  options.error(`Checked URL: ${context.baseUrl.origin}`);

  if (context.selectedPort) {
    const label = context.fallbackAttempted
      ? 'Selected fallback port'
      : 'Selected port';
    options.error(`${label}: ${context.selectedPort}`);
  }

  if (context.candidatePortsTried.length > 0) {
    options.error(
      `Candidate ports tried: ${context.candidatePortsTried.join(', ')}`,
    );
  }

  if (context.lockInfo.pid) {
    options.error(`Existing Next PID: ${context.lockInfo.pid}`);
  }

  if (context.lockInfo.url) {
    options.error(`Existing Next URL: ${context.lockInfo.url}`);
  }

  options.error('No external server was killed or modified.');
  options.error(
    'Manual next steps: inspect the existing process, stop the existing Next dev server manually, or restart the terminal or editor session, then rerun `npm run local-uat:owner-flow`.',
  );

  if (context.lockInfo.pid && options.platform === 'win32') {
    options.error(
      `Inspect on Windows: tasklist /FI "PID eq ${context.lockInfo.pid}"`,
    );
  } else if (context.lockInfo.pid) {
    options.error(
      `Inspect on macOS/Linux: ps -p ${context.lockInfo.pid} -o pid,comm,args`,
    );
  }
}

function spawnCommand(options, command, args, spawnOptions) {
  return options.spawn(command, args, {
    cwd: spawnOptions.cwd,
    env: spawnOptions.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

function stopChildProcess(options, child) {
  if (!child) {
    return;
  }

  if (options.platform === 'win32' && child.pid) {
    const result = options.spawnSync(
      'taskkill',
      ['/PID', String(child.pid), '/T', '/F'],
      {
        encoding: 'utf8',
        stdio: 'ignore',
        windowsHide: true,
      },
    );

    if (!result.error && result.status === 0) {
      return;
    }
  }

  child.kill('SIGTERM');
}

function startWebsiteServer(options, env) {
  const devArgs = ['run', 'dev'];

  if (env.PORT) {
    devArgs.push('--', '--port', env.PORT);
  }

  const invocation = npmInvocationForPlatform(options.platform, devArgs);
  const cwd = path.join(options.cwd, 'website');
  const logs = [];
  let exit = null;
  let child = null;

  try {
    child = spawnCommand(options, invocation.command, invocation.args, {
      cwd,
      env,
    });
  } catch (error) {
    exit = {
      code: null,
      error,
      signal: null,
    };

    return {
      args: invocation.args,
      child: null,
      command: invocation.command,
      cwd,
      display: invocation.display,
      exit: () => exit,
      logs,
    };
  }

  captureBoundedChildOutput(child, logs);
  child.once('error', (error) => {
    exit = {
      code: null,
      error,
      signal: null,
    };
  });
  child.once('exit', (code, signal) => {
    exit = {
      code,
      signal,
    };
  });

  return {
    args: invocation.args,
    child,
    command: invocation.command,
    cwd,
    display: invocation.display,
    exit: () => exit,
    logs,
  };
}

function buildServerEnv(options, baseUrl) {
  const nextEnv = {
    ...options.env,
    [baseUrlEnvName]: baseUrl.origin,
  };

  if (baseUrl.port) {
    nextEnv.PORT = baseUrl.port;
  }

  return nextEnv;
}

function runSmokeCommand(options, env) {
  const invocation = npmInvocationForPlatform(options.platform, [
    'run',
    'smoke:owner-flow-local',
  ]);
  const logs = [];
  let child = null;

  try {
    child = spawnCommand(options, invocation.command, invocation.args, {
      cwd: options.cwd,
      env,
    });
  } catch (error) {
    return Promise.resolve({
      ok: false,
      code: null,
      error,
      signal: null,
      timedOut: false,
    });
  }

  captureBoundedChildOutput(child, logs);

  return new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      stopChildProcess(options, child);
      resolve({
        ok: false,
        code: null,
        error: null,
        signal: 'SIGTERM',
        timedOut: true,
      });
    }, options.smokeTimeoutMs);

    const settle = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };

    child.once('error', (error) => {
      settle({
        ok: false,
        code: null,
        error,
        signal: null,
        timedOut: false,
      });
    });
    child.once('exit', (code, signal) => {
      settle({
        ok: code === 0,
        code,
        error: null,
        signal,
        logs,
        timedOut: false,
      });
    });
  });
}

async function waitForServer(options, baseUrl, devServer) {
  const deadline = options.now() + options.startupTimeoutMs;
  let waitedMs = 0;

  while (options.now() < deadline) {
    const exit = devServer.exit();

    if (exit) {
      return {
        ok: false,
        exit,
        reason: 'early-exit',
        waitedMs,
      };
    }

    await options.sleep(options.pollIntervalMs);
    waitedMs += options.pollIntervalMs;

    if (await isServerReachable(options, baseUrl)) {
      return {
        ok: true,
        waitedMs,
      };
    }
  }

  return {
    ok: false,
    reason: 'timeout',
    waitedMs,
  };
}

function stopStartedServer(options, devServer) {
  if (!devServer) {
    return;
  }

  if (devServer.exit()) {
    return;
  }

  stopChildProcess(options, devServer.child);
}

function normalizeOptions(options = {}) {
  return {
    cwd: options.cwd ?? path.resolve(__dirname, '..'),
    env: options.env ?? process.env,
    error: options.error ?? console.error,
    fetch: options.fetch ?? fetch,
    isPortAvailable: options.isPortAvailable ?? isPortAvailable,
    log: options.log ?? console.log,
    now: options.now ?? Date.now,
    platform: options.platform ?? process.platform,
    pollIntervalMs: options.pollIntervalMs ?? defaultPollIntervalMs,
    sleep: options.sleep ?? sleep,
    smokeTimeoutMs: options.smokeTimeoutMs ?? defaultSmokeTimeoutMs,
    spawn: options.spawn ?? spawn,
    spawnSync: options.spawnSync ?? spawnSync,
    startupTimeoutMs: options.startupTimeoutMs ?? defaultStartupTimeoutMs,
  };
}

async function runLocalUatOwnerFlow(inputOptions = {}) {
  const options = normalizeOptions(inputOptions);
  const explicitBaseUrl = hasExplicitBaseUrl(options.env);
  let baseUrl = safeBaseUrl(options.env);
  let smokeEnv = buildServerEnv(options, baseUrl);
  let fallbackAttempted = false;
  let selectedPort = Number(baseUrl.port) || null;
  let candidatePortsTried = [];

  options.log(`INFO local UAT owner flow target ${baseUrl.origin}`);

  if (explicitBaseUrl) {
    options.log('INFO explicit local UAT base URL configured; alternate port fallback is disabled');
  }

  if (await isServerReachable(options, baseUrl)) {
    options.log('PASS local SKR server already reachable');

    const smoke = await runSmokeCommand(options, smokeEnv);

    if (!smoke.ok) {
      if (smoke.timedOut) {
        options.error(
          `FAIL owner-flow smoke command timed out after ${options.smokeTimeoutMs}ms`,
        );
      } else {
        options.error('FAIL owner-flow smoke command failed');
      }

      return {
        fallbackAttempted,
        ok: false,
        smokeExitCode: smoke.code,
        smokeTimedOut: smoke.timedOut,
        startedServer: false,
      };
    }

    options.log('PASS owner-flow smoke command completed');

    return {
      fallbackAttempted,
      ok: true,
      smokeExitCode: smoke.code,
      startedServer: false,
    };
  }

  if (!explicitBaseUrl && baseUrl.origin === defaultBaseUrl) {
    const defaultPortAvailable = await options.isPortAvailable(3000);

    if (!defaultPortAvailable) {
      options.log(
        `INFO default local UAT base URL was not reachable: ${defaultBaseUrl}`,
      );
      options.log('INFO port 3000 appears occupied; trying alternate local ports');

      const selection = await selectAlternatePort(options);
      fallbackAttempted = true;
      candidatePortsTried = selection.tried;

      if (!selection.port) {
        options.error('FAIL no alternate local UAT port was available');
        options.error(`Default URL checked: ${defaultBaseUrl}`);
        options.error(`Candidate ports tried: ${candidatePortsTried.join(', ')}`);
        options.error('No external server was killed or modified.');
        options.error(
          'Manual next step: stop or repair the unhealthy local server on port 3000, or set SKR_OWNER_FLOW_LOCAL_BASE_URL to a reachable local server and rerun `npm run local-uat:owner-flow`.',
        );

        return {
          candidatePortsTried,
          fallbackAttempted,
          ok: false,
          startedServer: false,
        };
      }

      selectedPort = selection.port;
      baseUrl = new URL(`http://localhost:${selection.port}`);
      smokeEnv = buildServerEnv(options, baseUrl);
      options.log(`INFO selected alternate local port ${selection.port}`);
    }
  }

  const devArgs = ['run', 'dev'];

  if (smokeEnv.PORT) {
    devArgs.push('--', '--port', smokeEnv.PORT);
  }

  const devCommand = npmInvocationForPlatform(options.platform, devArgs).display;
  let devServer = null;

  try {
    options.log(`INFO starting local SKR website server with ${devCommand}`);
    devServer = startWebsiteServer(options, smokeEnv);

    const readiness = await waitForServer(options, baseUrl, devServer);

    if (!readiness.ok && readiness.reason === 'early-exit') {
      const lockInfo = inspectNextDevLock(devServer.logs);
      const code = readiness.exit.code ?? 'null';
      const signal = readiness.exit.signal ?? 'null';
      const detail = readiness.exit.error
        ? ` startup error ${readiness.exit.error.message}`
        : ` exit code ${code} and signal ${signal}`;

      options.error(
        `FAIL local SKR website server exited before it became reachable with${detail}`,
      );
      if (fallbackAttempted) {
        options.error(
          `FAIL alternate local UAT server on ${baseUrl.origin} could not start; no external server was killed or modified.`,
        );
        if (candidatePortsTried.length > 0) {
          options.error(`Candidate ports tried: ${candidatePortsTried.join(', ')}`);
        }
      }
      if (lockInfo.detected) {
        printNextDevLockDiagnostics(options, {
          baseUrl,
          candidatePortsTried,
          fallbackAttempted,
          lockInfo,
          selectedPort,
        });
      }
      printStartupDiagnostics(options, devServer.logs);
      options.error(
        'Manual next step: run `cd website && npm run dev` directly, resolve the startup error, then rerun `npm run local-uat:owner-flow`.',
      );

      return {
        earlyExit: true,
        candidatePortsTried,
        fallbackAttempted,
        nextDevLockDetected: lockInfo.detected,
        nextDevLockPid: lockInfo.pid,
        nextDevLockUrl: lockInfo.url,
        ok: false,
        selectedPort,
        startedServer: true,
      };
    }

    if (!readiness.ok) {
      options.error('FAIL local SKR server did not become reachable');
      options.error(`Checked base URL: ${baseUrl.origin}`);
      options.error(`Attempted command: ${devCommand}`);
      options.error(`Waited ${readiness.waitedMs}ms`);
      printStartupDiagnostics(options, devServer.logs);
      options.error(
        'Manual next step: run `cd website && npm run dev` directly, wait for the server to report ready, then rerun `npm run local-uat:owner-flow`.',
      );

      return {
        candidatePortsTried,
        fallbackAttempted,
        ok: false,
        selectedPort,
        startedServer: true,
        timedOut: true,
        waitedMs: readiness.waitedMs,
      };
    }

    options.log(
      `PASS local SKR server became reachable after ${readiness.waitedMs}ms`,
    );

    const smoke = await runSmokeCommand(options, smokeEnv);

    if (!smoke.ok) {
      if (smoke.timedOut) {
        options.error(
          `FAIL owner-flow smoke command timed out after ${options.smokeTimeoutMs}ms`,
        );
      } else {
        options.error('FAIL owner-flow smoke command failed');
      }

      return {
        candidatePortsTried,
        fallbackAttempted,
        ok: false,
        selectedPort,
        smokeExitCode: smoke.code,
        smokeTimedOut: smoke.timedOut,
        startedServer: true,
      };
    }

    options.log('PASS owner-flow smoke command completed');

    return {
      candidatePortsTried,
      fallbackAttempted,
      ok: true,
      selectedPort,
      smokeExitCode: smoke.code,
      startedServer: true,
      waitedMs: readiness.waitedMs,
    };
  } finally {
    stopStartedServer(options, devServer);
  }
}

if (require.main === module) {
  runLocalUatOwnerFlow().then((result) => {
    process.exit(result.ok ? 0 : 1);
  });
}

module.exports = {
  runLocalUatOwnerFlow,
};
