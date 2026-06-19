import Link from "next/link";

export default function ListingNotFound() {
  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Rental listing</p>
        <h1>Listing unavailable</h1>
        <p>
          This rental listing is not available publicly right now. Browse
          current listings or send a general enquiry with the rental details you have in mind.
        </p>
        <p>
          Use current listings or categories to keep browsing public rental
          options, then send a quote request when your event details are ready.
        </p>
      </div>
      <div className="hero__actions">
        <Link className="button button--secondary" href="/listings">
          Browse listings
        </Link>
        <Link className="button button--secondary" href="/categories">
          Browse categories
        </Link>
        <Link className="button" href="/quote">
          Send an enquiry
        </Link>
      </div>
    </section>
  );
}
