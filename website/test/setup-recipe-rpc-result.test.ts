import { describe, expect, it } from "vitest";

import {
  parseAdminRecipeWriteRpcResult,
  type AdminRecipeWriteRpcResult
} from "../lib/catalogue/setup-recipe-types";

const setupProductId = "50000000-0000-4000-8000-000000000001";

function validResult(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    operation: "replace",
    setup_product_id: setupProductId,
    revision: 2,
    item_count: 1,
    ...overrides
  };
}

function expected() {
  return { operation: "replace" as const, setupProductId };
}

function expectReject(value: unknown) {
  expect(parseAdminRecipeWriteRpcResult(value, expected())).toEqual({
    ok: false,
    code: "rpc-failure"
  });
}

describe("Run-57 setup-write RPC exact result contract", () => {
  it("accepts the exact valid production result", () => {
    expect(parseAdminRecipeWriteRpcResult(validResult(), expected())).toEqual({
      ok: true,
      value: {
        operation: "replace",
        setupProductId,
        revision: 2,
        itemCount: 1
      }
    });
  });

  it("accepts the exact valid remove result", () => {
    expect(
      parseAdminRecipeWriteRpcResult(validResult({ operation: "remove" }), {
        operation: "remove",
        setupProductId
      })
    ).toMatchObject({
      ok: true,
      value: { operation: "remove", itemCount: 1 }
    });
  });

  it("rejects a missing required key", () => {
    const result = validResult();
    delete result.revision;
    expectReject(result);
  });

  it("rejects an extra unknown key", () => {
    expectReject(validResult({ extra: "value" }));
  });

  it("rejects a wrong primitive type on each field", () => {
    expectReject(validResult({ operation: 1 }));
    expectReject(validResult({ setup_product_id: 1 }));
    expectReject(validResult({ revision: "2" }));
    expectReject(validResult({ item_count: "1" }));
    expectReject(validResult({ operation: { value: "replace" } }));
    expectReject(validResult({ setup_product_id: ["id"] }));
    expectReject(validResult({ revision: true }));
    expectReject(validResult({ item_count: ["1"] }));
  });

  it("rejects numeric strings and boolean strings", () => {
    expectReject(validResult({ revision: "2" }));
    expectReject(validResult({ item_count: "1" }));
    expectReject(validResult({ item_count: "true" }));
    expectReject(validResult({ revision: "true" }));
    expectReject(validResult({ operation: "false" }));
  });

  it("rejects null and arrays at the top level", () => {
    expectReject(null);
    expectReject([]);
    expectReject([validResult()]);
  });

  it("rejects malformed nested objects where a primitive is required", () => {
    expectReject(validResult({ revision: { value: 2 } }));
    expectReject(validResult({ item_count: { value: 1 } }));
    expectReject(validResult({ operation: { value: "replace" } }));
    expectReject(validResult({ setup_product_id: { value: setupProductId } }));
  });

  it("rejects non-finite numbers", () => {
    expectReject(validResult({ revision: Number.NaN }));
    expectReject(validResult({ revision: Number.POSITIVE_INFINITY }));
    expectReject(validResult({ revision: Number.NEGATIVE_INFINITY }));
    expectReject(validResult({ item_count: Number.NaN }));
    expectReject(validResult({ item_count: Number.POSITIVE_INFINITY }));
  });

  it("rejects fractional values where an integer is required", () => {
    expectReject(validResult({ revision: 2.5 }));
    expectReject(validResult({ item_count: 1.5 }));
    expectReject(validResult({ revision: -1 }));
    expectReject(validResult({ revision: 0 }));
    expectReject(validResult({ item_count: 0 }));
    expectReject(validResult({ item_count: 21 }));
  });

  it("rejects unsafe integers", () => {
    expectReject(validResult({ revision: Number.MAX_SAFE_INTEGER + 1 }));
    expectReject(validResult({ item_count: Number.MAX_SAFE_INTEGER + 1 }));
  });

  it("rejects empty and malformed identifiers", () => {
    expectReject(validResult({ setup_product_id: "" }));
    expectReject(validResult({ setup_product_id: "   " }));
    expectReject(validResult({ setup_product_id: "not-a-uuid" }));
    expectReject(validResult({ setup_product_id: "12345678" }));
    expectReject(validResult({ setup_product_id: "zzzz0000-0000-4000-8000-000000000001" }));
  });

  it("rejects conflicting result fields", () => {
    expectReject(
      validResult({ operation: "remove" }),
    );
    expectReject(
      validResult({ setup_product_id: "10000000-0000-4000-8000-000000000001" }),
    );
    expectReject(
      validResult({ operation: "remove", setup_product_id: setupProductId, revision: 1 }),
    );
  });

  it("canonicalises mixed-case UUID identities before comparing", () => {
    const upperSetupProductId = setupProductId.toUpperCase();

    expect(
      parseAdminRecipeWriteRpcResult(
        validResult({ setup_product_id: upperSetupProductId }),
        expected()
      )
    ).toEqual({
      ok: true,
      value: {
        operation: "replace",
        setupProductId,
        revision: 2,
        itemCount: 1
      }
    });
  });
});
