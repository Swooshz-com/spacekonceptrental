import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import ChatWidget from "../components/ChatWidget";
import MobileMenu from "../components/MobileMenu";
import "./globals.css";
import "./globals-premium.css";

export const metadata: Metadata = {
  title: "Space Koncept Rental | Event furniture rental",
  description:
    "Browse the Space Koncept Rental event furniture rental catalogue and send a quote enquiry for manual follow-up."
};

function BrandMark() {
  return (
    <span className="premium-brand__mark" aria-hidden="true">
      SK
    </span>
  );
}

function SiteHeader() {
  return (
    <header className="site-header premium-header">
      <div className="premium-header__inner">
        <Link className="premium-brand" href="/" aria-label="Space Koncept Rental home">
          <BrandMark />
          <span className="premium-brand__wordmark">
            <span className="premium-brand__name">Space Koncept Rental</span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="premium-nav">
          <Link href="/">Home</Link>
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/listings">Setups</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="premium-header__actions">
          <Link className="premium-button premium-button--primary premium-header__cta" href="/quote">
            Request Quote
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer premium-footer">
      <div className="premium-footer__inner">
        <div className="premium-footer__brand">
          <div className="premium-footer__brand-logo">
            <BrandMark />
            <span className="premium-footer__brand-name">Space Koncept Rental</span>
          </div>
          <p>
            Furniture and event rental catalogue for visitors who want to browse real listings and send a focused enquiry for team follow-up.
          </p>
        </div>

        <div className="premium-footer__links-group">
          <h3>Explore</h3>
          <nav aria-label="Explore links">
            <Link href="/catalogue">Catalogue</Link>
            <Link href="/listings">Setups</Link>
            <Link href="/quote">Request Quote</Link>
          </nav>
        </div>

        <div className="premium-footer__links-group">
          <h3>Company</h3>
          <nav aria-label="Company links">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>

        <div className="premium-footer__links-group">
          <h3>Legal</h3>
          <nav aria-label="Legal links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </nav>
        </div>
      </div>

      <div className="premium-footer__bottom">
        <p>&copy; 2026 Space Koncept Rental. All rights held.</p>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-SG">
      <body className="antialiased">
        <div className="site-shell">
          <SiteHeader />
          <main className="site-main premium-main">{children}</main>
          <ChatWidget />
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}