"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

const menuIconViewBox = ["0", "0", "24", "24"].join(" ");

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  /* Lock body scroll while the drawer is open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Hamburger button -- always visible on mobile, hidden on desktop */}
      <button
        className="premium-hamburger"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={toggle}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox={menuIconViewBox}
          width="24"
        >
          <line x1="3" x2="21" y1="6" y2="6" />
          <line x1="3" x2="21" y1="12" y2="12" />
          <line x1="3" x2="21" y1="18" y2="18" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="premium-mobile-overlay premium-mobile-overlay--open"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`premium-mobile-drawer${open ? " premium-mobile-drawer--open" : ""}`}
        role="dialog"
        aria-modal={open}
        aria-label="Mobile navigation"
      >
        <div className="premium-mobile-drawer__header">
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1rem",
              fontWeight: 500,
              color: "var(--accent)"
            }}
          >
            Space Koncept Rental
          </span>
          <button
            className="premium-mobile-drawer__close"
            aria-label="Close navigation menu"
            onClick={close}
            type="button"
          >
            &#x2715;
          </button>
        </div>

        <nav className="premium-mobile-drawer__nav" aria-label="Mobile navigation">
          <Link href="/" onClick={close}>Home</Link>
          <Link href="/catalogue" onClick={close}>Catalogue</Link>
          <Link href="/listings" onClick={close}>Setups</Link>
          <Link href="/about" onClick={close}>About</Link>
          <Link href="/contact" onClick={close}>Contact</Link>
          <Link href="/privacy" onClick={close}>Privacy</Link>
          <Link href="/terms" onClick={close}>Terms</Link>
        </nav>

        <div className="premium-mobile-drawer__cta">
          <Link
            className="premium-button premium-button--primary premium-button--full"
            href="/quote"
            onClick={close}
          >
            Request Quote
          </Link>
        </div>
      </div>
    </>
  );
}
