import "server-only";

import { isCsrfProtectedAdminOperation } from "./admin-authorization-policy";
import type {
  ServerAdminCsrfProofVerifierInput,
  ServerAdminCsrfProofVerifierResult as PreflightCsrfProofVerifierResult,
  CsrfProtectedAdminOperation
} from "./server-admin-request-security-preflight";

export type ServerAdminCsrfProofVerifierResult =
  PreflightCsrfProofVerifierResult;

export type ServerAdminCsrfProofPayload = {
  operation: CsrfProtectedAdminOperation;
  sessionBinding: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export type ServerAdminCsrfSignatureVerifierInput = {
  payloadSegment: string;
  signatureSegment: string;
  payload: ServerAdminCsrfProofPayload;
};

export type ServerAdminCsrfSignatureVerifierResult =
  | boolean
  | {
      valid: boolean;
    };

export type ServerAdminCsrfReplayCheckInput = {
  operation: CsrfProtectedAdminOperation;
  expectedWorkspaceId: string;
  sessionBinding: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export type ServerAdminCsrfReplayCheckResult = unknown;

export type ServerAdminCsrfProofVerifierDependencies = {
  expectedSessionBinding?: string | null;
  expectedWorkspaceId?: string | null;
  expectedNonce?: string | null;
  currentTimestampMs?: number | null;
  maxProofAgeMs?: number | null;
  verifySignature?: (
    input: ServerAdminCsrfSignatureVerifierInput
  ) =>
    | ServerAdminCsrfSignatureVerifierResult
    | Promise<ServerAdminCsrfSignatureVerifierResult>;
  checkReplay?: (
    input: ServerAdminCsrfReplayCheckInput
  ) =>
    | ServerAdminCsrfReplayCheckResult
    | Promise<ServerAdminCsrfReplayCheckResult>;
};

const base64UrlPattern = /^[A-Za-z0-9_-]+$/;

function valid(): ServerAdminCsrfProofVerifierResult {
  return {
    valid: true
  };
}

function invalid(): ServerAdminCsrfProofVerifierResult {
  return {
    valid: false,
    reason: "csrf_proof_invalid"
  };
}

function stale(): ServerAdminCsrfProofVerifierResult {
  return {
    valid: false,
    reason: "csrf_proof_stale"
  };
}

function replayed(): ServerAdminCsrfProofVerifierResult {
  return {
    valid: false,
    reason: "csrf_proof_replayed"
  };
}

function mismatched(): ServerAdminCsrfProofVerifierResult {
  return {
    valid: false,
    reason: "csrf_proof_mismatched"
  };
}

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function decodePayload(segment: string) {
  if (!base64UrlPattern.test(segment)) {
    return null;
  }

  try {
    const decoded = Buffer["from"](segment, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);

    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseProof(value: string | null | undefined) {
  const proof = normalizeRequired(value);

  if (!proof) {
    return null;
  }

  const segments = proof.split(".");

  if (
    segments.length !== 2 ||
    !segments[0] ||
    !segments[1] ||
    !base64UrlPattern.test(segments[1])
  ) {
    return null;
  }

  const payload = decodePayload(segments[0]);

  return payload
    ? {
        payload,
        payloadSegment: segments[0],
        signatureSegment: segments[1]
      }
    : null;
}

/**
 * Reads only the signed proof operation before a request body is consumed.
 * The value is intentionally untrusted until verifyServerAdminCsrfProof has
 * checked the signature; callers may use it only to select a closed route
 * allowlist and must perform the full verifier call before any body work.
 */
export function readServerAdminCsrfProofOperation(
  value: string | null | undefined
): CsrfProtectedAdminOperation | null {
  const parsedProof = parseProof(value);

  if (!parsedProof) {
    return null;
  }

  const payload = toPayload(parsedProof.payload);

  return payload?.operation ?? null;
}

function toPayload(
  payload: Record<string, unknown>
): ServerAdminCsrfProofPayload | null {
  if (
    typeof payload.operation !== "string" ||
    typeof payload.sessionBinding !== "string" ||
    typeof payload.nonce !== "string" ||
    !isValidTimestamp(payload.issuedAt) ||
    !isValidTimestamp(payload.expiresAt)
  ) {
    return null;
  }

  if (!isCsrfProtectedAdminOperation(payload.operation)) {
    return null;
  }

  const sessionBinding = normalizeRequired(payload.sessionBinding);
  const nonce = normalizeRequired(payload.nonce);

  if (!sessionBinding || !nonce || payload.issuedAt >= payload.expiresAt) {
    return null;
  }

  return {
    operation: payload.operation as CsrfProtectedAdminOperation,
    sessionBinding,
    nonce,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt
  };
}

function signatureIsValid(result: ServerAdminCsrfSignatureVerifierResult) {
  return typeof result === "boolean" ? result : result.valid === true;
}

function getCurrentTimestampMs(
  dependencies: ServerAdminCsrfProofVerifierDependencies
) {
  return isValidTimestamp(dependencies.currentTimestampMs)
    ? dependencies.currentTimestampMs
    : null;
}

function getMaxProofAgeMs(
  dependencies: ServerAdminCsrfProofVerifierDependencies
) {
  const maxProofAgeMs = dependencies.maxProofAgeMs;

  return typeof maxProofAgeMs === "number" &&
    Number.isFinite(maxProofAgeMs) &&
    maxProofAgeMs > 0
    ? maxProofAgeMs
    : null;
}

export async function verifyServerAdminCsrfProof(
  input: ServerAdminCsrfProofVerifierInput,
  dependencies: ServerAdminCsrfProofVerifierDependencies
): Promise<ServerAdminCsrfProofVerifierResult> {
  const parsedProof = parseProof(input.csrfProof);

  if (!parsedProof) {
    return invalid();
  }

  const payload = toPayload(parsedProof.payload);

  if (!payload) {
    return invalid();
  }

  if (payload.operation !== input.requestedOperation) {
    return mismatched();
  }

  const expectedSessionBinding = normalizeRequired(
    dependencies.expectedSessionBinding
  );

  if (!expectedSessionBinding) {
    return invalid();
  }

  if (payload.sessionBinding !== expectedSessionBinding) {
    return mismatched();
  }

  const expectedWorkspaceId = normalizeRequired(
    dependencies.expectedWorkspaceId
  );

  if (!expectedWorkspaceId) {
    return replayed();
  }

  const expectedNonce = normalizeRequired(dependencies.expectedNonce);

  if (expectedNonce && payload.nonce !== expectedNonce) {
    return mismatched();
  }

  const currentTimestampMs = getCurrentTimestampMs(dependencies);
  const maxProofAgeMs = getMaxProofAgeMs(dependencies);

  if (currentTimestampMs === null || maxProofAgeMs === null) {
    return invalid();
  }

  if (payload.issuedAt > currentTimestampMs) {
    return invalid();
  }

  if (
    currentTimestampMs >= payload.expiresAt ||
    currentTimestampMs - payload.issuedAt > maxProofAgeMs
  ) {
    return stale();
  }

  if (!dependencies.verifySignature) {
    return invalid();
  }

  try {
    const signatureResult = await dependencies.verifySignature({
      payload,
      payloadSegment: parsedProof.payloadSegment,
      signatureSegment: parsedProof.signatureSegment
    });

    if (!signatureIsValid(signatureResult)) {
      return invalid();
    }
  } catch {
    return invalid();
  }

  if (!dependencies.checkReplay) {
    return replayed();
  }

  try {
    const replayResult = await dependencies.checkReplay({
      operation: payload.operation,
      expectedWorkspaceId,
      sessionBinding: payload.sessionBinding,
      nonce: payload.nonce,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt
    });

    if (replayResult !== true) {
      return replayed();
    }
  } catch {
    return replayed();
  }

  return valid();
}

export function createServerAdminCsrfProofVerifier(
  dependencies: ServerAdminCsrfProofVerifierDependencies
) {
  return (input: ServerAdminCsrfProofVerifierInput) =>
    verifyServerAdminCsrfProof(input, dependencies);
}
