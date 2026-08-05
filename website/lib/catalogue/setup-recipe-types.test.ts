import { describe, expect, it } from "vitest";

import {
  classifySetupComposition,
  parseAdminRecipeReadRpcResult,
  parseAdminRecipeWriteRpcResult,
  canonicalizeUuid
} from "./setup-recipe-types";

const validImage = {
  id: "22222222-2222-4222-8222-222222222222",
  storage_bucket: "catalogue-public",
  storage_path: "workspace/child.webp",
  alt_text: null,
  sort_order: 0,
  is_primary: true
};

const validChild = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "child",
  name: "Child",
  short_description: null,
  rental_unit: "item",
  product_images: [validImage],
  position: 0,
  base_quantity: 1
};

function classify(child: Record<string, unknown>) {
  return classifySetupComposition("setup", [child]);
}

describe("strict raw setup composition contract", () => {
  it("accepts the exact closed database child and image shape", () => {
    expect(classify(validChild)).toMatchObject({
      ok: true,
      kind: "setup",
      composition: [
        {
          id: validChild.id,
          rentalUnit: "item",
          images: [
            {
              id: validImage.id,
              storageBucket: "catalogue-public",
              storagePath: "workspace/child.webp",
              altText: undefined,
              sortOrder: 0,
              isPrimary: true
            }
          ]
        }
      ]
    });
  });

  it.each([
    ["id", undefined],
    ["slug", " "],
    ["name", 7],
    ["rental_unit", undefined],
    ["rental_unit", " "],
    ["product_images", undefined],
    ["product_images", {}],
    ["position", 0.5],
    ["position", Number.NaN],
    ["base_quantity", 1.5],
    ["base_quantity", Number.POSITIVE_INFINITY]
  ])("rejects malformed required child field %s", (key, value) => {
    expect(classify({ ...validChild, [key]: value })).toEqual({
      ok: false,
      code: "malformed-children"
    });
  });

  it.each([
    ["short_description", undefined],
    ["short_description", 7]
  ])("rejects a non-contract optional child field state %s", (key, value) => {
    const child = { ...validChild, [key]: value };

    expect(classify(child)).toEqual({
      ok: false,
      code: "malformed-children"
    });
  });

  it("rejects unknown child fields", () => {
    expect(classify({ ...validChild, browser_authority: true })).toEqual({
      ok: false,
      code: "malformed-children"
    });
  });

  it.each([
    ["id", undefined],
    ["storage_bucket", " "],
    ["storage_path", 7],
    ["alt_text", undefined],
    ["alt_text", false],
    ["sort_order", 0.5],
    ["sort_order", Number.NaN],
    ["is_primary", 1]
  ])("rejects malformed image field %s without filtering it", (key, value) => {
    expect(
      classify({
        ...validChild,
        product_images: [{ ...validImage, [key]: value }]
      })
    ).toEqual({
      ok: false,
      code: "malformed-children"
    });
  });

  it("rejects unknown image fields and invalidates the complete composition", () => {
    expect(
      classify({
        ...validChild,
        product_images: [validImage, { ...validImage, browser_url: "/forged" }]
      })
    ).toEqual({
      ok: false,
      code: "malformed-children"
    });
  });
});

describe("atomic setup recipe read RPC result contract", () => {
  const workspaceId = "11111111-1111-4111-8111-111111111111";
  const setupProductId = "22222222-2222-4222-8222-222222222222";
  const childId = "33333333-3333-4333-8333-333333333333";

  function validData(overrides: Record<string, unknown> = {}) {
    return {
      revision: 3,
      items: [
        {
          workspace_id: workspaceId,
          setup_product_id: setupProductId,
          included_product_id: childId,
          position: 0,
          base_quantity: 2
        }
      ],
      ...overrides
    };
  }

  it("accepts the exact single-statement read result", () => {
    expect(
      parseAdminRecipeReadRpcResult(validData(), { workspaceId, setupProductId })
    ).toEqual({
      ok: true,
      value: {
        revision: 3,
        items: [
          {
            workspace_id: workspaceId,
            setup_product_id: setupProductId,
            included_product_id: childId,
            position: 0,
            base_quantity: 2
          }
        ]
      }
    });
  });

  it("rejects a missing recipe header revision", () => {
    const data = validData();
    const { revision: _revision, ...withoutRevision } = data;
    expect(
      parseAdminRecipeReadRpcResult(withoutRevision, { workspaceId, setupProductId })
    ).toEqual({ ok: false, code: "rpc-failure" });
  });

  it("rejects an empty or over-limit item set", () => {
    expect(
      parseAdminRecipeReadRpcResult(
        validData({ items: [] }),
        { workspaceId, setupProductId }
      )
    ).toEqual({ ok: false, code: "rpc-failure" });
  });

  it("rejects a malformed item row", () => {
    expect(
      parseAdminRecipeReadRpcResult(
        validData({
          items: [{ included_product_id: childId, position: 0, base_quantity: 2 }]
        }),
        { workspaceId, setupProductId }
      )
    ).toEqual({ ok: false, code: "rpc-failure" });
  });

  it("rejects duplicate positions or duplicate children", () => {
    const duplicatePosition = {
      revision: 3,
      items: [
        { workspace_id: workspaceId, setup_product_id: setupProductId, included_product_id: childId, position: 0, base_quantity: 1 },
        { workspace_id: workspaceId, setup_product_id: setupProductId, included_product_id: "44444444-4444-4444-8444-444444444444", position: 0, base_quantity: 1 }
      ]
    };
    expect(
      parseAdminRecipeReadRpcResult(duplicatePosition, { workspaceId, setupProductId })
    ).toEqual({ ok: false, code: "rpc-failure" });

    const duplicateChild = {
      revision: 3,
      items: [
        { workspace_id: workspaceId, setup_product_id: setupProductId, included_product_id: childId, position: 0, base_quantity: 1 },
        { workspace_id: workspaceId, setup_product_id: setupProductId, included_product_id: childId, position: 1, base_quantity: 1 }
      ]
    };
    expect(
      parseAdminRecipeReadRpcResult(duplicateChild, { workspaceId, setupProductId })
    ).toEqual({ ok: false, code: "rpc-failure" });
  });

  it("canonicalises mixed-case database-returned identities", () => {
    expect(
      parseAdminRecipeReadRpcResult(
        validData({
          items: [
            {
              workspace_id: workspaceId.toUpperCase(),
              setup_product_id: setupProductId.toUpperCase(),
              included_product_id: childId.toUpperCase(),
              position: 0,
              base_quantity: 2
            }
          ]
        }),
        { workspaceId: workspaceId.toUpperCase(), setupProductId: setupProductId.toUpperCase() }
      )
    ).toMatchObject({ ok: true });
  });

  it("rejects a genuinely different setup product identity", () => {
    expect(
      parseAdminRecipeReadRpcResult(
        validData({
          items: [
            {
              workspace_id: workspaceId,
              setup_product_id: "99999999-9999-4999-8999-999999999999",
              included_product_id: childId,
              position: 0,
              base_quantity: 2
            }
          ]
        }),
        { workspaceId, setupProductId }
      )
    ).toEqual({ ok: false, code: "rpc-failure" });
  });

  it("rejects an invalid canonical identity", () => {
    expect(
      parseAdminRecipeReadRpcResult(validData(), {
        workspaceId: "not-a-uuid",
        setupProductId
      })
    ).toEqual({ ok: false, code: "rpc-failure" });
  });
});

describe("canonical UUID representation", () => {
  it("lowercases a valid UUID without broadening accepted syntax", () => {
    expect(
      canonicalizeUuid("11111111-1111-4111-8111-111111111111")
    ).toBe("11111111-1111-4111-8111-111111111111");
    expect(
      canonicalizeUuid("11111111-1111-4111-8111-111111111111")
    ).toBe("11111111-1111-4111-8111-111111111111");
    expect(
      canonicalizeUuid("  AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA  ")
    ).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });

  it("still rejects invalid identifiers in the write RPC parse", () => {
    expect(
      parseAdminRecipeWriteRpcResult(
        {
          operation: "replace",
          setup_product_id: "not-a-uuid",
          revision: 1,
          item_count: 1
        },
        { operation: "replace", setupProductId: "22222222-2222-4222-8222-222222222222" }
      )
    ).toEqual({ ok: false, code: "rpc-failure" });
  });
});
