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

const enquirySteps = [
  {
    title: "Browse rental items",
    body:
      "Start with published catalogue listings, category context, and useful item details."
  },
  {
    title: "Share event details",
    body:
      "Send the date, venue, requested listings, quantities, and setup notes through the quote route."
  },
  {
    title: "Team review follows",
    body:
      "The enquiry stays manual so the team can check event fit before follow-up."
  }
];

const planningNotes = [
  "Event date, venue, and setup timing",
  "Listings or item types that suit the setting",
  "Quantities, alternates, and access notes"
];

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
    "Open the listing detail page and share it with the team during quote follow-up."
  );
}

function FeaturedListingCard({ listing }: { listing: PublicCatalogueProduct }) {
  const imageAltText =
    textOrUndefined(listing.primaryImage?.altText) ??
    `${listing.name} furniture rental setup`;

  return (
    <article className="studio-listing-card studio-listing-card--featured">
      <div className="studio-listing-card__media">
        {listing.primaryImage?.publicUrl ? (
          <img alt={imageAltText} src={listing.primaryImage.publicUrl} />
        ) : (
          <Image alt={imageAltText} src={featuredListingImage(listing)} />
        )}
      </div>
      <div className="studio-listing-card__content">
        <div className="studio-listing-card__meta">
          {listing.categoryName ?? "Rental listing"}
        </div>
        <h2 className="premium-title-card studio-listing-card__title">{listing.name}</h2>
        <p className="studio-listing-card__desc">{featuredListingSummary(listing)}</p>
        <Link
          aria-label={`View details for ${listing.name}`}
          className="premium-button premium-button--secondary card-link--primary"
          href={`/listings/${listing.slug}`}
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

function EmptyFeaturedListings() {
  return (
    <div className="premium-empty-state studio-empty-state">
      <p className="premium-eyebrow">Catalogue update</p>
      <h2>No public rental listings are available right now.</h2>
      <p>
        Browse the catalogue again later or send a general quote request with
        your event details.
      </p>
      <div className="premium-empty-state__actions">
        <Link className="premium-button premium-button--secondary" href="/catalogue">
          Browse Catalogue
        </Link>
        <Link className="premium-button premium-button--primary" href="/quote">
          Request a quote
        </Link>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const catalogue = await getPublicCatalogue();
  const featuredListings = catalogue.products.slice(0, 3);
  const categories = catalogue.categories.slice(0, 6);

  return (
    <>
      <div className="studio-home">
        <section className="studio-hero">
          <div className="premium-container studio-hero__layout">
            <div className="studio-hero__copy">
              <h1 aria-label="Event furniture rental for planned spaces" className="premium-title-massive">
                Warm furniture settings for planned events.
              </h1>
              <p className="premium-hero-subtitle">
                Browse curated event furniture rental items, compare listing
                details, and submit event details for manual follow-up.
              </p>
              <div className="premium-hero-actions">
                <Link className="premium-button premium-button--primary" href="/catalogue">
                  Browse Catalogue
                </Link>
                <Link className="premium-button premium-button--secondary" href="/quote">
                  Request a quote
                </Link>
              </div>
            </div>

            <figure className="studio-hero__media">
              <Image
                alt="Styled event lounge"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 50vw"
                src={heroImage}
              />
              <figcaption>Furniture-led setups for event spaces.</figcaption>
            </figure>
          </div>
        </section>

        <section className="studio-pathway">
          <div className="premium-container studio-pathway__layout">
            <div className="studio-section-intro">
              <p className="premium-eyebrow">Enquiry-led planning</p>
              <h2 className="premium-title-section">Start with the furniture, then shape the setting.</h2>
            </div>
            <div className="studio-pathway__steps">
              {enquirySteps.map((step, index) => (
                <article className="studio-pathway__step" key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {categories.length > 0 ? (
          <section className="studio-category-rail">
            <div className="premium-container studio-category-rail__layout">
              <div className="studio-section-intro">
                <p className="premium-eyebrow">Catalogue paths</p>
                <h2 className="premium-title-section">Find a starting point.</h2>
              </div>
              <div className="studio-category-rail__links" aria-label="Browse by category">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/listings?category=${encodeURIComponent(cat.slug)}`}
                  >
                    <span>{cat.name}</span>
                    <span>View listings</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="studio-featured-section">
          <div className="premium-container">
            <div className="studio-featured-heading">
              <div className="studio-section-intro">
                <p className="premium-eyebrow">Featured rental listings</p>
                <h2 className="premium-title-section">Editorial pieces from the catalogue.</h2>
              </div>
              <Link className="premium-button premium-button--secondary" href="/catalogue">
                Browse All Listings
              </Link>
            </div>

            {featuredListings.length === 0 ? (
              <EmptyFeaturedListings />
            ) : (
              <div className="studio-featured-grid">
                {featuredListings.map((listing) => (
                  <FeaturedListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="studio-prep-section">
          <div className="premium-container studio-prep-section__layout">
            <Image alt="Corporate event furniture setting" src={corporateImage} />
            <div>
              <p className="premium-eyebrow">Before you enquire</p>
              <h2 className="premium-title-section">Prepare the details the team will review.</h2>
              <ul>
                {planningNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <Link className="premium-button premium-button--secondary" href="/quote">
                Start a rental enquiry
              </Link>
            </div>
          </div>
        </section>

        <section className="studio-quote-band">
          <div className="premium-container studio-quote-band__inner">
            <div>
              <p className="premium-eyebrow">Ready to share event details?</p>
              <h2 className="premium-title-section">Send a quote request for team review.</h2>
            </div>
            <Link className="premium-button premium-button--primary" href="/quote">
              Request a quote
            </Link>
          </div>
        </section>
      </div>

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
        <h3>Prepare a quote request</h3>
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
