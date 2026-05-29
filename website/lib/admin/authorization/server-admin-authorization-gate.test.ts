import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveServerAdminAuthorizationGate,
  type ServerAdminAuthorizationGateResult
} from "./server-admin-authorization-gate";
import type { ServerAdminCsrfProofVerifierDependencies } from "./server-admin-csrf-proof-verifier";

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-authorization-gate.ts"
);
const now = 1_700_000_000_000;

const safeReadInput = {
  requestedOperation: "catalogue.read",
  requestMethod: "GET",
  requestOrigin: "https://admin.space.test",
  requestHost: "admin.space.test",
  expectedOrigin: "https://admin.space.test",
  expectedHost: "admin.space.test",
  requestId: "request-1"
};

const safeWriteInput = {
  requestedOperation: "product.write",
  requestedRecordWorkspaceId: "workspace-1",
  requestedWorkspaceIdForValidationOnly: "workspace-1",
  requestMethod: "POST",
  requestOrigin: "https://admin.space.test",
  requestHost: "admin.space.test",
  expectedOrigin: "https://admin.space.test",
  expectedHost: "admin.space.test",
  requestId: "request-1"
};

const validPayload = {
  operation: "product.write",
  sessionBinding: "session-binding-1",
  nonce: "nonce-1",
  issuedAt: now - 1_000,
  expiresAt: now + 60_000
};

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function createProof(
  payload: Record<string, unknown> = validPayload,
  signature = "valid-signature"
) {
  return `${encodeBase64Url(JSON.stringify(payload))}.${encodeBase64Url(
    signature
  )}`;
}

function createCsrfVerifierDependencies(
  overrides: Partial<ServerAdminCsrfProofVerifierDependencies> = {}
): ServerAdminCsrfProofVerifierDependencies {
  const proof = createProof();
  const [payloadSegment, signatureSegment] = proof.split(".");

  return {
    expectedSessionBinding: "session-binding-1",
    expectedNonce: "nonce-1",
    currentTimestampMs: now,
    maxProofAgeMs: 5 * 60_000,
    verifySignature: async (input) =>
      input.payloadSegment === payloadSegment &&
      input.signatureSegment === signatureSegment,
    ...overrides
  };
}

function expectUnavailable(result: ServerAdminAuthorizationGateResult) {
  expect(result).toEqual({
    allowed: false,
    reason: "admin_authorization_gate_unavailable",
    statusCode: 503,
    requestId: "request-1"
  });
}

function expectSafeFailureShape(result: ServerAdminAuthorizationGateResult) {
  const serialized = JSON.stringify(result).toLowerCase();

  expect(result.allowed).toBe(false);
  for (const term of [
    "proof-secret",
    "valid-signature",
    "signature",
    "token",
    "cookie",
    "header",
    "env",
    "sql",
    "supabase",
    "provider",
    "stack",
    "session-binding-1",
    "nonce-1",
    "workspace-1",
    "membership-1"
  ]) {
    expect(serialized).not.toContain(term);
  }
}

describe("server admin authorization gate", () => {
  it("runs request security preflight before the authorization decision boundary", async () => {
    const calls: string[] = [];

    const result = await resolveServerAdminAuthorizationGate(safeReadInput, {
      async validatePreflight(input) {
        calls.push("preflight");
        expect(input.requestedOperation).toBe("catalogue.read");

        return {
          allowed: true,
          reason: "request_security_preflight_passed"
        };
      },
      async resolveDecision(input) {
        calls.push("decision");
        expect(input).toEqual({
          requestedOperation: "catalogue.read",
          requestId: "request-1"
        });

        return {
          allowed: true,
          reason: "allowed",
          statusCode: 200,
          workspaceId: "workspace-1"
        };
      }
    });

    expect(calls).toEqual(["preflight", "decision"]);
    expect(result).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-1",
      requestId: "request-1"
    });
  });

  it("does not run the decision boundary when preflight denies", async () => {
    const calls: string[] = [];

    const result = await resolveServerAdminAuthorizationGate(safeWriteInput, {
      async validatePreflight() {
        calls.push("preflight");

        return {
          allowed: false,
          reason: "csrf_proof_missing",
          statusCode: 403
        };
      },
      async resolveDecision() {
        calls.push("decision");
        throw new Error("decision should not run");
      }
    });

    expect(calls).toEqual(["preflight"]);
    expect(result).toEqual({
      allowed: false,
      reason: "csrf_proof_missing",
      statusCode: 403,
      requestId: "request-1"
    });
  });

  it("returns a safe allow result when preflight passes and decision allows", async () => {
    const result = await resolveServerAdminAuthorizationGate(safeReadInput, {
      async validatePreflight() {
        return {
          allowed: true,
          reason: "request_security_preflight_passed"
        };
      },
      async resolveDecision() {
        return {
          allowed: true,
          reason: "allowed",
          statusCode: 200,
          workspaceId: "workspace-1"
        };
      }
    });

    expect(result).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-1",
      requestId: "request-1"
    });
  });

  it("returns a safe deny result when preflight passes and decision denies", async () => {
    const result = await resolveServerAdminAuthorizationGate(safeReadInput, {
      async validatePreflight() {
        return {
          allowed: true,
          reason: "request_security_preflight_passed"
        };
      },
      async resolveDecision() {
        return {
          allowed: false,
          reason: "role_not_allowed",
          statusCode: 403
        };
      }
    });

    expect(result).toEqual({
      allowed: false,
      reason: "role_not_allowed",
      statusCode: 403,
      requestId: "request-1"
    });
  });

  it("returns a safe unavailable result when the decision boundary is unavailable", async () => {
    const result = await resolveServerAdminAuthorizationGate(safeReadInput, {
      async validatePreflight() {
        return {
          allowed: true,
          reason: "request_security_preflight_passed"
        };
      },
      async resolveDecision() {
        return {
          resolved: false,
          allowed: false,
          reason: "admin_authorization_unavailable",
          statusCode: 503,
          requestId: "request-1"
        };
      }
    });

    expectUnavailable(result);
  });

  it("fails state-changing operations with invalid CSRF proof before decision", async () => {
    const calls: string[] = [];
    const result = await resolveServerAdminAuthorizationGate(
      {
        ...safeWriteInput,
        csrfProof: "proof-secret.invalid"
      },
      {
        csrfVerifier: createCsrfVerifierDependencies(),
        async resolveDecision() {
          calls.push("decision");
          throw new Error("decision should not run");
        }
      }
    );

    expect(calls).toEqual([]);
    expect(result).toEqual({
      allowed: false,
      reason: "csrf_proof_invalid",
      statusCode: 403,
      requestId: "request-1"
    });
    expectSafeFailureShape(result);
  });

  it("allows state-changing operations with a valid CSRF verifier to reach decision", async () => {
    const calls: string[] = [];
    const result = await resolveServerAdminAuthorizationGate(
      {
        ...safeWriteInput,
        csrfProof: createProof()
      },
      {
        csrfVerifier: createCsrfVerifierDependencies(),
        async resolveDecision(input) {
          calls.push("decision");
          expect(input).toEqual({
            requestedOperation: "product.write",
            requestedRecordWorkspaceId: "workspace-1",
            requestedWorkspaceIdForValidationOnly: "workspace-1",
            requestId: "request-1"
          });

          return {
            allowed: true,
            reason: "allowed",
            statusCode: 200,
            workspaceId: "workspace-1"
          };
        }
      }
    );

    expect(calls).toEqual(["decision"]);
    expect(result).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-1",
      requestId: "request-1"
    });
  });

  it("lets safe catalogue reads reach decision without CSRF proof", async () => {
    const calls: string[] = [];
    const result = await resolveServerAdminAuthorizationGate(safeReadInput, {
      async resolveDecision() {
        calls.push("decision");

        return {
          allowed: false,
          reason: "unauthenticated",
          statusCode: 401
        };
      }
    });

    expect(calls).toEqual(["decision"]);
    expect(result).toEqual({
      allowed: false,
      reason: "unauthenticated",
      statusCode: 401,
      requestId: "request-1"
    });
  });

  it("returns safe unavailable shapes when dependencies throw", async () => {
    const preflightThrow = await resolveServerAdminAuthorizationGate(
      {
        ...safeWriteInput,
        csrfProof: "proof-secret.invalid"
      },
      {
        async validatePreflight() {
          throw new Error(
            "proof-secret valid-signature cookie token header env SQL Supabase provider stack session-binding-1 nonce-1 workspace-1 membership-1"
          );
        }
      }
    );
    const decisionThrow = await resolveServerAdminAuthorizationGate(
      safeReadInput,
      {
        async validatePreflight() {
          return {
            allowed: true,
            reason: "request_security_preflight_passed"
          };
        },
        async resolveDecision() {
          throw new Error(
            "proof-secret valid-signature cookie token header env SQL Supabase provider stack session-binding-1 nonce-1 workspace-1 membership-1"
          );
        }
      }
    );

    expectUnavailable(preflightThrow);
    expectUnavailable(decisionThrow);
    expectSafeFailureShape(preflightThrow);
    expectSafeFailureShape(decisionThrow);
  });

  it("keeps the gate server-only and free of runtime/provider shortcuts", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).toContain("validateServerAdminRequestSecurityPreflight");
    expect(source).toContain("createServerAdminCsrfProofVerifier");
    expect(source).toContain("resolveServerAdminAuthorizationDecision");
    expect(source).not.toContain("createServerAdminCsrfProofIssuer");
    expect(source).not.toContain("issueServerAdminCsrfProof");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("memberships");
    expect(source).not.toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).not.toContain("createServerAdminAuthorizationAdapterSet");
    expect(source).not.toContain("resolveAdminAuthorizationWithAdapters");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("N8N");
    expect(source).not.toContain("PINECONE");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain(".from(");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
    expect(source).not.toContain('"use server"');
    expect(source).not.toMatch(/from ["'][^"']*app\//m);
  });
});
