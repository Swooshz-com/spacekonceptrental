import "server-only";

import {
  isSupportedAdminOperation,
  type AdminOperation
} from "./admin-authorization-policy";

export type StateChangingAdminOperation =
  | "product.write"
  | "category.write"
  | "productImage.write"
  | "membership.manage";

export type ServerAdminRequestSecurityPreflightInput = {
  requestedOperation?: AdminOperation | string | null;
  requestMethod?: string | null;
  requestOrigin?: string | null;
  requestHost?: string | null;
  expectedOrigin?: string | null;
  expectedHost?: string | null;
  csrfProof?: string | null;
};

export type ServerAdminCsrfProofFailureReason =
  | "csrf_proof_invalid"
  | "csrf_proof_stale"
  | "csrf_proof_replayed"
  | "csrf_proof_mismatched";

export type ServerAdminCsrfProofVerifierInput = {
  requestedOperation: StateChangingAdminOperation;
  requestMethod: "POST";
  requestOrigin: string;
  requestHost: string;
  csrfProof: string;
};

export type ServerAdminCsrfProofVerifierResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      reason: ServerAdminCsrfProofFailureReason;
    };

export type ServerAdminRequestSecurityPreflightDependencies = {
  verifyCsrfProof?: (
    input: ServerAdminCsrfProofVerifierInput
  ) =>
    | ServerAdminCsrfProofVerifierResult
    | Promise<ServerAdminCsrfProofVerifierResult>;
};

export type ServerAdminRequestSecurityPreflightAllowReason =
  "request_security_preflight_passed";

export type ServerAdminRequestSecurityPreflightDenyReason =
  | "operation_not_supported"
  | "request_method_missing"
  | "request_method_not_allowed"
  | "origin_missing"
  | "host_missing"
  | "origin_host_mismatch"
  | "csrf_proof_missing"
  | "csrf_verifier_unavailable"
  | "csrf_verification_failed"
  | ServerAdminCsrfProofFailureReason;

export type ServerAdminRequestSecurityPreflightResult =
  | {
      allowed: true;
      reason: ServerAdminRequestSecurityPreflightAllowReason;
    }
  | {
      allowed: false;
      reason: ServerAdminRequestSecurityPreflightDenyReason;
      statusCode: 400 | 403;
    };

const stateChangingOperations = new Set<StateChangingAdminOperation>([
  "product.write",
  "category.write",
  "productImage.write",
  "membership.manage"
]);

const readOnlySafeMethods = new Set(["GET", "HEAD"]);

function allow(): ServerAdminRequestSecurityPreflightResult {
  return {
    allowed: true,
    reason: "request_security_preflight_passed"
  };
}

function deny(
  reason: ServerAdminRequestSecurityPreflightDenyReason,
  statusCode: 400 | 403
): ServerAdminRequestSecurityPreflightResult {
  return {
    allowed: false,
    reason,
    statusCode
  };
}

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeMethod(value: string | null | undefined) {
  return normalizeRequired(value)?.toUpperCase() ?? null;
}

function normalizeHost(value: string | null | undefined) {
  return normalizeRequired(value)?.toLowerCase() ?? null;
}

function parseOrigin(value: string) {
  try {
    const origin = new URL(value).origin.toLowerCase();
    const host = new URL(origin).host.toLowerCase();

    return {
      host,
      origin
    };
  } catch {
    return null;
  }
}

function getExpectedHost(input: ServerAdminRequestSecurityPreflightInput) {
  const expectedHost = normalizeHost(input.expectedHost);

  if (expectedHost) {
    return expectedHost;
  }

  const expectedOrigin = normalizeRequired(input.expectedOrigin);

  return expectedOrigin ? parseOrigin(expectedOrigin)?.host ?? null : null;
}

function isStateChangingOperation(
  operation: AdminOperation
): operation is StateChangingAdminOperation {
  return stateChangingOperations.has(operation as StateChangingAdminOperation);
}

function validateSameOrigin(
  input: ServerAdminRequestSecurityPreflightInput
):
  | {
      ok: true;
      requestOrigin: string;
      requestHost: string;
    }
  | {
      ok: false;
      result: ServerAdminRequestSecurityPreflightResult;
    } {
  const rawOrigin = normalizeRequired(input.requestOrigin);

  if (!rawOrigin) {
    return {
      ok: false,
      result: deny("origin_missing", 400)
    };
  }

  const requestHost = normalizeHost(input.requestHost);

  if (!requestHost) {
    return {
      ok: false,
      result: deny("host_missing", 400)
    };
  }

  const requestOrigin = parseOrigin(rawOrigin);
  const expectedOrigin = normalizeRequired(input.expectedOrigin);
  const normalizedExpectedOrigin = expectedOrigin
    ? parseOrigin(expectedOrigin)?.origin ?? null
    : null;
  const expectedHost = getExpectedHost(input);

  if (
    !requestOrigin ||
    !expectedHost ||
    requestHost !== expectedHost ||
    requestOrigin.host !== requestHost ||
    (normalizedExpectedOrigin &&
      requestOrigin.origin !== normalizedExpectedOrigin)
  ) {
    return {
      ok: false,
      result: deny("origin_host_mismatch", 403)
    };
  }

  return {
    ok: true,
    requestOrigin: requestOrigin.origin,
    requestHost
  };
}

function validateReadOnlySafeHost(
  input: ServerAdminRequestSecurityPreflightInput
): ServerAdminRequestSecurityPreflightResult | null {
  const requestHost = normalizeHost(input.requestHost);

  if (!requestHost) {
    return deny("host_missing", 400);
  }

  const expectedHost = getExpectedHost(input);

  if (!expectedHost || requestHost !== expectedHost) {
    return deny("origin_host_mismatch", 403);
  }

  return null;
}

export async function validateServerAdminRequestSecurityPreflight(
  input: ServerAdminRequestSecurityPreflightInput,
  dependencies: ServerAdminRequestSecurityPreflightDependencies = {}
): Promise<ServerAdminRequestSecurityPreflightResult> {
  const requestMethod = normalizeMethod(input.requestMethod);

  if (!requestMethod) {
    return deny("request_method_missing", 400);
  }

  const requestedOperation = normalizeRequired(input.requestedOperation);

  if (
    !requestedOperation ||
    !isSupportedAdminOperation(requestedOperation)
  ) {
    return deny("operation_not_supported", 400);
  }

  if (!isStateChangingOperation(requestedOperation)) {
    if (requestedOperation === "admin.csrf.issue") {
      if (requestMethod !== "POST") {
        return deny("request_method_not_allowed", 403);
      }

      const sameOrigin = validateSameOrigin(input);

      return sameOrigin.ok ? allow() : sameOrigin.result;
    }

    if (!readOnlySafeMethods.has(requestMethod)) {
      return deny("request_method_not_allowed", 403);
    }

    const rawOrigin = normalizeRequired(input.requestOrigin);

    if (!rawOrigin) {
      return validateReadOnlySafeHost(input) ?? allow();
    }

    const sameOrigin = validateSameOrigin(input);

    return sameOrigin.ok ? allow() : sameOrigin.result;
  }

  if (requestMethod !== "POST") {
    return deny("request_method_not_allowed", 403);
  }

  const sameOrigin = validateSameOrigin(input);

  if (!sameOrigin.ok) {
    return sameOrigin.result;
  }

  const csrfProof = normalizeRequired(input.csrfProof);

  if (!csrfProof) {
    return deny("csrf_proof_missing", 403);
  }

  if (!dependencies.verifyCsrfProof) {
    return deny("csrf_verifier_unavailable", 403);
  }

  try {
    const verification = await dependencies.verifyCsrfProof({
      requestedOperation,
      requestMethod,
      requestOrigin: sameOrigin.requestOrigin,
      requestHost: sameOrigin.requestHost,
      csrfProof
    });

    return verification.valid ? allow() : deny(verification.reason, 403);
  } catch {
    return deny("csrf_verification_failed", 403);
  }
}
