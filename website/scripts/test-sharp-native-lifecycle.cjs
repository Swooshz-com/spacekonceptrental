"use strict";

const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { PassThrough } = require("node:stream");
const test = require("node:test");

const {
  MAX_OUTPUT_BYTES,
  formatPassReceipt,
  runWorker,
} = require("./validate-sharp-native.cjs");

const VALID_RECEIPT = Object.freeze({
  version: "0.35.3",
  width: 4,
  height: 3,
  format: "png",
  outputBytes: 98,
  pngSignature: "89504e470d0a1a0a",
});

class FakeChild extends EventEmitter {
  constructor(killHandler = () => true, options = {}) {
    super();
    this.pid = options.pid === undefined ? 1234 : options.pid;
    this.stdout = new PassThrough();
    this.stderr = new PassThrough();
    this.killHandler = killHandler;
    this.killCalls = [];
    this.unrefCalled = false;
    this.unrefCalls = 0;
    this.stdoutDestroyCalls = 0;
    this.stderrDestroyCalls = 0;
    const destroyStdout = this.stdout.destroy.bind(this.stdout);
    const destroyStderr = this.stderr.destroy.bind(this.stderr);
    this.stdout.destroy = (...arguments_) => {
      this.stdoutDestroyCalls += 1;
      return destroyStdout(...arguments_);
    };
    this.stderr.destroy = (...arguments_) => {
      this.stderrDestroyCalls += 1;
      return destroyStderr(...arguments_);
    };
  }

  kill(signal) {
    this.killCalls.push(signal);
    return this.killHandler(signal, this);
  }

  unref() {
    this.unrefCalled = true;
    this.unrefCalls += 1;
  }
}

class ManualClock {
  constructor() {
    this.nextId = 1;
    this.tasks = [];
    this.clearCalls = 0;
  }

  setTimeout(callback) {
    const task = { id: this.nextId, callback, active: true };
    this.nextId += 1;
    this.tasks.push(task);
    return task.id;
  }

  clearTimeout(id) {
    this.clearCalls += 1;
    const task = this.tasks.find((candidate) => candidate.id === id);
    if (task) {
      task.active = false;
    }
  }

  runNext() {
    const task = this.tasks.find((candidate) => candidate.active);
    assert.ok(task, "expected a pending timer");
    task.active = false;
    task.callback();
  }

  get pendingCount() {
    return this.tasks.filter((task) => task.active).length;
  }
}

function controlledOptions(child, clock) {
  return {
    spawnChild: () => child,
    deadlineMs: 5_000,
    gracefulExitMs: 500,
    forcedExitMs: 1_000,
    setTimeout: clock.setTimeout.bind(clock),
    clearTimeout: clock.clearTimeout.bind(clock),
  };
}

function emitSuccess(child) {
  child.stdout.write(`${JSON.stringify(VALID_RECEIPT)}\n`);
  child.emit("close", 0, null);
}

test("real native worker loads sharp and completes the bounded operation", async () => {
  const receipt = await runWorker({ deadlineMs: 10_000 });
  assert.equal(receipt.version, VALID_RECEIPT.version);
  assert.equal(receipt.width, VALID_RECEIPT.width);
  assert.equal(receipt.height, VALID_RECEIPT.height);
  assert.equal(receipt.format, VALID_RECEIPT.format);
  assert.equal(receipt.pngSignature, VALID_RECEIPT.pngSignature);
  assert.ok(receipt.outputBytes > 8 && receipt.outputBytes <= 64 * 1024);
});

test("a stalled child is terminated gracefully before failure settles", async () => {
  const clock = new ManualClock();
  const child = new FakeChild((signal, target) => {
    if (signal === "SIGTERM") {
      target.emit("close", null, "SIGTERM");
    }
    return true;
  });
  const result = runWorker(controlledOptions(child, clock));
  clock.runNext();
  await assert.rejects(
    result,
    (error) =>
      error.termination === "graceful" &&
      /exceeded 5000 ms/.test(error.message),
  );
  assert.deepEqual(child.killCalls, ["SIGTERM"]);
  assert.equal(clock.pendingCount, 0);
  assert.equal(child.listenerCount("error"), 0);
  assert.equal(child.listenerCount("close"), 0);
});

test("a child that ignores graceful termination is forcibly terminated", async () => {
  const clock = new ManualClock();
  const child = new FakeChild((signal, target) => {
    if (signal === "SIGKILL") {
      target.emit("close", null, "SIGKILL");
    }
    return true;
  });
  const result = runWorker(controlledOptions(child, clock));
  clock.runNext();
  clock.runNext();
  await assert.rejects(
    result,
    (error) => error.termination === "forced",
  );
  assert.deepEqual(child.killCalls, ["SIGTERM", "SIGKILL"]);
  assert.equal(clock.pendingCount, 0);
  assert.equal(child.listenerCount("error"), 0);
  assert.equal(child.listenerCount("close"), 0);
});

test("inconclusive termination fails closed and cannot keep the parent alive", async () => {
  const clock = new ManualClock();
  const child = new FakeChild();
  const result = runWorker(controlledOptions(child, clock));
  clock.runNext();
  clock.runNext();
  clock.runNext();
  await assert.rejects(
    result,
    (error) =>
      error.termination === "inconclusive" &&
      /could not be confirmed/.test(error.message),
  );
  assert.deepEqual(child.killCalls, ["SIGTERM", "SIGKILL"]);
  assert.equal(child.unrefCalled, true);
  assert.equal(child.stdout.destroyed, true);
  assert.equal(child.stderr.destroyed, true);
  assert.equal(clock.pendingCount, 0);
  assert.equal(child.listenerCount("error"), 1);
  assert.equal(child.listenerCount("close"), 1);
  assert.doesNotThrow(() => child.emit("error", new Error("late error")));
  child.emit("close", null, "SIGKILL");
  assert.equal(child.listenerCount("error"), 0);
  assert.equal(child.listenerCount("close"), 0);
});

test("initial spawn failure rejects promptly and releases deterministic resources", async () => {
  const clock = new ManualClock();
  const child = new FakeChild(undefined, { pid: null });
  const result = runWorker(controlledOptions(child, clock));
  child.emit("error", new Error("private spawn detail"));
  await assert.rejects(
    result,
    (error) =>
      error.phase === "spawn" &&
      error.message === "Sharp worker could not be executed",
  );
  assert.equal(child.stdout.destroyed, true);
  assert.equal(child.stderr.destroyed, true);
  assert.equal(child.unrefCalled, true);
  assert.equal(clock.pendingCount, 0);
  assert.equal(child.listenerCount("error"), 0);
  assert.equal(child.listenerCount("close"), 0);
});

test("failed SIGTERM delivery cannot cancel forced termination", async () => {
  const clock = new ManualClock();
  const child = new FakeChild((signal, target) => {
    if (signal === "SIGTERM") {
      target.emit("error", new Error("private SIGTERM detail"));
      return false;
    }
    target.emit("close", null, "SIGKILL");
    return true;
  });
  const result = runWorker(controlledOptions(child, clock));
  clock.runNext();
  assert.equal(clock.pendingCount, 1);
  clock.runNext();
  await assert.rejects(
    result,
    (error) =>
      error.termination === "forced" &&
      error.signalDeliveryFailures === 1,
  );
  assert.deepEqual(child.killCalls, ["SIGTERM", "SIGKILL"]);
  assert.equal(clock.pendingCount, 0);
  assert.equal(child.listenerCount("error"), 0);
  assert.equal(child.listenerCount("close"), 0);
});

test("inconclusive cleanup defends late errors until close without resettling", async () => {
  const clock = new ManualClock();
  const child = new FakeChild((signal, target) => {
    if (signal === "SIGKILL") {
      target.emit("error", new Error("private SIGKILL detail"));
      return false;
    }
    return true;
  });
  let settlements = 0;
  const result = runWorker(controlledOptions(child, clock)).catch((error) => {
    settlements += 1;
    throw error;
  });
  clock.runNext();
  clock.runNext();
  assert.equal(clock.pendingCount, 1);
  clock.runNext();
  await assert.rejects(
    result,
    (error) =>
      error.termination === "inconclusive" &&
      error.signalDeliveryFailures === 1,
  );
  const clearCallsAfterSettlement = clock.clearCalls;
  assert.equal(settlements, 1);
  assert.equal(child.stdout.destroyed, true);
  assert.equal(child.stderr.destroyed, true);
  assert.equal(child.unrefCalled, true);
  assert.equal(child.stdoutDestroyCalls, 1);
  assert.equal(child.stderrDestroyCalls, 1);
  assert.equal(child.unrefCalls, 1);
  assert.equal(clock.pendingCount, 0);
  assert.equal(child.listenerCount("error"), 1);
  assert.equal(child.listenerCount("close"), 1);
  assert.equal(
    child.emit("error", new Error("first late worker error")),
    true,
  );
  assert.equal(
    child.emit("error", new Error("second late worker error")),
    true,
  );
  assert.equal(settlements, 1);
  assert.equal(clock.clearCalls, clearCallsAfterSettlement);
  child.emit("close", null, "SIGKILL");
  child.emit("close", null, "SIGKILL");
  assert.equal(settlements, 1);
  assert.equal(child.stdoutDestroyCalls, 1);
  assert.equal(child.stderrDestroyCalls, 1);
  assert.equal(child.unrefCalls, 1);
  assert.equal(clock.clearCalls, clearCallsAfterSettlement);
  assert.equal(child.listenerCount("error"), 0);
  assert.equal(child.listenerCount("close"), 0);
});

test("both failed signal paths remain fail-closed through final detachment", async () => {
  const clock = new ManualClock();
  const child = new FakeChild((signal, target) => {
    target.emit("error", new Error(`private ${signal} detail`));
    return false;
  });
  const result = runWorker(controlledOptions(child, clock));
  clock.runNext();
  clock.runNext();
  clock.runNext();
  await assert.rejects(
    result,
    (error) =>
      error.termination === "inconclusive" &&
      error.signalDeliveryFailures === 2,
  );
  assert.deepEqual(child.killCalls, ["SIGTERM", "SIGKILL"]);
  assert.equal(child.stdout.destroyed, true);
  assert.equal(child.stderr.destroyed, true);
  assert.equal(child.unrefCalled, true);
  assert.equal(clock.pendingCount, 0);
  assert.equal(child.listenerCount("error"), 1);
  assert.equal(child.listenerCount("close"), 1);
  assert.doesNotThrow(() => child.emit("error", new Error("late error")));
  child.emit("close", null, "SIGKILL");
  assert.equal(child.listenerCount("error"), 0);
  assert.equal(child.listenerCount("close"), 0);
});

test("oversized worker stdout triggers bounded termination", async () => {
  const child = new FakeChild((signal, target) => {
    setImmediate(() => target.emit("close", null, signal));
    return true;
  });
  const result = runWorker({
    spawnChild: () => child,
    deadlineMs: 1_000,
    gracefulExitMs: 50,
    forcedExitMs: 50,
  });
  child.stdout.write(Buffer.alloc(MAX_OUTPUT_BYTES + 1, 65));
  await assert.rejects(result, /stdout exceeded/);
  assert.deepEqual(child.killCalls, ["SIGTERM"]);
});

test("nonzero worker exits fail without exposing stderr", async () => {
  const child = new FakeChild();
  const result = runWorker({ spawnChild: () => child, deadlineMs: 1_000 });
  child.stderr.write("private worker detail");
  child.emit("close", 7, null);
  await assert.rejects(result, (error) => {
    assert.equal(error.exitCode, 7);
    assert.equal(error.stderrBytes, 21);
    assert.doesNotMatch(error.message, /private worker detail/);
    return true;
  });
});

test("signal exits fail closed", async () => {
  const child = new FakeChild();
  const result = runWorker({ spawnChild: () => child, deadlineMs: 1_000 });
  child.emit("close", null, "SIGABRT");
  await assert.rejects(
    result,
    (error) => error.signal === "SIGABRT" && /signal/.test(error.message),
  );
});

test("duplicate child close events settle only once", async () => {
  const child = new FakeChild();
  const result = runWorker({ spawnChild: () => child, deadlineMs: 1_000 });
  emitSuccess(child);
  child.emit("close", 9, null);
  assert.deepEqual(await result, VALID_RECEIPT);
  assert.equal(child.listenerCount("error"), 0);
  assert.equal(child.listenerCount("close"), 0);
});

test("PASS formatting is unavailable until confirmed success is returned", async () => {
  const child = new FakeChild();
  let settled = false;
  const result = runWorker({ spawnChild: () => child, deadlineMs: 1_000 }).then(
    (receipt) => {
      settled = true;
      return formatPassReceipt(receipt);
    },
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false);
  emitSuccess(child);
  const output = await result;
  assert.equal(settled, true);
  assert.match(output, /^Sharp native validation: PASS\n/);
});
