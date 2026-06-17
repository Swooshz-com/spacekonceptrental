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
import type {
  AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence,
  AdminQuoteRequestHubSpotManualImportOutcomeRecord
} from "./admin-quote-request-hubspot-manual-import-outcome-ledger";
import {
  handleAdminQuoteRequestCrmHandoffLifecycleReconciliationRoute,
  type AdminQuoteRequestCrmHandoffLifecycleReconciliationRouteDependencies
} from "./admin-quote-request-crm-handoff-lifecycle-reconciliation-route";

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
const csvManifest: AdminQuoteRequestCrmHandoffPacketManifestRecord = {
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
  generatedAt: "2026-06-17T12:00:00.000Z",
  source: "protected_admin"
};
const outcome: AdminQuoteRequestHubSpotManualImportOutcomeRecord = {
  id: "66666666-6666-4666-8666-666666666666",
  workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
  manifestId: csvManifest.id,
  provider: "hubspot",
  packetKind: "hubspot_import_csv",
  outcomeStatus: "manual_import_reviewed",
  recordCount: 1,
  requestIds: csvManifest.requestIds,
  requestIdCount: 1,
  recordedByAdminUserId: adminContext.adminUserId,
  recordedAt: "2026-06-17T12:30:00.000Z",
  source: "protected_admin"
};
const loadedResult: AdminQuoteRequestCrmHandoffPacketReadResult = {
  status: "loaded",
  packet: {
    generatedAt: "2026-06-17T12:00:00.000Z",
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit: 25,
    recordCount: 1,
    records: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        publicReference: "QR-REVIEWED",
        createdAt: "2026-06-17T09:00:00.000Z",
        status: "new",
        customerName: "Maya Tan",
        customerEmail: "maya@example.test",
        customerPhone: "+65 8123 4567",
        messageDetails: "Please prepare a lounge setup.",
        sourcePagePath: "/quote",
        futureProvider: "hubspot",
        localCrmSyncStatus: "queued"
      }
    ]
  }
};

function request(
  path = "/api/admin/quote-requests/crm-handoff-packet/lifecycle-reconciliation"
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
    "https://admin.space.test/api/admin/quote-requests/crm-handoff-packet/lifecycle-reconciliation",
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

function createPacketPersistence(
  result: AdminQuoteRequestCrmHandoffPacketReadResult = loadedResult
): AdminQuoteRequestCrmHandoffPacketReadPersistence {
  return {
    readPacket: vi.fn(async () => result)
  };
}

function createManifestPersistence(): AdminQuoteRequestCrmHandoffPacketManifestPersistence {
  return {
    createManifest: vi.fn(async () => ({
      status: "unavailable" as const
    })),
    readRecentManifests: vi.fn(async () => ({
      status: "loaded" as const,
      manifests: [csvManifest]
    }))
  };
}

function createOutcomePersistence(): AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence {
  return {
    recordOutcome: vi.fn(async () => ({
      status: "unavailable" as const
    })),
    readRecentOutcomes: vi.fn(async () => ({
      status: "loaded" as const,
      outcomes: [outcome]
    }))
  };
}

type TestDependencies =
  AdminQuoteRequestCrmHandoffLifecycleReconciliationRouteDependencies & {
    resolveRouteGate: NonNullable<
      AdminQuoteRequestCrmHandoffLifecycleReconciliationRouteDependencies["resolveRouteGate"]
    >;
    persistence: AdminQuoteRequestCrmHandoffPacketReadPersistence;
    manifestPersistence: AdminQuoteRequestCrmHandoffPacketManifestPersistence;
    outcomePersistence: AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence;
  };

function createDependencies(
  persistence = createPacketPersistence(),
  manifestPersistence = createManifestPersistence(),
  outcomePersistence = createOutcomePersistence()
): TestDependencies {
  return {
    env,
    generatedAt: () => "2026-06-17T12:45:00.000Z",
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
    manifestPersistence,
    outcomePersistence
  } as unknown as TestDependencies;
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin CRM handoff lifecycle reconciliation route helper", () => {
  it("returns a no-store bounded read-only reconciliation report after protected admin CSRF checks", async () => {
    const persistence = createPacketPersistence();
    const manifestPersistence = createManifestPersistence();
    const outcomePersistence = createOutcomePersistence();
    const dependencies = createDependencies(
      persistence,
      manifestPersistence,
      outcomePersistence
    );

    const response =
      await handleAdminQuoteRequestCrmHandoffLifecycleReconciliationRoute(
        request("?limit=25&status=queued"),
        dependencies
      );
    const body = await json(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dependencies.resolveSessionWorkspaceBinding).toHaveBeenCalledWith(
      {
        requestedOperation: "quote.write"
      },
      expect.any(Object)
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
            expectedSessionBinding: "session-binding",
            currentTimestampMs: 1_800_000
          })
        })
      })
    );
    expect(persistence.readPacket).toHaveBeenCalledWith({
      generatedAt: "2026-06-17T12:45:00.000Z",
      limit: 25,
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: env.ADMIN_TRUSTED_WORKSPACE_ID
      }
    });
    expect(manifestPersistence.readRecentManifests).toHaveBeenCalledWith({
      admin: adminContext,
      limit: 10
    });
    expect(outcomePersistence.readRecentOutcomes).toHaveBeenCalledWith({
      admin: adminContext,
      limit: 10
    });
    expect(manifestPersistence.createManifest).not.toHaveBeenCalled();
    expect(outcomePersistence.recordOutcome).not.toHaveBeenCalled();
    expect(body).toMatchObject({
      ok: true,
      reconciliation: {
        provider: "hubspot",
        localCrmSyncStatus: "queued",
        queuedRecordCount: 1,
        hubspotCsvManifestCount: 1,
        manualOutcomeCount: 1,
        csvExportedReviewedCount: 1,
        recommendedNextAction: "ready_for_future_sync_design"
      }
    });
    const serialized = JSON.stringify(body);

    expect(serialized).not.toContain("Maya Tan");
    expect(serialized).not.toContain("maya@example.test");
    expect(serialized).not.toContain("Please prepare a lounge setup.");
    expect(serialized).not.toContain("crm_contact_id");
    expect(serialized).not.toContain("crm_deal_id");
    expect(serialized).not.toContain("crm_last_sync_attempt_at");
    expect(serialized).not.toContain(".update");
    expect(serialized).not.toContain(".upsert");
    expect(serialized).not.toContain("hubapi");
    expect(serialized).not.toContain("webhook");
    expect(serialized).not.toContain("smtp");
  });

  it.each([
    [requestWithMethod("GET"), 405, "request_method_not_allowed"],
    [request("?limit=0"), 400, "request_limit_invalid"],
    [request("?limit=abc"), 400, "request_limit_invalid"],
    [request("?status=synced"), 400, "request_filter_invalid"]
  ])("returns safe JSON for invalid reconciliation requests", async (
    input,
    expectedStatus,
    expectedError
  ) => {
    const dependencies = createDependencies();

    const response =
      await handleAdminQuoteRequestCrmHandoffLifecycleReconciliationRoute(
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
    expect(dependencies.manifestPersistence.readRecentManifests).not.toHaveBeenCalled();
    expect(dependencies.outcomePersistence.readRecentOutcomes).not.toHaveBeenCalled();
  });

  it("rejects public or unauthorised access before reading packet, manifest, or outcome data", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.resolveRouteGate).mockResolvedValueOnce({
      allowed: false as const,
      reason: "unauthenticated",
      statusCode: 401
    });

    const response =
      await handleAdminQuoteRequestCrmHandoffLifecycleReconciliationRoute(
        request(),
        dependencies
      );

    expect(response.status).toBe(401);
    expect(await json(response)).toStrictEqual({
      ok: false,
      error: "unauthenticated"
    });
    expect(dependencies.persistence.readPacket).not.toHaveBeenCalled();
    expect(dependencies.manifestPersistence.readRecentManifests).not.toHaveBeenCalled();
    expect(dependencies.outcomePersistence.readRecentOutcomes).not.toHaveBeenCalled();
  });

  it("maps local read failures to generic errors without leaking SQL, provider, token, session, or header details", async () => {
    const dependencies = createDependencies(
      createPacketPersistence({
        status: "unavailable"
      })
    );

    const response =
      await handleAdminQuoteRequestCrmHandoffLifecycleReconciliationRoute(
        request(),
        dependencies
      );
    const body = await json(response);

    expect(response.status).toBe(503);
    expect(body).toStrictEqual({
      ok: false,
      error: "quote_crm_handoff_lifecycle_reconciliation_unavailable"
    });
    expect(JSON.stringify(body)).not.toContain("sql");
    expect(JSON.stringify(body)).not.toContain("hubapi");
    expect(JSON.stringify(body)).not.toContain("token");
    expect(JSON.stringify(body)).not.toContain("session");
    expect(JSON.stringify(body)).not.toContain("header");
    expect(JSON.stringify(body)).not.toContain(adminContext.adminUserId);
  });
});
