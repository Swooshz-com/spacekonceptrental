import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import chairImage from "../../assets/images/product_chair.png";
import sofaImage from "../../assets/images/product_sofa.png";
import corporateImage from "../../assets/images/event_corporate.png";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { withDemoPublicCatalogue } from "../../lib/catalogue/demo-public-catalogue";
import {
  getQuoteHrefForDiscoveryContext,
  getQuoteHrefForListing
} from "../../lib/catalogue/quote-handoff";
import type {
  PublicCatalogue,
  PublicCatalogueProduct
} from "../../lib/catalogue/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue | Space Koncept Rental",
  description:
    "Browse public event furniture rental items and submit a quote request for manual team follow-up.",
  openGraph: {
    title: "Catalogue | Space Koncept Rental",
    description:
      "Browse public rental items, compare useful details, and start a quote request.",
    siteName: "Space Koncept Rental",
    type: "website",
    url: "/catalogue"
  }
};

export const eventUseFilters = [
  {
    slug: "reception-lounge",
    label: "Reception lounge",
    summary:
      "Soft seating, side tables, and conversation areas for arrival flow.",
    terms: ["reception", "lounge", "soft", "side", "networking", "vip"]
  },
  {
    slug: "conference-seating",
    label: "Conference seating",
    summary:
      "Chairs, tables, and support pieces for talks or team sessions.",
    terms: ["conference", "seminar", "chair", "seating", "table"]
  },
  {
    slug: "brand-activation",
    label: "Brand activation",
    summary:
      "Display-friendly furniture for demos, pop-ups, and photo moments.",
    terms: ["brand", "activation", "display", "demo", "pop", "photo"]
  }
] as const;

export type CatalogueDiscoveryState = {
  categorySlug?: string;
  categoryName?: string;
  eventSlug?: string;
  eventLabel?: string;
  search?: string;
};

function textOrUndefined(value: string | undefined) {
  return value?.trim() || undefined;
}

function productSummary(product: PublicCatalogueProduct) {
  return (
    textOrUndefined(product.shortDescription) ??
    textOrUndefined(product.description) ??
    "Open the detail page or add this item to your quote request for team review."
  );
}

function productCategory(product: PublicCatalogueProduct) {
  return textOrUndefined(product.categoryName) ?? "Rental item";
}

function productFallbackImage(product: PublicCatalogueProduct): StaticImageData {
  const searchText = `${product.slug} ${product.categoryName ?? ""}`.toLowerCase();

  if (searchText.includes("chair") || searchText.includes("seating")) {
    return chairImage;
  }

  if (
    searchText.includes("table") ||
    searchText.includes("setup") ||
    searchText.includes("surface")
  ) {
    return corporateImage;
  }

  return sofaImage;
}

function ProductImage({ product }: { product: PublicCatalogueProduct }) {
  const altText =
    textOrUndefined(product.primaryImage?.altText) ??
    `${product.name} rental furniture`;

  if (product.primaryImage?.publicUrl) {
    return <img alt={altText} src={product.primaryImage.publicUrl} />;
  }

  return <Image alt={altText} src={productFallbackImage(product)} />;
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

function buildListingHref(
  basePath: string,
  context: Pick<CatalogueDiscoveryState, "categorySlug" | "eventSlug" | "search">
) {
  const params = new URLSearchParams();
  if (context.categorySlug) params.set("category", context.categorySlug);
  if (context.eventSlug) params.set("event", context.eventSlug);
  if (context.search) params.set("search", context.search);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function listingCountText(count: number, setupMode: boolean) {
  const noun = setupMode ? "setup" : "item";
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

function CollectionCard({
  detailBasePath,
  index,
  product,
  setupMode
}: {
  detailBasePath: string;
  index: number;
  product: PublicCatalogueProduct;
  setupMode: boolean;
}) {
  const wide = index === 0 || index === 4;

  return (
    <article
      aria-label={`Rental ${setupMode ? "setup" : "item"} card for ${product.name}`}
      className={`skr-card ${wide ? "skr-card--wide" : "skr-card--standard"}`}
    >
      <div className="skr-card__image">
        <ProductImage product={product} />
      </div>
      <div className="skr-card__body">
        <span className="skr-card__meta">{productCategory(product)}</span>
        <h2>{product.name}</h2>
        <p>{productSummary(product)}</p>
        <p className="sr-only">
          Open details before sending a quote request. Browsing does not
          finalise rental details.
        </p>
        <dl className="sr-only">
          <dt>Rental unit</dt>
          <dd>{textOrUndefined(product.rentalUnit) ?? "Confirm with team"}</dd>
          <dt>Reference</dt>
          <dd>{product.slug}</dd>
        </dl>
        <div className="skr-card__actions">
          <Link
            aria-label={`View details for ${product.name}`}
            className="skr-button skr-button--outline card-link--primary"
            href={`${detailBasePath}/${product.slug}`}
          >
            Details
          </Link>
          <Link
            aria-label={`Add ${product.name} to quote`}
            className="skr-button skr-button--solid"
            href={getQuoteHrefForListing(product.slug)}
          >
            Add to Quote
          </Link>
        </div>
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
  listingBasePath = "/catalogue",
  title = "The Collection"
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
  const setupMode = detailBasePath === "/listings";
  const discovery = {
    categoryName: activeCategoryName,
    categorySlug: activeCategorySlug,
    eventLabel: activeEventLabel,
    eventSlug: activeEventSlug,
    search: activeSearch
  };
  const categoryCounts = getCategoryCounts(catalogue);
  const hasActiveFilters = Boolean(
    activeCategorySlug || activeEventSlug || activeSearch
  );
  const titleAriaLabel =
    title === "The Collection"
      ? "Furniture catalogue for event rentals"
      : undefined;
  const introCopy = setupMode
    ? "Curated setup ideas stay on the /listings route while the public label stays Setups."
    : "Browse individual rental furniture and add useful items to your quote selection.";
  const quoteContextHref = getQuoteHrefForDiscoveryContext({
    category: activeCategorySlug,
    event: activeEventSlug,
    search: activeSearch
  });

  return (
    <>
      <section className="skr-section">
        <div className="skr-container">
          <div className="skr-page-intro">
            <div>
              <p className="skr-eyebrow">
                {setupMode ? "Setups" : "Individual rentals"}
              </p>
              <h1 aria-label={titleAriaLabel} className="skr-title">
                {title}
              </h1>
            </div>
            <div className="skr-page-intro__copy">
              <p className="skr-copy">{introCopy}</p>
            </div>
          </div>

          <div className="skr-collection-layout">
            <div className="skr-toolbar">
              <form action={listingBasePath} className="skr-search-row" method="get">
                {activeCategorySlug ? (
                  <input name="category" type="hidden" value={activeCategorySlug} />
                ) : null}
                {activeEventSlug ? (
                  <input name="event" type="hidden" value={activeEventSlug} />
                ) : null}
                <input
                  aria-label={`Search ${setupMode ? "setups" : "catalogue"}`}
                  defaultValue={activeSearch}
                  name="search"
                  placeholder={setupMode ? "Search setups" : "Search catalogue"}
                  type="search"
                />
              </form>
              <span className="skr-card__meta">
                {listingCountText(catalogue.products.length, setupMode)}
              </span>
            </div>

            <div className="skr-chip-row" aria-label="Catalogue filters">
              <Link
                aria-current={!hasActiveFilters ? "page" : undefined}
                className="skr-chip"
                href={listingBasePath}
              >
                All Pieces
              </Link>
              {catalogue.categories.map((category) => {
                const isActive = activeCategorySlug === category.slug;
                const count = categoryCounts.get(category.id) ?? 0;
                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className="skr-chip"
                    href={buildListingHref(listingBasePath, {
                      categorySlug: isActive ? undefined : category.slug,
                      eventSlug: activeEventSlug,
                      search: activeSearch
                    })}
                    key={category.id}
                  >
                    {category.name} ({count})
                  </Link>
                );
              })}
              {eventUseFilters.map((eventUse) => {
                const isActive = activeEventSlug === eventUse.slug;
                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className="skr-chip"
                    href={buildListingHref(listingBasePath, {
                      categorySlug: activeCategorySlug,
                      eventSlug: isActive ? undefined : eventUse.slug,
                      search: activeSearch
                    })}
                    key={eventUse.slug}
                  >
                    {eventUse.label}
                  </Link>
                );
              })}
            </div>

            {hasActiveFilters ? (
              <p className="skr-copy">
                Showing results
                {[discovery.categoryName, discovery.eventLabel, discovery.search]
                  .filter(Boolean)
                  .length
                  ? ` for ${[
                      discovery.categoryName,
                      discovery.eventLabel,
                      discovery.search
                    ]
                      .filter(Boolean)
                      .join(", ")}.`
                  : "."}
              </p>
            ) : null}

            {catalogue.products.length === 0 ? (
              <div className="skr-empty-state">
                <p className="skr-eyebrow">
                  {setupMode ? "Setups empty state" : "Catalogue empty state"}
                </p>
                <h2>
                  {setupMode
                    ? "No public setups are available right now."
                    : "No public rental items are available right now."}
                </h2>
                <p>
                  {emptyMessage ??
                    "Real published records will appear here when catalogue data is configured. You can still submit a general rental enquiry."}
                </p>
                <div className="skr-actions">
                  {hasActiveFilters ? (
                    <Link className="skr-button skr-button--outline" href={listingBasePath}>
                      Clear Filters
                    </Link>
                  ) : null}
                  <Link className="skr-button skr-button--solid" href="/quote">
                    Submit Enquiry
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <section className="sr-only">
                  <h2>How to choose a rental listing</h2>
                  <p>
                    Open the listing details before sending a quote request.
                    Browsing does not finalise rental details.
                  </p>
                  <Link href={quoteContextHref}>Start a quote request</Link>
                </section>
                <div className="skr-card-grid">
                  {catalogue.products.map((product, index) => (
                    <CollectionCard
                      detailBasePath={detailBasePath}
                      index={index}
                      key={product.slug}
                      product={product}
                      setupMode={setupMode}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default async function CataloguePage() {
  const catalogue = withDemoPublicCatalogue(
    await getPublicCatalogue(),
    "individual"
  );

  return <CataloguePageContent catalogue={catalogue} />;
}
