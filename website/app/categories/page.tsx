import Link from "next/link";
import type { Metadata } from "next";

import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { getQuoteHrefForListing } from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogue } from "../../lib/catalogue/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rental categories | Space Koncept Rentals",
  description:
    "Browse public furniture and event rental categories and send a quote enquiry to Space Koncept Rentals."
};

function textOrUndefined(value: string | undefined) {
  return value?.trim() || undefined;
}

function categoryDescription(value: string | undefined) {
  return (
    textOrUndefined(value) ??
    "Category description can be reviewed with the team during quote follow-up."
  );
}

function publicListingCountText(count: number) {
  return `${count} public ${count === 1 ? "listing" : "listings"}`;
}

export function CategoriesPageContent({
  catalogue
}: {
  catalogue: PublicCatalogue;
}) {
  if (catalogue.categories.length === 0) {
    return (
      <section className="section">
        <div className="page-title">
          <h1>Rental categories</h1>
          <p>
            Browse public furniture and event rental categories when catalogue
            data is available, or send an enquiry with the setup context you
            already know.
          </p>
        </div>
        <section className="route-card" aria-label="Category recovery">
          <h2>No public categories available</h2>
          <p>No public categories are available right now. Browse listings or send a quote enquiry with the event-use context, quantities, and rental unit notes you have; rental fit is reviewed directly by the team.</p>
        </section>
        <div className="hero__actions">
          <Link className="button button--secondary" href="/catalogue">
            View catalogue
          </Link>
          <Link className="button button--secondary" href="/listings">
            Browse listings
          </Link>
          <Link className="button" href="/quote">
            Request a quote
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Public catalogue</p>
        <h1>Rental categories</h1>
        <p>
          Start from seating, lounge, and event setup categories, compare
          listings in each category, then send an enquiry for the rental pieces
          that may suit your event. Rental fit is reviewed directly
          by the team.
        </p>
      </div>

      <div className="catalogue-grid">
        {catalogue.categories.map((category) => {
          const categoryListings = catalogue.products.filter(
            (product) => product.categoryId === category.id
          );

          return (
            <article className="route-card" key={category.id}>
              <p className="eyebrow">
                {publicListingCountText(categoryListings.length)}
              </p>
              <h2>{category.name}</h2>
              <p>{categoryDescription(category.description)}</p>
              <div className="catalogue-card__actions">
                <Link
                  className="card-link"
                  href={`/listings?category=${encodeURIComponent(category.slug)}`}
                >
                  Compare {category.name} listings
                </Link>
                <Link className="card-link" href="/quote">
                  Send an enquiry
                </Link>
              </div>
              {categoryListings.length > 0 ? (
                <ul className="category-listings">
                  {categoryListings.slice(0, 3).map((product) => (
                    <li key={product.id}>
                      <Link aria-label={`View ${product.name} listing in ${category.name}`} href={`/listings/${product.slug}`}>
                        {product.name}
                      </Link>
                      <Link aria-label={`Send enquiry for ${product.name}`} href={getQuoteHrefForListing(product.slug)}>
                        Enquire
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p>
                    No public listings are available in this category yet.
                    Browse listings, compare event setup guidance, or send a
                    quote request so the team can suggest a rental direction.
                  </p>
                  <div className="catalogue-card__actions">
                    <Link className="card-link" href="/listings">
                      Browse listings
                    </Link>
                    <Link className="card-link" href="/events">
                      Browse event guidance
                    </Link>
                    <Link className="card-link" href="/quote">
                      Start a rental enquiry
                    </Link>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
      <div className="hero__actions">
        <Link className="button button--secondary" href="/listings">
          Browse listings
        </Link>
        <Link className="button" href="/quote">
          Send an enquiry
        </Link>
      </div>
    </section>
  );
}

export default async function CategoriesPage() {
  const catalogue = await getPublicCatalogue();

  return <CategoriesPageContent catalogue={catalogue} />;
}
