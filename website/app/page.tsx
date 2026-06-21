import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import heroImage from "../assets/images/hero_homepage.png";
import chairImage from "../assets/images/product_chair.png";
import sofaImage from "../assets/images/product_sofa.png";
import corporateImage from "../assets/images/event_corporate.png";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import type { PublicCatalogueProduct } from "../lib/catalogue/types";
import AddToQuoteButton from "../components/AddToQuoteButton";

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
  { title: "Curated event-ready furniture", desc: "Browse our catalogue for individual pieces tailored to your needs.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> },
  { title: "Prebuilt setups", desc: "Discover cohesive layouts designed for events, exhibitions, and corporate setups.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z M4 9h16 M9 4v16" /> },
  { title: "Manual team follow-up", desc: "The team reviews enquiry details and follows up directly.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /> }
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

function FeaturedListingCard({ listing, index }: { listing: PublicCatalogueProduct, index: number }) {
  const imageAltText = textOrUndefined(listing.primaryImage?.altText) ?? `${listing.name} furniture rental setup`;
  const isLarge = index === 0;

  return (
    <div className={`v3-masonry-item ${isLarge ? 'v3-masonry-item--large' : ''}`}>
      {listing.primaryImage?.publicUrl ? (
        <img alt={imageAltText} src={listing.primaryImage.publicUrl} />
      ) : (
        <Image alt={imageAltText} src={featuredListingImage(listing)} />
      )}
      <div className="v3-masonry-item__content">
        <div>
          <span className="v3-masonry-item__category">{listing.categoryName ?? "Rental listing"}</span>
          <h3>{listing.name}</h3>
        </div>
        <Link href={`/catalogue/${listing.slug}`} className="v3-masonry-item__btn" aria-label={`View ${listing.name}`}>
          <svg width="20" height="20" viewBox={["0","0","24","24"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const catalogue = await getPublicCatalogue();
  const featuredListings = catalogue.products.slice(0, 3); // Take exactly 3 for the masonry grid

  return (
    <>
      <section className="section-padding">
        <div className="container">
          <div className="v3-home-hero">
            <div className="v3-home-hero__content">
              <h1>Setting the scene for unforgettable events.</h1>
              <p>Curated event-ready furniture and flexible rental selection for corporate and private occasions.</p>
              <div className="v3-home-hero__actions">
                <Link href="/catalogue" className="v3-btn v3-btn--primary">
                  Browse Catalogue
                </Link>
                <Link href="/listings" className="v3-btn v3-btn--outline">
                  View Setups
                </Link>
              </div>
            </div>
            <div className="v3-home-hero__image">
              <Image alt="Styled event lounge" priority src={heroImage} style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="v3-advantage section-padding">
        <div className="container">
          <div className="v3-advantage__grid">
            <div className="v3-advantage__header">
              <h2>The SpaceKoncept Advantage</h2>
            </div>
            <div className="v3-advantage__items">
              {advantages.map((adv) => (
                <div key={adv.title} className="v3-advantage__item">
                  <svg viewBox={["0","0","24","24"].join(" ")} fill="none" stroke="currentColor">
                    {adv.icon}
                  </svg>
                  <h3>{adv.title}</h3>
                  <p>{adv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          <div className="v3-how-it-works">
            <h2>Quote-led rental planning</h2>
            <div className="v3-steps">
              <div className="v3-step">
                <div className="v3-step__number">1</div>
                <h3>Browse & Select</h3>
                <p>Explore our catalogue and add desired pieces or curated setups to your Quote List.</p>
              </div>
              <div className="v3-step">
                <div className="v3-step__number">2</div>
                <h3>Submit Enquiry</h3>
                <p>Submit your event details and selected items for the team to review.</p>
              </div>
              <div className="v3-step">
                <div className="v3-step__number">3</div>
                <h3>Manual Follow-up</h3>
                <p>The team reviews your enquiry details and follows up directly to help plan your rental.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--surface-strong)' }}>
        <div className="container">
          <div className="v3-featured-header">
            <h2>Featured Pieces</h2>
            <Link href="/catalogue" className="v3-featured-link">
              View full catalogue
              <svg width="16" height="16" viewBox={["0","0","24","24"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {featuredListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px' }}>
              <p>No public rental listings are available right now.</p>
            </div>
          ) : (
            <div className="v3-masonry">
              {featuredListings.map((listing, index) => (
                <FeaturedListingCard key={listing.id} listing={listing} index={index} />
              ))}
            </div>
          )}
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
