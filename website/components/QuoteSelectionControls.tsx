"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import {
  QUOTE_SELECTION_MAX_QUANTITY,
  QUOTE_SELECTION_MAX_ROWS,
  QUOTE_SELECTION_STORAGE_KEY,
  allRowsFromSelection,
  commitQuoteSelectionChange,
  createCatalogueSelection,
  emptyQuoteSelection,
  parseStoredQuoteSelection,
  shouldSeedUrlFallback,
  type CatalogueSelectionSubkind,
  type QuoteSelectionCommitResult,
  type QuoteSelectionRow,
  type QuoteSelectionStorageAdapter
} from "../lib/quote/selection-model";

export type QuoteSelectionItem = {
  category?: string;
  imageSrc?: string;
  includedItems?: QuoteSelectionItem[];
  kind?: "rental" | "setup" | "setup-included" | "manual";
  name: string;
  quantity: number;
  setupBaseQuantity?: number;
  setupName?: string;
  setupSlug?: string;
  slug: string;
  unavailable?: boolean;
  selectionSource?: "catalogue" | "url";
  manualKey?: string;
};

type QuoteSelectionSummaryItem = QuoteSelectionItem;
type NormalizedQuoteSelectionItem = QuoteSelectionItem & {
  kind: NonNullable<QuoteSelectionItem["kind"]>;
};
export type QuoteSelectionValidItem = {
  category?: string;
  imageSrc?: string;
  kind: "rental" | "setup";
  name?: string;
  slug: string;
};

const quoteSelectionChangeEvent = "skr:quote-selection-change";
const maxStoredQuoteItems = QUOTE_SELECTION_MAX_ROWS;
const maxSelectedQuoteItemQuantity = QUOTE_SELECTION_MAX_QUANTITY;
const maxIncludedQuoteItemQuantity = 999;
const maxQuoteIndicatorCount = 99;
const publicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const publicImageSrcPattern = /^(?:https?:\/\/|\/(?!\/))[^\s"'<>]+$/i;

function maxQuoteQuantityForKind(kind: NormalizedQuoteSelectionItem["kind"]) {
  return kind === "setup-included"
    ? maxIncludedQuoteItemQuantity
    : maxSelectedQuoteItemQuantity;
}

function clampQuoteQuantity(
  kind: NormalizedQuoteSelectionItem["kind"],
  quantity: number,
  minimumQuantity = kind === "setup-included" ? 0 : 1
) {
  return Number.isFinite(quantity)
    ? Math.max(
        minimumQuantity,
        Math.min(maxQuoteQuantityForKind(kind), Math.floor(quantity))
      )
    : minimumQuantity;
}

function normalizeQuoteItem(
  item: QuoteSelectionItem
): NormalizedQuoteSelectionItem | undefined {
  const slug = item.slug.trim().toLowerCase();
  const name = item.name.trim();
  const category = item.category?.trim();
  const setupName = item.setupName?.trim();
  const setupSlug = item.setupSlug?.trim().toLowerCase();
  const kind =
    item.kind === "setup" ||
    item.kind === "setup-included" ||
    item.kind === "rental"
      ? item.kind
      : category?.toLowerCase() === "setups"
        ? "setup"
        : "rental";
  const imageSrc = item.imageSrc?.trim();
  const minimumQuantity = kind === "setup-included" ? 0 : 1;
  const quantity = clampQuoteQuantity(kind, item.quantity, minimumQuantity);
  const setupBaseQuantity =
    typeof item.setupBaseQuantity === "number" &&
    Number.isFinite(item.setupBaseQuantity)
    ? Math.max(
        0,
        Math.min(maxIncludedQuoteItemQuantity, Math.floor(item.setupBaseQuantity))
      )
    : undefined;
  const includedItems =
    kind === "setup"
      ? normalizeIncludedItems({
          ...item,
          name,
          slug
        })
      : [];

  if (
    !slug ||
    !name ||
    !publicSlugPattern.test(slug) ||
    (setupSlug && !publicSlugPattern.test(setupSlug))
  ) {
    return undefined;
  }

  return {
    slug,
    name: name.slice(0, 120),
    kind,
    quantity,
    ...(category ? { category: category.slice(0, 80) } : {}),
    ...(setupName ? { setupName: setupName.slice(0, 120) } : {}),
    ...(setupSlug ? { setupSlug } : {}),
    ...(setupBaseQuantity !== undefined ? { setupBaseQuantity } : {}),
    ...(includedItems.length ? { includedItems } : {}),
    ...(imageSrc && publicImageSrcPattern.test(imageSrc)
      ? { imageSrc: imageSrc.slice(0, 500) }
      : {}),
    ...(item.selectionSource ? { selectionSource: item.selectionSource } : {})
  };
}

function quoteSelectionItemKey(item: QuoteSelectionItem) {
  return `${item.kind ?? "rental"}:${item.setupSlug ?? ""}:${item.slug}`;
}

function normalizeQuoteSelectionItems(items: QuoteSelectionItem[]) {
  const normalizedItems: NormalizedQuoteSelectionItem[] = [];
  const normalizedByKey = new Map<string, NormalizedQuoteSelectionItem>();

  for (const item of items) {
    const normalizedItem = normalizeQuoteItem(item);

    if (!normalizedItem) {
      continue;
    }

    normalizedItems.push(normalizedItem);
  }

  const selectedSetupSlugs = new Set(
    normalizedItems
      .filter((item) => item.kind === "setup")
      .map((item) => item.slug)
  );

  for (const normalizedItem of normalizedItems) {
    if (
      normalizedItem.kind === "setup-included" &&
      (!normalizedItem.setupSlug ||
        !selectedSetupSlugs.has(normalizedItem.setupSlug))
    ) {
      continue;
    }

    normalizedByKey.set(quoteSelectionItemKey(normalizedItem), normalizedItem);
  }

  return Array.from(normalizedByKey.values()).slice(0, maxStoredQuoteItems);
}

function normalizeIncludedItems(item: QuoteSelectionItem) {
  return (item.includedItems ?? [])
    .map((includedItem) =>
      normalizeQuoteItem({
        ...includedItem,
        kind: "setup-included",
        setupName: includedItem.setupName ?? item.name,
        setupSlug: includedItem.setupSlug ?? item.slug
      })
    )
    .filter((includedItem): includedItem is NormalizedQuoteSelectionItem =>
      Boolean(includedItem)
    );
}

function selectionQuantityStep(
  sourceItem: QuoteSelectionItem,
  buttonItem: QuoteSelectionItem
) {
  return sourceItem.kind === "setup-included" && buttonItem.includedItems?.length
    ? (sourceItem.setupBaseQuantity ?? sourceItem.quantity)
    : 1;
}

function readQuoteSelection(): QuoteSelectionItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rows = allRowsFromSelection(
      window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)
    );

    return rows
      .map((row) => {
        if (row.kind === "catalogue") {
          return {
            slug: row.reference,
            name: row.reference,
            kind: row.subkind,
            quantity: row.quantity,
            selectionSource: row.source
          };
        }
        return {
          slug: `manual-${row.key}`,
          name: "Manual requirement",
          kind: "manual" as const,
          quantity: row.quantity,
          manualKey: row.key
        };
      });
  } catch {
    return [];
  }
}

type ReadSelectionGuardedResult =
  | { ok: true; items: QuoteSelectionItem[]; serialized: string | null }
  | { ok: false; code: "storage-unavailable" };

function readQuoteSelectionGuarded(): ReadSelectionGuardedResult {
  if (typeof window === "undefined") {
    return { ok: true, items: [], serialized: null };
  }

  let serialized: string | null;
  try {
    serialized = window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY);
  } catch {
    return { ok: false, code: "storage-unavailable" };
  }

  const rows = allRowsFromSelection(serialized);
  const items = rows.map((row) => {
    if (row.kind === "catalogue") {
      return {
        slug: row.reference,
        name: row.reference,
        kind: row.subkind,
        quantity: row.quantity,
        selectionSource: row.source
      };
    }
    return {
      slug: `manual-${row.key}`,
      name: "Manual requirement",
      kind: "manual" as const,
      quantity: row.quantity,
      manualKey: row.key
    };
  });

  return { ok: true, items, serialized };
}

function buildBrowserStorage(): QuoteSelectionStorageAdapter {
  return {
    read: () => window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY),
    write: (serialized) =>
      window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, serialized),
    remove: () =>
      window.sessionStorage.removeItem(QUOTE_SELECTION_STORAGE_KEY),
    dispatchSuccess: () =>
      window.dispatchEvent(new Event(quoteSelectionChangeEvent))
  };
}

function writeUrlFallback(item: QuoteSelectionItem, canonicalSubkind?: CatalogueSelectionSubkind): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  let serialized: string | null;
  try {
    serialized = window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY);
  } catch {
    return false;
  }

  if (!shouldSeedUrlFallback(serialized)) {
    return false;
  }

  const normalized = createCatalogueSelection([
    {
      reference: item.slug,
      quantity: item.quantity,
      source: "url",
      subkind: canonicalSubkind ?? (item.kind === "setup" ? "setup" : "rental") as CatalogueSelectionSubkind
    }
  ]);

  if (!normalized.ok) {
    return false;
  }

  const result = commitQuoteSelectionChange(buildBrowserStorage(), {
    kind: "replace",
    selection: {
      version: 2,
      rows: normalized.value.rows.map((row, index) => ({
        ...row,
        order: index
      }))
    }
  });

  return result.ok;
}

function mergeQuoteItemMetadata(
  storedItem: QuoteSelectionItem,
  sourceItem: QuoteSelectionItem,
  quantity = storedItem.quantity
) {
  return {
    ...storedItem,
    name: sourceItem.name,
    kind: sourceItem.kind ?? storedItem.kind,
    quantity,
    ...(sourceItem.category ? { category: sourceItem.category } : {}),
    ...(sourceItem.imageSrc ? { imageSrc: sourceItem.imageSrc } : {}),
    ...(sourceItem.setupBaseQuantity !== undefined
      ? { setupBaseQuantity: sourceItem.setupBaseQuantity }
      : {}),
    ...(sourceItem.setupName ? { setupName: sourceItem.setupName } : {}),
    ...(sourceItem.setupSlug ? { setupSlug: sourceItem.setupSlug } : {}),
    ...(sourceItem.includedItems?.length ? { includedItems: sourceItem.includedItems } : {})
  };
}

function refreshStoredQuoteItem(
  item: QuoteSelectionItem,
  setItems: (items: QuoteSelectionItem[]) => void
) {
  const normalizedItem = normalizeQuoteItem(item);

  if (!normalizedItem) {
    return;
  }

  const nextItems = readQuoteSelection().map((selected) => {
    if (quoteSelectionItemKey(selected) !== quoteSelectionItemKey(normalizedItem)) {
      return selected;
    }

    return mergeQuoteItemMetadata(selected, normalizedItem);
  });

  setItems(nextItems);
}

export function QuoteSelectionDataBoundary({
  validItems: _validItems
}: {
  validItems: QuoteSelectionValidItem[];
}) {
  // Deliberately retain stale references. The quote page resolves them against
  // the current server-owned public catalogue and offers explicit recovery.
  return null;
}

function removeStoredQuoteSelectionItem(item: QuoteSelectionItem): QuoteSelectionCommitResult | undefined {
  const normalizedItem = normalizeQuoteItem(item);

  if (!normalizedItem) {
    return undefined;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  const subkind: CatalogueSelectionSubkind =
    normalizedItem.kind === "setup" ? "setup" : "rental";

  return commitQuoteSelectionChange(buildBrowserStorage(), {
    kind: "catalogue",
    reference: normalizedItem.slug,
    subkind,
    quantity: 0,
    source: "catalogue"
  });
}

export function formatQuoteSelectionItems(items: QuoteSelectionItem[]) {
  const normalizedItems = items
    .map((item) => normalizeQuoteItem(item))
    .filter((item): item is NormalizedQuoteSelectionItem => Boolean(item));
  const rentalItems = normalizedItems.filter((item) => item.kind === "rental");
  const setupIncludedItems = normalizedItems.filter(
    (item) => item.kind === "setup-included"
  );
  const setupItems = normalizedItems.filter((item) => item.kind === "setup");
  const formatLine = (item: QuoteSelectionItem) =>
    item.quantity !== 1 ? `${item.name} x ${item.quantity}` : item.name;

  if (!setupIncludedItems.length && !setupItems.length) {
    return rentalItems.map(formatLine).join("\n");
  }

  return [
    rentalItems.length
      ? ["Selected rental items:", ...rentalItems.map(formatLine)].join("\n")
      : "",
    setupIncludedItems.length
      ? ["Setup included rental pieces:", ...setupIncludedItems.map(formatLine)].join("\n")
      : "",
    setupItems.length
      ? ["Selected setup directions:", ...setupItems.map(formatLine)].join("\n")
      : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getGroupedSelectionItems(items: QuoteSelectionSummaryItem[]) {
  const setupItems = items.filter((item) => item.kind === "setup");
  const setupIncludedItems = items.filter(
    (item) => item.kind === "setup-included"
  );
  const orphanSetupSlugs = Array.from(
    new Set(
      setupIncludedItems
        .map((item) => item.setupSlug)
        .filter((setupSlug): setupSlug is string => Boolean(setupSlug))
    )
  ).filter(
    (setupSlug) => !setupItems.some((setupItem) => setupItem.slug === setupSlug)
  );

  return {
    rentalItems: items.filter((item) => item.kind === "rental" || !item.kind),
    setupGroups: [
      ...setupItems.map((setupItem) => ({
        includedItems: setupIncludedItems.filter(
          (item) => item.setupSlug === setupItem.slug
        ),
        setupItem,
        setupName: undefined
      })),
      ...orphanSetupSlugs.map((setupSlug) => {
        const includedItems = setupIncludedItems.filter(
          (item) => item.setupSlug === setupSlug
        );
        return {
          includedItems,
          setupItem: undefined,
          setupName: includedItems[0]?.setupName ?? setupSlug
        };
      })
    ]
  };
}

function SelectionRow({
  detailBasePath,
  item,
  onRemoveItem,
  quantityItem,
  showQuantityMeta = true,
  showQuantityControls = true
}: {
  detailBasePath: "/catalogue" | "/listings";
  item: QuoteSelectionSummaryItem;
  onRemoveItem?: (item: QuoteSelectionSummaryItem) => QuoteSelectionCommitResult | undefined;
  quantityItem?: QuoteSelectionSummaryItem;
  showQuantityMeta?: boolean;
  showQuantityControls?: boolean;
}) {
  function handleClearSelection(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (onRemoveItem) {
      onRemoveItem(item);
    } else {
      removeStoredQuoteSelectionItem(item);
    }
  }

  return (
    <article
      className="stitch-selection-row"
      data-kind={item.kind}
      key={quoteSelectionItemKey(item)}
    >
      {item.imageSrc ? (
        <img alt={`${item.name} thumbnail`} src={item.imageSrc} />
      ) : (
        <span className="stitch-selection-row__icon" aria-hidden="true">
          SK
        </span>
      )}
      <div className="stitch-selection-row__body">
        <div className="stitch-selection-row__main">
          <strong>{item.name}</strong>
          <div className="stitch-selection-row__actions">
            {item.unavailable ? (
              <Link className="stitch-selection-row__detail" href="/catalogue">
                Browse alternatives
              </Link>
            ) : (
              <Link
                className="stitch-selection-row__detail"
                href={`${detailBasePath}/${item.slug}`}
              >
                Details
              </Link>
            )}
            {showQuantityControls ? (
              <button
                aria-label={`Remove ${item.name} from selection`}
                className="stitch-selection-row__clear"
                onClick={handleClearSelection}
                type="button"
              >
                Remove item
              </button>
            ) : null}
          </div>
        </div>
        <div className="stitch-selection-row__meta">
          {item.category ? (
            <small className="stitch-selection-row__category">
              {item.category}
            </small>
          ) : null}
          {item.setupName ? (
            <small className="stitch-selection-row__setup-name">
              {item.setupName}
            </small>
          ) : null}
          {showQuantityMeta ? (
            <small className="stitch-selection-row__quantity">
              Qty: {item.quantity}
            </small>
          ) : null}
          {item.unavailable ? (
            <small className="stitch-selection-row__unavailable">
              Unavailable - remove this item or browse the current catalogue.
            </small>
          ) : null}
        </div>
        {showQuantityControls && !item.unavailable ? (
          <QuoteSelectionButton item={quantityItem ?? item} />
        ) : null}
      </div>
    </article>
  );
}

function SelectionGroup({
  detailBasePath,
  items,
  onRemoveItem,
  title
}: {
  detailBasePath: "/catalogue" | "/listings";
  items: QuoteSelectionSummaryItem[];
  onRemoveItem?: (item: QuoteSelectionSummaryItem) => QuoteSelectionCommitResult | undefined;
  title: string;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="stitch-selection-group">
      <h3>{title}</h3>
      {items.map((item) => (
        <SelectionRow
          detailBasePath={detailBasePath}
          item={item}
          key={quoteSelectionItemKey(item)}
          onRemoveItem={onRemoveItem}
        />
      ))}
    </div>
  );
}

function SetupSelectionGroup({
  includedItems,
  onRemoveItem,
  setupItem,
  setupName
}: {
  includedItems: QuoteSelectionSummaryItem[];
  onRemoveItem?: (item: QuoteSelectionSummaryItem) => QuoteSelectionCommitResult | undefined;
  setupItem?: QuoteSelectionSummaryItem;
  setupName?: string;
}) {
  const [isIncludedOpen, setIsIncludedOpen] = useState(false);

  if (!setupItem && !includedItems.length) {
    return null;
  }

  const recipeQuantityByKey = new Map(
    (setupItem?.includedItems ?? []).map((includedItem) => [
      quoteSelectionItemKey(includedItem),
      includedItem.setupBaseQuantity ?? includedItem.quantity
    ])
  );
  const setupQuantity = setupItem?.quantity ?? 1;
  const normalizedIncludedItems = includedItems.map((includedItem) => ({
    ...includedItem,
    quantity:
      setupItem
        ? Math.min(
            maxIncludedQuoteItemQuantity,
            (recipeQuantityByKey.get(quoteSelectionItemKey(includedItem)) ??
              includedItem.setupBaseQuantity ??
              includedItem.quantity) * setupQuantity
          )
        : includedItem.quantity
  }));
  const recipeIncludedItems =
    setupItem?.includedItems?.length
      ? setupItem.includedItems.map((includedItem) => ({
          ...includedItem,
          quantity: includedItem.setupBaseQuantity ?? includedItem.quantity
        }))
      : normalizedIncludedItems;
  const setupQuantityItem = setupItem
    ? {
        ...setupItem,
        includedItems: recipeIncludedItems
      }
    : undefined;
  const panelId = `setup-included-${setupItem?.slug ?? setupName?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? "items"}`;

  return (
    <section
      className="stitch-selection-setup-group"
      data-open={isIncludedOpen ? "true" : "false"}
    >
      <div className="stitch-selection-setup-group__summary">
        {setupItem ? (
          <SelectionRow
            detailBasePath="/listings"
            item={setupItem}
            onRemoveItem={onRemoveItem}
            quantityItem={setupQuantityItem}
          />
        ) : (
          <h4>{setupName}</h4>
        )}
        {includedItems.length ? (
          <button
            aria-controls={panelId}
            aria-expanded={isIncludedOpen}
            className="stitch-selection-setup-group__toggle"
            onClick={() => setIsIncludedOpen((current) => !current)}
            type="button"
          >
            {isIncludedOpen ? "Hide included pieces" : `Show included pieces (${includedItems.length})`}
          </button>
        ) : null}
      </div>
      {includedItems.length && isIncludedOpen ? (
        <div className="stitch-selection-included-group" id={panelId}>
          <h4>Included rental pieces</h4>
          {normalizedIncludedItems.map((item) => (
            <SelectionRow
              detailBasePath="/catalogue"
              item={item}
              key={quoteSelectionItemKey(item)}
              showQuantityMeta
              showQuantityControls={false}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ManualSelectionGroup({ items }: { items: QuoteSelectionSummaryItem[] }) {
  if (!items.length) {
    return null;
  }

  const label = items.length === 1 ? "1 manual requirement" : `${items.length} manual requirements`;

  return (
    <div className="stitch-selection-group stitch-selection-group--manual">
      <h3>{label}</h3>
      {items.map((item) => (
        <article
          className="stitch-selection-row"
          data-kind="manual"
          key={item.manualKey ?? item.slug}
        >
          <span className="stitch-selection-row__icon" aria-hidden="true">
            SK
          </span>
          <div className="stitch-selection-row__body">
            <div className="stitch-selection-row__main">
              <strong>Manual requirement</strong>
              <small className="stitch-selection-row__quantity">
                Qty: {item.quantity}
              </small>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function QuoteSelectionSummary({
  catalogueAvailable = true,
  category,
  event,
  fallbackItems = [],
  requestedSlug,
  search,
  validItems = []
}: {
  catalogueAvailable?: boolean;
  category?: string;
  event?: string;
  fallbackItems?: QuoteSelectionSummaryItem[];
  requestedSlug?: string;
  search?: string;
  validItems?: QuoteSelectionValidItem[];
}) {
  const [items, setItems] = useState<QuoteSelectionItem[]>([]);
  const [hasCompleteSelection, setHasCompleteSelection] = useState(false);
  const [fallbackConsumed, setFallbackConsumed] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  function handleRemoveItem(summaryItem: QuoteSelectionSummaryItem): QuoteSelectionCommitResult | undefined {
    if (typeof window === "undefined") {
      return undefined;
    }

    const result = removeStoredQuoteSelectionItem(summaryItem);

    if (!result) {
      return undefined;
    }

    if (result.ok) {
      setRemovalError(null);
      const resync = readQuoteSelectionGuarded();
      if (resync.ok) {
        setItems(resync.items);
        setStorageUnavailable(false);
        setHasCompleteSelection(!shouldSeedUrlFallback(resync.serialized));
      } else {
        setStorageUnavailable(true);
      }
    } else {
      const resync = readQuoteSelectionGuarded();
      if (resync.ok) {
        setItems(resync.items);
        setStorageUnavailable(false);
        setHasCompleteSelection(!shouldSeedUrlFallback(resync.serialized));
      } else {
        setStorageUnavailable(true);
      }
      setRemovalError(
        result.code === "restore-failed" ||
        result.code === "read-back-mismatch" ||
        result.code === "storage-exception"
          ? resync.ok
            ? "Selection storage could not be updated. The current selection has been reloaded."
            : "Selection storage is unavailable. The current selection has been preserved."
          : "This item could not be removed. Check the limits and try again."
      );
    }

    return result;
  }
  const resolvedItems = items.map((item) => {
    if (item.kind === "manual") {
      return item;
    }

    const canonical = validItems.find(
      (candidate) => candidate.slug === item.slug && candidate.kind === item.kind
    );

    return canonical
      ? {
          ...item,
          category: canonical.category,
          imageSrc: canonical.imageSrc,
          kind: canonical.kind,
          name: canonical.name ?? canonical.slug
        }
      : {
          ...item,
          name: `Unavailable selection: ${item.slug}`,
          unavailable: true
        };
  });

  const manualItems = resolvedItems.filter((item) => item.kind === "manual");
  const catalogueItems = resolvedItems.filter((item) => item.kind !== "manual");
  const hasAnyItems = resolvedItems.length > 0;

  const visibleItems: QuoteSelectionSummaryItem[] = catalogueItems.length
    ? resolvedItems
    : hasCompleteSelection
      ? manualItems.length ? manualItems : []
      : fallbackItems;
  const hasDiscoveryContext = Boolean(requestedSlug || category || event || search);
  const groupedItems = getGroupedSelectionItems(visibleItems);

  const canonicalFallbackIdentity = useMemo(() => {
    if (!requestedSlug) return undefined;
    const fallbackItem = fallbackItems[0];
    if (!fallbackItem || fallbackItem.slug !== requestedSlug) return undefined;
    const normalizedFallback = normalizeQuoteItem(fallbackItem);
    if (
      !normalizedFallback ||
      (normalizedFallback.kind !== "rental" &&
        normalizedFallback.kind !== "setup")
    )
      return undefined;
    const canonical = validItems.find(
      (candidate) =>
        candidate.slug === requestedSlug &&
        candidate.kind === normalizedFallback.kind
    );
    if (!canonical) return undefined;
    return { reference: canonical.slug, kind: canonical.kind };
  }, [requestedSlug, fallbackItems, validItems]);

  useEffect(() => {
    function syncSelection() {
      const result = readQuoteSelectionGuarded();

      if (result.ok) {
        setItems(result.items);
        setStorageUnavailable(false);
        setHasCompleteSelection(!shouldSeedUrlFallback(result.serialized));

        if (!fallbackConsumed && canonicalFallbackIdentity) {
          const rows = allRowsFromSelection(result.serialized);
          const hasMatchingUrlRow = rows.some(
            (row) =>
              row.kind === "catalogue" &&
              row.source === "url" &&
              row.reference === canonicalFallbackIdentity.reference &&
              row.subkind === canonicalFallbackIdentity.kind
          );
          if (hasMatchingUrlRow) {
            setFallbackConsumed(true);
          }
        }
      } else {
        setStorageUnavailable(true);
      }
    }

    syncSelection();
    window.addEventListener(quoteSelectionChangeEvent, syncSelection);
    window.addEventListener("storage", syncSelection);

    return () => {
      window.removeEventListener(quoteSelectionChangeEvent, syncSelection);
      window.removeEventListener("storage", syncSelection);
    };
  }, []);

  useEffect(() => {
    if (fallbackConsumed) {
      return;
    }

    if (!catalogueAvailable) {
      return;
    }

    const fallbackItem = fallbackItems[0];

    if (!canonicalFallbackIdentity) {
      return;
    }

    if (storageUnavailable) {
      return;
    }

    let serialized: string | null;
    try {
      serialized = window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY);
    } catch {
      setStorageUnavailable(true);
      return;
    }

    if (!shouldSeedUrlFallback(serialized)) {
      return;
    }

    const seeded = writeUrlFallback(fallbackItem, canonicalFallbackIdentity.kind);

    if (seeded) {
      setFallbackConsumed(true);
      setItems(readQuoteSelection());
    }
  }, [fallbackItems, requestedSlug, catalogueAvailable, fallbackConsumed, storageUnavailable, hasCompleteSelection]);

  const manualCount = manualItems.length;

  return (
    <section className="stitch-quote-card stitch-quote-selection">
      <p className="stitch-eyebrow">Your Selection</p>
      <h2>Your Selection</h2>
      {removalError ? (
        <div className="stitch-selection-state stitch-selection-state--error" role="alert">
          {removalError}
        </div>
      ) : null}
      {storageUnavailable ? (
        <div className="stitch-selection-state" role="status">
          <strong>Selection storage unavailable</strong>
          <p>
            Selection storage is unavailable in this browser context. Existing
            references are kept where possible. Add a bounded manual requirement
            or browse again later.
          </p>
        </div>
      ) : null}
      {storageUnavailable ? (
        catalogueItems.length ? (
          <>
            <SelectionGroup
              detailBasePath="/catalogue"
              items={catalogueItems}
              onRemoveItem={handleRemoveItem}
              title="Selected items"
            />
            {manualCount ? (
              <ManualSelectionGroup items={manualItems} />
            ) : null}
          </>
        ) : manualCount ? (
          <ManualSelectionGroup items={manualItems} />
        ) : null
      ) : !catalogueAvailable ? (
        <>
          <div className="stitch-selection-state" role="status">
            <strong>Catalogue unavailable right now</strong>
            <p>
              Existing references are kept in this tab. Add a bounded manual
              requirement or browse again later; no substitute is selected.
            </p>
            {requestedSlug ? (
              <p>
                Listing context is a starting point only. The listing link may
                be old or unavailable: <strong>{requestedSlug}</strong>. It has
                not been added or replaced.
              </p>
            ) : null}
          </div>
          {catalogueItems.length ? (
            <SelectionGroup
              detailBasePath="/catalogue"
              items={catalogueItems}
              onRemoveItem={handleRemoveItem}
              title="Unavailable selections"
            />
          ) : null}
          {manualCount ? (
            <ManualSelectionGroup items={manualItems} />
          ) : null}
        </>
      ) : hasAnyItems ? (
        <>
          {catalogueItems.length ? (
            <>
              <SelectionGroup
                detailBasePath="/catalogue"
                items={groupedItems.rentalItems}
                onRemoveItem={handleRemoveItem}
                title="Selected Rental Items"
              />
              {groupedItems.setupGroups.length ? (
                <div className="stitch-selection-group stitch-selection-group--setups">
                  <h3>Selected Setup Directions</h3>
                  {groupedItems.setupGroups.map((group) => (
                    <SetupSelectionGroup
                      includedItems={group.includedItems}
                      key={group.setupItem?.slug ?? group.setupName}
                      onRemoveItem={handleRemoveItem}
                      setupItem={group.setupItem}
                      setupName={group.setupName}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
          {manualCount ? (
            <ManualSelectionGroup items={manualItems} />
          ) : null}
        </>
      ) : (
        <>
          <strong>No items selected yet</strong>
          <p>
            {requestedSlug
              ? "This listing is unavailable. It has not been substituted or added to an accepted request."
              : "Browse the catalogue or add a separate manual requirement below."}
          </p>
          {hasDiscoveryContext ? (
            <>
              <p>Discovery context is synced into the request automatically. Use setup, access, and timing notes for alternates before sending.</p>
              <dl className="stitch-facts">
                {requestedSlug ? <div><dt>Selected listing reference</dt><dd>{requestedSlug}</dd></div> : null}
                {category ? <div><dt>Category</dt><dd>{category}</dd></div> : null}
                {event ? <div><dt>Event details</dt><dd>{event}</dd></div> : null}
                {search ? <div><dt>Search</dt><dd>{search}</dd></div> : null}
              </dl>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

export function QuoteSelectionButton({ item }: { item: QuoteSelectionItem }) {
  const [items, setItems] = useState<QuoteSelectionItem[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const normalizedButtonItem = normalizeQuoteItem(item);
  const selectedItem = normalizedButtonItem
    ? items.find(
        (selected) =>
          quoteSelectionItemKey(selected) ===
          quoteSelectionItemKey(normalizedButtonItem)
      )
    : undefined;

  useEffect(() => {
    function syncSelection() {
      setItems(readQuoteSelection());
    }

    syncSelection();
    window.addEventListener(quoteSelectionChangeEvent, syncSelection);
    window.addEventListener("storage", syncSelection);

    return () => {
      window.removeEventListener(quoteSelectionChangeEvent, syncSelection);
      window.removeEventListener("storage", syncSelection);
    };
  }, []);

  useEffect(() => {
    refreshStoredQuoteItem(item, setItems);
  }, [item.category, item.imageSrc, item.name, item.slug]);

  function handleIncrementQuantity(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    const normalizedItem = normalizeQuoteItem(item);

    if (!normalizedItem) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const subkind: CatalogueSelectionSubkind =
      normalizedItem.kind === "setup" ? "setup" : "rental";

    const result = commitQuoteSelectionChange(buildBrowserStorage(), {
      kind: "catalogue",
      reference: normalizedItem.slug,
      subkind,
      source: "catalogue"
    });

    if (!result.ok) {
      setItems(readQuoteSelection());
      setStorageError(
        result.code === "storage-exception" || result.code === "read-back-mismatch" || result.code === "restore-failed"
          ? "Selection storage could not be updated. The current selection has been reloaded."
          : "This selection could not be updated. Check the limits and try again."
      );
      return;
    }

    setStorageError(null);
    setItems(readQuoteSelection());
  }

  function handleDecrementQuantity(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    const normalizedItem = normalizeQuoteItem(item);

    if (!normalizedItem) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const subkind: CatalogueSelectionSubkind =
      normalizedItem.kind === "setup" ? "setup" : "rental";

    let serialized: string | null;
    try {
      serialized = window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY);
    } catch {
      setItems(readQuoteSelection());
      setStorageError("Selection storage could not be read. The current selection has been reloaded.");
      return;
    }

    const current = parseStoredQuoteSelection(serialized);

    if (!current.ok) {
      return;
    }

    const existing = current.value.rows.find(
      (row) =>
        row.kind === "catalogue" &&
        row.reference === normalizedItem.slug &&
        row.subkind === subkind
    );

    if (!existing) {
      return;
    }

    const newQty = existing.quantity - 1;

    const result = commitQuoteSelectionChange(buildBrowserStorage(), {
      kind: "catalogue",
      reference: normalizedItem.slug,
      subkind,
      quantity: newQty,
      source: "catalogue"
    });

    if (!result.ok) {
      setItems(readQuoteSelection());
      setStorageError(
        result.code === "storage-exception" || result.code === "read-back-mismatch" || result.code === "restore-failed"
          ? "Selection storage could not be updated. The current selection has been reloaded."
          : "This selection could not be updated. Check the limits and try again."
      );
      return;
    }

    setStorageError(null);
    setItems(readQuoteSelection());
  }

  return (
    <span
      className="stitch-quote-select-controls"
      data-selected={selectedItem ? "true" : "false"}
    >
      <button
        aria-label={`Decrease ${item.name} quantity`}
        className="stitch-quote-quantity-button"
        disabled={!selectedItem}
        onClick={handleDecrementQuantity}
        type="button"
      >
        -
      </button>
      <output
        aria-label={`${item.name} quantity selected`}
        className="stitch-quote-quantity-value"
      >
        Qty {selectedItem?.quantity ?? 0}
      </output>
      <button
        aria-label={`Increase ${item.name} quantity`}
        className="stitch-quote-quantity-button"
        disabled={
          Boolean(selectedItem) &&
          (selectedItem?.quantity ?? 0) >= maxSelectedQuoteItemQuantity
        }
        onClick={handleIncrementQuantity}
        type="button"
      >
        +
      </button>
      {storageError ? (
        <small className="stitch-quote-storage-error" role="alert">
          {storageError}
        </small>
      ) : null}
    </span>
  );
}

export function QuoteSelectionBadge({ item }: { item: QuoteSelectionItem }) {
  const [items, setItems] = useState<QuoteSelectionItem[]>([]);
  const normalizedBadgeItem = normalizeQuoteItem(item);
  const selectedItem = normalizedBadgeItem
    ? items.find(
        (selected) =>
          quoteSelectionItemKey(selected) ===
          quoteSelectionItemKey(normalizedBadgeItem)
      )
    : undefined;

  useEffect(() => {
    function syncSelection() {
      setItems(readQuoteSelection());
    }

    syncSelection();
    window.addEventListener(quoteSelectionChangeEvent, syncSelection);
    window.addEventListener("storage", syncSelection);

    return () => {
      window.removeEventListener(quoteSelectionChangeEvent, syncSelection);
      window.removeEventListener("storage", syncSelection);
    };
  }, []);

  useEffect(() => {
    refreshStoredQuoteItem(item, setItems);
  }, [item.category, item.imageSrc, item.name, item.slug]);

  if (!selectedItem) {
    return null;
  }

  return (
    <span
      aria-label={`${item.name}: ${selectedItem.quantity} selected`}
      className="stitch-quote-card-badge"
    >
      Qty {selectedItem.quantity}
    </span>
  );
}

export function QuoteSelectionIndicator() {
  const [items, setItems] = useState<QuoteSelectionItem[]>([]);
  const totalCount = useMemo(
    () =>
      Math.min(
        maxQuoteIndicatorCount,
        items.filter((item) => item.kind !== "setup-included").length
      ),
    [items]
  );

  useEffect(() => {
    function syncSelection() {
      setItems(readQuoteSelection());
    }

    syncSelection();
    window.addEventListener(quoteSelectionChangeEvent, syncSelection);
    window.addEventListener("storage", syncSelection);

    return () => {
      window.removeEventListener(quoteSelectionChangeEvent, syncSelection);
      window.removeEventListener("storage", syncSelection);
    };
  }, []);

  return (
    <Link
      aria-label={
        totalCount
          ? `Request quote with ${totalCount} selected item${totalCount === 1 ? "" : "s"}`
          : "Request quote"
      }
      className="stitch-button stitch-button--primary stitch-quote-indicator"
      href="/quote"
    >
      <span>Request Quote</span>
      <strong aria-label={`${totalCount} selected`}>
        {totalCount}
      </strong>
    </Link>
  );
}
