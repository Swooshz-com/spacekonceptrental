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
  ranges?: Array<{ from: number; to: number }>;
};

function createMockSupabase(results: Record<string, QueryResult>) {
  const calls: QueryCall[] = [];
  const client = {
    from(table: string) {
      const call: QueryCall = {
        table,
        filters: [],
        orders: [],
        ranges: []
      };
      calls.push(call);

      function page(from: number, to: number) {
        const result = results[table] ?? { data: [], error: null };
        return Array.isArray(result.data)
          ? { ...result, data: result.data.slice(from, to + 1) }
          : result;
      }

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
          return Promise.resolve(page(0, count - 1));
        },
        range(from: number, to: number) {
          call.ranges?.push({ from, to });
          return Promise.resolve(page(from, to));
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
            description: "Existing full modular lounge listing description.",
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
            storage_bucket: "catalogue-metadata",
            storage_path: "fixtures/lounge-main.jpg",
            sort_order: 1,
            is_primary: true,
            status: "active"
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            product_id: "22222222-2222-4222-8222-222222222222",
            alt_text: "Detail view",
            storage_bucket: "catalogue-metadata",
            storage_path: "fixtures/lounge-detail.jpg",
            sort_order: 2,
            is_primary: false,
            status: "archived"
          }
        ],
        error: null
      },
      setup_recipes: {
        data: [
          {
            setup_product_id: "22222222-2222-4222-8222-222222222222"
          }
        ],
        error: null
      },
      setup_recipe_items: {
        data: [
          {
            included_product_id: "55555555-5555-4555-8555-555555555555"
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
            productCount: 1,
            publishedProductCount: 0
          }
        ],
        products: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            categoryId: "11111111-1111-4111-8111-111111111111",
            slug: "modular-lounge",
            name: "Modular Lounge",
            shortDescription: "Low modular lounge set",
            description: "Existing full modular lounge listing description.",
            rentalUnit: "set",
            status: "draft",
            sortOrder: 10,
            imageCount: 2,
            primaryImageAltText: "Lounge set"
          }
        ],
        setupRecipeProductIds: [
          "22222222-2222-4222-8222-222222222222"
        ],
        setupRecipeChildProductIds: [
          "55555555-5555-4555-8555-555555555555"
        ],
        images: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            productId: "22222222-2222-4222-8222-222222222222",
            storageBucket: "catalogue-metadata",
            storagePath: "fixtures/lounge-main.jpg",
            altText: "Lounge set",
            sortOrder: 1,
            isPrimary: true,
            status: "active"
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            productId: "22222222-2222-4222-8222-222222222222",
            storageBucket: "catalogue-metadata",
            storagePath: "fixtures/lounge-detail.jpg",
            altText: "Detail view",
            sortOrder: 2,
            isPrimary: false,
            status: "archived"
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
      "product_images",
      "setup_recipes",
      "setup_recipe_items"
    ]);
    for (const call of calls) {
      expect(call.filters).toContainEqual({
        column: "workspace_id",
        value: "99999999-9999-4999-8999-999999999999"
      });
    }
    expect(calls.find((call) => call.table === "products")?.select).toContain(
      "description"
    );
    expect(calls.find((call) => call.table === "product_images")?.select).toContain(
      "storage_bucket"
    );
    expect(calls.find((call) => call.table === "product_images")?.select).toContain(
      "storage_path"
    );
  });

  it("only exposes primary image alt text from active primary image metadata", async () => {
    const { supabase } = createMockSupabase({
      categories: {
        data: [],
        error: null
      },
      products: {
        data: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            slug: "active-primary",
            name: "Active Primary",
            rental_unit: "set",
            status: "published",
            sort_order: 10
          },
          {
            id: "55555555-5555-4555-8555-555555555555",
            slug: "archived-primary",
            name: "Archived Primary",
            rental_unit: "set",
            status: "published",
            sort_order: 20
          }
        ],
        error: null
      },
      product_images: {
        data: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            product_id: "22222222-2222-4222-8222-222222222222",
            alt_text: "Active public primary",
            storage_bucket: "catalogue-metadata",
            storage_path: "fixtures/active-primary.jpg",
            sort_order: 1,
            is_primary: true,
            status: "active"
          },
          {
            id: "66666666-6666-4666-8666-666666666666",
            product_id: "55555555-5555-4555-8555-555555555555",
            alt_text: "Archived primary should stay hidden",
            storage_bucket: "catalogue-metadata",
            storage_path: "fixtures/archived-primary.jpg",
            sort_order: 2,
            is_primary: true,
            status: "archived"
          }
        ],
        error: null
      }
    });

    const result = await resolveAdminProductDashboardRead({
      supabase,
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: "99999999-9999-4999-8999-999999999999"
      }
    });

    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") {
      return;
    }

    const activePrimary = result.data.products.find(
      (product) => product.slug === "active-primary"
    );
    const archivedPrimary = result.data.products.find(
      (product) => product.slug === "archived-primary"
    );

    expect(activePrimary).toMatchObject({
      imageCount: 1,
      primaryImageAltText: "Active public primary"
    });
    expect(archivedPrimary).toMatchObject({
      imageCount: 1
    });
    expect(archivedPrimary).not.toHaveProperty("primaryImageAltText");
  });

  it("uses one deterministic total order for tied duplicate-name products", async () => {
    const products = [
      {
        id: "55555555-5555-4555-8555-555555555555",
        slug: "twin-z",
        name: "Twin Name",
        rental_unit: "item",
        status: "draft",
        sort_order: 10
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        slug: "twin-a",
        name: " twin name ",
        rental_unit: "item",
        status: "draft",
        sort_order: 10
      }
    ];

    async function read(shuffledProducts: typeof products) {
      const { supabase } = createMockSupabase({
        categories: { data: [], error: null },
        products: { data: shuffledProducts, error: null },
        product_images: { data: [], error: null },
        setup_recipes: { data: [], error: null }
      });
      const result = await resolveAdminProductDashboardRead({
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID:
            "99999999-9999-4999-8999-999999999999"
        }
      });
      if (result.status !== "loaded") throw new Error("dashboard unavailable");
      return result.data.products.map((product) => product.slug);
    }

    await expect(read(products)).resolves.toEqual(["twin-a", "twin-z"]);
    await expect(read([...products].reverse())).resolves.toEqual(["twin-a", "twin-z"]);
  });

  it("aligns the database query tie-breakers with the in-memory product order", async () => {
    const { calls, supabase } = createMockSupabase({
      categories: { data: [], error: null },
      products: {
        data: [{
          id: "22222222-2222-4222-8222-222222222222",
          slug: "one",
          name: "One",
          rental_unit: "item",
          status: "draft",
          sort_order: 10
        }],
        error: null
      },
      product_images: { data: [], error: null },
      setup_recipes: { data: [], error: null }
    });

    await resolveAdminProductDashboardRead({
      supabase,
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID:
          "99999999-9999-4999-8999-999999999999"
      }
    });

    expect(calls.find((call) => call.table === "products")?.orders).toEqual([
      { column: "sort_order", ascending: true },
      { column: "name", ascending: true },
      { column: "slug", ascending: true },
      { column: "id", ascending: true }
    ]);
  });

  it("discovers every recipe parent beyond the first 500 rows", async () => {
    const recipeRows = Array.from({ length: 501 }, (_, index) => ({
      setup_product_id: `22222222-2222-4222-8222-${String(index + 1).padStart(12, "0")}`
    }));
    const productRows = recipeRows.map((row, index) => ({
      id: row.setup_product_id,
      slug: `published-parent-${index}`,
      name: `Published Parent ${index}`,
      status: "published",
      sort_order: index
    }));
    const { supabase, calls } = createMockSupabase({
      categories: { data: [], error: null },
      products: { data: productRows, error: null },
      product_images: { data: [], error: null },
      setup_recipes: { data: recipeRows, error: null }
    });

    const result = await resolveAdminProductDashboardRead({
      supabase,
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID:
          "99999999-9999-4999-8999-999999999999"
      }
    });

    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;
    expect(result.data.setupRecipeProductIds).toHaveLength(501);
    expect(result.data.setupRecipeProductIds.at(-1)).toBe(recipeRows.at(-1)?.setup_product_id);
    expect(calls.filter((call) => call.table === "setup_recipes").flatMap((call) => call.ranges ?? [])).toEqual([
      { from: 0, to: 499 },
      { from: 500, to: 999 }
    ]);
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
