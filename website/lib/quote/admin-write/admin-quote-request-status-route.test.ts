import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  handleAdminQuoteRequestStatusUpdateRoute,
  type AdminQuoteRequestStatusUpdateRouteDependencies
} from "./admin-quote-request-status-route";
import type {
  AdminQuoteRequestStatusWritePersistence,
  AdminQuoteRequestStatusWriteResult
} from "./admin-quote-request-status-write";

const env = {
  ADMIN_EXPECTED_ORIGIN: "https://admin.space.test",
  ADMIN_EXPECTED_HOST: "admin.space.test",
  ADMIN_TRUSTED_WORKSPACE_ID: "11111111-1111-4111-8111-111111111111"
};
const quoteRequestId = "22222222-2222-4222-8222-222222222222";
const adminContext = {
  workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
  adminUserId: "33333333-3333-4333-8333-333333333333",
  membershipId: "44444444-4444-4444-8444-444444444444",
  resolution: "server-auth-membership" as const
};

function request(body?: unknown, init: RequestInit = {}) {
  const requestInit: RequestInit = {
    method: "POST",
    ...init,
    headers: {
      "content-type": "application/json",
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST,
      "x-csrf-proof": "proof",
      ...((init.headers as Record<string, string>) || {})
    }
  };

  if (body !== undefined) {
    requestInit.body =
      typeof body === "string" ? body : JSON.stringify(body);
  }

  return new Request(
    `https://admin.space.test/api/admin/quote-requests/${quoteRequestId}/status`,
    requestInit
  ) as NextRequest;
}

function createPersistence(
  result: AdminQuoteRequestStatusWriteResult = {
    ok: true,
    record: {
      id: quoteRequestId,
      type: "quoteRequest"
    }
  }
): AdminQuoteRequestStatusWritePersistence {
  return {
    updateStatus: vi.fn(async () => result)
  };
}

type TestDependencies = AdminQuoteRequestStatusUpdateRouteDependencies & {
  createRuntimeDependencies: NonNullable<
    AdminQuoteRequestStatusUpdateRouteDependencies["createRuntimeDependencies"]
  >;
  resolveSessionWorkspaceBinding: NonNullable<
    AdminQuoteRequestStatusUpdateRouteDependencies["resolveSessionWorkspaceBinding"]
  >;
  resolveRouteGate: NonNullable<
    AdminQuoteRequestStatusUpdateRouteDependencies["resolveRouteGate"]
  >;
  persistence: AdminQuoteRequestStatusWritePersistence;
};

function createDependencies(
  persistence = createPersistence()
): TestDependencies {
  return {
    env,
    now: () => 1_700_000_000_000,
    createRuntimeDependencies: vi.fn(() => ({
      issuerDependencies: {
        generateNonce: vi.fn(async () => "nonce"),
        signCsrfProof: vi.fn(async () => "signature")
      },
      sessionWorkspaceBindingDependencies: {
        deriveSessionWorkspaceBinding: vi.fn(() => "bound-session")
      },
      verifierDependencies: {
        verifySignature: vi.fn(async () => true)
      }
    })),
    resolveSessionWorkspaceBinding: vi.fn(async () => ({
      bound: true as const,
      sessionBinding: "bound-session",
      adminContext,
      requestId: "request-1"
    })),
    resolveRouteGate: vi.fn(async () => ({
      allowed: true as const,
      reason: "allowed" as const,
      statusCode: 200 as const,
      workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
      requestId: "request-1"
    })),
    persistence
  } as TestDependencies;
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin quote request status update route helper", () => {
  it("updates quote request workflow after quote.write CSRF and admin gate checks", async () => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);

    const response = await handleAdminQuoteRequestStatusUpdateRoute(
      request({
        status: "reviewing",
        internalNote: "Call Maya about sofa quantities."
      }),
      {
        quoteRequestId
      },
      dependencies
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dependencies.resolveSessionWorkspaceBinding).toHaveBeenCalledWith(
      {
        requestedOperation: "quote.write"
      },
      expect.objectContaining({
        workspace: {
          trustedServerWorkspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID
        }
      })
    );
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      {
        requestedOperation: "quote.write",
        requestMethod: "POST",
        request: expect.any(Request)
      },
      expect.objectContaining({
        gate: expect.objectContaining({
          csrfVerifier: expect.objectContaining({
            expectedSessionBinding: "bound-session",
            currentTimestampMs: 1_700_000_000_000,
            maxProofAgeMs: 300_000
          }),
          decision: {
            workspace: {
              trustedServerWorkspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID
            }
          }
        })
      })
    );
    expect(persistence.updateStatus).toHaveBeenCalledWith({
      admin: adminContext,
      quoteRequestId,
      status: "reviewing",
      internalNote: "Call Maya about sofa quantities."
    });
    expect(await json(response)).toStrictEqual({
      ok: true,
      record: {
        id: quoteRequestId,
        type: "quoteRequest"
      }
    });
  });

  it.each([
    [request({ status: "reviewing" }, { headers: { "x-csrf-proof": "" } }), "csrf_proof_missing", 403],
    [request({ status: "paid" }), "request_payload_invalid", 400],
    [request({ status: "reviewing", internalNote: "x".repeat(1201) }), "request_payload_invalid", 400],
    [request({ status: "reviewing", customerName: "Maya" }), "request_payload_invalid", 400],
    [request(undefined), "request_body_missing", 400],
    [request(undefined, { method: "GET" }), "request_method_not_allowed", 405]
  ])("returns safe JSON for invalid requests", async (
    input,
    expectedError,
    expectedStatus
  ) => {
    const dependencies = createDependencies();

    if (expectedError === "csrf_proof_missing") {
      dependencies.resolveRouteGate = vi.fn(async () => ({
        allowed: false as const,
        reason: "csrf_proof_missing" as const,
        statusCode: 403 as const,
        workspaceId: "workspace-secret",
        rawError: "sql supabase stack token cookie"
      })) as TestDependencies["resolveRouteGate"];
    }

    const response = await handleAdminQuoteRequestStatusUpdateRoute(
      input,
      {
        quoteRequestId
      },
      dependencies
    );
    const body = await json(response);
    const serialized = JSON.stringify(body).toLowerCase();

    expect(response.status).toBe(expectedStatus);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toStrictEqual({
      ok: false,
      error: expectedError
    });
    expect(serialized).not.toContain("sql");
    expect(serialized).not.toContain("supabase");
    expect(serialized).not.toContain("stack");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("workspace-secret");
    expect(dependencies.persistence.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects invalid quote request IDs before auth or persistence", async () => {
    const dependencies = createDependencies();

    const response = await handleAdminQuoteRequestStatusUpdateRoute(
      request({
        status: "reviewing"
      }),
      {
        quoteRequestId: "not-a-uuid"
      },
      dependencies
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toStrictEqual({
      ok: false,
      error: "quote_request_id_invalid"
    });
    expect(dependencies.resolveSessionWorkspaceBinding).not.toHaveBeenCalled();
    expect(dependencies.resolveRouteGate).not.toHaveBeenCalled();
  });

  it.each([
    ["workspace_missing", 403],
    ["workspace_mismatch", 403],
    ["role_not_allowed", 403],
    ["admin_csrf_session_workspace_binding_unavailable", 503]
  ] as const)("fails closed for %s before persistence", async (
    reason,
    statusCode
  ) => {
    const dependencies = createDependencies();
    dependencies.resolveSessionWorkspaceBinding = vi.fn(async () => ({
      bound: false as const,
      reason,
      statusCode
    })) as TestDependencies["resolveSessionWorkspaceBinding"];

    const response = await handleAdminQuoteRequestStatusUpdateRoute(
      request({
        status: "reviewing"
      }),
      {
        quoteRequestId
      },
      dependencies
    );

    expect(response.status).toBe(statusCode);
    expect(await json(response)).toStrictEqual({
      ok: false,
      error: reason
    });
    expect(dependencies.persistence.updateStatus).not.toHaveBeenCalled();
  });

  it("maps provider failures to generic no-store JSON", async () => {
    const dependencies = createDependencies(
      createPersistence({
        ok: false,
        code: "QUOTE_STATUS_UPDATE_FAILED"
      })
    );

    const response = await handleAdminQuoteRequestStatusUpdateRoute(
      request({
        status: "quoted"
      }),
      {
        quoteRequestId
      },
      dependencies
    );
    const body = await json(response);

    expect(response.status).toBe(503);
    expect(body).toStrictEqual({
      ok: false,
      error: "quote_status_update_failed"
    });
    expect(JSON.stringify(body)).not.toContain(env.ADMIN_TRUSTED_WORKSPACE_ID);
    expect(JSON.stringify(body)).not.toContain(adminContext.adminUserId);
  });
});
