import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  validateServerAdminRequestSecurityPreflight,
  type ServerAdminRequestSecurityPreflightResult
} from "./server-admin-request-security-preflight";

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-request-security-preflight.ts"
);

const safeReadInput = {
  requestedOperation: "catalogue.read",
  requestMethod: "GET",
  requestOrigin: "https://admin.space.test",
  requestHost: "admin.space.test",
  expectedOrigin: "https://admin.space.test",
  expectedHost: "admin.space.test"
};

const safeWriteInput = {
  requestedOperation: "product.write",
  requestMethod: "POST",
  requestOrigin: "https://admin.space.test",
  requestHost: "admin.space.test",
  expectedOrigin: "https://admin.space.test",
  expectedHost: "admin.space.test",
  csrfProof: "csrf-proof-token"
};

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function expectDenied(
  result: ServerAdminRequestSecurityPreflightResult,
  reason: ServerAdminRequestSecurityPreflightResult["reason"],
  statusCode: 400 | 403
) {
  expect(result).toEqual({
    allowed: false,
    reason,
    statusCode
  });
}

function expectSafeShape(result: ServerAdminRequestSecurityPreflightResult) {
  const serialized = JSON.stringify(result).toLowerCase();

  expect(result).not.toHaveProperty("requestOrigin");
  expect(result).not.toHaveProperty("requestHost");
  expect(result).not.toHaveProperty("expectedOrigin");
  expect(result).not.toHaveProperty("expectedHost");
  expect(result).not.toHaveProperty("csrfProof");

  for (const term of [
    "cookie",
    "token",
    "header",
    "https://admin.space.test",
    "admin.space.test",
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

describe("server admin request security preflight", () => {
  it("allows read-only catalogue reads with a safe method and same-origin metadata without CSRF proof", async () => {
    await expect(
      validateServerAdminRequestSecurityPreflight(safeReadInput)
    ).resolves.toEqual({
      allowed: true,
      reason: "request_security_preflight_passed"
    });
  });

  it("requires POST for state-changing admin operations", async () => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeWriteInput,
      requestMethod: "GET"
    });

    expectDenied(result, "request_method_not_allowed", 403);
  });

  it("fails closed when request method is missing", async () => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeWriteInput,
      requestMethod: ""
    });

    expectDenied(result, "request_method_missing", 400);
  });

  it("fails closed without CSRF proof for state-changing operations", async () => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeWriteInput,
      csrfProof: "   "
    });

    expectDenied(result, "csrf_proof_missing", 403);
  });

  it.each([
    ["invalid", "csrf_proof_invalid"],
    ["stale", "csrf_proof_stale"],
    ["replayed", "csrf_proof_replayed"],
    ["mismatched", "csrf_proof_mismatched"]
  ] as const)(
    "fails closed when CSRF verifier returns %s",
    async (_label, reason) => {
      const result = await validateServerAdminRequestSecurityPreflight(
        safeWriteInput,
        {
          verifyCsrfProof: async (input) => {
            expect(input.csrfProof).toBe("csrf-proof-token");
            expect(input.requestedOperation).toBe("product.write");

            return {
              valid: false,
              reason
            };
          }
        }
      );

      expectDenied(result, reason, 403);
      expectSafeShape(result);
    }
  );

  it("passes state-changing operations when CSRF verifier returns valid and Origin/Host match", async () => {
    const result = await validateServerAdminRequestSecurityPreflight(
      safeWriteInput,
      {
        verifyCsrfProof: async (input) => {
          expect(input).toEqual({
            requestedOperation: "product.write",
            requestMethod: "POST",
            requestOrigin: "https://admin.space.test",
            requestHost: "admin.space.test",
            csrfProof: "csrf-proof-token"
          });

          return {
            valid: true
          };
        }
      }
    );

    expect(result).toEqual({
      allowed: true,
      reason: "request_security_preflight_passed"
    });
  });

  it("fails closed when Origin is missing", async () => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeReadInput,
      requestOrigin: ""
    });

    expectDenied(result, "origin_missing", 400);
  });

  it("fails closed when Host is missing", async () => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeReadInput,
      requestHost: " "
    });

    expectDenied(result, "host_missing", 400);
  });

  it("fails closed when Origin and Host do not match the expected same-origin metadata", async () => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeReadInput,
      requestOrigin: "https://evil.example",
      requestHost: "evil.example"
    });

    expectDenied(result, "origin_host_mismatch", 403);
  });

  it("fails closed for unsupported operations", async () => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeReadInput,
      requestedOperation: "billing.write"
    });

    expectDenied(result, "operation_not_supported", 400);
  });

  it("fails closed when a state-changing operation has no CSRF verifier", async () => {
    const result = await validateServerAdminRequestSecurityPreflight(
      safeWriteInput
    );

    expectDenied(result, "csrf_verifier_unavailable", 403);
  });

  it("returns only safe shapes when the verifier throws", async () => {
    const result = await validateServerAdminRequestSecurityPreflight(
      safeWriteInput,
      {
        verifyCsrfProof() {
          throw new Error(
            "cookie token header env SQL Supabase provider stack workspace-1 membership-1"
          );
        }
      }
    );

    expectDenied(result, "csrf_verification_failed", 403);
    expectSafeShape(result);
  });

  it("allows admin.csrf.issue with POST and same-origin metadata without requiring CSRF proof", async () => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeReadInput,
      requestedOperation: "admin.csrf.issue",
      requestMethod: "POST"
    });

    expect(result).toEqual({
      allowed: true,
      reason: "request_security_preflight_passed"
    });
  });

  it.each(["GET", "PUT", "DELETE", "PATCH"])("denies unsafe method %s for admin.csrf.issue", async (method) => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeReadInput,
      requestedOperation: "admin.csrf.issue",
      requestMethod: method
    });

    expectDenied(result, "request_method_not_allowed", 403);
    expectSafeShape(result);
  });

  it("allows admin.auth.check for safe read methods without requiring CSRF proof", async () => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeReadInput,
      requestedOperation: "admin.auth.check",
      requestMethod: "GET"
    });

    expect(result).toEqual({
      allowed: true,
      reason: "request_security_preflight_passed"
    });
  });

  it.each(["POST", "PUT", "DELETE", "PATCH"])("denies unsafe method %s for admin.auth.check", async (method) => {
    const result = await validateServerAdminRequestSecurityPreflight({
      ...safeReadInput,
      requestedOperation: "admin.auth.check",
      requestMethod: method
    });

    expectDenied(result, "request_method_not_allowed", 403);
    expectSafeShape(result);
  });

  it("keeps the request security preflight server-only and free of runtime/provider shortcuts", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
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
