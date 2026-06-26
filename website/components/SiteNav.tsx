"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  ["Home", "/"],
  ["Catalogue", "/catalogue"],
  ["Setups", "/listings"],
  ["About", "/about"],
  ["Contact", "/contact"]
] as const;

const baseBottomNavItems = [
  ["Home", "/", "⌂"],
  ["Catalogue", "/catalogue", "▦"],
  ["Setups", "/listings", "✦"]
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/catalogue") return pathname.startsWith("/catalogue") || pathname.startsWith("/categories");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteDesktopNav() {
  const pathname = usePathname() || "/";

  return (
    <nav className="stitch-desktop-nav" aria-label="Primary navigation">
      {navItems.map(([label, href]) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "stitch-nav-link--active" : undefined}
            href={href}
            key={href}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const finalItem = pathname.startsWith("/about")
    ? (["About", "/about", "ⓘ"] as const)
    : (["Contact", "/contact", "✉"] as const);
  const bottomNavItems = [...baseBottomNavItems, finalItem] as const;

  return (
    <nav className="stitch-bottom-nav" aria-label="Mobile quick navigation">
      {bottomNavItems.map(([label, href, icon]) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "stitch-nav-link--active" : undefined}
            href={href}
            key={href}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
