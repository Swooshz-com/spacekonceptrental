import "server-only";

import {
  getAdminTrustedWorkspaceId,
  getQuoteWorkspaceId
} from "../server-runtime-config";
import { emitAppOperationEvent } from "./app-operation-event-sink";
import type { AppOperationEventSinkDependencies } from "./app-operation-event-sink";
import type {
  AppOperationEventEmitResult,
  AppOperationEventFields
} from "./app-operation-event-types";

export type AppOperationEventCallSiteEnv = {
  [key: string]: string | null | undefined;
};

export type AppOperationEventCallSiteDependencies =
  AppOperationEventSinkDependencies & {
    env?: AppOperationEventCallSiteEnv;
    now?: () => number;
  };

type CallSiteOptions = AppOperationEventCallSiteDependencies;

function readEnv(options: CallSiteOptions): AppOperationEventCallSiteEnv {
  return options.env ?? process.env;
}

function workspaceUnavailable(): AppOperationEventEmitResult {
  return {
    kind: "skipped",
    state: "unconfigured",
    code: "workspace_not_configured"
  };
}

function buildFields(
  options: CallSiteOptions,
  fields: Omit<AppOperationEventFields, "eventId" | "occurredAtMs">
): AppOperationEventFields {
  const nowMs = Math.floor(options.now?.() ?? Date.now());

  return {
    eventId: crypto.randomUUID(),
    occurredAtMs: nowMs,
    ...fields
  };
}

export function emitQuoteSubmissionDisabled(
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getQuoteWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "quote.submission",
      outcome: "disabled",
      referenceType: "none",
      referenceValue: null,
      errorCode: "quote_submission_disabled",
      routeKey: "/api/quote",
      httpStatus: 503
    }),
    options
  );
}

export function emitQuoteSubmissionValidationDenied(
  requestId: string,
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getQuoteWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "quote.submission",
      outcome: "denied",
      referenceType: "request_id",
      referenceValue: requestId,
      errorCode: "validation_failed",
      routeKey: "/api/quote",
      httpStatus: 400
    }),
    options
  );
}

export function emitQuoteSubmissionPersistenceFailed(
  requestId: string,
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getQuoteWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "quote.submission",
      outcome: "failed",
      referenceType: "request_id",
      referenceValue: requestId,
      errorCode: "quote_persistence_unavailable",
      routeKey: "/api/quote",
      httpStatus: 503
    }),
    options
  );
}

export function emitQuoteHandoffPending(
  requestId: string,
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getQuoteWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "quote.handoff",
      outcome: "pending",
      referenceType: "request_id",
      referenceValue: requestId,
      errorCode: "handoff_pending",
      routeKey: "/api/quote",
      httpStatus: 503
    }),
    options
  );
}

export function emitQuoteHandoffExceptionFailed(
  requestId: string,
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getQuoteWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "quote.handoff",
      outcome: "failed",
      referenceType: "request_id",
      referenceValue: requestId,
      errorCode: "handoff_exception",
      routeKey: "/api/quote",
      httpStatus: 503
    }),
    options
  );
}

export function emitQuoteHandoffFinalizationFailed(
  requestId: string,
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getQuoteWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "quote.handoff",
      outcome: "failed",
      referenceType: "request_id",
      referenceValue: requestId,
      errorCode: "handoff_finalization_failed",
      routeKey: "/api/quote",
      httpStatus: 503
    }),
    options
  );
}

export function emitQuoteHandoffDisabled(
  requestId: string,
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getQuoteWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "quote.handoff",
      outcome: "disabled",
      referenceType: "request_id",
      referenceValue: requestId,
      errorCode: "handoff_not_configured",
      routeKey: "/api/quote",
      httpStatus: 503
    }),
    options
  );
}

export function emitQuoteRateLimitDenied(
  requestId: string,
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getQuoteWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "rate.limit",
      outcome: "denied",
      referenceType: "request_id",
      referenceValue: requestId,
      errorCode: "rate_limited",
      routeKey: "/api/quote",
      httpStatus: 429
    }),
    options
  );
}

const adminAuthDenyCodeMapping: Record<string, string> = Object.freeze({
  unauthenticated: "unauthenticated",
  admin_profile_missing: "admin_profile_missing",
  admin_profile_inactive: "admin_profile_inactive",
  workspace_missing: "workspace_missing",
  workspace_mismatch: "workspace_mismatch",
  membership_missing: "membership_missing",
  membership_inactive: "membership_inactive",
  membership_actor_mismatch: "membership_actor_mismatch",
  role_not_allowed: "role_not_allowed",
  operation_not_supported: "operation_not_supported",
  origin_missing: "origin_missing",
  host_missing: "host_missing",
  csrf_proof_missing: "csrf_proof_invalid",
  csrf_proof_stale: "csrf_proof_invalid",
  csrf_proof_replayed: "csrf_proof_invalid",
  csrf_proof_mismatched: "csrf_proof_invalid",
  csrf_verification_failed: "csrf_proof_invalid",
  csrf_verifier_unavailable: "csrf_proof_invalid",
  csrf_proof_invalid: "csrf_proof_invalid",
  request_method_missing: "admin_authorization_gate_unavailable",
  request_method_not_allowed: "admin_authorization_gate_unavailable",
  origin_host_mismatch: "admin_authorization_gate_unavailable",
  admin_authorization_gate_unavailable: "admin_authorization_gate_unavailable",
  admin_mutations_disabled: "admin_mutations_disabled"
});

export function mapAdminAuthDenyReason(reason: string): string {
  return (
    adminAuthDenyCodeMapping[reason] ?? "admin_authorization_gate_unavailable"
  );
}

export function emitAdminAuthDenied(
  reason: string,
  statusCode: number,
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getAdminTrustedWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "admin.auth",
      outcome: "denied",
      referenceType: "none",
      referenceValue: null,
      errorCode: mapAdminAuthDenyReason(reason),
      routeKey: "admin.gate",
      httpStatus: statusCode
    }),
    options
  );
}

export function emitAdminLoginDenied(
  code: "login_unauthenticated" | "login_unavailable",
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getAdminTrustedWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "admin.auth",
      outcome: "denied",
      referenceType: "none",
      referenceValue: null,
      errorCode: code,
      routeKey: "/api/admin/login",
      httpStatus: 303
    }),
    options
  );
}

export function emitAdminLoginCallbackDenied(
  code: "callback_unauthenticated" | "callback_unavailable",
  options: CallSiteOptions = {}
): Promise<AppOperationEventEmitResult> {
  const env = readEnv(options);
  const workspaceId = getAdminTrustedWorkspaceId(env);

  if (!workspaceId) {
    return Promise.resolve(workspaceUnavailable());
  }

  return emitAppOperationEvent(
    buildFields(options, {
      workspaceId,
      category: "admin.auth",
      outcome: "denied",
      referenceType: "none",
      referenceValue: null,
      errorCode: code,
      routeKey: "/api/admin/login/callback",
      httpStatus: 303
    }),
    options
  );
}
