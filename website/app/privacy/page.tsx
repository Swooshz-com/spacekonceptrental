import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Space Koncept Rentals",
  description:
    "How Space Koncept Rentals handles quote enquiry and chat details for manual follow-up."
};

export default function PrivacyPage() {
  return (
    <>
      <section className="premium-page-header">
        <div className="premium-container">
          <h1 className="premium-title-hero">Privacy Policy</h1>
          <p className="premium-subtitle" style={{ color: '#cbd5e1' }}>
            This page explains the practical MVP privacy posture for browsing rental listings, sending quote requests, and using the chat widget.
          </p>
        </div>
      </section>

      <section className="premium-section" style={{ paddingTop: '40px' }}>
        <div className="premium-container">
          <div className="premium-grid">
            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Data collection</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>What you share</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Quote requests may ask for your name, email or phone, event date, venue or location, requested listings or items, quantities, and setup notes. Chat messages may include rental questions and page context needed to answer them.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Data usage</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>How details are used</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                The team uses quote request details for manual follow-up about the rental enquiry. Chat availability depends on the configured chat provider, and chat responses are for browsing guidance only.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Limitations</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>What is not promised</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                This website does not provide an instant quote, does not set aside furniture, does not collect money, and does not finalise rental details online.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Security</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>Care with logs</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Unexpected errors may create a support reference in privacy-minimised server logs. Those logs are intended for support tracing and should not include raw quote details, raw chat messages, secrets, provider URLs, or private payloads.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Consent</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>Your choices</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Share only the event and rental details needed for follow-up. If you prefer not to use chat, send a quote request through the form and include the details you want the team to review.
              </p>
            </article>

            <article className="premium-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Agreement</div>
              <h2 className="premium-title-card" style={{ fontSize: '20px', marginBottom: '16px' }}>Terms</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Review the site expectations and rental enquiry boundaries in the{" "}
                <Link href="/terms" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Terms of Use</Link>.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
