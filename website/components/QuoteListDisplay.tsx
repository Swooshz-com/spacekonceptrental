"use client";

import { useQuoteList } from "./QuoteListContext";
import Link from "next/link";

export default function QuoteListDisplay() {
  const { items, removeItem } = useQuoteList();

  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--surface-alt)', padding: '48px 32px', borderRadius: 'var(--radius-lg)', textAlign: 'center', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>Your Quote List is empty.</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
          You can add individual rental items or prebuilt setups to your Quote List to enquire about availability and receive a proposal.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/catalogue" className="v3-btn v3-btn--outline">
            Browse Catalogue
          </Link>
          <Link href="/listings" className="v3-btn v3-btn--outline">
            Explore Setups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-card" style={{ padding: '32px', marginBottom: '32px' }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
        Quote List ({items.length})
      </div>
      <h3 className="premium-title-card" style={{ marginBottom: '24px' }}>Selected items for enquiry</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {items.map(item => (
          <div key={item.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--surface-strong)', fontSize: '15px' }}>{item.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
                Ref: {item.slug}
                {item.categoryName && ` • ${item.categoryName}`}
                {item.rentalUnit && ` • ${item.rentalUnit}`}
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => removeItem(item.slug)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '6px 12px', transition: 'all 0.2s' }}
              onMouseOver={e => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseOut={e => {
                e.currentTarget.style.color = 'var(--muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '24px', fontSize: '14px', color: 'var(--muted)', fontStyle: 'italic' }}>
        These items have been added to your request form below. Feel free to adjust quantities or remove items before submitting.
      </div>
    </div>
  );
}
