"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const mobileLinks = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/events", label: "Setups" },
  { href: "/", label: "About" },
  { href: "/quote", label: "Contact" },
  { href: "/quote", label: "Request Quote" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" }
];

export default function PublicMobileMenu() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((current) => !current), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="skr-mobile-menu">
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="skr-menu-trigger"
        onClick={toggle}
        type="button"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      {open ? (
        <div className="skr-mobile-menu__panel" role="dialog" aria-modal="true">
          <div className="skr-mobile-menu__topline">
            <span>Space Koncept Rental</span>
            <button
              aria-label="Close menu"
              className="skr-mobile-menu__close"
              onClick={close}
              type="button"
            >
              Close
            </button>
          </div>
          <nav aria-label="Mobile navigation" className="skr-mobile-menu__links">
            {mobileLinks.map((link) => (
              <Link href={link.href} key={`${link.href}-${link.label}`} onClick={close}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
