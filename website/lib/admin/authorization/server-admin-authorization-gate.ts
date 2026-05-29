import "server-only";

import type { AdminAuthResolutionInput } from "./admin-authorization-resolver";
import type {
  AdminAuthorizationAllowReason,
  AdminAuthorizationDenyReason,
  AdminOperation
} from "./admin-authorization-policy";
import {
  resolveServerAdminAuthorizationDecision,
  type ServerAdminAuthorizationDecisionDependencies,
  type ServerAdminAuthorizationDecisionResult
} from "./server-admin-authorization-decision";
import {
  validateServerAdminRequestSecurityPreflight,
  type ServerAdminRequestSecurityPreflightDependencies,
  type ServerAdminRequestSecurityPreflightDenyReason,
  type ServerAdminRequestSecurityPreflightInput,
  type ServerAdminRequestSecurityPreflightResult
} from "./server-admin-request-security-preflight";
import {
  createServerAdminCsrfProofVerifier,
  type ServerAdminCsrfProofVerifierDependencies
} from "./server-admin-csrf-proof-verifier";

export type ServerAdminAuthorizationGateInput = {
  requestedOperation?: AdminOperation | string | null;
  requestedRecordWorkspaceId?: string | null;
  requestedWorkspaceIdForValidationOnly?: string | null;
  requestId?: string;
  requestMethod?: string | null;
  requestOrigin?: string | null;
  requestHost?: string | null;
  expectedOrigin?: string | null;
  expectedHost?: string | null;
  csrfProof?: string | null;
};

export type ServerAdminAuthorizationGateUnavailableReason =
  "admin_authorization_gate_unavailable";

export type ServerAdminAuthorizationGateDenyReason =
  | ServerAdminRequestSecurityPreflightDenyReason
  | AdminAuthorizationDenyReason;

export type ServerAdminAuthorizationGateResult =
  | {
      allowed: true;
      reason: AdminAuthorizationAllowReason;
      statusCode: 200;
      workspaceId?: string;
      requestId?: string;
    }
  | {
      allowed: false;
      reason: ServerAdminAuthorizationGateDenyReason;
      statusCode: 400 | 401 | 403;
      requestId?: string;
    }
  | {
      allowed: false;
      reason: ServerAdminAuthorizationGateUnavailableReason;
      statusCode: 503;
      requestId?: string;
    };

export type ServerAdminAuthorizationGateDependencies = {
  preflight?: ServerAdminRequestSecurityPreflightDependencies;
  csrfVerifier?: ServerAdminCsrfProofVerifierDependencies;
  decision?: ServerAdminAuthorizationDecisionDependencies;
  validatePreflight?: (
    input: ServerAdminRequestSecurityPreflightInput,
    dependencies?: ServerAdminRequestSecurityPreflightDependencies
  ) => Promise<ServerAdminRequestSecurityPreflightResult>;
  resolveDecision?: (
    input: AdminAuthResolutionInput,
    dependencies?: ServerAdminAuthorizationDecisionDependencies
  ) => Promise<ServerAdminAuthorizationDecisionResult>;
};

const preflightDenyReasons = new Set<string>([
  "operation_not_supported",
  "request_method_missing",
  "request_method_not_allowed",
  "origin_missing",
  "host_missing",
  "origin_host_mismatch",
  "csrf_proof_missing",
  "csrf_verifier_unavailable",
  "csrf_verification_failed",
  "csrf_proof_invalid",
  "csrf_proof_stale",
  "csrf_proof_replayed",
  "csrf_proof_mismatched"
]);

const decisionDenyReasons = new Set<string>([
  "unauthenticated",
  "admin_profile_missing",
  "admin_profile_inactive",
  "workspace_missing",
  "membership_missing",
  "membership_inactive",
  "membership_actor_mismatch",
  "workspace_mismatch",
  "role_not_allowed",
  "operation_not_supported"
]);

function withRequestId<T extends { requestId?: string }>(
  result: Omit<T, "requestId">,
  requestId: string | undefined
): T {
  return {
    ...result,
    ...(requestId ? { requestId } : {})
  } as T;
}

function unavailable(
  input: ServerAdminAuthorizationGateInput
): ServerAdminAuthorizationGateResult {
  return withRequestId(
    {
      allowed: false,
      reason: "admin_authorization_gate_unavailable",
      statusCode: 503
    },
    input.requestId
  );
}

function isPreflightDenyReason(
  reason: unknown
): reason is ServerAdminRequestSecurityPreflightDenyReason {
  return typeof reason === "string" && preflightDenyReasons.has(reason);
}

function isDecisionDenyReason(
  reason: unknown
): reason is AdminAuthorizationDenyReason {
  return typeof reason === "string" && decisionDenyReasons.has(reason);
}

function toPreflightInput(
  input: ServerAdminAuthorizationGateInput
): ServerAdminRequestSecurityPreflightInput {
  return {
    requestedOperation: input.requestedOperation,
    requestMethod: input.requestMethod,
    requestOrigin: input.requestOrigin,
    requestHost: input.requestHost,
    expectedOrigin: input.expectedOrigin,
    expectedHost: input.expectedHost,
    csrfProof: input.csrfProof
  };
}

function toDecisionInput(
  input: ServerAdminAuthorizationGateInput
): AdminAuthResolutionInput {
  const decisionInput: AdminAuthResolutionInput = {};

  if (input.requestedOperation !== null && input.requestedOperation !== undefined) {
    decisionInput.requestedOperation = input.requestedOperation;
  }

  if (input.requestedRecordWorkspaceId !== undefined) {
    decisionInput.requestedRecordWorkspaceId =
      input.requestedRecordWorkspaceId;
  }

  if (input.requestedWorkspaceIdForValidationOnly !== undefined) {
    decisionInput.requestedWorkspaceIdForValidationOnly =
      input.requestedWorkspaceIdForValidationOnly;
  }

  if (input.requestId) {
    decisionInput.requestId = input.requestId;
  }

  return decisionInput;
}

function createPreflightDependencies(
  dependencies: ServerAdminAuthorizationGateDependencies
): ServerAdminRequestSecurityPreflightDependencies {
  const preflightDependencies = {
    ...(dependencies.preflight ?? {})
  };

  if (dependencies.csrfVerifier) {
    preflightDependencies.verifyCsrfProof = createServerAdminCsrfProofVerifier(
      dependencies.csrfVerifier
    );
  }

  return preflightDependencies;
}

function mapPreflightResult(
  input: ServerAdminAuthorizationGateInput,
  result: ServerAdminRequestSecurityPreflightResult
): ServerAdminAuthorizationGateResult | null {
  if (result.allowed) {
    return null;
  }

  if (
    !isPreflightDenyReason(result.reason) ||
    (result.statusCode !== 400 && result.statusCode !== 403)
  ) {
    return unavailable(input);
  }

  return withRequestId(
    {
      allowed: false,
      reason: result.reason,
      statusCode: result.statusCode
    },
    input.requestId
  );
}

function mapDecisionResult(
  input: ServerAdminAuthorizationGateInput,
  result: ServerAdminAuthorizationDecisionResult
): ServerAdminAuthorizationGateResult {
  if ("resolved" in result && result.resolved === false) {
    return unavailable(input);
  }

  if (result.allowed) {
    return withRequestId(
      {
        allowed: true,
        reason: "allowed",
        statusCode: 200,
        ...(result.workspaceId ? { workspaceId: result.workspaceId } : {})
      },
      input.requestId
    );
  }

  if (
    !isDecisionDenyReason(result.reason) ||
    ![400, 401, 403].includes(result.statusCode)
  ) {
    return unavailable(input);
  }

  return withRequestId(
    {
      allowed: false,
      reason: result.reason,
      statusCode: result.statusCode
    },
    input.requestId
  );
}

export async function resolveServerAdminAuthorizationGate(
  input: ServerAdminAuthorizationGateInput,
  dependencies: ServerAdminAuthorizationGateDependencies = {}
): Promise<ServerAdminAuthorizationGateResult> {
  try {
    const validatePreflight =
      dependencies.validatePreflight ??
      validateServerAdminRequestSecurityPreflight;
    const preflightResult = await validatePreflight(
      toPreflightInput(input),
      createPreflightDependencies(dependencies)
    );
    const mappedPreflightResult = mapPreflightResult(input, preflightResult);

    if (mappedPreflightResult) {
      return mappedPreflightResult;
    }

    const resolveDecision =
      dependencies.resolveDecision ?? resolveServerAdminAuthorizationDecision;
    const decisionResult = await resolveDecision(
      toDecisionInput(input),
      dependencies.decision ?? {}
    );

    return mapDecisionResult(input, decisionResult);
  } catch {
    return unavailable(input);
  }
}
