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
        {hasSelectedListingReference ? "Listing unavailable" : "General rental enquiry"}
      </h3>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
        {requestedSlug ? 
          "The listing link may be old or unavailable. Review current rental listings or keep typing the requested items." : 
          "Share the requested listings or items, quantities, alternates, and event setup you have in mind so the team can follow up."}
      </p>

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link href="/listings" className="premium-button premium-button--secondary" style={{ width: '100%', fontSize: '14px' }}>
          Current listings
        </Link>
        <Link href="/catalogue" className="premium-button premium-button--secondary" style={{ width: '100%', fontSize: '14px' }}>
          Catalogue
        </Link>
      </div>
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
          <h1 className="premium-title-hero">Request a quote</h1>
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
              <h2 className="premium-title-section" style={{ fontSize: '24px', marginBottom: '16px' }}>Get In Touch</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
                Complete the required contact point first, then add the practical event details that help our team triage the rental enquiry.
              </p>
              
              <QuoteRequestForm
                initialItemsText={initialItemsText}
                initialListingSlug={listingContext.requestedSlug}
              />
            </div>

            {/* Context & Info Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="premium-contact-card">
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Contact Info</div>
                <h3 className="premium-title-card" style={{ marginBottom: '24px' }}>SpaceKonceptRental</h3>
                
                <div className="premium-contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <div>
                    <strong>Office</strong>
                    <span>615 MacPherson Road, #02-01<br/>Singapore 368243</span>
                  </div>
                </div>

                <div className="premium-contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <div>
                    <strong>Phone</strong>
                    <span>+65 6123 4567</span>
                  </div>
                </div>

                <div className="premium-contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <div>
                    <strong>Email</strong>
                    <span>hello@spacekonceptrental.com</span>
                  </div>
                </div>

                <div className="premium-contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  <div>
                    <strong>WhatsApp</strong>
                    <span>+65 9123 4567</span>
                  </div>
                </div>

                <div className="premium-contact-item" style={{ borderBottom: 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <div>
                    <strong>Operating Hours</strong>
                    <span>Mon-Sat 9:30AM - 7:30PM</span>
                  </div>
                </div>
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
                <h3 className="premium-title-card">What happens next</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6 }}>
                  <li style={{ marginBottom: '8px' }}>This does not set aside furniture instantly.</li>
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
