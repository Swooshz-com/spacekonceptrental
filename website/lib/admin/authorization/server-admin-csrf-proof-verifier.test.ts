import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { validateServerAdminRequestSecurityPreflight } from "./server-admin-request-security-preflight";
import {
  createServerAdminCsrfProofVerifier,
  verifyServerAdminCsrfProof,
  type ServerAdminCsrfProofVerifierDependencies,
  type ServerAdminCsrfProofVerifierResult
} from "./server-admin-csrf-proof-verifier";

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-csrf-proof-verifier.ts"
);
const now = 1_700_000_000_000;

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

function createInput(csrfProof = createProof()) {
  return {
    requestedOperation: "product.write" as const,
    requestMethod: "POST" as const,
    requestOrigin: "https://admin.space.test",
    requestHost: "admin.space.test",
    csrfProof
  };
}

function createDependencies(
  overrides: Partial<ServerAdminCsrfProofVerifierDependencies> = {}
): ServerAdminCsrfProofVerifierDependencies {
  return {
    expectedSessionBinding: "session-binding-1",
    expectedNonce: "nonce-1",
    currentTimestampMs: now,
    maxProofAgeMs: 5 * 60_000,
    verifySignature: async ({ payloadSegment, signatureSegment }) =>
      payloadSegment === createProof().split(".")[0] &&
      signatureSegment === createProof().split(".")[1],
    ...overrides
  };
}

function expectRejected(
  result: ServerAdminCsrfProofVerifierResult,
  reason: Exclude<ServerAdminCsrfProofVerifierResult, { valid: true }>["reason"]
) {
  expect(result).toEqual({
    valid: false,
    reason
  });
}

function expectSafeShape(result: ServerAdminCsrfProofVerifierResult) {
  const serialized = JSON.stringify(result).toLowerCase();

  for (const term of [
    "valid-signature",
    "session-binding-1",
    "nonce-1",
    "cookie",
    "token",
    "header",
    "env",
    "sql",
    "supabase",
    "provider",
    "stack",
    "workspace-1",
    "membership-1"
  ]) {
    expect(serialized).not.toContain(term);
  }
}

describe("server admin CSRF proof verifier", () => {
  it("returns valid for a structured proof with matching payload, session binding, nonce, timestamps, and signature", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(),
      createDependencies()
    );

    expect(result).toEqual({
      valid: true
    });
  });

  it("returns invalid when proof is missing", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(" "),
      createDependencies()
    );

    expectRejected(result, "csrf_proof_invalid");
    expectSafeShape(result);
  });

  it("returns invalid when proof is malformed", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput("not-a-structured-proof"),
      createDependencies()
    );

    expectRejected(result, "csrf_proof_invalid");
    expectSafeShape(result);
  });

  it("returns mismatched when the operation does not match", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(
        createProof({
          ...validPayload,
          operation: "membership.manage"
        })
      ),
      createDependencies()
    );

    expectRejected(result, "csrf_proof_mismatched");
  });

  it("returns mismatched when the session binding does not match", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(
        createProof({
          ...validPayload,
          sessionBinding: "other-session-binding"
        })
      ),
      createDependencies()
    );

    expectRejected(result, "csrf_proof_mismatched");
    expectSafeShape(result);
  });

  it("returns invalid when nonce is missing", async () => {
    const { nonce: _nonce, ...payloadWithoutNonce } = validPayload;
    const result = await verifyServerAdminCsrfProof(
      createInput(createProof(payloadWithoutNonce)),
      createDependencies()
    );

    expectRejected(result, "csrf_proof_invalid");
  });

  it("returns invalid when timestamp fields are invalid", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(
        createProof({
          ...validPayload,
          issuedAt: "not-a-timestamp"
        })
      ),
      createDependencies()
    );

    expectRejected(result, "csrf_proof_invalid");
  });

  it("returns stale when the proof is older than the injected max age", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(
        createProof({
          ...validPayload,
          issuedAt: now - 10 * 60_000
        })
      ),
      createDependencies()
    );

    expectRejected(result, "csrf_proof_stale");
  });

  it("returns stale when the proof is expired", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(
        createProof({
          ...validPayload,
          expiresAt: now - 1
        })
      ),
      createDependencies()
    );

    expectRejected(result, "csrf_proof_stale");
  });

  it("returns replayed when the injected replay checker reports replay", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(),
      createDependencies({
        checkReplay: async ({ nonce, sessionBinding }) => {
          expect(nonce).toBe("nonce-1");
          expect(sessionBinding).toBe("session-binding-1");

          return {
            replayed: true
          };
        }
      })
    );

    expectRejected(result, "csrf_proof_replayed");
  });

  it("returns invalid when the signature verifier rejects the proof", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(createProof(validPayload, "bad-signature")),
      createDependencies()
    );

    expectRejected(result, "csrf_proof_invalid");
    expectSafeShape(result);
  });

  it("returns invalid when the signature verifier dependency is missing", async () => {
    const result = await verifyServerAdminCsrfProof(createInput(), {
      expectedSessionBinding: "session-binding-1",
      expectedNonce: "nonce-1",
      currentTimestampMs: now,
      maxProofAgeMs: 5 * 60_000
    });

    expectRejected(result, "csrf_proof_invalid");
  });

  it("returns invalid when the signature verifier throws", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(),
      createDependencies({
        verifySignature() {
          throw new Error(
            "valid-signature cookie token header env SQL Supabase provider stack session-binding-1 nonce-1 workspace-1 membership-1"
          );
        }
      })
    );

    expectRejected(result, "csrf_proof_invalid");
    expectSafeShape(result);
  });

  it("returns replayed when the replay checker throws", async () => {
    const result = await verifyServerAdminCsrfProof(
      createInput(),
      createDependencies({
        checkReplay() {
          throw new Error(
            "cookie token header env SQL Supabase provider stack session-binding-1 nonce-1 workspace-1 membership-1"
          );
        }
      })
    );

    expectRejected(result, "csrf_proof_replayed");
    expectSafeShape(result);
  });

  it("can be injected into the Phase 2B-Q request security preflight validator", async () => {
    const result = await validateServerAdminRequestSecurityPreflight(
      {
        requestedOperation: "product.write",
        requestMethod: "POST",
        requestOrigin: "https://admin.space.test",
        requestHost: "admin.space.test",
        expectedOrigin: "https://admin.space.test",
        expectedHost: "admin.space.test",
        csrfProof: createProof()
      },
      {
        verifyCsrfProof: createServerAdminCsrfProofVerifier(
          createDependencies()
        )
      }
    );

    expect(result).toEqual({
      allowed: true,
      reason: "request_security_preflight_passed"
    });
  });

  it("keeps the CSRF verifier server-only and free of runtime/provider shortcuts", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createServerAdminCsrfProofVerifier");
    expect(source).toContain("verifyServerAdminCsrfProof");
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
    expect(source).not.toContain("resolveServerAdminAuthorizationDecision");
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
