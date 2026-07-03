import type { Metadata } from "next";
import Link from "next/link";
import ChatWidget from "../components/ChatWidget";
import MobileMenu from "../components/MobileMenu";
import { QuoteSelectionIndicator } from "../components/QuoteSelectionControls";
import RouteScrollReset from "../components/RouteScrollReset";
import { MobileBottomNav, SiteDesktopNav } from "../components/SiteNav";
import "./globals.css";
import "./globals-premium.css";

export const metadata: Metadata = {
  title: "SpaceKonceptRental | Event furniture rental",
  description: "Browse the event furniture rental catalogue and submit a quote enquiry for manual team follow-up."
};

function SiteHeader() {
  return <header className="stitch-site-header"><div className="stitch-site-header__inner"><Link className="stitch-brand" href="/">SpaceKonceptRental</Link><SiteDesktopNav /><div className="stitch-header-actions"><QuoteSelectionIndicator /><MobileMenu /></div></div></header>;
}

function SiteFooter() {
  return <footer className="stitch-footer"><div className="stitch-container stitch-footer__grid"><div><h2>SpaceKonceptRental</h2><p>Premium furniture and setup rentals for events, styled spaces, and brand moments, supported by manual team follow-up.</p></div><div><h3>Explore</h3><nav><Link href="/">Home</Link><Link href="/catalogue">Catalogue</Link><Link href="/listings">Setups</Link><Link href="/quote">Request Quote</Link></nav></div><div><h3>Company</h3><nav><Link href="/about">About</Link><Link href="/contact">Contact</Link></nav></div><div><h3>Legal</h3><nav><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link></nav></div></div><div className="stitch-footer__bottom">&copy; 2026 SpaceKonceptRental.</div></footer>;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-SG"><body><RouteScrollReset /><div className="site-shell"><SiteHeader /><main className="site-main">{children}</main><ChatWidget /><SiteFooter /><MobileBottomNav /></div></body></html>;
}
