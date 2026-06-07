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

function getCategoryCounts(catalogue: PublicCatalogue) {
  const counts = new Map<string, number>();

  for (const category of catalogue.categories) {
    counts.set(category.id, 0);
  }

  for (const product of catalogue.products) {
    if (product.categoryId) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
  }

  return counts;
}

function listingCountText(count: number) {
  return `${count} ${count === 1 ? "listing" : "listings"}`;
}

function CatalogueDiscovery({
  activeCategorySlug,
  catalogue,
  listingBasePath = "/listings"
}: {
  activeCategorySlug?: string;
  catalogue: PublicCatalogue;
  listingBasePath?: string;
}) {
  if (catalogue.categories.length === 0) {
    return null;
  }

  const categoryCounts = getCategoryCounts(catalogue);

  return (
    <nav className="catalogue-discovery" aria-label="Catalogue discovery">
      <div>
        <p className="eyebrow">Discovery</p>
        <h2>Explore by category</h2>
        <p>
          Start with the rental grouping closest to your event setup, then send
          an enquiry for the listings that fit.
        </p>
      </div>
      <div className="catalogue-discovery__chips">
        <Link
          aria-current={!activeCategorySlug ? "page" : undefined}
          className="catalogue-chip"
          href={listingBasePath}
        >
          All rental listings
        </Link>
        {catalogue.categories.map((category) => {
          const count = categoryCounts.get(category.id) ?? 0;

          return (
            <Link
              aria-current={
                activeCategorySlug === category.slug ? "page" : undefined
              }
              className="catalogue-chip"
              href={`${listingBasePath}?category=${encodeURIComponent(category.slug)}`}
              key={category.id}
            >
              {category.name} {listingCountText(count)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function EventSetupGuidance() {
  return (
    <section className="catalogue-use-cases" aria-label="Event setup guidance">
      <div>
        <p className="eyebrow">Planning shortcuts</p>
        <h2>Popular event setups</h2>
        <p>
          Use these starting points to shape a rental request when you are still
          comparing furniture combinations.
        </p>
      </div>
      <div className="catalogue-use-cases__grid">
        <article className="route-card">
          <h3>Reception lounge</h3>
          <p>
            Soft seating, side tables, and low conversation areas for arrivals,
            VIP holding rooms, and post-talk networking.
          </p>
        </article>
        <article className="route-card">
          <h3>Conference seating</h3>
          <p>
            Seminar chairs, cocktail tables, and registration-area pieces for
            talks, launches, and team sessions.
          </p>
        </article>
        <article className="route-card">
          <h3>Brand activation setup</h3>
          <p>
            Styled lounge clusters and display-friendly furniture for product
            demos, pop-ups, and photo moments.
          </p>
        </article>
      </div>
      <div className="hero__actions">
        <Link className="button" href="/quote">
          Send a quote enquiry
        </Link>
      </div>
    </section>
  );
}

export function CataloguePageContent({
  activeCategoryName,
  activeCategorySlug,
  catalogue,
  detailBasePath = "/catalogue",
  emptyMessage = "No listings are available right now. Please check back soon.",
  intro = "Browse furniture and event-rental listings made for spaces, occasions, and styled setups.",
  listingBasePath = "/listings",
  title = "Furniture catalogue"
}: {
  activeCategoryName?: string;
  activeCategorySlug?: string;
  catalogue: PublicCatalogue;
  detailBasePath?: string;
  emptyMessage?: string;
  intro?: string;
  listingBasePath?: string;
  title?: string;
}) {
  if (catalogue.products.length === 0) {
    return (
      <section className="section">
        <div className="page-title">
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        <CatalogueDiscovery
          activeCategorySlug={activeCategorySlug}
          catalogue={catalogue}
          listingBasePath={listingBasePath}
        />
        <p>{emptyMessage}</p>
        {activeCategoryName ? (
          <p className="category-management__hint">
            Browse all listings or send a general enquiry if your event setup
            spans more than {activeCategoryName}.
          </p>
        ) : null}
        <div className="hero__actions">
          <Link className="button button--secondary" href={listingBasePath}>
            Browse all listings
          </Link>
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

      <CatalogueDiscovery
        activeCategorySlug={activeCategorySlug}
        catalogue={catalogue}
        listingBasePath={listingBasePath}
      />

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

      <EventSetupGuidance />
    </section>
  );
}

export default async function CataloguePage() {
  const catalogue = await getPublicCatalogue();

  return <CataloguePageContent catalogue={catalogue} />;
}
