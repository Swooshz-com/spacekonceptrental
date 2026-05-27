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

  it("renders the static product detail shell when Supabase env is missing", async () => {
    render(await ProductPage());

    expect(
      screen.getByRole("heading", { name: /lounge sofa package/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/rental details/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /start quote/i })
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
      screen
        .getAllByRole("link", { name: /view product shell/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/catalogue/lounge-sofa-package");
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
});
