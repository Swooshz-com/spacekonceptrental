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
    description: "Booth seating, discussion tables, and product demo spaces.",
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
        <p className="eyebrow">Event shell</p>
        <h1>Event rental shells</h1>
        <p>
          Static MVP route for common event rental use cases before real product
          inventory, persistence, or event-specific workflows are introduced.
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
          Start quote
        </Link>
      </div>
    </section>
  );
}
