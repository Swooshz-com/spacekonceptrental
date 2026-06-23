"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const menuLinks = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/listings", label: "Setups" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/quote", label: "Request Quote" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" }
] as const;

const menuIconViewBox = ["0", "0", "24", "24"].join(" ");

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        className="premium-hamburger"
        aria-label="Open menu"
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

      {open ? (
        <button
          className="premium-mobile-overlay premium-mobile-overlay--open"
          onClick={close}
          aria-label="Close menu overlay"
          type="button"
        />
      ) : null}

      <div
        className={`premium-mobile-drawer${open ? " premium-mobile-drawer--open" : ""}`}
        role="dialog"
        aria-modal={open}
        aria-label="Mobile navigation"
      >
        <div className="premium-mobile-drawer__header">
          <span className="premium-mobile-drawer__brand">Space Koncept Rental</span>
          <button
            className="premium-mobile-drawer__close"
            aria-label="Close menu"
            onClick={close}
            type="button"
          >
            X
          </button>
        </div>

        <nav className="premium-mobile-drawer__nav" aria-label="Mobile navigation">
          {menuLinks.map((link) => (
            <Link href={link.href} key={link.href} onClick={close}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}