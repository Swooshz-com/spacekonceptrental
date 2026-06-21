import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import corporateImage from "../../assets/images/event_corporate.png";
import sofaImage from "../../assets/images/product_sofa.png";

export const metadata: Metadata = {
  title: "About Us | Space Koncept Rentals",
  description: "Learn more about Space Koncept Rentals, a premium event furniture rental service providing curated setups for corporate and private events.",
};

export default function AboutPage() {
  return (
    <div className="section-padding">
      <div className="container">
        <div className="v3-page-header" style={{ maxWidth: '800px', margin: '0 auto 80px', textAlign: 'center' }}>
          <h1>Elevating Event Spaces</h1>
          <p>
            Space Koncept Rentals provides premium furniture rental solutions designed to transform any venue into a cohesive, stylish, and comfortable environment for your guests.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'center', marginBottom: '96px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Curated Collections</h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '24px' }}>
              We believe that furniture is more than just functional—it sets the tone for your entire event. Our catalogue is carefully curated to ensure that every piece meets our high standards for design, quality, and comfort.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '1.125rem', lineHeight: 1.8 }}>
              From sleek corporate setups to inviting lounge areas, our inventory is versatile enough to suit any aesthetic while maintaining a cohesive look.
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
              alt="Premium lounge furniture" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Seamless Service</h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '24px' }}>
              Planning an event is complex enough. We aim to make the furniture rental process as smooth and straightforward as possible.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '1.125rem', lineHeight: 1.8 }}>
              Our team works closely with event planners, producers, and venues to ensure timely delivery, professional setup, and efficient collection, so you can focus on the event itself.
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
