import type { Metadata } from "next";
import Link from "next/link";
import ChatWidget from "../components/ChatWidget";
import { QuoteListProvider } from "../components/QuoteListContext";
import QuoteBadge from "../components/QuoteBadge";
import "./globals.css";
import "./globals-premium.css";

import MobileMenu from "../components/MobileMenu";

export const metadata: Metadata = {
  title: "Space Koncept Rental | Event furniture rental",
  description:
    "Browse our premium event furniture rental catalogue and send a quote enquiry."
};

function SiteHeader() {
  const primaryNavLinks = [
    { href: "/", label: "Home" },
    { href: "/catalogue", label: "Catalogue" },
    { href: "/listings", label: "Setups" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="v3-header">
      <div className="v3-header__container">
        {/* Brand */}
        <Link className="v3-header__brand" href="/">
          Space Koncept Rental
        </Link>

        {/* Primary navigation */}
        <nav aria-label="Primary navigation" className="v3-header__nav">
          {primaryNavLinks.map((link) => (
            <Link key={link.href} href={link.href} className="v3-header__link">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="v3-header__actions">
          <Link
            href="/quote"
            className="v3-btn v3-btn--primary v3-header__cta"
          >
            Request Quote<QuoteBadge />
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="v3-footer">
      <div className="v3-footer__grid container">
        {/* Brand column */}
        <div className="v3-footer__brand">
          <h2>Space Koncept Rental</h2>
          <p>Curated event-ready furniture and setups. Quote-led rental planning.</p>
        </div>

        <div className="v3-footer__col">
          <h3>Explore</h3>
          <ul className="v3-footer__links">
            <li><Link href="/catalogue">Catalogue</Link></li>
            <li><Link href="/listings">Setups</Link></li>
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
