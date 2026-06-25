import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | SpaceKonceptRental",
  description:
    "Simple Terms of Use for browsing rental listings and sending quote enquiries."
};

export default function TermsPage() {
  return (
    <>
      <section className="premium-page-header">
        <div className="premium-container">
          <h1 className="premium-title-hero">Terms of Use</h1>
          <p className="premium-subtitle" style={{ color: '#cbd5e1' }}>
            These terms describe the current MVP website experience for browsing furniture rental listings and sending quote enquiries.
          </p>
        </div>
      </section>

      <section className="premium-section" style={{ paddingTop: '40px' }}>
        <div className="premium-container">
          <div className="premium-grid">
            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Discovery</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>Browsing listings</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Catalogue and listing pages are browsing aids. Listing names, descriptions, images, categories, and rental units help you prepare an enquiry, but the team reviews fit and details directly.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Process</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>Quote enquiries</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                A quote request starts manual follow-up by the business. It does not create an instant quote, does not set aside furniture, and does not finalise rental details online.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Support</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>Chat guidance</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Chat access depends on the configured chat provider. Chat replies are guidance for browsing and preparing an enquiry, not a final rental decision.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Requirements</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>Information accuracy</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Share practical event details such as date, venue or location, quantities, setup, access, timing, and alternates. The team may ask follow-up questions before quote details are ready.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Conduct</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>Use of the site</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Use the site for normal furniture and event rental enquiries. Do not submit secrets, private credentials, or unrelated sensitive information through public forms or chat.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Data handling</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>Privacy</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                The{" "}
                <Link href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link> explains how enquiry and chat details are handled for this MVP website.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
