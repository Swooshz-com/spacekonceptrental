import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import type {
  AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence,
  AdminQuoteRequestHubSpotManualImportOutcomeRecord,
  AdminQuoteRequestHubSpotManualImportOutcomeRecordResult
} from "./admin-quote-request-hubspot-manual-import-outcome-ledger";
import {
  handleAdminQuoteRequestHubSpotManualImportOutcomeRoute,
  type AdminQuoteRequestHubSpotManualImportOutcomeRouteDependencies
} from "./admin-quote-request-hubspot-manual-import-outcome-route";

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
const outcome: AdminQuoteRequestHubSpotManualImportOutcomeRecord = {
  id: "55555555-5555-4555-8555-555555555555",
  workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
  manifestId: "66666666-6666-4666-8666-666666666666",
  provider: "hubspot",
  packetKind: "hubspot_import_csv",
  outcomeStatus: "manual_import_reviewed",
  recordCount: 1,
  requestIds: ["77777777-7777-4777-8777-777777777777"],
  requestIdCount: 1,
  recordedByAdminUserId: adminContext.adminUserId,
  recordedAt: "2026-06-17T11:00:00.000Z",
  source: "protected_admin"
};

function request({
  method = "POST",
  body = {
    manifestId: outcome.manifestId,
    outcomeStatus: outcome.outcomeStatus
  }
}: {
  method?: string;
  body?: unknown;
} = {}) {
  return new Request(
    "https://admin.space.test/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome",
    {
      method,
      headers: {
        origin: env.ADMIN_EXPECTED_ORIGIN,
        host: env.ADMIN_EXPECTED_HOST,
        "content-type": "application/json",
        "x-csrf-proof": "proof-secret"
      },
      body: method === "POST" ? JSON.stringify(body) : undefined
    }
  ) as NextRequest;
}

function createPersistence(
  recordResult: AdminQuoteRequestHubSpotManualImportOutcomeRecordResult = {
    status: "created",
    outcome
  }
): AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence {
  return {
    recordOutcome: vi.fn(async () => recordResult),
    readRecentOutcomes: vi.fn(async () => ({
      status: "loaded" as const,
      outcomes: [outcome]
    }))
  };
}

type TestDependencies =
  AdminQuoteRequestHubSpotManualImportOutcomeRouteDependencies & {
    resolveRouteGate: NonNullable<
      AdminQuoteRequestHubSpotManualImportOutcomeRouteDependencies["resolveRouteGate"]
    >;
    persistence: AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence;
  };

function createDependencies(
  persistence = createPersistence()
): TestDependencies {
  return {
    env,
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

describe("admin HubSpot manual import outcome route helper", () => {
  it("creates a metadata-only local outcome after quote.write admin gate checks", async () => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);

    const response =
      await handleAdminQuoteRequestHubSpotManualImportOutcomeRoute(
        request(),
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
        request: expect.any(Request),
        requiresMutationCapability: true
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
    expect(persistence.recordOutcome).toHaveBeenCalledWith({
      admin: adminContext,
      manifestId: outcome.manifestId,
      outcomeStatus: "manual_import_reviewed"
    });
    expect(persistence.readRecentOutcomes).toHaveBeenCalledWith({
      admin: adminContext,
      limit: 10
    });
    expect(body).toStrictEqual({
      ok: true,
      outcome,
      recentOutcomes: [outcome]
    });
    const serialized = JSON.stringify({
      body,
      calls: vi.mocked(persistence.recordOutcome).mock.calls
    });
    expect(serialized).not.toContain("Maya Tan");
    expect(serialized).not.toContain("maya@example.test");
    expect(serialized).not.toContain("crmContactId");
    expect(serialized).not.toContain("crmDealId");
    expect(serialized).not.toContain("crmLastSyncAttemptAt");
    expect(serialized).not.toContain(".update");
    expect(serialized).not.toContain(".upsert");
    expect(serialized).not.toContain("hubapi");
    expect(serialized).not.toContain("webhook");
    expect(serialized).not.toContain("smtp");
  });

  it.each([
    [request({ method: "GET" }), 405, "request_method_not_allowed"],
    [request({ body: null }), 400, "request_body_invalid"],
    [request({ body: { manifestId: "not-a-uuid", outcomeStatus: "manual_import_reviewed" } }), 400, "request_body_invalid"],
    [request({ body: { manifestId: outcome.manifestId, outcomeStatus: "freeform note" } }), 400, "request_body_invalid"]
  ])("returns safe JSON for invalid outcome requests", async (
    input,
    expectedStatus,
    expectedError
  ) => {
    const dependencies = createDependencies();

    const response =
      await handleAdminQuoteRequestHubSpotManualImportOutcomeRoute(
        input,
        dependencies
      );

    expect(response.status).toBe(expectedStatus);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await json(response)).toStrictEqual({
      ok: false,
      error: expectedError
    });
    expect(dependencies.persistence.recordOutcome).not.toHaveBeenCalled();
  });

  it("rejects public or unauthorised access before reading or writing data", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.resolveRouteGate).mockResolvedValueOnce({
      allowed: false as const,
      reason: "unauthenticated",
      statusCode: 401
    });

    const response =
      await handleAdminQuoteRequestHubSpotManualImportOutcomeRoute(
        request(),
        dependencies
      );

    expect(response.status).toBe(401);
    expect(await json(response)).toStrictEqual({
      ok: false,
      error: "unauthenticated"
    });
    expect(dependencies.persistence.recordOutcome).not.toHaveBeenCalled();
    expect(dependencies.persistence.readRecentOutcomes).not.toHaveBeenCalled();
  });

  it("maps persistence failures to generic errors without mutating quote or enquiry rows", async () => {
    const persistence = createPersistence({
      status: "unavailable"
    });
    const dependencies = createDependencies(persistence);

    const response =
      await handleAdminQuoteRequestHubSpotManualImportOutcomeRoute(
        request(),
        dependencies
      );
    const body = await json(response);

    expect(response.status).toBe(503);
    expect(body).toStrictEqual({
      ok: false,
      error: "quote_crm_handoff_manual_import_outcome_unavailable"
    });
    expect(JSON.stringify(body)).not.toContain("sql");
    expect(JSON.stringify(body)).not.toContain("token");
    expect(JSON.stringify(body)).not.toContain("session");
    expect(JSON.stringify(body)).not.toContain("header");
    expect(persistence.readRecentOutcomes).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(persistence.recordOutcome).mock.calls)).not.toContain(
      "quote_requests"
    );
    expect(JSON.stringify(vi.mocked(persistence.recordOutcome).mock.calls)).not.toContain(
      "synced"
    );
    expect(JSON.stringify(vi.mocked(persistence.recordOutcome).mock.calls)).not.toContain(
      "crm_last_sync_attempt_at"
    );
    expect(JSON.stringify(vi.mocked(persistence.recordOutcome).mock.calls)).not.toContain(
      "crm_contact_id"
    );
    expect(JSON.stringify(vi.mocked(persistence.recordOutcome).mock.calls)).not.toContain(
      "crm_deal_id"
    );
  });
});
