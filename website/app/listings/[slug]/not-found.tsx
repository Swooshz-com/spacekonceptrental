import Link from "next/link";

export default function ListingNotFound() {
  return (
    <div className="section-padding">
      <div className="container">
        <div className="v3-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 24px', color: 'var(--muted)', display: 'block' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Setup Unavailable</h2>
          <p>
            This curated setup is not available publicly right now. Browse
            current setups or send a general enquiry with the rental details you have in mind.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
            <Link className="v3-btn v3-btn--outline" href="/listings">
              View Setups
            </Link>
            <Link className="v3-btn v3-btn--primary" href="/quote">
              Request a Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
