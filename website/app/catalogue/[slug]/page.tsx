import Image from "next/image";
import Link from "next/link";
import sofaImage from "../../../assets/images/product_sofa.png";

const rentalDetails = [
  "Sample lounge package for receptions, launches, and VIP holding areas.",
  "Placeholder sizing and quantity notes for planning conversations.",
  "Final availability, delivery, and styling details are confirmed by the team."
];

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: "lounge-sofa-package" }];
}

export default function ProductPage() {
  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Product shell</p>
        <h1>Lounge sofa package</h1>
        <p>
          A static placeholder product detail page for MVP route structure,
          visual review, and quote-planning flow.
        </p>
      </div>

      <div className="detail-layout">
        <div className="detail-visual">
          <Image alt="Sample lounge sofa rental setup" priority src={sofaImage} />
        </div>

        <article className="quote-panel">
          <h2>Rental details</h2>
          <ul className="detail-list">
            {rentalDetails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="hero__actions">
            <Link className="button button--secondary" href="/catalogue">
              Back to catalogue
            </Link>
            <Link className="button" href="/quote">
              Start quote
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
