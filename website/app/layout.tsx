import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import Link from "next/link";
import ChatWidget from "../components/ChatWidget";
import MobileMenu from "../components/MobileMenu";
import "./globals.css";
import "./globals-premium.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter"
});

const lora = Lora({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"]
});

const primaryNavLinks = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/events", label: "Event Setups / Hire by Events" }
];

const footerBrowseLinks = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/listings", label: "Listings" },
  { href: "/events", label: "Event Setups" }
];

const footerSupportLinks = [
  { href: "/quote", label: "Quote enquiry" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" }
];

export const metadata: Metadata = {
  title: "Space Koncept Rentals | Event furniture rental",
  description:
    "Browse our premium event furniture rental catalogue and send a quote enquiry."
};

function BrandMark() {
  return (
    <>
      <span className="premium-brand__mark" aria-hidden="true">
        SK
      </span>
      <span className="premium-brand__wordmark">
        <span className="premium-brand__name">SpaceKoncept</span>
        <span className="premium-brand__tagline">Rental</span>
      </span>
    </>
  );
}

function SiteHeader() {
  return (
    <header className="site-header premium-header">
      <div className="premium-header__inner">
        <Link className="premium-brand" href="/" aria-label="SpaceKonceptRental home">
          <BrandMark />
        </Link>

        <nav aria-label="Primary navigation" className="premium-nav">
          {primaryNavLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="premium-header__actions">
          <Link className="premium-header__cta" href="/quote">
            Request a quote
          </Link>
          <MobileMenu links={primaryNavLinks} />
        </div>

        <nav aria-label="Public route shortcuts" className="sr-only">
          <Link href="/listings">Listings</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/quote">Quote enquiry</Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer premium-footer">
      <div className="premium-footer__inner">
        <div className="premium-footer__brand">
          <Link className="premium-footer__brand-logo" href="/">
            <BrandMark />
          </Link>
          <p>
            Warm furniture and event rental catalogue for curated setups and
            manual quote follow-up.
          </p>
        </div>

        <div className="premium-footer__links-group">
          <h2 className="premium-footer__heading">Browse</h2>
          <nav aria-label="Footer browse links">
            {footerBrowseLinks.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="premium-footer__links-group">
          <h2 className="premium-footer__heading">Planning</h2>
          <nav aria-label="Footer planning links">
            {footerSupportLinks.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="premium-footer__cta-panel">
          <p>Share event details when you are ready for team review.</p>
          <Link className="premium-button premium-button--primary" href="/quote">
            Request a quote
          </Link>
        </div>
      </div>

      <div className="premium-footer__bottom">
        <span>Copyright 2026 SpaceKonceptRental.</span>
        <span>Enquiry-led rental planning with manual follow-up.</span>
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
    <html lang="en-SG" className={`${inter.variable} ${lora.variable}`}>
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
