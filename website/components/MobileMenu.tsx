"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const links = [
  ["Home", "/"],
  ["Catalogue", "/catalogue"],
  ["Setups", "/listings"],
  ["About", "/about"],
  ["Contact", "/contact"]
] as const;

const actionLinks = [
  ["Request Quote", "/quote"]
] as const;

const legalLinks = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"]
] as const;

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <button className="stitch-menu-trigger" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(true)} type="button"><span /><span /><span /></button>
      {open ? <button className="stitch-menu-scrim" aria-label="Close menu" onClick={() => setOpen(false)} type="button" /> : null}
      <aside className={`stitch-mobile-menu${open ? " stitch-mobile-menu--open" : ""}`} aria-hidden={!open}>
        <div className="stitch-mobile-menu__top"><div><strong>SpaceKonceptRental</strong><span>Furniture & event rentals</span></div><button aria-label="Close menu" onClick={() => setOpen(false)} type="button">Close</button></div>
        <nav aria-label="Mobile navigation" className="stitch-mobile-menu__primary">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
        <nav aria-label="Mobile request navigation" className="stitch-mobile-menu__actions">{actionLinks.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
        <nav aria-label="Mobile legal navigation" className="stitch-mobile-menu__legal">{legalLinks.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
      </aside>
    </>
  );
}
