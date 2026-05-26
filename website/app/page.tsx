import Image from "next/image";
import Link from "next/link";
import heroImage from "../assets/images/hero_homepage.png";
import chairImage from "../assets/images/product_chair.png";
import sofaImage from "../assets/images/product_sofa.png";

export default function HomePage() {
  return (
    <>
      <section className="hero section">
        <div className="hero__copy">
          <h1>Event furniture rental for polished Singapore spaces.</h1>
          <p>
            Browse a focused rental catalogue, shape quote details, and get
            quick guidance while planning your next event.
          </p>
          <div className="hero__actions">
            <Link className="button" href="/catalogue">
              Browse catalogue
            </Link>
            <Link className="button button--secondary" href="/quote">
              Start quote
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
          <h2>Popular rental categories</h2>
          <p className="section__intro">
            Start with common seating and lounge pieces for launches,
            conferences, receptions, and brand activations.
          </p>
        </div>
        <div className="catalogue-grid">
          <article className="catalogue-card">
            <div className="catalogue-card__image">
              <Image alt="Rental chair" src={chairImage} />
            </div>
            <div className="catalogue-card__body">
              <h3>Seating</h3>
              <p>Chairs, stools, and lounge seating for event layouts.</p>
            </div>
          </article>
          <article className="catalogue-card">
            <div className="catalogue-card__image">
              <Image alt="Rental sofa" src={sofaImage} />
            </div>
            <div className="catalogue-card__body">
              <h3>Lounge</h3>
              <p>Soft seating and modular pieces for reception areas.</p>
            </div>
          </article>
          <article className="route-card">
            <h2>Quote planning</h2>
            <p>
              Gather event basics early so the rental conversation starts with
              the right quantities, venue details, and timeline.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
