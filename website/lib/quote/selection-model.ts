export const QUOTE_SELECTION_VERSION = 2 as const;
export const QUOTE_SELECTION_STORAGE_KEY = "skr.quoteSelection.v2";
export const QUOTE_SELECTION_MAX_ROWS = 20;
export const QUOTE_SELECTION_MAX_BYTES = 8_192;
export const QUOTE_SELECTION_MIN_QUANTITY = 1;
export const QUOTE_SELECTION_MAX_QUANTITY = 99;
export const QUOTE_MANUAL_DESCRIPTION_MAX_LENGTH = 180;
export const QUOTE_MANUAL_NOTES_MAX_LENGTH = 500;

export type CatalogueSelectionSource = "catalogue" | "url";
export type CatalogueSelectionSubkind = "rental" | "setup";

export type CatalogueSelectionRow = {
  kind: "catalogue";
  reference: string;
  quantity: number;
  source: CatalogueSelectionSource;
  order: number;
  subkind: CatalogueSelectionSubkind;
};

export type ManualSelectionRow = {
  kind: "manual";
  key: string;
  description: string;
  quantity: number;
  notes?: string;
  source: "manual";
  order: number;
};

export type QuoteSelectionRow = CatalogueSelectionRow | ManualSelectionRow;

export type QuoteSelection = {
  version: typeof QUOTE_SELECTION_VERSION;
  rows: QuoteSelectionRow[];
};

export type QuoteSelectionErrorCode =
  | "invalid-selection"
  | "raw-row-limit"
  | "canonical-row-limit"
  | "quantity-overflow"
  | "byte-limit";

export type QuoteSelectionResult =
  | { ok: true; value: QuoteSelection }
  | { ok: false; code: QuoteSelectionErrorCode };

const publicReferencePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const opaqueKeyPattern = /^[A-Za-z0-9_-]{1,80}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = []
) {
  const keys = Object.keys(value);
  const allowed = new Set([...required, ...optional]);

  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    keys.every((key) => allowed.has(key))
  );
}

function isQuantity(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= QUOTE_SELECTION_MIN_QUANTITY &&
    value <= QUOTE_SELECTION_MAX_QUANTITY
  );
}

function normalizeOrder(value: unknown) {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : undefined;
}

function normalizeCatalogueRow(
  value: Record<string, unknown>
): CatalogueSelectionRow | undefined {
  if (
    !hasExactKeys(value, [
      "kind",
      "reference",
      "quantity",
      "source",
      "order"
    ], [
      "subkind"
    ]) ||
    value.kind !== "catalogue" ||
    (value.source !== "catalogue" && value.source !== "url") ||
    !isQuantity(value.quantity)
  ) {
    return undefined;
  }

  const reference =
    typeof value.reference === "string"
      ? value.reference.trim().toLowerCase()
      : "";
  const order = normalizeOrder(value.order);
  const subkind: CatalogueSelectionSubkind =
    value.subkind === "setup" ? "setup" : "rental";

  if (!publicReferencePattern.test(reference) || order === undefined) {
    return undefined;
  }

  return {
    kind: "catalogue",
    reference,
    quantity: value.quantity,
    source: value.source,
    order,
    subkind
  };
}

function normalizePlainText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (
    !normalized ||
    normalized.length > maximumLength ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

function normalizeManualRow(
  value: Record<string, unknown>
): ManualSelectionRow | undefined {
  if (
    !hasExactKeys(
      value,
      ["kind", "key", "description", "quantity", "source", "order"],
      ["notes"]
    ) ||
    value.kind !== "manual" ||
    value.source !== "manual" ||
    !isQuantity(value.quantity)
  ) {
    return undefined;
  }

  const key =
    typeof value.key === "string" && opaqueKeyPattern.test(value.key)
      ? value.key
      : undefined;
  const description = normalizePlainText(
    value.description,
    QUOTE_MANUAL_DESCRIPTION_MAX_LENGTH
  );
  const notes =
    value.notes === undefined
      ? undefined
      : normalizePlainText(value.notes, QUOTE_MANUAL_NOTES_MAX_LENGTH);
  const order = normalizeOrder(value.order);

  if (!key || !description || order === undefined) {
    return undefined;
  }

  if (value.notes !== undefined && !notes) {
    return undefined;
  }

  return {
    kind: "manual",
    key,
    description,
    quantity: value.quantity,
    source: "manual",
    order,
    ...(notes ? { notes } : {})
  };
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function emptyQuoteSelection(): QuoteSelection {
  return { version: QUOTE_SELECTION_VERSION, rows: [] };
}

export function normalizeQuoteSelection(value: unknown): QuoteSelectionResult {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["version", "rows"]) ||
    value.version !== QUOTE_SELECTION_VERSION ||
    !Array.isArray(value.rows)
  ) {
    return { ok: false, code: "invalid-selection" };
  }

  if (value.rows.length > QUOTE_SELECTION_MAX_ROWS) {
    return { ok: false, code: "raw-row-limit" };
  }

  const parsedRows: QuoteSelectionRow[] = [];

  for (const row of value.rows) {
    if (!isRecord(row)) {
      return { ok: false, code: "invalid-selection" };
    }

    const normalized =
      row.kind === "catalogue"
        ? normalizeCatalogueRow(row)
        : row.kind === "manual"
          ? normalizeManualRow(row)
          : undefined;

    if (!normalized) {
      return { ok: false, code: "invalid-selection" };
    }

    parsedRows.push(normalized);
  }

  const ordered = parsedRows
    .map((row, index) => ({ row, index }))
    .sort(
      (left, right) =>
        left.row.order - right.row.order || left.index - right.index
    );
  const canonicalRows: QuoteSelectionRow[] = [];
  const catalogueByReference = new Map<string, CatalogueSelectionRow>();

  for (const { row } of ordered) {
    if (row.kind === "manual") {
      canonicalRows.push({ ...row, order: canonicalRows.length });
      continue;
    }

    const existing = catalogueByReference.get(row.reference);

    if (!existing) {
      const next = { ...row, order: canonicalRows.length };
      catalogueByReference.set(row.reference, next);
      canonicalRows.push(next);
      continue;
    }

    const aggregate = existing.quantity + row.quantity;

    if (aggregate > QUOTE_SELECTION_MAX_QUANTITY) {
      return { ok: false, code: "quantity-overflow" };
    }

    existing.quantity = aggregate;
  }

  if (canonicalRows.length > QUOTE_SELECTION_MAX_ROWS) {
    return { ok: false, code: "canonical-row-limit" };
  }

  const selection: QuoteSelection = {
    version: QUOTE_SELECTION_VERSION,
    rows: canonicalRows
  };

  if (byteLength(JSON.stringify(selection)) > QUOTE_SELECTION_MAX_BYTES) {
    return { ok: false, code: "byte-limit" };
  }

  return { ok: true, value: selection };
}

export function parseStoredQuoteSelection(serialized: string | null) {
  if (!serialized) {
    return { ok: true as const, value: emptyQuoteSelection() };
  }

  if (byteLength(serialized) > QUOTE_SELECTION_MAX_BYTES) {
    return { ok: false as const, code: "byte-limit" as const };
  }

  try {
    return normalizeQuoteSelection(JSON.parse(serialized));
  } catch {
    return { ok: false as const, code: "invalid-selection" as const };
  }
}

export function serializeQuoteSelection(selection: QuoteSelection) {
  const normalized = normalizeQuoteSelection(selection);

  return normalized.ok ? JSON.stringify(normalized.value) : undefined;
}

export function addCatalogueSelection(
  selection: QuoteSelection,
  reference: string,
  quantity = 1,
  source: CatalogueSelectionSource = "catalogue",
  subkind: CatalogueSelectionSubkind = "rental"
): QuoteSelectionResult {
  return normalizeQuoteSelection({
    version: QUOTE_SELECTION_VERSION,
    rows: [
      ...selection.rows,
      {
        kind: "catalogue",
        reference,
        quantity,
        source,
        subkind,
        order: selection.rows.length
      }
    ]
  });
}

export function replaceSelectionQuantity(
  selection: QuoteSelection,
  rowIndex: number,
  quantity: number
): QuoteSelectionResult {
  if (
    !Number.isInteger(rowIndex) ||
    rowIndex < 0 ||
    rowIndex >= selection.rows.length
  ) {
    return { ok: false, code: "invalid-selection" };
  }

  if (quantity === 0) {
    return normalizeQuoteSelection({
      ...selection,
      rows: selection.rows.filter((_row, index) => index !== rowIndex)
    });
  }

  return normalizeQuoteSelection({
    ...selection,
    rows: selection.rows.map((row, index) =>
      index === rowIndex ? { ...row, quantity } : row
    )
  });
}

export function createManualSelectionRow(input: {
  key: string;
  description: string;
  quantity: number;
  notes?: string;
  order?: number;
  position?: number;
}): ManualSelectionRow | undefined {
  const { position, ...rowInput } = input;
  const normalized = normalizeQuoteSelection({
    version: QUOTE_SELECTION_VERSION,
    rows: [
      {
        kind: "manual",
        source: "manual",
        ...rowInput,
        order: input.order ?? position
      }
    ]
  });

  if (!normalized.ok || normalized.value.rows[0]?.kind !== "manual") {
    return undefined;
  }

  return {
    ...normalized.value.rows[0],
    order: input.order ?? position ?? 0
  };
}

export function createCatalogueSelection(
  items: Array<{
    reference: string;
    quantity: number;
    source: CatalogueSelectionSource;
    subkind?: CatalogueSelectionSubkind;
  }>
): QuoteSelectionResult {
  return normalizeQuoteSelection({
    version: QUOTE_SELECTION_VERSION,
    rows: items.map((item, position) => ({
      kind: "catalogue",
      reference: item.reference,
      quantity: item.quantity,
      source: item.source,
      subkind: item.subkind ?? "rental",
      order: position
    }))
  });
}

export type ApplyCatalogueChangeInput = {
  reference: string;
  subkind: CatalogueSelectionSubkind;
  quantity?: number;
  source: CatalogueSelectionSource;
};

export function applyCatalogueChange(
  storedSerialized: string | null,
  change: ApplyCatalogueChangeInput
): { ok: true; serialized: string } | { ok: false; code: QuoteSelectionErrorCode } {
  const current = parseStoredQuoteSelection(storedSerialized);

  if (!current.ok) {
    return { ok: false, code: current.code };
  }

  const priorSerialized = storedSerialized
    ? JSON.stringify(current.value)
    : JSON.stringify(emptyQuoteSelection());

  const catalogueRows = current.value.rows.filter(
    (row) => row.kind === "catalogue"
  );
  const manualRows = current.value.rows.filter(
    (row) => row.kind === "manual"
  );

  if (typeof change.quantity === "number" && change.quantity === 0) {
    const nextCatalogueRows = catalogueRows.filter(
      (row) => !(row.reference === change.reference && row.subkind === change.subkind)
    );

    const next = normalizeQuoteSelection({
      version: QUOTE_SELECTION_VERSION,
      rows: [
        ...manualRows.map((row, index) => ({ ...row, order: index })),
        ...nextCatalogueRows.map((row, index) => ({ ...row, order: manualRows.length + index }))
      ]
    });

    if (!next.ok) {
      return { ok: false, code: next.code };
    }

    const serialized = serializeQuoteSelection(next.value);

    if (!serialized) {
      return { ok: false, code: "byte-limit" };
    }

    return { ok: true, serialized };
  }

  const existingIndex = catalogueRows.findIndex(
    (row) => row.reference === change.reference && row.subkind === change.subkind
  );

  let nextCatalogueRows: CatalogueSelectionRow[];

  if (existingIndex === -1) {
    const newRow: CatalogueSelectionRow = {
      kind: "catalogue",
      reference: change.reference,
      quantity: change.quantity ?? 1,
      source: change.source,
      subkind: change.subkind,
      order: catalogueRows.length
    };
    nextCatalogueRows = [...catalogueRows, newRow];
  } else {
    const newQty = change.quantity ?? existingIndex >= 0
      ? (catalogueRows[existingIndex]?.quantity ?? 0) + 1
      : 1;
    nextCatalogueRows = catalogueRows.map((row, index) =>
      index === existingIndex ? { ...row, quantity: newQty } : row
    );
  }

  const orderedRows: QuoteSelectionRow[] = [
    ...manualRows.map((row, index) => ({ ...row, order: index })),
    ...nextCatalogueRows.map((row, index) => ({ ...row, order: manualRows.length + index }))
  ];

  const next = normalizeQuoteSelection({
    version: QUOTE_SELECTION_VERSION,
    rows: orderedRows
  });

  if (!next.ok) {
    return { ok: false, code: next.code };
  }

  const serialized = serializeQuoteSelection(next.value);

  if (!serialized) {
    return { ok: false, code: "byte-limit" };
  }

  return { ok: true, serialized };
}

export function shouldSeedUrlFallback(storedSerialized: string | null) {
  const current = parseStoredQuoteSelection(storedSerialized);

  return current.ok && current.value.rows.length === 0;
}

export function selectionContainsRow(
  storedSerialized: string | null,
  reference: string,
  subkind: CatalogueSelectionSubkind
) {
  const current = parseStoredQuoteSelection(storedSerialized);

  return current.ok && current.value.rows.some(
    (row) => row.kind === "catalogue" && row.reference === reference && row.subkind === subkind
  );
}

export function allRowsFromSelection(storedSerialized: string | null): QuoteSelectionRow[] {
  const current = parseStoredQuoteSelection(storedSerialized);

  return current.ok ? current.value.rows : [];
}
