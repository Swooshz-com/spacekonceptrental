import type { Metadata } from "next";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { StitchEmptyState, StitchItemCard, StitchPageHero } from "../../components/PublicStitch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Setups | SpaceKonceptRental", description: "Explore furniture listing setups and request an enquiry.", openGraph: { title: "Furniture listing setups | SpaceKonceptRental", description: "Explore public setup listings and request an enquiry.", siteName: "SpaceKonceptRental", type: "website", url: "/listings" } };

export default async function ListingsPage() {
  const catalogue = await getPublicCatalogue();
  return <><StitchPageHero eyebrow="Setups" title="Rental listings" intro="Use setup references to describe the rental mood, scale, and event context you want the team to review." />
  <section className="stitch-section"><div className="stitch-container">{catalogue.products.length ? <div className="stitch-card-grid">{catalogue.products.map((product) => <StitchItemCard key={product.id} product={product} detailBasePath="/listings" />)}</div> : <StitchEmptyState title="No public rental listings match this view" message="Real setup records will appear here once published. You can still request a proposal with your event details and rental direction." />}</div></section></>;
}
