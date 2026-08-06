import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import {
  APP_OPERATION_EVENT_BACKOFF_MS,
  APP_OPERATION_EVENT_CIRCUIT_OPEN_MS,
  APP_OPERATION_EVENT_EMIT_BUDGET_MS,
  APP_OPERATION_EVENT_MAX_RPC_ATTEMPTS,
  emitAppOperationEvent,
  getAppOperationEventSinkStatus,
  resetAppOperationEventSinkStateForTests,
  type AppOperationEventSinkDependencies
} from "./app-operation-event-sink";
import type {
  AppOperationEventFields,
  AppOperationEventRpcOutcome
} from "./app-operation-event-types";

const workspaceA = "10000000-0000-4000-8000-000000000001";
const testSecret = "app-operation-event-test-secret-0123456789abcdef";

const enabledEnv = {
  APP_OPERATION_EVENTS_ENABLED: "true",
  APP_OPERATION_EVENT_ADMISSION_SECRET: testSecret,
  SUPABASE_URL: "https://project-ref.supabase.co",
  SUPABASE_ANON_KEY: "anon-token-for-tests"
};

const baseFields: AppOperationEventFields = {
  eventId: "c0000000-0000-4000-8000-000000000100",
  workspaceId: workspaceA,
  category: "quote.submission",
  outcome: "failed",
  referenceType: "request_id",
  referenceValue: "app-op-request-a",
  errorCode: "provider_unavailable",
  routeKey: "/api/quote",
  httpStatus: 502,
  occurredAtMs: 1712345678000
};

type Clock = { nowMs: number };

function createDependencies(
  clock: Clock,
  rpc: (
    args: Record<string, unknown>
  ) => Promise<AppOperationEventRpcOutcome>,
  extra: Partial<AppOperationEventSinkDependencies> = {}
): AppOperationEventSinkDependencies & {
  rpc: Mock<
    (args: Record<string, unknown>) => Promise<AppOperationEventRpcOutcome>
  >;
  sleep: Mock<(ms: number) => Promise<void>>;
} {
  const sleep = vi.fn(async (ms: number) => {
    clock.nowMs += ms;
  });
  const rpcMock = vi.fn(async (args: Record<string, unknown>) => rpc(args));

  return {
    env: { ...enabledEnv, ...(extra.env ?? {}) },
    now: () => clock.nowMs,
    sleep,
    rpc: rpcMock,
    console: { error: vi.fn() }
  };
}

describe("app operation event sink", () => {
  beforeEach(() => {
    resetAppOperationEventSinkStateForTests();
  });

  it("performs zero RPC calls when the feature is disabled", async () => {
    const rpc = vi.fn(async () => ({ kind: "inserted" as const }));
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc, {
      env: {
        APP_OPERATION_EVENTS_ENABLED: "false",
        APP_OPERATION_EVENT_ADMISSION_SECRET: testSecret
      }
    });

    const result = await emitAppOperationEvent(baseFields, deps);

    expect(result).toEqual({
      kind: "skipped",
      state: "disabled",
      code: "not_enabled"
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("performs zero RPC calls when the admission secret is absent", async () => {
    const rpc = vi.fn(async () => ({ kind: "inserted" as const }));
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc, {
      env: {
        APP_OPERATION_EVENTS_ENABLED: "true",
        APP_OPERATION_EVENT_ADMISSION_SECRET: undefined
      }
    });

    const result = await emitAppOperationEvent(baseFields, deps);

    expect(result).toEqual({
      kind: "skipped",
      state: "unconfigured",
      code: "admission_secret_missing"
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("performs zero RPC calls when Supabase server configuration is absent", async () => {
    const rpc = vi.fn(async () => ({ kind: "inserted" as const }));
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc, {
      env: {
        APP_OPERATION_EVENTS_ENABLED: "true",
        APP_OPERATION_EVENT_ADMISSION_SECRET: testSecret,
        SUPABASE_URL: undefined,
        SUPABASE_ANON_KEY: undefined
      }
    });

    const result = await emitAppOperationEvent(baseFields, deps);

    expect(result.kind).toBe("skipped");
    expect((result as { state?: string }).state).toBe("unconfigured");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("emits a valid proof-bound RPC and reports inserted", async () => {
    const rpc = vi.fn(async () => ({ kind: "inserted" as const }));
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc);

    const result = await emitAppOperationEvent(baseFields, deps);

    expect(result).toEqual({ kind: "emitted" });
    expect(rpc).toHaveBeenCalledTimes(1);
    const args = deps.rpc.mock.calls[0]![0] as Record<string, unknown>;

    expect(args.p_event_id).toBe(baseFields.eventId);
    expect(args.p_workspace_id).toBe(baseFields.workspaceId);
    expect(args.p_category).toBe("quote.submission");
    expect(args.p_outcome).toBe("failed");
    expect(args.p_reference_type).toBe("request_id");
    expect(args.p_reference_value).toBe("app-op-request-a");
    expect(args.p_error_code).toBe("provider_unavailable");
    expect(args.p_route_key).toBe("/api/quote");
    expect(args.p_http_status).toBe(502);
    expect(args.p_occurred_at_ms).toBe(1712345678000);
    expect(args.p_admission_payload_digest).toMatch(/^[a-f0-9]{64}$/);
    expect(args.p_admission_expires_at).toBe(1712345738);
    expect(args.p_admission_signature).toMatch(/^[a-f0-9]{64}$/);
    expect(getAppOperationEventSinkStatus().state).toBe("ready");
  });

  it("treats a duplicate RPC return as idempotent success", async () => {
    const rpc = vi.fn(async () => ({ kind: "duplicate" as const }));
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc);

    const result = await emitAppOperationEvent(baseFields, deps);

    expect(result).toEqual({ kind: "duplicate" });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("reuses the same event ID and fields when retrying after a transient failure", async () => {
    let calls = 0;
    const rpc = vi.fn(async (args: Record<string, unknown>) => {
      calls += 1;
      return calls === 1
        ? { kind: "transient" as const, code: "rpc_unavailable" }
        : { kind: "inserted" as const };
    });
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc);

    const result = await emitAppOperationEvent(baseFields, deps);

    expect(result).toEqual({ kind: "emitted" });
    expect(rpc).toHaveBeenCalledTimes(2);
    const firstArgs = rpc.mock.calls[0]![0] as Record<string, unknown>;
    const secondArgs = rpc.mock.calls[1]![0] as Record<string, unknown>;

    expect(secondArgs.p_event_id).toBe(firstArgs.p_event_id);
    expect(secondArgs.p_occurred_at_ms).toBe(firstArgs.p_occurred_at_ms);
    expect(secondArgs.p_admission_payload_digest).toBe(
      firstArgs.p_admission_payload_digest
    );
    expect(secondArgs.p_admission_expires_at).toBe(
      firstArgs.p_admission_expires_at
    );
    expect(deps.sleep).toHaveBeenCalledTimes(1);
    expect(deps.sleep).toHaveBeenCalledWith(APP_OPERATION_EVENT_BACKOFF_MS);
  });

  it("never exceeds two RPC attempts and opens a 60-second circuit on persistent transients", async () => {
    const rpc = vi.fn(async () => ({ kind: "transient" as const }));
    const clock = { nowMs: 1712345678000 };
    const deps = createDependencies(clock, rpc);

    const first = await emitAppOperationEvent(baseFields, deps);

    expect(first).toEqual({
      kind: "skipped",
      state: "temporarily_unavailable",
      code: "rpc_unavailable"
    });
    expect(rpc).toHaveBeenCalledTimes(APP_OPERATION_EVENT_MAX_RPC_ATTEMPTS);
    expect(getAppOperationEventSinkStatus().state).toBe(
      "temporarily_unavailable"
    );
    expect(getAppOperationEventSinkStatus().circuitOpenUntil).toBe(
      clock.nowMs + APP_OPERATION_EVENT_CIRCUIT_OPEN_MS
    );

    const second = await emitAppOperationEvent(baseFields, deps);

    expect(second).toEqual({
      kind: "skipped",
      state: "temporarily_unavailable",
      code: "rpc_unavailable"
    });
    expect(rpc).toHaveBeenCalledTimes(APP_OPERATION_EVENT_MAX_RPC_ATTEMPTS);
  });

  it("does not start a second attempt when the deadline cannot accommodate it", async () => {
    const rpc = vi.fn(async () => ({ kind: "transient" as const }));
    const clock = { nowMs: 1712345678000 };
    const deps = createDependencies(clock, rpc);
    const overBudgetSleep = vi.fn(async () => {
      clock.nowMs += APP_OPERATION_EVENT_EMIT_BUDGET_MS + 1;
    });

    const result = await emitAppOperationEvent(baseFields, {
      ...deps,
      sleep: overBudgetSleep
    });

    expect(result.kind).toBe("skipped");
    expect(rpc).toHaveBeenCalledTimes(1);
    expect((result as { state?: string }).state).toBe(
      "temporarily_unavailable"
    );
  });

  it("returns skipped misconfigured after fatal admission failures and performs zero further RPC", async () => {
    const rpc = vi.fn(async () => ({
      kind: "fatal" as const,
      code: "rpc_rejected"
    }));
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc);

    const first = await emitAppOperationEvent(baseFields, deps);

    expect(first).toEqual({
      kind: "skipped",
      state: "misconfigured",
      code: "rpc_rejected"
    });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(getAppOperationEventSinkStatus().state).toBe("misconfigured");

    const second = await emitAppOperationEvent(baseFields, deps);

    expect(second).toEqual({
      kind: "skipped",
      state: "misconfigured",
      code: "rpc_rejected"
    });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("recovers from the open circuit after 60 seconds", async () => {
    let calls = 0;
    const rpc = vi.fn(async () => {
      calls += 1;
      return calls === 1 || calls === 2
        ? { kind: "transient" as const }
        : { kind: "inserted" as const };
    });
    const clock = { nowMs: 1712345678000 };
    const deps = createDependencies(clock, rpc);

    await emitAppOperationEvent(baseFields, deps);
    const openUntil = getAppOperationEventSinkStatus().circuitOpenUntil!;

    clock.nowMs = openUntil - 1;
    await emitAppOperationEvent(baseFields, deps);
    expect(rpc).toHaveBeenCalledTimes(2);

    clock.nowMs = openUntil;
    const result = await emitAppOperationEvent(baseFields, deps);

    expect(result).toEqual({ kind: "emitted" });
    expect(rpc).toHaveBeenCalledTimes(3);
  });

  it("logs only a fixed public-safe state and error code on failure", async () => {
    const rpc = vi.fn(async () => ({ kind: "transient" as const }));
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc);

    await emitAppOperationEvent(baseFields, deps);

    const consoleError = deps.console!.error as ReturnType<typeof vi.fn>;

    expect(consoleError).toHaveBeenCalledTimes(1);
    const [prefix, payload] = consoleError.mock.calls[0]!;

    expect(prefix).toBe("app_operation_event_sink");
    expect(payload).toEqual({
      state: "temporarily_unavailable",
      code: "rpc_unavailable"
    });
    expect(JSON.stringify(payload)).not.toContain(testSecret);
  });

  it("never echoes raw exception or payload values in console output", async () => {
    const rpc = vi.fn(async () => {
      throw new Error("raw-exception-detail-with-secret-material");
    });
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc);

    await emitAppOperationEvent(baseFields, deps);

    const consoleError = deps.console!.error as ReturnType<typeof vi.fn>;
    const output = JSON.stringify(consoleError.mock.calls);

    expect(output).not.toContain("raw-exception-detail");
    expect(output).not.toContain(testSecret);
    expect(output).not.toContain("app-op-request-a");
    expect(output).not.toContain("provider_unavailable");
  });

  it("returns skipped when the signer cannot produce a proof", async () => {
    const rpc = vi.fn(async () => ({ kind: "inserted" as const }));
    const deps = createDependencies({ nowMs: 1712345678000 }, rpc, {
      env: {
        ...enabledEnv,
        APP_OPERATION_EVENT_ADMISSION_SECRET: "short"
      }
    });

    const result = await emitAppOperationEvent(baseFields, deps);

    expect(result).toEqual({
      kind: "skipped",
      state: "unconfigured",
      code: "admission_secret_missing"
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("exposes only the internal typed status accessor", () => {
    const status = getAppOperationEventSinkStatus();

    expect(Object.keys(status).sort()).toEqual(
      expect.arrayContaining(["state"])
    );
    expect(typeof status.state).toBe("string");
  });
});
