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
    "Browse listings for furniture and event rental enquiries before sending a public quote enquiry to Space Koncept Rentals."
};

const eventUseCases = [
  {
    title: "Corporate events",
    description:
      "Reception lounges, seminar seating, registration zones, and networking corners."
  },
  {
    title: "Weddings",
    description:
      "Soft seating, cocktail tables, and styled guest areas for solemnisation or dinner spaces."
  },
  {
    title: "Exhibitions",
    description:
      "Discussion settings, booth furniture, and showcase pieces for brand activations."
  },
  {
    title: "Gala lounges",
    description:
      "Polished arrival lounges, VIP waiting areas, and evening reception setups."
  }
];

const rentalJourneySteps = [
  {
    title: "Browse listings",
    description:
      "Start with catalogue cards, listing details, categories, and event setup ideas."
  },
  {
    title: "Share event details",
    description:
      "Prepare the event date, venue, requested quantities, alternates, and setup notes before sending an enquiry."
  },
  {
    title: "Team reviews event fit",
    description:
      "The team reviews your submitted rental enquiry and prepares direct follow-up."
  },
  {
    title: "Final quote follows directly",
    description:
      "The public form starts the enquiry. Quote details are handled directly by the team."
  }
];

const rentalAcceptanceChecks = [
  {
    title: "Confirm the rental fit",
    description:
      "Compare listing details, rental unit, category, and setup notes before sending an enquiry."
  },
  {
    title: "Prepare event context",
    description:
      "Bring event date, venue, quantities, alternates, and placement notes into the quote request."
  },
  {
    title: "Keep follow-up direct",
    description:
      "Use the public form to start the enquiry; rental fit and final quote details stay with the team."
  }
] as const;

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

function FeaturedListingCard({
  listing
}: {
  listing: PublicCatalogueProduct;
}) {
  const imageAltText =
    textOrUndefined(listing.primaryImage?.altText) ??
    `${listing.name} furniture rental setup`;

  return (
    <article className="catalogue-card home-featured-card">
      <div className="catalogue-card__image">
        {listing.primaryImage?.publicUrl ? (
          <img alt={imageAltText} src={listing.primaryImage.publicUrl} />
        ) : (
          <Image alt={imageAltText} src={featuredListingImage(listing)} />
        )}
      </div>
      <div className="catalogue-card__body">
        <div className="catalogue-card__meta">
          <span>{listing.categoryName ?? "Rental listing"}</span>
          <span>Rental unit: {listing.rentalUnit}</span>
        </div>
        <h2>{listing.name}</h2>
        <p>{featuredListingSummary(listing)}</p>
        <div className="catalogue-card__actions">
          <Link
            className="card-link card-link--primary"
            href={getQuoteHrefForListing(listing.slug)}
          >
            Request a quote
          </Link>
          <Link className="card-link" href={`/listings/${listing.slug}`}>
            View rental listing
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const catalogue = await getPublicCatalogue();
  const featuredListings = catalogue.products.slice(0, 3);

  return (
    <>
      <section className="hero section">
        <div className="hero__copy">
          <h1>Event furniture rental for planned spaces.</h1>
          <p>
            Browse rental listings, choose useful catalogue details, and send
            one enquiry for team follow-up.
          </p>
          <div className="hero__actions">
            <Link className="button" href="/quote">
              Request a quote
            </Link>
            <Link className="button button--secondary" href="/listings">
              Browse listings
            </Link>
            <Link className="button button--secondary" href="/categories">
              Browse categories
            </Link>
          </div>
        </div>
        <div className="hero__image">
          <Image
            alt="Styled event lounge furniture setup"
            priority
            src={heroImage}
          />
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>How rental enquiries work</h2>
          <p className="section__intro">
            Use the site to shortlist public rental options, then send one
            enquiry with the details needed for a useful follow-up.
          </p>
        </div>
        <div className="route-grid">
          {rentalJourneySteps.map((step) => (
            <article className="route-card" key={step.title}>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
        <div className="hero__actions">
          <Link className="button button--secondary" href="/events">
            Plan event setups
          </Link>
          <Link className="button" href="/quote">
            Start a rental enquiry
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Plan by event type</h2>
          <p className="section__intro">
            Start with the setting, then shortlist the furniture and notes the
            team needs for a useful quote follow-up.
          </p>
        </div>
        <div className="catalogue-grid">
          {eventUseCases.map((item) => (
            <article className="route-card" key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Before you send a rental enquiry</h2>
          <p className="section__intro">
            Keep the request practical: pick the listings you want reviewed and
            add the event context the team needs for follow-up.
          </p>
        </div>
        <div className="route-grid">
          {rentalAcceptanceChecks.map((item) => (
            <article className="route-card" key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <div className="hero__actions">
          <Link className="button button--secondary" href="/categories">
            Compare categories
          </Link>
          <Link className="button button--secondary" href="/events">
            Browse event guidance
          </Link>
          <Link className="button" href="/quote">
            Start a rental enquiry
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Featured rental listings</h2>
          <p className="section__intro">
            A quick starting point from public catalogue data. Final rental fit and setup details are reviewed by the team after your
            enquiry.
          </p>
        </div>
        {featuredListings.length === 0 ? (
          <>
            <p>No public rental listings are available right now.</p>
            <div className="hero__actions">
              <Link className="button button--secondary" href="/categories">
                Browse categories
              </Link>
              <Link className="button" href="/quote">
                Send an enquiry
              </Link>
            </div>
          </>
        ) : (
          <div className="catalogue-grid">
            {featuredListings.map((listing) => (
              <FeaturedListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
