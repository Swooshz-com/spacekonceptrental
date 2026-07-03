import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminAuthorizationAdapterSet } from "../../../../lib/admin/authorization/admin-authorization-resolver";
import type { AdminRole } from "../../../../lib/admin/authorization/admin-authorization-policy";
import {
  createServerAdminCsrfProofRuntimeDependencies,
  deriveServerAdminCsrfProofSessionWorkspaceBinding
} from "../../../../lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies";
import { verifyServerAdminCsrfProof } from "../../../../lib/admin/authorization/server-admin-csrf-proof-verifier";
import { issueAdminCsrfProofRoute, POST } from "./route";

type BindingScenario = {
  authenticated?: boolean;
  authUserId?: string | null;
  adminUser?: {
    id: string;
    status: "active" | "inactive";
  } | null;
  workspaceId?: string | null;
  membership?: {
    adminUserId: string;
    workspaceId: string;
    status: "active" | "inactive";
    role: AdminRole;
  } | null;
};

const now = 1_700_000_000_000;
const trustedWorkspaceId = "99999999-9999-4999-8999-999999999999";
const routeEnv = {
  ADMIN_EXPECTED_ORIGIN: "https://admin.space.test",
  ADMIN_EXPECTED_HOST: "admin.space.test",
  ADMIN_TRUSTED_WORKSPACE_ID: trustedWorkspaceId
};
const routeSourcePath = resolve(process.cwd(), "app/api/admin/csrf-proof/route.ts");

function createRequest(body?: unknown, init?: RequestInit) {
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  };

  if (body !== undefined) {
    requestInit.body =
      typeof body === "string" ? body : JSON.stringify(body);
  }

  return new Request(
    "https://admin.space.test/api/admin/csrf-proof",
    requestInit
  ) as NextRequest;
}

function readRouteSource() {
  return readFileSync(routeSourcePath, "utf8");
}

function createAdapterSet({
  authenticated = true,
  authUserId = "auth-user-1",
  adminUser = {
    id: "admin-user-1",
    status: "active" as const
  },
  workspaceId = trustedWorkspaceId,
  membership = {
    adminUserId: "admin-user-1",
    workspaceId: trustedWorkspaceId,
    status: "active" as const,
    role: "admin" as const
  }
}: BindingScenario = {}): AdminAuthorizationAdapterSet {
  return {
    auth: {
      resolveIdentity: vi.fn(async () => ({
        authenticated,
        ...(authUserId ? { authUserId } : {})
      }))
    },
    profile: {
      resolveAdminProfile: vi.fn(async () => adminUser)
    },
    workspace: {
      resolveWorkspaceForRequest: vi.fn(async () => ({
        serverResolvedWorkspaceId: workspaceId
      }))
    },
    membership: {
      resolveMembership: vi.fn(async () => membership)
    }
  };
}

function createConfiguredAdapters(scenario: BindingScenario = {}) {
  return vi.fn(async () => ({
    configured: true as const,
    adapters: createAdapterSet(scenario)
  }));
}

function createAllowedGate() {
  return vi.fn(async () => ({
    allowed: true as const,
    reason: "allowed" as const,
    statusCode: 200 as const,
    requestId: "request-1",
    workspaceId: "workspace-secret",
    providerUser: {
      id: "provider-user-secret"
    }
  }));
}

function createRouteDependencies(scenario: BindingScenario = {}) {
  return {
    env: routeEnv,
    now: () => now,
    resolveRouteGate: createAllowedGate(),
    bindingDependencies: {
      createAdapterSet: createConfiguredAdapters(scenario)
    }
  };
}

async function readJsonResponse(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

async function expectSafeError(
  response: Response,
  status: number,
  error: string
) {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");

  const json = await readJsonResponse(response);

  expect(json).toStrictEqual({
    ok: false,
    error
  });

  return json;
}

describe("POST /api/admin/csrf-proof", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ADMIN_CSRF_PROOF_SECRET = "route-csrf-secret";
    vi.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("exports only a POST handler for the issuer route", () => {
    const source = readRouteSource();

    expect(source).toContain("export async function POST");
    expect(source).not.toContain("export async function GET");
    expect(source).not.toContain("export async function PUT");
    expect(source).not.toContain("export async function PATCH");
    expect(source).not.toContain("export async function DELETE");
  });

  it.each([
    [createRequest(undefined), 400, "request_body_missing"],
    [createRequest(undefined, { headers: { "Content-Type": "text/plain" } }), 415, "request_content_type_invalid"],
    [createRequest(undefined, { headers: { "Content-Type": "text/plain+json" } }), 415, "request_content_type_invalid"],
    [createRequest(undefined, { headers: {} }), 415, "request_content_type_invalid"],
    [createRequest("a".repeat(33 * 1024), { headers: { "Content-Type": "application/json", "Content-Length": String(33 * 1024) } }), 413, "request_body_too_large"],
    [
      (function() {
        const req = new Request("https://admin.space.test/api/admin/csrf-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode("a".repeat(33 * 1024)));
              controller.close();
            }
          }),
          // @ts-ignore
          duplex: "half"
        });
        req.headers.delete("Content-Length");
        return req as unknown as NextRequest;
      })(),
      413,
      "request_body_too_large"
    ],
    [createRequest("{", { headers: { "Content-Type": "application/json" } }), 400, "request_body_malformed"],
    [createRequest([], { headers: { "Content-Type": "application/json" } }), 400, "request_body_malformed"],
    [createRequest({}), 400, "requested_operation_missing"],
    [createRequest({ requestedOperation: "conversation.write" }), 400, "operation_not_supported"],
    [createRequest({ requestedOperation: "catalogue.read" }), 400, "operation_not_state_changing"],
    [createRequest({ requestedOperation: "admin.auth.check" }), 400, "operation_not_state_changing"],
    [createRequest({ requestedOperation: "admin.csrf.issue" }), 400, "operation_not_state_changing"],
    [
      createRequest({
        requestedOperation: "product.write",
        requestedWorkspaceIdForValidationOnly: 123
      }),
      400,
      "requested_workspace_invalid"
    ],
    [
      createRequest(undefined, { method: "GET" }),
      405,
      "request_method_not_allowed"
    ]
  ])("rejects invalid proof issue requests with safe JSON", async (
    request,
    status,
    error
  ) => {
    const dependencies = createRouteDependencies();
    const response = await issueAdminCsrfProofRoute(request, dependencies);

    await expectSafeError(response, status, error);
    expect(dependencies.resolveRouteGate).not.toHaveBeenCalled();
  });

  it("route-gates the issuer lane as admin.csrf.issue without requiring an existing proof", async () => {
    const dependencies = createRouteDependencies();
    const response = await issueAdminCsrfProofRoute(
      createRequest({
        requestedOperation: "product.write",
        requestedWorkspaceIdForValidationOnly: trustedWorkspaceId
      }),
      dependencies
    );

    expect(response.status).toBe(200);
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      {
        requestedOperation: "admin.csrf.issue",
        requestedWorkspaceIdForValidationOnly: trustedWorkspaceId,
        requestMethod: "POST",
        request: expect.any(Request)
      },
      {
        requestMetadata: {
          expectedOrigin: routeEnv.ADMIN_EXPECTED_ORIGIN,
          expectedHost: routeEnv.ADMIN_EXPECTED_HOST
        },
        gate: {
          decision: {
            workspace: {
              trustedServerWorkspaceId: trustedWorkspaceId
            }
          }
        }
      }
    );
  });

  it.each([
    "application/json",
    "application/json; charset=utf-8",
    "application/vnd.api+json",
    "application/vnd.api+json; charset=utf-8"
  ])("accepts valid JSON content type: %s", async (contentType) => {
    const dependencies = createRouteDependencies();
    const response = await issueAdminCsrfProofRoute(
      createRequest({
        requestedOperation: "product.write",
        requestedWorkspaceIdForValidationOnly: trustedWorkspaceId
      }, {
        headers: { "Content-Type": contentType }
      }),
      dependencies
    );

    expect(response.status).toBe(200);
    expect(dependencies.resolveRouteGate).toHaveBeenCalled();
  });

  it.each([
    ["product.write", "owner"],
    ["product.write", "admin"],
    ["category.write", "owner"],
    ["category.write", "admin"],
    ["productImage.write", "owner"],
    ["productImage.write", "admin"],
    ["hero.write", "owner"],
    ["hero.write", "admin"],
    ["quote.write", "owner"],
    ["quote.write", "admin"],
    ["membership.manage", "owner"]
  ] as const)(
    "issues a verifier-compatible proof for %s as %s",
    async (requestedOperation, role) => {
      const response = await issueAdminCsrfProofRoute(
        createRequest({ requestedOperation }),
        createRouteDependencies({
          membership: {
            adminUserId: "admin-user-1",
            workspaceId: trustedWorkspaceId,
            status: "active",
            role
          }
        })
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");

      const json = await readJsonResponse(response);

      expect(json.ok).toBe(true);
      expect(typeof json.csrfProof).toBe("string");
      expect(json.expiresAt).toBe(now + 5 * 60_000);

      const expectedSessionBinding =
        deriveServerAdminCsrfProofSessionWorkspaceBinding({
          requestedOperation,
          authUserId: "auth-user-1",
          adminUserId: "admin-user-1",
          workspaceId: trustedWorkspaceId,
          membershipRole: role
        });

      const verified = await verifyServerAdminCsrfProof(
        {
          requestedOperation,
          requestMethod: "POST",
          requestOrigin: routeEnv.ADMIN_EXPECTED_ORIGIN,
          requestHost: routeEnv.ADMIN_EXPECTED_HOST,
          csrfProof: json.csrfProof as string
        },
        createServerAdminCsrfProofRuntimeDependencies({
          expectedSessionBinding,
          currentTimestampMs: now + 1_000,
          maxProofAgeMs: 5 * 60_000
        }).verifierDependencies
      );

      expect(verified).toStrictEqual({
        valid: true
      });
    }
  );

  it("maps route-gate denials to safe error JSON without leaking adapter fields", async () => {
    const resolveRouteGate = vi.fn(async () => ({
      allowed: false as const,
      reason: "role_not_allowed" as const,
      statusCode: 403 as const,
      workspaceId: "workspace-secret",
      rawSqlError: "select secret from memberships"
    }));

    const response = await issueAdminCsrfProofRoute(
      createRequest({ requestedOperation: "product.write" }),
      {
        ...createRouteDependencies(),
        resolveRouteGate
      }
    );

    const json = await expectSafeError(response, 403, "role_not_allowed");
    expect(JSON.stringify(json)).not.toContain("workspace-secret");
  });

  it.each([
    [
      "viewer membership",
      {
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: trustedWorkspaceId,
          status: "active" as const,
          role: "viewer" as const
        }
      },
      403,
      "role_not_allowed"
    ],
    [
      "missing session",
      {
        authenticated: false,
        authUserId: null
      },
      401,
      "unauthenticated"
    ],
    [
      "missing admin profile",
      {
        adminUser: null
      },
      403,
      "admin_profile_missing"
    ],
    [
      "inactive admin profile",
      {
        adminUser: {
          id: "admin-user-1",
          status: "inactive" as const
        }
      },
      403,
      "admin_profile_inactive"
    ],
    [
      "missing membership",
      {
        membership: null
      },
      403,
      "membership_missing"
    ],
    [
      "inactive membership",
      {
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: trustedWorkspaceId,
          status: "inactive" as const,
          role: "admin" as const
        }
      },
      403,
      "membership_inactive"
    ],
    [
      "workspace mismatch",
      {
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: "workspace-2",
          status: "active" as const,
          role: "admin" as const
        }
      },
      403,
      "workspace_mismatch"
    ],
    [
      "missing trusted workspace",
      {
        workspaceId: null
      },
      403,
      "workspace_missing"
    ]
  ] as const)(
    "denies proof issuance for %s",
    async (_label, scenario, status, error) => {
      const response = await issueAdminCsrfProofRoute(
        createRequest({ requestedOperation: "product.write" }),
        createRouteDependencies(scenario)
      );

      await expectSafeError(response, status, error);
    }
  );

  it.each([
    [undefined, "session_workspace_binding_derivation_failed"],
    ["   ", "session_workspace_binding_derivation_failed"]
  ])("fails closed when the CSRF proof secret is %s", async (
    secret,
    error
  ) => {
    if (secret === undefined) {
      delete process.env.ADMIN_CSRF_PROOF_SECRET;
    } else {
      process.env.ADMIN_CSRF_PROOF_SECRET = secret;
    }

    const response = await issueAdminCsrfProofRoute(
      createRequest({ requestedOperation: "product.write" }),
      createRouteDependencies()
    );

    await expectSafeError(response, 503, error);
  });

  it.each([
    [
      "binding derivation",
      {
        sessionWorkspaceBindingDependencies: {
          deriveSessionWorkspaceBinding: vi.fn(async () => null)
        },
        issuerDependencies: {
          generateNonce: vi.fn(async () => "nonce-1"),
          signCsrfProof: vi.fn(async () => "signature-1")
        },
        verifierDependencies: {}
      },
      "session_workspace_binding_derivation_failed"
    ],
    [
      "signer",
      {
        sessionWorkspaceBindingDependencies: {
          deriveSessionWorkspaceBinding: vi.fn(async () => "opaque-binding")
        },
        issuerDependencies: {
          generateNonce: vi.fn(async () => "nonce-1")
        },
        verifierDependencies: {}
      },
      "signature_signer_unavailable"
    ],
    [
      "nonce",
      {
        sessionWorkspaceBindingDependencies: {
          deriveSessionWorkspaceBinding: vi.fn(async () => "opaque-binding")
        },
        issuerDependencies: {
          generateNonce: vi.fn(async () => " ")
        },
        verifierDependencies: {}
      },
      "nonce_missing"
    ]
  ])("fails closed when the %s dependency is unavailable", async (
    _label,
    runtimeDependencies,
    error
  ) => {
    const response = await issueAdminCsrfProofRoute(
      createRequest({ requestedOperation: "product.write" }),
      {
        ...createRouteDependencies(),
        createRuntimeDependencies: () => runtimeDependencies
      }
    );

    await expectSafeError(response, 503, error);
  });

  it("does not leak secrets or raw binding material when proof signing fails", async () => {
    const response = await issueAdminCsrfProofRoute(
      createRequest({ requestedOperation: "product.write" }),
      {
        ...createRouteDependencies(),
        createRuntimeDependencies: () => ({
          sessionWorkspaceBindingDependencies: {
            deriveSessionWorkspaceBinding: vi.fn(async () => "opaque-binding")
          },
          issuerDependencies: {
            generateNonce: vi.fn(async () => "nonce-secret"),
            signCsrfProof: vi.fn(async () => {
              throw new Error(
                "route-csrf-secret auth-user-1 admin-user-1 workspace-1 nonce-secret cookie token header sql supabase stack"
              );
            })
          },
          verifierDependencies: {}
        })
      }
    );

    const json = await expectSafeError(
      response,
      503,
      "csrf_proof_issue_failed"
    );

    const serialized = JSON.stringify(json).toLowerCase();

    for (const leakedTerm of [
      "route-csrf-secret",
      "auth-user-1",
      "admin-user-1",
      "workspace-1",
      "nonce-secret",
      "cookie",
      "token",
      "header",
      "sql",
      "supabase",
      "stack"
    ]) {
      expect(serialized).not.toContain(leakedTerm);
    }
  });

  it("keeps the production POST export wired to the same server-only route helper", async () => {
    const response = await POST(
      createRequest({ requestedOperation: "product.write" })
    );

    expect([200, 401, 403, 503]).toContain(response.status);
  });
});
