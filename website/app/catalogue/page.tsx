import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import chairImage from "../../assets/images/product_chair.png";
import sofaImage from "../../assets/images/product_sofa.png";
import corporateImage from "../../assets/images/event_corporate.png";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { getQuoteHrefForListing } from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct, PublicCatalogue } from "../../lib/catalogue/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Furniture catalogue | Space Koncept Rentals",
  description:
    "Browse public event furniture rental listings and request an enquiry with Space Koncept Rentals."
};

function getProductImage(product: PublicCatalogueProduct) {
  const slug = product.slug.toLowerCase();
  const categoryName = product.categoryName?.toLowerCase() ?? "";

  if (slug.includes("chair") || categoryName.includes("seating")) {
    return chairImage;
  }

  if (
    slug.includes("table") ||
    slug.includes("corporate") ||
    slug.includes("garden") ||
    categoryName.includes("event")
  ) {
    return corporateImage;
  }

  return sofaImage;
}

function CatalogueCardImage({
  product,
  fallbackImage
}: {
  product: PublicCatalogueProduct;
  fallbackImage: StaticImageData;
}) {
  const image = product.primaryImage;
  const fallbackAltText = `${product.name} furniture rental setup`;

  if (image?.publicUrl) {
    return (
      <img
        alt={image.altText ?? fallbackAltText}
        src={image.publicUrl}
      />
    );
  }

  return <Image alt={image?.altText ?? fallbackAltText} src={fallbackImage} />;
}

function CatalogueCardMeta({ product }: { product: PublicCatalogueProduct }) {
  return (
    <div className="catalogue-card__meta">
      {product.categoryName ? <span>{product.categoryName}</span> : null}
      <span>Rental unit: {product.rentalUnit}</span>
    </div>
  );
}

function CatalogueCardPlanning({
  product
}: {
  product: PublicCatalogueProduct;
}) {
  return (
    <aside className="catalogue-card__planning" aria-label={`Quote planning for ${product.name}`}>
      <strong>Quote planning</strong>
      <span>
        Share event date, venue, quantities, and setup notes when you request
        this listing.
      </span>
    </aside>
  );
}

export function CataloguePageContent({
  catalogue,
  detailBasePath = "/catalogue",
  emptyMessage = "No listings are available right now. Please check back soon.",
  intro = "Browse furniture and event-rental listings made for spaces, occasions, and styled setups.",
  title = "Furniture catalogue"
}: {
  catalogue: PublicCatalogue;
  detailBasePath?: string;
  emptyMessage?: string;
  intro?: string;
  title?: string;
}) {
  if (catalogue.products.length === 0) {
    return (
      <section className="section">
        <div className="page-title">
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        <p>{emptyMessage}</p>
        <div className="hero__actions">
          <Link className="button" href="/quote">
            Send a general enquiry
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="page-title">
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>

      <div className="catalogue-grid">
        {catalogue.products.map((product) => (
          <article className="catalogue-card" key={product.slug}>
            <div className="catalogue-card__image">
              <CatalogueCardImage
                fallbackImage={getProductImage(product)}
                product={product}
              />
            </div>
            <div className="catalogue-card__body">
              <CatalogueCardMeta product={product} />
              <h2>{product.name}</h2>
              <p>{product.shortDescription ?? product.description}</p>
              <CatalogueCardPlanning product={product} />
              <div className="catalogue-card__actions">
                <Link
                  className="card-link"
                  href={`${detailBasePath}/${product.slug}`}
                >
                  View listing
                </Link>
                <Link
                  className="card-link"
                  href={getQuoteHrefForListing(product.slug)}
                >
                  Request this listing
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hero__actions">
        <Link className="button" href="/quote">
          Start a general enquiry
        </Link>
      </div>
    </section>
  );
}

export default async function CataloguePage() {
  const catalogue = await getPublicCatalogue();

  return <CataloguePageContent catalogue={catalogue} />;
}
