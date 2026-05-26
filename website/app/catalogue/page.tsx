import Image from "next/image";
import Link from "next/link";
import chairImage from "../../assets/images/product_chair.png";
import sofaImage from "../../assets/images/product_sofa.png";
import corporateImage from "../../assets/images/event_corporate.png";

const catalogueItems = [
  {
    title: "Dining and seminar chairs",
    description: "Clean seating options for conferences, dinners, and launches.",
    image: chairImage
  },
  {
    title: "Lounge sofas",
    description: "Soft seating for receptions, VIP areas, and brand activations.",
    image: sofaImage
  },
  {
    title: "Corporate event sets",
    description: "Prepared event looks that can be translated into quote items.",
    image: corporateImage
  }
];

export default function CataloguePage() {
  return (
    <section className="section">
      <div className="page-title">
        <h1>Catalogue</h1>
        <p>
          Browse starter categories for event furniture, lounge layouts, and
          corporate rental setups.
        </p>
      </div>

      <div className="catalogue-grid">
        {catalogueItems.map((item) => (
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
        <Link className="button" href="/quote">
          Start quote
        </Link>
      </div>
    </section>
  );
}
