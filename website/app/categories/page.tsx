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
            data is available.
          </p>
        </div>
        <p>No public categories are available right now.</p>
        <div className="hero__actions">
          <Link className="button button--secondary" href="/catalogue">
            Browse catalogue
          </Link>
          <Link className="button button--secondary" href="/listings">
            Browse all listings
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
          Start from seating, lounge, and event setup categories, then send an
          enquiry for the listings that suit your event.
        </p>
      </div>

      <div className="catalogue-grid">
        {catalogue.categories.map((category) => {
          const categoryListings = catalogue.products.filter(
            (product) => product.categoryId === category.id
          );

          return (
            <article className="route-card" key={category.id}>
              <p className="eyebrow">{categoryListings.length} listings</p>
              <h2>{category.name}</h2>
              {category.description ? <p>{category.description}</p> : null}
              <div className="catalogue-card__actions">
                <Link
                  className="card-link"
                  href={`/listings?category=${encodeURIComponent(category.slug)}`}
                >
                  View category listings
                </Link>
                <Link className="card-link" href="/quote">
                  Start category enquiry
                </Link>
              </div>
              {categoryListings.length > 0 ? (
                <ul className="category-listings">
                  {categoryListings.slice(0, 3).map((product) => (
                    <li key={product.id}>
                      <Link href={`/listings/${product.slug}`}>
                        {product.name}
                      </Link>
                      <Link href={getQuoteHrefForListing(product.slug)}>
                        Enquire
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p>
                    No public listings are available in this category yet.
                    Browse all listings or send a quote request and the team can
                    suggest an event setup.
                  </p>
                  <div className="catalogue-card__actions">
                    <Link className="card-link" href="/listings">
                      Browse all listings
                    </Link>
                    <Link className="card-link" href="/quote">
                      Start a quote request
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
          Browse all listings
        </Link>
        <Link className="button" href="/quote">
          Send a general enquiry
        </Link>
      </div>
    </section>
  );
}

export default async function CategoriesPage() {
  const catalogue = await getPublicCatalogue();

  return <CategoriesPageContent catalogue={catalogue} />;
}
