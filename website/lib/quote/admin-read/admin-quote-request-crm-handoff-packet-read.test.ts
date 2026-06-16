import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveAdminQuoteRequestCrmHandoffPacketRead } from "./admin-quote-request-crm-handoff-packet-read";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type QueryCall = {
  table: string;
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

function createMockSupabase(result: QueryResult) {
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
        select(columns: string) {
          call.select = columns;
          return builder;
        },
        eq(column: string, value: string) {
          call.filters.push({ column, value });
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
          return Promise.resolve(result);
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

function readTrackedFiles(paths: string[]) {
  return execFileSync("git", ["ls-files", "--", ...paths], {
    cwd: resolve(process.cwd(), ".."),
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

describe("admin CRM handoff packet read boundary", () => {
  it("generates a bounded newest-first JSON packet for queued HubSpot handoff records", async () => {
    const { calls, supabase } = createMockSupabase({
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          public_reference: "QR-20260616-NEWEST",
          customer_name: "Maya Tan",
          customer_email: "maya@example.test",
          customer_phone: "+65 8123 4567",
          customer_message: "Please prepare a lounge setup.\nVIP area.",
          event_date: "2026-06-20",
          venue: "Marina Bay Sands",
          status: "reviewing",
          source_page_path: "/quote?listing=modular-lounge-set",
          source_listing_slug: "modular-lounge-set",
          crm_provider: "hubspot",
          crm_sync_status: "queued",
          crm_contact_id: "should-not-export",
          crm_deal_id: "should-not-export",
          crm_last_sync_attempt_at: "2026-06-16T01:00:00.000Z",
          crm_sync_error: "should-not-export",
          created_at: "2026-06-16T10:30:00.000Z",
          updated_at: "2026-06-16T11:00:00.000Z"
        }
      ],
      error: null
    });

    await expect(
      resolveAdminQuoteRequestCrmHandoffPacketRead({
        supabase,
        generatedAt: "2026-06-16T12:00:00.000Z",
        limit: 10,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toStrictEqual({
      status: "loaded",
      packet: {
        generatedAt: "2026-06-16T12:00:00.000Z",
        provider: "hubspot",
        localCrmSyncStatus: "queued",
        limit: 10,
        recordCount: 1,
        records: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            publicReference: "QR-20260616-NEWEST",
            createdAt: "2026-06-16T10:30:00.000Z",
            status: "reviewing",
            customerName: "Maya Tan",
            customerEmail: "maya@example.test",
            customerPhone: "+65 8123 4567",
            companyOrEventOrganisation: "Marina Bay Sands",
            messageDetails: "Please prepare a lounge setup.\nVIP area.",
            sourcePagePath: "/quote?listing=modular-lounge-set",
            sourceListingSlug: "modular-lounge-set",
            futureProvider: "hubspot",
            localCrmSyncStatus: "queued"
          }
        ]
      }
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: "quote_requests",
      limit: 10
    });
    expect(calls[0].select).toBe(
      "id, public_reference, customer_name, customer_email, customer_phone, customer_message, event_date, venue, status, source_page_path, source_listing_slug, crm_provider, crm_sync_status, created_at"
    );
    expect(calls[0].filters).toContainEqual({
      column: "workspace_id",
      value: "99999999-9999-4999-8999-999999999999"
    });
    expect(calls[0].filters).toContainEqual({
      column: "crm_provider",
      value: "hubspot"
    });
    expect(calls[0].filters).toContainEqual({
      column: "crm_sync_status",
      value: "queued"
    });
    expect(calls[0].orders).toContainEqual({
      column: "created_at",
      ascending: false
    });
  });

  it("rejects invalid limits and caps export review packets at the safe maximum", async () => {
    const { calls, supabase } = createMockSupabase({
      data: [],
      error: null
    });

    await expect(
      resolveAdminQuoteRequestCrmHandoffPacketRead({
        supabase,
        generatedAt: "2026-06-16T12:00:00.000Z",
        limit: 0,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toStrictEqual({
      status: "invalid_limit"
    });

    await expect(
      resolveAdminQuoteRequestCrmHandoffPacketRead({
        supabase,
        generatedAt: "2026-06-16T12:00:00.000Z",
        limit: 500,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toMatchObject({
      status: "loaded",
      packet: {
        limit: 100
      }
    });
    expect(calls.at(-1)?.limit).toBe(100);
  });

  it("excludes malformed and non-queued rows by default after the database filter", async () => {
    const { supabase } = createMockSupabase({
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          public_reference: "QR-QUEUED",
          customer_name: "Maya Tan",
          status: "new",
          crm_provider: "hubspot",
          crm_sync_status: "queued",
          created_at: "2026-06-16T10:30:00.000Z"
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          public_reference: "QR-NOT-QUEUED",
          customer_name: "Ravi Lim",
          status: "new",
          crm_provider: "hubspot",
          crm_sync_status: "not_queued",
          created_at: "2026-06-16T10:20:00.000Z"
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          public_reference: "QR-FAILED",
          status: "new",
          crm_provider: "hubspot",
          crm_sync_status: "failed",
          created_at: "2026-06-16T10:10:00.000Z"
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          public_reference: "QR-SYNCED",
          status: "new",
          crm_provider: "hubspot",
          crm_sync_status: "synced",
          created_at: "2026-06-16T10:00:00.000Z"
        }
      ],
      error: null
    });

    const result = await resolveAdminQuoteRequestCrmHandoffPacketRead({
      supabase,
      generatedAt: "2026-06-16T12:00:00.000Z",
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: "99999999-9999-4999-8999-999999999999"
      }
    });

    expect(result.status).toBe("loaded");
    expect(result.status === "loaded" ? result.packet.records : []).toEqual([
      expect.objectContaining({
        publicReference: "QR-QUEUED",
        localCrmSyncStatus: "queued"
      })
    ]);
  });

  it("keeps the JSON packet allowlisted and does not expose writable provider fields", async () => {
    const { supabase } = createMockSupabase({
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          public_reference: "QR-QUEUED",
          customer_name: "Maya Tan",
          customer_email: "maya@example.test",
          customer_phone: "+65 8123 4567",
          customer_message: "x".repeat(5000),
          venue: "Marina Bay Sands",
          status: "new",
          crm_provider: "hubspot",
          crm_sync_status: "queued",
          crm_contact_id: "contact-id",
          crm_deal_id: "deal-id",
          crm_last_sync_attempt_at: "timestamp",
          crm_sync_error: "provider secret",
          raw_headers: {
            cookie: "session"
          },
          created_at: "2026-06-16T10:30:00.000Z"
        }
      ],
      error: null
    });

    const result = await resolveAdminQuoteRequestCrmHandoffPacketRead({
      supabase,
      generatedAt: "2026-06-16T12:00:00.000Z",
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: "99999999-9999-4999-8999-999999999999"
      }
    });

    expect(result.status).toBe("loaded");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("contact-id");
    expect(serialized).not.toContain("deal-id");
    expect(serialized).not.toContain("timestamp");
    expect(serialized).not.toContain("provider secret");
    expect(serialized).not.toContain("raw_headers");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("SUPABASE_" + "SERVICE_ROLE");
    expect(serialized).not.toContain("NEXT_PUBLIC_" + "SUPABASE");
    expect(result.status === "loaded" ? result.packet.records[0].messageDetails?.length : 0).toBeLessThanOrEqual(1000);
  });

  it("returns safe unavailable states without mutating records or setting sync fields", async () => {
    const { calls, supabase } = createMockSupabase({
      data: null,
      error: new Error("sql token stack workspace-secret")
    });

    const result = await resolveAdminQuoteRequestCrmHandoffPacketRead({
      supabase,
      generatedAt: "2026-06-16T12:00:00.000Z",
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: "99999999-9999-4999-8999-999999999999"
      }
    });

    expect(result).toStrictEqual({
      status: "unavailable"
    });
    expect(JSON.stringify(result)).not.toContain("sql");
    expect(JSON.stringify(result)).not.toContain("token");
    expect(JSON.stringify(calls)).not.toContain("update");
    expect(JSON.stringify(calls)).not.toContain("insert");
    expect(JSON.stringify(calls)).not.toContain("crm_last_sync_attempt_at");
    expect(JSON.stringify(calls)).not.toContain("synced");
  });

  it("keeps packet generation server-only and separate from public routes", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "lib/quote/admin-read/admin-quote-request-crm-handoff-packet-read.ts"
      ),
      "utf8"
    );
    const publicSources = readTrackedFiles([
      "website/app/api/quote",
      "website/app/quote",
      "website/components/QuoteRequestForm.tsx"
    ])
      .map((filePath) => readFileSync(resolve(process.cwd(), "..", filePath), "utf8"))
      .join("\n");

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).not.toContain("hubapi");
    expect(source).not.toContain("hubspot/api-client");
    expect(source).not.toContain(`N8N_CHAT_${"WEBHOOK_URL"}`);
    expect(source).not.toContain("new " + "Resend");
    expect(source).not.toContain("crm_contact_id:");
    expect(source).not.toContain("crm_deal_id:");
    expect(source).not.toContain("crm_last_sync_attempt_at:");
    expect(publicSources).not.toContain(
      "admin-quote-request-crm-handoff-packet-read"
    );
  });
});
