import "server-only";

import * as crypto from "node:crypto";
import type {
  ServerAdminCsrfProofIssuerDependencies,
  ServerAdminCsrfProofSignerInput
} from "./server-admin-csrf-proof-issuer";
import type {
  ServerAdminCsrfProofVerifierDependencies,
  ServerAdminCsrfSignatureVerifierInput
} from "./server-admin-csrf-proof-verifier";

export function generateServerAdminCsrfNonce(): string {
  // cryptographically random and base64url safe
  return crypto.randomBytes(32).toString("base64url");
}

function getCsrfSecret(): string | null {
  const secret = process.env.ADMIN_CSRF_PROOF_SECRET?.trim();
  return secret ? secret : null;
}

function computeSignatureSegment(payloadSegment: string): string | null {
  const secret = getCsrfSecret();

  if (!secret) {
    return null;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payloadSegment);
    return hmac.digest("base64url");
  } catch {
    return null;
  }
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
    verifierDependencies: {
      ...verifierContext,
      verifySignature: verifyServerAdminCsrfSignature
      // checkReplay is intentionally deferred
    }
  };
}
