"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { spawn } = require("node:child_process");

const EXPECTED_SHARP_VERSION = "0.35.3";
const SOURCE_WIDTH = 8;
const SOURCE_HEIGHT = 6;
const OUTPUT_WIDTH = 4;
const OUTPUT_HEIGHT = 3;
const MAX_OUTPUT_BYTES = 16 * 1024;
const WORKER_DEADLINE_MS = 5_000;
const GRACEFUL_EXIT_MS = 500;
const FORCED_EXIT_MS = 1_000;
const WORKER_PATH = path.join(__dirname, "validate-sharp-native-worker.cjs");

class SharpValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "SharpValidationError";
    Object.assign(this, details);
  }
}

function invariant(condition, message) {
  if (!condition) {
    throw new SharpValidationError(message);
  }
}

function validateWorkerReceipt(rawOutput) {
  invariant(
    typeof rawOutput === "string" &&
      Buffer.byteLength(rawOutput, "utf8") <= MAX_OUTPUT_BYTES,
    "Sharp worker output exceeded its bound",
  );
  let receipt;
  try {
    receipt = JSON.parse(rawOutput);
  } catch {
    throw new SharpValidationError("Sharp worker returned malformed output");
  }
  assert.deepEqual(
    Object.keys(receipt).sort(),
    ["format", "height", "outputBytes", "pngSignature", "version", "width"],
    "Sharp worker returned unexpected receipt fields",
  );
  invariant(
    receipt.version === EXPECTED_SHARP_VERSION,
    `Expected sharp ${EXPECTED_SHARP_VERSION}`,
  );
  invariant(
    receipt.width === OUTPUT_WIDTH &&
      receipt.height === OUTPUT_HEIGHT &&
      receipt.format === "png",
    "Sharp worker returned the wrong image result",
  );
  invariant(
    Number.isSafeInteger(receipt.outputBytes) &&
      receipt.outputBytes > 8 &&
      receipt.outputBytes <= 64 * 1024,
    "Sharp worker returned an invalid output size",
  );
  invariant(
    receipt.pngSignature === "89504e470d0a1a0a",
    "Sharp worker returned the wrong PNG signature",
  );
  return receipt;
}

function spawnNativeWorker() {
  return spawn(process.execPath, [WORKER_PATH], {
    cwd: path.resolve(__dirname, ".."),
    detached: false,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
}

function runWorker(options = {}) {
  const spawnChild = options.spawnChild ?? spawnNativeWorker;
  const deadlineMs = options.deadlineMs ?? WORKER_DEADLINE_MS;
  const gracefulExitMs = options.gracefulExitMs ?? GRACEFUL_EXIT_MS;
  const forcedExitMs = options.forcedExitMs ?? FORCED_EXIT_MS;
  const maxOutputBytes = options.maxOutputBytes ?? MAX_OUTPUT_BYTES;
  const schedule = options.setTimeout ?? setTimeout;
  const cancel = options.clearTimeout ?? clearTimeout;
  let child;
  try {
    child = spawnChild();
  } catch {
    return Promise.reject(
      new SharpValidationError("Sharp worker could not be executed", {
        phase: "spawn",
      }),
    );
  }

  if (!child || !child.stdout || !child.stderr) {
    if (child && typeof child.unref === "function") {
      child.unref();
    }
    return Promise.reject(
      new SharpValidationError("Sharp worker could not be executed", {
        phase: "spawn",
      }),
    );
  }

  return new Promise((resolve, reject) => {
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let state = "running";
    let terminalReason;
    let settled = false;
    let deadlineTimer;
    let gracefulTimer;
    let forcedTimer;
    let signalInFlight;
    let defendDetachedChildUntilClose = false;
    let spawnConfirmed =
      Number.isSafeInteger(child.pid) && child.pid > 0;
    const signalDeliveryFailures = new Set();

    function clearTimers() {
      for (const timer of [deadlineTimer, gracefulTimer, forcedTimer]) {
        if (timer !== undefined) {
          cancel(timer);
        }
      }
    }

    function detachProcessHandles() {
      child.stdout.destroy();
      child.stderr.destroy();
      if (typeof child.unref === "function") {
        child.unref();
      }
    }

    function removeChildLifecycleListeners() {
      child.removeListener("error", onChildError);
      child.removeListener("close", onChildClose);
    }

    function removeOwnedListeners({ preserveChildLifecycle = false } = {}) {
      child.stdout.removeListener("data", onStdoutData);
      child.stderr.removeListener("data", onStderrData);
      child.removeListener("spawn", onSpawn);
      if (!preserveChildLifecycle) {
        removeChildLifecycleListeners();
      }
    }

    function settle(error, receipt, options = {}) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimers();
      defendDetachedChildUntilClose =
        options.defendDetachedChildUntilClose === true;
      removeOwnedListeners({
        preserveChildLifecycle: defendDetachedChildUntilClose,
      });
      if (error) {
        reject(error);
      } else {
        resolve(receipt);
      }
    }

    function requestSignal(signal) {
      signalInFlight = signal;
      try {
        const delivered = child.kill(signal);
        if (!delivered) {
          signalDeliveryFailures.add(signal);
        }
        return delivered;
      } catch {
        signalDeliveryFailures.add(signal);
        return false;
      } finally {
        signalInFlight = undefined;
      }
    }

    function beginTermination(reason) {
      if (state !== "running") {
        return;
      }
      terminalReason = reason;
      state = "terminating";
      requestSignal("SIGTERM");
      if (settled || state !== "terminating") {
        return;
      }
      gracefulTimer = schedule(() => {
        if (settled || state !== "terminating") {
          return;
        }
        state = "forcing";
        requestSignal("SIGKILL");
        if (settled || state !== "forcing") {
          return;
        }
        forcedTimer = schedule(() => {
          if (settled || state !== "forcing") {
            return;
          }
          detachProcessHandles();
          settle(
            new SharpValidationError(
              `${terminalReason}; worker termination could not be confirmed`,
              {
                termination: "inconclusive",
                signalDeliveryFailures: signalDeliveryFailures.size,
              },
            ),
            undefined,
            { defendDetachedChildUntilClose: true },
          );
        }, forcedExitMs);
      }, gracefulExitMs);
    }

    function appendOutput(current, chunk, streamName) {
      const next = Buffer.concat([current, Buffer.from(chunk)]);
      if (next.length > maxOutputBytes) {
        beginTermination(`Sharp worker ${streamName} exceeded ${maxOutputBytes} bytes`);
      }
      return next.subarray(0, maxOutputBytes + 1);
    }

    function onStdoutData(chunk) {
      stdout = appendOutput(stdout, chunk, "stdout");
    }

    function onStderrData(chunk) {
      stderr = appendOutput(stderr, chunk, "stderr");
    }

    function onSpawn() {
      spawnConfirmed = true;
    }

    function onChildError() {
      if (settled) {
        return;
      }
      if (signalInFlight) {
        signalDeliveryFailures.add(signalInFlight);
      } else {
        signalDeliveryFailures.add("child-error");
      }
      if (!spawnConfirmed && state === "running") {
        detachProcessHandles();
        settle(
          new SharpValidationError("Sharp worker could not be executed", {
            phase: "spawn",
          }),
        );
        return;
      }
      if (state === "running") {
        beginTermination("Sharp worker reported an execution failure");
      }
    }

    function onChildClose(code, signal) {
      if (defendDetachedChildUntilClose) {
        defendDetachedChildUntilClose = false;
        removeChildLifecycleListeners();
        return;
      }
      if (settled) {
        return;
      }
      if (state === "terminating" || state === "forcing") {
        settle(
          new SharpValidationError(terminalReason, {
            termination: state === "forcing" ? "forced" : "graceful",
            exitCode: code,
            signal,
            signalDeliveryFailures: signalDeliveryFailures.size,
          }),
        );
        return;
      }
      if (signal) {
        settle(
          new SharpValidationError("Sharp worker exited after receiving a signal", {
            signal,
          }),
        );
        return;
      }
      if (code !== 0) {
        settle(
          new SharpValidationError("Sharp worker returned a nonzero exit code", {
            exitCode: code,
            stderrBytes: stderr.length,
          }),
        );
        return;
      }
      try {
        settle(undefined, validateWorkerReceipt(stdout.toString("utf8").trim()));
      } catch (error) {
        settle(error);
      }
    }

    child.stdout.on("data", onStdoutData);
    child.stderr.on("data", onStderrData);
    child.once("spawn", onSpawn);
    child.on("error", onChildError);
    child.on("close", onChildClose);

    deadlineTimer = schedule(() => {
      beginTermination(`Sharp operation exceeded ${deadlineMs} ms`);
    }, deadlineMs);
  });
}

function formatPassReceipt(receipt) {
  return (
    [
      "Sharp native validation: PASS",
      `Version: ${receipt.version}`,
      `Operation: synthetic ${SOURCE_WIDTH}x${SOURCE_HEIGHT} RGBA -> ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} PNG`,
      `Output bytes: ${receipt.outputBytes}`,
    ].join("\n") + "\n"
  );
}

async function cli() {
  try {
    const receipt = await runWorker();
    process.stdout.write(formatPassReceipt(receipt));
  } catch (error) {
    const message =
      error instanceof SharpValidationError || error instanceof assert.AssertionError
        ? error.message
        : "Unexpected sharp validation failure";
    process.stderr.write(`Sharp native validation: FAIL\n${message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_SHARP_VERSION,
  MAX_OUTPUT_BYTES,
  SharpValidationError,
  formatPassReceipt,
  runWorker,
  validateWorkerReceipt,
};

if (require.main === module) {
  void cli();
}
