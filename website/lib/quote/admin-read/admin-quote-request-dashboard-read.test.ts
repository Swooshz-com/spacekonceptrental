import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveAdminQuoteRequestInboxRead } from "./admin-quote-request-dashboard-read";

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
  inFilters: Array<{
    column: string;
    values: string[];
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
        inFilters: [],
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
        in(column: string, values: string[]) {
          call.inFilters.push({ column, values });
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

function readTrackedFiles(paths: string[]) {
  return execFileSync("git", ["ls-files", "--", ...paths], {
    cwd: resolve(process.cwd(), ".."),
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

describe("admin quote request inbox read boundary", () => {
  it("reads recent quote requests scoped to the trusted workspace newest first", async () => {
    const { calls, supabase } = createMockSupabase({
      quote_requests: {
        data: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            public_reference: "QR-20260603-NEWEST",
            customer_name: "Maya Tan",
            customer_email: "maya@example.test",
            customer_phone: "+65 8123 4567",
            event_date: "2026-06-20",
            venue: "Marina Bay Sands",
            status: "new",
            source: "website",
            created_at: "2026-06-03T10:30:00.000Z"
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            public_reference: "QR-20260602-OLDER",
            customer_name: "Ravi Lim",
            customer_email: null,
            customer_phone: null,
            event_date: null,
            venue: "TBC",
            status: "reviewing",
            source: "chat",
            created_at: "2026-06-02T10:30:00.000Z"
          }
        ],
        error: null
      },
      quote_request_items: {
        data: [],
        error: null
      }
    });

    await expect(
      resolveAdminQuoteRequestInboxRead({
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toEqual({
      status: "loaded",
      data: {
        quoteRequests: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            publicReference: "QR-20260603-NEWEST",
            customerName: "Maya Tan",
            customerEmail: "maya@example.test",
            customerPhone: "+65 8123 4567",
            eventDate: "2026-06-20",
            venue: "Marina Bay Sands",
            status: "new",
            source: "website",
            createdAt: "2026-06-03T10:30:00.000Z",
            items: [],
            activity: []
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            publicReference: "QR-20260602-OLDER",
            customerName: "Ravi Lim",
            customerEmail: undefined,
            customerPhone: undefined,
            eventDate: undefined,
            venue: "TBC",
            status: "reviewing",
            source: "chat",
            createdAt: "2026-06-02T10:30:00.000Z",
            items: [],
            activity: []
          }
        ]
      }
    });

    expect(calls[0]).toMatchObject({
      table: "quote_requests",
      limit: 25
    });
    expect(calls[0].filters).toContainEqual({
      column: "workspace_id",
      value: "99999999-9999-4999-8999-999999999999"
    });
    expect(calls[0].orders).toContainEqual({
      column: "created_at",
      ascending: false
    });
  });

  it("includes quote request items for the loaded requests when available", async () => {
    const { calls, supabase } = createMockSupabase({
      quote_requests: {
        data: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            public_reference: "QR-20260603-NEWEST",
            customer_name: "Maya Tan",
            status: "new",
            source: "website",
            created_at: "2026-06-03T10:30:00.000Z"
          }
        ],
        error: null
      },
      quote_request_items: {
        data: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            quote_request_id: "11111111-1111-4111-8111-111111111111",
            product_name_snapshot: "Modular lounge set",
            quantity: 2,
            notes: "VIP reception area",
            created_at: "2026-06-03T10:31:00.000Z"
          }
        ],
        error: null
      }
    });

    await expect(
      resolveAdminQuoteRequestInboxRead({
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toEqual({
      status: "loaded",
      data: {
        quoteRequests: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            publicReference: "QR-20260603-NEWEST",
            customerName: "Maya Tan",
            customerEmail: undefined,
            customerPhone: undefined,
            eventDate: undefined,
            venue: undefined,
            status: "new",
            source: "website",
            createdAt: "2026-06-03T10:30:00.000Z",
            items: [
              {
                id: "33333333-3333-4333-8333-333333333333",
                quoteRequestId: "11111111-1111-4111-8111-111111111111",
                productNameSnapshot: "Modular lounge set",
                quantity: 2,
                notes: "VIP reception area",
                createdAt: "2026-06-03T10:31:00.000Z"
              }
            ],
            activity: []
          }
        ]
      }
    });

    expect(calls[1]).toMatchObject({
      table: "quote_request_items",
      limit: 250
    });
    expect(calls[1].filters).toContainEqual({
      column: "workspace_id",
      value: "99999999-9999-4999-8999-999999999999"
    });
    expect(calls[1].inFilters).toContainEqual({
      column: "quote_request_id",
      values: ["11111111-1111-4111-8111-111111111111"]
    });
  });

  it("includes internal quote activity for loaded requests and keeps it workspace-scoped", async () => {
    const { calls, supabase } = createMockSupabase({
      quote_requests: {
        data: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            public_reference: "QR-20260603-NEWEST",
            customer_name: "Maya Tan",
            status: "reviewing",
            source: "website",
            created_at: "2026-06-03T10:30:00.000Z"
          }
        ],
        error: null
      },
      quote_request_items: {
        data: [],
        error: null
      },
      quote_request_activity: {
        data: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            quote_request_id: "11111111-1111-4111-8111-111111111111",
            activity_type: "internal_note",
            status_from: null,
            status_to: null,
            note: "Call Maya about sofa quantities.",
            created_at: "2026-06-03T10:40:00.000Z"
          },
          {
            id: "55555555-5555-4555-8555-555555555555",
            quote_request_id: "11111111-1111-4111-8111-111111111111",
            activity_type: "status_change",
            status_from: "new",
            status_to: "reviewing",
            note: null,
            created_at: "2026-06-03T10:35:00.000Z"
          }
        ],
        error: null
      }
    });

    await expect(
      resolveAdminQuoteRequestInboxRead({
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toEqual({
      status: "loaded",
      data: {
        quoteRequests: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            publicReference: "QR-20260603-NEWEST",
            customerName: "Maya Tan",
            status: "reviewing",
            source: "website",
            createdAt: "2026-06-03T10:30:00.000Z",
            items: [],
            activity: [
              {
                id: "44444444-4444-4444-8444-444444444444",
                quoteRequestId: "11111111-1111-4111-8111-111111111111",
                activityType: "internal_note",
                note: "Call Maya about sofa quantities.",
                createdAt: "2026-06-03T10:40:00.000Z"
              },
              {
                id: "55555555-5555-4555-8555-555555555555",
                quoteRequestId: "11111111-1111-4111-8111-111111111111",
                activityType: "status_change",
                statusFrom: "new",
                statusTo: "reviewing",
                createdAt: "2026-06-03T10:35:00.000Z"
              }
            ]
          }
        ]
      }
    });

    expect(calls[2]).toMatchObject({
      table: "quote_request_activity",
      limit: 250
    });
    expect(calls[2].filters).toContainEqual({
      column: "workspace_id",
      value: "99999999-9999-4999-8999-999999999999"
    });
    expect(calls[2].inFilters).toContainEqual({
      column: "quote_request_id",
      values: ["11111111-1111-4111-8111-111111111111"]
    });
  });

  it("does not query without a trusted workspace ID", async () => {
    const { calls, supabase } = createMockSupabase({});

    await expect(
      resolveAdminQuoteRequestInboxRead({
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: "not-a-workspace"
        }
      })
    ).resolves.toEqual({
      status: "unavailable"
    });
    expect(calls).toEqual([]);
  });

  it("maps provider errors to a generic unavailable result", async () => {
    const { supabase } = createMockSupabase({
      quote_requests: {
        data: null,
        error: new Error("sql failed for maya@example.test")
      }
    });

    const result = await resolveAdminQuoteRequestInboxRead({
      supabase,
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

  it("keeps the production admin quote read boundary server-only and out of public routes", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "lib/quote/admin-read/admin-quote-request-dashboard-read.ts"
      ),
      "utf8"
    );
    const publicAppSources = readTrackedFiles([
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/api/quote"
    ])
      .map((filePath) =>
        readFileSync(resolve(process.cwd(), "..", filePath), "utf8")
      )
      .join("\n");

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).toContain('from("quote_requests")');
    expect(source).toContain('from("quote_request_items")');
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(publicAppSources).not.toContain("admin-quote-request-dashboard-read");
  });
});
