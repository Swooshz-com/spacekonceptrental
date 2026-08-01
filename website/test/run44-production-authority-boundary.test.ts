import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  authorizeAdminOperation,
  isSupportedAdminOperation
} from "../lib/admin/authorization/admin-authorization-policy";
import { validateServerAdminRequestSecurityPreflight } from "../lib/admin/authorization/server-admin-request-security-preflight";
import { issueServerAdminCsrfProof } from "../lib/admin/authorization/server-admin-csrf-proof-issuer";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import {
  isProductKindAvailable,
  isSetupCatalogueProduct,
  quoteSelectionValidItemsForCatalogue,
  StitchItemCard
} from "../components/PublicStitch";
import {
  QuoteSelectionButton
} from "../components/QuoteSelectionControls";
import { QUOTE_SELECTION_STORAGE_KEY } from "../lib/quote/selection-model";
import type { PublicCatalogueProduct } from "../lib/catalogue/types";

const repoRoot = resolve(process.cwd(), "..");

const workspaceId = "11111111-1111-4111-8111-111111111111";

const adminContext = {
  authenticated: true,
  adminUser: { id: "admin-1", status: "active" as const },
  serverResolvedWorkspaceId: workspaceId,
  membership: {
    adminUserId: "admin-1",
    workspaceId,
    status: "active" as const,
    role: "admin" as const
  }
};

const validComposition = [
  {
    id: "child-1",
    slug: "child-1",
    name: "Child 1",
    rentalUnit: "per event",
    images: [],
    position: 0,
    baseQuantity: 1
  }
];

function product(
  overrides: Partial<PublicCatalogueProduct> = {}
): PublicCatalogueProduct {
  return {
    id: "product-1",
    slug: "product-1",
    name: "Product 1",
    rentalUnit: "per event",
    sortOrder: 0,
    categoryName: "Seating",
    source: "supabase",
    ...overrides
  };
}

function source(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("SKR Run-44 production authority boundary RED contract", () => {
  it("recognizes the exact setup-recipe read and write operations", () => {
    expect(isSupportedAdminOperation("admin.setupRecipe.read")).toBe(true);
    expect(isSupportedAdminOperation("admin.setupRecipe.write")).toBe(true);
  });

  it("requires a CSRF proof for a setup-recipe write", async () => {
    await expect(
      validateServerAdminRequestSecurityPreflight({
        requestedOperation: "admin.setupRecipe.write",
        requestMethod: "POST",
        requestOrigin: "https://admin.space.test",
        requestHost: "admin.space.test",
        expectedOrigin: "https://admin.space.test",
        expectedHost: "admin.space.test"
      })
    ).resolves.toMatchObject({
      allowed: false,
      reason: "csrf_proof_missing"
    });
  });

  it("rejects a CSRF proof bound to the wrong setup-recipe operation", async () => {
    const verifyCsrfProof = vi.fn(async () => ({
      valid: false as const,
      reason: "csrf_proof_mismatched" as const
    }));

    await expect(
      validateServerAdminRequestSecurityPreflight(
        {
          requestedOperation: "admin.setupRecipe.read",
          requestMethod: "POST",
          requestOrigin: "https://admin.space.test",
          requestHost: "admin.space.test",
          expectedOrigin: "https://admin.space.test",
          expectedHost: "admin.space.test",
          csrfProof: "write-proof"
        },
        { verifyCsrfProof }
      )
    ).resolves.toMatchObject({
      allowed: false,
      reason: "csrf_proof_mismatched"
    });
  });

  it("issues an operation-bound proof for setup-recipe reads and writes", async () => {
    const signCsrfProof = vi.fn(async () => "signature");

    for (const operation of [
      "admin.setupRecipe.read",
      "admin.setupRecipe.write"
    ] as const) {
      await expect(
        issueServerAdminCsrfProof(
          {
            operation,
            sessionBinding: "session-binding",
            nonce: "nonce",
            issuedAt: 1,
            expiresAt: 2
          },
          { signCsrfProof }
        )
      ).resolves.toMatchObject({ issued: true });
    }
  });

  it.each([
    "admin.setupRecipe.read",
    "admin.setupRecipe.write"
  ] as const)("denies an anonymous recipe %s", (operation) => {
    expect(
      authorizeAdminOperation({
        ...adminContext,
        authenticated: false,
        adminUser: null,
        operation
      })
    ).toMatchObject({ allowed: false, reason: "unauthenticated" });
  });

  it.each([
    "admin.setupRecipe.read",
    "admin.setupRecipe.write"
  ] as const)("allows an authenticated admin in the correct workspace for %s", (operation) => {
    expect(
      authorizeAdminOperation({ ...adminContext, operation })
    ).toMatchObject({
      allowed: true,
      workspaceId
    });
  });

  it("denies an authenticated admin whose requested record is in another workspace", () => {
    expect(
      authorizeAdminOperation({
        ...adminContext,
        operation: "admin.setupRecipe.write",
        requestedRecordWorkspaceId: "22222222-2222-4222-8222-222222222222"
      })
    ).toMatchObject({ allowed: false, reason: "workspace_mismatch" });
  });

  it("denies a missing session before setup-recipe authority can be used", () => {
    expect(
      authorizeAdminOperation({
        ...adminContext,
        authenticated: false,
        adminUser: null,
        membership: null,
        operation: "admin.setupRecipe.write"
      })
    ).toMatchObject({ allowed: false, reason: "unauthenticated" });
  });

  it("requires the canonical authenticated server adapter for recipe reads and writes", () => {
    const repositorySource = source(
      "website/lib/catalogue/setup-recipe-repository.ts"
    );

    expect(repositorySource).toContain(
      "createSessionBoundSupabaseAdminReadClient"
    );
    expect(repositorySource).toContain("resolveSupabaseAdminAuthIdentity");
    expect(repositorySource).not.toContain("createServerSupabaseClient");
  });

  it("binds the editor and route to distinct operation-bound proof requests", () => {
    const editorSource = source("website/components/admin/setup-recipe-editor.tsx");
    const routeSource = source(
      "website/lib/catalogue/admin-setup-recipe-write-route.ts"
    );

    expect(editorSource).toContain("admin.setupRecipe.read");
    expect(editorSource).toContain("admin.setupRecipe.write");
    expect(editorSource).toContain("x-csrf-proof");
    expect(routeSource).toContain("admin.setupRecipe.read");
    expect(routeSource).toContain("admin.setupRecipe.write");
  });

  it("maps a missing repository product kind to an unavailable catalogue product", async () => {
    const supabase = {
      configured: true as const,
      missingEnv: [] as [],
      client: {
        rpc: vi.fn(async () => ({
          data: {
            categories: [],
            products: [
              {
                id: "product-1",
                slug: "product-1",
                name: "Missing Kind",
                status: "published",
                category_name: "Seating",
                product_images: [],
                product_kind: undefined,
                setup_composition: null
              }
            ]
          },
          error: null
        }))
      }
    };

    const catalogue = await getPublicCatalogue({
      workspaceId,
      supabase
    });
    const mapped = catalogue.products[0];

    expect(mapped.productKind).toBeUndefined();
    expect(isProductKindAvailable(mapped)).toBe(false);

    render(createElement(StitchItemCard, { product: mapped }));
    expect(
      screen.queryByRole("button", { name: /increase missing kind quantity/i })
    ).not.toBeInTheDocument();
  });

  it("excludes an unknown product kind from valid quote identities", () => {
    const unknownKind = product({
      productKind: "mystery" as never
    });

    expect(isProductKindAvailable(unknownKind)).toBe(false);
    expect(
      quoteSelectionValidItemsForCatalogue({
        source: "supabase",
        categories: [],
        products: [unknownKind]
      })
    ).toEqual([]);
  });

  it("rejects rental authority that carries setup composition", () => {
    const contradictory = product({
      productKind: "rental",
      safeSetupComposition: validComposition
    });

    expect(isProductKindAvailable(contradictory)).toBe(false);
    expect(
      quoteSelectionValidItemsForCatalogue({
        source: "supabase",
        categories: [],
        products: [contradictory]
      })
    ).toEqual([]);
  });

  it("rejects setup authority with malformed composition", () => {
    const malformed = product({
      productKind: "setup",
      safeSetupComposition: [{ id: "missing-required-fields" }] as never
    });

    expect(isProductKindAvailable(malformed)).toBe(false);
    expect(
      quoteSelectionValidItemsForCatalogue({
        source: "supabase",
        categories: [],
        products: [malformed]
      })
    ).toEqual([]);
  });

  it("does not let a category name classify a product as a setup", () => {
    expect(
      isSetupCatalogueProduct(
        product({ categoryName: "Setups", productKind: undefined })
      )
    ).toBe(false);
  });

  it("does not persist a selection for a category-only setup or malformed product", () => {
    render(
      createElement(QuoteSelectionButton, {
        item: {
          category: "Setups",
          name: "Category-only product",
          quantity: 1,
          slug: "category-only-product"
        }
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /increase category-only product quantity/i
      })
    );

    expect(
      window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)
    ).toBeNull();
  });

  it("keeps explicit rental and valid setup identities usable", () => {
    const rental = product({ productKind: "rental", safeSetupComposition: null });
    const setup = product({
      id: "setup-1",
      slug: "setup-1",
      name: "Setup 1",
      productKind: "setup",
      safeSetupComposition: validComposition
    });
    const items = quoteSelectionValidItemsForCatalogue({
      source: "supabase",
      categories: [],
      products: [rental, setup]
    });

    expect(items.map((item) => [item.slug, item.kind])).toEqual([
      ["product-1", "rental"],
      ["setup-1", "setup"]
    ]);
    expect(isProductKindAvailable(rental)).toBe(true);
    expect(isProductKindAvailable(setup)).toBe(true);
  });

  it("keeps the setup route as a POST-only production boundary", () => {
    const routeSource = source("website/app/api/admin/setup-recipe/route.ts");
    expect(routeSource).toContain("handleAdminSetupRecipeRoute");
    expect(routeSource).toContain("POST");
  });

  it("does not use a browser storage API for CSRF proof material", () => {
    const editorSource = source("website/components/admin/setup-recipe-editor.tsx");
    expect(editorSource).not.toContain("sessionStorage");
    expect(editorSource).not.toContain("localStorage");
  });
});
