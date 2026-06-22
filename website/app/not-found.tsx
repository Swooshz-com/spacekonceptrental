import Link from "next/link";

export default function NotFound() {
  return (
    <section className="premium-section" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="premium-container" style={{ textAlign: 'center', maxWidth: '600px' }}>
        <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0, marginBottom: '16px' }}>Space Koncept Rental</p>
        <h1 className="premium-title" style={{ fontSize: '48px', marginBottom: '24px' }}>Page unavailable</h1>
        <p style={{ color: 'var(--muted)', fontSize: '18px', lineHeight: 1.6, marginBottom: '40px' }}>
          This page is not available right now. Browse current rental listings
          or send a quote enquiry with event details so the team can help.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="premium-button premium-button--secondary" href="/listings">
            Browse listings
          </Link>
          <Link className="premium-button premium-button--secondary" href="/categories">
            Browse categories
          </Link>
          <Link className="premium-button premium-button--secondary" href="/events">
            Plan event setups
          </Link>
          <Link className="premium-button premium-button--primary" href="/quote">
            Request a quote
          </Link>
        </div>
      </div>
    </section>
  );
}
