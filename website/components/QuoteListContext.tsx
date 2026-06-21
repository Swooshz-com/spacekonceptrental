"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type QuoteItem = {
  slug: string;
  name: string;
  categoryName?: string;
  rentalUnit?: string;
};

type QuoteListContextType = {
  items: QuoteItem[];
  addItem: (item: QuoteItem) => void;
  removeItem: (slug: string) => void;
  clearItems: () => void;
};

const QuoteListContext = createContext<QuoteListContextType | undefined>(undefined);

export function QuoteListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("skr_quote_list");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse quote list from local storage", err);
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem("skr_quote_list", JSON.stringify(items));
    } catch (err) {
      console.error("Failed to save quote list to local storage", err);
    }
  }, [items]);

  const addItem = (item: QuoteItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.slug === item.slug)) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  };

  const clearItems = () => {
    setItems([]);
  };

  return (
    <QuoteListContext.Provider value={{ items, addItem, removeItem, clearItems }}>
      {children}
    </QuoteListContext.Provider>
  );
}

export function useQuoteList() {
  const context = useContext(QuoteListContext);
  if (!context) {
    throw new Error("useQuoteList must be used within a QuoteListProvider");
  }
  return context;
}
