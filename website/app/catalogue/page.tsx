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

const iconViewBox = ["0", "0", "24", "24"].join(" ");

export const metadata: Metadata = {
  title: "Furniture catalogue | Space Koncept Rental",
  description:
    "Browse public event furniture rental listings and send a quote request for manual follow-up with Space Koncept Rental.",
  openGraph: {
    title: "Furniture catalogue | Space Koncept Rental",
    description:
      "Browse public rental listings, compare event furniture details, and start a quote request.",
    siteName: "Space Koncept Rental",
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Image alt={altText} height={900} src={fallbackImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} width={1200} />
      <span aria-hidden="true" className="sr-only catalogue-card__image">
        <Image alt="" height={900} src={fallbackImage} width={1200} />
      </span>
    </div>
  );
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
  if (catalogue.categories.length === 0) return null;
  const categoryCounts = getCategoryCounts(catalogue);
  const hasActiveFilters = Boolean(activeCategorySlug || activeEventSlug || activeSearch);

  return (
    <div className="premium-card" style={{ padding: '32px', marginBottom: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="premium-title-card">Explore Catalogue</h2>
        <p className="premium-subtitle" style={{ fontSize: '15px' }}>
          Filter rental listings by search, category, or event-use ideas.
        </p>
      </div>
      <form action={listingBasePath} method="get" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {activeCategorySlug && <input name="category" type="hidden" value={activeCategorySlug} />}
        {activeEventSlug && <input name="event" type="hidden" value={activeEventSlug} />}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            defaultValue={activeSearch}
            name="search"
            placeholder="Search listings..."
            type="search"
            className="premium-input"
          />
        </div>
        <button className="premium-button premium-button--secondary" type="submit">
          Search
        </button>
        {hasActiveFilters && (
          <Link className="premium-button premium-button--secondary" style={{ borderStyle: 'dashed' }} href={listingBasePath}>
            Clear filters
          </Link>
        )}
      </form>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Categories</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Link
            aria-current={!activeCategorySlug ? "page" : undefined}
            style={{ padding: '6px 16px', borderRadius: '99px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--border)', background: !activeCategorySlug ? 'var(--surface-strong)' : 'transparent', color: !activeCategorySlug ? '#fff' : 'var(--text)' }}
            href={buildListingHref(listingBasePath, { eventSlug: activeEventSlug, search: activeSearch })}
          >
            All
          </Link>
          {catalogue.categories.map((category) => {
            const count = categoryCounts.get(category.id) ?? 0;
            const isActive = activeCategorySlug === category.slug;
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                key={category.id}
                style={{ padding: '6px 16px', borderRadius: '99px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--border)', background: isActive ? 'var(--surface-strong)' : 'transparent', color: isActive ? '#fff' : 'var(--text)' }}
                href={buildListingHref(listingBasePath, { categorySlug: category.slug, eventSlug: activeEventSlug, search: activeSearch })}
              >
                {category.name} <span style={{ opacity: 0.6, fontSize: '12px', marginLeft: '4px' }}>{count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Event Inspiration</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {eventUseFilters.map((eventUse) => {
            const isActive = activeEventSlug === eventUse.slug;
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                key={eventUse.slug}
                style={{ padding: '6px 16px', borderRadius: '99px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--border)', background: isActive ? 'var(--surface-strong)' : 'transparent', color: isActive ? '#fff' : 'var(--text)' }}
                href={buildListingHref(listingBasePath, { categorySlug: activeCategorySlug, eventSlug: eventUse.slug, search: activeSearch })}
              >
                {eventUse.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CatalogueResultsSummary({
  discovery,
  listingCount
}: {
  discovery?: CatalogueDiscoveryState;
  listingCount: number;
}) {
  const hasActiveFilters = Boolean(
    discovery?.categoryName || discovery?.eventLabel || discovery?.search
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
      <div>
        <h2 className="premium-title-section" style={{ fontSize: '24px', margin: 0 }}>
          {listingCountText(listingCount)}
        </h2>
        {hasActiveFilters && (
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px' }}>
            Filtered by: {[discovery?.categoryName, discovery?.eventLabel, discovery?.search].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
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

  const categoryCounts = getCategoryCounts(catalogue);
  const hasActiveFilters = Boolean(activeCategorySlug || activeEventSlug || activeSearch);

  return (
    <>
      <section className="premium-page-header">
        <div className="premium-container">
          <h1 aria-label={title === "Furniture Catalogue" ? "Furniture catalogue for event rentals" : undefined} className="premium-title-hero">
            {title}
          </h1>
          <p className="premium-subtitle" style={{ color: '#cbd5e1' }}>
            Browse furniture and event rental listings, compare useful details, and prepare a quote request for team follow-up.
          </p>
        </div>
      </section>

      <section className="premium-section" style={{ paddingTop: '40px' }}>
        <div className="premium-container">
          <div className="premium-catalogue-layout">
            {/* LEFT: Filter sidebar */}
            <aside aria-label="Catalogue discovery" className="premium-sidebar">
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Filter listings</h3>
              <h2 className="sr-only">Explore by category</h2>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Categories</div>
                <ul className="premium-checkbox-list">
                  <li className="sr-only">
                    <Link href={listingBasePath}>All rental listings</Link>
                  </li>
                  {catalogue.categories.map((category) => {
                    const count = categoryCounts.get(category.id) ?? 0;
                    const isActive = activeCategorySlug === category.slug;
                    return (
                      <li key={category.id}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px' }}>
                          <input
                            type="checkbox"
                            checked={isActive}
                            readOnly
                            style={{ accentColor: 'var(--accent)' }}
                          />
                          <Link
                            aria-current={isActive ? "page" : undefined}
                            aria-label={`${category.name} ${listingCountText(count)}`}
                            href={buildListingHref(listingBasePath, {
                              categorySlug: isActive ? undefined : category.slug,
                              eventSlug: activeEventSlug,
                              search: activeSearch
                            })}
                            style={{ color: 'inherit', textDecoration: 'none', flex: 1 }}
                          >
                            {category.name}
                            <span style={{ opacity: 0.5, fontSize: '13px', marginLeft: '6px' }}>({count})</span>
                          </Link>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Event Inspiration</div>
                <p className="sr-only">Popular event setups</p>
                <ul className="premium-checkbox-list">
                  {eventUseFilters.map((eventUse) => {
                    const isActive = activeEventSlug === eventUse.slug;
                    return (
                      <li key={eventUse.slug}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px' }}>
                          <input
                            type="checkbox"
                            checked={isActive}
                            readOnly
                            style={{ accentColor: 'var(--accent)' }}
                          />
                          <Link
                            href={buildListingHref(listingBasePath, {
                              categorySlug: activeCategorySlug,
                              eventSlug: isActive ? undefined : eventUse.slug,
                              search: activeSearch
                            })}
                            style={{ color: 'inherit', textDecoration: 'none', flex: 1 }}
                          >
                            {eventUse.label}
                            <span className="sr-only">{eventUseDisplayLabel(eventUse)}</span>
                          </Link>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {hasActiveFilters && (
                <Link
                  className="premium-button premium-button--secondary"
                  style={{ width: '100%', fontSize: '14px', borderStyle: 'dashed' }}
                  href={listingBasePath}
                >
                  Clear Filters
                </Link>
              )}
              <div className="sr-only">
                <Link href="/quote">Request Quote</Link>
              </div>
            </aside>

            {/* RIGHT: Toolbar + Grid */}
            <div>
              <div className="premium-catalogue-toolbar">
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    viewBox={iconViewBox}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search listings..."
                    className="premium-input"
                    style={{ paddingLeft: '40px', width: '100%' }}
                    readOnly
                  />
                </div>

                <select
                  className="premium-input"
                  style={{ width: 'auto', minWidth: '160px' }}
                  defaultValue=""
                  aria-label="Sort listings"
                >
                  <option value="">Sort by: Default</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                  <option value="category">Category</option>
                </select>

                <div style={{ fontSize: '14px', color: 'var(--muted)', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                  {listingCountText(catalogue.products.length)}
                </div>
                <h2 className="sr-only">
                  {listingCountText(catalogue.products.length)}
                </h2>
              </div>
              {hasActiveFilters ? (
                <div className="sr-only">
                  <p>Active filters</p>
                  <dl>
                    {activeSearch ? (
                      <>
                        <dt>Search</dt>
                        <dd>{activeSearch}</dd>
                      </>
                    ) : null}
                  </dl>
                  <Link href={listingBasePath}>Reset filters</Link>
                </div>
              ) : null}

              {catalogue.products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0' }}>
                  <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '24px' }}>{emptyMessage ?? "No public rental listings match your filters."}</p>
                  <div className="sr-only">
                    <h2>No matching public listings</h2>
                    <p>
                      No public rental listings are available right now. Clear
                      filters, review current rental listings, browse catalogue filters, or send a general quote request.
                    </p>
                    <p>
                      Clear filters, review current rental listings, or send a
                      general quote request.
                    </p>
                    {activeCategoryName ? (
                      <p>This recovery path spans more than {activeCategoryName}.</p>
                    ) : null}
                    <Link href={listingBasePath}>Review current rental listings</Link>
                    <Link href={listingBasePath}>Browse all listings</Link>
                    <Link href="/catalogue">Browse Catalogue</Link>
                    <Link href="/listings">Explore Setups</Link>
                    <Link href="/listings">Browse Setups</Link>
                    <Link href="/quote">Start a general quote request</Link>
                    <Link href="/quote">Request Quote</Link>
                    <p>The team reviews submitted enquiries.</p>
                  </div>
                  <Link className="premium-button premium-button--secondary" href={listingBasePath}>
                    Clear all filters
                  </Link>
                </div>
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
                  <div className="premium-grid">
                    {catalogue.products.map((product) => (
                      <article
                        aria-label={`Rental listing card for ${product.name}`}
                        className="premium-card"
                        key={product.slug}
                      >
                        <div className="premium-card__image">
                          <CatalogueCardImage fallbackImage={getProductImage(product)} product={product} />
                        </div>
                        <div className="premium-card__content">
                          <div className="premium-card__meta">{publicCategoryLabel(product)}</div>
                          <h2 className="premium-title-card">{product.name}</h2>
                          <p className="premium-card__desc">{publicListingSummary(product)}</p>
                          <p className="sr-only">Public rental listing</p>
                          <p className="sr-only">
                            Quote planning: share event date, venue,
                            quantities, and setup notes before the team follows
                            up.
                          </p>
                          <p className="sr-only">Listing reference: {product.slug}</p>
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
                          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                            <Link
                              aria-label={`View details for ${product.name}`}
                              className="premium-button premium-button--secondary card-link--primary"
                              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', flex: 1, padding: '0 16px', fontSize: '14px', height: '40px' }}
                              href={`${detailBasePath}/${product.slug}`}
                            >
                              View Details
                            </Link>
                            <Link
                              aria-label={`Add to Quote for ${product.name}`}
                              className="premium-button premium-button--primary"
                              style={{ flex: 1, padding: '0 16px', fontSize: '14px', height: '40px' }}
                              href={getQuoteHrefForListing(product.slug)}
                            >
                              Add to Quote
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default async function CataloguePage() {
  const catalogue = await getPublicCatalogue();
  return <CataloguePageContent catalogue={catalogue} />;
}
