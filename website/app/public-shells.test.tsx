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
import EventsPage from "./events/page";

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
      screen.getByRole("link", { name: /start enquiry/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("renders the static event rental shell", () => {
    render(<EventsPage />);

    expect(
      screen.getByRole("heading", { name: /event rental shells/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/corporate receptions/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /start quote/i })
    ).toHaveAttribute("href", "/quote");
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
      screen.getByRole("link", { name: /start enquiry/i })
    ).toHaveAttribute("href", "/quote");
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
    expect(screen.queryByText(/shell/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i
      )
    ).not.toBeInTheDocument();
  });
});
