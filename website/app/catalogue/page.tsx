import type { Metadata } from "next";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import type { PublicCatalogue } from "../../lib/catalogue/types";
import { StitchEmptyState, StitchItemCard, StitchPageHero } from "../../components/PublicStitch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Catalogue | SpaceKonceptRental", description: "Browse individual rental furniture and item records." };
export const eventUseFilters = [
  { slug: "reception-lounge", label: "Reception setup", summary: "Soft seating and conversation areas for arrival plans.", terms: ["reception", "lounge", "soft", "side", "networking", "vip"] },
  { slug: "conference-seating", label: "Conference idea", summary: "Seating and registration-area pieces for talks or sessions.", terms: ["conference", "seminar", "chair", "seating", "cocktail", "registration"] },
  { slug: "brand-activation", label: "Activation idea", summary: "Display-friendly furniture for demos, pop-ups, or photos.", terms: ["brand", "activation", "display", "demo", "pop", "photo", "showcase"] }
] as const;

export function CataloguePageContent({ catalogue, detailBasePath = "/catalogue", emptyMessage = "Real catalogue records will appear here once published. Send a rental enquiry if you already know the pieces or setup direction you need.", intro = "Browse furniture and rental pieces, then add relevant items to an editable quote request.", title = "Individual rental items for event spaces." }: { catalogue: PublicCatalogue; detailBasePath?: string; emptyMessage?: string; intro?: string; title?: string; activeCategoryName?: string; activeCategorySlug?: string; activeEventLabel?: string; activeEventSlug?: string; activeSearch?: string; listingBasePath?: string }) {
  return <><StitchPageHero eyebrow={detailBasePath === "/listings" ? "Setups" : "Catalogue"} title={title} intro={intro} />
  <section className="stitch-section"><div className="stitch-container">{catalogue.products.length ? <div className="stitch-card-grid">{catalogue.products.map((product) => <StitchItemCard key={product.id} product={product} detailBasePath={detailBasePath} />)}</div> : <StitchEmptyState title={detailBasePath === "/listings" ? "No public setup records are available yet." : "No public catalogue items are available yet."} message={emptyMessage} />}</div></section></>;
}

export default async function CataloguePage() { const catalogue = await getPublicCatalogue(); return <CataloguePageContent catalogue={catalogue} />; }
