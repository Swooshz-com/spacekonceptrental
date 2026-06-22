import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Space Koncept Rental",
  description:
    "Contact guidance for Space Koncept Rental furniture and event rental enquiries."
};

const guidance = [
  {
    title: "Project enquiries",
    text: "Use the quote request page when you have rental items, setup ideas, event date, venue, or access notes to share.",
    href: "/quote",
    label: "Request Quote"
  },
  {
    title: "Browse before enquiring",
    text: "Review individual rental items or curated setups first, then keep the request editable on the quote page.",
    href: "/catalogue",
    label: "Browse Catalogue"
  }
];

export default function ContactPage() {
  return (
    <>
      <section className="skr-section">
        <div className="skr-container">
          <div className="skr-page-intro">
            <div>
              <p className="skr-eyebrow">Get in touch</p>
              <h1 className="skr-title">
                Share the rental context when you are ready.
              </h1>
            </div>
            <div className="skr-page-intro__copy">
              <p className="skr-copy">
                Space Koncept Rental keeps public enquiry intake focused on the
                quote request flow so the team receives useful event details in
                one place.
              </p>
            </div>
          </div>

          <div className="skr-contact-grid" style={{ marginTop: "56px" }}>
            <section className="skr-panel" aria-labelledby="contact-main-heading">
              <p className="skr-eyebrow">Rental enquiry path</p>
              <h2 id="contact-main-heading">Start with your selection.</h2>
              <p>
                Add rental items or setups to the request, then submit contact
                details, event details, rental details, and setup notes on the
                quote page.
              </p>
              <div className="skr-actions">
                <Link className="skr-button skr-button--solid" href="/quote">
                  Submit Enquiry
                </Link>
                <Link className="skr-button skr-button--outline" href="/listings">
                  View Setups
                </Link>
              </div>
            </section>

            <div className="skr-contact-grid__stack">
              {guidance.map((item) => (
                <article className="skr-panel" key={item.title}>
                  <p className="skr-eyebrow">{item.title}</p>
                  <p>{item.text}</p>
                  <Link className="skr-text-link" href={item.href}>
                    {item.label}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
