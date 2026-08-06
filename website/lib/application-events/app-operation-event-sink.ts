import "server-only";

import { getAppOperationEventRuntimeConfig } from "../server-runtime-config";
import { createServerSupabaseClient } from "../supabase/server";
import { issueAppOperationEventAdmissionProof } from "./app-operation-event-signer";
import type {
  AppOperationEventEmitResult,
  AppOperationEventFields,
  AppOperationEventRpcOutcome,
  AppOperationEventSinkState
} from "./app-operation-event-types";

export const APP_OPERATION_EVENT_EMIT_BUDGET_MS = 750;
export const APP_OPERATION_EVENT_MAX_RPC_ATTEMPTS = 2;
export const APP_OPERATION_EVENT_BACKOFF_MS = 100;
export const APP_OPERATION_EVENT_CIRCUIT_OPEN_MS = 60_000;

export const appOperationEventSinkConsolePrefix = "app_operation_event_sink";

const fixedConsoleCodes = Object.freeze({
  notEnabled: "not_enabled",
  admissionSecretMissing: "admission_secret_missing",
  supabaseNotConfigured: "supabase_not_configured",
  admissionProofFailed: "admission_proof_failed",
  rpcUnavailable: "rpc_unavailable",
  rpcTimeout: "rpc_timeout",
  rpcRejected: "rpc_rejected",
  unknown: "unknown"
} as const);

type FixedConsoleCode = (typeof fixedConsoleCodes)[keyof typeof fixedConsoleCodes];

export type AppOperationEventSinkDependencies = {
  env?: { [key: string]: string | null | undefined };
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  rpc?: (
    args: Record<string, unknown>
  ) => Promise<AppOperationEventRpcOutcome>;
  console?: Pick<Console, "error">;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

export type AppOperationEventSinkStatus = {
  state: AppOperationEventSinkState;
  circuitOpenUntil?: number;
  lastErrorCode?: string;
};

let sinkState: AppOperationEventSinkState = "disabled";
let circuitOpenUntil: number | undefined;
let lastErrorCode: string | undefined;

function setSinkState(state: AppOperationEventSinkState) {
  sinkState = state;
}

export function getAppOperationEventSinkStatus(): AppOperationEventSinkStatus {
  return {
    state: sinkState,
    ...(circuitOpenUntil !== undefined ? { circuitOpenUntil } : {}),
    ...(lastErrorCode !== undefined ? { lastErrorCode } : {})
  };
}

export function resetAppOperationEventSinkStateForTests() {
  sinkState = "disabled";
  circuitOpenUntil = undefined;
  lastErrorCode = undefined;
}

function skipped(
  state: AppOperationEventSinkState,
  code?: FixedConsoleCode
): AppOperationEventEmitResult {
  return {
    kind: "skipped",
    state,
    ...(code !== undefined ? { code } : {})
  };
}

function defaultSleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function defaultSetTimer(fn: () => void, ms: number) {
  return setTimeout(fn, ms);
}

function defaultClearTimer(handle: unknown) {
  clearTimeout(handle as ReturnType<typeof setTimeout>);
}

type BoundedAttemptResult =
  | { kind: "outcome"; outcome: AppOperationEventRpcOutcome }
  | { kind: "expired" };

async function attemptWithinBudget(
  rpc: (
    args: Record<string, unknown>
  ) => Promise<AppOperationEventRpcOutcome>,
  args: Record<string, unknown>,
  budgetMs: number,
  dependencies: AppOperationEventSinkDependencies
): Promise<BoundedAttemptResult> {
  if (budgetMs <= 0) {
    return { kind: "expired" };
  }

  const setTimer = dependencies.setTimer ?? defaultSetTimer;
  const clearTimer = dependencies.clearTimer ?? defaultClearTimer;
  let timerHandle: unknown | undefined;

  const expiredSignal = new Promise<"expired">((resolve) => {
    timerHandle = setTimer(() => resolve("expired"), budgetMs);
  });

  const outcomePromise = Promise.resolve()
    .then(() => rpc(args))
    .then(
      (outcome): BoundedAttemptResult => ({ kind: "outcome", outcome }),
      (): BoundedAttemptResult => ({
        kind: "outcome",
        outcome: { kind: "transient", code: "rpc_exception" }
      })
    );

  const settled = await Promise.race([outcomePromise, expiredSignal]);

  if (settled === "expired") {
    // Quarantine the late RPC settlement: consume it without mutating sink
    // state, retrying, recursing or producing an unhandled rejection.
    outcomePromise.then(
      () => undefined,
      () => undefined
    );

    return { kind: "expired" };
  }

  if (timerHandle !== undefined) {
    clearTimer(timerHandle);
  }

  return settled;
}

function classifyRpcOutcome(
  outcome: AppOperationEventRpcOutcome
): "success" | "duplicate" | "transient" | "fatal" {
  if (outcome.kind === "inserted") {
    return "success";
  }

  if (outcome.kind === "duplicate") {
    return "duplicate";
  }

  if (outcome.kind === "fatal") {
    return "fatal";
  }

  return "transient";
}

async function defaultRpc(
  args: Record<string, unknown>
): Promise<AppOperationEventRpcOutcome> {
  const supabase = createServerSupabaseClient();

  if (!supabase.configured) {
    return { kind: "fatal", code: "supabase_not_configured" };
  }

  const { data, error } = await supabase.client.rpc(
    "record_app_operation_event",
    args
  );

  if (error) {
    const status =
      typeof (error as unknown as { status?: unknown }).status === "number"
        ? (error as unknown as { status: number }).status
        : 0;
    const code =
      typeof (error as unknown as { code?: unknown }).code === "string"
        ? (error as unknown as { code: string }).code
        : undefined;

    if (status >= 500 || status === 0) {
      return { kind: "transient", code };
    }

    return { kind: "fatal", code };
  }

  return data === true ? { kind: "inserted" } : { kind: "duplicate" };
}

export async function emitAppOperationEvent(
  fields: AppOperationEventFields,
  dependencies: AppOperationEventSinkDependencies = {}
): Promise<AppOperationEventEmitResult> {
  const now = dependencies.now ?? (() => Date.now());
  const sleep = dependencies.sleep ?? defaultSleep;
  const rpc = dependencies.rpc ?? defaultRpc;
  const consoleError = dependencies.console?.error ?? console.error;

  const config = getAppOperationEventRuntimeConfig(dependencies.env);

  if (!config.enabled) {
    return skipped("disabled", fixedConsoleCodes.notEnabled);
  }

  if (!config.admissionSecretConfigured) {
    setSinkState("unconfigured");
    return skipped("unconfigured", fixedConsoleCodes.admissionSecretMissing);
  }

  if (!config.supabaseConfigured) {
    setSinkState("unconfigured");
    return skipped("unconfigured", fixedConsoleCodes.supabaseNotConfigured);
  }

  if (sinkState === "misconfigured") {
    return skipped(
      "misconfigured",
      (lastErrorCode ?? fixedConsoleCodes.unknown) as FixedConsoleCode
    );
  }

  if (
    sinkState === "temporarily_unavailable" &&
    circuitOpenUntil !== undefined &&
    now() < circuitOpenUntil
  ) {
    return skipped(
      "temporarily_unavailable",
      (lastErrorCode ?? fixedConsoleCodes.rpcUnavailable) as FixedConsoleCode
    );
  }

  const proof = issueAppOperationEventAdmissionProof(fields, {
    env: dependencies.env,
    now: () => new Date(now())
  });

  if (!proof) {
    setSinkState("misconfigured");
    lastErrorCode = fixedConsoleCodes.admissionProofFailed;
    consoleError(appOperationEventSinkConsolePrefix, {
      state: "misconfigured",
      code: fixedConsoleCodes.admissionProofFailed
    });
    return skipped("misconfigured", fixedConsoleCodes.admissionProofFailed);
  }

  const args: Record<string, unknown> = {
    p_event_id: fields.eventId,
    p_workspace_id: fields.workspaceId,
    p_category: fields.category,
    p_outcome: fields.outcome,
    p_reference_type: fields.referenceType,
    p_reference_value: fields.referenceValue ?? null,
    p_error_code: fields.errorCode,
    p_route_key: fields.routeKey,
    p_http_status: fields.httpStatus,
    p_occurred_at_ms: fields.occurredAtMs,
    p_admission_payload_digest: proof.payloadDigest,
    p_admission_expires_at: proof.expiresAt,
    p_admission_signature: proof.signature
  };

  const deadline = now() + APP_OPERATION_EVENT_EMIT_BUDGET_MS;
  let attempts = 0;
  let lastTransientCode: FixedConsoleCode | undefined;

  while (true) {
    attempts += 1;

    const remaining = deadline - now();

    if (remaining <= 0) {
      break;
    }

    const attempt = await attemptWithinBudget(rpc, args, remaining, {
      ...dependencies
    });

    if (attempt.kind === "expired") {
      lastTransientCode = fixedConsoleCodes.rpcUnavailable;
      break;
    }

    const outcome = attempt.outcome;
    const classification = classifyRpcOutcome(outcome);

    if (classification === "success") {
      setSinkState("ready");
      return { kind: "emitted" };
    }

    if (classification === "duplicate") {
      setSinkState("ready");
      return { kind: "duplicate" };
    }

    if (classification === "fatal") {
      setSinkState("misconfigured");
      lastErrorCode = fixedConsoleCodes.rpcRejected;
      consoleError(appOperationEventSinkConsolePrefix, {
        state: "misconfigured",
        code: fixedConsoleCodes.rpcRejected
      });
      return skipped("misconfigured", fixedConsoleCodes.rpcRejected);
    }

    lastTransientCode = fixedConsoleCodes.rpcUnavailable;

    if (attempts >= APP_OPERATION_EVENT_MAX_RPC_ATTEMPTS) {
      break;
    }

    if (now() + APP_OPERATION_EVENT_BACKOFF_MS >= deadline) {
      break;
    }

    await sleep(APP_OPERATION_EVENT_BACKOFF_MS);
  }

  setSinkState("temporarily_unavailable");
  circuitOpenUntil = now() + APP_OPERATION_EVENT_CIRCUIT_OPEN_MS;
  lastErrorCode = lastTransientCode ?? fixedConsoleCodes.rpcUnavailable;
  consoleError(appOperationEventSinkConsolePrefix, {
    state: "temporarily_unavailable",
    code: lastErrorCode
  });

  return skipped(
    "temporarily_unavailable",
    lastErrorCode as FixedConsoleCode
  );
}
