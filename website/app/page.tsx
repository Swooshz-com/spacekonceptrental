import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import heroImage from "../assets/images/hero_homepage.png";
import chairImage from "../assets/images/product_chair.png";
import sofaImage from "../assets/images/product_sofa.png";
import corporateImage from "../assets/images/event_corporate.png";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import { getQuoteHrefForListing } from "../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../lib/catalogue/types";

export const metadata: Metadata = {
  title: "Event furniture rental catalogue | Space Koncept Rentals",
  description:
    "Browse listings for event furniture rental and send a quote request for manual follow-up with Space Koncept Rentals.",
  openGraph: {
    title: "Event furniture rental catalogue | Space Koncept Rentals",
    description:
      "Browse public rental listings, compare event furniture, and send a quote request for manual follow-up.",
    siteName: "Space Koncept Rentals",
    type: "website",
    url: "/"
  }
};

const advantages = [
  { title: "Superior Quality & Safety", desc: "Improve and ensure quality and safety for your events.", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
  { title: "Expert Setup & Support", desc: "Expert setup teams for delivery, setup and tear down support.", icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /> },
  { title: "Customizable Solutions", desc: "Customizable solutions designed to fit your unique vision.", icon: <g><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></g> },
  { title: "Transparent Pricing", desc: "Our intuitive customs are built in transparent pricing structures.", icon: <g><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></g> },
  { title: "Quality Assurance", desc: "Recognised quality assurance offering guarantee on our workflows.", icon: <g><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></g> },
  { title: "Quick Quotations", desc: "Quick quotations mean winning quick quotes for your clients.", icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /> }
];

function textOrUndefined(value: string | undefined) {
  return value?.trim() || undefined;
}

function featuredListingImage(listing: PublicCatalogueProduct): StaticImageData {
  const slug = listing.slug.toLowerCase();
  const categoryName = listing.categoryName?.toLowerCase() ?? "";

  if (slug.includes("chair") || categoryName.includes("seating")) return chairImage;
  if (slug.includes("table") || slug.includes("corporate") || slug.includes("garden") || categoryName.includes("event")) return corporateImage;
  return sofaImage;
}

function featuredListingSummary(listing: PublicCatalogueProduct) {
  return (
    textOrUndefined(listing.shortDescription) ??
    textOrUndefined(listing.description) ??
    "Share this listing in a quote request so the team can review the event fit."
  );
}

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();

  if (n.includes("bar stool") || n.includes("stool")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="3" rx="1" /><line x1="12" y1="5" x2="12" y2="14" /><line x1="8" y1="14" x2="16" y2="14" /><line x1="9" y1="14" x2="7" y2="22" /><line x1="15" y1="14" x2="17" y2="22" />
      </svg>
    );
  }
  if (n.includes("chair") || n.includes("seating")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 11V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" /><rect x="3" y="11" width="18" height="5" rx="1" /><line x1="6" y1="16" x2="6" y2="22" /><line x1="18" y1="16" x2="18" y2="22" />
      </svg>
    );
  }
  if (n.includes("table")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="8" width="20" height="3" rx="1" /><line x1="6" y1="11" x2="6" y2="21" /><line x1="18" y1="11" x2="18" y2="21" />
      </svg>
    );
  }
  if (n.includes("sofa") || n.includes("couch") || n.includes("lounge")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M2 11v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" /><line x1="5" y1="17" x2="5" y2="20" /><line x1="19" y1="17" x2="19" y2="20" />
      </svg>
    );
  }
  if (n.includes("counter") || n.includes("desk")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="4" rx="1" /><line x1="5" y1="10" x2="5" y2="20" /><line x1="19" y1="10" x2="19" y2="20" /><line x1="5" y1="15" x2="19" y2="15" />
      </svg>
    );
  }
  if (n.includes("coffee") || n.includes("machine")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    );
  }
  if (n.includes("stand") || n.includes("display")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="14" rx="2" /><line x1="12" y1="16" x2="12" y2="20" /><line x1="8" y1="20" x2="16" y2="20" />
      </svg>
    );
  }
  if (n.includes("fridge") || n.includes("refriger") || n.includes("cooler")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="4" y1="10" x2="20" y2="10" /><line x1="17" y1="5" x2="17" y2="8" /><line x1="17" y1="13" x2="17" y2="16" />
      </svg>
    );
  }
  if (n.includes("av") || n.includes("audio") || n.includes("video") || n.includes("equipment") || n.includes("screen")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (n.includes("plant") || n.includes("green") || n.includes("leaf")) {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 21c0 0 0-8 6-12" /><path d="M6 21c0 0 6-2 10-10C16 11 20 3 20 3s-8 0-12 4c-4 4-2 14-2 14z" />
      </svg>
    );
  }
  // Default fallback — generic box
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z" /><path d="M8 10V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" /><line x1="12" y1="14" x2="12" y2="18" />
    </svg>
  );
}

function FeaturedListingCard({ listing }: { listing: PublicCatalogueProduct }) {
  const imageAltText = textOrUndefined(listing.primaryImage?.altText) ?? `${listing.name} furniture rental setup`;

  return (
    <article className="premium-card">
      <div className="premium-card__image">
        {listing.primaryImage?.publicUrl ? (
          <img alt={imageAltText} src={listing.primaryImage.publicUrl} />
        ) : (
          <Image alt={imageAltText} src={featuredListingImage(listing)} />
        )}
      </div>
      <div className="premium-card__content">
        <div className="premium-card__meta" style={{ color: 'var(--accent)', background: 'var(--surface)', display: 'inline-block', padding: '4px 12px', borderRadius: '50px', fontSize: '12px', border: '1px solid var(--border)', marginBottom: '12px' }}>
          {listing.categoryName ?? "Rental listing"}
        </div>
        <h2 className="premium-title-card">{listing.name}</h2>
        <p className="premium-card__desc">{featuredListingSummary(listing)}</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', alignItems: 'center' }}>
          <Link className="premium-button premium-button--secondary" style={{ flex: 1, padding: '0 16px', fontSize: '14px', height: '40px' }} href={`/listings/${listing.slug}`}>
            Details
          </Link>
          <Link href={getQuoteHrefForListing(listing.slug)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Add to Quote &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const catalogue = await getPublicCatalogue();
  const featuredListings = catalogue.products.slice(0, 3);
  const categories = catalogue.categories.slice(0, 6);

  return (
    <>
      <section className="premium-hero-dark" style={{ position: 'relative', overflow: 'hidden', minHeight: '600px' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Image alt="Styled event lounge" priority src={heroImage} fill style={{ objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,19,33,0.7) 0%, rgba(13,19,33,0.9) 100%)' }} />
        </div>
        <div className="premium-container" style={{ position: 'relative', zIndex: 1, padding: '120px 24px', textAlign: 'center' }}>
          <h1 className="premium-title-massive">
            Furnish Your <span>Vision.</span><br />Elevate Every Space.
          </h1>
          <p className="premium-hero-subtitle">
            Singapore event furniture rental company with attractive modern furniture and dedicated event support.
          </p>
          <div className="premium-hero-actions">
            <Link className="premium-button premium-button--primary" href="/catalogue">
              Browse Catalogue
            </Link>
            <Link className="premium-button premium-button--secondary" style={{ color: '#0f172a', backgroundColor: '#fff', borderColor: '#fff' }} href="/quote">
              Get A Free Quote
            </Link>
          </div>
          <div style={{ marginTop: '64px', fontSize: '14px', fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.5px' }}>
            500+ Events Furnished &nbsp;|&nbsp; Trusted Since 2015 &nbsp;|&nbsp; Same-Day Response
          </div>
        </div>
      </section>

      <section className="premium-section" style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div className="premium-container">
          <h2 className="premium-title-section" style={{ textAlign: 'center', marginBottom: '40px' }}>Browse By Category</h2>
          <div className="premium-category-icon-container">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/listings?category=${encodeURIComponent(cat.slug)}`} className="premium-category-icon">
                <div className="premium-category-icon-circle">
                  {getCategoryIcon(cat.name)}
                </div>
                <span className="premium-category-icon-label">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section" style={{ padding: '80px 0' }}>
        <div className="premium-container">
          <h2 className="premium-title-section" style={{ textAlign: 'center', marginBottom: '64px' }}>The SpaceKoncept Advantage</h2>
          <div className="premium-advantage-grid">
            {advantages.map((adv) => (
              <div key={adv.title} className="premium-advantage-card">
                <div className="premium-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {adv.icon}
                  </svg>
                </div>
                <h3>{adv.title}</h3>
                <p>{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section" style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div className="premium-container">
          <h2 className="premium-title-section" style={{ textAlign: 'center', marginBottom: '40px' }}>Featured Rentals</h2>
          
          {featuredListings.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p>No public rental listings are available right now.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              {featuredListings.map((listing) => (
                <FeaturedListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
            <Link className="premium-button premium-button--secondary" href="/catalogue">
              View All Products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
