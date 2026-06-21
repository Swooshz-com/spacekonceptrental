"use client";

import { useState } from "react";
import { useQuoteList } from "./QuoteListContext";

type AddToQuoteButtonProps = {
  listing: {
    slug: string;
    name: string;
    categoryName?: string;
  };
  className?: string;
  style?: React.CSSProperties;
};

export default function AddToQuoteButton({ listing, className, style }: AddToQuoteButtonProps) {
  const { items, addItem } = useQuoteList();
  const [added, setAdded] = useState(false);

  const isAdded = items.some(item => item.slug === listing.slug) || added;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAdded) return;
    
    addItem(listing);
    setAdded(true);
    
    // Optional: revert the "Added" text after a short delay
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      className={className}
      style={style}
      disabled={isAdded}
      aria-label={`Add ${listing.name} to quote list`}
    >
      {isAdded ? "Added to Quote" : "Add to Quote"}
    </button>
  );
}
