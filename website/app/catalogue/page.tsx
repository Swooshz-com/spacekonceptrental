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

function textOrUndefined(value: string | undefined) {
  return value?.trim() || undefined;
}

function publicListingSummary(product: PublicCatalogueProduct) {
  return (
    textOrUndefined(product.shortDescription) ??
    textOrUndefined(product.description) ??
    "Listing details can be reviewed with the team during quote follow-up."
  );
}

function publicCategoryLabel(product: PublicCatalogueProduct) {
  return textOrUndefined(product.categoryName) ?? "Category to confirm";
}

function publicRentalUnit(product: PublicCatalogueProduct) {
  return textOrUndefined(product.rentalUnit) ?? "confirm with team";
}

function publicImageAltText(
  image: PublicCatalogueProduct["primaryImage"],
  product: PublicCatalogueProduct
) {
  return (
    textOrUndefined(image?.altText) ??
    `${product.name} furniture rental setup`
  );
}

function CatalogueCardImage({
  product,
  fallbackImage
}: {
  product: PublicCatalogueProduct;
  fallbackImage: StaticImageData;
}) {
  const image = product.primaryImage;
  const altText = publicImageAltText(image, product);

  if (image?.publicUrl) {
    return (
      <img
        alt={altText}
        src={image.publicUrl}
      />
    );
  }

  return (
    <figure className="catalogue-card__fallback-image">
      <Image alt={altText} src={fallbackImage} />
      <figcaption>Representative rental image; final media can be reviewed during enquiry follow-up.</figcaption>
    </figure>
  );
}

function CatalogueCardMeta({ product }: { product: PublicCatalogueProduct }) {
  return (
    <div className="catalogue-card__meta">
      <span>{publicCategoryLabel(product)}</span>
      <span>Rental unit: {publicRentalUnit(product)}</span>
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
        this listing. Include category fit and rental unit notes if helpful;
        browsing does not set aside furniture or finalise rental details.
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
            VIP waiting rooms, and post-talk networking.
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
        <Link className="button button--secondary" href="/events">
          Compare event setup guidance
        </Link>
        <Link className="button" href="/quote">
          Send an enquiry
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
  emptyMessage = "No public rental listings are available right now. Send an enquiry if you need help describing the event setup.",
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
        <section className="route-card" aria-label="Public listing recovery">
          <h2>No matching public listings</h2>
          <p>{emptyMessage}</p>
          {activeCategoryName ? (
            <p className="category-management__hint">
              Browse listings, compare event-use guidance, or send a
              general enquiry if your rental setup spans more than {activeCategoryName}.
            </p>
          ) : (
            <p className="category-management__hint">
              Browse categories or event-use guidance while public listings are
              being prepared, or use the enquiry form to share the rental setup
              you need.
            </p>
          )}
        </section>
        <div className="hero__actions">
          <Link className="button button--secondary" href={listingBasePath}>
            Browse listings
          </Link>
          <Link className="button button--secondary" href="/categories">
            Browse categories
          </Link>
          <Link className="button button--secondary" href="/events">
            Browse event setup guidance
          </Link>
          <Link className="button" href="/quote">
            Send an enquiry
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
              <p>{publicListingSummary(product)}</p>
              <CatalogueCardPlanning product={product} />
              <div className="catalogue-card__actions">
                <Link
                  className="card-link"
                  href={`${detailBasePath}/${product.slug}`}
                >
                  View rental listing
                </Link>
                <Link
                  className="card-link"
                  href={getQuoteHrefForListing(product.slug)}
                >
                  Request a quote
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hero__actions">
        <Link className="button" href="/quote">
          Start a rental enquiry
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
