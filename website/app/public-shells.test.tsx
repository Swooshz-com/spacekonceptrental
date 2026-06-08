import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  PublicCatalogue,
  PublicCatalogueProduct
} from "../lib/catalogue/types";
import {
  CataloguePageContent,
  default as CataloguePage
} from "./catalogue/page";
import {
  ProductPageContent,
  default as ProductPage
} from "./catalogue/[slug]/page";
import CatalogueListingNotFound from "./catalogue/[slug]/not-found";
import EventsPage from "./events/page";
import ListingNotFound from "./listings/[slug]/not-found";
import { metadata } from "./layout";
import HomePage from "./page";
import QuotePage from "./quote/page";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

describe("public page shells", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the static product detail copy when Supabase env is missing", async () => {
    render(await ProductPage());

    expect(
      screen.getByRole("heading", { name: /lounge sofa package/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/rental details/i)).toBeInTheDocument();
    expect(screen.getByText(/furniture listing/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /request this listing/i })
    ).toHaveAttribute("href", "/quote?listing=lounge-sofa-package");
  });

  it("renders a conversion-focused rental homepage with quote and listing CTAs", async () => {
    render(await HomePage());

    expect(
      screen.getByRole("heading", {
        name: /event furniture rental for singapore spaces/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request a quote/i })
    ).toHaveAttribute("href", "/quote");
    expect(
      screen.getByRole("link", { name: /browse listings/i })
    ).toHaveAttribute("href", "/listings");
    for (const useCase of [
      /corporate events/i,
      /weddings/i,
      /exhibitions/i,
      /gala lounges/i
    ]) {
      expect(screen.getByRole("heading", { name: useCase })).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { name: /featured rental listings/i })
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /view listing/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/listings/lounge-sofa-package");
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i
      )
    ).not.toBeInTheDocument();
  });

  it("renders public events copy with event and furniture rental language", () => {
    render(<EventsPage />);

    expect(
      screen.getByRole("heading", { name: /events/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/event rentals/i)).toBeInTheDocument();
    expect(screen.getByText(/furniture rentals/i)).toBeInTheDocument();
    expect(screen.getByText(/styled setups/i)).toBeInTheDocument();
    expect(screen.getByText(/corporate receptions/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /request a quote/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("keeps public events copy free from shell and MVP wording", () => {
    render(<EventsPage />);

    expect(screen.queryByText(/shell/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mvp/i)).not.toBeInTheDocument();
  });

  it("keeps public quote copy from implying ecommerce or online ordering", async () => {
    render(await QuotePage());

    expect(screen.getByRole("heading", { name: /request a rental quote/i })).toBeInTheDocument();
    expect(screen.getByText(/furniture rental follow-up/i)).toBeInTheDocument();
    expect(screen.queryByText(/shell|mvp/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering|confirmed order/i
      )
    ).not.toBeInTheDocument();
    expect(metadata.description).toMatch(/event furniture rental catalogue/i);
    expect(metadata.description).not.toMatch(/shell|mvp|checkout|payment|online ordering/i);
  });

  it("keeps the new public pages reachable from navigation and catalogue", async () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layoutSource).toContain('href="/events"');

    render(await CataloguePage());

    expect(
      screen.queryByRole("link", { name: /view listing shell/i })
    ).not.toBeInTheDocument();

    const catalogueLinks = screen.getAllByRole("link", { name: /view listing/i });
    expect(
      catalogueLinks.map((link) => link.getAttribute("href"))
    ).toContain("/catalogue/lounge-sofa-package");
    expect(
      screen
        .getAllByRole("link", { name: /request this listing/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/quote?listing=lounge-sofa-package");
  });

  it("renders a clean empty state when no public listings are available", () => {
    render(
      <CataloguePageContent
        catalogue={{
          source: "fallback",
          categories: [],
          products: []
        }}
      />
    );

    expect(screen.getByRole("heading", { name: /furniture catalogue/i })).toBeInTheDocument();
    expect(screen.getByText(/no listings are available right now/i)).toBeInTheDocument();
  });

  it("renders safe rental listing not-found states", () => {
    render(<CatalogueListingNotFound />);

    expect(
      screen.getByRole("heading", { name: /listing unavailable/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /send a general enquiry/i })
    ).toHaveAttribute("href", "/quote");
    expect(
      screen.queryByText(/draft|archived|internal note|workflow status/i)
    ).not.toBeInTheDocument();

    cleanup();
    render(<ListingNotFound />);

    expect(
      screen.getByRole("heading", { name: /listing unavailable/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse listings/i })
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /send a general enquiry/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("renders published catalogue data supplied by the server read layer", () => {
    const catalogue: PublicCatalogue = {
      source: "supabase",
      categories: [
        {
          id: "category-published",
          slug: "lounge-seating",
          name: "Lounge Seating",
          description: "Published seating.",
          sortOrder: 10
        }
      ],
      products: [
        {
          id: "product-published",
          slug: "modular-lounge-set",
          name: "Modular Lounge Set",
          shortDescription: "Published lounge set.",
          description: "Published details.",
          rentalUnit: "set",
          sortOrder: 10,
          categoryId: "category-published",
          categoryName: "Lounge Seating",
          primaryImage: {
            id: "image-published",
            storageBucket: "sample-catalogue-public",
            storagePath: "sample-fixtures/modular-lounge-set-main.jpg",
            altText: "Sample image metadata.",
            sortOrder: 10,
            isPrimary: true
          },
          source: "supabase"
        }
      ]
    };

    render(<CataloguePageContent catalogue={catalogue} />);

    expect(
      screen.getByRole("heading", { name: /modular lounge set/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/published lounge set/i)).toBeInTheDocument();
    expect(screen.queryByText(/draft/i)).not.toBeInTheDocument();
  });

  it("renders published product detail data supplied by the server read layer", () => {
    const product: PublicCatalogueProduct = {
      id: "product-published",
      slug: "modular-lounge-set",
      name: "Modular Lounge Set",
      shortDescription: "Published lounge set.",
      description: "Published details for a lounge set.",
      rentalUnit: "set",
      sortOrder: 10,
      categoryId: "category-published",
      categoryName: "Lounge Seating",
      primaryImage: {
        id: "image-published",
        storageBucket: "sample-catalogue-public",
        storagePath: "sample-fixtures/modular-lounge-set-main.jpg",
        altText: "Sample image metadata.",
        sortOrder: 10,
        isPrimary: true
      },
      source: "supabase"
    };

    render(<ProductPageContent product={product} />);

    expect(
      screen.getByRole("heading", { name: /modular lounge set/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/published details for a lounge set/i)).toBeInTheDocument();
    expect(screen.queryByText(/concept backdrop frame/i)).not.toBeInTheDocument();
  });

  it("keeps public listing pages free from shell and ecommerce-only copy", async () => {
    const catalogueSource = readFileSync(
      resolve(process.cwd(), "app/catalogue/page.tsx"),
      "utf8"
    );
    const detailSource = readFileSync(
      resolve(process.cwd(), "app/catalogue/[slug]/page.tsx"),
      "utf8"
    );

    expect(catalogueSource).not.toMatch(/listing shell/i);
    expect(detailSource).not.toMatch(/listing shell/i);
    expect(catalogueSource).not.toMatch(/supabase service role/i);
    expect(detailSource).not.toMatch(/supabase service role/i);
    expect(catalogueSource).not.toMatch(/createBrowserClient|supabaseBrowserClient/i);
    expect(detailSource).not.toMatch(/createBrowserClient|supabaseBrowserClient/i);

    render(await ProductPage());
    expect(
      screen.queryByText(/shell/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i
      )
    ).not.toBeInTheDocument();

    render(
      <CataloguePageContent
        catalogue={{
          source: "fallback",
          categories: [],
          products: [
            {
              id: "product-published",
              slug: "compact-chair",
              name: "Compact Chair",
              shortDescription: "Compact event chair.",
              rentalUnit: "item",
              sortOrder: 10,
              source: "fallback"
            }
          ]
        }}
      />
    );
    expect(screen.getByRole("link", { name: /view listing/i })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /request this listing/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/quote?listing=compact-chair");
    expect(screen.queryByText(/shell/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i
      )
    ).not.toBeInTheDocument();
  });
});
