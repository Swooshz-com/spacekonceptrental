import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import corporateImage from "../../assets/images/event_corporate.png";
import chairImage from "../../assets/images/product_chair.png";
import sofaImage from "../../assets/images/product_sofa.png";

export const metadata: Metadata = {
  title: "About | Space Koncept Rental",
  description:
    "Learn how Space Koncept Rental supports event furniture enquiries with curated rental pieces, setup ideas, and manual team follow-up."
};

const paths = [
  {
    title: "Choose individual rental items",
    text: "Browse the catalogue and add the pieces that fit your event layout, guest flow, and visual direction.",
    href: "/catalogue",
    label: "Explore Catalogue",
    image: chairImage
  },
  {
    title: "Start from a curated setup",
    text: "Use Setups as a starting point when you want a more complete furniture direction for the event space.",
    href: "/listings",
    label: "View Setups",
    image: sofaImage
  }
];

const advantages = [
  "Curated rental pieces and setup references.",
  "Editable quote requests before manual review.",
  "Human follow-up for event details, venue notes, and proposal context."
];

export default function AboutPage() {
  return (
    <>
      <section className="skr-section">
        <div className="skr-container">
          <div className="skr-page-intro">
            <div>
              <p className="skr-eyebrow">About Space Koncept Rental</p>
              <h1 className="skr-title">
                Intentional rental pieces for event spaces.
              </h1>
            </div>
            <div className="skr-page-intro__copy">
              <p className="skr-copy">
                Space Koncept Rental is a furniture and event rental catalogue.
                The public site helps visitors browse rental items, review
                setups, and submit one enquiry for manual team follow-up.
              </p>
            </div>
          </div>
          <div className="skr-media-frame" style={{ aspectRatio: "16 / 7", marginTop: "56px" }}>
            <Image alt="Styled event space with rental furniture" src={corporateImage} />
          </div>
        </div>
      </section>

      <section className="skr-section skr-section--soft">
        <div className="skr-container">
          <div className="skr-section-heading">
            <div>
              <p className="skr-eyebrow">How we work</p>
              <h2 className="skr-title skr-title--medium">
                Two paths into the same enquiry flow.
              </h2>
            </div>
          </div>
          <div className="skr-card-grid">
            {paths.map((path) => (
              <article className="skr-card skr-card--half" key={path.title}>
                <div className="skr-card__image">
                  <Image alt={`${path.title} visual reference`} src={path.image} />
                </div>
                <div className="skr-card__body">
                  <span className="skr-card__meta">Rental path</span>
                  <h3>{path.title}</h3>
                  <p>{path.text}</p>
                  <div className="skr-card__actions">
                    <Link className="skr-button skr-button--outline" href={path.href}>
                      {path.label}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="skr-section">
        <div className="skr-container">
          <div className="skr-editorial-grid">
            <div className="skr-span-5">
              <p className="skr-eyebrow">The Koncept advantage</p>
              <h2 className="skr-title skr-title--medium">
                High-touch rental enquiry intake, reviewed by people.
              </h2>
            </div>
            <div className="skr-span-7">
              <div className="skr-panel">
                {advantages.map((item, index) => (
                  <p key={item}>
                    <strong>{String(index + 1).padStart(2, "0")}. </strong>
                    {item}
                  </p>
                ))}
                <Link className="skr-button skr-button--solid" href="/quote">
                  Request Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
