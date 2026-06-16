import { describe, expect, it } from "vitest";

import type { TrustedQuoteAdminContext } from "../admin-write/admin-quote-request-status-write";
import type { AdminQuoteRequestCrmHandoffPacket } from "./admin-quote-request-crm-handoff-packet-read";
import {
  createAdminQuoteRequestCrmHandoffPacketManifest,
  readRecentAdminQuoteRequestCrmHandoffPacketManifests
} from "./admin-quote-request-crm-handoff-packet-manifest";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type QueryCall = {
  table: string;
  insert?: unknown;
  select?: string;
  filters: Array<{
    column: string;
    value: string;
  }>;
  orders: Array<{
    column: string;
    ascending: boolean;
  }>;
  limit?: number;
};

const admin: TrustedQuoteAdminContext = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  adminUserId: "22222222-2222-4222-8222-222222222222",
  membershipId: "33333333-3333-4333-8333-333333333333",
  resolution: "server-auth-membership"
};

const packet: AdminQuoteRequestCrmHandoffPacket = {
  generatedAt: "2026-06-16T12:00:00.000Z",
  provider: "hubspot",
  localCrmSyncStatus: "queued",
  limit: 25,
  recordCount: 1,
  records: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      publicReference: "QR-20260616-QUEUED",
      createdAt: "2026-06-16T10:00:00.000Z",
      status: "reviewing",
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
};

function createMockSupabase({
  insertResult,
  selectResult
}: {
  insertResult?: QueryResult;
  selectResult?: QueryResult;
}) {
  const calls: QueryCall[] = [];
  const client = {
    from(table: string) {
      const call: QueryCall = {
        table,
        filters: [],
        orders: []
      };
      calls.push(call);

      const builder = {
        insert(value: unknown) {
          call.insert = value;
          return builder;
        },
        select(columns: string) {
          call.select = columns;
          return builder;
        },
        eq(column: string, value: string) {
          call.filters.push({
            column,
            value
          });
          return builder;
        },
        order(column: string, options?: { ascending?: boolean }) {
          call.orders.push({
            column,
            ascending: options?.ascending !== false
          });
          return builder;
        },
        limit(count: number) {
          call.limit = count;
          return Promise.resolve(selectResult ?? { data: [], error: null });
        },
        single() {
          return Promise.resolve(insertResult ?? { data: null, error: null });
        }
      };

      return builder;
    }
  };

  return {
    calls,
    supabase: {
      configured: true as const,
      client,
      missingEnv: [] as []
    }
  };
}

describe("admin CRM handoff packet manifest boundary", () => {
  it("creates a metadata-only manifest after packet generation without storing payload details", async () => {
    const { calls, supabase } = createMockSupabase({
      insertResult: {
        data: {
          id: "55555555-5555-4555-8555-555555555555",
          workspace_id: admin.workspaceId,
          provider: "hubspot",
          packet_kind: "json_review_packet",
          status_filter: "queued",
          limit_requested: 25,
          record_count: 1,
          request_ids: ["44444444-4444-4444-8444-444444444444"],
          generated_by_admin_user_id: admin.adminUserId,
          generated_at: packet.generatedAt,
          source: "protected_admin"
        },
        error: null
      }
    });

    const result = await createAdminQuoteRequestCrmHandoffPacketManifest(
      {
        admin,
        packet
      },
      {
        supabase
      }
    );

    expect(result).toStrictEqual({
      status: "created",
      manifest: {
        id: "55555555-5555-4555-8555-555555555555",
        workspaceId: admin.workspaceId,
        provider: "hubspot",
        packetKind: "json_review_packet",
        statusFilter: "queued",
        limitRequested: 25,
        recordCount: 1,
        requestIds: ["44444444-4444-4444-8444-444444444444"],
        requestIdCount: 1,
        generatedByAdminUserId: admin.adminUserId,
        generatedAt: packet.generatedAt,
        source: "protected_admin"
      }
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe("quote_crm_handoff_packet_manifests");
    expect(calls[0].select).toBe(
      "id, workspace_id, provider, packet_kind, status_filter, limit_requested, record_count, request_ids, generated_by_admin_user_id, generated_at, source"
    );
    expect(calls[0].insert).toStrictEqual({
      workspace_id: admin.workspaceId,
      provider: "hubspot",
      packet_kind: "json_review_packet",
      status_filter: "queued",
      limit_requested: 25,
      record_count: 1,
      request_ids: ["44444444-4444-4444-8444-444444444444"],
      generated_by_admin_user_id: admin.adminUserId,
      generated_at: packet.generatedAt,
      source: "protected_admin"
    });
    const serialized = JSON.stringify(calls[0].insert);
    expect(serialized).not.toContain("Maya Tan");
    expect(serialized).not.toContain("maya@example.test");
    expect(serialized).not.toContain("Please prepare");
    expect(serialized).not.toContain("crm_contact_id");
    expect(serialized).not.toContain("crm_deal_id");
    expect(serialized).not.toContain("crm_last_sync_attempt_at");
    expect(serialized).not.toContain("hubapi");
    expect(serialized).not.toContain("webhook");
  });

  it("reads recent bounded metadata-only manifests for the admin workspace", async () => {
    const { calls, supabase } = createMockSupabase({
      selectResult: {
        data: [
          {
            id: "55555555-5555-4555-8555-555555555555",
            workspace_id: admin.workspaceId,
            provider: "hubspot",
            packet_kind: "json_review_packet",
            status_filter: "queued",
            limit_requested: 25,
            record_count: 1,
            request_ids: ["44444444-4444-4444-8444-444444444444"],
            generated_by_admin_user_id: admin.adminUserId,
            generated_at: packet.generatedAt,
            source: "protected_admin"
          }
        ],
        error: null
      }
    });

    const result = await readRecentAdminQuoteRequestCrmHandoffPacketManifests(
      {
        admin,
        limit: 10
      },
      {
        supabase
      }
    );

    expect(result).toStrictEqual({
      status: "loaded",
      manifests: [
        {
          id: "55555555-5555-4555-8555-555555555555",
          workspaceId: admin.workspaceId,
          provider: "hubspot",
          packetKind: "json_review_packet",
          statusFilter: "queued",
          limitRequested: 25,
          recordCount: 1,
          requestIds: ["44444444-4444-4444-8444-444444444444"],
          requestIdCount: 1,
          generatedByAdminUserId: admin.adminUserId,
          generatedAt: packet.generatedAt,
          source: "protected_admin"
        }
      ]
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: "quote_crm_handoff_packet_manifests",
      limit: 10
    });
    expect(calls[0].filters).toContainEqual({
      column: "workspace_id",
      value: admin.workspaceId
    });
    expect(calls[0].filters).toContainEqual({
      column: "provider",
      value: "hubspot"
    });
    expect(calls[0].filters).toContainEqual({
      column: "status_filter",
      value: "queued"
    });
    expect(calls[0].orders).toContainEqual({
      column: "generated_at",
      ascending: false
    });
  });

  it("fails closed on invalid admin context, invalid limits, and persistence errors", async () => {
    const { calls, supabase } = createMockSupabase({
      insertResult: {
        data: null,
        error: new Error("sql provider token")
      }
    });

    await expect(
      createAdminQuoteRequestCrmHandoffPacketManifest(
        {
          admin: {
            ...admin,
            workspaceId: "not-a-uuid"
          },
          packet
        },
        {
          supabase
        }
      )
    ).resolves.toStrictEqual({
      status: "invalid_admin_context"
    });
    expect(calls).toHaveLength(0);

    await expect(
      readRecentAdminQuoteRequestCrmHandoffPacketManifests(
        {
          admin,
          limit: 0
        },
        {
          supabase
        }
      )
    ).resolves.toStrictEqual({
      status: "invalid_limit"
    });
    expect(calls).toHaveLength(0);

    await expect(
      createAdminQuoteRequestCrmHandoffPacketManifest(
        {
          admin,
          packet
        },
        {
          supabase
        }
      )
    ).resolves.toStrictEqual({
      status: "unavailable"
    });
    expect(JSON.stringify(calls)).not.toContain("update");
    expect(JSON.stringify(calls)).not.toContain("quote_requests");
    expect(JSON.stringify(calls)).not.toContain("synced");
  });
});
