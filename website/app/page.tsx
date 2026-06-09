import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import heroImage from "../assets/images/hero_homepage.png";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import { getQuoteHrefForListing } from "../lib/catalogue/quote-handoff";

export const metadata: Metadata = {
  title: "Event furniture rental listings | Space Koncept Rentals",
  description:
    "Browse listings, categories, and event setup ideas before sending a public quote enquiry to Space Koncept Rentals."
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
      "Polished arrival lounges, VIP holding areas, and evening reception setups."
  }
];

const rentalJourneySteps = [
  {
    title: "Browse public listings",
    description:
      "Start with rental listings, categories, or event setup ideas that match the space you are planning."
  },
  {
    title: "Share event details",
    description:
      "Prepare the event date, venue, requested quantities, alternates, and setup notes before sending an enquiry."
  },
  {
    title: "Team reviews event fit",
    description:
      "The team checks whether the requested furniture and setup notes fit the event context."
  },
  {
    title: "Final quote follows directly",
    description:
      "The submitted form is a quote request. Final follow-up and quote details happen directly with the team."
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
      "Use the public form to start the enquiry; availability, fit, and final quote details stay with the team."
  }
] as const;

export default async function HomePage() {
  const catalogue = await getPublicCatalogue();
  const featuredListings = catalogue.products.slice(0, 3);

  return (
    <>
      <section className="hero section">
        <div className="hero__copy">
          <h1>Event furniture rental for planned spaces.</h1>
          <p>
            Browse rental furniture for corporate events, weddings,
            exhibitions, and styled lounge setups, then send one clear enquiry
            for the pieces you need.
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
            Start a quote request
          </Link>
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
            Browse rental listings
          </Link>
          <Link className="button button--secondary" href="/events">
            Browse event guidance
          </Link>
          <Link className="button" href="/quote">
            Open quote request
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
            Start quote request
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Featured rental listings</h2>
          <p className="section__intro">
            A quick starting point from public catalogue data. Availability and
            final setup details are confirmed by the team after your enquiry.
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
                Send a general enquiry
              </Link>
            </div>
          </>
        ) : (
          <div className="catalogue-grid">
            {featuredListings.map((listing) => (
              <article className="route-card" key={listing.id}>
                {listing.categoryName ? (
                  <p className="eyebrow">{listing.categoryName}</p>
                ) : null}
                <h2>{listing.name}</h2>
                <p>{listing.shortDescription ?? listing.description}</p>
                <p>Rental unit: {listing.rentalUnit}</p>
                <div className="catalogue-card__actions">
                  <Link className="card-link" href={`/listings/${listing.slug}`}>
                    View listing
                  </Link>
                  <Link
                    className="card-link"
                    href={getQuoteHrefForListing(listing.slug)}
                  >
                    Request this listing
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
