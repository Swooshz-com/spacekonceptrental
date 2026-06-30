import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src?: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

import { CataloguePageContent } from "./page";
import { generateMetadata, ProductPageContent } from "./[slug]/page";
import type { PublicCatalogue, PublicCatalogueProduct } from "../../lib/catalogue/types";

const forbiddenPublicCopy =
  /cart|checkout|order|payment|purchase|booking|reservation|customer account|dashboard|online ordering/i;

const productWithImage: PublicCatalogueProduct = {
  id: "product-1",
  slug: "modular-lounge",
  name: "Modular Lounge",
  shortDescription: "Styled lounge setup for receptions.",
  description: "Styled lounge setup for receptions.",
  rentalUnit: "set",
  sortOrder: 1,
  categoryId: "category-1",
  categoryName: "Lounge",
  images: [
    {
      id: "image-1",
      storageBucket: "listing-media",
      storagePath: "workspace/product/lounge.webp",
      publicUrl: "https://space.supabase.co/storage/v1/object/public/listing-media/workspace/product/lounge.webp",
      altText: "Modular lounge furniture rental setup",
      sortOrder: 1,
      isPrimary: true
    },
    {
      id: "image-2",
      storageBucket: "listing-media",
      storagePath: "workspace/product/lounge-side.webp",
      publicUrl: "https://space.supabase.co/storage/v1/object/public/listing-media/workspace/product/lounge-side.webp",
      altText: "Side view of modular lounge furniture rental setup",
      sortOrder: 2,
      isPrimary: false
    }
  ],
  primaryImage: {
    id: "image-1",
    storageBucket: "listing-media",
    storagePath: "workspace/product/lounge.webp",
    publicUrl: "https://space.supabase.co/storage/v1/object/public/listing-media/workspace/product/lounge.webp",
    altText: "Modular lounge furniture rental setup",
    sortOrder: 1,
    isPrimary: true
  },
  source: "supabase"
};

const catalogue: PublicCatalogue = {
  source: "supabase",
  categories: [
    {
      id: "category-1",
      slug: "lounge",
      name: "Lounge",
      sortOrder: 1
    }
  ],
  products: [productWithImage]
};

describe("public catalogue image rendering", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders catalogue card images from listing image metadata when available", () => {
    render(<CataloguePageContent catalogue={catalogue} />);

    const image = screen.getByRole("img", { name: /modular lounge furniture rental setup/i });

    expect(image).toHaveAttribute("src", productWithImage.primaryImage?.publicUrl);
    expect(screen.getByRole("link", { name: /view details for modular lounge/i })).toHaveAttribute(
      "href",
      "/catalogue/modular-lounge"
    );
    expect(screen.getByRole("button", { name: /increase modular lounge quantity/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/modular lounge quantity selected/i)).toHaveTextContent("Qty 0");
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("shows Stitch catalogue card cues and detail-first quote navigation", () => {
    render(<CataloguePageContent catalogue={catalogue} />);

    expect(screen.getByRole("heading", { name: /furniture catalogue/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /categories/i })).toBeInTheDocument();

    const listingCard = screen.getByLabelText(/rental listing card for modular lounge/i);
    const cardView = within(listingCard);

    expect(cardView.getByText("Lounge")).toBeInTheDocument();
    expect(cardView.getByText(/styled lounge setup for receptions/i)).toBeInTheDocument();

    const increaseButton = cardView.getByRole("button", { name: /increase modular lounge quantity/i });
    const quantityValue = cardView.getByLabelText(/modular lounge quantity selected/i);
    const detailLink = cardView.getByRole("link", { name: /view details for modular lounge/i });

    expect(increaseButton).toBeInTheDocument();
    expect(quantityValue).toHaveTextContent("Qty 0");
    expect(detailLink).toHaveAttribute("href", "/catalogue/modular-lounge");
  });

  it("renders listing detail primary image when available", () => {
    render(<ProductPageContent product={productWithImage} />);

    const image = screen.getByRole("img", { name: /modular lounge furniture rental setup/i });

    expect(image).toHaveAttribute("src", productWithImage.primaryImage?.publicUrl);
    expect(screen.getByRole("button", { name: /increase modular lounge quantity/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/modular lounge quantity selected/i)).toHaveTextContent("Qty 0");
    expect(screen.getByRole("link", { name: /request quote/i })).toHaveAttribute("href", "/quote");
    expect(screen.getByRole("link", { name: /back to catalogue/i })).toHaveAttribute("href", "/catalogue");
    expect(document.body.textContent).not.toMatch(/checkout|payment|reserve|book now/i);
  });

  it("keeps safe fallback imagery on catalogue cards when no listing image URL is available", () => {
    const { container } = render(
      <CataloguePageContent
        catalogue={{
          ...catalogue,
          products: [
            {
              ...productWithImage,
              images: [],
              primaryImage: undefined
            }
          ]
        }}
      />
    );

    expect(container.querySelector(".stitch-card__image img")).toHaveAttribute(
      "src",
      "/assets/images/product_sofa.png"
    );
  });

  it("keeps empty catalogue recovery visitor-facing and free of forbidden flows", () => {
    render(
      <CataloguePageContent
        catalogue={{
          ...catalogue,
          products: []
        }}
      />
    );

    expect(document.body.textContent).toMatch(/no public rental listings are available right now/i);
    expect(document.body.textContent).toMatch(/catalogue records will appear here once published/i);
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("keeps safe fallback imagery on listing details when no listing image URL is available", () => {
    const { container } = render(
      <ProductPageContent
        product={{
          ...productWithImage,
          images: [],
          primaryImage: undefined
        }}
      />
    );

    expect(container.querySelector(".stitch-detail-open-media img")).toHaveAttribute(
      "src",
      "/assets/images/product_sofa.png"
    );
    expect(screen.queryByText(/public-safe|review-safe|admin|draft/i)).not.toBeInTheDocument();
  });

  it("generates safe generic listing metadata when public catalogue data is unavailable", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "lounge-sofa-package" })
    });

    expect(metadata.title).toMatch(/furniture listing/i);
    expect(metadata.description).toMatch(/event furniture rental/i);
    expect(JSON.stringify(metadata)).not.toMatch(/workspace|storagePath|storage\/v1|admin|draft|checkout|payment/i);
  });

  it("uses safe fallback listing metadata when public catalogue data is unavailable", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "missing-listing" })
    });

    expect(metadata.title).toMatch(/furniture listing/i);
    expect(metadata.description).toMatch(/event furniture rental/i);
  });
});
