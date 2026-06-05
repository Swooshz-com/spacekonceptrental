import Image from "next/image";
import Link from "next/link";
import heroImage from "../assets/images/hero_homepage.png";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import { getQuoteHrefForListing } from "../lib/catalogue/quote-handoff";

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

export default async function HomePage() {
  const catalogue = await getPublicCatalogue();
  const featuredListings = catalogue.products.slice(0, 3);

  return (
    <>
      <section className="hero section">
        <div className="hero__copy">
          <h1>Event furniture rental for Singapore spaces.</h1>
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
          <h2>Featured rental listings</h2>
          <p className="section__intro">
            A quick starting point from public catalogue data. Availability and
            final setup details are confirmed by the team after your enquiry.
          </p>
        </div>
        {featuredListings.length === 0 ? (
          <p>No public rental listings are available right now.</p>
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
                    Send enquiry
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
