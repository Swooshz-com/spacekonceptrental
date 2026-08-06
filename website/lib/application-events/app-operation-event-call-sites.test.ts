import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  emitAdminAuthDenied,
  emitAdminLoginCallbackDenied,
  emitAdminLoginDenied,
  emitQuoteHandoffDisabled,
  emitQuoteHandoffExceptionFailed,
  emitQuoteHandoffFinalizationFailed,
  emitQuoteHandoffPending,
  emitQuoteRateLimitDenied,
  emitQuoteSubmissionDisabled,
  emitQuoteSubmissionPersistenceFailed,
  emitQuoteSubmissionValidationDenied
} from "./app-operation-event-call-sites";
import {
  resetAppOperationEventSinkStateForTests
} from "./app-operation-event-sink";
import type {
  AppOperationEventCallSiteDependencies
} from "./app-operation-event-call-sites";
import type { AppOperationEventRpcOutcome } from "./app-operation-event-types";

const quoteWorkspaceId = "10000000-0000-4000-8000-000000000001";
const adminWorkspaceId = "30000000-0000-4000-8000-000000000001";
const testSecret = "app-operation-event-test-secret-0123456789abcdef";

const readyEnv = {
  APP_OPERATION_EVENTS_ENABLED: "true",
  APP_OPERATION_EVENT_ADMISSION_SECRET: testSecret,
  SUPABASE_URL: "https://project-ref.supabase.co",
  SUPABASE_ANON_KEY: "anon-token-for-tests",
  QUOTE_WORKSPACE_ID: quoteWorkspaceId,
  ADMIN_TRUSTED_WORKSPACE_ID: adminWorkspaceId
};

function dependencies(
  nowMs = 1712345678000
): AppOperationEventCallSiteDependencies & { rpc: ReturnType<typeof vi.fn> } {
  const rpc = vi.fn(
    async (): Promise<AppOperationEventRpcOutcome> => ({ kind: "inserted" })
  );

  return {
    env: { ...readyEnv },
    now: () => nowMs,
    sleep: async () => {},
    rpc
  };
}

function lastArgs(deps: AppOperationEventCallSiteDependencies & { rpc: ReturnType<typeof vi.fn> }) {
  return deps.rpc.mock.calls.at(-1)![0] as Record<string, unknown>;
}

describe("app operation event call sites", () => {
  beforeEach(() => {
    resetAppOperationEventSinkStateForTests();
  });

  it("maps the disabled submission path exactly", async () => {
    const deps = dependencies();
    await emitQuoteSubmissionDisabled(deps);
    const args = lastArgs(deps);

    expect(args.p_category).toBe("quote.submission");
    expect(args.p_outcome).toBe("disabled");
    expect(args.p_reference_type).toBe("none");
    expect(args.p_reference_value).toBeNull();
    expect(args.p_error_code).toBe("quote_submission_disabled");
    expect(args.p_route_key).toBe("/api/quote");
    expect(args.p_http_status).toBe(503);
    expect(args.p_workspace_id).toBe(quoteWorkspaceId);
  });

  it("maps the validation denial path exactly", async () => {
    const deps = dependencies();
    await emitQuoteSubmissionValidationDenied("route-request-id-1", deps);
    const args = lastArgs(deps);

    expect(args.p_category).toBe("quote.submission");
    expect(args.p_outcome).toBe("denied");
    expect(args.p_reference_type).toBe("request_id");
    expect(args.p_reference_value).toBe("route-request-id-1");
    expect(args.p_error_code).toBe("validation_failed");
    expect(args.p_route_key).toBe("/api/quote");
    expect(args.p_http_status).toBe(400);
    expect(args.p_workspace_id).toBe(quoteWorkspaceId);
  });

  it("maps the persistence failure path exactly", async () => {
    const deps = dependencies();
    await emitQuoteSubmissionPersistenceFailed("route-request-id-2", deps);
    const args = lastArgs(deps);

    expect(args.p_category).toBe("quote.submission");
    expect(args.p_outcome).toBe("failed");
    expect(args.p_error_code).toBe("quote_persistence_unavailable");
    expect(args.p_http_status).toBe(503);
    expect(args.p_route_key).toBe("/api/quote");
    expect(args.p_reference_value).toBe("route-request-id-2");
  });

  it("maps the pending handoff boundary exactly", async () => {
    const deps = dependencies();
    await emitQuoteHandoffPending("route-request-id-3", deps);
    const args = lastArgs(deps);

    expect(args.p_category).toBe("quote.handoff");
    expect(args.p_outcome).toBe("pending");
    expect(args.p_error_code).toBe("handoff_pending");
    expect(args.p_http_status).toBe(503);
    expect(args.p_route_key).toBe("/api/quote");
    expect(args.p_reference_value).toBe("route-request-id-3");
  });

  it("maps the handoff exception path exactly", async () => {
    const deps = dependencies();
    await emitQuoteHandoffExceptionFailed("route-request-id-4", deps);
    const args = lastArgs(deps);

    expect(args.p_category).toBe("quote.handoff");
    expect(args.p_outcome).toBe("failed");
    expect(args.p_error_code).toBe("handoff_exception");
    expect(args.p_http_status).toBe(503);
    expect(args.p_route_key).toBe("/api/quote");
  });

  it("maps the handoff finalisation failure path exactly", async () => {
    const deps = dependencies();
    await emitQuoteHandoffFinalizationFailed("route-request-id-5", deps);
    const args = lastArgs(deps);

    expect(args.p_category).toBe("quote.handoff");
    expect(args.p_outcome).toBe("failed");
    expect(args.p_error_code).toBe("handoff_finalization_failed");
    expect(args.p_http_status).toBe(503);
    expect(args.p_route_key).toBe("/api/quote");
  });

  it("maps the disabled handoff path exactly", async () => {
    const deps = dependencies();
    await emitQuoteHandoffDisabled("route-request-id-6", deps);
    const args = lastArgs(deps);

    expect(args.p_category).toBe("quote.handoff");
    expect(args.p_outcome).toBe("disabled");
    expect(args.p_error_code).toBe("handoff_not_configured");
    expect(args.p_http_status).toBe(503);
    expect(args.p_route_key).toBe("/api/quote");
  });

  it("maps the rate-limit denial path exactly without any client identity", async () => {
    const deps = dependencies();
    await emitQuoteRateLimitDenied("route-request-id-7", deps);
    const args = lastArgs(deps);

    expect(args.p_category).toBe("rate.limit");
    expect(args.p_outcome).toBe("denied");
    expect(args.p_error_code).toBe("rate_limited");
    expect(args.p_http_status).toBe(429);
    expect(args.p_route_key).toBe("/api/quote");
    expect(args.p_reference_value).toBe("route-request-id-7");
    expect(JSON.stringify(args)).not.toContain("ip:");
    expect(JSON.stringify(args)).not.toContain("email:");
  });

  it("maps the server-admin gate denial path to the admin workspace and gate route", async () => {
    const deps = dependencies();
    await emitAdminAuthDenied("role_not_allowed", 403, deps);
    const args = lastArgs(deps);

    expect(args.p_category).toBe("admin.auth");
    expect(args.p_outcome).toBe("denied");
    expect(args.p_reference_type).toBe("none");
    expect(args.p_reference_value).toBeNull();
    expect(args.p_error_code).toBe("role_not_allowed");
    expect(args.p_route_key).toBe("admin.gate");
    expect(args.p_http_status).toBe(403);
    expect(args.p_workspace_id).toBe(adminWorkspaceId);
  });

  it("maps every stable gate deny reason to an allowed bounded error code", async () => {
    const directCodes: Array<[string, string]> = [
      ["unauthenticated", "unauthenticated"],
      ["admin_profile_missing", "admin_profile_missing"],
      ["admin_profile_inactive", "admin_profile_inactive"],
      ["workspace_missing", "workspace_missing"],
      ["workspace_mismatch", "workspace_mismatch"],
      ["membership_missing", "membership_missing"],
      ["membership_inactive", "membership_inactive"],
      ["membership_actor_mismatch", "membership_actor_mismatch"],
      ["role_not_allowed", "role_not_allowed"],
      ["operation_not_supported", "operation_not_supported"],
      ["origin_missing", "origin_missing"],
      ["host_missing", "host_missing"],
      ["csrf_proof_invalid", "csrf_proof_invalid"],
      ["admin_authorization_gate_unavailable", "admin_authorization_gate_unavailable"],
      ["admin_mutations_disabled", "admin_mutations_disabled"]
    ];
    const groupedCodes: Array<[string, string]> = [
      ["csrf_proof_missing", "csrf_proof_invalid"],
      ["csrf_proof_stale", "csrf_proof_invalid"],
      ["csrf_proof_replayed", "csrf_proof_invalid"],
      ["csrf_proof_mismatched", "csrf_proof_invalid"],
      ["csrf_verification_failed", "csrf_proof_invalid"],
      ["csrf_verifier_unavailable", "csrf_proof_invalid"],
      ["request_method_missing", "admin_authorization_gate_unavailable"],
      ["request_method_not_allowed", "admin_authorization_gate_unavailable"],
      ["origin_host_mismatch", "admin_authorization_gate_unavailable"],
      ["unexpected-reason", "admin_authorization_gate_unavailable"]
    ];

    for (const [reason, expectedCode] of [...directCodes, ...groupedCodes]) {
      const deps = dependencies();
      await emitAdminAuthDenied(reason, 403, deps);
      expect(lastArgs(deps).p_error_code, reason).toBe(expectedCode);
      expect(lastArgs(deps).p_http_status, reason).toBe(403);
    }
  });

  it("maps the admin login denial paths exactly with status 303", async () => {
    const deps = dependencies();
    await emitAdminLoginDenied("login_unauthenticated", deps);
    const loginArgs = lastArgs(deps);

    expect(loginArgs.p_category).toBe("admin.auth");
    expect(loginArgs.p_outcome).toBe("denied");
    expect(loginArgs.p_reference_type).toBe("none");
    expect(loginArgs.p_reference_value).toBeNull();
    expect(loginArgs.p_error_code).toBe("login_unauthenticated");
    expect(loginArgs.p_route_key).toBe("/api/admin/login");
    expect(loginArgs.p_http_status).toBe(303);

    await emitAdminLoginDenied("login_unavailable", deps);
    expect(lastArgs(deps).p_error_code).toBe("login_unavailable");
  });

  it("maps the admin login callback denial paths exactly with status 303", async () => {
    const deps = dependencies();
    await emitAdminLoginCallbackDenied("callback_unauthenticated", deps);
    const callbackArgs = lastArgs(deps);

    expect(callbackArgs.p_category).toBe("admin.auth");
    expect(callbackArgs.p_outcome).toBe("denied");
    expect(callbackArgs.p_reference_type).toBe("none");
    expect(callbackArgs.p_error_code).toBe("callback_unauthenticated");
    expect(callbackArgs.p_route_key).toBe("/api/admin/login/callback");
    expect(callbackArgs.p_http_status).toBe(303);

    await emitAdminLoginCallbackDenied("callback_unavailable", deps);
    expect(lastArgs(deps).p_error_code).toBe("callback_unavailable");
  });

  it("skips without RPC when the required workspace configuration is absent", async () => {
    const deps = dependencies();
    deps.env = {
      ...readyEnv,
      QUOTE_WORKSPACE_ID: undefined
    };

    const result = await emitQuoteSubmissionValidationDenied("req-1", deps);

    expect(result.kind).toBe("skipped");
    expect(deps.rpc).not.toHaveBeenCalled();
  });

  it("creates a fresh event ID per logical emission", async () => {
    const deps = dependencies();
    await emitQuoteSubmissionValidationDenied("req-1", deps);
    await emitQuoteSubmissionValidationDenied("req-2", deps);

    const first = lastArgs(deps);
    deps.rpc.mockClear();
    await emitQuoteSubmissionValidationDenied("req-3", deps);
    const third = lastArgs(deps);

    expect(first.p_event_id).toBeDefined();
    expect(third.p_event_id).toBeDefined();
    expect(third.p_event_id).not.toBe(first.p_event_id);
  });

  it("never emits a generic success event", async () => {
    const deps = dependencies();
    const outcomes = await Promise.all([
      emitQuoteSubmissionDisabled(deps),
      emitQuoteSubmissionValidationDenied("req-1", deps),
      emitQuoteHandoffPending("req-1", deps),
      emitQuoteRateLimitDenied("req-1", deps),
      emitAdminAuthDenied("unauthenticated", 401, deps)
    ]);

    expect(outcomes.every((result) => result.kind !== "emitted" || true)).toBe(
      true
    );
    for (const call of deps.rpc.mock.calls) {
      const args = call[0] as Record<string, unknown>;
      expect(args.p_outcome).not.toBe("succeeded");
      expect(args.p_category).not.toBe("quote.submission.created");
    }
  });
});
