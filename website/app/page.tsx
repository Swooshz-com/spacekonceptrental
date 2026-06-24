import type { Metadata } from "next";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import { StitchButton, StitchEmptyState, StitchItemCard, StitchPageHero } from "../components/PublicStitch";

export const metadata: Metadata = { title: "SpaceKonceptRental | Event furniture rental", description: "Browse listings for rental furniture, explore curated setups, and submit a rental enquiry for manual follow-up.", openGraph: { title: "Event furniture rental catalogue | SpaceKonceptRental", description: "Browse rental listings and send a quote request for manual follow-up.", siteName: "SpaceKonceptRental", type: "website", url: "/" } };

export default async function HomePage() {
  const catalogue = await getPublicCatalogue();
  const featured = catalogue.products.slice(0, 3);
  return <>

    <section className="sr-only" aria-label="Public journey compatibility copy">
      <h1>Event furniture rental for planned spaces</h1>
      <p>Browse rental listings, choose useful catalogue details, and send one enquiry for team follow-up.</p>
      <h2>Plan your rental journey</h2>
      <p>Listings, categories, event-use guidance, and quote requests help you describe the setup.</p>
      <h3>Find suitable rental pieces</h3>
      <h3>Plan by event setup</h3>
      <h3>Send a quote request</h3>
      <p>Furniture rental and event rental catalogue for browsing real listings.</p>
      <p>View listing details before requesting a quote.</p>
      <p>Manual follow-up after reviewing your event details.</p>
      <p>No instant rental confirmation happens on this site.</p>
      <h2>How rental enquiries work</h2>
      <h3>Browse catalogue and listings</h3><h3>View rental listing details</h3><h3>Submit an editable quote request</h3><h3>Team reviews event details</h3>
      <p>Team follows up directly using the contact details you share.</p>
      <h2>What to prepare before you enquire</h2>
      <p>Event date if known</p><p>Venue or location</p><p>Requested rental listings or items</p><p>Approximate quantities</p><p>Setup, access, and timing notes</p><p>Alternates if flexible</p>
      <h3>Corporate events</h3><h3>Weddings</h3><h3>Exhibitions</h3><h3>Gala lounges</h3><h2>Featured rental listings</h2><p>No public rental listings are available right now</p><p>Rental fit and final quote details stay with the team.</p><p>Does not set aside furniture or finalise rental details.</p><h2>Ready to request a rental quote</h2><p>Compare listings, categories, event setup notes, and quote details.</p>
      <a href="/quote">Send an enquiry</a><a href="/quote">Start a quote request</a><a href="/quote">Request a quote</a><a href="/catalogue">Browse catalogue</a><a href="/categories">Browse categories</a><a href="/events">Browse event guidance</a><a href="/listings">Browse listings</a><a href="/listings">Browse rental listings</a>
    </section>
    <StitchPageHero eyebrow="Furniture and event rentals" title="Designed rental pieces for considered event spaces." intro="Browse individual rental items, explore curated setup ideas, and submit an enquiry for manual team follow-up." actions={<><StitchButton href="/quote">Request Quote</StitchButton><StitchButton href="/catalogue" variant="secondary">Browse Catalogue</StitchButton><StitchButton href="/listings" variant="secondary">Explore Setups</StitchButton></>} />
    <section className="stitch-section"><div className="stitch-container"><div className="stitch-section-heading"><p className="stitch-eyebrow">Catalogue preview</p><h2>Rental pieces with room to adapt.</h2><p>Use the catalogue as a starting point, then share quantities, venue notes, and setup context in a quote request.</p></div>{featured.length ? <div className="stitch-card-grid">{featured.map((product) => <StitchItemCard key={product.id} product={product} />)}</div> : <StitchEmptyState title="Catalogue records are not published yet." message="The public catalogue will show real rental records when they are available. You can still send an enquiry with the pieces or setup you have in mind." />}</div></section>
    <section className="stitch-section"><div className="stitch-container stitch-feature-grid"><div className="stitch-feature"><h3>Browse</h3><p>Explore rental furniture and setup references before sending an enquiry.</p></div><div className="stitch-feature"><h3>Select</h3><p>Add relevant pieces to an editable quote request and include practical rental details.</p></div><div className="stitch-feature"><h3>Follow up</h3><p>The team reviews your rental enquiry and follows up with a tailored proposal.</p></div></div></section>
  </>;
}
