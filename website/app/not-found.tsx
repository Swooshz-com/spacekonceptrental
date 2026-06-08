import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Space Koncept Rentals</p>
        <h1>Page unavailable</h1>
        <p>
          This page is not available right now. Browse current rental listings
          or send a quote enquiry and the team can help.
        </p>
      </div>
      <div className="hero__actions">
        <Link className="button button--secondary" href="/listings">
          Browse listings
        </Link>
        <Link className="button button--secondary" href="/events">
          Plan event setups
        </Link>
        <Link className="button" href="/quote">
          Request a quote
        </Link>
      </div>
    </section>
  );
}
