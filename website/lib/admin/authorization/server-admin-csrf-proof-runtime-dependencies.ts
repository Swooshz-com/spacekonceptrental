import "server-only";

import * as crypto from "node:crypto";
import type {
  ServerAdminCsrfProofIssuerDependencies,
  ServerAdminCsrfProofSignerInput
} from "./server-admin-csrf-proof-issuer";
import type {
  ServerAdminCsrfProofBindingOperation,
  ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput
} from "./server-admin-csrf-proof-session-workspace-binding";
import type {
  ServerAdminCsrfProofVerifierDependencies,
  ServerAdminCsrfSignatureVerifierInput
} from "./server-admin-csrf-proof-verifier";

const bindingVersion = "csrf-session-binding-v1";
const csrfProofBindingOperations = new Set<ServerAdminCsrfProofBindingOperation>(
  [
    "product.write",
    "category.write",
    "productImage.write",
    "quote.write",
    "membership.manage"
  ]
);
const csrfProofBindingRoles = new Set(["owner", "admin"]);

export function generateServerAdminCsrfNonce(): string {
  // cryptographically random and base64url safe
  return crypto.randomBytes(32).toString("base64url");
}

function getCsrfSecret(): string | null {
  const secret = process.env.ADMIN_CSRF_PROOF_SECRET?.trim();
  return secret ? secret : null;
}

function computeHmacBase64Url(value: string): string | null {
  const secret = getCsrfSecret();

  if (!secret) {
    return null;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(value);
    return hmac.digest("base64url");
  } catch {
    return null;
  }
}

function computeSignatureSegment(payloadSegment: string): string | null {
  return computeHmacBase64Url(payloadSegment);
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isBindingOperation(
  value: string | null
): value is ServerAdminCsrfProofBindingOperation {
  return csrfProofBindingOperations.has(
    value as ServerAdminCsrfProofBindingOperation
  );
}

function isBindingRole(value: string | null) {
  return value ? csrfProofBindingRoles.has(value) : false;
}

function createCanonicalBindingPayload(
  input: ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput
) {
  const requestedOperation = normalizeRequiredString(input.requestedOperation);
  const authUserId = normalizeRequiredString(input.authUserId);
  const adminUserId = normalizeRequiredString(input.adminUserId);
  const workspaceId = normalizeRequiredString(input.workspaceId);
  const membershipRole = normalizeRequiredString(input.membershipRole);

  if (
    !isBindingOperation(requestedOperation) ||
    !authUserId ||
    !adminUserId ||
    !workspaceId ||
    !isBindingRole(membershipRole)
  ) {
    return null;
  }

  return JSON.stringify([
    ["version", bindingVersion],
    ["requestedOperation", requestedOperation],
    ["authUserId", authUserId],
    ["adminUserId", adminUserId],
    ["workspaceId", workspaceId],
    ["membershipRole", membershipRole]
  ]);
}

export function deriveServerAdminCsrfProofSessionWorkspaceBinding(
  input: ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput
): string | null {
  const canonicalPayload = createCanonicalBindingPayload(input);

  if (!canonicalPayload) {
    return null;
  }

  const digest = computeHmacBase64Url(canonicalPayload);

  return digest ? `${bindingVersion}.${digest}` : null;
}

export function signServerAdminCsrfProof(
  input: ServerAdminCsrfProofSignerInput
): string | null {
  return computeSignatureSegment(input.payloadSegment);
}

export function verifyServerAdminCsrfSignature(
  input: ServerAdminCsrfSignatureVerifierInput
): boolean {
  try {
    const expectedSignature = computeSignatureSegment(input.payloadSegment);
    if (!expectedSignature) {
      return false;
    }

    const a = Buffer.from(input.signatureSegment, "utf8");
    const b = Buffer.from(expectedSignature, "utf8");

    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type ServerAdminCsrfProofRuntimeDependencies = {
  issuerDependencies: ServerAdminCsrfProofIssuerDependencies;
  sessionWorkspaceBindingDependencies: {
    deriveSessionWorkspaceBinding: typeof deriveServerAdminCsrfProofSessionWorkspaceBinding;
  };
  verifierDependencies: ServerAdminCsrfProofVerifierDependencies;
};

export function createServerAdminCsrfProofRuntimeDependencies(
  verifierContext: Omit<
    ServerAdminCsrfProofVerifierDependencies,
    "verifySignature" | "checkReplay"
  > = {}
): ServerAdminCsrfProofRuntimeDependencies {
  return {
    issuerDependencies: {
      generateNonce: generateServerAdminCsrfNonce,
      signCsrfProof: signServerAdminCsrfProof
    },
    sessionWorkspaceBindingDependencies: {
      deriveSessionWorkspaceBinding:
        deriveServerAdminCsrfProofSessionWorkspaceBinding
    },
    verifierDependencies: {
      ...verifierContext,
      verifySignature: verifyServerAdminCsrfSignature
      // checkReplay is intentionally deferred
    }
  };
}
