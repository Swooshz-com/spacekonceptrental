import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveAdminQuoteRequestDetailRead } from "./admin-quote-request-detail-read";

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

function createMockSupabase(results: Record<string, QueryResult>) {
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
          return Promise.resolve(
            results[table] ?? {
              data: [],
              error: null
            }
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

describe("admin quote request detail read boundary", () => {
  it("reads exactly one quote request detail scoped to the trusted workspace", async () => {
    const quoteRequestId = "11111111-1111-4111-8111-111111111111";
    const workspaceId = "99999999-9999-4999-8999-999999999999";
    const { calls, supabase } = createMockSupabase({
      quote_requests: {
        data: [
          {
            id: quoteRequestId,
            public_reference: "QR-20260603-NEWEST",
            customer_name: "Maya Tan",
            customer_email: "maya@example.test",
            customer_phone: "+65 8123 4567",
            customer_message:
              "Please recommend a warm lounge setup for a corporate reception.",
            event_date: "2026-06-20",
            venue: "Marina Bay Sands",
            status: "reviewing",
            source: "website",
            source_page_path: "/quote?listing=modular-lounge-set",
            source_listing_slug: "modular-lounge-set",
            crm_provider: "hubspot",
            crm_sync_status: "not_queued",
            crm_contact_id: "future-contact-123",
            crm_deal_id: "future-deal-456",
            created_at: "2026-06-03T10:30:00.000Z",
            updated_at: "2026-06-03T10:40:00.000Z"
          }
        ],
        error: null
      },
      quote_request_items: {
        data: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            quote_request_id: quoteRequestId,
            product_name_snapshot: "Modular lounge set",
            quantity: 2,
            notes: "Place sofas near the registration zone.",
            created_at: "2026-06-03T10:31:00.000Z"
          }
        ],
        error: null
      },
      quote_request_activity: {
        data: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            quote_request_id: quoteRequestId,
            activity_type: "internal_note",
            status_from: null,
            status_to: null,
            note: "Call Maya about sofa quantities.",
            created_at: "2026-06-03T10:40:00.000Z"
          }
        ],
        error: null
      }
    });

    await expect(
      resolveAdminQuoteRequestDetailRead({
        quoteRequestId,
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: workspaceId
        }
      })
    ).resolves.toEqual({
      status: "loaded",
      data: {
        quoteRequest: {
          id: quoteRequestId,
          publicReference: "QR-20260603-NEWEST",
          customerName: "Maya Tan",
          customerEmail: "maya@example.test",
          customerPhone: "+65 8123 4567",
          customerMessage:
            "Please recommend a warm lounge setup for a corporate reception.",
          eventDate: "2026-06-20",
          venue: "Marina Bay Sands",
          status: "reviewing",
          source: "website",
          sourcePagePath: "/quote?listing=modular-lounge-set",
          sourceListingSlug: "modular-lounge-set",
          crmProvider: "hubspot",
          crmSyncStatus: "not_queued",
          crmContactId: "future-contact-123",
          crmDealId: "future-deal-456",
          createdAt: "2026-06-03T10:30:00.000Z",
          updatedAt: "2026-06-03T10:40:00.000Z",
          items: [
            {
              id: "33333333-3333-4333-8333-333333333333",
              quoteRequestId,
              productNameSnapshot: "Modular lounge set",
              quantity: 2,
              notes: "Place sofas near the registration zone.",
              createdAt: "2026-06-03T10:31:00.000Z"
            }
          ],
          activity: [
            {
              id: "44444444-4444-4444-8444-444444444444",
              quoteRequestId,
              activityType: "internal_note",
              note: "Call Maya about sofa quantities.",
              createdAt: "2026-06-03T10:40:00.000Z"
            }
          ]
        }
      }
    });

    expect(calls[0]).toMatchObject({
      table: "quote_requests",
      limit: 1
    });
    expect(calls[0].select).toContain("customer_message");
    expect(calls[0].select).toContain("source_page_path");
    expect(calls[0].select).toContain("source_listing_slug");
    expect(calls[0].select).toContain("crm_provider");
    expect(calls[0].select).toContain("crm_sync_status");
    expect(calls[0].select).toContain("crm_contact_id");
    expect(calls[0].select).toContain("crm_deal_id");
    expect(calls[0].filters).toEqual([
      {
        column: "workspace_id",
        value: workspaceId
      },
      {
        column: "id",
        value: quoteRequestId
      }
    ]);
    expect(calls[1].filters).toContainEqual({
      column: "quote_request_id",
      value: quoteRequestId
    });
    expect(calls[2].filters).toContainEqual({
      column: "quote_request_id",
      value: quoteRequestId
    });
  });

  it("returns not_found without reading child rows when the quote request is missing", async () => {
    const { calls, supabase } = createMockSupabase({
      quote_requests: {
        data: [],
        error: null
      }
    });

    await expect(
      resolveAdminQuoteRequestDetailRead({
        quoteRequestId: "11111111-1111-4111-8111-111111111111",
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toEqual({
      status: "not_found"
    });
    expect(calls).toHaveLength(1);
  });

  it("fails closed for invalid IDs, missing workspace, and provider errors", async () => {
    const invalid = createMockSupabase({});

    await expect(
      resolveAdminQuoteRequestDetailRead({
        quoteRequestId: "not-a-quote-id",
        supabase: invalid.supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toEqual({
      status: "unavailable"
    });
    expect(invalid.calls).toEqual([]);

    const missingWorkspace = createMockSupabase({});

    await expect(
      resolveAdminQuoteRequestDetailRead({
        quoteRequestId: "11111111-1111-4111-8111-111111111111",
        supabase: missingWorkspace.supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: "not-a-workspace"
        }
      })
    ).resolves.toEqual({
      status: "unavailable"
    });
    expect(missingWorkspace.calls).toEqual([]);

    const providerError = createMockSupabase({
      quote_requests: {
        data: null,
        error: new Error("sql failed for maya@example.test")
      }
    });
    const result = await resolveAdminQuoteRequestDetailRead({
      quoteRequestId: "11111111-1111-4111-8111-111111111111",
      supabase: providerError.supabase,
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID:
          "99999999-9999-4999-8999-999999999999"
      }
    });

    expect(result).toEqual({
      status: "unavailable"
    });
    expect(JSON.stringify(result)).not.toContain("sql");
    expect(JSON.stringify(result)).not.toContain("maya@example.test");
  });

  it("keeps the production admin quote detail read boundary server-only", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "lib/quote/admin-read/admin-quote-request-detail-read.ts"
      ),
      "utf8"
    );

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).toContain('from("quote_requests")');
    expect(source).toContain('from("quote_request_items")');
    expect(source).toContain('from("quote_request_activity")');
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
  });
});
