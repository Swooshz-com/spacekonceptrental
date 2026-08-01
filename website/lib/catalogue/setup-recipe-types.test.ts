import { describe, expect, it } from "vitest";

import { classifySetupComposition } from "./setup-recipe-types";

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
