import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Space Koncept Rental",
  description: "Get in touch with Space Koncept Rental for general enquiries or to discuss your upcoming event.",
};

export default function ContactPage() {
  return (
    <div className="section-padding">
      <div className="container">
        <div className="v3-page-header" style={{ maxWidth: '800px', margin: '0 auto 64px', textAlign: 'center' }}>
          <h1>Get in touch</h1>
          <p>
            Whether you have a general enquiry or need advice on event setups, our team is here to help.
          </p>
        </div>

        <div className="v3-quote-layout">
          {/* Contact Details */}
          <div className="v3-quote-main" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '32px' }}>Contact the Team</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <p style={{ fontSize: '1.125rem', lineHeight: 1.6, margin: 0, color: 'var(--muted)' }}>
                  Our team reviews all quote requests and event enquiries manually to ensure the best fit for your needs. We are here to help with catalogue questions or setup advice.
                </p>
                <p style={{ fontSize: '1.125rem', lineHeight: 1.6, margin: 0, color: 'var(--muted)' }}>
                  To get started, browse our catalogue or prebuilt setups, add items to your Quote List, and submit your enquiry. The team will follow up directly to discuss your event details.
                </p>
              </div>
            </div>
          </div>

          {/* Context Sidebar */}
          <div className="v3-quote-sidebar">
            <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Rental Quotes</div>
              <h3>Need a quote?</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
                For event furniture proposals, please use our quote request system. Add items to your Quote List while browsing.
              </p>
              <a href="/quote" className="v3-btn v3-btn--outline" style={{ width: '100%' }}>
                Request Quote
              </a>
            </div>
            
            <div className="premium-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Manual Follow-up</div>
              <h3>Enquiry Review</h3>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                Our team manually reviews general enquiries and quote requests to determine rental fit. We will follow up using the contact details provided in your request.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
