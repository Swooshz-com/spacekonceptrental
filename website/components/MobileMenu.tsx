"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

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
      {/* Hamburger button */}
      <button
        className="premium-hamburger"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={toggle}
        type="button"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="premium-mobile-overlay"
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
          <button
            className="premium-mobile-drawer__close"
            aria-label="Close menu"
            onClick={close}
            type="button"
          >
            &#x2715;
          </button>
        </div>

        <nav className="premium-mobile-drawer__nav" aria-label="Mobile navigation">
          <Link href="/catalogue" onClick={close}>
            Catalogue
          </Link>
          <Link href="/events" onClick={close}>
            Hire By Events
          </Link>
          <Link href="#" onClick={close}>
            Portfolio
          </Link>
          <Link href="#" onClick={close}>
            About
          </Link>
          <Link href="/quote" onClick={close}>
            Contact
          </Link>
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
