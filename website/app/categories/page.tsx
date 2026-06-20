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
  return `${count} ${count === 1 ? "listing" : "listings"}`;
}

export function CategoriesPageContent({
  catalogue
}: {
  catalogue: PublicCatalogue;
}) {
  if (catalogue.categories.length === 0) {
    return (
      <>
        <section className="premium-page-header">
          <div className="premium-container">
            <h1 className="premium-title-hero">Rental Categories</h1>
            <p className="premium-subtitle" style={{ color: '#cbd5e1' }}>
              Browse public furniture and event rental categories or send an enquiry with your setup context.
            </p>
          </div>
        </section>
        <section className="premium-section" style={{ paddingTop: '40px' }}>
          <div className="premium-container">
            <div className="premium-card" style={{ padding: '64px', textAlign: 'center' }}>
              <h2 className="premium-title-section" style={{ fontSize: '24px' }}>No categories available</h2>
              <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 32px' }}>
                No public categories are available right now. Browse listings or send a quote enquiry with the event-use context, quantities, and rental unit notes you have.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <Link className="premium-button premium-button--secondary" href="/catalogue">
                  View catalogue
                </Link>
                <Link className="premium-button premium-button--primary" href="/quote">
                  Request a quote
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="premium-page-header">
        <div className="premium-container">
          <h1 className="premium-title-hero">Rental Categories</h1>
          <p className="premium-subtitle" style={{ color: '#cbd5e1' }}>
            Explore our curated collections. Compare listings across seating, lounges, and event setups, then send an enquiry for the pieces that suit your vision.
          </p>
        </div>
      </section>

      <section className="premium-section" style={{ paddingTop: '40px' }}>
        <div className="premium-container">
          <div className="premium-grid-2col">
            {catalogue.categories.map((category) => {
              const categoryListings = catalogue.products.filter(
                (product) => product.categoryId === category.id
              );

              return (
                <article className="premium-card premium-card--tall" key={category.id} style={{ display: 'flex', flexDirection: 'column', padding: 0, justifyContent: 'flex-start' }}>
                  <div style={{ padding: '40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                      {publicListingCountText(categoryListings.length)}
                    </div>
                    <h2 className="premium-title-card" style={{ fontSize: '24px', marginBottom: '12px' }}>{category.name}</h2>
                    <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>{categoryDescription(category.description)}</p>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      <Link
                        className="premium-button premium-button--secondary"
                        style={{ flex: 1, padding: '0 16px', fontSize: '13px', height: '36px' }}
                        href={`/listings?category=${encodeURIComponent(category.slug)}`}
                      >
                        Compare
                      </Link>
                      <Link
                        className="premium-button premium-button--primary"
                        style={{ flex: 1, padding: '0 16px', fontSize: '13px', height: '36px' }}
                        href="/quote"
                      >
                        Enquire
                      </Link>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                      {categoryListings.length > 0 ? (
                        <>
                          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Featured Items</div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {categoryListings.slice(0, 3).map((product) => (
                              <li key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Link 
                                  href={`/listings/${product.slug}`}
                                  style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '16px' }}
                                >
                                  {product.name}
                                </Link>
                                <Link 
                                  href={getQuoteHrefForListing(product.slug)}
                                  style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', flexShrink: 0 }}
                                >
                                  Request
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                          No public listings available in this category. Browse all listings to find options.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '64px' }}>
            <Link className="premium-button premium-button--secondary" href="/listings">
              Browse all listings
            </Link>
            <Link className="premium-button premium-button--primary" href="/quote">
              Send an enquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default async function CategoriesPage() {
  const catalogue = await getPublicCatalogue();

  return <CategoriesPageContent catalogue={catalogue} />;
}
