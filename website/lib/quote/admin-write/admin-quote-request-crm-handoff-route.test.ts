import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  handleAdminQuoteRequestCrmHandoffStatusUpdateRoute,
  type AdminQuoteRequestCrmHandoffStatusUpdateRouteDependencies
} from "./admin-quote-request-crm-handoff-route";
import type {
  AdminQuoteRequestCrmHandoffWritePersistence,
  AdminQuoteRequestCrmHandoffWriteResult
} from "./admin-quote-request-crm-handoff-write";

const env = {
  ADMIN_EXPECTED_ORIGIN: "https://admin.space.test",
  ADMIN_EXPECTED_HOST: "admin.space.test",
  ADMIN_TRUSTED_WORKSPACE_ID: "11111111-1111-4111-8111-111111111111",
  ADMIN_MUTATIONS_ENABLED: "true"
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
    `https://admin.space.test/api/admin/quote-requests/${quoteRequestId}/crm-handoff`,
    requestInit
  ) as NextRequest;
}

function createPersistence(
  result: AdminQuoteRequestCrmHandoffWriteResult = {
    ok: true,
    record: {
      id: quoteRequestId,
      type: "quoteRequest",
      crmProvider: "hubspot",
      crmSyncStatus: "queued"
    }
  }
): AdminQuoteRequestCrmHandoffWritePersistence {
  return {
    updateCrmHandoffStatus: vi.fn(async () => result)
  };
}

type TestDependencies = AdminQuoteRequestCrmHandoffStatusUpdateRouteDependencies & {
  createRuntimeDependencies: NonNullable<
    AdminQuoteRequestCrmHandoffStatusUpdateRouteDependencies["createRuntimeDependencies"]
  >;
  resolveSessionWorkspaceBinding: NonNullable<
    AdminQuoteRequestCrmHandoffStatusUpdateRouteDependencies["resolveSessionWorkspaceBinding"]
  >;
  resolveRouteGate: NonNullable<
    AdminQuoteRequestCrmHandoffStatusUpdateRouteDependencies["resolveRouteGate"]
  >;
  persistence: AdminQuoteRequestCrmHandoffWritePersistence;
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

describe("admin quote request CRM handoff queue route helper", () => {
  it("updates local CRM handoff queue status after quote.write CSRF and admin gate checks", async () => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);

    const response = await handleAdminQuoteRequestCrmHandoffStatusUpdateRoute(
      request({
        crmSyncStatus: "queued"
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
    expect(persistence.updateCrmHandoffStatus).toHaveBeenCalledWith({
      admin: adminContext,
      quoteRequestId,
      crmProvider: "hubspot",
      crmSyncStatus: "queued"
    });
    expect(await json(response)).toStrictEqual({
      ok: true,
      record: {
        id: quoteRequestId,
        type: "quoteRequest",
        crmProvider: "hubspot",
        crmSyncStatus: "queued"
      }
    });
  });

  it.each([
    [request({ crmSyncStatus: "not_queued" }), 200],
    [request({ crmSyncStatus: "queued" }), 200],
    [request({ crmSyncStatus: "failed" }), 200]
  ])("accepts narrow local CRM queue status payloads", async (
    input,
    expectedStatus
  ) => {
    const dependencies = createDependencies();

    const response = await handleAdminQuoteRequestCrmHandoffStatusUpdateRoute(
      input,
      {
        quoteRequestId
      },
      dependencies
    );

    expect(response.status).toBe(expectedStatus);
  });

  it.each([
    [request({ crmSyncStatus: "synced" }), "request_payload_invalid", 400],
    [request({ crmSyncStatus: "queued", crmContactId: "123" }), "request_payload_invalid", 400],
    [request({ crmSyncStatus: "queued", crmDealId: "456" }), "request_payload_invalid", 400],
    [request({ crmSyncStatus: "queued", crmLastSyncAttemptAt: "2026-06-16T00:00:00Z" }), "request_payload_invalid", 400],
    [request({ crmSyncStatus: "queued", customerName: "Maya" }), "request_payload_invalid", 400],
    [request(undefined), "request_body_missing", 400],
    [request(undefined, { method: "GET" }), "request_method_not_allowed", 405]
  ])("returns safe JSON for invalid CRM handoff requests", async (
    input,
    expectedError,
    expectedStatus
  ) => {
    const dependencies = createDependencies();

    const response = await handleAdminQuoteRequestCrmHandoffStatusUpdateRoute(
      input,
      {
        quoteRequestId
      },
      dependencies
    );
    const body = await json(response);

    expect(response.status).toBe(expectedStatus);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toStrictEqual({
      ok: false,
      error: expectedError
    });
    expect(dependencies.persistence.updateCrmHandoffStatus).not.toHaveBeenCalled();
  });

  it("maps provider failures to generic no-store JSON", async () => {
    const dependencies = createDependencies(
      createPersistence({
        ok: false,
        code: "QUOTE_CRM_HANDOFF_STATUS_UPDATE_FAILED"
      })
    );

    const response = await handleAdminQuoteRequestCrmHandoffStatusUpdateRoute(
      request({
        crmSyncStatus: "queued"
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
      error: "quote_crm_handoff_status_update_failed"
    });
    expect(JSON.stringify(body)).not.toContain(env.ADMIN_TRUSTED_WORKSPACE_ID);
    expect(JSON.stringify(body)).not.toContain(adminContext.adminUserId);
  });
});
