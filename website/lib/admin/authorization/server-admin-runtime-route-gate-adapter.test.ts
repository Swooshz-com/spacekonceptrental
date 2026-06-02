import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "./server-admin-runtime-route-gate-adapter";

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts"
);

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function expectUnavailable(result: ServerAdminRuntimeRouteGateAdapterResult) {
  expect(result).toEqual({
    allowed: false,
    reason: "admin_authorization_gate_unavailable",
    statusCode: 503
  });
}

function expectSafeFailureShape(result: ServerAdminRuntimeRouteGateAdapterResult) {
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

describe("server admin runtime route gate adapter", () => {
  it("calls the runtime gate invocation helper with requested operation and workspace inputs", async () => {
    const result = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "catalogue.read",
        requestedRecordWorkspaceId: "workspace-1",
        requestedWorkspaceIdForValidationOnly: "workspace-1",
        requestMethod: "GET"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test"
        },
        gate: {},
        async resolveRuntimeGateInvocation(input, dependencies) {
          expect(input).toEqual({
            requestedOperation: "catalogue.read",
            requestedRecordWorkspaceId: "workspace-1",
            requestedWorkspaceIdForValidationOnly: "workspace-1"
          });
          expect(dependencies).toEqual({
            requestMetadata: {
              expectedOrigin: "https://admin.space.test",
              expectedHost: "admin.space.test",
              requestMethod: "GET"
            },
            gate: {}
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

    expect(result).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-1"
    });
  });

  it("allows admin shell GET without Origin to reach the authorization decision when Host matches", async () => {
    let decisionReached = false;

    const result = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "admin.shell.access",
        requestMethod: "GET"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test"
        },
        async readRequestMetadata(dependencies) {
          expect(dependencies.requestMethod).toBe("GET");

          return {
            configured: true,
            metadata: {
              requestMethod: "GET",
              requestOrigin: null,
              requestHost: "admin.space.test",
              expectedOrigin: "https://admin.space.test",
              expectedHost: "admin.space.test"
            }
          };
        },
        gate: {
          async resolveDecision(input) {
            decisionReached = true;
            expect(input).toEqual({
              requestedOperation: "admin.shell.access"
            });

            return {
              allowed: true,
              reason: "allowed",
              statusCode: 200,
              workspaceId: "workspace-1"
            };
          }
        }
      }
    );

    expect(decisionReached).toBe(true);
    expect(result).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-1"
    });
  });

  it("denies admin shell GET without Origin before authorization when Host is missing or mismatched", async () => {
    for (const requestHost of [null, "evil.example"]) {
      let decisionReached = false;
      const result = await resolveServerAdminRuntimeRouteGateAdapter(
        {
          requestedOperation: "admin.shell.access",
          requestMethod: "GET"
        },
        {
          requestMetadata: {
            expectedOrigin: "https://admin.space.test",
            expectedHost: "admin.space.test"
          },
          async readRequestMetadata() {
            return {
              configured: true,
              metadata: {
                requestMethod: "GET",
                requestOrigin: null,
                requestHost,
                expectedOrigin: "https://admin.space.test",
                expectedHost: "admin.space.test"
              }
            };
          },
          gate: {
            async resolveDecision() {
              decisionReached = true;

              return {
                allowed: true,
                reason: "allowed",
                statusCode: 200,
                workspaceId: "workspace-1"
              };
            }
          }
        }
      );

      expect(decisionReached).toBe(false);
      expect(result.allowed).toBe(false);
    }
  });

  it("denies admin shell GET with a bad Origin before authorization", async () => {
    let decisionReached = false;

    const result = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "admin.shell.access",
        requestMethod: "GET"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test"
        },
        async readRequestMetadata() {
          return {
            configured: true,
            metadata: {
              requestMethod: "GET",
              requestOrigin: "https://evil.example",
              requestHost: "admin.space.test",
              expectedOrigin: "https://admin.space.test",
              expectedHost: "admin.space.test"
            }
          };
        },
        gate: {
          async resolveDecision() {
            decisionReached = true;

            return {
              allowed: true,
              reason: "allowed",
              statusCode: 200,
              workspaceId: "workspace-1"
            };
          }
        }
      }
    );

    expect(decisionReached).toBe(false);
    expect(result).toEqual({
      allowed: false,
      reason: "origin_host_mismatch",
      statusCode: 403
    });
  });

  it("denies write and CSRF issuer POST requests without Origin before authorization", async () => {
    for (const requestedOperation of ["category.write", "admin.csrf.issue"] as const) {
      let decisionReached = false;
      const result = await resolveServerAdminRuntimeRouteGateAdapter(
        {
          requestedOperation,
          requestMethod: "POST"
        },
        {
          requestMetadata: {
            expectedOrigin: "https://admin.space.test",
            expectedHost: "admin.space.test"
          },
          async readRequestMetadata() {
            return {
              configured: true,
              metadata: {
                requestMethod: "POST",
                requestOrigin: null,
                requestHost: "admin.space.test",
                expectedOrigin: "https://admin.space.test",
                expectedHost: "admin.space.test",
                ...(requestedOperation === "category.write"
                  ? { csrfProof: "proof" }
                  : {})
              }
            };
          },
          gate: {
            preflight:
              requestedOperation === "category.write"
                ? {
                    async verifyCsrfProof() {
                      return {
                        valid: true
                      };
                    }
                  }
                : undefined,
            async resolveDecision() {
              decisionReached = true;

              return {
                allowed: true,
                reason: "allowed",
                statusCode: 200,
                workspaceId: "workspace-1"
              };
            }
          }
        }
      );

      expect(decisionReached).toBe(false);
      expect(result).toEqual({
        allowed: false,
        reason: "origin_missing",
        statusCode: 400
      });
    }
  });

  it("derives only method from a minimal request-like object", async () => {
    const result = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "product.write",
        request: {
          method: "POST"
        }
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test"
        },
        async resolveRuntimeGateInvocation(_input, dependencies) {
          expect(dependencies.requestMetadata.requestMethod).toBe("POST");

          return {
            allowed: false,
            reason: "csrf_proof_missing",
            statusCode: 403
          };
        }
      }
    );

    expect(result).toEqual({
      allowed: false,
      reason: "csrf_proof_missing",
      statusCode: 403
    });
  });

  it("keeps trusted expected origin and host as explicit dependencies only", async () => {
    await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "catalogue.read",
        requestMethod: "GET",
        request: {
          method: "POST"
        }
      },
      {
        requestMetadata: {
          expectedOrigin: "https://trusted-admin.space.test",
          expectedHost: "trusted-admin.space.test"
        },
        async resolveRuntimeGateInvocation(_input, dependencies) {
          expect(dependencies.requestMetadata).toEqual({
            expectedOrigin: "https://trusted-admin.space.test",
            expectedHost: "trusted-admin.space.test",
            requestMethod: "GET"
          });

          return {
            allowed: true,
            reason: "allowed",
            statusCode: 200
          };
        }
      }
    );
  });

  it("fails closed safely when method is missing or the invocation helper throws", async () => {
    const missingMethod = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "product.write"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test"
        },
        async resolveRuntimeGateInvocation() {
          throw new Error("helper should not run without method");
        }
      }
    );
    const helperThrow = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "product.write",
        requestMethod: "POST"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test"
        },
        async resolveRuntimeGateInvocation() {
          throw new Error(
            "csrf-proof-secret signature token cookie header-map env SQL Supabase provider stack session-1 nonce-1 workspace-1 membership-1"
          );
        }
      }
    );

    expectUnavailable(missingMethod);
    expectUnavailable(helperThrow);
    expectSafeFailureShape(missingMethod);
    expectSafeFailureShape(helperThrow);
  });

  it("keeps the route gate adapter server-only and free of lower-level shortcuts", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).toContain("resolveServerAdminRuntimeGateInvocation");
    expect(source).not.toContain("readServerAdminRequestMetadata");
    expect(source).not.toContain("resolveServerAdminAuthorizationGate");
    expect(source).not.toContain("validateServerAdminRequestSecurityPreflight");
    expect(source).not.toContain("resolveServerAdminAuthorizationDecision");
    expect(source).not.toContain("verifyServerAdminCsrfProof");
    expect(source).not.toContain("issueServerAdminCsrfProof");
    expect(source).not.toContain("createServerAdminAuthorizationAdapterSet");
    expect(source).not.toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).not.toContain("resolveServerAdminWorkspaceForRequest");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("memberships");
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
