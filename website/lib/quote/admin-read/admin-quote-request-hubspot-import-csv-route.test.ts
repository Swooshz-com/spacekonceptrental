import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import type {
  AdminQuoteRequestCrmHandoffPacketReadPersistence,
  AdminQuoteRequestCrmHandoffPacketReadResult
} from "./admin-quote-request-crm-handoff-packet-read";
import type {
  AdminQuoteRequestCrmHandoffPacketManifestPersistence,
  AdminQuoteRequestCrmHandoffPacketManifestRecord
} from "./admin-quote-request-crm-handoff-packet-manifest";
import {
  handleAdminQuoteRequestHubSpotImportCsvRoute,
  type AdminQuoteRequestHubSpotImportCsvRouteDependencies
} from "./admin-quote-request-hubspot-import-csv-route";

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
    generatedAt: "2026-06-17T09:30:45.000Z",
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit: 25,
    recordCount: 1,
    records: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        publicReference: "QR-20260617-CSV",
        createdAt: "2026-06-17T09:00:00.000Z",
        status: "new",
        customerName: "Maya Tan",
        customerEmail: "maya@example.test",
        customerPhone: "+65 8123 4567",
        companyOrEventOrganisation: "Marina Bay Sands",
        messageDetails: "Please prepare a lounge setup.",
        sourcePagePath: "/quote?listing=modular-lounge-set",
        sourceListingSlug: "modular-lounge-set",
        futureProvider: "hubspot",
        localCrmSyncStatus: "queued"
      }
    ]
  }
};
const manifest: AdminQuoteRequestCrmHandoffPacketManifestRecord = {
  id: "55555555-5555-4555-8555-555555555555",
  workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
  provider: "hubspot",
  packetKind: "hubspot_import_csv",
  statusFilter: "queued",
  limitRequested: 25,
  recordCount: 1,
  requestIds: ["22222222-2222-4222-8222-222222222222"],
  requestIdCount: 1,
  generatedByAdminUserId: adminContext.adminUserId,
  generatedAt: "2026-06-17T09:30:45.000Z",
  source: "protected_admin"
};

function request(
  path = "/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv"
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
    "https://admin.space.test/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv",
    {
      method,
      headers: {
        origin: env.ADMIN_EXPECTED_ORIGIN,
        host: env.ADMIN_EXPECTED_HOST
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

function createManifestPersistence(): AdminQuoteRequestCrmHandoffPacketManifestPersistence {
  return {
    createManifest: vi.fn(async () => ({
      status: "created" as const,
      manifest
    })),
    readRecentManifests: vi.fn(async () => ({
      status: "loaded" as const,
      manifests: [manifest]
    }))
  };
}

type TestDependencies = AdminQuoteRequestHubSpotImportCsvRouteDependencies & {
  resolveRouteGate: NonNullable<
    AdminQuoteRequestHubSpotImportCsvRouteDependencies["resolveRouteGate"]
  >;
  persistence: AdminQuoteRequestCrmHandoffPacketReadPersistence;
  manifestPersistence: AdminQuoteRequestCrmHandoffPacketManifestPersistence;
};

function createDependencies(
  persistence = createPersistence(),
  manifestPersistence = createManifestPersistence()
): TestDependencies {
  return {
    env,
    generatedAt: () => "2026-06-17T09:30:45.000Z",
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
    persistence,
    manifestPersistence
  } as unknown as TestDependencies;
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin HubSpot import CSV route helper", () => {
  it("returns no-store CSV and records metadata-only manifest after quote.write admin gate checks", async () => {
    const persistence = createPersistence();
    const manifestPersistence = createManifestPersistence();
    const dependencies = createDependencies(persistence, manifestPersistence);

    const response = await handleAdminQuoteRequestHubSpotImportCsvRoute(
      request("?limit=25&status=queued"),
      dependencies
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="skr-hubspot-import-queued-enquiries-20260617-093045.csv"'
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      {
        requestedOperation: "quote.write",
        requestMethod: "POST",
        request: expect.any(Request)
      },
      expect.objectContaining({
        gate: expect.objectContaining({
          csrfVerifier: expect.objectContaining({
            expectedSessionBinding: "session-binding"
          })
        })
      })
    );
    expect(persistence.readPacket).toHaveBeenCalledWith({
      generatedAt: "2026-06-17T09:30:45.000Z",
      limit: 25,
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: env.ADMIN_TRUSTED_WORKSPACE_ID
      }
    });
    expect(manifestPersistence.createManifest).toHaveBeenCalledWith({
      admin: adminContext,
      packet: loadedResult.packet,
      packetKind: "hubspot_import_csv"
    });
    expect(manifestPersistence.readRecentManifests).not.toHaveBeenCalled();
    const csv = await response.text();

    expect(csv).toContain('"Quote Request ID","Public Reference"');
    expect(csv).toContain('"QR-20260617-CSV"');
    const manifestCalls = JSON.stringify(
      vi.mocked(manifestPersistence.createManifest).mock.calls
    );
    expect(manifestCalls).not.toContain("crm_contact_id");
    expect(manifestCalls).not.toContain("crm_deal_id");
    expect(manifestCalls).not.toContain(
      "crm_last_sync_attempt_at"
    );
    expect(manifestCalls).not.toContain("synced");
    expect(manifestCalls).not.toContain(".update");
    expect(manifestCalls).not.toContain(".upsert");
  });

  it.each([
    [requestWithMethod("GET"), 405, "request_method_not_allowed"],
    [request("?limit=0"), 400, "request_limit_invalid"],
    [request("?limit=abc"), 400, "request_limit_invalid"],
    [request("?status=failed"), 400, "request_filter_invalid"]
  ])("returns safe JSON for invalid CSV requests", async (
    input,
    expectedStatus,
    expectedError
  ) => {
    const dependencies = createDependencies();

    const response = await handleAdminQuoteRequestHubSpotImportCsvRoute(
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
    expect(dependencies.manifestPersistence.createManifest).not.toHaveBeenCalled();
  });

  it("rejects public or unauthorised access before reading packet data", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.resolveRouteGate).mockResolvedValueOnce({
      allowed: false as const,
      reason: "unauthenticated",
      statusCode: 401
    });

    const response = await handleAdminQuoteRequestHubSpotImportCsvRoute(
      request(),
      dependencies
    );

    expect(response.status).toBe(401);
    expect(await json(response)).toStrictEqual({
      ok: false,
      error: "unauthenticated"
    });
    expect(dependencies.persistence.readPacket).not.toHaveBeenCalled();
    expect(dependencies.manifestPersistence.createManifest).not.toHaveBeenCalled();
  });

  it("maps packet and manifest failures to generic errors without leaking details", async () => {
    const packetFailure = await handleAdminQuoteRequestHubSpotImportCsvRoute(
      request(),
      createDependencies(
        createPersistence({
          status: "unavailable"
        })
      )
    );
    const packetBody = await json(packetFailure);

    expect(packetFailure.status).toBe(503);
    expect(packetBody).toStrictEqual({
      ok: false,
      error: "quote_crm_handoff_csv_unavailable"
    });
    expect(JSON.stringify(packetBody)).not.toContain("sql");
    expect(JSON.stringify(packetBody)).not.toContain("token");

    const manifestPersistence: AdminQuoteRequestCrmHandoffPacketManifestPersistence = {
      createManifest: vi.fn(async () => ({
        status: "unavailable" as const
      })),
      readRecentManifests: vi.fn(async () => ({
        status: "loaded" as const,
        manifests: []
      }))
    };
    const manifestFailure = await handleAdminQuoteRequestHubSpotImportCsvRoute(
      request(),
      createDependencies(createPersistence(), manifestPersistence)
    );
    const manifestBody = await json(manifestFailure);

    expect(manifestFailure.status).toBe(503);
    expect(manifestBody).toStrictEqual({
      ok: false,
      error: "quote_crm_handoff_packet_manifest_unavailable"
    });
    expect(manifestPersistence.createManifest).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(manifestBody)).not.toContain("hubapi");
    expect(JSON.stringify(manifestBody)).not.toContain(adminContext.adminUserId);
  });
});
