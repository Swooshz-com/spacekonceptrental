import { describe, expect, it, vi } from "vitest";

import { IdempotentOperationStore } from "./idempotent-operation";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe("IdempotentOperationStore", () => {
  it("shares one synchronously reserved operation and its result", async () => {
    const barrier = deferred<string>();
    const execute = vi.fn(() => barrier.promise);
    const store = new IdempotentOperationStore<string, string>({ maxEntries: 10, ttlMs: 1_000 });
    const start = () => store.start({ key: "same", fingerprint: "payload", createMetadata: () => ({ ok: true as const, metadata: "owner" }), execute });
    const first = start();
    const second = start();
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    barrier.resolve("shared");
    if (first.status !== "operation" || second.status !== "operation") throw new Error("Expected operations.");
    await expect(Promise.all([first.promise, second.promise])).resolves.toEqual(["shared", "shared"]);
    expect(second.metadata).toBe("owner");
  });

  it("shares failure, cleans it, and permits a later retry", async () => {
    const barrier = deferred<string>();
    const store = new IdempotentOperationStore<string, string>({ maxEntries: 10, ttlMs: 1_000 });
    const start = () => store.start({ key: "retry", fingerprint: "payload", createMetadata: () => ({ ok: true as const, metadata: "owner" }), execute: () => barrier.promise });
    const first = start();
    const second = start();
    barrier.reject(new Error("provider unavailable"));
    if (first.status !== "operation" || second.status !== "operation") throw new Error("Expected operations.");
    expect((await Promise.allSettled([first.promise, second.promise])).map((item) => item.status)).toEqual(["rejected", "rejected"]);
    const execute = vi.fn(async () => "retried");
    const retry = store.start({ key: "retry", fingerprint: "payload", createMetadata: () => ({ ok: true, metadata: "retry" }), execute });
    if (retry.status !== "operation") throw new Error("Expected retry.");
    await expect(retry.promise).resolves.toBe("retried");
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("rejects a different fingerprint without another operation", () => {
    const execute = vi.fn(() => new Promise<string>(() => undefined));
    const store = new IdempotentOperationStore<string, string>({ maxEntries: 10, ttlMs: 1_000 });
    store.start({ key: "key", fingerprint: "a", createMetadata: () => ({ ok: true, metadata: "owner" }), execute });
    expect(store.start({ key: "key", fingerprint: "b", createMetadata: () => ({ ok: true, metadata: "other" }), execute })).toEqual({ status: "conflict" });
  });

  it("expires completed results but keeps active work authoritative", async () => {
    let now = 1_000;
    const store = new IdempotentOperationStore<string, string>({ maxEntries: 10, ttlMs: 100, now: () => now });
    const first = store.start({ key: "completed", fingerprint: "payload", createMetadata: () => ({ ok: true, metadata: "first" }), execute: async () => "first" });
    if (first.status !== "operation") throw new Error("Expected operation.");
    await first.promise;
    now = 1_101;
    const secondExecute = vi.fn(async () => "second");
    const second = store.start({ key: "completed", fingerprint: "payload", createMetadata: () => ({ ok: true, metadata: "second" }), execute: secondExecute });
    if (second.status !== "operation") throw new Error("Expected operation.");
    await expect(second.promise).resolves.toBe("second");

    const barrier = deferred<string>();
    const active = store.start({ key: "active", fingerprint: "payload", createMetadata: () => ({ ok: true, metadata: "active" }), execute: () => barrier.promise });
    now = 10_000;
    const duplicate = vi.fn(async () => "duplicate");
    const retry = store.start({ key: "active", fingerprint: "payload", createMetadata: () => ({ ok: true, metadata: "new" }), execute: duplicate });
    if (active.status !== "operation" || retry.status !== "operation") throw new Error("Expected operations.");
    expect(retry.promise).toBe(active.promise);
    expect(duplicate).not.toHaveBeenCalled();
    barrier.resolve("active-result");
    await retry.promise;
  });

  it("uses identity-aware cleanup so an old generation cannot delete a newer one", async () => {
    const cleanup = deferred<void>();
    const oldFailure = deferred<string>();
    const newerBarrier = deferred<string>();
    const store = new IdempotentOperationStore<string, string>({ maxEntries: 10, ttlMs: 1_000, beforeFailureCleanup: () => cleanup.promise });
    const old = store.start({ key: "key", fingerprint: "payload", createMetadata: () => ({ ok: true, metadata: "old" }), execute: () => oldFailure.promise });
    oldFailure.reject(new Error("old failed"));
    await Promise.resolve();
    await Promise.resolve();
    store.clear();
    const execute = vi.fn(() => newerBarrier.promise);
    const newer = store.start({ key: "key", fingerprint: "payload", createMetadata: () => ({ ok: true, metadata: "new" }), execute });
    cleanup.resolve();
    if (old.status === "operation") await expect(old.promise).rejects.toThrow("old failed");
    const joined = store.start({ key: "key", fingerprint: "payload", createMetadata: () => ({ ok: true, metadata: "unexpected" }), execute });
    if (newer.status !== "operation" || joined.status !== "operation") throw new Error("Expected operations.");
    expect(joined.promise).toBe(newer.promise);
    expect(execute).toHaveBeenCalledTimes(1);
    newerBarrier.resolve("new");
    await joined.promise;
  });
});
