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

  return (
    <a
      aria-label={ariaLabel}
      className="stitch-link-button stitch-quote-select-button"
      href={`/quote?listing=${encodeURIComponent(item.slug)}`}
      onClick={handleAddToQuote}
    >
      {selectedItem ? `Added (${selectedItem.quantity})` : "Add to Quote"}
    </a>
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
