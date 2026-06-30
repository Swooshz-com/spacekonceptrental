"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";

export type QuoteSelectionItem = {
  category?: string;
  imageSrc?: string;
  includedItems?: QuoteSelectionItem[];
  kind?: "rental" | "setup" | "setup-included";
  name: string;
  quantity: number;
  setupBaseQuantity?: number;
  setupName?: string;
  setupSlug?: string;
  slug: string;
};

type QuoteSelectionSummaryItem = QuoteSelectionItem;
type NormalizedQuoteSelectionItem = QuoteSelectionItem & {
  kind: NonNullable<QuoteSelectionItem["kind"]>;
};

const quoteSelectionStorageKey = "skr.quoteSelection.v1";
const quoteSelectionChangeEvent = "skr:quote-selection-change";
const maxStoredQuoteItems = 20;
const publicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const publicImageSrcPattern = /^(?:https?:\/\/|\/(?!\/))[^\s"'<>]+$/i;

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
  const quantity = Number.isFinite(item.quantity)
    ? Math.max(minimumQuantity, Math.min(999, Math.floor(item.quantity)))
    : 1;
  const setupBaseQuantity =
    typeof item.setupBaseQuantity === "number" &&
    Number.isFinite(item.setupBaseQuantity)
    ? Math.max(0, Math.min(999, Math.floor(item.setupBaseQuantity)))
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
      : {})
  };
}

function quoteSelectionItemKey(item: QuoteSelectionItem) {
  return `${item.kind ?? "rental"}:${item.setupSlug ?? ""}:${item.slug}`;
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

function readQuoteSelection() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(quoteSelectionStorageKey) ?? "[]"
    );

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeQuoteItem(item as QuoteSelectionItem))
      .filter((item): item is NormalizedQuoteSelectionItem => Boolean(item))
      .slice(0, maxStoredQuoteItems);
  } catch {
    return [];
  }
}

function writeQuoteSelection(items: QuoteSelectionItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    quoteSelectionStorageKey,
    JSON.stringify(items.slice(0, maxStoredQuoteItems))
  );
  window.dispatchEvent(new Event(quoteSelectionChangeEvent));
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

  let changed = false;
  const nextItems = readQuoteSelection().map((selected) => {
    if (quoteSelectionItemKey(selected) !== quoteSelectionItemKey(normalizedItem)) {
      return selected;
    }

    const refreshedItem = mergeQuoteItemMetadata(selected, normalizedItem);
    changed =
      changed ||
      refreshedItem.kind !== selected.kind ||
      refreshedItem.name !== selected.name ||
      refreshedItem.category !== selected.category ||
      refreshedItem.imageSrc !== selected.imageSrc ||
      refreshedItem.setupName !== selected.setupName ||
      refreshedItem.setupSlug !== selected.setupSlug;

    return refreshedItem;
  });

  if (changed) {
    writeQuoteSelection(nextItems);
    setItems(nextItems);
  }
}

export function getStoredQuoteSelection() {
  return readQuoteSelection();
}

export function clearStoredQuoteSelection() {
  writeQuoteSelection([]);
}

function removeStoredQuoteSelectionItem(item: QuoteSelectionItem) {
  const normalizedItem = normalizeQuoteItem(item);

  if (!normalizedItem) {
    return;
  }

  writeQuoteSelection(
    readQuoteSelection().filter(
      (selected) =>
        quoteSelectionItemKey(selected) !== quoteSelectionItemKey(normalizedItem) &&
        !(
          normalizedItem.kind === "setup" &&
          selected.kind === "setup-included" &&
          selected.setupSlug === normalizedItem.slug
        )
    )
  );
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
  quantityItem
}: {
  detailBasePath: "/catalogue" | "/listings";
  item: QuoteSelectionSummaryItem;
  quantityItem?: QuoteSelectionSummaryItem;
}) {
  function handleClearSelection(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    removeStoredQuoteSelectionItem(item);
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
            <Link
              className="stitch-selection-row__detail"
              href={`${detailBasePath}/${item.slug}`}
            >
              Details
            </Link>
            <button
              aria-label={`Remove ${item.name} from selection`}
              className="stitch-selection-row__clear"
              onClick={handleClearSelection}
              type="button"
            >
              Remove item
            </button>
          </div>
        </div>
        <div className="stitch-selection-row__meta">
          <small>Qty: {item.quantity}</small>
          {item.setupName ? <small>{item.setupName}</small> : null}
          {item.category ? <small>{item.category}</small> : null}
        </div>
        <QuoteSelectionButton item={quantityItem ?? item} />
      </div>
    </article>
  );
}

function SelectionGroup({
  detailBasePath,
  items,
  title
}: {
  detailBasePath: "/catalogue" | "/listings";
  items: QuoteSelectionSummaryItem[];
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
        />
      ))}
    </div>
  );
}

function SetupSelectionGroup({
  includedItems,
  setupItem,
  setupName
}: {
  includedItems: QuoteSelectionSummaryItem[];
  setupItem?: QuoteSelectionSummaryItem;
  setupName?: string;
}) {
  if (!setupItem && !includedItems.length) {
    return null;
  }

  const normalizedIncludedItems = includedItems.map((includedItem) => ({
    ...includedItem,
    quantity: includedItem.setupBaseQuantity ?? includedItem.quantity
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

  return (
    <div className="stitch-selection-setup-group">
      {setupItem ? (
        <SelectionRow
          detailBasePath="/listings"
          item={setupItem}
          quantityItem={setupQuantityItem}
        />
      ) : (
        <h4>{setupName}</h4>
      )}
      {includedItems.length ? (
        <div className="stitch-selection-included-group">
          <h4>Included rental pieces</h4>
          {includedItems.map((item) => (
            <SelectionRow
              detailBasePath="/catalogue"
              item={item}
              key={quoteSelectionItemKey(item)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function QuoteSelectionSummary({
  category,
  event,
  fallbackItems = [],
  requestedSlug,
  search
}: {
  category?: string;
  event?: string;
  fallbackItems?: QuoteSelectionSummaryItem[];
  requestedSlug?: string;
  search?: string;
}) {
  const [items, setItems] = useState<QuoteSelectionItem[]>([]);
  const visibleItems: QuoteSelectionSummaryItem[] = items.length ? items : fallbackItems;
  const hasDiscoveryContext = Boolean(requestedSlug || category || event || search);
  const groupedItems = getGroupedSelectionItems(visibleItems);

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
    <section className="stitch-quote-card stitch-quote-selection">
      <p className="stitch-eyebrow">Your Selection</p>
      <h2>Your Selection</h2>
      {visibleItems.length ? (
        <>
          <SelectionGroup
            detailBasePath="/catalogue"
            items={groupedItems.rentalItems}
            title="Selected Rental Items"
          />
          {groupedItems.setupGroups.length ? (
            <div className="stitch-selection-group stitch-selection-group--setups">
              <h3>Selected Setup Directions</h3>
              {groupedItems.setupGroups.map((group) => (
                <SetupSelectionGroup
                  includedItems={group.includedItems}
                  key={group.setupItem?.slug ?? group.setupName}
                  setupItem={group.setupItem}
                  setupName={group.setupName}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p>
            {requestedSlug
              ? "The listing link may be old or unavailable. Keep this reference as synced request context if it still describes what you need."
              : "Share the requested pieces or setup direction you have in mind. The team can review your event context and follow up directly."}
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

    const currentItems = readQuoteSelection();
    const includedItems = normalizeIncludedItems(item);
    const itemsToUpsert = [normalizedItem, ...includedItems];
    const existingItem = currentItems.find(
      (selected) =>
        quoteSelectionItemKey(selected) === quoteSelectionItemKey(normalizedItem)
    );
    let nextItems = currentItems.map((selected) => {
      const sourceItem = itemsToUpsert.find(
        (upsertItem) =>
          quoteSelectionItemKey(upsertItem) === quoteSelectionItemKey(selected)
      );

      if (!sourceItem) {
        return selected;
      }

      return mergeQuoteItemMetadata(
        selected,
        sourceItem,
        Math.min(999, selected.quantity + selectionQuantityStep(sourceItem, item))
      );
    });

    if (!existingItem) {
      nextItems = [...nextItems, normalizedItem];
    }

    includedItems.forEach((includedItem) => {
      if (
        !nextItems.some(
          (selected) =>
            quoteSelectionItemKey(selected) === quoteSelectionItemKey(includedItem)
        )
      ) {
        nextItems.push(includedItem);
      }
    });

    nextItems = nextItems.slice(0, maxStoredQuoteItems);

    writeQuoteSelection(nextItems);
    setItems(nextItems);
  }

  function handleDecrementQuantity(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    const normalizedItem = normalizeQuoteItem(item);

    if (!normalizedItem) {
      return;
    }

    const includedItems = normalizeIncludedItems(item);
    const itemsToUpdate = [normalizedItem, ...includedItems];
    const nextItems = readQuoteSelection()
      .map((selected) => {
        const sourceItem = itemsToUpdate.find(
          (updateItem) =>
            quoteSelectionItemKey(updateItem) === quoteSelectionItemKey(selected)
        );

        if (!sourceItem) {
          return selected;
        }

        return mergeQuoteItemMetadata(
          selected,
          sourceItem,
          sourceItem.kind === "setup-included"
            ? Math.max(
                0,
                selected.quantity - selectionQuantityStep(sourceItem, item)
              )
            : selected.quantity - selectionQuantityStep(sourceItem, item)
        );
      })
      .filter((selected, _index, selectedItems) => {
        if (selected.kind === "setup-included") {
          return selectedItems.some(
            (candidate) =>
              candidate.kind === "setup" &&
              candidate.slug === selected.setupSlug &&
              candidate.quantity > 0
          );
        }

        return selected.quantity > 0;
      });

    writeQuoteSelection(nextItems);
    setItems(nextItems);
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
        onClick={handleIncrementQuantity}
        type="button"
      >
        +
      </button>
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
    () => items.reduce((total, item) => total + item.quantity, 0),
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
