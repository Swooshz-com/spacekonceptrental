import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src
  }: {
    alt: string;
    src: string | { src?: string };
  }) => <img alt={alt} src={typeof src === "string" ? src : src.src} />
}));

import { CataloguePageContent } from "./page";
import {
  generateMetadata,
  ProductPageContent
} from "./[slug]/page";
import type { PublicCatalogue, PublicCatalogueProduct } from "../../lib/catalogue/types";

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
      publicUrl:
        "https://space.supabase.co/storage/v1/object/public/listing-media/workspace/product/lounge.webp",
      altText: "Modular lounge furniture rental setup",
      sortOrder: 1,
      isPrimary: true
    },
    {
      id: "image-2",
      storageBucket: "listing-media",
      storagePath: "workspace/product/lounge-side.webp",
      publicUrl:
        "https://space.supabase.co/storage/v1/object/public/listing-media/workspace/product/lounge-side.webp",
      altText: "Side view of modular lounge furniture rental setup",
      sortOrder: 2,
      isPrimary: false
    }
  ],
  primaryImage: {
    id: "image-1",
    storageBucket: "listing-media",
    storagePath: "workspace/product/lounge.webp",
    publicUrl:
      "https://space.supabase.co/storage/v1/object/public/listing-media/workspace/product/lounge.webp",
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

    const image = screen.getByRole("img", {
      name: /modular lounge furniture rental setup/i
    });

    expect(image).toHaveAttribute("src", productWithImage.primaryImage?.publicUrl);
    expect(screen.getByRole("link", { name: /view listing/i })).toHaveAttribute(
      "href",
      "/catalogue/modular-lounge"
    );
    expect(
      screen.getByRole("link", { name: /request this listing/i })
    ).toHaveAttribute("href", "/quote?listing=modular-lounge");
    expect(screen.queryByText(/cart|checkout|payment|online ordering/i)).not.toBeInTheDocument();
  });

  it("renders listing detail primary image and additional image when available", () => {
    render(<ProductPageContent product={productWithImage} />);

    const images = screen.getAllByRole("img", {
      name: /modular lounge furniture rental setup/i
    });

    expect(images[0]).toHaveAttribute("src", productWithImage.primaryImage?.publicUrl);
    expect(
      screen.getByRole("img", {
        name: /side view of modular lounge furniture rental setup/i
      })
    ).toHaveAttribute("src", productWithImage.images?.[1]?.publicUrl);
    expect(
      screen.getByRole("link", { name: /request this listing/i })
    ).toHaveAttribute("href", "/quote?listing=modular-lounge");
    expect(screen.queryByText(/checkout|payment|reserve|book now/i)).not.toBeInTheDocument();
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

    expect(container.querySelector(".catalogue-card__image img")).toHaveAttribute(
      "src",
      "/assets/images/product_sofa.png"
    );
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

    expect(container.querySelector(".detail-primary-image img")).toHaveAttribute(
      "src",
      "/assets/images/product_sofa.png"
    );
  });

  it("generates safe listing metadata from public catalogue data", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "lounge-sofa-package" })
    });

    expect(metadata.title).toMatch(/lounge sofa package/i);
    expect(metadata.description).toMatch(/event furniture rental/i);
    expect(JSON.stringify(metadata)).not.toMatch(
      /workspace|storagePath|storage\/v1|admin|draft|checkout|payment/i
    );
  });

  it("uses safe fallback listing metadata when public catalogue data is unavailable", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "missing-listing" })
    });

    expect(metadata.title).toMatch(/furniture listing/i);
    expect(metadata.description).toMatch(/event furniture rental/i);
  });
});
