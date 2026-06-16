import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  handleAdminQuoteRequestCrmHandoffPacketRoute,
  type AdminQuoteRequestCrmHandoffPacketRouteDependencies
} from "./admin-quote-request-crm-handoff-packet-route";
import type {
  AdminQuoteRequestCrmHandoffPacketReadPersistence,
  AdminQuoteRequestCrmHandoffPacketReadResult
} from "./admin-quote-request-crm-handoff-packet-read";

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
const loadedResult: AdminQuoteRequestCrmHandoffPacketReadResult = {
  status: "loaded",
  packet: {
    generatedAt: "2026-06-16T12:00:00.000Z",
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit: 25,
    recordCount: 1,
    records: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        publicReference: "QR-20260616-NEWEST",
        createdAt: "2026-06-16T10:30:00.000Z",
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

function request(path = "/api/admin/quote-requests/crm-handoff-packet") {
  return new Request(`https://admin.space.test${path}`, {
    method: "GET",
    headers: {
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST
    }
  }) as NextRequest;
}

function requestWithMethod(method: string) {
  return new Request(
    "https://admin.space.test/api/admin/quote-requests/crm-handoff-packet",
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

type TestDependencies = AdminQuoteRequestCrmHandoffPacketRouteDependencies & {
  resolveRouteGate: NonNullable<
    AdminQuoteRequestCrmHandoffPacketRouteDependencies["resolveRouteGate"]
  >;
  persistence: AdminQuoteRequestCrmHandoffPacketReadPersistence;
};

function createDependencies(
  persistence = createPersistence()
): TestDependencies {
  return {
    env,
    generatedAt: () => "2026-06-16T12:00:00.000Z",
    resolveRouteGate: vi.fn(async () => ({
      allowed: true as const,
      reason: "allowed" as const,
      statusCode: 200 as const,
      workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
      requestId: "request-1",
      adminContext
    })),
    persistence
  } as TestDependencies;
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin CRM handoff packet route helper", () => {
  it("returns a no-store queued packet after quote.read admin gate checks", async () => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);

    const response = await handleAdminQuoteRequestCrmHandoffPacketRoute(
      request("?limit=25"),
      dependencies
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      {
        requestedOperation: "quote.read",
        requestMethod: "GET",
        request: expect.any(Request)
      },
      expect.objectContaining({
        requestMetadata: {
          expectedOrigin: env.ADMIN_EXPECTED_ORIGIN,
          expectedHost: env.ADMIN_EXPECTED_HOST
        },
        gate: expect.objectContaining({
          decision: {
            workspace: {
              trustedServerWorkspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID
            }
          }
        })
      })
    );
    expect(persistence.readPacket).toHaveBeenCalledWith({
      generatedAt: "2026-06-16T12:00:00.000Z",
      limit: 25,
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: env.ADMIN_TRUSTED_WORKSPACE_ID
      }
    });
    expect(await json(response)).toStrictEqual({
      ok: true,
      packet: loadedResult.packet
    });
  });

  it.each([
    [requestWithMethod("POST"), 405, "request_method_not_allowed"],
    [request("?limit=0"), 400, "request_limit_invalid"],
    [request("?limit=abc"), 400, "request_limit_invalid"],
    [request("?status=failed"), 400, "request_filter_invalid"]
  ])("returns safe JSON for invalid packet requests", async (
    input,
    expectedStatus,
    expectedError
  ) => {
    const dependencies = createDependencies();

    const response = await handleAdminQuoteRequestCrmHandoffPacketRoute(
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

    const response = await handleAdminQuoteRequestCrmHandoffPacketRoute(
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

  it("maps packet read failures to generic errors without leaking provider details", async () => {
    const dependencies = createDependencies(
      createPersistence({
        status: "unavailable"
      })
    );

    const response = await handleAdminQuoteRequestCrmHandoffPacketRoute(
      request(),
      dependencies
    );
    const body = await json(response);

    expect(response.status).toBe(503);
    expect(body).toStrictEqual({
      ok: false,
      error: "quote_crm_handoff_packet_unavailable"
    });
    expect(JSON.stringify(body)).not.toContain(env.ADMIN_TRUSTED_WORKSPACE_ID);
    expect(JSON.stringify(body)).not.toContain(adminContext.adminUserId);
    expect(JSON.stringify(body)).not.toContain("hubapi");
    expect(JSON.stringify(body)).not.toContain("token");
  });
});
