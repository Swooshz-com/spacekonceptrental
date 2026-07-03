import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { verifyServerAdminCsrfProof } from "./server-admin-csrf-proof-verifier";
import {
  issueServerAdminCsrfProof,
  type ServerAdminCsrfProofIssuerDependencies,
  type ServerAdminCsrfProofIssuerInput,
  type ServerAdminCsrfProofIssuerResult
} from "./server-admin-csrf-proof-issuer";

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-csrf-proof-issuer.ts"
);
const now = 1_700_000_000_000;

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodePayloadSegment(segment: string) {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

function createInput(overrides: Partial<ServerAdminCsrfProofIssuerInput> = {}) {
  return {
    operation: "product.write",
    sessionBinding: "session-binding-1",
    nonce: "nonce-1",
    issuedAt: now,
    expiresAt: now + 60_000,
    ...overrides
  };
}

function createDependencies(
  overrides: Partial<ServerAdminCsrfProofIssuerDependencies> = {}
): ServerAdminCsrfProofIssuerDependencies {
  return {
    signCsrfProof: async ({ payloadSegment }) => `signed:${payloadSegment}`,
    ...overrides
  };
}

function expectNotIssued(
  result: ServerAdminCsrfProofIssuerResult,
  reason: Exclude<ServerAdminCsrfProofIssuerResult, { issued: true }>["reason"]
) {
  expect(result).toEqual({
    issued: false,
    reason
  });
}

function expectFailureSafeShape(result: ServerAdminCsrfProofIssuerResult) {
  expect(result.issued).toBe(false);

  const serialized = JSON.stringify(result).toLowerCase();

  for (const term of [
    "csrfproof",
    "valid-signature",
    "signed:",
    "cookie",
    "token",
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

describe("server admin CSRF proof issuer", () => {
  it("returns a structured verifier-compatible proof for valid issue input", async () => {
    const result = await issueServerAdminCsrfProof(
      createInput(),
      createDependencies()
    );

    expect(result.issued).toBe(true);

    if (!result.issued) {
      throw new Error("expected proof issuance to succeed");
    }

    expect(result.expiresAt).toBe(now + 60_000);

    const segments = result.csrfProof.split(".");

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(segments[1]).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodePayloadSegment(segments[0])).toEqual({
      operation: "product.write",
      sessionBinding: "session-binding-1",
      nonce: "nonce-1",
      issuedAt: now,
      expiresAt: now + 60_000
    });
    expect(segments[1]).toBe(encodeBase64Url(`signed:${segments[0]}`));
  });

  it("can issue a proof for the protected hero write operation", async () => {
    const result = await issueServerAdminCsrfProof(
      createInput({ operation: "hero.write" }),
      createDependencies()
    );

    expect(result.issued).toBe(true);

    if (!result.issued) {
      throw new Error("expected proof issuance to succeed");
    }

    expect(decodePayloadSegment(result.csrfProof.split(".")[0])).toMatchObject({
      operation: "hero.write",
      sessionBinding: "session-binding-1"
    });
  });

  it("issues a proof that the Phase 2B-R verifier can validate in an isolated unit test", async () => {
    const issued = await issueServerAdminCsrfProof(createInput(), {
      signCsrfProof: async ({ payloadSegment }) => `signed:${payloadSegment}`
    });

    if (!issued.issued) {
      throw new Error("expected proof issuance to succeed");
    }

    const verified = await verifyServerAdminCsrfProof(
      {
        requestedOperation: "product.write",
        requestMethod: "POST",
        requestOrigin: "https://admin.space.test",
        requestHost: "admin.space.test",
        csrfProof: issued.csrfProof
      },
      {
        expectedSessionBinding: "session-binding-1",
        expectedNonce: "nonce-1",
        currentTimestampMs: now + 1_000,
        maxProofAgeMs: 5 * 60_000,
        verifySignature: async ({ payloadSegment, signatureSegment }) =>
          signatureSegment === encodeBase64Url(`signed:${payloadSegment}`)
      }
    );

    expect(verified).toEqual({
      valid: true
    });
  });

  it("fails closed when the operation is missing or unsupported", async () => {
    for (const operation of [undefined, "conversation.write"]) {
      const result = await issueServerAdminCsrfProof(
        createInput({ operation }),
        createDependencies()
      );

      expectNotIssued(result, "operation_not_supported");
      expectFailureSafeShape(result);
    }
  });

  it("fails closed when the operation is read-only", async () => {
    const result = await issueServerAdminCsrfProof(
      createInput({ operation: "catalogue.read" }),
      createDependencies()
    );

    expectNotIssued(result, "operation_not_state_changing");
  });

  it("fails closed when the session binding is missing", async () => {
    const result = await issueServerAdminCsrfProof(
      createInput({ sessionBinding: " " }),
      createDependencies()
    );

    expectNotIssued(result, "session_binding_missing");
    expectFailureSafeShape(result);
  });

  it("fails closed when no nonce or nonce generator is supplied", async () => {
    const result = await issueServerAdminCsrfProof(
      createInput({ nonce: null }),
      createDependencies()
    );

    expectNotIssued(result, "nonce_missing");
    expectFailureSafeShape(result);
  });

  it("uses an injected nonce generator when no nonce is supplied", async () => {
    const result = await issueServerAdminCsrfProof(
      createInput({ nonce: null }),
      createDependencies({
        generateNonce: async () => "generated-nonce"
      })
    );

    expect(result.issued).toBe(true);

    if (!result.issued) {
      throw new Error("expected proof issuance to succeed");
    }

    const payload = decodePayloadSegment(result.csrfProof.split(".")[0]);

    expect(payload.nonce).toBe("generated-nonce");
  });

  it("fails closed when the nonce generator returns an empty or invalid value", async () => {
    for (const generateNonce of [async () => " ", async () => null]) {
      const result = await issueServerAdminCsrfProof(
        createInput({ nonce: null }),
        createDependencies({ generateNonce })
      );

      expectNotIssued(result, "nonce_missing");
      expectFailureSafeShape(result);
    }
  });

  it("fails closed when timestamps are invalid", async () => {
    for (const overrides of [
      { issuedAt: Number.NaN },
      { issuedAt: -1 },
      { expiresAt: Number.POSITIVE_INFINITY },
      { expiresAt: null }
    ]) {
      const result = await issueServerAdminCsrfProof(
        createInput(overrides),
        createDependencies()
      );

      expectNotIssued(result, "timestamp_invalid");
      expectFailureSafeShape(result);
    }
  });

  it("fails closed when expiry is before or equal to issued-at", async () => {
    for (const expiresAt of [now, now - 1]) {
      const result = await issueServerAdminCsrfProof(
        createInput({ expiresAt }),
        createDependencies()
      );

      expectNotIssued(result, "timestamp_invalid");
      expectFailureSafeShape(result);
    }
  });

  it("fails closed when the signer dependency is missing", async () => {
    const result = await issueServerAdminCsrfProof(createInput(), {});

    expectNotIssued(result, "signature_signer_unavailable");
    expectFailureSafeShape(result);
  });

  it("fails closed when the signer returns an empty or invalid result", async () => {
    for (const signCsrfProof of [async () => " ", async () => null]) {
      const result = await issueServerAdminCsrfProof(
        createInput(),
        createDependencies({ signCsrfProof })
      );

      expectNotIssued(result, "csrf_proof_issue_failed");
      expectFailureSafeShape(result);
    }
  });

  it("returns only a safe failure shape when the signer throws", async () => {
    const result = await issueServerAdminCsrfProof(
      createInput(),
      createDependencies({
        signCsrfProof() {
          throw new Error(
            "valid-signature cookie token header env SQL Supabase provider stack session-binding-1 nonce-1 workspace-1 membership-1"
          );
        }
      })
    );

    expectNotIssued(result, "csrf_proof_issue_failed");
    expectFailureSafeShape(result);
  });

  it("keeps the CSRF issuer server-only and free of runtime/provider shortcuts", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).toContain("issueServerAdminCsrfProof");
    expect(source).toContain("createServerAdminCsrfProofIssuer");
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
    expect(source).not.toContain("validateServerAdminRequestSecurityPreflight");
    expect(source).not.toContain("verifyServerAdminCsrfProof");
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
