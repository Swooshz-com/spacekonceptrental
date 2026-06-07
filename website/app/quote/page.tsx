import Link from "next/link";
import type { Metadata } from "next";

import QuoteRequestForm from "../../components/QuoteRequestForm";
import { getPublicProductBySlug } from "../../lib/catalogue/catalogue-repository";
import { normalizePublicListingSlug } from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../../lib/catalogue/types";

type QuotePageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export const metadata: Metadata = {
  title: "Quote request | Space Koncept Rentals",
  description:
    "Send a furniture rental quote request with event date, venue, requested items, quantities, and setup notes."
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveQuoteListingContext(
  searchParams: QuotePageProps["searchParams"]
) {
  if (!searchParams) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const slug = normalizePublicListingSlug(
    firstSearchParam(resolvedSearchParams.listing)
  );

  return slug ? getPublicProductBySlug(slug) : null;
}

function QuoteListingContext({
  product
}: {
  product: PublicCatalogueProduct;
}) {
  return (
    <article className="route-card quote-context">
      <p className="eyebrow">Selected listing</p>
      <h2>Enquiry for {product.name}</h2>
      <p>
        This listing has been added as a starting point for your rental
        request. Share event dates, quantities, and styling notes so the team
        can follow up.
      </p>
      <dl className="quote-context__details">
        <div>
          <dt>Requested item</dt>
          <dd>{product.name}</dd>
        </div>
        {product.categoryName ? (
          <div>
            <dt>Category</dt>
            <dd>{product.categoryName}</dd>
          </div>
        ) : null}
        <div>
          <dt>Rental unit</dt>
          <dd>{product.rentalUnit}</dd>
        </div>
      </dl>
      <div className="catalogue-card__actions">
        <Link className="card-link" href={`/listings/${product.slug}`}>
          Review selected listing
        </Link>
      </div>
    </article>
  );
}

function QuoteGeneralContext() {
  return (
    <article className="route-card quote-context">
      <p className="eyebrow">Listing context</p>
      <h2>General rental enquiry</h2>
      <p>
        If a selected listing link is missing, invalid, unpublished, or
        unavailable, you can still send the team a general rental request with
        the items and event setup you have in mind.
      </p>
      <div className="catalogue-card__actions">
        <Link className="card-link" href="/listings">
          Browse public listings
        </Link>
        <Link className="card-link" href="/categories">
          Browse rental categories
        </Link>
      </div>
    </article>
  );
}

function QuoteExpectationCard() {
  return (
    <article className="route-card">
      <p className="eyebrow">Expectations</p>
      <h2>What happens after you enquire</h2>
      <p>
        This submission starts an enquiry and does not reserve furniture, dates,
        or delivery capacity.
      </p>
      <ul className="journey-list">
        <li>The team reviews availability and fit against your event details.</li>
        <li>Follow-up happens directly using the contact details you share.</li>
        <li>Final rental quote details are confirmed outside this public form.</li>
      </ul>
    </article>
  );
}

function QuoteRequestRecovery() {
  return (
    <nav className="hero__actions" aria-label="Quote request recovery">
      <Link className="button button--secondary" href="/listings">
        Browse listings
      </Link>
      <Link className="button button--secondary" href="/categories">
        Browse categories
      </Link>
      <Link className="button button--secondary" href="/events">
        Plan event setups
      </Link>
    </nav>
  );
}

export default async function QuotePage({
  searchParams
}: QuotePageProps = {}) {
  const listingContext = await resolveQuoteListingContext(searchParams);

  return (
    <section className="section">
      <div className="page-title">
        <h1>Quote request</h1>
        <p>
          Share the event details the team will need for a furniture rental
          follow-up.
        </p>
      </div>

      <div className="route-grid">
        <article className="quote-panel">
          <h2>Event basics</h2>
          <QuoteRequestForm initialItemsText={listingContext?.name} />
        </article>

        {listingContext ? (
          <QuoteListingContext product={listingContext} />
        ) : (
          <QuoteGeneralContext />
        )}

        <article className="route-card">
          <h2>Need guidance?</h2>
          <p>
            The rental assistant can help clarify quantities, event dates, and
            product categories before the team follows up.
          </p>
        </article>

        <QuoteExpectationCard />
      </div>

      <QuoteRequestRecovery />
    </section>
  );
}
