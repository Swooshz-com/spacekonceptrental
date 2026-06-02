import { describe, expect, it } from "vitest";

import { resolveAdminProductDashboardRead } from "./admin-product-dashboard-read";

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

describe("admin product dashboard read boundary", () => {
  it("reads categories, products, and image metadata with the trusted workspace filter", async () => {
    const { calls, supabase } = createMockSupabase({
      categories: {
        data: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            slug: "lounge",
            name: "Lounge",
            description: "Soft seating",
            sort_order: 20,
            is_published: true
          }
        ],
        error: null
      },
      products: {
        data: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            category_id: "11111111-1111-4111-8111-111111111111",
            slug: "modular-lounge",
            name: "Modular Lounge",
            short_description: "Low modular lounge set",
            rental_unit: "set",
            status: "draft",
            sort_order: 10
          }
        ],
        error: null
      },
      product_images: {
        data: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            product_id: "22222222-2222-4222-8222-222222222222",
            alt_text: "Lounge set",
            sort_order: 1,
            is_primary: true,
            status: "active"
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            product_id: "22222222-2222-4222-8222-222222222222",
            alt_text: "Detail view",
            sort_order: 2,
            is_primary: false,
            status: "archived"
          }
        ],
        error: null
      }
    });

    await expect(
      resolveAdminProductDashboardRead({
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toEqual({
      status: "loaded",
      data: {
        categories: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            slug: "lounge",
            name: "Lounge",
            description: "Soft seating",
            sortOrder: 20,
            isPublished: true,
            productCount: 1
          }
        ],
        products: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            categoryId: "11111111-1111-4111-8111-111111111111",
            slug: "modular-lounge",
            name: "Modular Lounge",
            shortDescription: "Low modular lounge set",
            rentalUnit: "set",
            status: "draft",
            sortOrder: 10,
            imageCount: 2,
            primaryImageAltText: "Lounge set"
          }
        ],
        imageSummary: {
          totalImages: 2,
          activeImages: 1,
          primaryImages: 1
        }
      }
    });

    expect(calls.map((call) => call.table)).toEqual([
      "categories",
      "products",
      "product_images"
    ]);
    for (const call of calls) {
      expect(call.filters).toContainEqual({
        column: "workspace_id",
        value: "99999999-9999-4999-8999-999999999999"
      });
    }
  });

  it("fails closed when the session-bound admin read client is unavailable", async () => {
    await expect(
      resolveAdminProductDashboardRead({
        supabase: {
          configured: false,
          client: null,
          reason: "authenticated_admin_read_client_required"
        },
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toEqual({
      status: "unavailable"
    });
  });

  it("fails closed when the trusted workspace is missing or malformed", async () => {
    const { supabase } = createMockSupabase({});

    await expect(
      resolveAdminProductDashboardRead({
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: "not-a-workspace-id"
        }
      })
    ).resolves.toEqual({
      status: "unavailable"
    });
  });

  it("fails closed on provider errors or malformed rows", async () => {
    const providerError = createMockSupabase({
      categories: {
        data: null,
        error: new Error("sql stack")
      }
    });
    const malformedRows = createMockSupabase({
      categories: {
        data: [
          {
            id: "not-a-uuid",
            slug: "lounge",
            name: "Lounge",
            sort_order: 20,
            is_published: true
          }
        ],
        error: null
      },
      products: {
        data: [],
        error: null
      },
      product_images: {
        data: [],
        error: null
      }
    });

    await expect(
      resolveAdminProductDashboardRead({
        supabase: providerError.supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toEqual({
      status: "unavailable"
    });
    await expect(
      resolveAdminProductDashboardRead({
        supabase: malformedRows.supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    ).resolves.toEqual({
      status: "unavailable"
    });
  });
});
