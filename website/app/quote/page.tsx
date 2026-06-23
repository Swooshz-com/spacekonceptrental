import Link from "next/link";
import type { Metadata } from "next";

import PublicVisualShell from "../../components/PublicVisualShell";
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

type SelectionItem = {
  label: string;
  meta?: string;
  href?: string;
};

export const metadata: Metadata = {
  title: "Quote request for furniture rental enquiries | Space Koncept Rentals",
  description:
    "Submit an event furniture rental quote request with event date, venue, requested listings, quantities, and setup notes for manual follow-up.",
  openGraph: {
    title: "Quote request | Space Koncept Rentals",
    description:
      "Share event furniture rental details and requested listings for manual follow-up.",
    siteName: "Space Koncept Rentals",
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
    category: normalizePublicListingSlug(
      firstSearchParam(resolvedSearchParams.category)
    ),
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

function buildSelectedRentalItems({
  category,
  product,
  requestedSlug,
  search
}: {
  category?: string;
  product: PublicCatalogueProduct | null;
  requestedSlug?: string;
  search?: string;
}): SelectionItem[] {
  if (product) {
    return [
      {
        href: `/listings/${product.slug}`,
        label: product.name,
        meta: product.categoryName ?? product.rentalUnit
      }
    ];
  }

  const items: SelectionItem[] = [];

  if (requestedSlug) {
    items.push({
      href: "/listings",
      label: `Listing reference: ${requestedSlug}`,
      meta: "Review listings or keep this reference in the form."
    });
  }

  if (category) {
    items.push({
      href: `/listings?category=${encodeURIComponent(category)}`,
      label: `Category interest: ${category}`,
      meta: "Editable request context"
    });
  }

  if (search) {
    items.push({
      href: `/listings?search=${encodeURIComponent(search)}`,
      label: `Search interest: ${search}`,
      meta: "Editable request context"
    });
  }

  return items;
}

function SelectionRow({ item }: { item: SelectionItem }) {
  const content = (
    <>
      <span className="skr-selection-row__thumb" aria-hidden="true" />
      <span className="skr-selection-row__copy">
        <strong>{item.label}</strong>
        {item.meta ? <small>{item.meta}</small> : null}
      </span>
    </>
  );

  return item.href ? (
    <Link className="skr-selection-row" href={item.href}>
      {content}
    </Link>
  ) : (
    <div className="skr-selection-row">{content}</div>
  );
}

function SelectionReview({
  event,
  items
}: {
  event?: string;
  items: SelectionItem[];
}) {
  return (
    <section className="skr-quote-selection" aria-label="Your Selection">
      <p className="skr-kicker">Your Selection</p>
      <div className="skr-quote-selection__group">
        <h2>Selected Rental Items</h2>
        {items.length > 0 ? (
          <div className="skr-selection-list">
            {items.map((item) => (
              <SelectionRow item={item} key={item.label} />
            ))}
          </div>
        ) : (
          <div className="skr-selection-empty">
            <p>No selected rental items yet.</p>
            <Link href="/catalogue">Browse catalogue</Link>
          </div>
        )}
      </div>

      <div className="skr-quote-selection__group">
        <h2>Selected Setups</h2>
        {event ? (
          <div className="skr-selection-list">
            <SelectionRow
              item={{
                href: `/events?setup=${encodeURIComponent(event)}`,
                label: `Setup interest: ${event}`,
                meta: "Editable event setup context"
              }}
            />
          </div>
        ) : (
          <div className="skr-selection-empty">
            <p>No selected setups yet.</p>
            <Link href="/events">Explore setups</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function QuoteRecoveryNote({
  requestedSlug
}: {
  requestedSlug?: string;
}) {
  if (!requestedSlug) {
    return (
      <nav className="sr-only" aria-label="Quote request recovery">
        <h2>General rental enquiry</h2>
        <p>
          Share the requested listings or items, quantities, alternates, and
          event setup you have in mind so the team can follow up.
        </p>
        <p>
          Use the catalogue, listing details, and event setup guidance as
          starting points, then keep the requested items editable in the form.
        </p>
        <Link href="/listings">Browse listings</Link>
        <Link href="/listings">Review current rental listings</Link>
        <Link href="/events">Plan event setups</Link>
        <Link href="/catalogue">Start from the catalogue</Link>
      </nav>
    );
  }

  return (
    <>
      <p className="skr-quote-context-note">
        The listing link may be old or unavailable. Review current rental
        listings or keep typing the requested items. Listing reference:{" "}
        {requestedSlug} starts this rental request.
      </p>
      <nav className="sr-only" aria-label="Quote request recovery">
        <h2>Selected listing unavailable</h2>
        <p>Selected listing reference</p>
        <dl>
          <dt>Listing reference</dt>
          <dd>{requestedSlug}</dd>
        </dl>
        <p>
          Listing context is a starting point only and does not set aside
          furniture or finish rental details.
        </p>
        <p>
          Use the catalogue, listing details, and event setup guidance as
          starting points, then keep the requested items editable in the form.
        </p>
        <Link href="/listings">Browse listings</Link>
        <Link href="/listings">Review current rental listings</Link>
        <Link href="/events">Plan event setups</Link>
        <Link href="/catalogue">Start from the catalogue</Link>
      </nav>
    </>
  );
}

function QuoteContextNotes({
  category,
  event,
  search
}: {
  category?: string;
  event?: string;
  search?: string;
}) {
  if (!category && !event && !search) {
    return null;
  }

  return (
    <section className="sr-only" aria-label="Editable discovery context">
      <p>Discovery context is editable request intake only.</p>
      <p>Adjust the requested listings or items before sending.</p>
      <p>
        Listing context is a starting point only and not a rental fit
        confirmation.
      </p>
    </section>
  );
}

function WhatHappensNext() {
  const steps = ["Enquiry", "Selection", "Proposal", "Manual team follow-up"];

  return (
    <section className="skr-next-steps" aria-label="What happens next">
      <h2>What happens next?</h2>
      <div className="sr-only">
        <h2>What happens after you enquire</h2>
        <p>Submission starts an enquiry for manual review.</p>
        <p>Team reviews fit against your details.</p>
        <p>This does not set aside furniture or finish rental details.</p>
      </div>
      <ol>
        {steps.map((step, index) => (
          <li key={step}>
            <span>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <p>
        This request does not confirm final rental details. The team reviews
        your selection and follows up directly using your contact details.
      </p>
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
  const selectedItems = buildSelectedRentalItems({
    category: listingContext.category,
    product: selectedListing,
    requestedSlug: listingContext.requestedSlug,
    search: listingContext.search
  });

  return (
    <PublicVisualShell active="quote">
      <section className="skr-quote-page">
        <div className="skr-shell-container">
          <header className="skr-quote-intro">
            <h1>Request a Rental Quote</h1>
            <p>
              Submit your selection for manual review by our rental team. We
              will follow up with a tailored proposal.
            </p>
            <p className="sr-only">
              Share contact details, event date, venue, requested listings,
              quantities, and setup notes. The form is enquiry intake only.
            </p>
            <QuoteRecoveryNote requestedSlug={listingContext.requestedSlug} />
            <QuoteContextNotes
              category={listingContext.category}
              event={listingContext.event}
              search={listingContext.search}
            />
          </header>

          <div className="skr-quote-grid">
            <div className="skr-quote-selection-column">
              <SelectionReview
                event={listingContext.event}
                items={selectedItems}
              />
            </div>

            <section className="skr-quote-form-panel" aria-label="Quote request form">
              <h2 className="sr-only">Check your enquiry details</h2>
              <h2>Enquiry Details</h2>
              <p className="sr-only">
                Complete the required contact point first, then add the
                practical event details that help our team triage the rental
                enquiry.
              </p>
              <p className="sr-only">Before you send</p>
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
            <div className="skr-quote-next-column">
              <WhatHappensNext />
            </div>
          </div>
        </div>
      </section>
    </PublicVisualShell>
  );
}
