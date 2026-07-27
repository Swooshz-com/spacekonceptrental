import { describe, expect, it } from "vitest";
import {
  QUOTE_SELECTION_MAX_BYTES,
  QUOTE_SELECTION_MAX_ROWS,
  addCatalogueSelection,
  createManualSelectionRow,
  emptyQuoteSelection,
  normalizeQuoteSelection,
  parseStoredQuoteSelection,
  replaceSelectionQuantity,
  serializeQuoteSelection
} from "./selection-model";

function catalogue(reference: string, quantity: number, order: number) {
  return {
    kind: "catalogue",
    reference,
    quantity,
    source: "catalogue",
    order
  };
}

describe("structured quote selection model", () => {
  it("parses, normalizes stable order, and serializes version 2", () => {
    const result = normalizeQuoteSelection({
      version: 2,
      rows: [
        catalogue("second-item", 1, 20),
        catalogue("first-item", 2, 10)
      ]
    });

    expect(result).toEqual({
      ok: true,
      value: {
        version: 2,
        rows: [
          { ...catalogue("first-item", 2, 0) },
          { ...catalogue("second-item", 1, 1) }
        ]
      }
    });
    expect(result.ok && parseStoredQuoteSelection(serializeQuoteSelection(result.value) ?? null))
      .toEqual(result);
  });

  it("enforces raw and canonical row limits", () => {
    const tooManyRawRows = Array.from(
      { length: QUOTE_SELECTION_MAX_ROWS + 1 },
      (_value, index) => catalogue(`item-${index}`, 1, index)
    );

    expect(
      normalizeQuoteSelection({ version: 2, rows: tooManyRawRows })
    ).toEqual({ ok: false, code: "raw-row-limit" });

    const atLimit = Array.from(
      { length: QUOTE_SELECTION_MAX_ROWS },
      (_value, index) => catalogue(`item-${index}`, 1, index)
    );
    const result = normalizeQuoteSelection({ version: 2, rows: atLimit });

    expect(result.ok && result.value.rows).toHaveLength(QUOTE_SELECTION_MAX_ROWS);
    expect(addCatalogueSelection(result.ok ? result.value : emptyQuoteSelection(), "overflow-item"))
      .toEqual({ ok: false, code: "raw-row-limit" });
  });

  it("enforces the serialized UTF-8 byte limit", () => {
    const oversized = JSON.stringify({
      version: 2,
      rows: [],
      padding: "界".repeat(QUOTE_SELECTION_MAX_BYTES)
    });

    expect(new TextEncoder().encode(oversized).byteLength).toBeGreaterThan(
      QUOTE_SELECTION_MAX_BYTES
    );
    expect(parseStoredQuoteSelection(oversized)).toEqual({
      ok: false,
      code: "byte-limit"
    });

    const oversizedCanonical = normalizeQuoteSelection({
      version: 2,
      rows: Array.from({ length: QUOTE_SELECTION_MAX_ROWS }, (_value, index) => ({
        kind: "manual",
        key: `manual-${index}`,
        description: "界".repeat(180),
        quantity: 1,
        notes: "界".repeat(500),
        source: "manual",
        order: index
      }))
    });

    expect(oversizedCanonical).toEqual({ ok: false, code: "byte-limit" });
  });

  it.each([1, 99])("accepts quantity boundary %i", (quantity) => {
    const result = addCatalogueSelection(
      emptyQuoteSelection(),
      "lounge-chair",
      quantity
    );

    expect(result.ok && result.value.rows[0]?.quantity).toBe(quantity);
  });

  it.each([0, 100, 1.5, Number.POSITIVE_INFINITY, Number.NaN])(
    "rejects invalid stored quantity %s",
    (quantity) => {
      expect(
        normalizeQuoteSelection({
          version: 2,
          rows: [catalogue("lounge-chair", quantity, 0)]
        })
      ).toEqual({ ok: false, code: "invalid-selection" });
    }
  );

  it("rejects exponent input after JSON parsing because it exceeds the range", () => {
    expect(
      parseStoredQuoteSelection(
        '{"version":2,"rows":[{"kind":"catalogue","reference":"chair","quantity":1e2,"source":"catalogue","order":0}]}'
      )
    ).toEqual({ ok: false, code: "invalid-selection" });
  });

  it("aggregates duplicate catalogue rows while preserving first-seen order", () => {
    const result = normalizeQuoteSelection({
      version: 2,
      rows: [
        catalogue("chair", 40, 4),
        catalogue("table", 1, 5),
        catalogue("chair", 50, 6)
      ]
    });

    expect(result.ok && result.value.rows).toEqual([
      catalogue("chair", 90, 0),
      catalogue("table", 1, 1)
    ]);
  });

  it("rejects aggregate overflow without changing the prior valid selection", () => {
    const prior = normalizeQuoteSelection({
      version: 2,
      rows: [catalogue("chair", 99, 0)]
    });
    expect(prior.ok).toBe(true);
    const snapshot = prior.ok ? JSON.stringify(prior.value) : "";

    expect(
      addCatalogueSelection(
        prior.ok ? prior.value : emptyQuoteSelection(),
        "chair",
        1
      )
    ).toEqual({ ok: false, code: "quantity-overflow" });
    expect(prior.ok && JSON.stringify(prior.value)).toBe(snapshot);
  });

  it("keeps manual rows distinct and bounded", () => {
    const first = createManualSelectionRow({
      key: "manual-a",
      description: "Custom reception counter",
      quantity: 1,
      notes: "Team to review dimensions",
      order: 0
    });
    const second = createManualSelectionRow({
      key: "manual-b",
      description: "Custom reception counter",
      quantity: 1,
      order: 1
    });
    const result = normalizeQuoteSelection({
      version: 2,
      rows: [first, second]
    });

    expect(result.ok && result.value.rows).toHaveLength(2);
    expect(
      result.ok &&
        result.value.rows.map((row) =>
          row.kind === "manual" ? row.key : undefined
        )
    ).toEqual(["manual-a", "manual-b"]);
    expect(
      createManualSelectionRow({
        key: "manual-c",
        description: "x".repeat(181),
        quantity: 1,
        order: 0
      })
    ).toBeUndefined();
  });

  it("treats zero only as an explicit remove action", () => {
    const selected = addCatalogueSelection(
      emptyQuoteSelection(),
      "chair",
      1
    );
    expect(selected.ok).toBe(true);

    const removed = replaceSelectionQuantity(
      selected.ok ? selected.value : emptyQuoteSelection(),
      0,
      0
    );

    expect(removed).toEqual({ ok: true, value: emptyQuoteSelection() });
  });

  it("rejects forged fields rather than trusting labels or record claims", () => {
    for (const forged of [
      { label: "Forged label" },
      { id: "00000000-0000-0000-0000-000000000000" },
      { price: 1 },
      { availability: "available" },
      { workspaceId: "forged" }
    ]) {
      expect(
        normalizeQuoteSelection({
          version: 2,
          rows: [{ ...catalogue("chair", 1, 0), ...forged }]
        })
      ).toEqual({ ok: false, code: "invalid-selection" });
    }
  });
});
