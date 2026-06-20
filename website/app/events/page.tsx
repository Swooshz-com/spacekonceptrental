import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import corporateImage from "../../assets/images/event_corporate.png";
import exhibitionImage from "../../assets/images/event_exhibition.png";
import galaImage from "../../assets/images/event_gala.png";
import weddingImage from "../../assets/images/event_wedding.png";

export const metadata: Metadata = {
  title: "Event setups and rental use cases | Space Koncept Rentals",
  description:
    "Explore event setup guidance, browse rental listings, and send a quote request with setup notes."
};

const eventUseCases = [
  {
    slug: "corporate-receptions",
    title: "Corporate receptions",
    description: "Registration zones, lounge corners, and networking layouts.",
    image: corporateImage
  },
  {
    slug: "exhibitions",
    title: "Exhibitions",
    description: "Booth seating, discussion tables, and showcase spaces.",
    image: exhibitionImage
  },
  {
    slug: "gala-evenings",
    title: "Gala evenings",
    description: "Arrival lounges, cocktail seating, and polished guest areas.",
    image: galaImage
  },
  {
    slug: "weddings",
    title: "Weddings",
    description: "Elegant reception seating, ceremony staging, and bridal lounge setups.",
    image: weddingImage
  },
  {
    slug: "vip-lounges",
    title: "VIP Lounges",
    description: "Exclusive lounge furniture, premium seating, and intimate gathering areas.",
    image: galaImage
  },
  {
    slug: "product-launches",
    title: "Product Launches",
    description: "Display counters, presentation staging, and branded event furniture.",
    image: corporateImage
  }
];

const setupSteps = [
  "Match the setup type to the event format and guest flow.",
  "Capture quantities and placement notes for the requested furniture.",
  "Send one quote enquiry with listing, category, quantity, and setup notes so the team can review the event context."
];

export default function EventsPage() {
  return (
    <>
      <section className="premium-page-header">
        <div className="premium-container">
          <h1 className="premium-title-hero">Event Setups</h1>
          <p className="premium-subtitle" style={{ color: '#cbd5e1' }}>
            Explore furniture rentals and styled setups for common event formats. Compare guidance with our catalogue before sending a quote request.
          </p>
        </div>
      </section>

      <section className="premium-section" style={{ paddingTop: '40px' }}>
        <div className="premium-container">
          <div className="premium-grid-2col">
            {eventUseCases.map((item) => (
              <Link href={`/listings?search=${item.slug}`} className="premium-event-card" key={item.title}>
                <Image alt={`${item.title} event furniture setup`} src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                <div className="premium-event-card__overlay">
                  <h2 className="premium-event-card__title">{item.title}</h2>
                  <p style={{ color: '#e2e8f0', margin: '0 0 16px 0', fontSize: '15px' }}>{item.description}</p>
                  <div className="premium-event-card__arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section premium-section--alternate">
        <div className="premium-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Use-case planning</div>
              <h2 className="premium-title-section" style={{ marginBottom: '16px' }}>Plan an event setup</h2>
              <p className="premium-subtitle" style={{ marginBottom: '40px' }}>
                These routes are starting points for a rental enquiry, not a fixed package. They do not set aside furniture or finalise rental details. Keep the notes practical and our team will review the fit.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', textAlign: 'left', marginBottom: '48px' }}>
                {setupSteps.map((step, i) => (
                  <div key={step} className="premium-card" style={{ padding: '24px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', marginBottom: '16px' }}>
                      {i + 1}
                    </div>
                    <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.6 }}>{step}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link className="premium-button premium-button--secondary" href="/categories">
                  Browse categories
                </Link>
                <Link className="premium-button premium-button--secondary" href="/listings">
                  Browse listings
                </Link>
                <Link className="premium-button premium-button--primary" href="/quote">
                  Send an enquiry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
