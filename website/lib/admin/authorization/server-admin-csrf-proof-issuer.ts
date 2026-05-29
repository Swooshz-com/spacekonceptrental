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

export type ServerAdminCsrfProofIssuerInput = {
  operation?: AdminOperation | string | null;
  sessionBinding?: string | null;
  nonce?: string | null;
  issuedAt?: number | null;
  expiresAt?: number | null;
};

export type ServerAdminCsrfProofIssuerPayload = {
  operation: StateChangingAdminOperation;
  sessionBinding: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export type ServerAdminCsrfProofSignerInput = {
  payloadSegment: string;
  payloadJson: string;
  payload: ServerAdminCsrfProofIssuerPayload;
};

export type ServerAdminCsrfProofSignerResult =
  | string
  | {
      signature?: string | null;
    }
  | null
  | undefined;

export type ServerAdminCsrfProofIssuerDependencies = {
  generateNonce?: () => unknown | Promise<unknown>;
  signCsrfProof?: (
    input: ServerAdminCsrfProofSignerInput
  ) => ServerAdminCsrfProofSignerResult | Promise<ServerAdminCsrfProofSignerResult>;
};

export type ServerAdminCsrfProofIssuerFailureReason =
  | "csrf_proof_issue_failed"
  | "operation_not_supported"
  | "operation_not_state_changing"
  | "session_binding_missing"
  | "nonce_missing"
  | "timestamp_invalid"
  | "signature_signer_unavailable";

export type ServerAdminCsrfProofIssuerResult =
  | {
      issued: true;
      csrfProof: string;
      expiresAt: number;
    }
  | {
      issued: false;
      reason: ServerAdminCsrfProofIssuerFailureReason;
    };

const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
const stateChangingOperations = new Set<StateChangingAdminOperation>([
  "product.write",
  "category.write",
  "productImage.write",
  "membership.manage"
]);

function notIssued(
  reason: ServerAdminCsrfProofIssuerFailureReason
): ServerAdminCsrfProofIssuerResult {
  return {
    issued: false,
    reason
  };
}

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeUnknownString(value: unknown) {
  return typeof value === "string" ? normalizeRequired(value) : null;
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStateChangingOperation(
  operation: AdminOperation
): operation is StateChangingAdminOperation {
  return stateChangingOperations.has(operation as StateChangingAdminOperation);
}

function encodeBase64Url(value: string) {
  return Buffer["from"](value, "utf8").toString("base64url");
}

async function resolveNonce(
  input: ServerAdminCsrfProofIssuerInput,
  dependencies: ServerAdminCsrfProofIssuerDependencies
) {
  const suppliedNonce = normalizeRequired(input.nonce);

  if (suppliedNonce) {
    return suppliedNonce;
  }

  if (!dependencies.generateNonce) {
    return null;
  }

  try {
    return normalizeUnknownString(await dependencies.generateNonce());
  } catch {
    return null;
  }
}

function getSignatureValue(result: ServerAdminCsrfProofSignerResult) {
  if (typeof result === "string") {
    return normalizeRequired(result);
  }

  if (isRecord(result) && typeof result.signature === "string") {
    return normalizeRequired(result.signature);
  }

  return null;
}

function toSignatureSegment(result: ServerAdminCsrfProofSignerResult) {
  const signature = getSignatureValue(result);

  if (!signature) {
    return null;
  }

  return base64UrlPattern.test(signature) ? signature : encodeBase64Url(signature);
}

export async function issueServerAdminCsrfProof(
  input: ServerAdminCsrfProofIssuerInput,
  dependencies: ServerAdminCsrfProofIssuerDependencies
): Promise<ServerAdminCsrfProofIssuerResult> {
  const requestedOperation = normalizeRequired(input.operation);

  if (
    !requestedOperation ||
    !isSupportedAdminOperation(requestedOperation)
  ) {
    return notIssued("operation_not_supported");
  }

  if (!isStateChangingOperation(requestedOperation)) {
    return notIssued("operation_not_state_changing");
  }

  const sessionBinding = normalizeRequired(input.sessionBinding);

  if (!sessionBinding) {
    return notIssued("session_binding_missing");
  }

  const nonce = await resolveNonce(input, dependencies);

  if (!nonce) {
    return notIssued("nonce_missing");
  }

  if (
    !isValidTimestamp(input.issuedAt) ||
    !isValidTimestamp(input.expiresAt) ||
    input.issuedAt >= input.expiresAt
  ) {
    return notIssued("timestamp_invalid");
  }

  if (!dependencies.signCsrfProof) {
    return notIssued("signature_signer_unavailable");
  }

  const payload: ServerAdminCsrfProofIssuerPayload = {
    operation: requestedOperation,
    sessionBinding,
    nonce,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt
  };
  const payloadJson = JSON.stringify(payload);
  const payloadSegment = encodeBase64Url(payloadJson);

  try {
    const signatureSegment = toSignatureSegment(
      await dependencies.signCsrfProof({
        payload,
        payloadJson,
        payloadSegment
      })
    );

    if (!signatureSegment) {
      return notIssued("csrf_proof_issue_failed");
    }

    return {
      issued: true,
      csrfProof: `${payloadSegment}.${signatureSegment}`,
      expiresAt: payload.expiresAt
    };
  } catch {
    return notIssued("csrf_proof_issue_failed");
  }
}

export function createServerAdminCsrfProofIssuer(
  dependencies: ServerAdminCsrfProofIssuerDependencies
) {
  return (input: ServerAdminCsrfProofIssuerInput) =>
    issueServerAdminCsrfProof(input, dependencies);
}
