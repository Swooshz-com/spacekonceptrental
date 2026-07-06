"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import ChatWidget from "../components/ChatWidget";
import MobileMenu from "../components/MobileMenu";
import PublicSectionScrollAssist from "../components/PublicSectionScrollAssist";
import { QuoteSelectionIndicator } from "../components/QuoteSelectionControls";
import RouteScrollReset from "../components/RouteScrollReset";
import { MobileBottomNav, SiteDesktopNav } from "../components/SiteNav";

function isAdminRoute(pathname: string | null) {
  return pathname === "/admin" || Boolean(pathname?.startsWith("/admin/"));
}

function SiteHeader() {
  return (
    <header className="stitch-site-header">
      <div className="stitch-site-header__inner">
        <Link className="stitch-brand" href="/">
          SpaceKonceptRental
        </Link>
        <SiteDesktopNav />
        <div className="stitch-header-actions">
          <QuoteSelectionIndicator />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="stitch-footer">
      <div className="stitch-container stitch-footer__grid">
        <div>
          <h2>SpaceKonceptRental</h2>
          <p>
            Furniture and event rental enquiries supported by manual team
            follow-up.
          </p>
        </div>
        <div>
          <h3>Explore</h3>
          <nav>
            <Link href="/catalogue">Catalogue</Link>
            <Link href="/listings">Setups</Link>
            <Link href="/quote">Request Quote</Link>
          </nav>
        </div>
        <div>
          <h3>Company</h3>
          <nav>
            <Link href="/about">About</Link>
          </nav>
        </div>
        <div>
          <h3>Legal</h3>
          <nav>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </nav>
        </div>
      </div>
      <div className="stitch-footer__bottom">
        &copy; 2026 SpaceKonceptRental.
      </div>
    </footer>
  );
}

function PublicSiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <RouteScrollReset />
      <PublicSectionScrollAssist />
      <div className="site-shell">
        <SiteHeader />
        <main className="site-main">{children}</main>
        <ChatWidget />
        <SiteFooter />
        <MobileBottomNav />
      </div>
    </>
  );
}

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isAdminRoute(pathname)) {
    return <>{children}</>;
  }

  return <PublicSiteShell>{children}</PublicSiteShell>;
}
