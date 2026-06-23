import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | Space Koncept Rental",
  description:
    "Contact Space Koncept Rental by submitting a rental enquiry through the quote request form."
};

export default function ContactPage() {
  return (
    <>
      <section className="premium-page-header premium-page-header--warm">
        <div className="premium-container">
          <h1 className="premium-title-hero">Contact Space Koncept Rental</h1>
          <p className="premium-subtitle">
            The clearest way to contact the team is to send a rental enquiry with your event details and requested pieces.
          </p>
        </div>
      </section>

      <section className="premium-section">
        <div className="premium-container premium-narrative-grid">
          <article className="premium-card premium-story-card">
            <h2 className="premium-title-section">Send a quote request</h2>
            <p>
              Include the event date if known, venue or location, requested rental listings or items, quantities, alternates, and setup notes. The team can use that context for manual follow-up.
            </p>
            <p>
              If you are still exploring, start with the catalogue or setups and add useful references to the request when you are ready.
            </p>
          </article>

          <aside className="premium-card premium-story-card premium-story-card--accent">
            <h2 className="premium-title-card">Ready to share details?</h2>
            <p>
              Submit the enquiry form so the request includes the practical context needed for review.
            </p>
            <div className="premium-action-row">
              <Link className="premium-button premium-button--primary" href="/quote">
                Submit Enquiry
              </Link>
              <Link className="premium-button premium-button--secondary" href="/catalogue">
                Browse Catalogue
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}