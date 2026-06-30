import Link from "next/link";

export default function NotFound() {
  return (
    <section className="stitch-section">
      <div className="stitch-container">
        <div className="stitch-empty">
          <p className="stitch-section-eyebrow">SpaceKonceptRental</p>
          <h2>Page unavailable</h2>
          <p>
          This page is not available right now. Browse current rental listings
          or send a quote enquiry with event details so the team can help.
          </p>

          <div className="stitch-actions">
          <Link className="stitch-button stitch-button--secondary" href="/listings">
            Browse listings
          </Link>
          <Link className="stitch-button stitch-button--secondary" href="/categories">
            Browse categories
          </Link>
          <Link className="stitch-button stitch-button--secondary" href="/events">
            Plan event setups
          </Link>
          <Link className="stitch-button stitch-button--primary" href="/quote">
            Request a quote
          </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
