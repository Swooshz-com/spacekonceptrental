import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  generateServerAdminCsrfNonce,
  signServerAdminCsrfProof,
  verifyServerAdminCsrfSignature,
  createServerAdminCsrfProofRuntimeDependencies
} from "../lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies";
import { issueServerAdminCsrfProof } from "../lib/admin/authorization/server-admin-csrf-proof-issuer";
import { verifyServerAdminCsrfProof } from "../lib/admin/authorization/server-admin-csrf-proof-verifier";

describe("Phase 2B-AG - admin CSRF proof runtime dependencies", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("generateServerAdminCsrfNonce", () => {
    it("generates a non-empty string", () => {
      const nonce = generateServerAdminCsrfNonce();
      expect(typeof nonce).toBe("string");
      expect(nonce.length).toBeGreaterThan(0);
    });

    it("generates base64url safe string", () => {
      const nonce = generateServerAdminCsrfNonce();
      expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("generates different values across calls", () => {
      const nonce1 = generateServerAdminCsrfNonce();
      const nonce2 = generateServerAdminCsrfNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe("signServerAdminCsrfProof and verifyServerAdminCsrfSignature", () => {
    const dummyPayload = {
      operation: "product.write" as const,
      sessionBinding: "test-session",
      nonce: "test-nonce",
      issuedAt: 1000,
      expiresAt: 2000
    };
    const input = {
      payloadSegment: "dGVzdC1wYXlsb2Fk", // dummy base64
      payloadJson: "{}",
      payload: dummyPayload
    };

    it("fails closed on missing secret", () => {
      delete process.env.ADMIN_CSRF_PROOF_SECRET;
      
      const signature = signServerAdminCsrfProof(input);
      expect(signature).toBeNull();
      
      const isValid = verifyServerAdminCsrfSignature({
        ...input,
        signatureSegment: "dummy"
      });
      expect(isValid).toBe(false);
    });

    it("fails closed on blank secret", () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "   ";
      
      const signature = signServerAdminCsrfProof(input);
      expect(signature).toBeNull();
      
      const isValid = verifyServerAdminCsrfSignature({
        ...input,
        signatureSegment: "dummy"
      });
      expect(isValid).toBe(false);
    });

    it("signs a known payload and produces a base64url signature", () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "test-secret";
      
      const signature = signServerAdminCsrfProof(input);
      expect(typeof signature).toBe("string");
      expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("verifies a valid signature", () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "test-secret";
      
      const signature = signServerAdminCsrfProof(input);
      expect(signature).not.toBeNull();
      
      const isValid = verifyServerAdminCsrfSignature({
        ...input,
        signatureSegment: signature!
      });
      
      expect(isValid).toBe(true);
    });

    it("rejects tampered payload segment", () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "test-secret";
      
      const signature = signServerAdminCsrfProof(input);
      expect(signature).not.toBeNull();
      
      const isValid = verifyServerAdminCsrfSignature({
        ...input,
        payloadSegment: "tampered",
        signatureSegment: signature!
      });
      
      expect(isValid).toBe(false);
    });

    it("rejects tampered signature segment", () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "test-secret";
      
      const signature = signServerAdminCsrfProof(input);
      expect(signature).not.toBeNull();
      
      const isValid = verifyServerAdminCsrfSignature({
        ...input,
        signatureSegment: "tampered-signature"
      });
      
      expect(isValid).toBe(false);
    });

    it("rejects wrong secret", () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "test-secret";
      const signature = signServerAdminCsrfProof(input);
      expect(signature).not.toBeNull();
      
      process.env.ADMIN_CSRF_PROOF_SECRET = "wrong-secret";
      const isValid = verifyServerAdminCsrfSignature({
        ...input,
        signatureSegment: signature!
      });
      
      expect(isValid).toBe(false);
    });
  });

  describe("Integration shape with issuer and verifier", () => {
    it("can issue and verify a proof using the runtime dependencies", async () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "integration-secret";
      
      const dependencies = createServerAdminCsrfProofRuntimeDependencies({
        expectedSessionBinding: "session-123",
        expectedNonce: null,
        currentTimestampMs: 1500,
        maxProofAgeMs: 5000
      });
      
      const issueResult = await issueServerAdminCsrfProof(
        {
          operation: "product.write",
          sessionBinding: "session-123",
          issuedAt: 1000,
          expiresAt: 2000
        },
        dependencies.issuerDependencies
      );
      
      expect(issueResult.issued).toBe(true);
      if (!issueResult.issued) return;
      
      const verifyResult = await verifyServerAdminCsrfProof(
        {
          requestedOperation: "product.write",
          requestMethod: "POST",
          requestOrigin: "http://localhost",
          requestHost: "localhost",
          csrfProof: issueResult.csrfProof
        },
        dependencies.verifierDependencies
      );
      
      expect(verifyResult.valid).toBe(true);
    });

    it("existing issuer still rejects unsupported operations", async () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "integration-secret";
      const dependencies = createServerAdminCsrfProofRuntimeDependencies();
      
      const issueResult = await issueServerAdminCsrfProof(
        {
          operation: "unsupported.op",
          sessionBinding: "session-123",
          issuedAt: 1000,
          expiresAt: 2000
        },
        dependencies.issuerDependencies
      );
      
      expect(issueResult.issued).toBe(false);
      if (!issueResult.issued) {
        expect(issueResult.reason).toBe("operation_not_supported");
      }
    });

    it("existing issuer still rejects non-state-changing operations", async () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "integration-secret";
      const dependencies = createServerAdminCsrfProofRuntimeDependencies();
      
      const issueResult = await issueServerAdminCsrfProof(
        {
          operation: "admin.auth.check",
          sessionBinding: "session-123",
          issuedAt: 1000,
          expiresAt: 2000
        },
        dependencies.issuerDependencies
      );
      
      expect(issueResult.issued).toBe(false);
      if (!issueResult.issued) {
        expect(issueResult.reason).toBe("operation_not_state_changing");
      }
    });

    it("existing verifier still rejects mismatched target operation", async () => {
      process.env.ADMIN_CSRF_PROOF_SECRET = "integration-secret";
      
      const dependencies = createServerAdminCsrfProofRuntimeDependencies({
        expectedSessionBinding: "session-123",
        currentTimestampMs: 1500,
        maxProofAgeMs: 5000
      });
      
      const issueResult = await issueServerAdminCsrfProof(
        {
          operation: "product.write",
          sessionBinding: "session-123",
          issuedAt: 1000,
          expiresAt: 2000
        },
        dependencies.issuerDependencies
      );
      
      expect(issueResult.issued).toBe(true);
      if (!issueResult.issued) return;
      
      const verifyResult = await verifyServerAdminCsrfProof(
        {
          requestedOperation: "category.write", // mismatched
          requestMethod: "POST",
          requestOrigin: "http://localhost",
          requestHost: "localhost",
          csrfProof: issueResult.csrfProof
        },
        dependencies.verifierDependencies
      );
      
      expect(verifyResult.valid).toBe(false);
      if (!verifyResult.valid) {
        expect(verifyResult.reason).toBe("csrf_proof_mismatched");
      }
    });
  });
});
