import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import corporateImage from "../../assets/images/event_corporate.png";
import exhibitionImage from "../../assets/images/event_exhibition.png";
import galaImage from "../../assets/images/event_gala.png";

export const metadata: Metadata = {
  title: "Event setups and rental use cases | Space Koncept Rentals",
  description:
    "Explore event setup guidance, browse rental listings, and send a quote request with setup notes."
};

const eventUseCases = [
  {
    title: "Corporate receptions",
    description: "Registration zones, lounge corners, and networking layouts.",
    image: corporateImage
  },
  {
    title: "Exhibitions",
    description: "Booth seating, discussion tables, and showcase spaces.",
    image: exhibitionImage
  },
  {
    title: "Gala evenings",
    description: "Arrival lounges, cocktail seating, and polished guest areas.",
    image: galaImage
  }
];

const setupSteps = [
  "Match the setup type to the event format and guest flow.",
  "Capture quantities and placement notes for the requested furniture.",
  "Send one quote enquiry so the team can review the event context."
];

export default function EventsPage() {
  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Event rentals</p>
        <h1>Events</h1>
        <p>
          Explore furniture rentals and styled setups for common event formats.
          Compare the setup guidance with catalogue listings before sending a
          quote request.
        </p>
      </div>

      <div className="catalogue-grid">
        {eventUseCases.map((item) => (
          <article className="catalogue-card" key={item.title}>
            <div className="catalogue-card__image">
              <Image alt={`${item.title} event furniture setup`} src={item.image} />
            </div>
            <div className="catalogue-card__body">
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="catalogue-use-cases" aria-label="Event setup enquiry guidance">
        <div>
          <p className="eyebrow">Use-case planning</p>
          <h2>Plan an event setup</h2>
          <p>
            These routes are starting points for a rental enquiry, not a fixed
            package. Keep the notes practical and the team can review the fit.
          </p>
        </div>
        <ul className="journey-list">
          {setupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <div className="hero__actions">
          <Link className="button button--secondary" href="/listings">
            Browse rental listings
          </Link>
          <Link className="button" href="/quote">
            Send setup notes
          </Link>
        </div>
      </section>

      <div className="hero__actions">
        <Link className="button button--secondary" href="/catalogue">
          Browse catalogue
        </Link>
        <Link className="button" href="/quote">
          Request a quote
        </Link>
      </div>
    </section>
  );
}
