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
    title: "Browse catalogue and listings",
    description:
      "Start with public catalogue cards, categories, event-use ideas, and rental listing summaries."
  },
  {
    title: "View rental listing details",
    description:
      "Open a listing to check the name, category, rental unit, image, description, and quote request action."
  },
  {
    title: "Submit an editable quote request",
    description:
      "Carry a selected listing into the form, then edit requested items, quantities, alternates, and event notes before sending."
  },
  {
    title: "Team reviews event details",
    description:
      "The team follows up directly using the contact details you share after reviewing the submitted event details."
  }
];

const quotePreparationItems = [
  {
    title: "Event date if known",
    description:
      "Share the planned date or note when the date is still flexible."
  },
  {
    title: "Venue or location",
    description:
      "Add the venue, area, or delivery location so the team has practical event context."
  },
  {
    title: "Requested rental listings or items",
    description:
      "Use listing names, short item descriptions, or a selected listing carried from the catalogue."
  },
  {
    title: "Approximate quantities",
    description:
      "Include counts, sets, or rough ranges so the team can understand the scale."
  },
  {
    title: "Setup, access, and timing notes",
    description:
      "Mention placement, lift or loading access, setup timing, and any on-site constraints."
  },
  {
    title: "Alternates if flexible",
    description:
      "Add acceptable substitutes when colour, size, or exact listing choice can change."
  }
];

const publicReviewPrompts = [
  {
    title: "Find suitable rental pieces",
    description: "Browse listing details before requesting a quote."
  },
  {
    title: "Plan by event setup",
    description:
      "Use categories and event guidance to describe your setup."
  },
  {
    title: "Send a quote request",
    description: "Add event details so the team can follow up."
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
          <p>
            Furniture rental and event rental catalogue for browsing real
            listings.
          </p>
          <ul className="journey-list">
            <li>View listing details before requesting a quote.</li>
            <li>
              Share event/rental details for manual follow-up after reviewing
              your event details.
            </li>
            <li>
              No instant rental confirmation happens on this site; the team
              reviews each enquiry manually.
            </li>
          </ul>
          <div className="hero__actions">
            <Link className="button" href="/quote">
              Request a quote
            </Link>
            <Link className="button button--secondary" href="/catalogue">
              Browse catalogue
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
          <Link className="button button--secondary" href="/listings">
            Browse rental listings
          </Link>
          <Link className="button" href="/quote">
            Start a quote request
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>What to prepare before you enquire</h2>
          <p className="section__intro">
            A quote request is the starting point for manual team review. It
            does not set aside furniture or finalise rental details.
          </p>
        </div>
        <div className="route-grid">
          {quotePreparationItems.map((item) => (
            <article className="route-card" key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <div className="hero__actions">
          <Link className="button button--secondary" href="/listings">
            Browse rental listings
          </Link>
          <Link className="button" href="/quote">
            Start a quote request
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
          <h2>Plan your rental journey</h2>
          <p className="section__intro">
            Listings, categories, event-use guidance, and quote requests help
            you describe the setup you need.
          </p>
        </div>
        <div className="route-grid">
          {publicReviewPrompts.map((prompt) => (
            <article className="route-card" key={prompt.title}>
              <h2>{prompt.title}</h2>
              <p>{prompt.description}</p>
            </article>
          ))}
        </div>
        <div className="hero__actions">
          <Link className="button button--secondary" href="/listings">
            Browse listings
          </Link>
          <Link className="button button--secondary" href="/events">
            Browse event guidance
          </Link>
          <Link className="button" href="/quote">
            Request a quote
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Ready to request a rental quote</h2>
          <p className="section__intro">
            Compare listings, categories, event setup notes, and quote details
            before sending the enquiry.
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
