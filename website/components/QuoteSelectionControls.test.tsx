import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QUOTE_SELECTION_STORAGE_KEY } from "../lib/quote/selection-model";
import {
  QuoteSelectionBadge,
  QuoteSelectionButton,
  QuoteSelectionDataBoundary,
  QuoteSelectionIndicator,
  QuoteSelectionSummary,
  formatQuoteSelectionItems
} from "./QuoteSelectionControls";

const chair = {
  slug: "lounge-chair",
  name: "Lounge Chair",
  category: "Seating",
  quantity: 1
};

function storedRows() {
  return JSON.parse(
    window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "{}"
  ) as {
    version: number;
    rows: Array<{
      kind: string;
      reference: string;
      quantity: number;
      source: string;
      order: number;
      subkind?: string;
    }>;
  };
}

describe("QuoteSelectionControls", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("persists catalogue references in v2 session storage with subkind and updates same-tab consumers", () => {
    render(
      <>
        <QuoteSelectionButton item={chair} />
        <QuoteSelectionBadge item={chair} />
        <QuoteSelectionIndicator />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: /increase lounge chair/i }));

    expect(storedRows()).toEqual({
      version: 2,
      rows: [
        {
          kind: "catalogue",
          reference: "lounge-chair",
          quantity: 1,
          source: "catalogue",
          order: 0,
          subkind: "rental"
        }
      ]
    });
    expect(screen.getByLabelText(/lounge chair: 1 selected/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request quote with 1 selected item/i })
    ).toBeInTheDocument();
  });

  it("updates quantity through 1..99 and treats zero as remove", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 98,
            source: "catalogue",
            order: 0,
            subkind: "rental"
          }
        ]
      })
    );
    render(<QuoteSelectionButton item={chair} />);

    const increase = screen.getByRole("button", { name: /increase lounge chair/i });
    fireEvent.click(increase);

    expect(storedRows().rows[0]?.quantity).toBe(99);
    expect(increase).toBeDisabled();

    for (let index = 0; index < 99; index += 1) {
      fireEvent.click(
        screen.getByRole("button", { name: /decrease lounge chair/i })
      );
    }

    expect(storedRows().rows).toEqual([]);
  });

  it("retains stale references and renders unavailable recovery with distinct labels", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "retired-chair",
            quantity: 2,
            source: "catalogue",
            order: 0,
            subkind: "rental"
          }
        ]
      })
    );

    render(
      <>
        <QuoteSelectionDataBoundary validItems={[]} />
        <QuoteSelectionSummary catalogueAvailable={false} validItems={[]} />
      </>
    );

    expect(screen.getByText("Catalogue unavailable right now")).toBeInTheDocument();
    expect(screen.getByText("Unavailable selection: retired-chair")).toBeInTheDocument();
    expect(screen.getByText(/remove this item or browse/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /remove unavailable selection: retired-chair from selection/i
      })
    ).toBeInTheDocument();
    expect(storedRows().rows[0]?.reference).toBe("retired-chair");
  });

  it("resolves display labels only from the current canonical catalogue", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 2,
            source: "catalogue",
            order: 0
          }
        ]
      })
    );

    render(
      <QuoteSelectionSummary
        catalogueAvailable
        validItems={[
          {
            kind: "rental",
            slug: "lounge-chair",
            name: "Canonical Lounge Chair",
            category: "Canonical Seating"
          }
        ]}
      />
    );

    expect(screen.getByText("Canonical Lounge Chair")).toBeInTheDocument();
    expect(screen.getByText("Canonical Seating")).toBeInTheDocument();
  });

  it("distinguishes genuine empty and catalogue-unavailable states", () => {
    const { rerender } = render(
      <QuoteSelectionSummary catalogueAvailable validItems={[]} />
    );

    expect(screen.getByText("No items selected yet")).toBeInTheDocument();

    rerender(<QuoteSelectionSummary catalogueAvailable={false} validItems={[]} />);

    expect(screen.getByText("Catalogue unavailable right now")).toBeInTheDocument();
  });

  it("seeds only one validated URL fallback row with subkind in the current tab", () => {
    render(
      <QuoteSelectionSummary
        catalogueAvailable
        fallbackItems={[{ ...chair, quantity: 3 }]}
        requestedSlug="lounge-chair"
        validItems={[
          {
            kind: "rental",
            slug: "lounge-chair",
            name: "Lounge Chair"
          }
        ]}
      />
    );

    expect(storedRows().rows).toEqual([
      {
        kind: "catalogue",
        reference: "lounge-chair",
        quantity: 3,
        source: "url",
        order: 0,
        subkind: "rental"
      }
    ]);
  });

  it("preserves direct/setup formatting as derived canonical display context", () => {
    expect(
      formatQuoteSelectionItems([
        {
          slug: "aura-lounge-chair",
          name: "Aura Lounge Chair",
          category: "Seating",
          kind: "rental",
          quantity: 2
        },
        {
          slug: "kinetic-dining-table",
          name: "Kinetic Dining Table",
          category: "Tables",
          kind: "setup-included",
          quantity: 15,
          setupName: "Botanical Wedding",
          setupSlug: "botanical-wedding"
        },
        {
          slug: "botanical-wedding",
          name: "Botanical Wedding",
          category: "Setups",
          kind: "setup",
          quantity: 1
        }
      ])
    ).toBe(
      [
        "Selected rental items:",
        "Aura Lounge Chair x 2",
        "",
        "Setup included rental pieces:",
        "Kinetic Dining Table x 15",
        "",
        "Selected setup directions:",
        "Botanical Wedding"
      ].join("\n")
    );
  });

  it("preserves manual rows when adding a catalogue item", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "manual",
            key: "manual-a",
            description: "Custom counter",
            quantity: 2,
            source: "manual",
            order: 0
          }
        ]
      })
    );

    render(
      <>
        <QuoteSelectionButton item={chair} />
        <QuoteSelectionSummary
          catalogueAvailable
          validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
        />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: /increase lounge chair/i }));

    const rows = storedRows().rows;

    expect(rows).toHaveLength(2);
    expect(rows[0]?.kind).toBe("manual");
    expect(rows[1]?.kind).toBe("catalogue");
  });

  it("preserves manual rows when removing a catalogue item", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "manual",
            key: "manual-a",
            description: "Custom counter",
            quantity: 2,
            source: "manual",
            order: 0
          },
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 1,
            source: "catalogue",
            order: 1,
            subkind: "rental"
          }
        ]
      })
    );

    render(
      <QuoteSelectionSummary
        catalogueAvailable
        validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
      />
    );

    const decrementButtons = screen.getAllByRole("button", { name: /decrease lounge chair/i });
    fireEvent.click(decrementButtons[0]!);

    const rows = storedRows().rows;

    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("manual");
  });

  it("preserves setup kind after navigation/reload simulation", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "botanical-wedding",
            quantity: 1,
            source: "catalogue",
            order: 0,
            subkind: "setup"
          }
        ]
      })
    );

    render(
      <QuoteSelectionSummary
        catalogueAvailable
        validItems={[
          { kind: "setup", slug: "botanical-wedding", name: "Botanical Wedding", category: "Setups" }
        ]}
      />
    );

    expect(screen.getByText("Botanical Wedding")).toBeInTheDocument();
    expect(screen.getByText("Setups")).toBeInTheDocument();
  });

  it("distinguishes multiple unavailable rows with distinct labels and remove controls", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "retired-chair",
            quantity: 1,
            source: "catalogue",
            order: 0,
            subkind: "rental"
          },
          {
            kind: "catalogue",
            reference: "old-table",
            quantity: 2,
            source: "catalogue",
            order: 1,
            subkind: "rental"
          }
        ]
      })
    );

    render(
      <>
        <QuoteSelectionDataBoundary validItems={[]} />
        <QuoteSelectionSummary catalogueAvailable={false} validItems={[]} />
      </>
    );

    expect(screen.getByText("Unavailable selection: retired-chair")).toBeInTheDocument();
    expect(screen.getByText("Unavailable selection: old-table")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remove unavailable selection: retired-chair from selection/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remove unavailable selection: old-table from selection/i })
    ).toBeInTheDocument();
  });

  it("does not seed URL fallback when selection has existing manual rows", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "manual",
            key: "manual-a",
            description: "Custom counter",
            quantity: 1,
            source: "manual",
            order: 0
          }
        ]
      })
    );

    render(
      <QuoteSelectionSummary
        catalogueAvailable
        fallbackItems={[{ ...chair, quantity: 3 }]}
        requestedSlug="lounge-chair"
        validItems={[
          {
            kind: "rental",
            slug: "lounge-chair",
            name: "Lounge Chair"
          }
        ]}
      />
    );

    const rows = storedRows().rows;

    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("manual");
  });

  it("does not render a phantom fallback catalogue row over a manual-only draft", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "manual",
            key: "manual-a",
            description: "Custom counter",
            quantity: 1,
            source: "manual",
            order: 0
          }
        ]
      })
    );

    render(
      <QuoteSelectionSummary
        catalogueAvailable
        fallbackItems={[{ ...chair, quantity: 3 }]}
        requestedSlug="lounge-chair"
        validItems={[
          {
            kind: "rental",
            slug: "lounge-chair",
            name: "Lounge Chair"
          }
        ]}
      />
    );

    expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
    expect(screen.queryByText(/qty.*3/i)).not.toBeInTheDocument();
  });

  it("does not seed URL fallback when selection has existing catalogue rows", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "table",
            quantity: 1,
            source: "catalogue",
            order: 0,
            subkind: "rental"
          }
        ]
      })
    );

    render(
      <QuoteSelectionSummary
        catalogueAvailable
        fallbackItems={[{ ...chair, quantity: 3 }]}
        requestedSlug="lounge-chair"
        validItems={[
          {
            kind: "rental",
            slug: "lounge-chair",
            name: "Lounge Chair"
          }
        ]}
      />
    );

    const rows = storedRows().rows;

    expect(rows).toHaveLength(1);
    expect(rows[0]?.reference).toBe("table");
  });

  it("does not export uncontrolled direct storage writers", async () => {
    const mod = await import("./QuoteSelectionControls");
    expect("clearStoredQuoteSelection" in mod).toBe(false);
    expect("getStoredQuoteSelection" in mod).toBe(false);
    expect("writeQuoteSelection" in mod).toBe(false);
  });

  describe("Run-12 — catalogue transaction failure handling", () => {
    function createFaultyStorage(overrides: {
      writeMismatch?: boolean;
      removeThrows?: boolean;
      seedValue?: string | null;
    }) {
      const real = window.sessionStorage;
      let inner: string | null = overrides.seedValue ?? null;
      let writeCount = 0;
      const faulty: Storage = {
        get length() { return inner === null ? 0 : 1; },
        key: (index: number) => index === 0 && inner !== null ? QUOTE_SELECTION_STORAGE_KEY : null,
        getItem: (key: string) => key === QUOTE_SELECTION_STORAGE_KEY ? inner : real.getItem(key),
        setItem: (key: string, value: string) => {
          if (key === QUOTE_SELECTION_STORAGE_KEY) {
            writeCount += 1;
            if (overrides.writeMismatch && writeCount === 1) {
              inner = '{"tampered":true}';
              return;
            }
            inner = value;
            return;
          }
          real.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (key === QUOTE_SELECTION_STORAGE_KEY) {
            if (overrides.removeThrows) {
              throw new Error("quota");
            }
            inner = null;
            return;
          }
          real.removeItem(key);
        },
        clear: () => {
          inner = null;
          real.clear();
        }
      };
      Object.defineProperty(window, "sessionStorage", {
        value: faulty,
        writable: true,
        configurable: true
      });
      return {
        getInner: () => inner,
        restore: () => {
          Object.defineProperty(window, "sessionStorage", {
            value: real,
            writable: true,
            configurable: true
          });
        }
      };
    }

    afterEach(() => {
      Object.defineProperty(window, "sessionStorage", {
        value: new (class implements Storage {
          private store = new Map<string, string>();
          get length() { return this.store.size; }
          key(i: number) { return Array.from(this.store.keys())[i] ?? null; }
          getItem(k: string) { return this.store.get(k) ?? null; }
          setItem(k: string, v: string) { this.store.set(k, String(v)); }
          removeItem(k: string) { this.store.delete(k); }
          clear() { this.store.clear(); }
        })(),
        writable: true,
        configurable: true
      });
    });

    it("catalogue increment with write failure shows bounded error and resyncs UI", () => {
      const faulty = createFaultyStorage({ writeMismatch: true });
      try {
        render(<QuoteSelectionButton item={chair} />);
        fireEvent.click(screen.getByRole("button", { name: /increase lounge chair/i }));

        expect(screen.getByText(/selection storage could not be updated|could not be updated/i)).toBeInTheDocument();
        expect(faulty.getInner()).toBeNull();
      } finally {
        faulty.restore();
      }
    });

    it("catalogue decrement with write failure shows bounded error and resyncs UI", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "lounge-chair",
              quantity: 3,
              source: "catalogue",
              order: 0,
              subkind: "rental"
            }
          ]
        })
      );

      const faulty = createFaultyStorage({ writeMismatch: true, seedValue: window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) });
      try {
        render(<QuoteSelectionButton item={chair} />);
        fireEvent.click(screen.getByRole("button", { name: /decrease lounge chair/i }));
        expect(screen.getByText(/selection storage could not be updated|could not be updated/i)).toBeInTheDocument();
      } finally {
        faulty.restore();
      }
    });

    it("successful retry after failure works correctly", () => {
      const faulty = createFaultyStorage({ writeMismatch: true });
      try {
        const { unmount } = render(<QuoteSelectionButton item={chair} />);
        fireEvent.click(screen.getByRole("button", { name: /increase lounge chair/i }));
        expect(screen.getByText(/could not be updated/i)).toBeInTheDocument();
        unmount();
        cleanup();
      } finally {
        faulty.restore();
      }

      window.sessionStorage.clear();
      render(<QuoteSelectionButton item={chair} />);
      fireEvent.click(screen.getByRole("button", { name: /increase lounge chair/i }));
      expect(storedRows().rows).toHaveLength(1);
      expect(storedRows().rows[0]?.quantity).toBe(1);
    });
  });

  describe("Run-12 — catalogue-unavailable URL fallback gating", () => {
    it("does not seed URL fallback row when catalogue is unavailable", () => {
      render(
        <QuoteSelectionSummary
          catalogueAvailable={false}
          fallbackItems={[{ ...chair, quantity: 3 }]}
          requestedSlug="lounge-chair"
          validItems={[]}
        />
      );

      expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
      expect(screen.getByText("Catalogue unavailable right now")).toBeInTheDocument();
    });

    it("shows discovery context for requested slug when catalogue is unavailable", () => {
      render(
        <QuoteSelectionSummary
          catalogueAvailable={false}
          fallbackItems={[{ ...chair, quantity: 3 }]}
          requestedSlug="lounge-chair"
          validItems={[]}
        />
      );

      expect(screen.getByText(/lounge-chair/)).toBeInTheDocument();
      expect(screen.getByText(/has not been added or replaced/i)).toBeInTheDocument();
    });
  });

  describe("Run-12 — fallback consumption and dismissal lifecycle", () => {
    it("does not reappear after successful seed and removal", () => {
      render(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[{ ...chair, quantity: 3 }]}
          requestedSlug="lounge-chair"
          validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
        />
      );

      expect(storedRows().rows).toHaveLength(1);
      expect(storedRows().rows[0]?.reference).toBe("lounge-chair");

      const removeButtons = screen.getAllByRole("button", { name: /remove lounge chair from selection/i });
      fireEvent.click(removeButtons[0]!);

      expect(storedRows().rows).toEqual([]);
      expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
    });

    it("rerender after removal does not resurrect fallback", () => {
      const { rerender } = render(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[{ ...chair, quantity: 3 }]}
          requestedSlug="lounge-chair"
          validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
        />
      );

      const removeButtons = screen.getAllByRole("button", { name: /remove lounge chair from selection/i });
      fireEvent.click(removeButtons[0]!);

      rerender(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[{ ...chair, quantity: 3 }]}
          requestedSlug="lounge-chair"
          validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
        />
      );

      expect(storedRows().rows).toEqual([]);
      expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
    });

    it("storage event after removal does not resurrect fallback", () => {
      render(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[{ ...chair, quantity: 3 }]}
          requestedSlug="lounge-chair"
          validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
        />
      );

      const removeButtons = screen.getAllByRole("button", { name: /remove lounge chair from selection/i });
      fireEvent.click(removeButtons[0]!);

      window.dispatchEvent(new Event("storage"));

      expect(storedRows().rows).toEqual([]);
      expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
    });
  });

  describe("Run-12 — summary storage-read failure handling", () => {
    function createThrowingStorage() {
      const real = window.sessionStorage;
      const faulty: Storage = {
        get length(): number { throw new Error("storage blocked"); },
        key: (): string | null => { throw new Error("storage blocked"); },
        getItem: (): string | null => { throw new Error("storage blocked"); },
        setItem: (): void => { throw new Error("storage blocked"); },
        removeItem: (): void => { throw new Error("storage blocked"); },
        clear: (): void => { throw new Error("storage blocked"); }
      };
      Object.defineProperty(window, "sessionStorage", {
        value: faulty,
        writable: true,
        configurable: true
      });
      return {
        restore: () => {
          Object.defineProperty(window, "sessionStorage", {
            value: real,
            writable: true,
            configurable: true
          });
        }
      };
    }

    afterEach(() => {
      Object.defineProperty(window, "sessionStorage", {
        value: new (class implements Storage {
          private store = new Map<string, string>();
          get length() { return this.store.size; }
          key(i: number) { return Array.from(this.store.keys())[i] ?? null; }
          getItem(k: string) { return this.store.get(k) ?? null; }
          setItem(k: string, v: string) { this.store.set(k, String(v)); }
          removeItem(k: string) { this.store.delete(k); }
          clear() { this.store.clear(); }
        })(),
        writable: true,
        configurable: true
      });
    });

    it("does not crash on mount when sessionStorage throws", () => {
      const faulty = createThrowingStorage();
      try {
        expect(() => render(
          <QuoteSelectionSummary catalogueAvailable validItems={[]} />
        )).not.toThrow();
        expect(screen.getByText(/selection storage unavailable/i)).toBeInTheDocument();
      } finally {
        faulty.restore();
      }
    });

    it("storage event does not crash when storage throws", () => {
      const faulty = createThrowingStorage();
      try {
        render(<QuoteSelectionSummary catalogueAvailable validItems={[]} />);
        expect(() => window.dispatchEvent(new Event("storage"))).not.toThrow();
        expect(screen.getByText(/selection storage unavailable/i)).toBeInTheDocument();
      } finally {
        faulty.restore();
      }
    });

    it("does not seed fallback when storage is unavailable", () => {
      const faulty = createThrowingStorage();
      try {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[{ ...chair, quantity: 3 }]}
            requestedSlug="lounge-chair"
            validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
          />
        );
        expect(screen.getByText(/selection storage unavailable/i)).toBeInTheDocument();
      } finally {
        faulty.restore();
      }
    });
  });

  describe("Run-12 — manual rows in selection status and count", () => {
    it("manual-only draft does not show 'No items selected yet'", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "manual",
              key: "manual-a",
              description: "Custom counter",
              quantity: 1,
              source: "manual",
              order: 0
            }
          ]
        })
      );

      render(
        <QuoteSelectionSummary catalogueAvailable validItems={[]} />
      );

      expect(screen.queryByText("No items selected yet")).not.toBeInTheDocument();
      expect(screen.getByText("Manual requirement")).toBeInTheDocument();
    });

    it("header indicator includes manual rows in count", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "manual",
              key: "manual-a",
              description: "Custom counter",
              quantity: 2,
              source: "manual",
              order: 0
            }
          ]
        })
      );

      render(<QuoteSelectionIndicator />);

      expect(screen.getByRole("link", { name: /request quote with 1 selected item/i })).toBeInTheDocument();
    });

    it("mixed catalogue and manual draft counts correctly in indicator", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "lounge-chair",
              quantity: 2,
              source: "catalogue",
              order: 0,
              subkind: "rental"
            },
            {
              kind: "manual",
              key: "manual-a",
              description: "Custom counter",
              quantity: 1,
              source: "manual",
              order: 1
            }
          ]
        })
      );

      render(<QuoteSelectionIndicator />);

      expect(screen.getByRole("link", { name: /request quote with 2 selected items/i })).toBeInTheDocument();
    });

    it("summary shows manual requirement label for manual rows", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "manual",
              key: "manual-a",
              description: "Custom counter",
              quantity: 3,
              source: "manual",
              order: 0
            },
            {
              kind: "manual",
              key: "manual-b",
              description: "Another item",
              quantity: 1,
              source: "manual",
              order: 1
            }
          ]
        })
      );

      render(
        <QuoteSelectionSummary catalogueAvailable validItems={[]} />
      );

      expect(screen.getByText("2 manual requirements")).toBeInTheDocument();
    });

    it("single manual row shows singular label", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "manual",
              key: "manual-a",
              description: "Custom counter",
              quantity: 1,
              source: "manual",
              order: 0
            }
          ]
        })
      );

      render(
        <QuoteSelectionSummary catalogueAvailable validItems={[]} />
      );

      expect(screen.getByText("1 manual requirement")).toBeInTheDocument();
    });
  });

  describe("Run-13 — summary-removal failure closure", () => {
    const existingCatalogueRow = () => ({
      version: 2 as const,
      rows: [
        {
          kind: "catalogue" as const,
          reference: "lounge-chair",
          quantity: 1,
          source: "catalogue" as const,
          order: 0,
          subkind: "rental" as const
        }
      ]
    });

    const existingCatalogueRowJson = () => JSON.stringify(existingCatalogueRow());

    function createFaultyStorage(overrides: {
      writeMismatch?: boolean;
      restoreThrows?: boolean;
      restoreNoop?: boolean;
      seedValue?: string | null;
    }) {
      const real = window.sessionStorage;
      let inner: string | null = overrides.seedValue ?? null;
      let writeCount = 0;
      const faulty: Storage = {
        get length() { return inner === null ? 0 : 1; },
        key: (index: number) => index === 0 && inner !== null ? QUOTE_SELECTION_STORAGE_KEY : null,
        getItem: (key: string) => key === QUOTE_SELECTION_STORAGE_KEY ? inner : real.getItem(key),
        setItem: (key: string, value: string) => {
          if (key === QUOTE_SELECTION_STORAGE_KEY) {
            writeCount += 1;
            if (overrides.writeMismatch && writeCount === 1) {
              inner = '{"tampered":true}';
              return;
            }
            if (overrides.restoreThrows && writeCount >= 2) {
              throw new Error("quota");
            }
            if (overrides.restoreNoop && writeCount >= 2) {
              inner = '{"stale":true}';
              return;
            }
            inner = value;
            return;
          }
          real.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (key === QUOTE_SELECTION_STORAGE_KEY) {
            if (overrides.restoreThrows) {
              throw new Error("quota");
            }
            inner = null;
            return;
          }
          real.removeItem(key);
        },
        clear: () => {
          inner = null;
          real.clear();
        }
      };
      Object.defineProperty(window, "sessionStorage", {
        value: faulty,
        writable: true,
        configurable: true
      });
      return {
        getInner: () => inner,
        restore: () => {
          Object.defineProperty(window, "sessionStorage", {
            value: real,
            writable: true,
            configurable: true
          });
        }
      };
    }

    function renderSummaryWithRow(validItemsOverride?: { kind: "rental"; slug: string; name: string; category?: string }[]) {
      window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, existingCatalogueRowJson());
      return render(
        <QuoteSelectionSummary
          catalogueAvailable
          validItems={validItemsOverride ?? [{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair", category: "Seating" }]}
        />
      );
    }

    function clickRemoveLoungeChair() {
      const removeButton = screen.getByRole("button", { name: /remove.*lounge.*from selection/i });
      fireEvent.click(removeButton);
    }

    afterEach(() => {
      Object.defineProperty(window, "sessionStorage", {
        value: new (class implements Storage {
          private store = new Map<string, string>();
          get length() { return this.store.size; }
          key(i: number) { return Array.from(this.store.keys())[i] ?? null; }
          getItem(k: string) { return this.store.get(k) ?? null; }
          setItem(k: string, v: string) { this.store.set(k, String(v)); }
          removeItem(k: string) { this.store.delete(k); }
          clear() { this.store.clear(); }
        })(),
        writable: true,
        configurable: true
      });
    });

    it("write/read-back mismatch: row remains visible, bounded error shown, no success event emitted", () => {
      const faulty = createFaultyStorage({ writeMismatch: true, seedValue: existingCatalogueRowJson() });
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      try {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
          />
        );
        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();

        clickRemoveLoungeChair();

        expect(faulty.getInner()).toBe(existingCatalogueRowJson());
        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();
        expect(screen.getAllByText(/could not be removed|storage could not be updated/i).length).toBeGreaterThan(0);
        expect(dispatchSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({ type: "skr:quote-selection-change" })
        );
      } finally {
        vi.restoreAllMocks();
        faulty.restore();
      }
    });

    it("dispatch failure: row remains visible, bounded error shown, storage resynced", () => {
      window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, existingCatalogueRowJson());
      const dispatchSpy = vi.spyOn(window, "dispatchEvent").mockImplementation(() => {
        throw new Error("dispatch blocked");
      });
      try {
        renderSummaryWithRow();
        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();

        clickRemoveLoungeChair();

        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();
        expect(screen.getAllByText(/could not be removed|storage could not be updated/i).length).toBeGreaterThan(0);
        const stored = window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY);
        expect(stored).toBe(existingCatalogueRowJson());
      } finally {
        dispatchSpy.mockRestore();
      }
    });

    it("restoration failure: bounded error shown, UI reflects actual storage", () => {
      const faulty = createFaultyStorage({ writeMismatch: true, restoreThrows: true, seedValue: existingCatalogueRowJson() });
      try {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
          />
        );
        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();

        clickRemoveLoungeChair();

        expect(screen.getAllByText(/could not be removed|storage could not be updated/i).length).toBeGreaterThan(0);
        expect(screen.queryByText("quota")).not.toBeInTheDocument();
      } finally {
        faulty.restore();
      }
    });

    it("restore-noop restoration: bounded failure, no raw exception text visible", () => {
      const faulty = createFaultyStorage({ writeMismatch: true, restoreNoop: true, seedValue: existingCatalogueRowJson() });
      try {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
          />
        );
        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();

        clickRemoveLoungeChair();

        expect(screen.getAllByText(/could not be removed|storage could not be updated/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/exception|quota|blocked/i)).not.toBeInTheDocument();
      } finally {
        faulty.restore();
      }
    });

    it("successful removal: row disappears, manual rows survive, no error remains", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            existingCatalogueRow().rows[0],
            {
              kind: "manual" as const,
              key: "manual-a",
              description: "Custom counter",
              quantity: 1,
              source: "manual" as const,
              order: 1
            }
          ]
        })
      );

      render(
        <QuoteSelectionSummary
          catalogueAvailable
          validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair", category: "Seating" }]}
        />
      );

      expect(screen.getByText("Lounge Chair")).toBeInTheDocument();
      expect(screen.getByText("Manual requirement")).toBeInTheDocument();

      clickRemoveLoungeChair();

      expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
      expect(screen.getByText("Manual requirement")).toBeInTheDocument();
      expect(screen.queryByText(/could not be removed|storage could not be updated/i)).not.toBeInTheDocument();

      const stored = JSON.parse(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "{}") as { rows: unknown[] };
      expect(stored.rows).toHaveLength(1);
      expect((stored.rows[0] as Record<string, unknown>).kind).toBe("manual");
    });

    it("seeded URL fallback removal: row removed, rerender does not resurrect", () => {
      window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, existingCatalogueRowJson());

      const { rerender } = render(
        <QuoteSelectionSummary
          catalogueAvailable
          validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
        />
      );

      expect(screen.getByText("Lounge Chair")).toBeInTheDocument();
      clickRemoveLoungeChair();

      rerender(
        <QuoteSelectionSummary
          catalogueAvailable
          validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
        />
      );

      expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
      expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeDefined();
      const stored = JSON.parse(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "{}") as { rows: unknown[] };
      expect(stored.rows).toEqual([]);
    });

    it("seeded URL fallback removal: storage event does not resurrect", () => {
      window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, existingCatalogueRowJson());

      render(
        <QuoteSelectionSummary
          catalogueAvailable
          validItems={[{ kind: "rental", slug: "lounge-chair", name: "Lounge Chair" }]}
        />
      );

      expect(screen.getByText("Lounge Chair")).toBeInTheDocument();
      clickRemoveLoungeChair();

      window.dispatchEvent(new Event("storage"));

      expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
    });

    it("unavailable stored catalogue reference: Remove item follows same failure handling", () => {
      const faulty = createFaultyStorage({ writeMismatch: true, seedValue: existingCatalogueRowJson() });
      try {
        render(
          <QuoteSelectionSummary catalogueAvailable={false} validItems={[]} />
        );
        expect(screen.getByText("Catalogue unavailable right now")).toBeInTheDocument();

        clickRemoveLoungeChair();

        expect(screen.getAllByText(/unavailable selection/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/could not be removed|storage could not be updated/i).length).toBeGreaterThan(0);
      } finally {
        faulty.restore();
      }
    });
  });

  describe("Run-14 — URL-source dismissal after reload and failed-resync preservation", () => {
    const urlSourceRowJson = () => JSON.stringify({
      version: 2,
      rows: [
        {
          kind: "catalogue",
          reference: "lounge-chair",
          quantity: 2,
          source: "url",
          order: 0,
          subkind: "rental"
        }
      ]
    });

    const rentalValidItem = { kind: "rental" as const, slug: "lounge-chair", name: "Lounge Chair" };

    const fallbackItem = { slug: "lounge-chair", name: "Lounge Chair", quantity: 2 };

    function seedUrlSourceSelection() {
      window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, urlSourceRowJson());
    }

    function renderSummaryWithUrlFallback() {
      return render(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[fallbackItem]}
          requestedSlug="lounge-chair"
          validItems={[rentalValidItem]}
        />
      );
    }

    beforeEach(() => {
      window.sessionStorage.clear();
    });

    afterEach(() => {
      cleanup();
    });

    describe("Defect A — URL-source row present before mount", () => {
      it("stored URL-source row is visible on mount", () => {
        seedUrlSourceSelection();
        renderSummaryWithUrlFallback();
        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();
      });

      it("removing the URL-source row does not re-seed the same fallback", () => {
        seedUrlSourceSelection();
        renderSummaryWithUrlFallback();
        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();

        const removeButton = screen.getByRole("button", { name: /remove.*lounge.*from selection/i });
        fireEvent.click(removeButton);

        expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
        const stored = JSON.parse(
          window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "{}"
        ) as { rows: unknown[] };
        expect(stored.rows).toEqual([]);
      });

      it("rerender after URL-source row removal does not resurrect the fallback", () => {
        seedUrlSourceSelection();
        const { rerender } = renderSummaryWithUrlFallback();

        const removeButton = screen.getByRole("button", { name: /remove.*lounge.*from selection/i });
        fireEvent.click(removeButton);

        rerender(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[fallbackItem]}
            requestedSlug="lounge-chair"
            validItems={[rentalValidItem]}
          />
        );

        expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
      });

      it("storage event after URL-source row removal does not resurrect the fallback", () => {
        seedUrlSourceSelection();
        renderSummaryWithUrlFallback();

        const removeButton = screen.getByRole("button", { name: /remove.*lounge.*from selection/i });
        fireEvent.click(removeButton);

        window.dispatchEvent(new Event("storage"));

        expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
      });

      it("does not claim the current selection was reloaded after failed read", () => {
        seedUrlSourceSelection();
        renderSummaryWithUrlFallback();

        expect(screen.queryByText(/selection has been reloaded/i)).not.toBeInTheDocument();
      });
    });

    describe("Defect B — storage becomes unreadable during removal", () => {
      function createThrowingStorageAfterRead() {
        const real = window.sessionStorage;
        let callCount = 0;
        const inner = real.getItem(QUOTE_SELECTION_STORAGE_KEY);
        const faulty: Storage = {
          get length() { return inner === null ? 0 : 1; },
          key: () => real.key(0),
          getItem: (key: string) => {
            if (key === QUOTE_SELECTION_STORAGE_KEY) {
              callCount++;
              if (callCount <= 2) {
                return real.getItem(key);
              }
              throw new Error("storage blocked");
            }
            return real.getItem(key);
          },
          setItem: (key: string, value: string) => { real.setItem(key, value); },
          removeItem: (key: string) => { real.removeItem(key); },
          clear: () => { real.clear(); }
        };
        Object.defineProperty(window, "sessionStorage", {
          value: faulty,
          writable: true,
          configurable: true
        });
        return {
          restore: () => {
            Object.defineProperty(window, "sessionStorage", {
              value: real,
              writable: true,
              configurable: true
            });
          }
        };
      }

      afterEach(() => {
        cleanup();
      });

      it("preserves last-known visible row when storage becomes unreadable during removal", () => {
        window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "lounge-chair",
              quantity: 1,
              source: "catalogue",
              order: 0,
              subkind: "rental"
            }
          ]
        }));
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            validItems={[rentalValidItem]}
          />
        );
        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();

        const faulty = createThrowingStorageAfterRead();
        try {
          const removeButton = screen.getByRole("button", { name: /remove.*lounge.*from selection/i });
          fireEvent.click(removeButton);

          expect(screen.getByText("Lounge Chair")).toBeInTheDocument();
          expect(screen.queryByText("No items selected yet")).not.toBeInTheDocument();
          expect(screen.getByText(/selection storage unavailable/i)).toBeInTheDocument();
        } finally {
          faulty.restore();
        }
      });

      it("shows bounded accessible removal error without raw exception text", () => {
        window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "lounge-chair",
              quantity: 1,
              source: "catalogue",
              order: 0,
              subkind: "rental"
            }
          ]
        }));
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            validItems={[rentalValidItem]}
          />
        );

        const faulty = createThrowingStorageAfterRead();
        try {
          const removeButton = screen.getByRole("button", { name: /remove.*lounge.*from selection/i });
          fireEvent.click(removeButton);

          expect(screen.queryByText(/exception|quota|blocked/i)).not.toBeInTheDocument();
          expect(screen.getAllByText(/could not be removed|storage is unavailable/i).length).toBeGreaterThan(0);
        } finally {
          faulty.restore();
        }
      });

      it("does not emit false success event when storage becomes unreadable during removal", () => {
        window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "lounge-chair",
              quantity: 1,
              source: "catalogue",
              order: 0,
              subkind: "rental"
            }
          ]
        }));
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            validItems={[rentalValidItem]}
          />
        );

        const faulty = createThrowingStorageAfterRead();
        try {
          const removeButton = screen.getByRole("button", { name: /remove.*lounge.*from selection/i });
          fireEvent.click(removeButton);

          expect(screen.getByText(/selection storage unavailable/i)).toBeInTheDocument();
        } finally {
          faulty.restore();
        }
      });

      it("does not claim the current selection was reloaded after storage becomes unreadable", () => {
        window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "lounge-chair",
              quantity: 1,
              source: "catalogue",
              order: 0,
              subkind: "rental"
            }
          ]
        }));
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            validItems={[rentalValidItem]}
          />
        );

        const faulty = createThrowingStorageAfterRead();
        try {
          const removeButton = screen.getByRole("button", { name: /remove.*lounge.*from selection/i });
          fireEvent.click(removeButton);

          expect(screen.queryByText(/selection has been reloaded/i)).not.toBeInTheDocument();
        } finally {
          faulty.restore();
        }
      });
    });
  });

  describe("Run-17 — normalized identity and non-vacuous regression", () => {
    const rentalFallback = {
      slug: "lounge-chair",
      name: "Lounge Chair",
      kind: "rental" as const,
      quantity: 2
    };

    const setupFallback = {
      slug: "botanical-wedding",
      name: "Botanical Wedding",
      category: "Setups",
      kind: "setup" as const,
      quantity: 1
    };

    beforeEach(() => {
      window.sessionStorage.clear();
    });

    afterEach(() => {
      cleanup();
    });

    describe("case and whitespace duplicate — fail closed", () => {
      it("two rental identities with different raw slugs that normalize to the same slug: no canonical identity, no seed", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[
              { kind: "rental" as const, slug: "Lounge-Chair", name: "Lounge Chair Raw" },
              { kind: "rental" as const, slug: " lounge-chair ", name: "Lounge Chair Whitespace" }
            ]}
          />
        );

        expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
        expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
      });

      it("two setup identities with different raw slugs that normalize to the same slug: no canonical identity, no seed", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[setupFallback]}
            requestedSlug="botanical-wedding"
            validItems={[
              { kind: "setup" as const, slug: "Botanical-Wedding", name: "Botanical Wedding Raw" },
              { kind: "setup" as const, slug: " botanical-wedding ", name: "Botanical Wedding Whitespace" }
            ]}
          />
        );

        expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
        expect(screen.queryByText("Botanical Wedding")).not.toBeInTheDocument();
      });

      it("case/whitespace duplicate: does not consume a stored URL row", () => {
        window.sessionStorage.setItem(
          QUOTE_SELECTION_STORAGE_KEY,
          JSON.stringify({
            version: 2,
            rows: [
              {
                kind: "catalogue",
                reference: "lounge-chair",
                quantity: 2,
                source: "catalogue",
                order: 0,
                subkind: "rental"
              }
            ]
          })
        );

        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[
              { kind: "rental" as const, slug: "Lounge-Chair", name: "Lounge Chair A" },
              { kind: "rental" as const, slug: "lounge-chair", name: "Lounge Chair B" }
            ]}
          />
        );

        const stored = storedRows();
        expect(stored.rows).toHaveLength(1);
        expect(stored.rows[0]?.source).toBe("catalogue");
      });
    });

    describe("one normalized match plus opposite-kind duplicates", () => {
      it("one normalized rental match with same-normalized setup duplicates: canonical rental identity valid", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[
              { kind: "rental" as const, slug: " lounge-chair ", name: "Lounge Chair Rental" },
              { kind: "setup" as const, slug: "LOUNGE-CHAIR", name: "Lounge Setup A" },
              { kind: "setup" as const, slug: "Lounge-Chair", name: "Lounge Setup B" }
            ]}
          />
        );

        const stored = storedRows();
        expect(stored.rows).toEqual([
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 2,
            source: "url",
            order: 0,
            subkind: "rental"
          }
        ]);
      });

      it("one normalized setup match with same-normalized rental duplicates: canonical setup identity valid", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[setupFallback]}
            requestedSlug="botanical-wedding"
            validItems={[
              { kind: "setup" as const, slug: " Botanical-Wedding ", name: "Botanical Wedding Setup" },
              { kind: "rental" as const, slug: "botanical-wedding", name: "Botanical Rental A" },
              { kind: "rental" as const, slug: "Botanical-Wedding", name: "Botanical Rental B" }
            ]}
          />
        );

        const stored = storedRows();
        expect(stored.rows).toEqual([
          {
            kind: "catalogue",
            reference: "botanical-wedding",
            quantity: 1,
            source: "url",
            order: 0,
            subkind: "setup"
          }
        ]);
      });
    });

    describe("malformed slug — fail closed", () => {
      it("malformed candidate slug with spaces and special chars cannot become canonical authority", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[
              { kind: "rental" as const, slug: "Lounge Chair!", name: "Malformed Slug" }
            ]}
          />
        );

        expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
      });

      it("malformed requested slug cannot seed or consume", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[{ ...rentalFallback, slug: "Lounge Chair!" }]}
            requestedSlug="Lounge Chair!"
            validItems={[
              { kind: "rental" as const, slug: "lounge-chair", name: "Lounge Chair" }
            ]}
          />
        );

        expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
      });

      it("malformed validItems slug does not seed even when it is the only rental match", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[
              { kind: "rental" as const, slug: "Not Valid!", name: "Not Valid Slug" },
              { kind: "rental" as const, slug: "lounge-chair", name: "Lounge Chair" }
            ]}
          />
        );

        const stored = storedRows();
        expect(stored.rows).toEqual([
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 2,
            source: "url",
            order: 0,
            subkind: "rental"
          }
        ]);
      });
    });
  });

  describe("Run-16 — canonical identity uniqueness and single authority", () => {
    const rentalFallback = {
      slug: "lounge-chair",
      name: "Lounge Chair",
      kind: "rental" as const,
      quantity: 2
    };

    const setupFallback = {
      slug: "botanical-wedding",
      name: "Botanical Wedding",
      category: "Setups",
      kind: "setup" as const,
      quantity: 1
    };

    const rentalValidItem = {
      kind: "rental" as const,
      slug: "lounge-chair",
      name: "Lounge Chair"
    };

    const setupValidItem = {
      kind: "setup" as const,
      slug: "botanical-wedding",
      name: "Botanical Wedding",
      category: "Setups"
    };

    beforeEach(() => {
      window.sessionStorage.clear();
    });

    afterEach(() => {
      cleanup();
    });

    describe("duplicate exact identity — fail closed", () => {
      it("duplicate setup identity: no canonical identity, no seed, no consumption", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[setupFallback]}
            requestedSlug="botanical-wedding"
            validItems={[
              { ...setupValidItem },
              { ...setupValidItem, name: "Botanical Wedding Duplicate" }
            ]}
          />
        );

        expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
        expect(screen.queryByText("Botanical Wedding")).not.toBeInTheDocument();
      });

      it("duplicate rental identity: no canonical identity, no seed, no consumption", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[
              { ...rentalValidItem },
              { ...rentalValidItem, name: "Lounge Chair Duplicate" }
            ]}
          />
        );

        expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
        expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
      });

      it("duplicate identity does not consume a stored already-matched URL row", () => {
        window.sessionStorage.setItem(
          QUOTE_SELECTION_STORAGE_KEY,
          JSON.stringify({
            version: 2,
            rows: [
              {
                kind: "catalogue",
                reference: "botanical-wedding",
                quantity: 1,
                source: "url",
                order: 0,
                subkind: "setup"
              }
            ]
          })
        );

        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[setupFallback]}
            requestedSlug="botanical-wedding"
            validItems={[
              { ...setupValidItem },
              { ...setupValidItem, name: "Botanical Wedding Duplicate" }
            ]}
          />
        );

        const stored = storedRows();
        expect(stored.rows).toHaveLength(1);
        expect(stored.rows[0]?.subkind).toBe("setup");
        expect(screen.getByText("Botanical Wedding")).toBeInTheDocument();
      });
    });

    describe("one exact match plus opposite-kind duplicates", () => {
      it("one rental match with same-slug setup duplicates: canonical rental identity valid, URL row uses rental", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[
              { kind: "rental" as const, slug: "lounge-chair", name: "Lounge Chair" },
              { kind: "setup" as const, slug: "lounge-chair", name: "Lounge Setup" },
              { kind: "setup" as const, slug: "lounge-chair", name: "Lounge Setup 2" }
            ]}
          />
        );

        expect(storedRows().rows).toEqual([
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 2,
            source: "url",
            order: 0,
            subkind: "rental"
          }
        ]);
      });

      it("one setup match with same-slug rental duplicates: canonical setup identity valid, URL row uses setup", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[setupFallback]}
            requestedSlug="botanical-wedding"
            validItems={[
              { kind: "setup" as const, slug: "botanical-wedding", name: "Botanical Wedding", category: "Setups" },
              { kind: "rental" as const, slug: "botanical-wedding", name: "Botanical Rental" },
              { kind: "rental" as const, slug: "botanical-wedding", name: "Botanical Rental 2" }
            ]}
          />
        );

        expect(storedRows().rows).toEqual([
          {
            kind: "catalogue",
            reference: "botanical-wedding",
            quantity: 1,
            source: "url",
            order: 0,
            subkind: "setup"
          }
        ]);
      });
    });

    describe("zero match — fail closed", () => {
      it("no exact server-owned match: does not seed fallback", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[]}
          />
        );

        expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
        expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
      });

      it("no exact match: does not consume a stored URL row", () => {
        window.sessionStorage.setItem(
          QUOTE_SELECTION_STORAGE_KEY,
          JSON.stringify({
            version: 2,
            rows: [
              {
                kind: "catalogue",
                reference: "lounge-chair",
                quantity: 2,
                source: "catalogue",
                order: 0,
                subkind: "rental"
              }
            ]
          })
        );

        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[]}
          />
        );

        const stored = storedRows();
        expect(stored.rows).toHaveLength(1);
        expect(stored.rows[0]?.source).toBe("catalogue");
      });

      it("no exact match: unrelated manual rows preserved", () => {
        window.sessionStorage.setItem(
          QUOTE_SELECTION_STORAGE_KEY,
          JSON.stringify({
            version: 2,
            rows: [
              {
                kind: "manual",
                key: "manual-a",
                description: "Custom counter",
                quantity: 1,
                source: "manual",
                order: 0
              }
            ]
          })
        );

        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[]}
          />
        );

        const stored = storedRows();
        expect(stored.rows).toHaveLength(1);
        expect(stored.rows[0]?.kind).toBe("manual");
      });
    });

    describe("exact one-match — success preserved", () => {
      it("exactly one canonical match: consumes correct stored URL row on mount", () => {
        window.sessionStorage.setItem(
          QUOTE_SELECTION_STORAGE_KEY,
          JSON.stringify({
            version: 2,
            rows: [
              {
                kind: "catalogue",
                reference: "lounge-chair",
                quantity: 2,
                source: "url",
                order: 0,
                subkind: "rental"
              }
            ]
          })
        );

        const { rerender } = render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[rentalValidItem]}
          />
        );

        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();

        const removeButton = screen.getByRole("button", { name: /remove.*lounge.*from selection/i });
        fireEvent.click(removeButton);

        expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();

        rerender(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[rentalValidItem]}
          />
        );
        expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
      });

      it("exactly one canonical match: seeds URL row when genuinely empty, writes exact reference and kind", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[rentalFallback]}
            requestedSlug="lounge-chair"
            validItems={[rentalValidItem]}
          />
        );

        const stored = storedRows();
        expect(stored.rows).toEqual([
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 2,
            source: "url",
            order: 0,
            subkind: "rental"
          }
        ]);
      });

      it("exactly one setup match: seeds URL row with correct exact subkind", () => {
        render(
          <QuoteSelectionSummary
            catalogueAvailable
            fallbackItems={[setupFallback]}
            requestedSlug="botanical-wedding"
            validItems={[setupValidItem]}
          />
        );

        const stored = storedRows();
        expect(stored.rows).toEqual([
          {
            kind: "catalogue",
            reference: "botanical-wedding",
            quantity: 1,
            source: "url",
            order: 0,
            subkind: "setup"
          }
        ]);
      });
    });

    describe("structural single-authority: writeUrlFallback", () => {
      it("writeUrlFallback requires canonical identity argument and rejects absent identity", async () => {
        const mod = await import("./QuoteSelectionControls");
        const writeUrlFallback = (mod as Record<string, unknown>).writeUrlFallback;

        expect(writeUrlFallback).toBeDefined();
        expect(typeof writeUrlFallback).toBe("function");

        const fn = writeUrlFallback as (...args: unknown[]) => boolean;

        const result = fn({
          slug: "lounge-chair",
          name: "Lounge Chair",
          kind: "rental",
          quantity: 1
        });

        expect(result).toBe(false);
      });

      it("writeUrlFallback derives stored reference and subkind from canonical identity only", async () => {
        window.sessionStorage.clear();

        const mod = await import("./QuoteSelectionControls");
        const writeUrlFallback = (mod as Record<string, unknown>).writeUrlFallback;

        expect(writeUrlFallback).toBeDefined();

        const fn = writeUrlFallback as (...args: unknown[]) => boolean;

        const seeded = fn(
          {
            slug: "lounge-chair",
            name: "Lounge Chair",
            kind: "rental",
            quantity: 2
          },
          { reference: "lounge-chair", kind: "setup" }
        );

        expect(seeded).toBe(true);
        const stored = storedRows();
        expect(stored.rows[0]?.subkind).toBe("setup");
        expect(stored.rows[0]?.reference).toBe("lounge-chair");
      });

      it("writeUrlFallback rejects fallback item whose slug does not match canonical reference", async () => {
        window.sessionStorage.clear();

        const mod = await import("./QuoteSelectionControls");
        const writeUrlFallback = (mod as Record<string, unknown>).writeUrlFallback;

        expect(writeUrlFallback).toBeDefined();

        const fn = writeUrlFallback as (...args: unknown[]) => boolean;

        const seeded = fn(
          {
            slug: "different-chair",
            name: "Different Chair",
            kind: "rental",
            quantity: 1
          },
          { reference: "lounge-chair", kind: "rental" }
        );

        expect(seeded).toBe(false);
        expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
      });
    });
  });

  describe("Run-15 — canonical fallback-identity closure", () => {
    const setupFallback = {
      slug: "botanical-wedding",
      name: "Botanical Wedding",
      category: "Setups",
      kind: "setup" as const,
      quantity: 1
    };

    const rentalFallback = {
      slug: "lounge-chair",
      name: "Lounge Chair",
      kind: "rental" as const,
      quantity: 2
    };

    const setupValidItem = {
      kind: "setup" as const,
      slug: "botanical-wedding",
      name: "Botanical Wedding",
      category: "Setups"
    };

    const rentalValidItem = {
      kind: "rental" as const,
      slug: "lounge-chair",
      name: "Lounge Chair"
    };

    beforeEach(() => {
      window.sessionStorage.clear();
    });

    afterEach(() => {
      cleanup();
    });

    it("Test A — canonical setup, stored rental: wrong subkind does not consume, removal reseeds correct setup", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "botanical-wedding",
              quantity: 1,
              source: "url",
              order: 0,
              subkind: "rental"
            }
          ]
        })
      );

      const { rerender } = render(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[setupFallback]}
          requestedSlug="botanical-wedding"
          validItems={[setupValidItem]}
        />
      );

      expect(
        screen.getByText(/unavailable selection: botanical-wedding/i)
      ).toBeInTheDocument();

      let stored = storedRows();
      expect(stored.rows).toHaveLength(1);
      expect(stored.rows[0]?.subkind).toBe("rental");

      const removeButton = screen.getByRole("button", {
        name: /remove.*botanical.*from selection/i
      });
      fireEvent.click(removeButton);

      expect(screen.getByText("Botanical Wedding")).toBeInTheDocument();
      stored = storedRows();
      expect(stored.rows).toHaveLength(1);
      expect(stored.rows[0]?.source).toBe("url");
      expect(stored.rows[0]?.subkind).toBe("setup");

      const removeSetupButton = screen.getByRole("button", {
        name: /remove.*botanical.*from selection/i
      });
      fireEvent.click(removeSetupButton);
      expect(screen.queryByText("Botanical Wedding")).not.toBeInTheDocument();

      rerender(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[setupFallback]}
          requestedSlug="botanical-wedding"
          validItems={[setupValidItem]}
        />
      );
      expect(screen.queryByText("Botanical Wedding")).not.toBeInTheDocument();

      window.dispatchEvent(new Event("storage"));
      expect(screen.queryByText("Botanical Wedding")).not.toBeInTheDocument();
    });

    it("Test B — canonical rental, stored setup: symmetric regression", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "lounge-chair",
              quantity: 1,
              source: "url",
              order: 0,
              subkind: "setup"
            }
          ]
        })
      );

      render(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[rentalFallback]}
          requestedSlug="lounge-chair"
          validItems={[rentalValidItem]}
        />
      );

      expect(
        screen.getByText(/unavailable selection: lounge-chair/i)
      ).toBeInTheDocument();

      let stored = storedRows();
      expect(stored.rows).toHaveLength(1);
      expect(stored.rows[0]?.subkind).toBe("setup");

      const removeButton = screen.getByRole("button", {
        name: /remove.*lounge.*from selection/i
      });
      fireEvent.click(removeButton);

      expect(screen.getByText("Lounge Chair")).toBeInTheDocument();
      stored = storedRows();
      expect(stored.rows).toHaveLength(1);
      expect(stored.rows[0]?.source).toBe("url");
      expect(stored.rows[0]?.subkind).toBe("rental");
    });

    it("Test C — correct stored identity: consumed immediately, removal does not re-seed", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "lounge-chair",
              quantity: 2,
              source: "url",
              order: 0,
              subkind: "rental"
            }
          ]
        })
      );

      const { rerender } = render(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[rentalFallback]}
          requestedSlug="lounge-chair"
          validItems={[rentalValidItem]}
        />
      );

      expect(screen.getByText("Lounge Chair")).toBeInTheDocument();

      const stored = storedRows();
      expect(stored.rows).toHaveLength(1);
      expect(stored.rows[0]?.subkind).toBe("rental");

      const removeButton = screen.getByRole("button", {
        name: /remove.*lounge.*from selection/i
      });
      fireEvent.click(removeButton);

      expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
      expect(storedRows().rows).toEqual([]);

      rerender(
        <QuoteSelectionSummary
          catalogueAvailable
          fallbackItems={[rentalFallback]}
          requestedSlug="lounge-chair"
          validItems={[rentalValidItem]}
        />
      );
      expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();

      window.dispatchEvent(new Event("storage"));
      expect(screen.queryByText("Lounge Chair")).not.toBeInTheDocument();
    });

    it("Test D — storage failure preservation: readable at mount, unreadable during removal preserves last-known state with bounded error", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "catalogue",
              reference: "lounge-chair",
              quantity: 1,
              source: "catalogue",
              order: 0,
              subkind: "rental"
            }
          ]
        })
      );

      render(
        <QuoteSelectionSummary
          catalogueAvailable
          validItems={[rentalValidItem]}
        />
      );

      expect(screen.getByText("Lounge Chair")).toBeInTheDocument();

      let callCount = 0;
      const real = window.sessionStorage;
      const faulty: Storage = {
        get length() {
          return real.getItem(QUOTE_SELECTION_STORAGE_KEY) === null ? 0 : 1;
        },
        key: () => real.key(0),
        getItem: (key: string) => {
          callCount += 1;
          if (callCount <= 2) {
            return real.getItem(key);
          }
          throw new Error("storage blocked");
        },
        setItem: (key: string, value: string) => {
          real.setItem(key, value);
        },
        removeItem: (key: string) => {
          real.removeItem(key);
        },
        clear: () => {
          real.clear();
        }
      };
      Object.defineProperty(window, "sessionStorage", {
        value: faulty,
        writable: true,
        configurable: true
      });

      try {
        const removeButton = screen.getByRole("button", {
          name: /remove.*lounge.*from selection/i
        });
        fireEvent.click(removeButton);

        expect(screen.getByText("Lounge Chair")).toBeInTheDocument();
        expect(screen.queryByText("No items selected yet")).not.toBeInTheDocument();
        expect(
          screen.getByText(/selection storage unavailable/i)
        ).toBeInTheDocument();
        expect(screen.queryByText(/exception|quota|blocked/i)).not.toBeInTheDocument();
        expect(
          screen.getAllByText(/could not be removed|storage is unavailable/i)
            .length
        ).toBeGreaterThan(0);
      } finally {
        Object.defineProperty(window, "sessionStorage", {
          value: new (class implements Storage {
            private store = new Map<string, string>();
            get length() {
              return this.store.size;
            }
            key(i: number) {
              return Array.from(this.store.keys())[i] ?? null;
            }
            getItem(k: string) {
              return this.store.get(k) ?? null;
            }
            setItem(k: string, v: string) {
              this.store.set(k, String(v));
            }
            removeItem(k: string) {
              this.store.delete(k);
            }
            clear() {
              this.store.clear();
            }
          })(),
          writable: true,
          configurable: true
        });
      }
    });
  });
});
