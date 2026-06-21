import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import corporateImage from "../../assets/images/event_corporate.png";
import sofaImage from "../../assets/images/product_sofa.png";

export const metadata: Metadata = {
  title: "About Us | Space Koncept Rental",
  description: "Learn more about Space Koncept Rental, a premium event furniture rental service providing curated setups for corporate and private events.",
};

export default function AboutPage() {
  return (
    <div className="section-padding">
      <div className="container">
        <div className="v3-page-header" style={{ maxWidth: '800px', margin: '0 auto 80px', textAlign: 'center' }}>
          <h1>Elevating Event Spaces</h1>
          <p>
            Space Koncept Rental provides curated event-ready furniture designed for events, exhibitions, launches, activations, styling, weddings, and corporate setups.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'center', marginBottom: '96px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Flexible Rental Selection</h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '24px' }}>
              We offer both individual items and prebuilt setups to help you build your ideal space. Whether you need a single statement piece or a complete cohesive look, our catalogue is designed to support your vision.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '1.125rem', lineHeight: 1.8 }}>
              Browse our selection online and add items to your Quote List to start planning.
            </p>
            <Link href="/catalogue" className="v3-btn v3-btn--outline" style={{ marginTop: '32px' }}>
              Explore Catalogue
            </Link>
          </div>
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/5', position: 'relative' }}>
            <Image 
              src={corporateImage} 
              alt="Corporate event setup" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'center', marginBottom: '96px' }}>
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/5', position: 'relative', order: -1 }}>
            <Image 
              src={sofaImage} 
              alt="Event lounge furniture" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Quote-Led Rental Planning</h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '24px' }}>
              To ensure we meet your specific event requirements, we operate a quote-led enquiry process. Submit your selected items along with your event details, and our team will provide a tailored proposal.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '1.125rem', lineHeight: 1.8 }}>
              Every enquiry receives manual team follow-up to discuss your setup and ensure all practical details are covered.
            </p>
            <Link href="/contact" className="v3-btn v3-btn--outline" style={{ marginTop: '32px' }}>
              Contact Our Team
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
