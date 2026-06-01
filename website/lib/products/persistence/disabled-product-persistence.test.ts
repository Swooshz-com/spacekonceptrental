import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { disabledProductPersistence } from "./index";

const trustedAdminContext = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  adminUserId: "22222222-2222-4222-8222-222222222222",
  membershipId: "33333333-3333-4333-8333-333333333333",
  resolution: "server-auth-membership" as const
};

const expectedDisabledResult = {
  status: "skipped",
  reason: "PRODUCT_PERSISTENCE_DISABLED_PHASE_1J_A"
};

function readPersistenceSource() {
  return [
    "lib/products/persistence/types.ts",
    "lib/products/persistence/disabled-product-persistence.ts",
    "lib/products/persistence/index.ts"
  ]
    .map((filePath) => readFileSync(resolve(process.cwd(), filePath), "utf8"))
    .join("\n");
}

describe("disabled product persistence scaffold", () => {
  it("returns explicit skipped results for future category, product, and image mutations", async () => {
    const persistence = disabledProductPersistence;

    await expect(
      persistence.createCategory({
        admin: trustedAdminContext,
        category: {
          slug: "lounge",
          name: "Lounge",
          description: "Lounge seating",
          sortOrder: 10,
          isPublished: false
        }
      })
    ).resolves.toEqual(expectedDisabledResult);

    await expect(
      persistence.updateCategory({
        admin: trustedAdminContext,
        categoryId: "44444444-4444-4444-8444-444444444444",
        updates: {
          name: "Updated lounge",
          isPublished: true
        }
      })
    ).resolves.toEqual(expectedDisabledResult);

    await expect(
      persistence.archiveCategory({
        admin: trustedAdminContext,
        categoryId: "44444444-4444-4444-8444-444444444444",
        updates: {
          isPublished: false
        }
      })
    ).resolves.toEqual(expectedDisabledResult);

    await expect(
      persistence.createProduct({
        admin: trustedAdminContext,
        product: {
          categoryId: "44444444-4444-4444-8444-444444444444",
          slug: "modular-lounge-set",
          name: "Modular Lounge Set",
          shortDescription: "Published later after review",
          description: "Draft product details",
          rentalUnit: "set",
          status: "draft",
          sortOrder: 20
        }
      })
    ).resolves.toEqual(expectedDisabledResult);

    await expect(
      persistence.updateProduct({
        admin: trustedAdminContext,
        productId: "55555555-5555-4555-8555-555555555555",
        updates: {
          name: "Updated Modular Lounge Set",
          status: "draft"
        }
      })
    ).resolves.toEqual(expectedDisabledResult);

    await expect(
      persistence.archiveProduct({
        admin: trustedAdminContext,
        productId: "55555555-5555-4555-8555-555555555555"
      })
    ).resolves.toEqual(expectedDisabledResult);

    await expect(
      persistence.publishProduct({
        admin: trustedAdminContext,
        productId: "55555555-5555-4555-8555-555555555555"
      })
    ).resolves.toEqual(expectedDisabledResult);

    await expect(
      persistence.createProductImage({
        admin: trustedAdminContext,
        image: {
          productId: "55555555-5555-4555-8555-555555555555",
          storageBucket: "future-product-media",
          storagePath: "future/modular-lounge-set.jpg",
          altText: "Draft product image metadata",
          sortOrder: 10,
          isPrimary: true
        }
      })
    ).resolves.toEqual(expectedDisabledResult);

    await expect(
      persistence.updateProductImage({
        admin: trustedAdminContext,
        imageId: "66666666-6666-4666-8666-666666666666",
        updates: {
          altText: "Updated product image metadata",
          sortOrder: 20,
          isPrimary: false
        }
      })
    ).resolves.toEqual(expectedDisabledResult);

    await expect(
      persistence.archiveProductImage({
        admin: trustedAdminContext,
        imageId: "66666666-6666-4666-8666-666666666666"
      })
    ).resolves.toEqual(expectedDisabledResult);
  });

  it("keeps the scaffold server-only and unable to write product data", () => {
    const source = readPersistenceSource();

    expect(source.match(/import "server-only";/g)).toHaveLength(3);
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("lib/supabase");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("createClient");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".delete(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain('from("products")');
    expect(source).not.toContain('from("categories")');
    expect(source).not.toContain('from("product_images")');
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("NEXT_PUBLIC_N8N");
    expect(source).not.toContain("chat-config");
  });
});
