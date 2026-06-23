import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";

import heroImage from "../assets/images/hero_homepage.png";
import chairImage from "../assets/images/product_chair.png";
import corporateImage from "../assets/images/event_corporate.png";
import sofaImage from "../assets/images/product_sofa.png";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import { getQuoteHrefForListing } from "../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../lib/catalogue/types";

export const metadata: Metadata = {
  title: "Event furniture rental catalogue | Space Koncept Rental",
  description:
    "Browse listings for event furniture rental and send a quote request for manual follow-up with Space Koncept Rental.",
  openGraph: {
    title: "Event furniture rental catalogue | Space Koncept Rental",
    description:
      "Browse public rental listings, compare event furniture, and send a quote request for manual follow-up.",
    siteName: "Space Koncept Rental",
    type: "website",
    url: "/"
  }
};

const processNotes = [
  {
    title: "Browse real rental listings",
    desc: "Use the catalogue and setup views to compare public listing details before sending an enquiry."
  },
  {
    title: "Shape a clear brief",
    desc: "Add event date, venue context, quantities, alternates, access notes, and timing details when known."
  },
  {
    title: "Keep requests editable",
    desc: "Quote context starts as notes, so you can adjust pieces and setup details before submission."
  },
  {
    title: "Team review follows",
    desc: "Submission starts manual team follow-up using the contact details and rental context you share."
  }
] as const;

function textOrUndefined(value: string | undefined) {
  return value?.trim() || undefined;
}

function featuredListingImage(listing: PublicCatalogueProduct): StaticImageData {
  const slug = listing.slug.toLowerCase();
  const categoryName = listing.categoryName?.toLowerCase() ?? "";

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

function featuredListingSummary(listing: PublicCatalogueProduct) {
  return (
    textOrUndefined(listing.shortDescription) ??
    textOrUndefined(listing.description) ??
    "Share this listing in a quote request so the team can review the event fit."
  );
}

function FeaturedListingCard({ listing }: { listing: PublicCatalogueProduct }) {
  const imageAltText =
    textOrUndefined(listing.primaryImage?.altText) ??
    `${listing.name} furniture rental setup`;

  return (
    <article className="premium-card premium-listing-card">
      <div className="premium-card__image">
        {listing.primaryImage?.publicUrl ? (
          <img alt={imageAltText} src={listing.primaryImage.publicUrl} />
        ) : (
          <Image alt={imageAltText} src={featuredListingImage(listing)} />
        )}
      </div>
      <div className="premium-card__content">
        <div className="premium-card__meta">
          {listing.categoryName ?? "Rental listing"}
        </div>
        <h2 className="premium-title-card">{listing.name}</h2>
        <p className="premium-card__desc">{featuredListingSummary(listing)}</p>
        <div className="premium-card__actions">
          <Link
            aria-label={`View details for ${listing.name}`}
            className="premium-button premium-button--secondary card-link--primary"
            href={`/listings/${listing.slug}`}
          >
            View Details
          </Link>
          <Link
            aria-label={`Add to Quote for ${listing.name}`}
            className="premium-button premium-button--primary"
            href={getQuoteHrefForListing(listing.slug)}
          >
            Add to Quote
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
      <section className="premium-home-hero">
        <div className="premium-home-hero__media" aria-hidden="true">
          <Image alt="Styled event lounge" priority src={heroImage} fill sizes="100vw" />
        </div>
        <div className="premium-container premium-home-hero__content">
          <h1 className="premium-title-massive">Event furniture rental for planned spaces</h1>
          <p className="premium-hero-subtitle">
            Browse Space Koncept Rental listings, collect useful setup context, and submit a focused enquiry for manual team follow-up.
          </p>
          <div className="premium-hero-actions">
            <Link className="premium-button premium-button--primary" href="/quote">
              Request Quote
            </Link>
            <Link className="premium-button premium-button--secondary" href="/catalogue">
              Browse Catalogue
            </Link>
            <Link className="premium-button premium-button--secondary" href="/listings">
              Explore Setups
            </Link>
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="premium-section premium-section--alternate">
          <div className="premium-container">
            <div className="premium-section-heading">
              <h2 className="premium-title-section">Browse by rental category</h2>
              <p>Use real catalogue categories as starting points for your event brief.</p>
            </div>
            <div className="premium-home-category-grid">
              {categories.map((category) => (
                <Link
                  className="premium-home-category"
                  href={`/listings?category=${encodeURIComponent(category.slug)}`}
                  key={category.id}
                >
                  <span>{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="premium-section">
        <div className="premium-container">
          <div className="premium-section-heading">
            <h2 className="premium-title-section">How rental enquiries work</h2>
            <p>
              The public site helps visitors prepare a practical rental request; the team reviews the details after submission.
            </p>
          </div>
          <div className="premium-advantage-grid">
            {processNotes.map((note) => (
              <article className="premium-advantage-card" key={note.title}>
                <h3>{note.title}</h3>
                <p>{note.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section premium-section--alternate">
        <div className="premium-container">
          <div className="premium-section-heading">
            <h2 className="premium-title-section">Featured rental listings</h2>
            <p>Start from current public listings when they are available.</p>
          </div>

          {featuredListings.length === 0 ? (
            <div className="premium-empty-state">
              <h2 className="premium-title-card">Start with a rental brief</h2>
              <p>
                No public rental listings are available right now. You can still share the event style, venue context, and rental pieces you have in mind.
              </p>
              <Link className="premium-button premium-button--primary" href="/quote">
                Request Quote
              </Link>
            </div>
          ) : (
            <div className="premium-grid">
              {featuredListings.map((listing) => (
                <FeaturedListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="premium-centered-action">
            <Link className="premium-button premium-button--secondary" href="/catalogue">
              Browse Catalogue
            </Link>
          </div>
        </div>
      </section>

      <section className="sr-only" aria-label="Rental enquiry journey">
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
        <Link href="/quote">Request Quote</Link>
        <Link href="/listings">Browse listings</Link>
        <Link href="/catalogue">Browse catalogue</Link>

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
        <Link href="/catalogue">Browse Catalogue</Link>
        <Link href="/listings">Browse rental listings</Link>
        <Link href="/listings">Explore Setups</Link>
        <Link href="/quote">Request Quote</Link>

        <h2>Plan by event setup</h2>
        <h3>Corporate events</h3>
        <h3>Weddings</h3>
        <h3>Exhibitions</h3>
        <h3>Gala lounges</h3>

        <h2>Ready to request a rental quote</h2>
        <p>Compare listings, categories, event setup notes, and quote details.</p>
        <p>Rental fit and final quote details stay with the team.</p>

        <h2>Featured rentals guidance</h2>
        <Link href="/quote">Submit Enquiry</Link>
      </section>
    </>
  );
}