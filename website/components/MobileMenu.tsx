"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const mobileNav = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/listings", label: "Setups" },
  { href: "/quote", label: "Your Selection" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width="24"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width="24"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((current) => !current), []);
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
        aria-expanded={open}
        aria-label="Open menu"
        className="skr-menu-trigger"
        onClick={toggle}
        type="button"
      >
        <MenuIcon />
      </button>
      <div
        className={`skr-mobile-menu${open ? " skr-mobile-menu--open" : ""}`}
        role="dialog"
        aria-modal={open}
        aria-label="Mobile navigation"
      >
        <div className="skr-mobile-menu__top">
          <Link className="skr-brand" href="/" onClick={close}>
            Space Koncept Rental
          </Link>
          <button
            aria-label="Close menu"
            className="skr-icon-button"
            onClick={close}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Mobile navigation" className="skr-mobile-menu__nav">
          {mobileNav.map((item) => (
            <Link href={item.href} key={item.href} onClick={close}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          className="skr-button skr-button--solid skr-mobile-menu__cta"
          href="/quote"
          onClick={close}
        >
          Request Quote
        </Link>
      </div>
    </>
  );
}
