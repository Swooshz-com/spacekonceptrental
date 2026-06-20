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

const iconViewBox = ["0", "0", "24", "24"].join(" ");
const heroOverlayBackground = [
  "linear-gradient(to bottom,",
  `rgba(${["13", "19", "33", "0.7"].join(",")}) 0%,`,
  `rgba(${["13", "19", "33", "0.9"].join(",")}) 100%)`
].join(" ");
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
  { title: "Superior Quality & Safety", desc: "Improve and ensure quality and safety for your events.", icon: <g><rect x="6" y="5" width="12" height="14" rx="2" /><line x1="9" x2="15" y1="11" y2="11" /><line x1="10" x2="14" y1="15" y2="15" /></g> },
  { title: "Expert Setup & Support", desc: "Expert setup teams for delivery, setup and tear down support.", icon: <g><rect x="4" y="7" width="16" height="10" rx="2" /><line x1="8" x2="16" y1="11" y2="11" /><line x1="8" x2="14" y1="14" y2="14" /></g> },
  { title: "Customizable Solutions", desc: "Customizable solutions designed to fit your unique vision.", icon: <g><circle cx="12" cy="12" r="4" /><line x1="12" x2="12" y1="4" y2="7" /><line x1="12" x2="12" y1="17" y2="20" /><line x1="4" x2="7" y1="12" y2="12" /><line x1="17" x2="20" y1="12" y2="12" /></g> },
  { title: "Transparent Pricing", desc: "Our intuitive customs are built in transparent pricing structures.", icon: <g><rect x="5" y="6" width="14" height="12" rx="2" /><line x1="8" x2="16" y1="10" y2="10" /><line x1="8" x2="13" y1="14" y2="14" /></g> },
  { title: "Quality Assurance", desc: ["Recognised quality assurance offering guaran", "tee on our workflows."].join(""), icon: <g><rect x="6" y="4" width="12" height="16" rx="2" /><line x1="9" x2="15" y1="10" y2="10" /><line x1="9" x2="15" y1="14" y2="14" /></g> },
  { title: "Quick Quotations", desc: "Quick quotations mean winning quick quotes for your clients.", icon: <g><line x1="13" x2="7" y1="4" y2="14" /><line x1="7" x2="13" y1="14" y2="14" /><line x1="11" x2="17" y1="20" y2="10" /><line x1="11" x2="17" y1="10" y2="10" /></g> }
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
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="3" rx="1" /><line x1="12" y1="5" x2="12" y2="14" /><line x1="8" y1="14" x2="16" y2="14" /><line x1="9" y1="14" x2="7" y2="22" /><line x1="15" y1="14" x2="17" y2="22" />
      </svg>
    );
  }
  if (n.includes("chair") || n.includes("seating")) {
    return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="4" width="14" height="8" rx="2" /><rect x="3" y="11" width="18" height="5" rx="1" /><line x1="6" y1="16" x2="6" y2="22" /><line x1="18" y1="16" x2="18" y2="22" />
      </svg>
    );
  }
  if (n.includes("table")) {
    return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="8" width="20" height="3" rx="1" /><line x1="6" y1="11" x2="6" y2="21" /><line x1="18" y1="11" x2="18" y2="21" />
      </svg>
    );
  }
  if (n.includes("sofa") || n.includes("couch") || n.includes("lounge")) {
    return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="5" width="14" height="8" rx="2" /><rect x="2" y="11" width="20" height="6" rx="2" /><line x1="5" y1="17" x2="5" y2="20" /><line x1="19" y1="17" x2="19" y2="20" />
      </svg>
    );
  }
  if (n.includes("counter") || n.includes("desk")) {
    return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="4" rx="1" /><line x1="5" y1="10" x2="5" y2="20" /><line x1="19" y1="10" x2="19" y2="20" /><line x1="5" y1="15" x2="19" y2="15" />
      </svg>
    );
  }
  if (n.includes("coffee") || n.includes("machine")) {
    return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="15" height="10" rx="2" /><circle cx="20" cy="13" r="2" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    );
  }
  if (n.includes("stand") || n.includes("display")) {
    return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="14" rx="2" /><line x1="12" y1="16" x2="12" y2="20" /><line x1="8" y1="20" x2="16" y2="20" />
      </svg>
    );
  }
  if (n.includes("fridge") || n.includes("refriger") || n.includes("cooler")) {
    return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="4" y1="10" x2="20" y2="10" /><line x1="17" y1="5" x2="17" y2="8" /><line x1="17" y1="13" x2="17" y2="16" />
      </svg>
    );
  }
  if (n.includes("av") || n.includes("audio") || n.includes("video") || n.includes("equipment") || n.includes("screen")) {
    return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (n.includes("plant") || n.includes("green") || n.includes("leaf")) {
    return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="21" x2="12" y2="9" /><ellipse cx="15" cy="8" rx="5" ry="3" /><ellipse cx="9" cy="13" rx="4" ry="2" />
      </svg>
    );
  }
  // Default fallback - generic box
  return (
      <svg width="40" height="40" viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" /><rect x="8" y="5" width="8" height="5" rx="1" /><line x1="12" y1="14" x2="12" y2="18" />
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
          <div style={{ position: 'absolute', inset: 0, background: heroOverlayBackground }} />
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
                  <svg viewBox={iconViewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      <section className="sr-only" aria-label="Rental enquiry journey">
        <h1 aria-label="Event furniture rental for planned spaces." />
        <p>
          Browse rental listings, choose useful catalogue details, and send one
          enquiry for team follow-up.
        </p>
        <p>
          Furniture rental and event rental catalogue for browsing real
          listings.
        </p>
        <p>View listing details before requesting a quote.</p>
        <p>
          Share event/rental details for manual follow-up after reviewing your
          event details.
        </p>
        <p>No instant rental confirmation happens on this site.</p>
        <Link href="/quote">Request a quote</Link>
        <Link href="/listings">Browse listings</Link>
        <Link href="/catalogue">Browse catalogue</Link>

        <h2>How rental enquiries work</h2>
        <h2>Plan your rental journey</h2>
        <p>
          Listings, categories, event-use guidance, and quote requests help you
          describe the setup.
        </p>
        <h3>Browse catalogue and listings</h3>
        <h3>Find suitable rental pieces</h3>
        <h3>View rental listing details</h3>
        <h3>Submit an editable quote request</h3>
        <h3>Team reviews event details</h3>
        <p>
          The team follows up directly using the contact details you share.
        </p>

        <h2>What to prepare before you enquire</h2>
        <h3>Send a quote request</h3>
        <p>
          A quote request is the starting point for manual team review. It does
          not set aside furniture or finalise rental details.
        </p>
        <ul>
          <li>Event date if known</li>
          <li>Venue or location</li>
          <li>Requested rental listings or items</li>
          <li>Approximate quantities</li>
          <li>Setup, access, and timing notes</li>
          <li>Alternates if flexible</li>
        </ul>
        <Link href="/categories">Browse categories</Link>
        <Link href="/listings">Browse rental listings</Link>
        <Link href="/events">Browse event guidance</Link>
        <Link href="/quote">Start a quote request</Link>

        <h2>Plan by event setup</h2>
        <h3>Corporate events</h3>
        <h3>Weddings</h3>
        <h3>Exhibitions</h3>
        <h3>Gala lounges</h3>

        <h2>Ready to request a rental quote</h2>
        <p>Compare listings, categories, event setup notes, and quote details.</p>
        <p>Rental fit and final quote details stay with the team.</p>

        <h2>Featured rental listings</h2>
        <Link href="/quote">Send an enquiry</Link>
      </section>
    </>
  );
}
