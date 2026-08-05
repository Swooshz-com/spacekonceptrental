import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type {
  PublicCatalogue,
  PublicCatalogueProduct,
  SafeSetupCompositionItem
} from "../lib/catalogue/types";
import { reconstructSetupQuantity } from "../lib/catalogue/setup-recipe-types";
import { QUOTE_SELECTION_STORAGE_KEY } from "../lib/quote/selection-model";
import {
  quoteSelectionValidItemsForCatalogue
} from "./PublicStitch";
import { StitchItemCard } from "./PublicStitch";
import {
  QuoteSelectionButton,
  QuoteSelectionSummary,
  type QuoteSelectionItem
} from "./QuoteSelectionControls";

const setupId = "setup-botanical-wedding";
const rentalId = "rental-lounge-chair";

function composition(
  entries: Array<{ id: string; slug: string; name: string; baseQuantity: number }>
): SafeSetupCompositionItem[] {
  return entries.map((entry, position) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    rentalUnit: "item",
    images: [],
    position,
    baseQuantity: entry.baseQuantity
  }));
}

function setupProduct(
  safeSetupComposition: PublicCatalogueProduct["safeSetupComposition"] = composition([
    { id: "child-a", slug: "child-a", name: "Child A", baseQuantity: 2 },
    { id: "child-b", slug: "child-b", name: "Child B", baseQuantity: 4 }
  ])
): PublicCatalogueProduct {
  return {
    id: setupId,
    slug: "botanical-wedding",
    name: "Botanical Wedding",
    rentalUnit: "event",
    sortOrder: 0,
    categoryName: "Setups",
    source: "supabase",
    productKind: "setup",
    safeSetupComposition
  };
}

function rentalProduct(
  safeSetupComposition?: PublicCatalogueProduct["safeSetupComposition"]
): PublicCatalogueProduct {
  return {
    id: rentalId,
    slug: "lounge-chair",
    name: "Lounge Chair",
    rentalUnit: "item",
    sortOrder: 1,
    categoryName: "Seating",
    source: "supabase",
    productKind: "rental",
    safeSetupComposition
  };
}

function catalogueProducts(...products: PublicCatalogueProduct[]): PublicCatalogue {
  return { source: "supabase", categories: [], products };
}

function storedCatalogueRow(
  reference: string,
  subkind: "rental" | "setup",
  quantity = 1,
  source: "catalogue" | "url" = "catalogue"
) {
  return {
    kind: "catalogue" as const,
    reference,
    quantity,
    source,
    order: 0,
    subkind
  };
}

function setStoredSelection(row: ReturnType<typeof storedCatalogueRow>) {
  window.sessionStorage.setItem(
    QUOTE_SELECTION_STORAGE_KEY,
    JSON.stringify({ version: 2, rows: [row] })
  );
}

function setupValidItems(product = setupProduct()) {
  return quoteSelectionValidItemsForCatalogue(catalogueProducts(product));
}

function showIncludedPieces() {
  fireEvent.click(
    screen.getByRole("button", { name: /show included pieces/i })
  );
}

describe("production quote setup reconstruction", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("persists only the parent reference, subkind, quantity, and source fields", () => {
    const item: QuoteSelectionItem = {
      slug: "botanical-wedding",
      name: "Botanical Wedding",
      kind: "setup",
      quantity: 1,
      includedItems: [
        {
          slug: "forged-child",
          name: "Forged child",
          kind: "setup-included",
          quantity: 99,
          setupBaseQuantity: 99
        }
      ]
    };

    render(<QuoteSelectionButton item={item} />);
    fireEvent.click(
      screen.getByRole("button", { name: /increase botanical wedding/i })
    );

    const serialized = window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY);
    expect(JSON.parse(serialized ?? "null")).toEqual({
      version: 2,
      rows: [storedCatalogueRow("botanical-wedding", "setup")]
    });
    expect(serialized).not.toContain("forged-child");
    expect(serialized).not.toContain("setupBaseQuantity");
    expect(serialized).not.toContain("includedItems");
  });

  it("preserves catalogue setup identity through card storage and server reconstruction", async () => {
    const setup = setupProduct(
      composition([{ id: "child-a", slug: "child-a", name: "Child A", baseQuantity: 2 }])
    );

    render(<StitchItemCard product={setup} />);
    fireEvent.click(
      screen.getByRole("button", { name: /increase botanical wedding quantity/i })
    );

    const stored = JSON.parse(
      window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "null"
    );
    expect(stored.rows[0]).toMatchObject({
      reference: "botanical-wedding",
      subkind: "setup",
      quantity: 1
    });
    expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).not.toContain(
      "child-a"
    );

    cleanup();
    render(<QuoteSelectionSummary catalogueAvailable validItems={setupValidItems(setup)} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show included pieces/i })).toBeInTheDocument()
    );
    showIncludedPieces();
    expect(screen.getByText("Child A")).toBeInTheDocument();

    cleanup();
    window.sessionStorage.clear();
    render(<StitchItemCard product={rentalProduct()} />);
    fireEvent.click(
      screen.getByRole("button", { name: /increase lounge chair quantity/i })
    );
    expect(
      JSON.parse(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "null").rows[0]
    ).toMatchObject({ reference: "lounge-chair", subkind: "rental" });
  });

  it("does not offer a setup selection control without authoritative composition", () => {
    render(<StitchItemCard product={setupProduct(null)} />);

    expect(screen.getByText(/Setup selection is unavailable/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /increase botanical wedding quantity/i })
    ).not.toBeInTheDocument();
  });

  it("re-reads current server authority on a reload and reconstructs the parent composition", async () => {
    setStoredSelection(storedCatalogueRow("botanical-wedding", "setup", 2));

    const first = render(
      <QuoteSelectionSummary catalogueAvailable validItems={setupValidItems()} />
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show included pieces/i })).toBeInTheDocument()
    );
    showIncludedPieces();
    expect(screen.getByText("Child A")).toBeInTheDocument();
    expect(screen.getByText("Child B")).toBeInTheDocument();

    first.unmount();
    render(
      <QuoteSelectionSummary
        catalogueAvailable
        validItems={setupValidItems(
          setupProduct(
            composition([
              { id: "child-c", slug: "child-c", name: "Child C", baseQuantity: 3 }
            ])
          )
        )}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show included pieces/i })).toBeInTheDocument()
    );
    showIncludedPieces();
    expect(screen.getByText("Child C")).toBeInTheDocument();
    expect(screen.queryByText("Child A")).not.toBeInTheDocument();
    expect(screen.queryByText("Child B")).not.toBeInTheDocument();
  });

  it("reconstructs a setup selected through a direct URL without persisting child authority", async () => {
    render(
      <QuoteSelectionSummary
        catalogueAvailable
        fallbackItems={[
          {
            slug: "botanical-wedding",
            name: "Botanical Wedding",
            kind: "setup",
            quantity: 3
          }
        ]}
        requestedSlug="botanical-wedding"
        validItems={setupValidItems()}
      />
    );

    await waitFor(() => {
      expect(JSON.parse(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "null")).toEqual({
        version: 2,
        rows: [storedCatalogueRow("botanical-wedding", "setup", 3, "url")]
      });
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show included pieces/i })).toBeInTheDocument()
    );
    showIncludedPieces();
    expect(screen.getByText("Child A")).toBeInTheDocument();
    expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).not.toContain("child-a");
  });

  it("reconstructs the current composition after navigation with the same parent-only row", async () => {
    setStoredSelection(storedCatalogueRow("botanical-wedding", "setup"));

    const view = render(
      <QuoteSelectionSummary catalogueAvailable validItems={[]} />
    );
    await waitFor(() =>
      expect(screen.getByText("Unavailable selection: botanical-wedding")).toBeInTheDocument()
    );

    view.rerender(
      <QuoteSelectionSummary catalogueAvailable validItems={setupValidItems()} />
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show included pieces/i })).toBeInTheDocument()
    );
    showIncludedPieces();
    expect(screen.getByText("Child A")).toBeInTheDocument();
  });

  it("keeps ordered child identities from the current authoritative recipe", async () => {
    setStoredSelection(storedCatalogueRow("botanical-wedding", "setup"));
    render(<QuoteSelectionSummary catalogueAvailable validItems={setupValidItems()} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show included pieces/i })).toBeInTheDocument()
    );
    showIncludedPieces();
    await waitFor(() => expect(screen.getByText("Child A")).toBeInTheDocument());

    const list = document.querySelector(".stitch-selection-included-group");
    const names = Array.from(list?.querySelectorAll("strong") ?? []).map(
      (node) => node.textContent
    );
    expect(names).toEqual(["Child A", "Child B"]);
  });

  it("scales each authoritative base quantity by the selected parent quantity", async () => {
    setStoredSelection(storedCatalogueRow("botanical-wedding", "setup", 3));
    render(<QuoteSelectionSummary catalogueAvailable validItems={setupValidItems()} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show included pieces/i })).toBeInTheDocument()
    );
    showIncludedPieces();
    await waitFor(() => expect(screen.getByText("Child A")).toBeInTheDocument());

    expect(screen.getByText("Qty: 6")).toBeInTheDocument();
    expect(screen.getByText("Qty: 12")).toBeInTheDocument();
  });

  it.each([
    [1, 1, 1],
    [99, 1, 99],
    [1, 99, 99],
    [99, 99, 9801]
  ])(
    "reconstructs the canonical bounded quantity for %d parent x %d base",
    async (parentQuantity, baseQuantity, expectedQuantity) => {
      const product = setupProduct(
        composition([
          { id: "child-a", slug: "child-a", name: "Child A", baseQuantity }
        ])
      );
      setStoredSelection(
        storedCatalogueRow("botanical-wedding", "setup", parentQuantity)
      );

      render(
        <QuoteSelectionSummary
          catalogueAvailable
          validItems={setupValidItems(product)}
        />
      );
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /show included pieces/i })).toBeInTheDocument()
      );
      showIncludedPieces();
      const includedGroup = document.querySelector(
        ".stitch-selection-included-group"
      );
      expect(includedGroup).not.toBeNull();
      expect(
        within(includedGroup as HTMLElement).getByText(`Qty: ${expectedQuantity}`)
      ).toBeInTheDocument();
    }
  );

  it("fails closed for an unsafe or overflowing setup quantity instead of clamping it", () => {
    const item: QuoteSelectionItem = {
      slug: "botanical-wedding",
      name: "Botanical Wedding",
      kind: "setup",
      quantity: 100,
      includedItems: [
        {
          slug: "child-a",
          name: "Child A",
          kind: "setup-included",
          quantity: 99,
          setupBaseQuantity: 99
        }
      ]
    };

    render(<QuoteSelectionButton item={item} />);
    fireEvent.click(
      screen.getByRole("button", { name: /increase botanical wedding quantity/i })
    );

    expect(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)).toBeNull();
    expect(reconstructSetupQuantity(100, 1)).toBeUndefined();
    expect(reconstructSetupQuantity(99, Number.MAX_SAFE_INTEGER)).toBeUndefined();
  });

  it("replaces previously rendered setup authority when the server recipe changes", async () => {
    setStoredSelection(storedCatalogueRow("botanical-wedding", "setup"));
    const view = render(
      <QuoteSelectionSummary
        catalogueAvailable
        validItems={setupValidItems()}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show included pieces/i })).toBeInTheDocument()
    );
    showIncludedPieces();
    expect(screen.getByText("Child A")).toBeInTheDocument();
    expect(screen.getByText("Child B")).toBeInTheDocument();

    view.rerender(
      <QuoteSelectionSummary
        catalogueAvailable
        validItems={setupValidItems(
          setupProduct(
            composition([
              { id: "child-new", slug: "child-new", name: "Current Child", baseQuantity: 7 }
            ])
          )
        )}
      />
    );

    await waitFor(() => expect(screen.getByText("Current Child")).toBeInTheDocument());
    expect(screen.queryByText("Child A")).not.toBeInTheDocument();
    expect(screen.queryByText("Child B")).not.toBeInTheDocument();
    expect(screen.getByText("Qty: 7")).toBeInTheDocument();
  });

  it("does not allow forged storage to inject child identities or composition", async () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            ...storedCatalogueRow("botanical-wedding", "setup"),
            includedItems: [{ slug: "forged-child", quantity: 99 }]
          }
        ]
      })
    );

    render(<QuoteSelectionSummary catalogueAvailable validItems={setupValidItems()} />);

    await waitFor(() => expect(screen.getByText("No items selected yet")).toBeInTheDocument());
    expect(screen.queryByText("forged-child")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show included pieces/i })).not.toBeInTheDocument();
  });

  it("fails closed when authoritative setup composition is missing or invalid", async () => {
    setStoredSelection(storedCatalogueRow("botanical-wedding", "setup"));
    const invalid = quoteSelectionValidItemsForCatalogue(
      catalogueProducts(setupProduct(null))
    );

    expect(invalid).toEqual([]);
    render(<QuoteSelectionSummary catalogueAvailable validItems={invalid} />);

    await waitFor(() =>
      expect(screen.getByText("Unavailable selection: botanical-wedding")).toBeInTheDocument()
    );
    expect(screen.queryByText("Child A")).not.toBeInTheDocument();
  });

  it("does not give rental products setup composition even when a forged payload includes one", async () => {
    setStoredSelection(storedCatalogueRow("lounge-chair", "rental", 2));
    const validItems = quoteSelectionValidItemsForCatalogue(
      catalogueProducts(
        rentalProduct(
          composition([
            { id: "forged-child", slug: "forged-child", name: "Forged Child", baseQuantity: 9 }
          ])
        )
      )
    );

    expect(validItems).toEqual([]);

    render(<QuoteSelectionSummary catalogueAvailable validItems={validItems} />);
    await waitFor(() =>
      expect(screen.getByText("Unavailable selection: lounge-chair")).toBeInTheDocument()
    );
    expect(screen.queryByText("Forged Child")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show included pieces/i })).not.toBeInTheDocument();
  });

  it("rejects duplicate, reordered, and malformed child authority", () => {
    const duplicate = composition([
      { id: "child-a", slug: "child-a", name: "Child A", baseQuantity: 1 },
      { id: "child-a", slug: "child-a-duplicate", name: "Duplicate", baseQuantity: 1 }
    ]);
    const ordered = composition([
      { id: "child-a", slug: "child-a", name: "Child A", baseQuantity: 1 },
      { id: "child-b", slug: "child-b", name: "Child B", baseQuantity: 1 }
    ]);
    const reordered = [
      { ...ordered[0], position: 1 },
      { ...ordered[1], position: 0 }
    ];
    const malformed = [
      {
        ...composition([
          { id: "child-a", slug: "child-a", name: "Child A", baseQuantity: 1 }
        ])[0],
        unexpected: "forged"
      }
    ] as unknown as SafeSetupCompositionItem[];

    expect(
      quoteSelectionValidItemsForCatalogue(
        catalogueProducts(setupProduct(duplicate))
      )
    ).toEqual([]);
    expect(
      quoteSelectionValidItemsForCatalogue(
        catalogueProducts(setupProduct(reordered))
      )
    ).toEqual([]);
    expect(
      quoteSelectionValidItemsForCatalogue(
        catalogueProducts(setupProduct(malformed))
      )
    ).toEqual([]);
  });
});
