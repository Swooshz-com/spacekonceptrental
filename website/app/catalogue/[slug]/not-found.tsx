import Link from "next/link";

export default function CatalogueListingNotFound() {
  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Furniture listing</p>
        <h1>Listing unavailable</h1>
        <p>
          This rental listing is not available publicly right now. Browse the
          catalogue or send a general enquiry with the rental details you have in mind.
        </p>
        <p>
          Use the catalogue or listings to keep browsing public rental options,
          then send a quote request when you have enough event details to share.
        </p>
      </div>
      <div className="hero__actions">
        <Link className="button button--secondary" href="/catalogue">
          View catalogue
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
