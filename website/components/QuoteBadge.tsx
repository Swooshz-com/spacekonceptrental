"use client";

import { useQuoteList } from "./QuoteListContext";

export default function QuoteBadge() {
  const { items } = useQuoteList();
  
  if (items.length === 0) return null;

  return (
    <span> ({items.length})</span>
  );
}
