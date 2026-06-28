"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";

export type QuoteSelectionItem = {
  category?: string;
  name: string;
  quantity: number;
  slug: string;
};

type QuoteSelectionSummaryItem = QuoteSelectionItem & { imageSrc?: string };

const quoteSelectionStorageKey = "skr.quoteSelection.v1";
const quoteSelectionChangeEvent = "skr:quote-selection-change";
const maxStoredQuoteItems = 20;
const publicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeQuoteItem(item: QuoteSelectionItem) {
  const slug = item.slug.trim().toLowerCase();
  const name = item.name.trim();
  const category = item.category?.trim();
  const quantity = Number.isFinite(item.quantity)
    ? Math.max(1, Math.min(99, Math.floor(item.quantity)))
    : 1;

  if (!slug || !name || !publicSlugPattern.test(slug)) {
    return undefined;
  }

  return {
    slug,
    name: name.slice(0, 120),
    quantity,
    ...(category ? { category: category.slice(0, 80) } : {})
  };
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
      .filter((item): item is QuoteSelectionItem => Boolean(item))
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

export function getStoredQuoteSelection() {
  return readQuoteSelection();
}

export function clearStoredQuoteSelection() {
  writeQuoteSelection([]);
}

export function formatQuoteSelectionItems(items: QuoteSelectionItem[]) {
  return items
    .map((item) =>
      item.quantity > 1 ? `${item.name} x ${item.quantity}` : item.name
    )
    .join("\n");
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
        <div className="stitch-selection-group">
          <h3>Selected Rental Items</h3>
          {visibleItems.map((item) => (
            <article className="stitch-selection-row" key={item.slug}>
              {item.imageSrc ? (
                <img alt={`${item.name} thumbnail`} src={item.imageSrc} />
              ) : (
                <span className="stitch-selection-row__icon" aria-hidden="true">SK</span>
              )}
              <div>
                <strong>{item.name}</strong>
                <small>Qty: {item.quantity}</small>
                {item.category ? <small>{item.category}</small> : null}
              </div>
              <Link href={`/catalogue/${item.slug}`}>Details</Link>
            </article>
          ))}
        </div>
      ) : (
        <>
          <p>
            {requestedSlug
              ? "The listing link may be old or unavailable. Keep this reference as editable request text if it still describes what you need."
              : "Share the requested pieces or setup direction you have in mind. The team can review your event context and follow up directly."}
          </p>
          {hasDiscoveryContext ? (
            <>
              <p>Discovery context is editable request intake only. Adjust the requested listings or items before sending.</p>
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

export function QuoteSelectionButton({ ariaLabel, item }: { ariaLabel?: string; item: QuoteSelectionItem }) {
  const [items, setItems] = useState<QuoteSelectionItem[]>([]);
  const selectedItem = items.find((selected) => selected.slug === item.slug);

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

  function handleAddToQuote(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const normalizedItem = normalizeQuoteItem(item);

    if (!normalizedItem) {
      return;
    }

    const currentItems = readQuoteSelection();
    const existingItem = currentItems.find(
      (selected) => selected.slug === normalizedItem.slug
    );
    const nextItems = existingItem
      ? currentItems.map((selected) =>
          selected.slug === normalizedItem.slug
            ? {
                ...selected,
                quantity: Math.min(99, selected.quantity + 1)
              }
            : selected
        )
      : [...currentItems, normalizedItem].slice(0, maxStoredQuoteItems);

    writeQuoteSelection(nextItems);
    setItems(nextItems);
  }

  function handleRemoveFromQuote(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    const normalizedItem = normalizeQuoteItem(item);

    if (!normalizedItem) {
      return;
    }

    const nextItems = readQuoteSelection().filter(
      (selected) => selected.slug !== normalizedItem.slug
    );

    writeQuoteSelection(nextItems);
    setItems(nextItems);
  }

  return (
    <span
      className="stitch-quote-select-controls"
      data-selected={selectedItem ? "true" : "false"}
    >
      <a
        aria-label={ariaLabel}
        className="stitch-link-button stitch-quote-select-button"
        href={`/quote?listing=${encodeURIComponent(item.slug)}`}
        onClick={handleAddToQuote}
      >
        {selectedItem ? `Added (${selectedItem.quantity})` : "Add to Quote"}
      </a>
      {selectedItem ? (
        <button
          aria-label={`Remove ${item.name} from quote`}
          className="stitch-link-button stitch-quote-remove-button"
          onClick={handleRemoveFromQuote}
          type="button"
        >
          Remove
        </button>
      ) : null}
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
