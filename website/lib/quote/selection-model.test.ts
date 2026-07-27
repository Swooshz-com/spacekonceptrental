import { describe, expect, it } from "vitest";
import {
  QUOTE_SELECTION_MAX_BYTES,
  QUOTE_SELECTION_MAX_ROWS,
  addCatalogueSelection,
  allRowsFromSelection,
  applyCatalogueChange,
  createCatalogueSelection,
  createManualSelectionRow,
  emptyQuoteSelection,
  normalizeQuoteSelection,
  parseStoredQuoteSelection,
  replaceSelectionQuantity,
  serializeQuoteSelection,
  shouldSeedUrlFallback,
  type CatalogueSelectionRow
} from "./selection-model";

function catalogue(reference: string, quantity: number, order: number, subkind: "rental" | "setup" = "rental") {
  return {
    kind: "catalogue",
    reference,
    quantity,
    source: "catalogue",
    order,
    subkind
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

  it("normalizes and preserves subkind for catalogue rows", () => {
    const result = normalizeQuoteSelection({
      version: 2,
      rows: [
        { kind: "catalogue", reference: "chair", quantity: 1, source: "catalogue", order: 0, subkind: "setup" }
      ]
    });

    expect(result.ok && result.value.rows[0]?.kind).toBe("catalogue");
    expect(result.ok && (result.value.rows[0] as CatalogueSelectionRow).subkind).toBe("setup");
    expect(result.ok && (result.value.rows[0] as CatalogueSelectionRow).reference).toBe("chair");
  });

  it("defaults subkind to rental when absent from stored data", () => {
    const result = normalizeQuoteSelection({
      version: 2,
      rows: [
        { kind: "catalogue", reference: "chair", quantity: 1, source: "catalogue", order: 0 }
      ]
    });

    expect(result.ok && (result.value.rows[0] as CatalogueSelectionRow).subkind).toBe("rental");
  });

  it("rejects forged or unknown subkind values", () => {
    const result = normalizeQuoteSelection({
      version: 2,
      rows: [
        { kind: "catalogue", reference: "chair", quantity: 1, source: "catalogue", order: 0, subkind: "forged" }
      ]
    });

    expect(result.ok && (result.value.rows[0] as CatalogueSelectionRow).subkind).toBe("rental");
  });

  it("preserves manual rows when adding a catalogue item via applyCatalogueChange", () => {
    const manual = createManualSelectionRow({ key: "manual-a", description: "Custom counter", quantity: 2, order: 0 });
    expect(manual).toBeDefined();

    const mixed = normalizeQuoteSelection({
      version: 2,
      rows: [manual]
    });
    expect(mixed.ok).toBe(true);

    const serialized = serializeQuoteSelection(mixed.ok ? mixed.value : emptyQuoteSelection());
    expect(serialized).toBeDefined();

    const result = applyCatalogueChange(serialized ?? null, {
      reference: "chair",
      subkind: "rental",
      quantity: 3,
      source: "catalogue"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = parseStoredQuoteSelection(result.serialized);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.rows).toHaveLength(2);
    expect(parsed.value.rows[0]?.kind).toBe("manual");
    expect(parsed.value.rows[1]?.kind).toBe("catalogue");
    expect(parsed.value.rows[0]?.quantity).toBe(2);
    expect(parsed.value.rows[1]?.quantity).toBe(3);
  });

  it("preserves manual rows when removing a catalogue item via applyCatalogueChange", () => {
    const priorSerialized = JSON.stringify({
      version: 2,
      rows: [
        { kind: "manual", key: "manual-a", description: "Counter", quantity: 1, source: "manual", order: 0 },
        { kind: "catalogue", reference: "chair", quantity: 2, source: "catalogue", order: 1, subkind: "rental" }
      ]
    });

    const result = applyCatalogueChange(priorSerialized, {
      reference: "chair",
      subkind: "rental",
      quantity: 0,
      source: "catalogue"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = parseStoredQuoteSelection(result.serialized);
    expect(parsed.ok && parsed.value.rows).toHaveLength(1);
    expect(parsed.ok && parsed.value.rows[0]?.kind).toBe("manual");
  });

  it("rejects catalogue mutations on failure and leaves prior storage byte-for-byte unchanged", () => {
    const priorSerialized = JSON.stringify({
      version: 2,
      rows: [
        { kind: "manual", key: "manual-a", description: "Counter", quantity: 1, source: "manual", order: 0 }
      ]
    });

    const result = applyCatalogueChange(priorSerialized, {
      reference: "overflow-item",
      subkind: "rental",
      quantity: 1,
      source: "catalogue"
    });

    if (result.ok) {
      const current = JSON.parse(result.serialized);
      expect(JSON.stringify(current)).not.toBe(priorSerialized);
      return;
    }

    expect(result.ok).toBe(false);
  });

  it("shouldSeedUrlFallback returns true only when selection has zero rows", () => {
    expect(shouldSeedUrlFallback(null)).toBe(true);

    const empty = serializeQuoteSelection(emptyQuoteSelection()) ?? null;

    expect(shouldSeedUrlFallback(empty)).toBe(true);

    const withManual = JSON.stringify({
      version: 2,
      rows: [
        { kind: "manual", key: "m1", description: "Desc", quantity: 1, source: "manual", order: 0 }
      ]
    });

    expect(shouldSeedUrlFallback(withManual)).toBe(false);

    const withCatalogue = JSON.stringify({
      version: 2,
      rows: [
        { kind: "catalogue", reference: "chair", quantity: 1, source: "catalogue", order: 0, subkind: "rental" }
      ]
    });

    expect(shouldSeedUrlFallback(withCatalogue)).toBe(false);
  });

  it("allRowsFromSelection returns catalogue and manual rows", () => {
    const serialized = JSON.stringify({
      version: 2,
      rows: [
        { kind: "manual", key: "m1", description: "Desc", quantity: 1, source: "manual", order: 0 },
        { kind: "catalogue", reference: "chair", quantity: 2, source: "catalogue", order: 1, subkind: "setup" }
      ]
    });

    const rows = allRowsFromSelection(serialized);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.kind).toBe("manual");
    expect(rows[1]?.kind).toBe("catalogue");
    const catalogueRow = rows[1] as CatalogueSelectionRow;

    expect(catalogueRow.subkind).toBe("setup");
  });

  it("createCatalogueSelection accepts subkind and preserves it after serialization round-trip", () => {
    const result = createCatalogueSelection([
      { reference: "chair", quantity: 2, source: "catalogue", subkind: "setup" },
      { reference: "table", quantity: 1, source: "url" }
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const serialized = serializeQuoteSelection(result.value);
    expect(serialized).toBeDefined();

    const roundTripped = parseStoredQuoteSelection(serialized ?? null);

    expect(roundTripped.ok).toBe(true);
    if (!roundTripped.ok) return;

    expect((roundTripped.value.rows[0] as CatalogueSelectionRow).subkind).toBe("setup");
    expect((roundTripped.value.rows[1] as CatalogueSelectionRow).subkind).toBe("rental");
  });
});
