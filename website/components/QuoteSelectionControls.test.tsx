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

  it("persists catalogue references in v2 session storage and updates same-tab consumers", () => {
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
          order: 0
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
            order: 0
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

  it("retains stale references and renders unavailable recovery without substitution", () => {
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
            order: 0
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
    expect(screen.getByText("Unavailable selection")).toBeInTheDocument();
    expect(screen.getByText(/remove this item or browse/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /remove unavailable selection from selection/i
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

  it("seeds only one validated URL fallback row in the current tab", () => {
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
        order: 0
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
});
