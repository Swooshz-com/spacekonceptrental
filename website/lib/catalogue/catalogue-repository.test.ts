import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getPublicCatalogue,
  getPublicProductBySlug
} from "./catalogue-repository";

type QueryFilter = {
  column: string;
  value: unknown;
};

type QueryOrder = {
  column: string;
  options?: unknown;
};

type QueryCall = {
  table: string;
  select?: string;
  filters: QueryFilter[];
  orders: QueryOrder[];
  maybeSingle: boolean;
};

const workspaceA = "11111111-1111-4111-8111-111111111111";
const workspaceB = "22222222-2222-4222-8222-222222222222";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function applyFilters(data: unknown, filters: QueryFilter[]) {
  if (!Array.isArray(data)) {
    return data;
  }

  return data.filter((row) =>
    isRecord(row)
      ? filters.every((filter) => row[filter.column] === filter.value)
      : false
  );
}

function applyMaybeSingle(data: unknown, filters: QueryFilter[]) {
  const filtered = applyFilters(data, filters);

  return Array.isArray(filtered) ? filtered[0] ?? null : filtered;
}

function createMockSupabase(
  responses: Record<string, { data: unknown; error: null }>
) {
  const calls: QueryCall[] = [];
  const client = {
    from(table: string) {
      const call: QueryCall = {
        table,
        filters: [],
        orders: [],
        maybeSingle: false
      };
      calls.push(call);

      const builder = {
        select(columns: string) {
          call.select = columns;
          return builder;
        },
        eq(column: string, value: unknown) {
          call.filters.push({ column, value });
          return builder;
        },
        order(column: string, options?: unknown) {
          call.orders.push({ column, options });
          return builder;
        },
        maybeSingle() {
          call.maybeSingle = true;
          const response =
            responses[`${table}:single`] ??
            responses[table] ??
            { data: null, error: null };

          return Promise.resolve({
            ...response,
            data: applyMaybeSingle(response.data, call.filters)
          });
        },
        then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
          onfulfilled?:
            | ((
                value: { data: unknown; error: null }
              ) => TResult1 | PromiseLike<TResult1>)
            | undefined
            | null,
          onrejected?:
            | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
            | undefined
            | null
        ) {
          const response = responses[table] ?? { data: [], error: null };

          return Promise.resolve({
            ...response,
            data: applyFilters(response.data, call.filters)
          }).then(onfulfilled, onrejected);
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

describe("public catalogue repository", () => {
  it("falls back safely when Supabase server env is missing", async () => {
    const supabase = {
      configured: false as const,
      client: null,
      missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as (
        | "SUPABASE_URL"
        | "SUPABASE_ANON_KEY"
      )[]
    };

    const catalogue = await getPublicCatalogue({ supabase });
    const product = await getPublicProductBySlug("lounge-sofa-package", {
      supabase
    });

    expect(catalogue.source).toBe("fallback");
    expect(catalogue.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: "lounge-sofa-package" })
      ])
    );
    expect(product?.source).toBe("fallback");
    expect(product?.slug).toBe("lounge-sofa-package");
  });

  it("falls back safely without querying when the catalogue workspace is missing", async () => {
    const { calls, supabase } = createMockSupabase({
      categories: {
        data: [
          {
            id: "category-published",
            workspace_id: workspaceA,
            slug: "lounge-seating",
            name: "Lounge Seating",
            description: "Published seating.",
            sort_order: 10,
            is_published: true
          }
        ],
        error: null
      },
      products: {
        data: [
          {
            id: "product-published",
            workspace_id: workspaceA,
            category_id: "category-published",
            slug: "modular-lounge-set",
            name: "Modular Lounge Set",
            short_description: "Published lounge set.",
            description: "Published details.",
            rental_unit: "set",
            status: "published",
            sort_order: 10,
            product_images: []
          }
        ],
        error: null
      }
    });

    const catalogue = await getPublicCatalogue({ supabase });
    const product = await getPublicProductBySlug("modular-lounge-set", {
      supabase
    });

    expect(catalogue.source).toBe("fallback");
    expect(product).toBeNull();
    expect(calls).toEqual([]);
  });

  it("requests only approved catalogue tables with trusted workspace and published filters", async () => {
    const { calls, supabase } = createMockSupabase({
      categories: {
        data: [
          {
            id: "category-published",
            workspace_id: workspaceA,
            slug: "lounge-seating",
            name: "Lounge Seating",
            description: "Published seating.",
            sort_order: 10,
            is_published: true
          },
          {
            id: "category-draft",
            workspace_id: workspaceA,
            slug: "draft-concepts",
            name: "Draft Concepts",
            description: "Hidden category.",
            sort_order: 90,
            is_published: false
          },
          {
            id: "category-other-workspace",
            workspace_id: workspaceB,
            slug: "other-workspace",
            name: "Other Workspace",
            description: "Published elsewhere.",
            sort_order: 20,
            is_published: true
          }
        ],
        error: null
      },
      products: {
        data: [
          {
            id: "product-published",
            workspace_id: workspaceA,
            category_id: "category-published",
            slug: "modular-lounge-set",
            name: "Modular Lounge Set",
            short_description: "Published lounge set.",
            description: "Published details.",
            rental_unit: "set",
            status: "published",
            sort_order: 10,
            product_images: [
              {
                id: "image-published",
                storage_bucket: "sample-catalogue-public",
                storage_path: "sample-fixtures/modular-lounge-set-main.jpg",
                alt_text: "Sample image metadata.",
                sort_order: 10,
                is_primary: true
              }
            ]
          },
          {
            id: "product-draft",
            workspace_id: workspaceA,
            category_id: "category-draft",
            slug: "concept-backdrop-frame",
            name: "Concept Backdrop Frame",
            short_description: "Hidden draft.",
            description: "Hidden draft details.",
            rental_unit: "item",
            status: "draft",
            sort_order: 90,
            product_images: [
              {
                id: "image-draft",
                storage_bucket: "sample-catalogue-public",
                storage_path: "sample-fixtures/draft/concept.jpg",
                alt_text: "Draft image metadata.",
                sort_order: 90,
                is_primary: true
              }
            ]
          },
          {
            id: "product-other-workspace",
            workspace_id: workspaceB,
            category_id: "category-other-workspace",
            slug: "other-workspace-lounge",
            name: "Other Workspace Lounge",
            short_description: "Published elsewhere.",
            description: "Other workspace details.",
            rental_unit: "set",
            status: "published",
            sort_order: 20,
            product_images: [
              {
                id: "image-other-workspace",
                storage_bucket: "sample-catalogue-public",
                storage_path: "sample-fixtures/other-workspace.jpg",
                alt_text: "Other workspace image metadata.",
                sort_order: 20,
                is_primary: true
              }
            ]
          }
        ],
        error: null
      }
    });

    const catalogue = await getPublicCatalogue({
      supabase,
      env: { CATALOGUE_WORKSPACE_ID: workspaceA }
    });
    const serializedCatalogue = JSON.stringify(catalogue);

    expect(calls.map((call) => call.table)).toEqual([
      "categories",
      "products"
    ]);
    expect(calls[0]).toMatchObject({
      table: "categories",
      filters: [
        { column: "workspace_id", value: workspaceA },
        { column: "is_published", value: true }
      ]
    });
    expect(calls[1]).toMatchObject({
      table: "products",
      filters: [
        { column: "workspace_id", value: workspaceA },
        { column: "status", value: "published" }
      ]
    });
    expect(calls[1].select).toContain("product_images");
    expect(serializedCatalogue).toContain("Modular Lounge Set");
    expect(serializedCatalogue).not.toContain("Draft Concepts");
    expect(serializedCatalogue).not.toContain("Concept Backdrop Frame");
    expect(serializedCatalogue).not.toContain("sample-fixtures/draft");
    expect(serializedCatalogue).not.toContain("Other Workspace");
    expect(serializedCatalogue).not.toContain("other-workspace.jpg");
  });

  it("requests product details by slug with trusted workspace and published product filters", async () => {
    const { calls, supabase } = createMockSupabase({
      products: {
        data: [
          {
            id: "product-other-workspace",
            workspace_id: workspaceB,
            category_id: "category-other-workspace",
            slug: "modular-lounge-set",
            name: "Other Workspace Lounge",
            short_description: "Published elsewhere.",
            description: "Other workspace details.",
            rental_unit: "set",
            status: "published",
            sort_order: 20,
            product_images: []
          },
          {
            id: "product-published",
            workspace_id: workspaceA,
            category_id: "category-published",
            slug: "modular-lounge-set",
            name: "Modular Lounge Set",
            short_description: "Published lounge set.",
            description: "Published details.",
            rental_unit: "set",
            status: "published",
            sort_order: 10,
            product_images: []
          }
        ],
        error: null
      }
    });

    const product = await getPublicProductBySlug("modular-lounge-set", {
      workspaceId: workspaceA,
      supabase
    });

    expect(product).toMatchObject({
      source: "supabase",
      slug: "modular-lounge-set",
      name: "Modular Lounge Set"
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: "products",
      filters: [
        { column: "workspace_id", value: workspaceA },
        { column: "slug", value: "modular-lounge-set" },
        { column: "status", value: "published" }
      ],
      maybeSingle: true
    });
    expect(calls[0].select).toContain("product_images");
  });

  it("keeps production catalogue data access server-only and catalogue-scoped", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/catalogue/catalogue-repository.ts"),
      "utf8"
    );
    const blockedTables = [
      "quote_requests",
      "quote_request_items",
      "conversations",
      "messages",
      "admin_users",
      "memberships",
      "usage_events",
      "audit_logs",
      "integration_connections"
    ];

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createServerSupabaseClient");
    expect(source).toContain('from("categories")');
    expect(source).toContain('from("products")');
    expect(source).toContain("product_images");
    expect(source).toContain("CATALOGUE_WORKSPACE_ID");
    expect(source).toContain('eq("workspace_id", workspaceId)');
    expect(source).toContain('eq("is_published", true)');
    expect(source).toContain('eq("status", "published")');
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");

    for (const tableName of blockedTables) {
      expect(source).not.toContain(tableName);
    }
  });
});
