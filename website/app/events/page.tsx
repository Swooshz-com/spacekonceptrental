import Image from "next/image";
import Link from "next/link";
import corporateImage from "../../assets/images/event_corporate.png";
import exhibitionImage from "../../assets/images/event_exhibition.png";
import galaImage from "../../assets/images/event_gala.png";

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

export default function EventsPage() {
  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Event rentals</p>
        <h1>Events</h1>
        <p>
          Explore furniture rentals and styled setups for common event formats.
          Browse the catalogue first, then send an enquiry or quote request when
          the team should follow up.
        </p>
      </div>

      <div className="catalogue-grid">
        {eventUseCases.map((item) => (
          <article className="catalogue-card" key={item.title}>
            <div className="catalogue-card__image">
              <Image alt="" src={item.image} />
            </div>
            <div className="catalogue-card__body">
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>

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
