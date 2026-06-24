import type { Metadata } from "next";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { StitchEmptyState, StitchItemCard, StitchPageHero } from "../../components/PublicStitch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Setups | SpaceKonceptRental", description: "Explore curated rental setups and submit an enquiry." };

export default async function ListingsPage() {
  const catalogue = await getPublicCatalogue();
  return <><StitchPageHero eyebrow="Setups" title="Curated setup directions for rental enquiries." intro="Use setup references to describe the rental mood, scale, and event context you want the team to review." />
  <section className="stitch-section"><div className="stitch-container">{catalogue.products.length ? <div className="stitch-card-grid">{catalogue.products.map((product) => <StitchItemCard key={product.id} product={product} detailBasePath="/listings" />)}</div> : <StitchEmptyState title="No public setup records are available yet." message="Real setup records will appear here once published. You can still request a proposal with your event details and rental direction." />}</div></section></>;
}
