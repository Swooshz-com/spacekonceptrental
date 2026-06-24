import type { Metadata } from "next";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import { StitchButton, StitchEmptyState, StitchItemCard, StitchPageHero } from "../components/PublicStitch";

export const metadata: Metadata = { title: "SpaceKonceptRental | Furniture and event rentals", description: "Browse rental furniture, explore curated setups, and submit a rental enquiry." };

export default async function HomePage() {
  const catalogue = await getPublicCatalogue();
  const featured = catalogue.products.slice(0, 3);
  return <>
    <StitchPageHero eyebrow="Furniture and event rentals" title="Designed rental pieces for considered event spaces." intro="Browse individual rental items, explore curated setup ideas, and submit an enquiry for manual team follow-up." actions={<><StitchButton href="/quote">Request Quote</StitchButton><StitchButton href="/catalogue" variant="secondary">Browse Catalogue</StitchButton><StitchButton href="/listings" variant="secondary">Explore Setups</StitchButton></>} />
    <section className="stitch-section"><div className="stitch-container"><div className="stitch-section-heading"><p className="stitch-eyebrow">Catalogue preview</p><h2>Rental pieces with room to adapt.</h2><p>Use the catalogue as a starting point, then share quantities, venue notes, and setup context in a quote request.</p></div>{featured.length ? <div className="stitch-card-grid">{featured.map((product) => <StitchItemCard key={product.id} product={product} />)}</div> : <StitchEmptyState title="Catalogue records are not published yet." message="The public catalogue will show real rental records when they are available. You can still send an enquiry with the pieces or setup you have in mind." />}</div></section>
    <section className="stitch-section"><div className="stitch-container stitch-feature-grid"><div className="stitch-feature"><h3>Browse</h3><p>Explore rental furniture and setup references before sending an enquiry.</p></div><div className="stitch-feature"><h3>Select</h3><p>Add relevant pieces to an editable quote request and include practical rental details.</p></div><div className="stitch-feature"><h3>Follow up</h3><p>The team reviews your rental enquiry and follows up with a tailored proposal.</p></div></div></section>
  </>;
}
