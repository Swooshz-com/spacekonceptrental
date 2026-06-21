import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Setup Planning | Space Koncept Rental",
  description:
    "Explore our setups and catalogue to plan your next corporate event, exhibition, gala, or wedding."
};

export default function EventsPage() {
  return (
    <div className="section-padding">
      <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
        <div className="v3-page-header" style={{ marginBottom: '64px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Event Planning</div>
          <h1>Setting the scene for your event</h1>
          <p style={{ margin: '0 auto' }}>
            Whether you are planning a corporate reception, an exhibition booth, a gala evening, or a wedding, our curated inventory is designed to adapt to your specific venue and guest flow.
          </p>
        </div>

        <div className="v3-info-card" style={{ textAlign: 'left', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--accent-dark)' }}>How to plan your rental</h2>
          <p style={{ fontSize: '1.125rem', color: 'var(--muted)', marginBottom: '32px' }}>
            We organize our inventory to help you find exactly what you need quickly. Start by browsing our prebuilt event stacks or search for individual pieces.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Setups</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                Prebuilt furniture stacks designed for common event zones like lounges, reception areas, and dining.
              </p>
              <Link href="/listings" className="v3-btn v3-btn--outline" style={{ width: '100%' }}>
                Browse Setups
              </Link>
            </div>

            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Catalogue</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                Individual rental items. Add chairs, tables, and decor to your Quote List to build your own layout.
              </p>
              <Link href="/catalogue" className="v3-btn v3-btn--outline" style={{ width: '100%' }}>
                Browse Catalogue
              </Link>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            Already know what you need or want the team's advice?
          </p>
          <Link href="/quote" className="v3-btn v3-btn--primary">
            Request a Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
