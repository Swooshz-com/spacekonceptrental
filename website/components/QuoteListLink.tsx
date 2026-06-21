"use client";

import Link from "next/link";
import { useQuoteList } from "./QuoteListContext";

export default function QuoteListLink({ className }: { className?: string }) {
  const { items } = useQuoteList();
  
  return (
    <Link href="/quote" className={className}>
      Quote List {items.length > 0 ? `(${items.length})` : ""}
    </Link>
  );
}
