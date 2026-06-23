import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Space Koncept Rental",
  description:
    "About Space Koncept Rental and its furniture and event rental enquiry flow."
};

export default function AboutPage() {
  return (
    <>
      <section className="premium-page-header premium-page-header--warm">
        <div className="premium-container">
          <h1 className="premium-title-hero">About Space Koncept Rental</h1>
          <p className="premium-subtitle">
            Space Koncept Rental presents a public catalogue for furniture and event rental enquiries, then routes requests into manual follow-up.
          </p>
        </div>
      </section>

      <section className="premium-section">
        <div className="premium-container premium-narrative-grid">
          <article className="premium-card premium-story-card">
            <h2 className="premium-title-section">Built around rental briefs</h2>
            <p>
              Visitors can browse rental listings, compare setup cues, and send the details a team needs to review event fit: venue context, quantities, timing, access notes, and preferred pieces.
            </p>
            <p>
              The site is an enquiry surface, not an instant self-service workflow. Manual team follow-up keeps the rental discussion flexible until details are reviewed directly.
            </p>
          </article>

          <aside className="premium-card premium-story-card premium-story-card--accent">
            <h2 className="premium-title-card">Start with the catalogue</h2>
            <p>
              Browse current public rental listings or send a quote request with the event context you already have.
            </p>
            <div className="premium-action-row">
              <Link className="premium-button premium-button--secondary" href="/catalogue">
                Browse Catalogue
              </Link>
              <Link className="premium-button premium-button--primary" href="/quote">
                Request Quote
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}