import Link from "next/link";

export default function CatalogueListingNotFound() {
  return (
    <div className="section-padding">
      <div className="container">
        <div className="premium-card" style={{ maxWidth: '600px', margin: '80px auto', padding: '64px 32px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox={["0","0","24","24"].join(" ")} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 24px', color: 'var(--accent)', display: 'block' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontFamily: 'var(--font-serif)' }}>Item Unavailable</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '32px' }}>
            This rental item is not available publicly right now. Browse the
            catalogue or send a general enquiry with the rental details you have in mind.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="v3-btn v3-btn--outline" href="/catalogue">
              Back to Catalogue
            </Link>
            <Link className="v3-btn v3-btn--primary" href="/quote">
              Request Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
