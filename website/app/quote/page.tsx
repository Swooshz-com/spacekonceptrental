import Link from "next/link";
import type { Metadata } from "next";

import QuoteRequestForm from "../../components/QuoteRequestForm";
import { getPublicProductBySlug } from "../../lib/catalogue/catalogue-repository";
import { getDemoPublicProductBySlug } from "../../lib/catalogue/demo-public-catalogue";
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
  title: "Request Quote | Space Koncept Rental",
  description:
    "Submit a furniture and event rental enquiry with event details, requested items, quantities, and setup notes for manual follow-up.",
  openGraph: {
    title: "Request Quote | Space Koncept Rental",
    description:
      "Share event furniture rental details and requested items for manual follow-up.",
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
    product: slug
      ? (await getPublicProductBySlug(slug)) ?? getDemoPublicProductBySlug(slug)
      : null,
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
  const selectionRows = [
    product
      ? { label: "Selected rental item", value: product.name }
      : requestedSlug
        ? { label: "Listing reference", value: requestedSlug }
        : undefined,
    product?.categoryName
      ? { label: "Category", value: product.categoryName }
      : category
        ? { label: "Category interest", value: category }
        : undefined,
    product?.rentalUnit
      ? { label: "Rental unit", value: product.rentalUnit }
      : undefined,
    event ? { label: "Event-use interest", value: event } : undefined,
    search ? { label: "Search interest", value: search } : undefined
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <section className="skr-panel" aria-labelledby="quote-selection-heading">
      <p className="skr-eyebrow">Your Selection</p>
      <h2 id="quote-selection-heading">Review the request context.</h2>
      {selectionRows.length === 0 ? (
        <p>
          No rental items or setups have been added yet. You can still submit a
          general enquiry and describe the event in the form.
        </p>
      ) : (
        <div className="skr-selection-list">
          {selectionRows.map((row) => (
            <div className="skr-selection-item" key={row.label}>
              <div className="skr-media-frame skr-selection-item__image" />
              <div>
                <span className="skr-card__meta">{row.label}</span>
                <p>{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="skr-actions">
        <Link className="skr-button skr-button--outline" href="/catalogue">
          Add Rental Items
        </Link>
        <Link className="skr-button skr-button--outline" href="/listings">
          Add Setups
        </Link>
      </div>
    </section>
  );
}

function WhatToExpect() {
  return (
    <section className="skr-panel" aria-labelledby="quote-expect-heading">
      <p className="skr-eyebrow">What to expect</p>
      <h2 id="quote-expect-heading">Manual team follow-up.</h2>
      <p>
        The enquiry gives the team practical context for review. It does not
        set aside furniture or finalise rental details.
      </p>
      <ul className="skr-expect-list">
        <li>The team reviews requested items, setup notes, and event details.</li>
        <li>Follow-up happens directly using the contact details you share.</li>
        <li>Proposal details are handled after the team reviews the request.</li>
      </ul>
    </section>
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
      <section className="skr-section">
        <div className="skr-container">
          <div className="skr-page-intro">
            <div>
              <p className="skr-eyebrow">Request Quote</p>
              <h1 className="skr-title">Shape your rental enquiry.</h1>
            </div>
            <div className="skr-page-intro__copy">
              <p className="skr-copy">
                Review your selection, add contact and event details, then
                submit the enquiry for manual Space Koncept Rental follow-up.
              </p>
            </div>
          </div>

          <div className="skr-quote-layout">
            <SelectionReview
              category={listingContext.category}
              event={listingContext.event}
              product={selectedListing}
              requestedSlug={listingContext.requestedSlug}
              search={listingContext.search}
            />
            <section className="skr-panel" aria-labelledby="quote-form-heading">
              <p className="skr-eyebrow">Quote request form</p>
              <h2 id="quote-form-heading">Share the rental details.</h2>
              <QuoteRequestForm
                initialItemsText={initialItemsText}
                initialListingSlug={listingContext.requestedSlug}
              />
            </section>
            <WhatToExpect />
          </div>
        </div>
      </section>
    </>
  );
}
