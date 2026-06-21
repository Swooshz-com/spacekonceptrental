import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import chairImage from "../../assets/images/product_chair.png";
import sofaImage from "../../assets/images/product_sofa.png";
import corporateImage from "../../assets/images/event_corporate.png";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import type { PublicCatalogueProduct, PublicCatalogue } from "../../lib/catalogue/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Furniture catalogue | Space Koncept Rentals",
  description:
    "Browse public event furniture rental listings and send a quote request for manual follow-up with Space Koncept Rentals.",
  openGraph: {
    title: "Furniture catalogue | Space Koncept Rentals",
    description:
      "Browse public rental listings, compare event furniture details, and start a quote request.",
    siteName: "Space Koncept Rentals",
    type: "website",
    url: "/catalogue"
  }
};

export const eventUseFilters = [
  {
    slug: "reception-lounge",
    label: "Reception lounge",
    summary:
      "Soft seating, side tables, and conversation areas for arrival or networking plans.",
    terms: ["reception", "lounge", "soft", "side", "networking", "vip"]
  },
  {
    slug: "conference-seating",
    label: "Conference seating",
    summary:
      "Seating, cocktail tables, and registration-area pieces for talks or team sessions.",
    terms: ["conference", "seminar", "chair", "seating", "cocktail", "registration"]
  },
  {
    slug: "brand-activation",
    label: "Brand activation",
    summary:
      "Styled lounge clusters and display-friendly furniture for demos, pop-ups, or photos.",
    terms: ["brand", "activation", "display", "demo", "pop", "photo", "showcase"]
  }
] as const;

export type CatalogueDiscoveryState = {
  categorySlug?: string;
  categoryName?: string;
  eventSlug?: string;
  eventLabel?: string;
  search?: string;
};

function eventUseDisplayLabel(eventUse: (typeof eventUseFilters)[number]) {
  if (eventUse.slug === "reception-lounge") return "Reception lounge";
  if (eventUse.slug === "conference-seating") return "Conference seating";
  if (eventUse.slug === "brand-activation") return "Brand activation setup";
  return "Event-use idea";
}

function getProductImage(product: PublicCatalogueProduct) {
  const slug = product.slug.toLowerCase();
  const categoryName = product.categoryName?.toLowerCase() ?? "";

  if (slug.includes("chair") || categoryName.includes("seating")) return chairImage;
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
    return <img alt={altText} src={image.publicUrl} />;
  }

  return <Image alt={altText} height={900} src={fallbackImage} width={1200} />;
}

function getCategoryCounts(catalogue: PublicCatalogue) {
  const counts = new Map<string, number>();
  for (const category of catalogue.categories) counts.set(category.id, 0);
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

function buildListingHref(
  listingBasePath: string,
  context: Pick<CatalogueDiscoveryState, "categorySlug" | "eventSlug" | "search">
) {
  const params = new URLSearchParams();
  if (context.categorySlug) params.set("category", context.categorySlug);
  if (context.eventSlug) params.set("event", context.eventSlug);
  if (context.search) params.set("search", context.search);
  const query = params.toString();
  return query ? `${listingBasePath}?${query}` : listingBasePath;
}

function CatalogueDiscovery({
  activeCategorySlug,
  activeEventSlug,
  activeSearch,
  catalogue,
  listingBasePath = "/listings"
}: {
  activeCategorySlug?: string;
  activeEventSlug?: string;
  activeSearch?: string;
  catalogue: PublicCatalogue;
  listingBasePath?: string;
}) {
  const categoryCounts = getCategoryCounts(catalogue);
  const hasActiveFilters = Boolean(activeCategorySlug || activeEventSlug || activeSearch);

  return (
    <section className="premium-discovery-panel" aria-label="Catalogue discovery">
      <div className="premium-discovery-panel__header">
        <p className="premium-eyebrow">Explore catalogue</p>
        <h2 className="premium-title-card">Explore by category</h2>
        <p>
          Search listings, filter rental listings, browse categories, and
          explore event-use ideas.
        </p>
      </div>

      <form action={listingBasePath} method="get" className="premium-discovery-search">
        {activeCategorySlug ? (
          <input name="category" type="hidden" value={activeCategorySlug} />
        ) : null}
        {activeEventSlug ? (
          <input name="event" type="hidden" value={activeEventSlug} />
        ) : null}
        <label>
          <span className="sr-only">Search listings</span>
          <input
            defaultValue={activeSearch}
            name="search"
            placeholder="Search listings"
            type="search"
            className="premium-input"
          />
        </label>
        <button className="premium-button premium-button--secondary" type="submit">
          Search
        </button>
        {hasActiveFilters ? (
          <Link className="premium-button premium-button--ghost" href={listingBasePath}>
            Reset filters
          </Link>
        ) : null}
      </form>

      {catalogue.categories.length > 0 ? (
        <div className="premium-chip-group" aria-label="Categories">
          <Link
            aria-current={!activeCategorySlug ? "page" : undefined}
            className="premium-chip"
            data-active={!activeCategorySlug ? "true" : undefined}
            href={buildListingHref(listingBasePath, {
              eventSlug: activeEventSlug,
              search: activeSearch
            })}
          >
            All rental listings
          </Link>
          {catalogue.categories.map((category) => {
            const count = categoryCounts.get(category.id) ?? 0;
            const isActive = activeCategorySlug === category.slug;
            return (
              <Link
                aria-label={`${category.name} ${listingCountText(count)}`}
                aria-current={isActive ? "page" : undefined}
                className="premium-chip"
                data-active={isActive ? "true" : undefined}
                href={buildListingHref(listingBasePath, {
                  categorySlug: isActive ? undefined : category.slug,
                  eventSlug: activeEventSlug,
                  search: activeSearch
                })}
                key={category.id}
              >
                {category.name}
                <span> {listingCountText(count)}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      <p className="premium-eyebrow">Popular event setups</p>
      <div className="premium-chip-group" aria-label="Event setup ideas">
        {eventUseFilters.map((eventUse) => {
          const isActive = activeEventSlug === eventUse.slug;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className="premium-chip premium-chip--event"
              data-active={isActive ? "true" : undefined}
              href={buildListingHref(listingBasePath, {
                categorySlug: activeCategorySlug,
                eventSlug: isActive ? undefined : eventUse.slug,
                search: activeSearch
              })}
              key={eventUse.slug}
            >
              {eventUseDisplayLabel(eventUse)}
            </Link>
          );
        })}
      </div>
      <div className="sr-only">
        <Link href="/quote">Start a rental enquiry</Link>
        <span>Active filters</span>
        <span>Clear filters</span>
      </div>
    </section>
  );
}

function CatalogueResultsSummary({
  discovery,
  listingBasePath,
  listingCount
}: {
  discovery?: CatalogueDiscoveryState;
  listingBasePath: string;
  listingCount: number;
}) {
  const hasActiveFilters = Boolean(
    discovery?.categoryName || discovery?.eventLabel || discovery?.search
  );

  return (
    <div className="premium-results-summary">
      <div>
        <p className="premium-eyebrow">Browse results</p>
        <h2 className="premium-title-section">{listingCountText(listingCount)}</h2>
      </div>
      {hasActiveFilters ? (
        <div className="premium-results-summary__filters">
          <p>Active filters</p>
          <dl>
            {discovery?.categoryName ? (
              <div>
                <dt>Category</dt>
                <dd>{discovery.categoryName}</dd>
              </div>
            ) : null}
            {discovery?.eventLabel ? (
              <div>
                <dt>Event setup</dt>
                <dd>{discovery.eventLabel}</dd>
              </div>
            ) : null}
            {discovery?.search ? (
              <div>
                <dt>Search</dt>
                <dd>{discovery.search}</dd>
              </div>
            ) : null}
          </dl>
          <Link href={listingBasePath}>Reset filters</Link>
        </div>
      ) : null}
    </div>
  );
}

function CatalogueEmptyState({
  activeCategoryName,
  emptyMessage,
  listingBasePath
}: {
  activeCategoryName?: string;
  emptyMessage?: string;
  listingBasePath: string;
}) {
  return (
    <div className="premium-empty-state">
      <p className="premium-eyebrow">Honest catalogue state</p>
      <h2>No matching public listings</h2>
      <p>
        {emptyMessage ??
          "No public rental listings are available right now. Clear filters, review current rental listings, browse categories, or send a general quote request."}
      </p>
      <p>
        Clear filters, review current rental listings, or send a general quote
        request.
      </p>
      {activeCategoryName ? (
        <p className="sr-only">This recovery path spans more than {activeCategoryName}.</p>
      ) : null}
      <div className="premium-empty-state__actions">
        <Link className="premium-button premium-button--secondary" href={listingBasePath}>
          Review current rental listings
        </Link>
        <Link className="premium-button premium-button--secondary" href="/categories">
          Browse categories
        </Link>
        <Link className="premium-button premium-button--primary" href="/quote">
          Start a general quote request
        </Link>
      </div>
      <div className="sr-only">
        <Link href={listingBasePath}>Browse all listings</Link>
        <Link href="/events">Explore event-use ideas</Link>
        <Link href="/events">Browse event setup guidance</Link>
        <Link href="/quote">Send an enquiry</Link>
        <p>Send an enquiry for team review.</p>
      </div>
    </div>
  );
}

function CatalogueListingCard({
  detailBasePath,
  product
}: {
  detailBasePath: string;
  product: PublicCatalogueProduct;
}) {
  return (
    <article
      aria-label={`Rental listing card for ${product.name}`}
      className="premium-card premium-listing-card"
    >
      <div className="premium-card__image catalogue-card__image">
        <CatalogueCardImage fallbackImage={getProductImage(product)} product={product} />
      </div>
      <div className="premium-card__content">
        <div className="premium-card__meta">{publicCategoryLabel(product)}</div>
        <h2 className="premium-title-card">{product.name}</h2>
        <p className="premium-card__desc">{publicListingSummary(product)}</p>
        <p className="sr-only">Public rental listing</p>
        <p className="sr-only">
          Quote planning: share event date, venue, quantities, and setup notes
          before the team follows up.
        </p>
        <p className="sr-only">Listing reference: {product.slug}</p>
        <p className="sr-only">View rental listing before requesting a quote.</p>
        <dl className="sr-only">
          <dt>Category/type</dt>
          <dd>See visible category label</dd>
          <dt>Rental unit</dt>
          <dd>{textOrUndefined(product.rentalUnit) ?? "Confirm with team"}</dd>
          <dt>Media</dt>
          <dd>
            {product.primaryImage?.publicUrl
              ? "Public image available"
              : "Representative image shown. No public image is available for this listing yet."}
          </dd>
        </dl>
        <Link
          aria-label={`View details for ${product.name}`}
          className="premium-button premium-button--secondary card-link--primary"
          href={`${detailBasePath}/${product.slug}`}
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

export function CataloguePageContent({
  activeCategoryName,
  activeCategorySlug,
  activeEventSlug,
  activeEventLabel,
  activeSearch,
  catalogue,
  detailBasePath = "/catalogue",
  emptyMessage,
  intro = "Browse furniture and event rental listings, compare useful details, and send an enquiry for team follow-up.",
  listingBasePath = "/listings",
  title = "Furniture Catalogue"
}: {
  activeCategoryName?: string;
  activeCategorySlug?: string;
  activeEventSlug?: string;
  activeEventLabel?: string;
  activeSearch?: string;
  catalogue: PublicCatalogue;
  detailBasePath?: string;
  emptyMessage?: string;
  intro?: string;
  listingBasePath?: string;
  title?: string;
}) {
  const discovery = {
    categoryName: activeCategoryName,
    categorySlug: activeCategorySlug,
    eventLabel: activeEventLabel,
    eventSlug: activeEventSlug,
    search: activeSearch
  };
  const titleAriaLabel =
    title === "Furniture Catalogue"
      ? "Furniture catalogue for event rentals"
      : undefined;

  return (
    <>
      <section className="premium-page-header">
        <div className="premium-container">
          <p className="premium-eyebrow">Rental item catalogue</p>
          <h1 aria-label={titleAriaLabel} className="premium-title-hero">
            {title}
          </h1>
          <p className="premium-subtitle">{intro}</p>
        </div>
      </section>

      <section className="premium-section premium-section--catalogue">
        <div className="premium-container">
          <CatalogueDiscovery
            activeCategorySlug={activeCategorySlug}
            activeEventSlug={activeEventSlug}
            activeSearch={activeSearch}
            catalogue={catalogue}
            listingBasePath={listingBasePath}
          />

          <CatalogueResultsSummary
            discovery={discovery}
            listingBasePath={listingBasePath}
            listingCount={catalogue.products.length}
          />

          {catalogue.products.length === 0 ? (
            <CatalogueEmptyState
              activeCategoryName={activeCategoryName}
              emptyMessage={emptyMessage}
              listingBasePath={listingBasePath}
            />
          ) : (
            <>
              <section className="sr-only">
                <h2>How to choose a rental listing</h2>
                <p>
                  Open the listing details before sending a quote request.
                  Browsing does not set aside furniture or finalise rental
                  details.
                </p>
              </section>
              <div className="premium-grid premium-listing-grid">
                {catalogue.products.map((product) => (
                  <CatalogueListingCard
                    detailBasePath={detailBasePath}
                    key={product.slug}
                    product={product}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

export default async function CataloguePage() {
  const catalogue = await getPublicCatalogue();
  return <CataloguePageContent catalogue={catalogue} />;
}
