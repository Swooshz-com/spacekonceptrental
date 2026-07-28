import { describe, expect, it } from "vitest";
import {
  QUOTE_SELECTION_MAX_BYTES,
  QUOTE_SELECTION_MAX_ROWS,
  addCatalogueSelection,
  allRowsFromSelection,
  applyCatalogueChange,
  commitQuoteSelectionChange,
  createCatalogueSelection,
  createManualSelectionRow,
  deriveCanonicalIdentitiesFromCatalogue,
  emptyQuoteSelection,
  normalizeQuoteSelection,
  parseStoredQuoteSelection,
  replaceSelectionQuantity,
  rowSatisfiesCanonicalIdentity,
  selectionSatisfiesRequiredSelection,
  serializeQuoteSelection,
  shouldSeedUrlFallback,
  type CanonicalCatalogueIdentity,
  type CatalogueSelectionRow,
  type ManualSelectionRow,
  type QuoteSelectionStorageAdapter
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

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.code).toBe("invalid-selection");
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

  describe("canonical kind enforcement", () => {
    it("rejects explicit non-rental non-setup subkind values", () => {
      for (const forged of ["unknown", "RENTAL", "Setup", "", 1, null, true, {}, []]) {
        const result = normalizeQuoteSelection({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "chair",
              quantity: 1,
              source: "catalogue",
              order: 0,
              subkind: forged === null ? null : forged
            }
          ]
        });

        expect(result.ok).toBe(false);
      }
    });

    it("accepts explicit rental and setup subkind values", () => {
      const rental = normalizeQuoteSelection({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair", quantity: 1, source: "catalogue", order: 0, subkind: "rental" }
        ]
      });

      expect(rental.ok && (rental.value.rows[0] as CatalogueSelectionRow).subkind).toBe("rental");

      const setup = normalizeQuoteSelection({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair", quantity: 1, source: "catalogue", order: 0, subkind: "setup" }
        ]
      });

      expect(setup.ok && (setup.value.rows[0] as CatalogueSelectionRow).subkind).toBe("setup");
    });

    it("does not aggregate same-slug rows with different subkinds", () => {
      const result = normalizeQuoteSelection({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair", quantity: 30, source: "catalogue", order: 0, subkind: "rental" },
          { kind: "catalogue", reference: "chair", quantity: 40, source: "catalogue", order: 1, subkind: "setup" }
        ]
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.rows).toHaveLength(2);
      expect((result.value.rows[0] as CatalogueSelectionRow).quantity).toBe(30);
      expect((result.value.rows[0] as CatalogueSelectionRow).subkind).toBe("rental");
      expect((result.value.rows[1] as CatalogueSelectionRow).quantity).toBe(40);
      expect((result.value.rows[1] as CatalogueSelectionRow).subkind).toBe("setup");
    });
  });

  describe("explicit quantity semantics", () => {
    it("replaces existing row quantity with explicit value", () => {
      const serialized = JSON.stringify({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair", quantity: 5, source: "catalogue", order: 0, subkind: "rental" }
        ]
      });

      const result = applyCatalogueChange(serialized, {
        reference: "chair",
        subkind: "rental",
        quantity: 37,
        source: "catalogue"
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.rows[0]?.quantity).toBe(37);
    });

    it("increments existing row by one when quantity is undefined", () => {
      const serialized = JSON.stringify({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair", quantity: 5, source: "catalogue", order: 0, subkind: "rental" }
        ]
      });

      const result = applyCatalogueChange(serialized, {
        reference: "chair",
        subkind: "rental",
        source: "catalogue"
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.rows[0]?.quantity).toBe(6);
    });

    it("creates new row with quantity 1 when quantity is undefined", () => {
      const result = applyCatalogueChange(null, {
        reference: "chair",
        subkind: "rental",
        source: "catalogue"
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.rows).toHaveLength(1);
      expect(result.value.rows[0]?.quantity).toBe(1);
    });

    it("creates new row with exact supplied quantity", () => {
      const result = applyCatalogueChange(null, {
        reference: "chair",
        subkind: "rental",
        quantity: 42,
        source: "catalogue"
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.rows).toHaveLength(1);
      expect(result.value.rows[0]?.quantity).toBe(42);
    });

    it.each([100, 1.5, -1, Number.POSITIVE_INFINITY, Number.NaN])(
      "rejects invalid explicit quantity %s",
      (quantity) => {
        const result = applyCatalogueChange(null, {
          reference: "chair",
          subkind: "rental",
          quantity,
          source: "catalogue"
        });

        expect(result.ok).toBe(false);
        expect(result.ok ? undefined : result.code).toBe("quantity-overflow");
      }
    );
  });

  describe("transactional fail-closed writes", () => {
    it("returns error and does not mutate on invalid subkind in stored data", () => {
      const malformed = JSON.stringify({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair", quantity: 1, source: "catalogue", order: 0, subkind: "forged" }
        ]
      });

      const result = applyCatalogueChange(malformed, {
        reference: "chair",
        subkind: "rental",
        quantity: 2,
        source: "catalogue"
      });

      expect(result.ok).toBe(false);
    });

    it("returns error for unknown version without mutating", () => {
      const result = applyCatalogueChange('{"version":1,"rows":[]}', {
        reference: "chair",
        subkind: "rental",
        source: "catalogue"
      });

      expect(result.ok).toBe(false);
    });

    it("returns error for row limit without mutating", () => {
      const rows = Array.from({ length: QUOTE_SELECTION_MAX_ROWS }, (_, i) => ({
        kind: "catalogue" as const,
        reference: `item-${i}`,
        quantity: 1,
        source: "catalogue" as const,
        order: i,
        subkind: "rental" as const
      }));

      const serialized = JSON.stringify({ version: 2, rows });

      const result = applyCatalogueChange(serialized, {
        reference: "new-item",
        subkind: "rental",
        source: "catalogue"
      });

      expect(result.ok).toBe(false);
    });

    it("returns error for quantity overflow on increment without mutating", () => {
      const serialized = JSON.stringify({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair", quantity: 99, source: "catalogue", order: 0, subkind: "rental" }
        ]
      });

      const result = applyCatalogueChange(serialized, {
        reference: "chair",
        subkind: "rental",
        source: "catalogue"
      });

      expect(result.ok).toBe(false);
      expect(result.ok ? undefined : result.code).toBe("quantity-overflow");
    });
  });

  describe("stable mixed-row order", () => {
    it("preserves manual row position when incrementing a later catalogue row", () => {
      const serialized = JSON.stringify({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair-a", quantity: 1, source: "catalogue", order: 0, subkind: "rental" },
          { kind: "manual", key: "manual-b", description: "Custom B", quantity: 1, source: "manual", order: 1 },
          { kind: "catalogue", reference: "chair-c", quantity: 1, source: "catalogue", order: 2, subkind: "rental" }
        ]
      });

      const result = applyCatalogueChange(serialized, {
        reference: "chair-c",
        subkind: "rental",
        source: "catalogue"
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.rows).toHaveLength(3);
      expect(result.value.rows[0]?.kind).toBe("catalogue");
      expect((result.value.rows[0] as CatalogueSelectionRow).reference).toBe("chair-a");
      expect(result.value.rows[1]?.kind).toBe("manual");
      expect(result.value.rows[2]?.kind).toBe("catalogue");
      expect((result.value.rows[2] as CatalogueSelectionRow).reference).toBe("chair-c");
      expect(result.value.rows[2]?.quantity).toBe(2);
    });

    it("preserves order when removing a middle catalogue row", () => {
      const serialized = JSON.stringify({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair-a", quantity: 1, source: "catalogue", order: 0, subkind: "rental" },
          { kind: "manual", key: "manual-b", description: "Custom B", quantity: 1, source: "manual", order: 1 },
          { kind: "catalogue", reference: "chair-c", quantity: 1, source: "catalogue", order: 2, subkind: "rental" }
        ]
      });

      const result = applyCatalogueChange(serialized, {
        reference: "chair-a",
        subkind: "rental",
        quantity: 0,
        source: "catalogue"
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.rows).toHaveLength(2);
      expect(result.value.rows[0]?.kind).toBe("manual");
      expect(result.value.rows[1]?.kind).toBe("catalogue");
      expect((result.value.rows[1] as CatalogueSelectionRow).reference).toBe("chair-c");
    });

    it("preserves manual-before-catalogue order", () => {
      const serialized = JSON.stringify({
        version: 2,
        rows: [
          { kind: "manual", key: "manual-a", description: "A", quantity: 1, source: "manual", order: 0 },
          { kind: "catalogue", reference: "chair-b", quantity: 1, source: "catalogue", order: 1, subkind: "rental" },
          { kind: "manual", key: "manual-c", description: "C", quantity: 1, source: "manual", order: 2 }
        ]
      });

      const result = applyCatalogueChange(serialized, {
        reference: "chair-b",
        subkind: "rental",
        source: "catalogue"
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.rows).toHaveLength(3);
      expect(result.value.rows[0]?.kind).toBe("manual");
      expect(result.value.rows[1]?.kind).toBe("catalogue");
      expect(result.value.rows[2]?.kind).toBe("manual");
    });

    it("appends new rows after final current row", () => {
      const serialized = JSON.stringify({
        version: 2,
        rows: [
          { kind: "catalogue", reference: "chair-a", quantity: 1, source: "catalogue", order: 0, subkind: "rental" }
        ]
      });

      const result = applyCatalogueChange(serialized, {
        reference: "chair-d",
        subkind: "rental",
        quantity: 1,
        source: "catalogue"
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.rows).toHaveLength(2);
      expect((result.value.rows[0] as CatalogueSelectionRow).reference).toBe("chair-a");
      expect((result.value.rows[1] as CatalogueSelectionRow).reference).toBe("chair-d");
    });
  });
});

describe("Design Lock A — canonical (reference, kind) identity", () => {
  it("derives canonical identities from server-owned catalogue data and deduplicates by (reference, kind)", () => {
    const identities = deriveCanonicalIdentitiesFromCatalogue(
      [
        { slug: "chair-a" },
        { slug: "chair-a" },
        { slug: "lounge-table" },
        { slug: "metropolitan-gala" }
      ],
      (product) => product.slug === "metropolitan-gala"
    );

    expect(identities).toEqual([
      { reference: "chair-a", kind: "rental" },
      { reference: "lounge-table", kind: "rental" },
      { reference: "metropolitan-gala", kind: "setup" }
    ]);
  });

  it("rejects catalogue entries with unsafe slugs when deriving canonical identities", () => {
    const identities = deriveCanonicalIdentitiesFromCatalogue(
      [
        { slug: "Not_Safe" },
        { slug: "lounge chair" },
        { slug: "../escape" }
      ],
      () => false
    );

    expect(identities).toEqual([]);
  });

  it("rowSatisfiesCanonicalIdentity accepts rental row when (reference, kind) match a rental identity", () => {
    const row: CatalogueSelectionRow = {
      kind: "catalogue",
      reference: "chair-a",
      quantity: 1,
      source: "catalogue",
      order: 0,
      subkind: "rental"
    };
    const identities: CanonicalCatalogueIdentity[] = [
      { reference: "chair-a", kind: "rental" }
    ];
    expect(rowSatisfiesCanonicalIdentity(row, identities)).toBe(true);
  });

  it("rowSatisfiesCanonicalIdentity accepts setup row when (reference, kind) match a setup identity", () => {
    const row: CatalogueSelectionRow = {
      kind: "catalogue",
      reference: "metropolitan-gala",
      quantity: 1,
      source: "catalogue",
      order: 0,
      subkind: "setup"
    };
    const identities: CanonicalCatalogueIdentity[] = [
      { reference: "metropolitan-gala", kind: "setup" }
    ];
    expect(rowSatisfiesCanonicalIdentity(row, identities)).toBe(true);
  });

  it("rowSatisfiesCanonicalIdentity rejects rental row stored as setup when only a rental identity exists", () => {
    const row: CatalogueSelectionRow = {
      kind: "catalogue",
      reference: "chair-a",
      quantity: 1,
      source: "catalogue",
      order: 0,
      subkind: "setup"
    };
    const identities: CanonicalCatalogueIdentity[] = [
      { reference: "chair-a", kind: "rental" }
    ];
    expect(rowSatisfiesCanonicalIdentity(row, identities)).toBe(false);
  });

  it("rowSatisfiesCanonicalIdentity rejects setup row stored as rental when only a setup identity exists", () => {
    const row: CatalogueSelectionRow = {
      kind: "catalogue",
      reference: "metropolitan-gala",
      quantity: 1,
      source: "catalogue",
      order: 0,
      subkind: "rental"
    };
    const identities: CanonicalCatalogueIdentity[] = [
      { reference: "metropolitan-gala", kind: "setup" }
    ];
    expect(rowSatisfiesCanonicalIdentity(row, identities)).toBe(false);
  });

  it("rowSatisfiesCanonicalIdentity rejects unknown explicit kinds", () => {
    const row: CatalogueSelectionRow = {
      kind: "catalogue",
      reference: "chair-a",
      quantity: 1,
      source: "catalogue",
      order: 0,
      // simulate forged kind that survived parse via legacy path
      subkind: "unknown" as CatalogueSelectionRow["subkind"]
    };
    const identities: CanonicalCatalogueIdentity[] = [
      { reference: "chair-a", kind: "rental" }
    ];
    expect(rowSatisfiesCanonicalIdentity(row, identities)).toBe(false);
  });

  it("rowSatisfiesCanonicalIdentity treats same-reference/different-kind rows as distinct", () => {
    const rentalRow: CatalogueSelectionRow = {
      kind: "catalogue",
      reference: "shared-slug",
      quantity: 1,
      source: "catalogue",
      order: 0,
      subkind: "rental"
    };
    const setupRow: CatalogueSelectionRow = {
      kind: "catalogue",
      reference: "shared-slug",
      quantity: 1,
      source: "catalogue",
      order: 1,
      subkind: "setup"
    };
    const identities: CanonicalCatalogueIdentity[] = [
      { reference: "shared-slug", kind: "rental" },
      { reference: "shared-slug", kind: "setup" }
    ];
    expect(rowSatisfiesCanonicalIdentity(rentalRow, identities)).toBe(true);
    expect(rowSatisfiesCanonicalIdentity(setupRow, identities)).toBe(true);
  });

  it("selectionSatisfiesRequiredSelection returns true for a manual-only selection", () => {
    const serialized = JSON.stringify({
      version: 2,
      rows: [
        {
          kind: "manual",
          key: "manual-a",
          description: "Custom counter",
          quantity: 1,
          source: "manual",
          order: 0
        }
      ]
    });
    expect(selectionSatisfiesRequiredSelection(serialized, [])).toBe(true);
  });

  it("selectionSatisfiesRequiredSelection returns true only when a catalogue row matches a canonical identity", () => {
    const serialized = JSON.stringify({
      version: 2,
      rows: [
        {
          kind: "catalogue",
          reference: "chair-a",
          quantity: 1,
          source: "catalogue",
          order: 0,
          subkind: "rental"
        }
      ]
    });
    expect(
      selectionSatisfiesRequiredSelection(serialized, [
        { reference: "chair-a", kind: "rental" }
      ])
    ).toBe(true);
    expect(
      selectionSatisfiesRequiredSelection(serialized, [
        { reference: "chair-a", kind: "setup" }
      ])
    ).toBe(false);
    expect(selectionSatisfiesRequiredSelection(serialized, [])).toBe(false);
  });

  it("selectionSatisfiesRequiredSelection returns false for malformed storage", () => {
    expect(
      selectionSatisfiesRequiredSelection('{"version":1,"rows":[]}', [])
    ).toBe(false);
    expect(
      selectionSatisfiesRequiredSelection("not-json", [])
    ).toBe(false);
  });
});

describe("Design Lock C — single complete-selection storage transaction", () => {
  function makeMemoryStorage() {
    let bytes: string | null = null;
    let dispatchCount = 0;
    return {
      storage: {
        read: () => bytes,
        write: (next: string) => {
          bytes = next;
        },
        dispatchSuccess: () => {
          dispatchCount += 1;
        }
      } as QuoteSelectionStorageAdapter,
      getBytes: () => bytes,
      getDispatchCount: () => dispatchCount
    };
  }

  function setupWithCatalogueRow(
    reference: string,
    subkind: "rental" | "setup",
    quantity = 1
  ) {
    return JSON.stringify({
      version: 2,
      rows: [
        {
          kind: "catalogue",
          reference,
          quantity,
          source: "catalogue",
          order: 0,
          subkind
        }
      ]
    });
  }

  it("preserves exact original bytes when the change is malformed", () => {
    const store = makeMemoryStorage();
    const original = "not-json";
    store.storage.write(original);
    const result = commitQuoteSelectionChange(store.storage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.originalBytes).toBe(original);
    expect(result.code).toBe("invalid-selection");
    expect(store.getBytes()).toBe(original);
    expect(store.getDispatchCount()).toBe(0);
  });

  it("preserves exact original bytes when the version is unsupported", () => {
    const store = makeMemoryStorage();
    const original = JSON.stringify({ version: 1, rows: [] });
    store.storage.write(original);
    const result = commitQuoteSelectionChange(store.storage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.originalBytes).toBe(original);
    expect(store.getBytes()).toBe(original);
    expect(store.getDispatchCount()).toBe(0);
  });

  it("preserves exact original bytes when the canonical row count is exceeded", () => {
    const store = makeMemoryStorage();
    const rows = Array.from({ length: QUOTE_SELECTION_MAX_ROWS }, (_, i) => ({
      kind: "catalogue" as const,
      reference: `item-${i}`,
      quantity: 1,
      source: "catalogue" as const,
      order: i,
      subkind: "rental" as const
    }));
    const original = JSON.stringify({ version: 2, rows });
    store.storage.write(original);
    const result = commitQuoteSelectionChange(store.storage, {
      kind: "catalogue",
      reference: "new-item",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.originalBytes).toBe(original);
    expect(store.getBytes()).toBe(original);
    expect(store.getDispatchCount()).toBe(0);
  });

  it("preserves exact original bytes when quantity overflow is rejected", () => {
    const store = makeMemoryStorage();
    const original = setupWithCatalogueRow("chair", "rental", 99);
    store.storage.write(original);
    const result = commitQuoteSelectionChange(store.storage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("quantity-overflow");
    expect(result.originalBytes).toBe(original);
    expect(store.getBytes()).toBe(original);
    expect(store.getDispatchCount()).toBe(0);
  });

  it("preserves exact original bytes when the byte limit is exceeded", () => {
    const store = makeMemoryStorage();
    const oversized = JSON.stringify({
      version: 2,
      rows: Array.from({ length: QUOTE_SELECTION_MAX_ROWS }, (_, i) => ({
        kind: "manual",
        key: `manual-${i}`,
        description: "界".repeat(180),
        quantity: 1,
        notes: "界".repeat(500),
        source: "manual",
        order: i
      }))
    });
    const original = JSON.stringify({ version: 2, rows: [] });
    store.storage.write(original);
    expect(oversized.length).toBeGreaterThan(0);
    const result = commitQuoteSelectionChange(store.storage, {
      kind: "replace",
      selection: JSON.parse(oversized)
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("byte-limit");
    expect(result.originalBytes).toBe(original);
    expect(store.getBytes()).toBe(original);
    expect(store.getDispatchCount()).toBe(0);
  });

  it("preserves original bytes when storage write throws", () => {
    const original = setupWithCatalogueRow("chair", "rental", 1);
    const throwingStorage: QuoteSelectionStorageAdapter = {
      read: () => original,
      write: () => {
        throw new Error("quota");
      }
    };
    const result = commitQuoteSelectionChange(throwingStorage, {
      kind: "catalogue",
      reference: "table",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("storage-exception");
    expect(result.originalBytes).toBe(original);
  });

  it("restores original bytes and reports failure on synthetic read-back mismatch", () => {
    const originalSerialized = setupWithCatalogueRow("chair", "rental", 1);
    let stored: string | null = originalSerialized;
    let writeCount = 0;
    const tamperedStorage: QuoteSelectionStorageAdapter = {
      read: () => stored,
      write: (next: string) => {
        writeCount += 1;
        if (writeCount === 1) {
          // The transaction's intended write appears to succeed but a
          // concurrent writer replaces it with tampered bytes.
          stored = '{"tampered":true}';
          return;
        }
        // Restoration writes through to the underlying byte store.
        stored = next;
      }
    };
    const result = commitQuoteSelectionChange(tamperedStorage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("read-back-mismatch");
    expect(result.originalBytes).toBe(originalSerialized);
    expect(stored).toBe(originalSerialized);
  });

  it("restores original bytes and reports restore-failed when restoration also fails", () => {
    let stored: string | null = setupWithCatalogueRow("chair", "rental", 1);
    let writes = 0;
    const tamperedStorage: QuoteSelectionStorageAdapter = {
      read: () => stored,
      write: (next: string) => {
        writes += 1;
        if (writes === 1) {
          // First write: simulate concurrent corruption
          stored = '{"tampered":true}';
          return;
        }
        // Restoration write also throws
        throw new Error("quota exhausted during restore");
      }
    };
    const result = commitQuoteSelectionChange(tamperedStorage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("restore-failed");
    expect(result.originalBytes).toBe(
      setupWithCatalogueRow("chair", "rental", 1)
    );
  });

  it("commits and dispatches exactly one success event on a valid catalogue add", () => {
    const store = makeMemoryStorage();
    const result = commitQuoteSelectionChange(store.storage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rows).toHaveLength(1);
    expect(result.value.rows[0]?.kind).toBe("catalogue");
    expect(store.getBytes()).toBe(result.serialized);
    expect(store.getDispatchCount()).toBe(1);
  });

  it("supports manual row add and manual row remove through the same transaction", () => {
    const store = makeMemoryStorage();
    const manualRow: ManualSelectionRow = {
      kind: "manual",
      key: "manual-a",
      description: "Custom counter",
      quantity: 1,
      source: "manual",
      order: 0
    };
    const added = commitQuoteSelectionChange(store.storage, {
      kind: "manual-add",
      row: manualRow
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.value.rows[0]?.kind).toBe("manual");
    expect(store.getDispatchCount()).toBe(1);

    const removed = commitQuoteSelectionChange(store.storage, {
      kind: "manual-remove",
      key: "manual-a"
    });
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.value.rows).toEqual([]);
    expect(store.getDispatchCount()).toBe(2);
  });

  it("supports clear and replace through the same transaction", () => {
    const store = makeMemoryStorage();
    const cleared = commitQuoteSelectionChange(store.storage, { kind: "clear" });
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.value.rows).toEqual([]);

    const replaced = commitQuoteSelectionChange(store.storage, {
      kind: "replace",
      selection: {
        version: 2,
        rows: [
          {
            kind: "manual",
            key: "manual-b",
            description: "Counter",
            quantity: 2,
            source: "manual",
            order: 0
          }
        ]
      }
    });
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) return;
    expect(replaced.value.rows).toHaveLength(1);
  });

  it("serializes once and reads back exact bytes", () => {
    const store = makeMemoryStorage();
    const result = commitQuoteSelectionChange(store.storage, {
      kind: "catalogue",
      reference: "chair-a",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bytes).toBe(new TextEncoder().encode(result.serialized).byteLength);
    expect(store.getBytes()).toBe(result.serialized);
  });

  it("returns the committed parsed selection and never claims byte preservation on restore failure", () => {
    let stored: string | null = setupWithCatalogueRow("chair", "rental", 1);
    let writes = 0;
    const tamperedStorage: QuoteSelectionStorageAdapter = {
      read: () => stored,
      write: () => {
        writes += 1;
        if (writes === 1) {
          stored = '{"tampered":true}';
          return;
        }
        throw new Error("cannot restore");
      }
    };
    const result = commitQuoteSelectionChange(tamperedStorage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      quantity: 2,
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("restore-failed");
    expect(result.originalBytes).toBe(
      setupWithCatalogueRow("chair", "rental", 1)
    );
  });

  it("removes the key and verifies null read-back when original state was absent and write mismatch triggers restore", () => {
    let stored: string | null = null;
    let writeCount = 0;
    const storage: QuoteSelectionStorageAdapter = {
      read: () => stored,
      write: (next: string) => {
        writeCount += 1;
        if (writeCount === 1) {
          stored = '{"tampered":true}';
          return;
        }
        stored = next;
      },
      remove: () => {
        stored = null;
      }
    };
    const result = commitQuoteSelectionChange(storage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("read-back-mismatch");
    expect(result.originalBytes).toBe(null);
    expect(stored).toBe(null);
  });

  it("returns restore-failed when null-state removal throws during mismatch recovery", () => {
    let stored: string | null = null;
    let writeCount = 0;
    const throwingStorage: QuoteSelectionStorageAdapter = {
      read: () => stored,
      write: (next: string) => {
        writeCount += 1;
        if (writeCount === 1) {
          stored = '{"tampered":true}';
          return;
        }
        stored = next;
      },
      remove: () => {
        throw new Error("quota");
      }
    };
    const result = commitQuoteSelectionChange(throwingStorage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("restore-failed");
    expect(result.originalBytes).toBe(null);
  });

  it("returns restore-failed when null-state removal succeeds but key remains", () => {
    let stored: string | null = null;
    let writeCount = 0;
    const noOpRemoveStorage: QuoteSelectionStorageAdapter = {
      read: () => stored,
      write: (next: string) => {
        writeCount += 1;
        if (writeCount === 1) {
          stored = '{"tampered":true}';
          return;
        }
        stored = next;
      },
      remove: () => {
        stored = '{"stale":true}';
      }
    };
    const result = commitQuoteSelectionChange(noOpRemoveStorage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("restore-failed");
    expect(result.originalBytes).toBe(null);
  });

  it("returns restore-failed when adapter has no remove method and original state was null", () => {
    let stored: string | null = null;
    let writeCount = 0;
    const noRemoveStorage: QuoteSelectionStorageAdapter = {
      read: () => stored,
      write: (next: string) => {
        writeCount += 1;
        if (writeCount === 1) {
          stored = '{"tampered":true}';
          return;
        }
        stored = next;
      }
    };
    const result = commitQuoteSelectionChange(noRemoveStorage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("restore-failed");
    expect(result.originalBytes).toBe(null);
  });

  it("dispatches no success event when null-state restoration fails", () => {
    let dispatchCount = 0;
    const storage: QuoteSelectionStorageAdapter = {
      read: () => null,
      write: () => {},
      remove: () => {
        throw new Error("quota");
      },
      dispatchSuccess: () => {
        dispatchCount += 1;
      }
    };
    const result = commitQuoteSelectionChange(storage, {
      kind: "catalogue",
      reference: "chair",
      subkind: "rental",
      source: "catalogue"
    });
    expect(result.ok).toBe(false);
    expect(dispatchCount).toBe(0);
  });
});
