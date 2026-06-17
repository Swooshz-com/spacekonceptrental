import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import type {
  AdminQuoteRequestCrmHandoffPacketReadPersistence,
  AdminQuoteRequestCrmHandoffPacketReadResult
} from "./admin-quote-request-crm-handoff-packet-read";
import {
  handleAdminQuoteRequestHubSpotImportCsvPreflightRoute,
  type AdminQuoteRequestHubSpotImportCsvPreflightRouteDependencies
} from "./admin-quote-request-hubspot-import-csv-preflight-route";

const env = {
  ADMIN_EXPECTED_ORIGIN: "https://admin.space.test",
  ADMIN_EXPECTED_HOST: "admin.space.test",
  ADMIN_TRUSTED_WORKSPACE_ID: "11111111-1111-4111-8111-111111111111"
};
const adminContext = {
  workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
  adminUserId: "33333333-3333-4333-8333-333333333333",
  membershipId: "44444444-4444-4444-8444-444444444444",
  resolution: "server-auth-membership" as const
};
const csrfRuntimeDependencies = {
  sessionWorkspaceBindingDependencies: {},
  issuerDependencies: {},
  verifierDependencies: {}
};
const loadedResult: AdminQuoteRequestCrmHandoffPacketReadResult = {
  status: "loaded",
  packet: {
    generatedAt: "2026-06-17T10:00:00.000Z",
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit: 25,
    recordCount: 2,
    records: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        publicReference: "QR-READY",
        createdAt: "2026-06-17T09:00:00.000Z",
        status: "new",
        customerName: "Maya Tan",
        customerEmail: "maya@example.test",
        customerPhone: "+65 8123 4567",
        messageDetails: "Please prepare a lounge setup.",
        sourcePagePath: "/quote",
        futureProvider: "hubspot",
        localCrmSyncStatus: "queued"
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        publicReference: "QR-REVIEW",
        createdAt: "2026-06-17T09:30:00.000Z",
        status: "new",
        customerName: "",
        customerEmail: "bad-email",
        customerPhone: "",
        messageDetails: "",
        futureProvider: "hubspot",
        localCrmSyncStatus: "queued"
      }
    ]
  }
};

function request(
  path = "/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight"
) {
  return new Request(`https://admin.space.test${path}`, {
    method: "POST",
    headers: {
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST,
      "x-csrf-proof": "proof-secret"
    }
  }) as NextRequest;
}

function requestWithMethod(method: string) {
  return new Request(
    "https://admin.space.test/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight",
    {
      method,
      headers: {
        origin: env.ADMIN_EXPECTED_ORIGIN,
        host: env.ADMIN_EXPECTED_HOST,
        "x-csrf-proof": "proof-secret"
      }
    }
  ) as NextRequest;
}

function createPersistence(
  result: AdminQuoteRequestCrmHandoffPacketReadResult = loadedResult
): AdminQuoteRequestCrmHandoffPacketReadPersistence {
  return {
    readPacket: vi.fn(async () => result)
  };
}

type TestDependencies =
  AdminQuoteRequestHubSpotImportCsvPreflightRouteDependencies & {
    resolveRouteGate: NonNullable<
      AdminQuoteRequestHubSpotImportCsvPreflightRouteDependencies["resolveRouteGate"]
    >;
    persistence: AdminQuoteRequestCrmHandoffPacketReadPersistence;
  };

function createDependencies(
  persistence = createPersistence()
): TestDependencies {
  return {
    env,
    generatedAt: () => "2026-06-17T10:00:00.000Z",
    now: () => 1_800_000,
    createRuntimeDependencies: vi.fn(() => csrfRuntimeDependencies),
    resolveSessionWorkspaceBinding: vi.fn(async () => ({
      bound: true as const,
      sessionBinding: "session-binding",
      adminContext
    })),
    resolveRouteGate: vi.fn(async () => ({
      allowed: true as const,
      reason: "allowed" as const,
      statusCode: 200 as const,
      workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
      requestId: "request-1",
      adminContext
    })),
    persistence
  } as unknown as TestDependencies;
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin HubSpot import CSV preflight route helper", () => {
  it("returns a no-store bounded preflight report after protected admin CSRF checks without creating manifests", async () => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);

    const response =
      await handleAdminQuoteRequestHubSpotImportCsvPreflightRoute(
        request("?limit=25&status=queued"),
        dependencies
      );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      {
        requestedOperation: "quote.write",
        requestMethod: "POST",
        request: expect.any(Request)
      },
      expect.objectContaining({
        gate: expect.objectContaining({
          csrfVerifier: expect.objectContaining({
            expectedSessionBinding: "session-binding",
            currentTimestampMs: 1_800_000
          })
        })
      })
    );
    expect(persistence.readPacket).toHaveBeenCalledWith({
      generatedAt: "2026-06-17T10:00:00.000Z",
      limit: 25,
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: env.ADMIN_TRUSTED_WORKSPACE_ID
      }
    });
    const body = await json(response);

    expect(body).toMatchObject({
      ok: true,
      preflight: {
        provider: "hubspot",
        localCrmSyncStatus: "queued",
        limit: 25,
        totalRecordCount: 2,
        exportableRecordCount: 1,
        needsReviewRecordCount: 2
      }
    });
    expect(JSON.stringify(body)).not.toContain("manifest");
    expect(JSON.stringify(body)).not.toContain("crm_contact_id");
    expect(JSON.stringify(body)).not.toContain("crm_deal_id");
    expect(JSON.stringify(body)).not.toContain("crm_last_sync_attempt_at");
    expect(JSON.stringify(body)).not.toContain("synced");
    expect(JSON.stringify(body)).not.toContain(".update");
    expect(JSON.stringify(body)).not.toContain(".upsert");
  });

  it.each([
    [requestWithMethod("GET"), 405, "request_method_not_allowed"],
    [request("?limit=0"), 400, "request_limit_invalid"],
    [request("?limit=abc"), 400, "request_limit_invalid"],
    [request("?status=failed"), 400, "request_filter_invalid"]
  ])("returns safe JSON for invalid preflight requests", async (
    input,
    expectedStatus,
    expectedError
  ) => {
    const dependencies = createDependencies();

    const response =
      await handleAdminQuoteRequestHubSpotImportCsvPreflightRoute(
        input,
        dependencies
      );

    expect(response.status).toBe(expectedStatus);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await json(response)).toStrictEqual({
      ok: false,
      error: expectedError
    });
    expect(dependencies.persistence.readPacket).not.toHaveBeenCalled();
  });

  it("rejects public or unauthorised access before reading packet data", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.resolveRouteGate).mockResolvedValueOnce({
      allowed: false as const,
      reason: "unauthenticated",
      statusCode: 401
    });

    const response =
      await handleAdminQuoteRequestHubSpotImportCsvPreflightRoute(
        request(),
        dependencies
      );

    expect(response.status).toBe(401);
    expect(await json(response)).toStrictEqual({
      ok: false,
      error: "unauthenticated"
    });
    expect(dependencies.persistence.readPacket).not.toHaveBeenCalled();
  });

  it("maps packet failures to generic errors without leaking SQL, provider, token, session, or header details", async () => {
    const dependencies = createDependencies(
      createPersistence({
        status: "unavailable"
      })
    );

    const response =
      await handleAdminQuoteRequestHubSpotImportCsvPreflightRoute(
        request(),
        dependencies
      );
    const body = await json(response);

    expect(response.status).toBe(503);
    expect(body).toStrictEqual({
      ok: false,
      error: "quote_crm_handoff_preflight_unavailable"
    });
    expect(JSON.stringify(body)).not.toContain("sql");
    expect(JSON.stringify(body)).not.toContain("hubapi");
    expect(JSON.stringify(body)).not.toContain("token");
    expect(JSON.stringify(body)).not.toContain("session");
    expect(JSON.stringify(body)).not.toContain("header");
    expect(JSON.stringify(body)).not.toContain(adminContext.adminUserId);
  });
});
