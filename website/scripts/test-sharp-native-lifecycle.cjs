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
  constructor(killHandler = () => true) {
    super();
    this.stdout = new PassThrough();
    this.stderr = new PassThrough();
    this.killHandler = killHandler;
    this.killCalls = [];
    this.unrefCalled = false;
  }

  kill(signal) {
    this.killCalls.push(signal);
    return this.killHandler(signal, this);
  }

  unref() {
    this.unrefCalled = true;
  }
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
  const child = new FakeChild((signal, target) => {
    if (signal === "SIGTERM") {
      setImmediate(() => target.emit("close", null, "SIGTERM"));
    }
    return true;
  });
  await assert.rejects(
    runWorker({
      spawnChild: () => child,
      deadlineMs: 2,
      gracefulExitMs: 50,
      forcedExitMs: 50,
    }),
    (error) =>
      error.termination === "graceful" &&
      /exceeded 2 ms/.test(error.message),
  );
  assert.deepEqual(child.killCalls, ["SIGTERM"]);
});

test("a child that ignores graceful termination is forcibly terminated", async () => {
  const child = new FakeChild((signal, target) => {
    if (signal === "SIGKILL") {
      setImmediate(() => target.emit("close", null, "SIGKILL"));
    }
    return true;
  });
  await assert.rejects(
    runWorker({
      spawnChild: () => child,
      deadlineMs: 2,
      gracefulExitMs: 2,
      forcedExitMs: 50,
    }),
    (error) => error.termination === "forced",
  );
  assert.deepEqual(child.killCalls, ["SIGTERM", "SIGKILL"]);
});

test("inconclusive termination fails closed and cannot keep the parent alive", async () => {
  const child = new FakeChild();
  await assert.rejects(
    runWorker({
      spawnChild: () => child,
      deadlineMs: 1,
      gracefulExitMs: 1,
      forcedExitMs: 1,
    }),
    (error) =>
      error.termination === "inconclusive" &&
      /could not be confirmed/.test(error.message),
  );
  assert.deepEqual(child.killCalls, ["SIGTERM", "SIGKILL"]);
  assert.equal(child.unrefCalled, true);
  assert.equal(child.stdout.destroyed, true);
  assert.equal(child.stderr.destroyed, true);
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
