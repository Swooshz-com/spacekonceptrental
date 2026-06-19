import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import chairImage from "../../assets/images/product_chair.png";
import sofaImage from "../../assets/images/product_sofa.png";
import corporateImage from "../../assets/images/event_corporate.png";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { getQuoteHrefForDiscoveryContext, getQuoteHrefForListing } from "../../lib/catalogue/quote-handoff";
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
    label: "Reception setup",
    summary:
      "Soft seating, side tables, and conversation areas for arrival or networking plans.",
    terms: ["reception", "lounge", "soft", "side", "networking", "vip"]
  },
  {
    slug: "conference-seating",
    label: "Conference idea",
    summary:
      "Seating, cocktail tables, and registration-area pieces for talks or team sessions.",
    terms: ["conference", "seminar", "chair", "seating", "cocktail", "registration"]
  },
  {
    slug: "brand-activation",
    label: "Activation idea",
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
  if (eventUse.slug === "reception-lounge") {
    return "Reception lounge";
  }

  if (eventUse.slug === "conference-seating") {
    return "Conference seating";
  }

  if (eventUse.slug === "brand-activation") {
    return "Brand activation setup";
  }

  return "Event-use idea";
}

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

function publicImageStatus(product: PublicCatalogueProduct) {
  return product.primaryImage?.publicUrl
    ? "Public image available"
    : "Representative image shown";
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

  return (
    <figure className="catalogue-card__fallback-image">
      <Image alt={altText} src={fallbackImage} />
      <figcaption>
        No public image is available for this listing yet; use the
        representative rental image while requesting details.
      </figcaption>
    </figure>
  );
}

function CatalogueCardMeta({ product }: { product: PublicCatalogueProduct }) {
  return (
    <dl className="catalogue-card__meta" aria-label={`Browse cues for ${product.name}`}>
      <div>
        <dt>Category/type</dt>
        <dd>{publicCategoryLabel(product)}</dd>
      </div>
      <div>
        <dt>Rental unit</dt>
        <dd>{publicRentalUnit(product)}</dd>
      </div>
      <div>
        <dt>Image</dt>
        <dd>{publicImageStatus(product)}</dd>
      </div>
    </dl>
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
        this listing. Browsing does not set aside furniture or finalise rental
        details; it only helps the team understand the enquiry.
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

function buildListingHref(
  listingBasePath: string,
  context: Pick<CatalogueDiscoveryState, "categorySlug" | "eventSlug" | "search">
) {
  const params = new URLSearchParams();

  if (context.categorySlug) {
    params.set("category", context.categorySlug);
  }

  if (context.eventSlug) {
    params.set("event", context.eventSlug);
  }

  if (context.search) {
    params.set("search", context.search);
  }

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
  if (catalogue.categories.length === 0) {
    return null;
  }

  const categoryCounts = getCategoryCounts(catalogue);
  const hasActiveFilters = Boolean(
    activeCategorySlug || activeEventSlug || activeSearch
  );

  return (
    <nav className="catalogue-discovery" aria-label="Catalogue discovery">
      <div>
        <p className="eyebrow">Discovery</p>
        <h2>Explore by category</h2>
        <p>
          Filter rental listings by search, category, or event-use ideas. These
          local filters only shape browsing context before you send an enquiry.
        </p>
      </div>
      <form action={listingBasePath} className="catalogue-discovery__search" method="get">
        {activeCategorySlug ? (
          <input name="category" type="hidden" value={activeCategorySlug} />
        ) : null}
        {activeEventSlug ? (
          <input name="event" type="hidden" value={activeEventSlug} />
        ) : null}
        <label>
          Search listings
          <input
            defaultValue={activeSearch}
            name="search"
            placeholder="Search listing, category, or event-use text"
            type="search"
          />
        </label>
        <button className="button button--secondary" type="submit">
          Search listings
        </button>
        {hasActiveFilters ? (
          <Link className="button button--secondary" href={listingBasePath}>
            Reset filters
          </Link>
        ) : null}
      </form>
      <div className="catalogue-discovery__chips" aria-label="Browse categories">
        <Link
          aria-current={!activeCategorySlug ? "page" : undefined}
          className="catalogue-chip"
          href={buildListingHref(listingBasePath, {
            eventSlug: activeEventSlug,
            search: activeSearch
          })}
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
              href={buildListingHref(listingBasePath, {
                categorySlug: category.slug,
                eventSlug: activeEventSlug,
                search: activeSearch
              })}
              key={category.id}
            >
              {category.name} {listingCountText(count)}
            </Link>
          );
        })}
      </div>
      <div className="catalogue-discovery__chips" aria-label="Explore event-use ideas">
        {eventUseFilters.map((eventUse) => (
          <Link
            aria-current={activeEventSlug === eventUse.slug ? "page" : undefined}
            className="catalogue-chip"
            href={buildListingHref(listingBasePath, {
              categorySlug: activeCategorySlug,
              eventSlug: eventUse.slug,
              search: activeSearch
            })}
            key={eventUse.slug}
          >
            {eventUse.label}
          </Link>
        ))}
      </div>
    </nav>
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
    discovery?.categoryName ||
      discovery?.categorySlug ||
      discovery?.eventLabel ||
      discovery?.eventSlug ||
      discovery?.search
  );

  return (
    <section
      aria-label="Rental listing results summary"
      className="catalogue-results-summary"
    >
      <div>
        <p className="eyebrow">Showing listings</p>
        <h2>{listingCountText(listingCount)}</h2>
        <p>
          {hasActiveFilters
            ? "Current filters shape this browsing view only. The same context can carry into an editable quote request."
            : "Browse the public rental listings, compare details, and choose a listing to start an editable quote request."}
        </p>
      </div>
      <dl>
        <div>
          <dt>Category</dt>
          <dd>{discovery?.categoryName ?? "All categories"}</dd>
        </div>
        <div>
          <dt>Event-use idea</dt>
          <dd>{discovery?.eventLabel ?? "All event-use ideas"}</dd>
        </div>
        <div>
          <dt>Search</dt>
          <dd>{discovery?.search ?? "No search term"}</dd>
        </div>
      </dl>
      {hasActiveFilters ? (
        <Link className="card-link" href={listingBasePath}>
          Reset filters
        </Link>
      ) : null}
    </section>
  );
}

function DiscoveryActiveSummary({
  discovery,
  listingBasePath
}: {
  discovery?: CatalogueDiscoveryState;
  listingBasePath: string;
}) {
  const activeFilters = [
    discovery?.categoryName ? `Category: ${discovery.categoryName}` : undefined,
    discovery?.eventLabel ? `Event-use idea: ${discovery.eventLabel}` : undefined,
    discovery?.search ? `Search: ${discovery.search}` : undefined
  ].filter(Boolean);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <aside className="catalogue-discovery" aria-label="Active listing filters">
      <div>
        <p className="eyebrow">Active filters</p>
        <h2>Rental listing view</h2>
        <p>
          {activeFilters.join("; ")}. This context is editable and only helps
          shape an enquiry for team review.
        </p>
      </div>
      <div className="hero__actions">
        <Link className="button button--secondary" href={listingBasePath}>
          Clear filters
        </Link>
        <Link
          className="button"
          href={getQuoteHrefForDiscoveryContext({
            category: discovery?.categorySlug,
            event: discovery?.eventSlug,
            search: discovery?.search
          })}
        >
          Start a rental enquiry
        </Link>
      </div>
    </aside>
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
        {eventUseFilters.map((eventUse) => (
          <article className="route-card" key={eventUse.slug}>
            <h3>{eventUseDisplayLabel(eventUse)}</h3>
            <p>{eventUse.summary}</p>
          </article>
        ))}
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

function CatalogueSelectionGuide() {
  return (
    <section
      aria-label="How to choose a rental listing"
      className="catalogue-selection-guide"
    >
      <div>
        <p className="eyebrow">Browse helper</p>
        <h2>How to choose a rental listing</h2>
        <p>
          Start with category/type, compare the short description and rental
          unit, then open the listing details before sending a quote request.
        </p>
      </div>
      <ul className="journey-list">
        <li>Use category and event-use filters to narrow the browsing view.</li>
        <li>Check whether the card shows a public image or a representative image.</li>
        <li>Request a quote after adding event details, quantities, and venue notes.</li>
      </ul>
    </section>
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
  emptyMessage = "No public rental listings are available right now. Clear filters, review current rental listings, or send a general quote request with the rental setup you need reviewed.",
  intro = "Browse furniture and event rental listings, compare useful details, and send an enquiry for team follow-up.",
  listingBasePath = "/listings",
  title = "Furniture catalogue for event rentals"
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

  if (catalogue.products.length === 0) {
    return (
      <section className="section">
        <div className="page-title">
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        <CatalogueDiscovery
          activeCategorySlug={activeCategorySlug}
          activeEventSlug={activeEventSlug}
          activeSearch={activeSearch}
          catalogue={catalogue}
          listingBasePath={listingBasePath}
        />
        <DiscoveryActiveSummary discovery={discovery} listingBasePath={listingBasePath} />
        <CatalogueResultsSummary
          discovery={discovery}
          listingBasePath={listingBasePath}
          listingCount={catalogue.products.length}
        />
        <section className="route-card" aria-label="Public listing recovery">
          <h2>No matching public listings</h2>
          <p>{emptyMessage}</p>
          {activeCategoryName ? (
            <p className="category-management__hint">
              Browse listings, compare event-use guidance, or send a general
              enquiry if your rental setup spans more than {activeCategoryName}.
            </p>
          ) : (
            <p className="category-management__hint">
              Clear filters, review current rental listings, browse categories,
              or send a general quote request with the rental setup you need
              reviewed.
            </p>
          )}
        </section>
        <div className="hero__actions">
          <Link className="button button--secondary" href={listingBasePath}>
            Review current rental listings
          </Link>
          <Link className="button button--secondary" href="/categories">
            Browse categories
          </Link>
          <Link className="button button--secondary" href="/events">
            Browse event setup guidance
          </Link>
          <Link className="button" href="/quote">
            Start a general quote request
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
        activeEventSlug={activeEventSlug}
        activeSearch={activeSearch}
        catalogue={catalogue}
        listingBasePath={listingBasePath}
      />
      <DiscoveryActiveSummary discovery={discovery} listingBasePath={listingBasePath} />
      <CatalogueResultsSummary
        discovery={discovery}
        listingBasePath={listingBasePath}
        listingCount={catalogue.products.length}
      />
      <CatalogueSelectionGuide />

      <div className="catalogue-grid">
        {catalogue.products.map((product) => (
          <article
            aria-label={`Rental listing card for ${product.name}`}
            className="catalogue-card"
            key={product.slug}
          >
            <div className="catalogue-card__image">
              <CatalogueCardImage
                fallbackImage={getProductImage(product)}
                product={product}
              />
            </div>
            <div className="catalogue-card__body">
              <CatalogueCardMeta product={product} />
              <p className="catalogue-card__reference">Public rental listing</p>
              <p className="catalogue-card__reference">
                Listing reference: {product.slug}
              </p>
              <h2>{product.name}</h2>
              <p>{publicListingSummary(product)}</p>
              <CatalogueCardPlanning product={product} />
              <div className="catalogue-card__actions">
                <Link
                  className="card-link card-link--primary"
                  href={`${detailBasePath}/${product.slug}`}
                >
                  View details for {product.name}
                </Link>
                <Link
                  className="card-link"
                  href={getQuoteHrefForListing(product.slug)}
                >
                  Request a quote for {product.name}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hero__actions">
        <Link className="button" href={getQuoteHrefForDiscoveryContext({
          category: activeCategorySlug,
          event: activeEventSlug,
          search: activeSearch
        })}>
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
