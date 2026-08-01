import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getPublicCatalogue,
  getPublicProductBySlug
} from "./catalogue-repository";

type RpcCall = {
  functionName: string;
  args: Record<string, unknown>;
};

const workspaceA = "11111111-1111-4111-8111-111111111111";

function createMockSupabase(
  responses: Record<string, { data: unknown; error: null }>
) {
  const calls: RpcCall[] = [];
  const client = {
    rpc(functionName: string, args: Record<string, unknown>) {
      calls.push({ functionName, args });

      return Promise.resolve(
        responses[functionName] ?? { data: null, error: null }
      );
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
  it("returns an empty recovery catalogue when Supabase server env is missing", async () => {
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
    expect(catalogue.categories).toEqual([]);
    expect(catalogue.products).toEqual([]);
    expect(product).toBeNull();
  });

  it("falls back safely without querying when the catalogue workspace is missing", async () => {
    const { calls, supabase } = createMockSupabase({
      get_public_catalogue: {
        data: {
          categories: [
            {
              id: "category-published",
              slug: "lounge-seating",
              name: "Lounge Seating",
              description: "Published seating.",
              sort_order: 10,
              is_published: true
            }
          ],
          products: [
            {
              id: "product-published",
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
          ]
        },
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

  it("returns DB-backed rows through the trusted active-workspace read surface", async () => {
    const { calls, supabase } = createMockSupabase({
      get_public_catalogue: {
        data: {
          categories: [
            {
              id: "category-published",
              slug: "lounge-seating",
              name: "Lounge Seating",
              description: "Published seating.",
              sort_order: 10,
              is_published: true
            },
            {
              id: "category-draft",
              slug: "draft-concepts",
              name: "Draft Concepts",
              description: "Hidden category.",
              sort_order: 90,
              is_published: false
            }
          ],
          products: [
            {
              id: "product-published",
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
            }
          ]
        },
        error: null
      }
    });

    const catalogue = await getPublicCatalogue({
      supabase,
      env: {
        CATALOGUE_WORKSPACE_ID: workspaceA,
        SUPABASE_URL: "https://space.supabase.co"
      }
    });
    const serializedCatalogue = JSON.stringify(catalogue);

    expect(calls).toEqual([
      {
        functionName: "get_public_catalogue",
        args: {
          expected_workspace_id: workspaceA,
          product_slug: null
        }
      }
    ]);
    expect(catalogue.source).toBe("supabase");
    expect(serializedCatalogue).toContain("Modular Lounge Set");
    expect(catalogue.products[0].primaryImage).toMatchObject({
      storageBucket: "sample-catalogue-public",
      storagePath: "sample-fixtures/modular-lounge-set-main.jpg",
      publicUrl:
        "https://space.supabase.co/storage/v1/object/public/sample-catalogue-public/sample-fixtures/modular-lounge-set-main.jpg"
    });
    expect(catalogue.products[0].images).toEqual([
      expect.objectContaining({
        id: "image-published",
        publicUrl:
          "https://space.supabase.co/storage/v1/object/public/sample-catalogue-public/sample-fixtures/modular-lounge-set-main.jpg"
      })
    ]);
    expect(serializedCatalogue).not.toContain("Draft Concepts");
    expect(serializedCatalogue).not.toContain("Concept Backdrop Frame");
    expect(serializedCatalogue).not.toContain("sample-fixtures/draft");
  });

  it("returns an empty recovery catalogue when the trusted active-workspace surface is unavailable", async () => {
    const { calls, supabase } = createMockSupabase({
      get_public_catalogue: {
        data: null,
        error: null
      }
    });

    const catalogue = await getPublicCatalogue({
      supabase,
      env: { CATALOGUE_WORKSPACE_ID: workspaceA }
    });

    expect(calls).toEqual([
      {
        functionName: "get_public_catalogue",
        args: {
          expected_workspace_id: workspaceA,
          product_slug: null
        }
      }
    ]);
    expect(catalogue.source).toBe("fallback");
    expect(catalogue.categories).toEqual([]);
    expect(catalogue.products).toEqual([]);
  });

  it("requests product details by slug through the trusted active-workspace read surface", async () => {
    const { calls, supabase } = createMockSupabase({
      get_public_catalogue: {
        data: {
          categories: [
            {
              id: "category-published",
              slug: "lounge-seating",
              name: "Lounge Seating",
              description: "Published seating.",
              sort_order: 10,
              is_published: true
            }
          ],
          products: [
            {
              id: "product-published",
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
          ]
        },
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
      name: "Modular Lounge Set",
      categoryName: "Lounge Seating"
    });
    expect(calls).toEqual([
      {
        functionName: "get_public_catalogue",
        args: {
          expected_workspace_id: workspaceA,
          product_slug: "modular-lounge-set"
        }
      }
    ]);
  });

  it("makes malformed raw setup composition authority unavailable without rental inference", async () => {
    const { supabase } = createMockSupabase({
      get_public_catalogue: {
        data: {
          categories: [{
            id: "category-published",
            slug: "lounge-seating",
            name: "Lounge Seating",
            description: null,
            sort_order: 0,
            is_published: true
          }],
          products: [{
            id: "setup-product",
            category_id: "category-published",
            slug: "malformed-setup",
            name: "Malformed Setup",
            short_description: null,
            description: null,
            rental_unit: "setup",
            status: "published",
            sort_order: 0,
            product_images: [],
            product_kind: "setup",
            setup_composition: [{
              id: "child-product",
              slug: "child",
              name: "Child",
              short_description: null,
              rental_unit: "item",
              product_images: [{
                id: "child-image",
                storage_bucket: "catalogue-public",
                storage_path: "workspace/child.webp",
                alt_text: null,
                sort_order: 0
              }],
              position: 0,
              base_quantity: 1
            }]
          }]
        },
        error: null
      }
    });

    const product = await getPublicProductBySlug("malformed-setup", {
      workspaceId: workspaceA,
      supabase
    });

    expect(product).toBeTruthy();
    expect(product?.productKind).toBeUndefined();
    expect(product?.safeSetupComposition).toBeUndefined();
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
    expect(source).toContain('rpc("get_public_catalogue"');
    expect(source).toContain("CATALOGUE_WORKSPACE_ID");
    expect(source).not.toContain('from("categories")');
    expect(source).not.toContain('from("products")');
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");

    for (const tableName of blockedTables) {
      expect(source).not.toContain(tableName);
    }
  });
});
