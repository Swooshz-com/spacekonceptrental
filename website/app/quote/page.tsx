import Link from "next/link";
import type { Metadata } from "next";

import QuoteRequestForm from "../../components/QuoteRequestForm";
import { getPublicProductBySlug } from "../../lib/catalogue/catalogue-repository";
import {
  normalizePublicDiscoveryContext,
  normalizePublicListingSlug
} from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../../lib/catalogue/types";

type QuotePageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export const metadata: Metadata = {
  title: "Quote request for furniture rental enquiries | Space Koncept Rental",
  description:
    "Submit an event furniture rental quote request with event date, venue, requested listings, quantities, and setup notes for manual follow-up.",
  openGraph: {
    title: "Quote request | Space Koncept Rental",
    description:
      "Share event furniture rental details and requested listings for manual follow-up.",
    siteName: "Space Koncept Rental",
    type: "website",
    url: "/quote"
  }
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
  requestedSlug,
  search
}: {
  category?: string;
  event?: string;
  product: PublicCatalogueProduct | null;
  requestedSlug?: string;
  search?: string;
}) {
  const context = [
    product?.name ??
      (requestedSlug ? `Listing reference: ${requestedSlug}` : undefined),
    category ? `Category interest: ${category}` : undefined,
    event ? `Event-use interest: ${event}` : undefined,
    search ? `Search interest: ${search}` : undefined
  ].filter(Boolean);

  return context.join("\n");
}

function SelectedListingDetails({ product }: { product: PublicCatalogueProduct }) {
  return (
    <article className="premium-selection-card">
      <p className="premium-kicker">Selected rental item</p>
      <h3 className="premium-title-card">{product.name}</h3>
      <p>
        This listing starts the editable requested listings text. Adjust quantities, alternates, event date, venue, setup, access, and timing notes in the form before sending the enquiry.
      </p>
      <dl className="premium-selection-card__facts">
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
        {product.rentalUnit ? (
          <div>
            <dt>Rental unit</dt>
            <dd>{product.rentalUnit}</dd>
          </div>
        ) : null}
      </dl>
      <Link className="premium-button premium-button--secondary" href={`/listings/${product.slug}`}>
        Review Details
      </Link>
    </article>
  );
}

function GeneralSelectionDetails({
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
  const hasSelectedListingReference = Boolean(requestedSlug);

  return (
    <article className="premium-selection-card">
      <p className="premium-kicker">
        {hasSelectedListingReference ? "Selected listing reference" : "Rental item notes"}
      </p>
      <h3 className="premium-title-card">
        {hasSelectedListingReference ? "Selected listing unavailable" : "No rental items selected yet"}
      </h3>
      <p>
        {requestedSlug
          ? "The listing link may be old or unavailable. Review current rental listings or keep typing the requested items."
          : "Use the form to share requested rental listings or items, quantities, alternates, and event setup notes."}
      </p>
      {requestedSlug ? (
        <p>Listing reference: {requestedSlug} starts this rental request.</p>
      ) : null}
      {(requestedSlug || category || event || search) ? (
        <dl className="premium-selection-card__facts">
          {requestedSlug ? (
            <div>
              <dt>Listing reference</dt>
              <dd>{requestedSlug}</dd>
            </div>
          ) : null}
          {category ? (
            <div>
              <dt>Category</dt>
              <dd>{category}</dd>
            </div>
          ) : null}
          {event ? (
            <div>
              <dt>Event-use</dt>
              <dd>{event}</dd>
            </div>
          ) : null}
          {search ? (
            <div>
              <dt>Search</dt>
              <dd>{search}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <nav className="premium-selection-card__links" aria-label="Quote request recovery">
        <p>
          Use the catalogue, listing details, and event setup guidance as starting points, then keep the requested items editable in the form.
        </p>
        <Link className="premium-button premium-button--secondary" href="/listings">
          Review current rental listings
        </Link>
        <Link className="premium-button premium-button--secondary" href="/listings">
          Browse listings
        </Link>
        <Link className="premium-button premium-button--secondary" href="/events">
          Plan event setups
        </Link>
        <Link className="premium-button premium-button--secondary" href="/catalogue">
          Start from the catalogue
        </Link>
      </nav>
    </article>
  );
}

function SelectionReview({
  category,
  event,
  product,
  requestedSlug,
  search
}: {
  category?: string;
  event?: string;
  product: PublicCatalogueProduct | null;
  requestedSlug?: string;
  search?: string;
}) {
  return (
    <section className="premium-quote-selection" aria-labelledby="quote-selection-heading">
      <div className="premium-section-heading premium-section-heading--left">
        <h2 className="premium-title-section" id="quote-selection-heading">
          Your Selection
        </h2>
        <p>
          Review the selected rental context before completing the enquiry form. You can edit everything in the request fields below.
        </p>
        <p className="sr-only">Discovery context is editable request intake only.</p>
      </div>
      <div className="premium-quote-selection__grid">
        <section aria-labelledby="selected-rental-items-heading">
          <h2 className="premium-title-card" id="selected-rental-items-heading">
            Selected Rental Items
          </h2>
          {product ? (
            <SelectedListingDetails product={product} />
          ) : (
            <GeneralSelectionDetails
              category={category}
              event={event}
              requestedSlug={requestedSlug}
              search={search}
            />
          )}
        </section>
        <section aria-labelledby="selected-setups-heading">
          <h2 className="premium-title-card" id="selected-setups-heading">
            Selected Setups
          </h2>
          <article className="premium-selection-card">
            <p className="premium-kicker">Setup context</p>
            <h3 className="premium-title-card">Describe the event setup</h3>
            <p>
              Add setup style, access details, placement notes, timing, and alternates in the form so the team can review the rental brief.
            </p>
            <Link className="premium-button premium-button--secondary" href="/listings">
              Explore Setups
            </Link>
          </article>
        </section>
      </div>
    </section>
  );
}

function WhatHappensNext({ hasInitialContext }: { hasInitialContext: boolean }) {
  return (
    <aside className="premium-card premium-quote-next" aria-labelledby="quote-next-heading">
      <p className="premium-kicker">After submission</p>
      <h2 className="premium-title-card" id="quote-next-heading">
        What happens next
      </h2>
      <p>Submission starts an enquiry for manual review; it is a receipt only.</p>
      <ul>
        <li>This does not set aside furniture or finish rental details.</li>
        <li>{hasInitialContext ? "Selected context stays editable for team review." : "The team reviews fit against the details you share."}</li>
        <li>Follow-up happens directly using your contact details.</li>
      </ul>
    </aside>
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
    requestedSlug: listingContext.requestedSlug,
    search: listingContext.search
  });

  return (
    <>
      <section className="premium-page-header premium-page-header--warm">
        <div className="premium-container">
          <h1 className="premium-title-hero">Request Quote</h1>
          <p className="premium-subtitle">
            Share contact details, event date, venue, requested listings, quantities, and setup notes. The form is enquiry intake only.
          </p>
        </div>
      </section>

      <section className="premium-section premium-quote-flow">
        <div className="premium-container">
          <SelectionReview
            category={listingContext.category}
            event={listingContext.event}
            product={selectedListing}
            requestedSlug={listingContext.requestedSlug}
            search={listingContext.search}
          />

          <div className="premium-quote-main">
            <section className="premium-form-card premium-quote-form-section" aria-labelledby="quote-form-heading">
              <p className="premium-kicker">Enquiry details</p>
              <h2 className="premium-title-section" id="quote-form-heading">
                Quote request form
              </h2>
              <p>
                Complete the required contact point first, then add the practical event details that help our team triage the rental enquiry.
              </p>
              <p className="sr-only">
                Event date, venue or location, requested listings or items,
                quantities, alternates, setup, access, and timing notes help
                the team review the request.
              </p>

              <QuoteRequestForm
                initialItemsText={initialItemsText}
                initialListingSlug={listingContext.requestedSlug}
              />
            </section>

            <WhatHappensNext hasInitialContext={Boolean(initialItemsText)} />
          </div>
        </div>
      </section>
    </>
  );
}