import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
});
