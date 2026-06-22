import type { Metadata } from "next";
import Link from "next/link";
import ChatWidget from "../components/ChatWidget";
import MobileMenu from "../components/MobileMenu";
import "./globals.css";
import "./globals-premium.css";

export const metadata: Metadata = {
  title: "Space Koncept Rental | Event furniture rental",
  description:
    "Browse the Space Koncept Rental catalogue and submit a rental enquiry for manual team follow-up."
};

const primaryNav = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/listings", label: "Setups" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

function SearchGlyph() {
  return <span aria-hidden="true" className="skr-search-glyph" />;
}

function SiteHeader() {
  return (
    <header className="skr-header">
      <div className="skr-header__inner">
        <Link className="skr-brand" href="/">
          Space Koncept Rental
        </Link>
        <nav aria-label="Primary navigation" className="skr-nav">
          {primaryNav.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="skr-header__actions">
          <button
            aria-label="Search catalogue"
            className="skr-icon-button"
            type="button"
          >
            <SearchGlyph />
          </button>
          <Link className="skr-header__selection" href="/quote">
            Your Selection
          </Link>
          <Link className="skr-button skr-button--solid" href="/quote">
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
    <footer className="skr-footer">
      <div className="skr-footer__inner">
        <div className="skr-footer__brand">
          <Link className="skr-brand" href="/">
            Space Koncept Rental
          </Link>
          <p>
            Furniture and event rental catalogue for considered spaces,
            practical rental details, and manual team follow-up.
          </p>
        </div>
        <nav aria-label="Explore" className="skr-footer__links">
          <h2>Explore</h2>
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/listings">Setups</Link>
          <Link href="/quote">Your Selection</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <nav aria-label="Support" className="skr-footer__links">
          <h2>Support</h2>
          <Link href="/events">Events</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Use</Link>
        </nav>
        <div className="skr-footer__note">
          <h2>Manual Review</h2>
          <p>
            Submitting an enquiry starts a team review. Rental details are
            discussed directly after the team checks the request context.
          </p>
          <Link className="skr-text-link" href="/quote">
            Submit Enquiry
          </Link>
        </div>
      </div>
      <p className="skr-footer__bottom">
        &copy; 2026 Space Koncept Rental. All rights held.
      </p>
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
      <body className="antialiased">
        <div className="site-shell skr-site-shell">
          <SiteHeader />
          <main className="site-main premium-main skr-main">{children}</main>
          <ChatWidget />
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
