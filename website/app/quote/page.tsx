import Link from "next/link";
import type { Metadata } from "next";

import QuoteRequestForm from "../../components/QuoteRequestForm";
import { getPublicProductBySlug } from "../../lib/catalogue/catalogue-repository";
import { normalizePublicDiscoveryContext, normalizePublicListingSlug } from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../../lib/catalogue/types";

type QuotePageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export const metadata: Metadata = {
  title: "Quote request for furniture rental enquiries | Space Koncept Rentals",
  description:
    "Submit an event furniture rental enquiry with event date, venue, requested listings, quantities, and setup notes."
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveQuoteListingContext(
  searchParams: QuotePageProps["searchParams"]
) {
  if (!searchParams) {
    return {
      product: null,
      requestedSlug: undefined,
      category: undefined,
      event: undefined,
      search: undefined
    };
  }

  const resolvedSearchParams = await searchParams;
  const slug = normalizePublicListingSlug(
    firstSearchParam(resolvedSearchParams.listing)
  );

  return {
    product: slug ? await getPublicProductBySlug(slug) : null,
    requestedSlug: slug,
    category: normalizePublicListingSlug(firstSearchParam(resolvedSearchParams.category)),
    event: normalizePublicListingSlug(firstSearchParam(resolvedSearchParams.event)),
    search: normalizePublicDiscoveryContext(firstSearchParam(resolvedSearchParams.search))
  };
}

function buildInitialItemsText({
  category,
  event,
  product,
  search
}: {
  category?: string;
  event?: string;
  product: PublicCatalogueProduct | null;
  search?: string;
}) {
  const context = [
    product?.name,
    category ? `Category interest: ${category}` : undefined,
    event ? `Event-use interest: ${event}` : undefined,
    search ? `Search interest: ${search}` : undefined
  ].filter(Boolean);

  return context.join("\n");
}

function QuoteSelectedListingBanner({
  product
}: {
  product: PublicCatalogueProduct;
}) {
  return (
    <aside
      aria-label="Selected rental listing context"
      className="quote-selected-listing"
    >
      <div>
        <p className="eyebrow">Selected rental listing</p>
        <h2>Selected rental listing: {product.name}</h2>
        <p>
          This listing starts the editable requested listings text. Use this
          selected listing as a starting point, then adjust quantities,
          alternates, event date or rental period notes, and venue details in
          the form before sending the enquiry.
        </p>
      </div>
      <dl className="quote-context__details">
        <div>
          <dt>Listing reference</dt>
          <dd>{product.slug}</dd>
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
      <Link className="card-link" href={`/listings/${product.slug}`}>
        Review selected listing details
      </Link>
    </aside>
  );
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
        The selected listing starts the request, but you can edit quantities,
        alternates, and event notes before sending. Share date, venue, setup,
        access, and timing details so the team can review the enquiry and
        follow up directly.
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

function QuoteGeneralContext({
  category,
  event,
  requestedSlug,
  search
}: {
  category?: string;
  event?: string;
  requestedSlug?: string;
  search?: string;
}) {
  return (
    <article className="route-card quote-context">
      <p className="eyebrow">Listing context</p>
      <h2>General rental enquiry</h2>
      {requestedSlug ? (
        <p>
          Selected listing could not be loaded. You can still send a general
          rental request with the requested listings or items, quantities,
          alternates, and event setup you have in mind.
        </p>
      ) : (
        <p>
          Share the requested listings or items, quantities, alternates, and
          event setup you have in mind so the team can follow up.
        </p>
      )}
      {category || event || search ? (
        <dl className="quote-context__details">
          {category ? (
            <div>
              <dt>Category interest</dt>
              <dd>{category}</dd>
            </div>
          ) : null}
          {event ? (
            <div>
              <dt>Event-use interest</dt>
              <dd>{event}</dd>
            </div>
          ) : null}
          {search ? (
            <div>
              <dt>Search interest</dt>
              <dd>{search}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <p>
        Discovery context is editable request intake only. Adjust the requested
        listings or items before sending if this starting point needs changes.
      </p>
      <div className="catalogue-card__actions">
        <Link className="card-link" href="/listings">
          Browse listings
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
        This submission starts an enquiry for team review. It does not set aside
        furniture, does not finalise rental details, or create a ready rental
        plan.
      </p>
      <ul className="journey-list">
        <li>The team reviews fit against your event details.</li>
        <li>Follow-up happens directly using the contact details you share.</li>
        <li>Rental quote details are reviewed outside this public form.</li>
        <li>You can share more details if the team needs clarification.</li>
      </ul>
    </article>
  );
}

function QuoteReviewChecklistCard() {
  return (
    <article className="route-card">
      <p className="eyebrow">Before you send</p>
      <h2>Check your enquiry details</h2>
      <p>
        Check event date, venue or location, requested listings or items,
        quantities, alternates, setup, access, and timing notes before sending
        the enquiry.
      </p>
      <ul className="journey-list">
        <li>Use listing names or short item descriptions.</li>
        <li>Add alternates when you are still comparing rental options.</li>
        <li>Keep access, timing, and placement notes practical.</li>
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
  const selectedListing = listingContext.product;
  const initialItemsText = buildInitialItemsText({
    category: listingContext.category,
    event: listingContext.event,
    product: selectedListing,
    search: listingContext.search
  });

  return (
    <section className="section">
      <div className="page-title">
        <h1>Request a rental quote</h1>
        <p>
          Share contact details, event date, venue, requested listings,
          quantities, and setup notes. The form is enquiry intake only; it does
          not set aside furniture or finish rental details, and it does not
          create an online follow-up page.
        </p>
      </div>

      {selectedListing ? (
        <QuoteSelectedListingBanner product={selectedListing} />
      ) : null}

      <div className="route-grid quote-page-grid">
        <article className="quote-panel quote-panel--primary">
          <h2>Event basics</h2>
          <p>
            Complete the required contact point first, then add the practical
            event details that help the team triage the rental enquiry.
          </p>
          <QuoteRequestForm
            initialItemsText={initialItemsText}
            initialListingSlug={listingContext.requestedSlug}
          />
        </article>

        {selectedListing ? (
          <QuoteListingContext product={selectedListing} />
        ) : (
          <QuoteGeneralContext
            category={listingContext.category}
            event={listingContext.event}
            requestedSlug={listingContext.requestedSlug}
            search={listingContext.search}
          />
        )}

        <article className="route-card">
          <h2>Need guidance?</h2>
          <p>
            The rental assistant can help clarify quantities, event dates, and
            product categories before the team follows up.
          </p>
        </article>

        <QuoteReviewChecklistCard />

        <QuoteExpectationCard />
      </div>

      <QuoteRequestRecovery />
    </section>
  );
}
