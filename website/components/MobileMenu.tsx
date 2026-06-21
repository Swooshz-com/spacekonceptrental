"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";

type MobileMenuLink = {
  href: string;
  label: string;
};

const defaultLinks: MobileMenuLink[] = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/events", label: "Event Setups / Hire by Events" }
];

const menuIconViewBox = ["0", "0", "24", "24"].join(" ");

export default function MobileMenu({
  links = defaultLinks
}: {
  links?: MobileMenuLink[];
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close, open]);

  return (
    <>
      <button
        className="premium-hamburger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
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
          {open ? (
            <>
              <line x1="6" x2="18" y1="6" y2="18" />
              <line x1="18" x2="6" y1="6" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" x2="21" y1="6" y2="6" />
              <line x1="3" x2="21" y1="12" y2="12" />
              <line x1="3" x2="21" y1="18" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <div
          className="premium-mobile-overlay premium-mobile-overlay--open"
          onClick={close}
          aria-hidden="true"
        />
      ) : null}

      <div
        className={`premium-mobile-drawer${open ? " premium-mobile-drawer--open" : ""}`}
        id="mobile-navigation"
        role="dialog"
        aria-modal={open}
        aria-labelledby={titleId}
        aria-hidden={!open}
      >
        <div className="premium-mobile-drawer__header">
          <span className="premium-mobile-drawer__title" id={titleId}>
            Menu
          </span>
          <button
            className="premium-mobile-drawer__close"
            aria-label="Close menu"
            onClick={close}
            type="button"
          >
            Close
          </button>
        </div>

        <nav className="premium-mobile-drawer__nav" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.href} onClick={close}>
              {link.label}
            </Link>
          ))}
          <Link href="/listings" onClick={close}>
            Listings
          </Link>
        </nav>

        <div className="premium-mobile-drawer__cta">
          <Link
            className="premium-button premium-button--primary premium-button--full"
            href="/quote"
            onClick={close}
          >
            Request a quote
          </Link>
        </div>
      </div>
    </>
  );
}
