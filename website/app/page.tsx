import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";

import heroImage from "../assets/images/hero_homepage.png";
import chairImage from "../assets/images/product_chair.png";
import sofaImage from "../assets/images/product_sofa.png";
import corporateImage from "../assets/images/event_corporate.png";
import PublicVisualShell from "../components/PublicVisualShell";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import { getQuoteHrefForListing } from "../lib/catalogue/quote-handoff";
import type {
  PublicCatalogueCategory,
  PublicCatalogueProduct
} from "../lib/catalogue/types";

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
  {
    title: "Catalogue-first planning",
    description:
      "Start with public rental listings, then use the quote request to share quantities, alternates, and setup notes."
  },
  {
    title: "Event detail capture",
    description:
      "Send practical context such as event date, venue, access notes, and the rental pieces you want reviewed."
  },
  {
    title: "Manual team follow-up",
    description:
      "Your enquiry gives the team a clear starting point for direct follow-up and proposal preparation."
  }
];

function textOrUndefined(value: string | undefined) {
  return value?.trim() || undefined;
}

function featuredListingImage(listing: PublicCatalogueProduct): StaticImageData {
  const slug = listing.slug.toLowerCase();
  const categoryName = listing.categoryName?.toLowerCase() ?? "";

  if (slug.includes("chair") || categoryName.includes("seating")) {
    return chairImage;
  }

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

function CategoryTile({
  category,
  featured,
  wide
}: {
  category: PublicCatalogueCategory;
  featured?: boolean;
  wide?: boolean;
}) {
  return (
    <Link
      className={[
        "skr-category-tile",
        featured ? "skr-category-tile--featured" : "",
        wide ? "skr-category-tile--wide" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      href={`/listings?category=${encodeURIComponent(category.slug)}`}
    >
      <Image
        alt={`${category.name} event rental category`}
        src={featured ? chairImage : wide ? sofaImage : corporateImage}
      />
      <span>{category.name}</span>
    </Link>
  );
}

function FeaturedListingCard({ listing }: { listing: PublicCatalogueProduct }) {
  const imageAltText =
    textOrUndefined(listing.primaryImage?.altText) ??
    `${listing.name} furniture rental setup`;

  return (
    <article className="skr-featured-card">
      <div className="skr-featured-card__image">
        {listing.primaryImage?.publicUrl ? (
          <img alt={imageAltText} src={listing.primaryImage.publicUrl} />
        ) : (
          <Image alt={imageAltText} src={featuredListingImage(listing)} />
        )}
      </div>
      <div className="skr-featured-card__body">
        <p>{listing.categoryName ?? "Rental listing"}</p>
        <h3>{listing.name}</h3>
        <span>{featuredListingSummary(listing)}</span>
        <div className="skr-featured-card__actions">
          <Link href={`/listings/${listing.slug}`}>View Details</Link>
          <Link href={getQuoteHrefForListing(listing.slug)}>Add to Quote</Link>
        </div>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const catalogue = await getPublicCatalogue();
  const featuredListings = catalogue.products.slice(0, 4);
  const categories = catalogue.categories.slice(0, 4);

  return (
    <PublicVisualShell active="home">
      <section className="skr-home-hero">
        <div className="skr-shell-container">
          <div className="skr-home-hero__frame">
            <Image
              alt="Styled event lounge with modular rental furniture"
              fill
              priority
              src={heroImage}
            />
            <div className="skr-home-hero__overlay" />
            <div className="skr-home-hero__content">
              <h1>Furnish Your Vision. Elevate Every Space.</h1>
              <p>
                Furniture and event rental catalogue for planned spaces,
                selection notes, and manual quote follow-up.
              </p>
              <div className="skr-home-hero__actions">
                <Link className="skr-button skr-button--dark" href="/quote">
                  Request Quote
                </Link>
                <Link className="skr-button skr-button--ghost" href="/catalogue">
                  Browse Catalogue
                </Link>
                <Link className="skr-button skr-button--ghost" href="/events">
                  Explore Setups
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="skr-section" id="about">
        <div className="skr-shell-container">
          <h2 className="skr-section-title skr-section-title--center">
            The Space Koncept Advantage
          </h2>
          <div className="skr-advantage-grid">
            {advantages.map((advantage) => (
              <article className="skr-advantage-card" key={advantage.title}>
                <span aria-hidden="true" />
                <h3>{advantage.title}</h3>
                <p>{advantage.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="skr-section skr-section--tight">
        <div className="skr-shell-container">
          <div className="skr-section-heading-row">
            <h2 className="skr-section-title">Browse By Category</h2>
            <Link href="/catalogue">View All</Link>
          </div>
          {categories.length > 0 ? (
            <div className="skr-category-grid">
              {categories.map((category, index) => (
                <CategoryTile
                  category={category}
                  featured={index === 0}
                  key={category.id}
                  wide={index === 3}
                />
              ))}
            </div>
          ) : (
            <div className="skr-inline-empty">
              <p>No public rental categories are available right now.</p>
              <Link href="/quote">Request a general quote</Link>
            </div>
          )}
        </div>
      </section>

      <section className="skr-section">
        <div className="skr-shell-container">
          <h2 className="skr-section-title skr-section-title--center">
            Featured Pieces
          </h2>
          {featuredListings.length > 0 ? (
            <>
              <div className="skr-featured-grid">
                {featuredListings.map((listing) => (
                  <FeaturedListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <div className="skr-centered-action">
                <Link className="skr-button skr-button--outline" href="/catalogue">
                  View Full Catalogue
                </Link>
              </div>
            </>
          ) : (
            <div className="skr-inline-empty skr-inline-empty--center">
              <p>No public rental listings are available right now.</p>
              <Link href="/quote">Request Quote</Link>
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
        <p>Event furniture.</p>
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
    </PublicVisualShell>
  );
}
