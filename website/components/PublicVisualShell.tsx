import Link from "next/link";
import type { ReactNode } from "react";

import PublicMobileMenu from "./PublicMobileMenu";

type PublicVisualShellProps = {
  active?: "home" | "catalogue" | "setups" | "about" | "contact" | "quote";
  children: ReactNode;
};

const navigationLinks = [
  { href: "/", label: "Home", key: "home" },
  { href: "/catalogue", label: "Catalogue", key: "catalogue" },
  { href: "/events", label: "Setups", key: "setups" },
  { href: "/", label: "About", key: "about" },
  { href: "/quote", label: "Contact", key: "contact" }
] as const;

export default function PublicVisualShell({
  active,
  children
}: PublicVisualShellProps) {
  return (
    <div className="skr-public-visual-shell">
      <header className="skr-public-header">
        <div className="skr-shell-container skr-public-header__inner">
          <Link className="skr-public-brand" href="/">
            Space Koncept Rental
          </Link>
          <nav aria-label="Primary navigation" className="skr-public-nav">
            {navigationLinks.map((link) => (
              <Link
                aria-current={active === link.key ? "page" : undefined}
                href={link.href}
                key={link.key}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link className="skr-public-header__cta" href="/quote">
            Request Quote
          </Link>
          <PublicMobileMenu />
        </div>
      </header>
      <div className="skr-public-visual-shell__body">{children}</div>
      <footer className="skr-public-footer">
        <div className="skr-shell-container skr-public-footer__grid">
          <section className="skr-public-footer__intro" aria-label="Brand intro">
            <h2>Space Koncept Rental</h2>
            <p>
              Furniture and event rental catalogue for planned spaces. Browse
              listings and send an enquiry for manual team follow-up.
            </p>
          </section>
          <nav aria-label="Explore" className="skr-footer-links">
            <h3>Explore</h3>
            <Link href="/catalogue">Catalogue</Link>
            <Link href="/events">Setups</Link>
            <Link href="/quote">Request Quote</Link>
          </nav>
          <nav aria-label="Company" className="skr-footer-links">
            <h3>Company</h3>
            <Link href="/">About</Link>
            <Link href="/quote">Contact</Link>
          </nav>
          <nav aria-label="Legal" className="skr-footer-links">
            <h3>Legal</h3>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
