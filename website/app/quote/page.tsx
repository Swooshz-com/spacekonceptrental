import QuoteRequestForm from "../../components/QuoteRequestForm";
import { getPublicProductBySlug } from "../../lib/catalogue/catalogue-repository";
import { normalizePublicListingSlug } from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../../lib/catalogue/types";

type QuotePageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
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
      <p className="eyebrow">Listing enquiry</p>
      <h2>Enquiry for {product.name}</h2>
      <p>
        This listing has been added as a starting point. Share event dates,
        quantities, and styling notes so the team can follow up.
      </p>
      <dl className="quote-context__details">
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
    </article>
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
        ) : null}

        <article className="route-card">
          <h2>Need guidance?</h2>
          <p>
            The rental assistant can help clarify quantities, event dates, and
            product categories before the team follows up.
          </p>
        </article>
      </div>
    </section>
  );
}
