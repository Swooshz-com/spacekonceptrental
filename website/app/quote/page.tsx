import Link from "next/link";
import type { Metadata } from "next";

import QuoteRequestForm from "../../components/QuoteRequestForm";
import QuoteListDisplay from "../../components/QuoteListDisplay";
import { getPublicProductBySlug } from "../../lib/catalogue/catalogue-repository";
import { normalizePublicDiscoveryContext, normalizePublicListingSlug } from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../../lib/catalogue/types";

type QuotePageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export const metadata: Metadata = {
  title: "Quote request for furniture rental enquiries | Space Koncept Rentals",
  description:
    "Submit an event furniture rental quote request with event date, venue, requested listings, quantities, and setup notes for manual follow-up.",
  openGraph: {
    title: "Quote request | Space Koncept Rentals",
    description:
      "Share event furniture rental details and requested listings for manual follow-up.",
    siteName: "Space Koncept Rentals",
    type: "website",
    url: "/quote"
  }
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveQuoteListingContext(
  searchParams: QuotePageProps["searchParams"]
) {
  if (!searchParams) {
    return {
      product: null,
      requestedSlug: undefined,
      category: undefined,
      event: undefined,
      search: undefined
    };
  }

  const resolvedSearchParams = await searchParams;
  const slug = normalizePublicListingSlug(
    firstSearchParam(resolvedSearchParams.listing)
  );

  return {
    product: slug ? await getPublicProductBySlug(slug) : null,
    requestedSlug: slug,
    category: normalizePublicListingSlug(firstSearchParam(resolvedSearchParams.category)),
    event: normalizePublicListingSlug(firstSearchParam(resolvedSearchParams.event)),
    search: normalizePublicDiscoveryContext(firstSearchParam(resolvedSearchParams.search))
  };
}

function buildInitialItemsText({
  category,
  event,
  product,
  requestedSlug,
  search
}: {
  category?: string;
  event?: string;
  product: PublicCatalogueProduct | null;
  requestedSlug?: string;
  search?: string;
}) {
  const context = [
    product?.name ??
      (requestedSlug ? `Listing reference: ${requestedSlug}` : undefined),
    category ? `Category interest: ${category}` : undefined,
    event ? `Event-use interest: ${event}` : undefined,
    search ? `Search interest: ${search}` : undefined
  ].filter(Boolean);

  return context.join("\n");
}

function QuoteSelectedListingBanner({
  product
}: {
  product: PublicCatalogueProduct;
}) {
  return (
    <div style={{ background: 'var(--surface-strong)', borderRadius: 'var(--radius-lg)', padding: '32px', marginBottom: '40px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Selected Listing</div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{product.name}</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
        This listing starts your quote request. You can adjust quantities, add alternates, or modify your request in the form below before sending.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '4px' }}>Reference</div>
          <div style={{ fontWeight: 500 }}>{product.slug}</div>
        </div>
        {product.categoryName && (
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '4px' }}>Category</div>
            <div style={{ fontWeight: 500 }}>{product.categoryName}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '4px' }}>Rental unit</div>
          <div style={{ fontWeight: 500 }}>{product.rentalUnit}</div>
        </div>
      </div>
      <Link href={`/catalogue/${product.slug}`} className="v3-btn v3-btn--outline" style={{ display: 'inline-flex' }}>
        Review details
      </Link>
    </div>
  );
}

function QuoteListingContext({
  product
}: {
  product: PublicCatalogueProduct;
}) {
  return (
    <div className="v3-quote-sidebar-card">
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Enquiry Context</div>
      <h3>{product.name}</h3>
      <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
        Your request includes this listing. Please provide event details below to help us confirm availability.
      </p>
      <Link href={`/catalogue/${product.slug}`} className="v3-btn v3-btn--outline" style={{ width: '100%' }}>
        Review listing
      </Link>
    </div>
  );
}

function QuoteGeneralContext({
  category,
  event,
  requestedSlug,
  search
}: {
  category?: string;
  event?: string;
  requestedSlug?: string;
  search?: string;
}) {
  const hasContext = requestedSlug || category || event || search;

  return (
    <div className="v3-quote-sidebar-card">
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        Enquiry Context
      </div>
      <h3>General rental enquiry</h3>
      <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
        Share the items, quantities, and event setup you have in mind so our team can provide an accurate proposal.
      </p>

      {hasContext && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', fontSize: '0.875rem' }}>
          {requestedSlug && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Reference</span>
              <span style={{ fontWeight: 500 }}>{requestedSlug}</span>
            </div>
          )}
          {category && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Category</span>
              <span style={{ fontWeight: 500 }}>{category}</span>
            </div>
          )}
          {event && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Event-use</span>
              <span style={{ fontWeight: 500 }}>{event}</span>
            </div>
          )}
          {search && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Search</span>
              <span style={{ fontWeight: 500 }}>{search}</span>
            </div>
          )}
        </div>
      )}

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link href="/catalogue" className="v3-btn v3-btn--outline" style={{ width: '100%' }}>
          Browse catalogue
        </Link>
        <Link href="/listings" className="v3-btn v3-btn--outline" style={{ width: '100%' }}>
          View curated setups
        </Link>
      </nav>
    </div>
  );
}

export default async function QuotePage({
  searchParams
}: QuotePageProps = {}) {
  const listingContext = await resolveQuoteListingContext(searchParams);
  const selectedListing = listingContext.product;
  const initialItemsText = buildInitialItemsText({
    category: listingContext.category,
    event: listingContext.event,
    product: selectedListing,
    requestedSlug: listingContext.requestedSlug,
    search: listingContext.search
  });

  return (
    <div className="section-padding">
      <div className="container">
        <div className="v3-page-header">
          <h1>Request a quote</h1>
          <p>
            Share your event details and requested items below. Our team will review your enquiry and provide a comprehensive proposal.
          </p>
        </div>

        {selectedListing && <QuoteSelectedListingBanner product={selectedListing} />}

        <div className="v3-quote-layout">
          {/* Left Column: Your Selection */}
          <div className="v3-quote-selection" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <QuoteListDisplay />
            {selectedListing && <QuoteListingContext product={selectedListing} />}
            {!selectedListing && (
              <QuoteGeneralContext
                category={listingContext.category}
                event={listingContext.event}
                requestedSlug={listingContext.requestedSlug}
                search={listingContext.search}
              />
            )}
          </div>

          {/* Right Column: Main Form */}
          <div className="v3-quote-form" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '32px', fontFamily: 'var(--font-serif)' }}>Event Details</h2>
              <QuoteRequestForm
                initialItemsText={initialItemsText}
                initialListingSlug={listingContext.requestedSlug}
              />
            </div>

            <div className="v3-quote-sidebar-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>What to Expect</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                <li style={{ marginBottom: '8px' }}>Your request will be manually reviewed by our team.</li>
                <li style={{ marginBottom: '8px' }}>This submission does not finalise a rental or hold items.</li>
                <li>We will follow up directly using the contact details provided.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
