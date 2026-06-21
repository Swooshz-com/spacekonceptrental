import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import chairImage from "../../assets/images/product_chair.png";
import sofaImage from "../../assets/images/product_sofa.png";
import corporateImage from "../../assets/images/event_corporate.png";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import type { PublicCatalogueProduct, PublicCatalogue } from "../../lib/catalogue/types";
import AddToQuoteButton from "../../components/AddToQuoteButton";

export const dynamic = "force-dynamic";

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
      <Image alt={altText} src={fallbackImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
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
  title = "Catalogue"
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
  const hasActiveFilters = Boolean(activeCategorySlug || activeEventSlug || activeSearch);

  return (
    <div className="section-padding">
      <div className="container">
        <div className="v3-page-header">
          <h1>{title}</h1>
          <p>Browse our curated collection of premium event furniture, perfect for corporate and private events.</p>
        </div>

        {/* Filters */}
        <div className="v3-filters">
          <Link
            aria-current={!activeCategorySlug && !activeEventSlug ? "true" : undefined}
            href={buildListingHref(listingBasePath, { search: activeSearch })}
            className="v3-filter-pill"
          >
            All Items
          </Link>
          {catalogue.categories.map((cat) => (
            <Link
              key={cat.id}
              aria-current={activeCategorySlug === cat.slug ? "true" : undefined}
              href={buildListingHref(listingBasePath, { categorySlug: cat.slug, eventSlug: activeEventSlug, search: activeSearch })}
              className="v3-filter-pill"
            >
              {cat.name}
            </Link>
          ))}
          {hasActiveFilters && (
            <Link href={listingBasePath} className="v3-filter-pill" style={{ borderStyle: 'dashed' }}>
              Clear Filters
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <form action={listingBasePath} method="get" style={{ display: 'flex', gap: '16px', marginBottom: '48px', maxWidth: '400px' }}>
          {activeCategorySlug && <input name="category" type="hidden" value={activeCategorySlug} />}
          {activeEventSlug && <input name="event" type="hidden" value={activeEventSlug} />}
          <div style={{ position: 'relative', flex: 1 }}>
            <svg
              width="18"
              height="18"
              aria-hidden="true"
              viewBox={["0","0","24","24"].join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              defaultValue={activeSearch}
              name="search"
              placeholder="Search catalogue..."
              type="search"
              className="v3-form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button className="v3-btn v3-btn--outline" type="submit">
            Search
          </button>
        </form>

        {/* Grid */}
        {catalogue.products.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'center', margin: '64px 0 96px', padding: '48px', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)' }}>
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>Our Catalogue</h2>
              <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                {emptyMessage ?? "The catalogue features our individual rental furniture and items. Whether you need single statement pieces or functional event basics, explore our collection to build your ideal space."}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link href="/quote" className="v3-btn v3-btn--primary">
                  Request Quote
                </Link>
                <Link href="/listings" className="v3-btn v3-btn--outline">
                  Explore Setups
                </Link>
                {hasActiveFilters && (
                  <Link href={listingBasePath} className="v3-btn v3-btn--ghost">
                    Clear search
                  </Link>
                )}
              </div>
            </div>
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--border)', opacity: 0.1 }}></div>
              <Image 
                src={chairImage} 
                alt="Catalogue selection" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        ) : (
          <div className="v3-catalogue-grid">
            {catalogue.products.map((product, index) => {
              const isFeatured = index === 0; // First item is larger
              return (
                <div key={product.slug} className={`v3-catalogue-card ${isFeatured ? 'v3-catalogue-card--featured' : ''}`}>
                  <div className="v3-catalogue-card__image-wrapper">
                    <CatalogueCardImage fallbackImage={getProductImage(product)} product={product} />
                    {isFeatured && <span className="v3-catalogue-card__badge">Featured</span>}
                  </div>
                  <h3>{product.name}</h3>
                  <p>{textOrUndefined(product.shortDescription) ?? textOrUndefined(product.description) ?? "Premium rental piece."}</p>

                  <div className="v3-catalogue-card__footer">
                    <Link href={`${detailBasePath}/${product.slug}`} className="v3-catalogue-card__link">
                      View details
                      <svg width="16" height="16" viewBox={["0","0","24","24"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                    <AddToQuoteButton
                      listing={product}
                      className="v3-catalogue-card__add v3-catalogue-card__add--icon-only"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function CataloguePage() {
  const catalogue = await getPublicCatalogue();
  return <CataloguePageContent catalogue={catalogue} />;
}
