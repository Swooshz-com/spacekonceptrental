import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveServerAdminRuntimeGateInvocation,
  type ServerAdminRuntimeGateInvocationResult
} from "./server-admin-runtime-gate-invocation";

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-runtime-gate-invocation.ts"
);

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function expectUnavailable(result: ServerAdminRuntimeGateInvocationResult) {
  expect(result).toEqual({
    allowed: false,
    reason: "admin_authorization_gate_unavailable",
    statusCode: 503
  });
}

function expectSafeFailureShape(result: ServerAdminRuntimeGateInvocationResult) {
  const serialized = JSON.stringify(result).toLowerCase();

  expect(result.allowed).toBe(false);
  for (const term of [
    "csrf-proof-secret",
    "signature",
    "token",
    "cookie",
    "header-map",
    "env",
    "sql",
    "supabase",
    "provider",
    "stack",
    "session-1",
    "nonce-1",
    "workspace-1",
    "membership-1"
  ]) {
    expect(serialized).not.toContain(term);
  }
}

describe("server admin runtime gate invocation", () => {
  it("uses request metadata adapter output to invoke the admin authorization gate", async () => {
    const calls: string[] = [];

    const result = await resolveServerAdminRuntimeGateInvocation(
      {
        requestedOperation: "catalogue.read",
        requestedRecordWorkspaceId: "workspace-1",
        requestedWorkspaceIdForValidationOnly: "workspace-1"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test",
          requestMethod: "GET"
        },
        async readRequestMetadata(dependencies) {
          calls.push("metadata");
          expect(dependencies).toEqual({
            expectedOrigin: "https://admin.space.test",
            expectedHost: "admin.space.test",
            requestMethod: "GET"
          });

          return {
            configured: true,
            metadata: {
              requestMethod: "GET",
              requestOrigin: "https://admin.space.test",
              requestHost: "admin.space.test",
              expectedOrigin: "https://admin.space.test",
              expectedHost: "admin.space.test",
              requestId: "request-1"
            }
          };
        },
        async resolveGate(input, dependencies) {
          calls.push("gate");
          expect(dependencies).toEqual({});
          expect(input).toEqual({
            requestedOperation: "catalogue.read",
            requestedRecordWorkspaceId: "workspace-1",
            requestedWorkspaceIdForValidationOnly: "workspace-1",
            requestMethod: "GET",
            requestOrigin: "https://admin.space.test",
            requestHost: "admin.space.test",
            expectedOrigin: "https://admin.space.test",
            expectedHost: "admin.space.test",
            requestId: "request-1"
          });

          return {
            allowed: true,
            reason: "allowed",
            statusCode: 200,
            workspaceId: "workspace-1",
            requestId: "request-1"
          };
        }
      }
    );

    expect(calls).toEqual(["metadata", "gate"]);
    expect(result).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-1",
      requestId: "request-1"
    });
  });

  it("passes trusted expected origin and host only through metadata adapter dependencies", async () => {
    const result = await resolveServerAdminRuntimeGateInvocation(
      {
        requestedOperation: "product.write"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test",
          requestMethod: "POST"
        },
        async readRequestMetadata(dependencies) {
          expect(dependencies.expectedOrigin).toBe("https://admin.space.test");
          expect(dependencies.expectedHost).toBe("admin.space.test");

          return {
            configured: false,
            metadata: null,
            reason: "request_headers_unavailable"
          };
        },
        async resolveGate() {
          throw new Error("gate should not run");
        }
      }
    );

    expectUnavailable(result);
  });

  it("does not invoke the gate when request metadata is unavailable", async () => {
    const calls: string[] = [];
    const result = await resolveServerAdminRuntimeGateInvocation(
      {
        requestedOperation: "product.write"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test",
          requestMethod: "POST"
        },
        async readRequestMetadata() {
          calls.push("metadata");

          return {
            configured: false,
            metadata: null,
            reason: "expected_origin_missing"
          };
        },
        async resolveGate() {
          calls.push("gate");
          throw new Error("gate should not run");
        }
      }
    );

    expect(calls).toEqual(["metadata"]);
    expectUnavailable(result);
  });

  it("returns a safe unavailable result when dependencies throw", async () => {
    const metadataThrow = await resolveServerAdminRuntimeGateInvocation(
      {
        requestedOperation: "product.write"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test",
          requestMethod: "POST"
        },
        async readRequestMetadata() {
          throw new Error(
            "csrf-proof-secret signature token cookie header-map env SQL Supabase provider stack session-1 nonce-1 workspace-1 membership-1"
          );
        }
      }
    );
    const gateThrow = await resolveServerAdminRuntimeGateInvocation(
      {
        requestedOperation: "product.write"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test",
          requestMethod: "POST"
        },
        async readRequestMetadata() {
          return {
            configured: true,
            metadata: {
              requestMethod: "POST",
              requestOrigin: "https://admin.space.test",
              requestHost: "admin.space.test",
              expectedOrigin: "https://admin.space.test",
              expectedHost: "admin.space.test",
              requestId: "request-1",
              csrfProof: "csrf-proof-secret"
            }
          };
        },
        async resolveGate() {
          throw new Error(
            "csrf-proof-secret signature token cookie header-map env SQL Supabase provider stack session-1 nonce-1 workspace-1 membership-1"
          );
        }
      }
    );

    expectUnavailable(metadataThrow);
    expect(gateThrow).toEqual({
      allowed: false,
      reason: "admin_authorization_gate_unavailable",
      statusCode: 503,
      requestId: "request-1"
    });
    expectSafeFailureShape(metadataThrow);
    expectSafeFailureShape(gateThrow);
  });

  it("keeps the invocation helper server-only and free of direct runtime/provider shortcuts", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).toContain("readServerAdminRequestMetadata");
    expect(source).toContain("resolveServerAdminAuthorizationGate");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("memberships");
    expect(source).not.toContain("createServerAdminAuthorizationAdapterSet");
    expect(source).not.toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).not.toContain("validateServerAdminRequestSecurityPreflight");
    expect(source).not.toContain("resolveServerAdminAuthorizationDecision");
    expect(source).not.toContain("issueServerAdminCsrfProof");
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
