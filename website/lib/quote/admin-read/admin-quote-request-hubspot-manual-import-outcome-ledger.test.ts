import { describe, expect, it } from "vitest";

import type { TrustedQuoteAdminContext } from "../admin-write/admin-quote-request-status-write";
import {
  adminQuoteRequestHubSpotManualImportOutcomeStatuses,
  readRecentAdminQuoteRequestHubSpotManualImportOutcomes,
  recordAdminQuoteRequestHubSpotManualImportOutcome
} from "./admin-quote-request-hubspot-manual-import-outcome-ledger";

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
const manifestId = "44444444-4444-4444-8444-444444444444";
const quoteRequestId = "55555555-5555-4555-8555-555555555555";
const outcomeId = "66666666-6666-4666-8666-666666666666";
const recordedAt = "2026-06-17T11:00:00.000Z";
const csvManifestRow = {
  id: manifestId,
  workspace_id: admin.workspaceId,
  provider: "hubspot",
  packet_kind: "hubspot_import_csv",
  status_filter: "queued",
  limit_requested: 25,
  record_count: 1,
  request_ids: [quoteRequestId],
  generated_by_admin_user_id: admin.adminUserId,
  generated_at: "2026-06-17T10:30:00.000Z",
  source: "protected_admin"
};
const outcomeRow = {
  id: outcomeId,
  workspace_id: admin.workspaceId,
  manifest_id: manifestId,
  provider: "hubspot",
  packet_kind: "hubspot_import_csv",
  outcome_status: "manual_import_completed_outside_skr",
  record_count: 1,
  request_ids: [quoteRequestId],
  recorded_by_admin_user_id: admin.adminUserId,
  recorded_at: recordedAt,
  source: "protected_admin"
};

function createMockSupabase({
  manifestResult,
  insertResult,
  recentResult
}: {
  manifestResult?: QueryResult;
  insertResult?: QueryResult;
  recentResult?: QueryResult;
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
          return Promise.resolve(recentResult ?? { data: [], error: null });
        },
        single() {
          if (call.table === "quote_crm_handoff_packet_manifests") {
            return Promise.resolve(
              manifestResult ?? { data: csvManifestRow, error: null }
            );
          }

          return Promise.resolve(
            insertResult ?? { data: outcomeRow, error: null }
          );
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

describe("admin HubSpot manual import outcome ledger helper", () => {
  it("creates a metadata-only outcome row from a safe HubSpot import CSV manifest", async () => {
    const { calls, supabase } = createMockSupabase({});

    const result = await recordAdminQuoteRequestHubSpotManualImportOutcome(
      {
        admin,
        manifestId,
        outcomeStatus: "manual_import_completed_outside_skr"
      },
      {
        recordedAt: () => recordedAt,
        supabase
      }
    );

    expect(result).toStrictEqual({
      status: "created",
      outcome: {
        id: outcomeId,
        workspaceId: admin.workspaceId,
        manifestId,
        provider: "hubspot",
        packetKind: "hubspot_import_csv",
        outcomeStatus: "manual_import_completed_outside_skr",
        recordCount: 1,
        requestIds: [quoteRequestId],
        requestIdCount: 1,
        recordedByAdminUserId: admin.adminUserId,
        recordedAt,
        source: "protected_admin"
      }
    });
    expect(calls).toHaveLength(2);
    expect(calls[0].table).toBe("quote_crm_handoff_packet_manifests");
    expect(calls[0].filters).toEqual([
      {
        column: "workspace_id",
        value: admin.workspaceId
      },
      {
        column: "id",
        value: manifestId
      },
      {
        column: "provider",
        value: "hubspot"
      },
      {
        column: "packet_kind",
        value: "hubspot_import_csv"
      },
      {
        column: "status_filter",
        value: "queued"
      }
    ]);
    expect(calls[1].table).toBe(
      "quote_crm_handoff_manual_import_outcomes"
    );
    expect(calls[1].insert).toStrictEqual({
      workspace_id: admin.workspaceId,
      manifest_id: manifestId,
      provider: "hubspot",
      packet_kind: "hubspot_import_csv",
      outcome_status: "manual_import_completed_outside_skr",
      record_count: 1,
      request_ids: [quoteRequestId],
      recorded_by_admin_user_id: admin.adminUserId,
      recorded_at: recordedAt,
      source: "protected_admin"
    });
    const serialized = JSON.stringify({
      insert: calls[1].insert,
      result
    });
    expect(serialized).not.toContain("Maya Tan");
    expect(serialized).not.toContain("maya@example.test");
    expect(serialized).not.toContain("+65 8123 4567");
    expect(serialized).not.toContain("Please prepare");
    expect(serialized).not.toContain("internalNotes");
    expect(serialized).not.toContain("authorization");
    expect(serialized).not.toContain("session");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("header");
    expect(serialized).not.toContain("crmContactId");
    expect(serialized).not.toContain("crmDealId");
    expect(serialized).not.toContain("crmLastSyncAttemptAt");
    expect(serialized).not.toContain("hubapi");
    expect(serialized).not.toContain("webhook");
  });

  it("exposes only the controlled outcome status set", () => {
    expect(adminQuoteRequestHubSpotManualImportOutcomeStatuses).toStrictEqual([
      "manual_import_reviewed",
      "manual_import_completed_outside_skr",
      "manual_import_rejected_needs_correction",
      "manual_import_partial_needs_follow_up"
    ]);
  });

  it("rejects invalid admin context, manifest IDs, unsupported statuses, provider, and packet kind", async () => {
    const { calls, supabase } = createMockSupabase({});

    await expect(
      recordAdminQuoteRequestHubSpotManualImportOutcome(
        {
          admin: {
            ...admin,
            resolution: "anonymous"
          } as unknown as TrustedQuoteAdminContext,
          manifestId,
          outcomeStatus: "manual_import_reviewed"
        },
        { supabase }
      )
    ).resolves.toStrictEqual({
      status: "invalid_admin_context"
    });
    await expect(
      recordAdminQuoteRequestHubSpotManualImportOutcome(
        {
          admin,
          manifestId: "not-a-uuid",
          outcomeStatus: "manual_import_reviewed"
        },
        { supabase }
      )
    ).resolves.toStrictEqual({
      status: "invalid_manifest_id"
    });
    await expect(
      recordAdminQuoteRequestHubSpotManualImportOutcome(
        {
          admin,
          manifestId,
          outcomeStatus: "freeform_operator_note" as never
        },
        { supabase }
      )
    ).resolves.toStrictEqual({
      status: "invalid_outcome_status"
    });
    expect(calls).toHaveLength(0);

    const nonCsv = createMockSupabase({
      manifestResult: {
        data: {
          ...csvManifestRow,
          packet_kind: "json_review_packet"
        },
        error: null
      }
    });
    await expect(
      recordAdminQuoteRequestHubSpotManualImportOutcome(
        {
          admin,
          manifestId,
          outcomeStatus: "manual_import_reviewed"
        },
        { supabase: nonCsv.supabase }
      )
    ).resolves.toStrictEqual({
      status: "invalid_manifest"
    });
    expect(nonCsv.calls).toHaveLength(1);

    const nonHubSpot = createMockSupabase({
      manifestResult: {
        data: {
          ...csvManifestRow,
          provider: "salesforce"
        },
        error: null
      }
    });
    await expect(
      recordAdminQuoteRequestHubSpotManualImportOutcome(
        {
          admin,
          manifestId,
          outcomeStatus: "manual_import_reviewed"
        },
        { supabase: nonHubSpot.supabase }
      )
    ).resolves.toStrictEqual({
      status: "invalid_manifest"
    });
    expect(nonHubSpot.calls).toHaveLength(1);
  });

  it("reads bounded recent outcomes without leaking customer, provider, auth, or CRM details", async () => {
    const { calls, supabase } = createMockSupabase({
      recentResult: {
        data: [
          {
            ...outcomeRow,
            customer_name: "Maya Tan",
            customer_email: "maya@example.test",
            customer_phone: "+65 8123 4567",
            message_details: "Please prepare a lounge setup.",
            internal_notes: "private",
            provider_token: "token-secret",
            session: "session-secret",
            header: "header-secret",
            cookie: "cookie-secret",
            crm_contact_id: "contact-secret",
            crm_deal_id: "deal-secret",
            crm_last_sync_attempt_at: "2026-06-17T12:00:00.000Z"
          }
        ],
        error: null
      }
    });

    const result = await readRecentAdminQuoteRequestHubSpotManualImportOutcomes(
      {
        admin,
        limit: 50
      },
      {
        supabase
      }
    );

    expect(result).toStrictEqual({
      status: "loaded",
      outcomes: [
        {
          id: outcomeId,
          workspaceId: admin.workspaceId,
          manifestId,
          provider: "hubspot",
          packetKind: "hubspot_import_csv",
          outcomeStatus: "manual_import_completed_outside_skr",
          recordCount: 1,
          requestIds: [quoteRequestId],
          requestIdCount: 1,
          recordedByAdminUserId: admin.adminUserId,
          recordedAt,
          source: "protected_admin"
        }
      ]
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe(
      "quote_crm_handoff_manual_import_outcomes"
    );
    expect(calls[0].filters).toContainEqual({
      column: "workspace_id",
      value: admin.workspaceId
    });
    expect(calls[0].filters).toContainEqual({
      column: "provider",
      value: "hubspot"
    });
    expect(calls[0].filters).toContainEqual({
      column: "packet_kind",
      value: "hubspot_import_csv"
    });
    expect(calls[0].orders).toContainEqual({
      column: "recorded_at",
      ascending: false
    });
    expect(calls[0].limit).toBe(10);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("Maya Tan");
    expect(serialized).not.toContain("maya@example.test");
    expect(serialized).not.toContain("+65 8123 4567");
    expect(serialized).not.toContain("Please prepare");
    expect(serialized).not.toContain("internal");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("session");
    expect(serialized).not.toContain("header");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("crm_contact");
    expect(serialized).not.toContain("crm_deal");
    expect(serialized).not.toContain("sync_attempt");
  });
});
