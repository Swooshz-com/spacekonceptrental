import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { StaticImageData } from "next/image";

import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { normalizePublicDiscoveryContext, normalizePublicListingSlug } from "../../lib/catalogue/quote-handoff";
import { eventUseFilters } from "../catalogue/page";
import type { PublicCatalogue, PublicCatalogueProduct } from "../../lib/catalogue/types";
import AddToQuoteButton from "../../components/AddToQuoteButton";

import chairImage from "../../assets/images/product_chair.png";
import sofaImage from "../../assets/images/product_sofa.png";
import corporateImage from "../../assets/images/event_corporate.png";

type ListingsPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rental listings | Space Koncept Rentals",
  description:
    "Browse public furniture and event rental listings, then send a quote enquiry to Space Koncept Rentals."
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveDiscoveryFilters(
  searchParams: ListingsPageProps["searchParams"]
) {
  if (!searchParams) {
    return {
      categorySlug: undefined,
      eventSlug: undefined,
      search: undefined
    };
  }

  const resolvedSearchParams = await searchParams;

  return {
    categorySlug: normalizePublicListingSlug(
      firstSearchParam(resolvedSearchParams.category)
    ),
    eventSlug: normalizePublicListingSlug(
      firstSearchParam(resolvedSearchParams.event)
    ),
    search: normalizePublicDiscoveryContext(
      firstSearchParam(resolvedSearchParams.search)
    )
  };
}

function listingSearchText(product: PublicCatalogue["products"][number]) {
  return [
    product.name,
    product.slug,
    product.shortDescription,
    product.description,
    product.categoryName,
    product.rentalUnit
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterCatalogueByDiscovery(
  catalogue: PublicCatalogue,
  filters: { categorySlug?: string; eventSlug?: string; search?: string }
): PublicCatalogue {
  const category = filters.categorySlug
    ? catalogue.categories.find((item) => item.slug === filters.categorySlug)
    : undefined;
  const eventUse = filters.eventSlug
    ? eventUseFilters.find((item) => item.slug === filters.eventSlug)
    : undefined;

  if ((filters.categorySlug && !category) || (filters.eventSlug && !eventUse)) {
    return {
      ...catalogue,
      products: []
    };
  }

  const searchTerms = filters.search?.split(/\s+/).filter(Boolean) ?? [];

  return {
    ...catalogue,
    products: catalogue.products.filter((product) => {
      const text = listingSearchText(product);
      const matchesCategory = category ? product.categoryId === category.id : true;
      const matchesEvent = eventUse
        ? eventUse.terms.some((term) => text.includes(term))
        : true;
      const matchesSearch = searchTerms.every((term) => text.includes(term));

      return matchesCategory && matchesEvent && matchesSearch;
    })
  };
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

function publicImageAltText(
  image: PublicCatalogueProduct["primaryImage"],
  product: PublicCatalogueProduct
) {
  return (
    textOrUndefined(image?.altText) ??
    `${product.name} furniture rental setup`
  );
}

function SetupCardImage({
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

export default async function ListingsPage({
  searchParams
}: ListingsPageProps = {}) {
  const [catalogue, filters] = await Promise.all([
    getPublicCatalogue(),
    resolveDiscoveryFilters(searchParams)
  ]);

  const filteredCatalogue = filterCatalogueByDiscovery(catalogue, filters);

  return (
    <div className="section-padding">
      <div className="container">
        <div className="v3-page-header" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 64px' }}>
          <h1>Curated Setups</h1>
          <p>Discover our expertly styled event setups. Add complete looks to your Quote List to recreate these scenes at your next event.</p>
        </div>

        {filteredCatalogue.products.length === 0 ? (
          <div className="v3-empty-state" style={{ maxWidth: '600px', margin: '64px auto', textAlign: 'center', padding: '48px 24px', backgroundColor: 'var(--surface-alt)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>Prebuilt Setups</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              Setups are prebuilt event stacks curated for weddings, launches, exhibitions, lounges, and corporate events. Explore these cohesive looks to simplify your rental planning.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/quote" className="v3-btn v3-btn--primary">
                Request Quote
              </Link>
              <Link href="/catalogue" className="v3-btn v3-btn--outline">
                Browse Catalogue
              </Link>
              <Link href="/listings" className="v3-btn v3-btn--ghost">
                View all setups
              </Link>
            </div>
          </div>
        ) : (
          <div className="v3-setups-grid">
            {filteredCatalogue.products.map((product) => (
              <div key={product.slug} className="v3-setup-block">
                <div className="v3-setup-block__image">
                  <SetupCardImage fallbackImage={getProductImage(product)} product={product} />
                </div>
                <div className="v3-setup-block__content">
                  <div className="v3-setup-block__category">
                    <svg width="16" height="16" viewBox={["0","0","24","24"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>
                    {product.categoryName ?? "Setup"}
                  </div>
                  <h2>{product.name}</h2>
                  <p>{textOrUndefined(product.description) ?? textOrUndefined(product.shortDescription) ?? "A premium curated setup designed to elevate your event space with cohesive style and comfort."}</p>

                  <div className="v3-setup-block__actions">
                    <Link href={`/listings/${product.slug}`} className="v3-btn v3-btn--outline">
                      View details
                    </Link>
                    <AddToQuoteButton
                      listing={product}
                      className="v3-btn v3-btn--primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
