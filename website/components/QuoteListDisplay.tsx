"use client";

import { useQuoteList } from "./QuoteListContext";
import Link from "next/link";
import Image from "next/image";
import chairImage from "../assets/images/product_chair.png";

export default function QuoteListDisplay() {
  const { items, removeItem } = useQuoteList();

  if (items.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--surface-strong)', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontFamily: 'var(--font-serif)', color: 'var(--accent-dark)' }}>Your Quote List is empty</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.6 }}>
          Add individual rental items or curated setups to request a comprehensive proposal.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/catalogue" className="v3-btn v3-btn--outline" style={{ fontSize: '0.875rem', padding: '8px 16px' }}>
            Browse Catalogue
          </Link>
          <Link href="/listings" className="v3-btn v3-btn--outline" style={{ fontSize: '0.875rem', padding: '8px 16px' }}>
            Explore Setups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>Your Selection</h2>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--outline)', backgroundColor: 'var(--surface-strong)', padding: '4px 12px', borderRadius: '9999px' }}>
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {items.map(item => {
        const image = (item as any).primaryImage?.publicUrl || (item as any).images?.[0]?.publicUrl;
        return (
          <article key={item.slug} className="v3-quote-item-card">
            <div className="v3-quote-item-card__image">
              {image ? (
                <img src={image} alt={item.name} />
              ) : (
                <Image src={chairImage} alt={item.name} />
              )}
            </div>
            <div className="v3-quote-item-card__content">
              <div className="v3-quote-item-card__header">
                <div>
                  <h3 className="v3-quote-item-card__title">{item.name}</h3>
                  <p className="v3-quote-item-card__subtitle">{item.categoryName || (item.rentalUnit === "setup" ? "Setup" : "Catalogue item")}</p>
                </div>
                <button
                  type="button"
                  aria-label="Remove item"
                  className="v3-quote-item-card__remove"
                  onClick={() => removeItem(item.slug)}
                >
                  <svg width="20" height="20" viewBox={["0","0","24","24"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '8px', textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--outline)' }}>Ref: {item.slug}</span>
              </div>
            </div>
          </article>
        );
      })}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Link href="/catalogue" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600 }}>
          <svg width="20" height="20" viewBox={["0","0","24","24"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add more items
        </Link>
      </div>
    </div>
  );
}
