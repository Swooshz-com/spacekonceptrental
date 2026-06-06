import Link from "next/link";

export default function CatalogueListingNotFound() {
  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Furniture listing</p>
        <h1>Listing unavailable</h1>
        <p>
          This rental listing is not available publicly right now. Browse the
          catalogue or send a general enquiry and the team can help.
        </p>
      </div>
      <div className="hero__actions">
        <Link className="button button--secondary" href="/catalogue">
          Browse catalogue
        </Link>
        <Link className="button" href="/quote">
          Send a general enquiry
        </Link>
      </div>
    </section>
  );
}
