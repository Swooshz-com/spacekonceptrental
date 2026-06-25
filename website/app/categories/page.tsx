import Link from "next/link";
import type { Metadata } from "next";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import type { PublicCatalogue } from "../../lib/catalogue/types";
import { StitchEmptyState, StitchItemCard, StitchPageIntro } from "../../components/PublicStitch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rental categories | SpaceKonceptRental", description: "Browse public furniture and event rental categories and send a quote enquiry to SpaceKonceptRental." };

export function CategoriesPageContent({ catalogue }: { catalogue: PublicCatalogue }) {
  return <><section className="stitch-catalogue-hero"><div className="stitch-container"><StitchPageIntro eyebrow="Categories" title="Browse by category." intro="Explore public furniture categories, then review related listings or send an enquiry with your setup context." /></div></section><section className="stitch-section"><div className="stitch-container">{catalogue.categories.length ? <div className="stitch-card-grid">{catalogue.categories.map((category) => { const categoryListings = catalogue.products.filter((product) => product.categoryId === category.id); return <article className="stitch-card" key={category.id}><div className="stitch-card__body"><p className="stitch-card__meta">{categoryListings.length} {categoryListings.length === 1 ? "listing" : "listings"}</p><h2>{category.name}</h2><p>{category.description?.trim() || "Category context can be reviewed with the team during quote follow-up."}</p><div className="stitch-card__actions"><Link className="stitch-link-button" href={`/listings?category=${encodeURIComponent(category.slug)}`}>Compare</Link><Link className="stitch-link-button stitch-link-button--quiet" href="/quote">Send an enquiry</Link></div></div></article>; })}</div> : <StitchEmptyState title="No categories available" message="No public categories are available right now. Browse listings or send a quote enquiry with the event-use context, quantities, and rental unit notes you have." actionHref="/quote" actionLabel="Request Quote" />}</div></section>{catalogue.products.length ? <section className="stitch-section stitch-section--tonal"><div className="stitch-container"><div className="stitch-section-heading"><p className="stitch-eyebrow">Featured by category</p><h2>Review public listings before sending an enquiry.</h2></div><div className="stitch-card-grid">{catalogue.products.slice(0, 3).map((product) => <StitchItemCard key={product.id} product={product} />)}</div></div></section> : null}</>;
}

export default async function CategoriesPage() {
  const catalogue = await getPublicCatalogue();
  return <CategoriesPageContent catalogue={catalogue} />;
}
