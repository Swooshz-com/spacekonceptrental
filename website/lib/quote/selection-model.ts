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

  if (!publicReferencePattern.test(reference) || order === undefined) {
    return undefined;
  }

  const rawSubkind = value.subkind;

  if (rawSubkind === undefined) {
    return {
      kind: "catalogue",
      reference,
      quantity: value.quantity,
      source: value.source,
      order,
      subkind: "rental"
    };
  }

  if (rawSubkind === "rental" || rawSubkind === "setup") {
    return {
      kind: "catalogue",
      reference,
      quantity: value.quantity,
      source: value.source,
      order,
      subkind: rawSubkind
    };
  }

  return undefined;
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
  const catalogueByKey = new Map<string, CatalogueSelectionRow>();

  for (const { row } of ordered) {
    if (row.kind === "manual") {
      canonicalRows.push({ ...row, order: canonicalRows.length });
      continue;
    }

    const compositeKey = `${row.reference}:${row.subkind}`;
    const existing = catalogueByKey.get(compositeKey);

    if (!existing) {
      const next = { ...row, order: canonicalRows.length };
      catalogueByKey.set(compositeKey, next);
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
): { ok: true; serialized: string; value: QuoteSelection } | { ok: false; code: QuoteSelectionErrorCode } {
  const current = parseStoredQuoteSelection(storedSerialized);

  if (!current.ok) {
    return { ok: false, code: current.code };
  }

  const { quantity: rawQty } = change;

  if (rawQty !== undefined) {
    if (
      typeof rawQty !== "number" ||
      !Number.isFinite(rawQty) ||
      !Number.isInteger(rawQty) ||
      rawQty < 0 ||
      rawQty > QUOTE_SELECTION_MAX_QUANTITY
    ) {
      return { ok: false, code: "quantity-overflow" };
    }
  }

  const rows = [...current.value.rows];
  const existingIndex = rows.findIndex(
    (row) => row.kind === "catalogue" &&
      row.reference === change.reference &&
      row.subkind === change.subkind
  );

  if (rawQty === 0) {
    if (existingIndex === -1) {
      return { ok: true, serialized: storedSerialized ?? JSON.stringify(emptyQuoteSelection()), value: current.value };
    }

    rows.splice(existingIndex, 1);
  } else if (rawQty === undefined) {
    if (existingIndex === -1) {
      rows.push({
        kind: "catalogue",
        reference: change.reference,
        quantity: 1,
        source: change.source,
        subkind: change.subkind,
        order: rows.length
      });
    } else {
      const newQty = (rows[existingIndex] as CatalogueSelectionRow).quantity + 1;

      if (newQty > QUOTE_SELECTION_MAX_QUANTITY) {
        return { ok: false, code: "quantity-overflow" };
      }

      (rows[existingIndex] as CatalogueSelectionRow).quantity = newQty;
    }
  } else {
    if (existingIndex === -1) {
      rows.push({
        kind: "catalogue",
        reference: change.reference,
        quantity: rawQty,
        source: change.source,
        subkind: change.subkind,
        order: rows.length
      });
    } else {
      (rows[existingIndex] as CatalogueSelectionRow).quantity = rawQty;
    }
  }

  if (rows.length > QUOTE_SELECTION_MAX_ROWS) {
    return { ok: false, code: "raw-row-limit" };
  }

  const reordered = rows.map((row, index) => ({ ...row, order: index }));

  const { rows: reorderedRows, ...rest } = { version: QUOTE_SELECTION_VERSION, rows: reordered };

  const selection: QuoteSelection = { ...rest, rows: reorderedRows };

  if (byteLength(JSON.stringify(selection)) > QUOTE_SELECTION_MAX_BYTES) {
    return { ok: false, code: "byte-limit" };
  }

  const serialized = JSON.stringify(selection);

  return { ok: true, serialized, value: selection };
}

export function commitCatalogueChange(
  storageGet: () => string | null,
  storageSet: (serialized: string) => void,
  storageGetAfterWrite: () => string | null,
  change: ApplyCatalogueChangeInput
): { ok: true; value: QuoteSelection; serialized: string; dispatchEvent: () => void } | { ok: false; code: QuoteSelectionErrorCode } {
  const priorSerialized = storageGet();
  const result = applyCatalogueChange(priorSerialized, change);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  storageSet(result.serialized);

  const committed = storageGetAfterWrite();

  if (committed !== result.serialized) {
    return { ok: false, code: "invalid-selection" };
  }

  return {
    ok: true,
    value: result.value,
    serialized: result.serialized,
    dispatchEvent: () => {}
  };
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
