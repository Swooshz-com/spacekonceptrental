import type { Metadata } from "next";
import Link from "next/link";
import ChatWidget from "../components/ChatWidget";
import { QuoteListProvider } from "../components/QuoteListContext";
import QuoteBadge from "../components/QuoteBadge";
import "./globals.css";
import "./globals-premium.css";

import MobileMenu from "../components/MobileMenu";

export const metadata: Metadata = {
  title: "Space Koncept Rentals | Event furniture rental",
  description:
    "Browse our premium event furniture rental catalogue and send a quote enquiry."
};

function SiteHeader() {
  const primaryNavLinks = [
    { href: "/catalogue", label: "Catalogue" },
    { href: "/listings", label: "Setups" },
  ];

  return (
    <header className="v3-header">
      {/* Brand */}
      <Link className="v3-header__brand" href="/">
        SpaceKoncept<span style={{ fontWeight: 400, color: "var(--muted)" }}>Rental</span>
      </Link>

      {/* Primary navigation */}
      <nav aria-label="Primary navigation" className="v3-header__nav">
        {primaryNavLinks.map((link) => (
          <Link key={link.href} href={link.href} className="v3-header__link">
            {link.label}
          </Link>
        ))}

        <Link href="/quote" className="v3-header__link" style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
          Quote List
          <QuoteBadge />
        </Link>

        <Link
          href="/quote"
          className="v3-btn v3-btn--primary"
          style={{ padding: "8px 16px" }}
        >
          Request Quote
        </Link>
      </nav>

      <div style={{ display: "none" }}>
        {/* Mobile menu (client component) */}
        <MobileMenu />
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="v3-footer">
      <div className="v3-footer__grid">
        {/* Brand column */}
        <div className="v3-footer__brand">
          <h2>SpaceKonceptRental</h2>
          <p>Curated event-ready furniture and setups. Quote-led rental planning.</p>
        </div>

        <div className="v3-footer__col">
          <h3>Explore</h3>
          <ul className="v3-footer__links">
            <li><Link href="/catalogue">Catalogue</Link></li>
            <li><Link href="/listings">Setups</Link></li>
            <li><Link href="/quote">Quote List</Link></li>
            <li><Link href="/quote">Request Quote</Link></li>
          </ul>
        </div>

        <div className="v3-footer__col">
          <h3>Company</h3>
          <ul className="v3-footer__links">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="v3-footer__col">
          <h3>Legal</h3>
          <ul className="v3-footer__links">
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-SG">
      <body>
        <QuoteListProvider>
          <div className="site-shell">
            <SiteHeader />
            <main className="site-main">{children}</main>
            <ChatWidget />
            <SiteFooter />
          </div>
        </QuoteListProvider>
      </body>
    </html>
  );
}
