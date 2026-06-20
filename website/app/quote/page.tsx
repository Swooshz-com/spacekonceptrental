import Link from "next/link";
import type { Metadata } from "next";

import QuoteRequestForm from "../../components/QuoteRequestForm";
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
    <div style={{ background: 'var(--surface-strong)', color: '#fff', borderRadius: 'var(--radius-lg)', padding: '24px 32px', marginBottom: '32px' }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Selected listing</div>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '16px', letterSpacing: '-0.5px' }}>{product.name}</h2>
      <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: '24px' }}>
        This listing starts the editable requested listings text. Adjust quantities, alternates, event date or rental period notes, and venue details in the form before sending the enquiry.
      </p>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Reference</div>
          <div style={{ fontWeight: 600 }}>{product.slug}</div>
        </div>
        {product.categoryName && (
          <div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Category</div>
            <div style={{ fontWeight: 600 }}>{product.categoryName}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Rental unit</div>
          <div style={{ fontWeight: 600 }}>{product.rentalUnit}</div>
        </div>
      </div>
      <Link href={`/listings/${product.slug}`} style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
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
    <div className="premium-card" style={{ padding: '32px' }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Selected Listing</div>
      <h3 className="premium-title-card">Enquiry for {product.name}</h3>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
        The selected listing starts the request, but you can edit quantities, alternates, and event notes before sending.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '14px' }}>Requested item</span>
          <span style={{ fontWeight: 600, color: 'var(--surface-strong)', fontSize: '14px' }}>{product.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '14px' }}>Rental unit</span>
          <span style={{ fontWeight: 600, color: 'var(--surface-strong)', fontSize: '14px' }}>{product.rentalUnit}</span>
        </div>
      </div>
      <Link href={`/listings/${product.slug}`} className="premium-button premium-button--secondary" style={{ width: '100%', fontSize: '14px' }}>
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
  const hasSelectedListingReference = Boolean(requestedSlug);

  return (
    <div className="premium-card" style={{ padding: '32px' }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
        {hasSelectedListingReference ? "Selected listing reference" : "Listing context"}
      </div>
      <h3 className="premium-title-card">
        {hasSelectedListingReference ? "Selected listing unavailable" : "General rental enquiry"}
      </h3>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
        {requestedSlug ?
          "The listing link may be old or unavailable. Listing context is a starting point only. Review current rental listings or keep typing the requested items." :
          "Discovery context is editable request intake only. Listing context is a starting point only. Share the requested listings or items, quantities, alternates, and event setup you have in mind so the team can follow up."}
      </p>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
        Adjust the requested listings or items before sending. This context
        stays as request notes until the team reviews the rental fit.
      </p>
      {requestedSlug && (
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
          Listing reference: {requestedSlug} starts this rental request.
        </p>
      )}
      {requestedSlug && (
        <dl style={{ margin: '0 0 24px', color: 'var(--muted)', fontSize: '14px' }}>
          <dt style={{ fontWeight: 700 }}>Listing reference</dt>
          <dd style={{ margin: 0 }}>{requestedSlug}</dd>
        </dl>
      )}

      {(requestedSlug || category || event || search) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {requestedSlug && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '14px' }}>Reference</span>
              <span style={{ fontWeight: 600, color: 'var(--surface-strong)', fontSize: '14px' }}>{requestedSlug}</span>
            </div>
          )}
          {category && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '14px' }}>Category</span>
              <span style={{ fontWeight: 600, color: 'var(--surface-strong)', fontSize: '14px' }}>{category}</span>
            </div>
          )}
          {event && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '14px' }}>Event-use</span>
              <span style={{ fontWeight: 600, color: 'var(--surface-strong)', fontSize: '14px' }}>{event}</span>
            </div>
          )}
          {search && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '14px' }}>Search</span>
              <span style={{ fontWeight: 600, color: 'var(--surface-strong)', fontSize: '14px' }}>{search}</span>
            </div>
          )}
        </div>
      )}

      <nav
        aria-label="Quote request recovery"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
          Use the catalogue, listing details, and event setup guidance as
          starting points, then keep the requested items editable in the form.
        </p>
        <Link href="/listings" className="premium-button premium-button--secondary" style={{ width: '100%', fontSize: '14px' }}>
          Review current rental listings
        </Link>
        <Link href="/listings" className="premium-button premium-button--secondary" style={{ width: '100%', fontSize: '14px' }}>
          Browse listings
        </Link>
        <Link href="/events" className="premium-button premium-button--secondary" style={{ width: '100%', fontSize: '14px' }}>
          Plan event setups
        </Link>
        <Link href="/catalogue" className="premium-button premium-button--secondary" style={{ width: '100%', fontSize: '14px' }}>
          Start from the catalogue
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
    <>
      <section className="premium-page-header">
        <div className="premium-container">
          <h1 className="premium-title-hero">Request a rental quote</h1>
          <p className="premium-subtitle" style={{ color: '#cbd5e1' }}>
            Share contact details, event date, venue, requested listings, quantities, and setup notes. The form is enquiry intake only.
          </p>
        </div>
      </section>

      <section className="premium-section" style={{ paddingTop: '40px' }}>
        <div className="premium-container">
          {selectedListing && <QuoteSelectedListingBanner product={selectedListing} />}

          <div className="premium-quote-layout">
            {/* Form Column */}
            <div className="premium-form-card">
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Event Basics</div>
              <h2 className="premium-title-section" style={{ fontSize: '24px', marginBottom: '16px' }}>Check your enquiry details</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
                Complete the required contact point first, then add the practical event details that help our team triage the rental enquiry.
              </p>
              <p className="sr-only">
                Event date, venue or location, requested listings or items,
                quantities, alternates, setup, access, and timing notes help
                the team review the request.
              </p>

              <QuoteRequestForm
                initialItemsText={initialItemsText}
                initialListingSlug={listingContext.requestedSlug}
              />
            </div>

            {/* Context & Info Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="premium-contact-card">
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Enquiry support</div>
                <h3 className="premium-title-card" style={{ marginBottom: '24px' }}>Share practical event details</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                  Add contact details in the form so the team can follow up
                  directly. Include listing names, quantities, venue notes,
                  access notes, alternates, and timing context.
                </p>
              </div>
              {selectedListing ? (
                <QuoteListingContext product={selectedListing} />
              ) : (
                <QuoteGeneralContext
                  category={listingContext.category}
                  event={listingContext.event}
                  requestedSlug={listingContext.requestedSlug}
                  search={listingContext.search}
                />
              )}

              <div className="premium-card" style={{ padding: '32px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Before you send</div>
                <h3 className="premium-title-card">Checklist</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6 }}>
                  <li style={{ marginBottom: '8px' }}>Use listing names or short descriptions.</li>
                  <li style={{ marginBottom: '8px' }}>Add alternates if you are flexible.</li>
                  <li>Keep access, timing, and placement notes practical.</li>
                </ul>
              </div>

              <div className="premium-card" style={{ padding: '32px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Expectations</div>
                <h3 className="premium-title-card">What happens after you enquire</h3>
                <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 16px' }}>
                  Submission starts an enquiry for manual review; it is a receipt only.
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6 }}>
                  <li style={{ marginBottom: '8px' }}>This does not set aside furniture or finish rental details.</li>
                  <li style={{ marginBottom: '8px' }}>
                    {initialItemsText
                      ? "This is not final rental approval."
                      : "This is not a rental fit confirmation."}
                  </li>
                  <li style={{ marginBottom: '8px' }}>The team reviews fit against your details.</li>
                  <li>Follow-up happens directly using your contact details.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
