#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const defaultTimeoutMs = 45_000;
const defaultPollIntervalMs = 1_500;

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runCommand(command, args, options) {
  return options.spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env,
    windowsHide: true,
  });
}

function commandWorks(command, args, options) {
  const result = runCommand(command, args, options);

  if (result.error) {
    return {
      ok: false,
      error: result.error.message,
    };
  }

  return {
    ok: result.status === 0,
    error:
      result.status === 0
        ? ''
        : `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

function quotePowerShellLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function findWindowsDockerDesktopPath(options) {
  const candidates = [
    'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
    options.env.ProgramFiles
      ? path.join(
          options.env.ProgramFiles,
          'Docker',
          'Docker',
          'Docker Desktop.exe',
        )
      : null,
    options.env.LOCALAPPDATA
      ? path.join(options.env.LOCALAPPDATA, 'Docker', 'Docker Desktop.exe')
      : null,
  ].filter(Boolean);

  return candidates.find((candidate) => options.existsSync(candidate)) ?? null;
}

function startCommandForPlatform(options) {
  if (options.platform === 'win32') {
    const dockerDesktopPath = findWindowsDockerDesktopPath(options);
    const filePath = dockerDesktopPath
      ? quotePowerShellLiteral(dockerDesktopPath)
      : '"Docker Desktop"';

    return {
      command: 'powershell',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `Start-Process -WindowStyle Hidden -FilePath ${filePath}`,
      ],
      display: dockerDesktopPath
        ? `powershell Start-Process -WindowStyle Hidden -FilePath ${dockerDesktopPath}`
        : 'powershell Start-Process -WindowStyle Hidden -FilePath "Docker Desktop"',
      manualStep: 'Open Docker Desktop and wait until it reports that Docker is running.',
    };
  }

  if (options.platform === 'darwin') {
    return {
      command: 'open',
      args: ['-a', 'Docker'],
      display: 'open -a Docker',
      manualStep: 'Open Docker Desktop for Mac and wait until it reports that Docker is running.',
    };
  }

  if (options.platform === 'linux') {
    const systemctl = commandWorks('systemctl', ['--version'], options);

    if (systemctl.ok) {
      return {
        command: 'systemctl',
        args: ['--user', 'start', 'docker'],
        display: 'systemctl --user start docker',
        manualStep:
          'Start the local Docker daemon or Docker Desktop, then rerun the command.',
      };
    }

    return {
      command: null,
      args: [],
      display: 'manual Docker daemon start',
      manualStep:
        'Start the local Docker daemon or Docker Desktop, then rerun the command. This helper will not use sudo.',
    };
  }

  return {
    command: null,
    args: [],
    display: 'manual Docker daemon start',
    manualStep:
      'Start Docker for this platform manually, then rerun the command. This helper will not guess an unknown platform startup command.',
  };
}

function normalizeOptions(options = {}) {
  return {
    cwd: options.cwd ?? path.resolve(__dirname, '..'),
    env: options.env ?? process.env,
    error: options.error ?? console.error,
    existsSync: options.existsSync ?? fs.existsSync,
    log: options.log ?? console.log,
    now: options.now ?? Date.now,
    platform: options.platform ?? process.platform,
    pollIntervalMs: options.pollIntervalMs ?? defaultPollIntervalMs,
    sleep: options.sleep ?? sleepSync,
    spawnSync: options.spawnSync ?? spawnSync,
    timeoutMs: options.timeoutMs ?? defaultTimeoutMs,
  };
}

function checkDockerCli(options) {
  return commandWorks('docker', ['--version'], options);
}

function checkDockerDaemon(options) {
  return commandWorks('docker', ['info'], options);
}

function ensureDockerRunning(inputOptions = {}) {
  const options = normalizeOptions(inputOptions);
  const cli = checkDockerCli(options);

  if (!cli.ok) {
    options.error('Docker readiness: Docker CLI was not found.');
    options.error('Install Docker Desktop, ensure docker is on PATH, then rerun npm run test:supabase-rls.');

    return {
      ok: false,
      cliExists: false,
      daemonResponsive: false,
      startupAttempted: false,
      attemptedCommand: null,
      waitedMs: 0,
      manualStep: 'Install Docker Desktop and ensure docker is on PATH.',
    };
  }

  options.log('Docker readiness: Docker CLI found.');

  const daemon = checkDockerDaemon(options);

  if (daemon.ok) {
    options.log('Docker readiness: Docker daemon is already responsive.');

    return {
      ok: true,
      cliExists: true,
      daemonResponsive: true,
      startupAttempted: false,
      attemptedCommand: null,
      waitedMs: 0,
      manualStep: null,
    };
  }

  const startCommand = startCommandForPlatform(options);
  let startupAttempted = false;

  if (startCommand.command) {
    startupAttempted = true;
    options.log(
      `Docker readiness: Docker daemon is not responsive; attempting to start Docker once using: ${startCommand.display}`,
    );

    runCommand(startCommand.command, startCommand.args, options);
  } else {
    options.error(
      `Docker readiness: Docker daemon is not responsive; no safe automatic startup command is available for ${options.platform}.`,
    );
  }

  const deadline = options.now() + options.timeoutMs;
  let waitedMs = 0;

  while (options.now() < deadline) {
    options.sleep(options.pollIntervalMs);
    waitedMs += options.pollIntervalMs;

    if (checkDockerDaemon(options).ok) {
      options.log(
        `Docker readiness: Docker daemon became responsive after ${waitedMs}ms.`,
      );

      return {
        ok: true,
        cliExists: true,
        daemonResponsive: true,
        startupAttempted,
        attemptedCommand: startCommand.display,
        waitedMs,
        manualStep: null,
      };
    }
  }

  options.error('Docker readiness: Docker daemon did not become responsive.');
  options.error(`Waited ${waitedMs}ms after startup check.`);
  options.error(`Attempted startup command: ${startCommand.display}.`);
  options.error(`Manual next step: ${startCommand.manualStep}`);

  return {
    ok: false,
    cliExists: true,
    daemonResponsive: false,
    startupAttempted,
    attemptedCommand: startCommand.display,
    waitedMs,
    manualStep: startCommand.manualStep,
  };
}

if (require.main === module) {
  const result = ensureDockerRunning();

  process.exit(result.ok ? 0 : 1);
}

module.exports = {
  ensureDockerRunning,
};
