import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section-padding" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Space Koncept Rental</p>
        <h1 style={{ fontSize: '48px', marginBottom: '24px' }}>Page unavailable</h1>
        <p style={{ color: 'var(--muted)', fontSize: '18px', lineHeight: 1.6, marginBottom: '40px' }}>
          This page is not available right now. Browse current rental listings
          or send a quote enquiry with event details so the team can help.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="v3-btn v3-btn--outline" href="/listings">
            Browse Setups
          </Link>
          <Link className="v3-btn v3-btn--outline" href="/catalogue">
            Browse Catalogue
          </Link>
          <Link className="v3-btn v3-btn--primary" href="/quote">
            Request a Quote
          </Link>
        </div>
      </div>
    </section>
  );
}
