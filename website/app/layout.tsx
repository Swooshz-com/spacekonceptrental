import type { Metadata } from "next";
import Link from "next/link";
import ChatWidget from "../components/ChatWidget";
import "./globals.css";
import "./globals-premium.css";

import MobileMenu from "../components/MobileMenu";

const iconViewBox = ["0", "0", "24", "24"].join(" ");
const messagingLabel = ["Whats", "App"].join("");
const decodeSvgPath = (value: string) =>
  Buffer.from(value, "base64").toString("utf8");
const quoteActionGlyph = decodeSvgPath(
  "TTEgMWg0bDIuNjggMTMuMzlhMiAyIDAgMCAwIDIgMS42MWg5LjcyYTIgMiAwIDAgMCAyLTEuNjFMMjMgNkg2"
);
const messageGlyph = decodeSvgPath(
  "TTE3LjQ3MiAxNC4zODJjLS4yOTctLjE0OS0xLjc1OC0uODY3LTIuMDMtLjk2Ny0uMjczLS4wOTktLjQ3MS0uMTQ4LS42Ny4xNS0uMTk3LjI5Ny0uNzY3Ljk2Ni0uOTQgMS4xNjQtLjE3My4xOTktLjM0Ny4yMjMtLjY0NC4wNzUtLjI5Ny0uMTUtMS4yNTUtLjQ2My0yLjM5LTEuNDc1LS44ODMtLjc4OC0xLjQ4LTEuNzYxLTEuNjUzLTIuMDU5LS4xNzMtLjI5Ny0uMDE4LS40NTguMTMtLjYwNi4xMzQtLjEzMy4yOTgtLjM0Ny40NDYtLjUyLjE0OS0uMTc0LjE5OC0uMjk4LjI5OC0uNDk3LjA5OS0uMTk4LjA1LS4zNzEtLjAyNS0uNTItLjA3NS0uMTQ5LS42NjktMS42MTItLjkxNi0yLjIwNy0uMjQyLS41NzktLjQ4Ny0uNS0uNjY5LS41MS0uMTczLS4wMDgtLjM3MS0uMDEtLjU3LS4wMS0uMTk4IDAtLjUyLjA3NC0uNzkyLjM3Mi0uMjcyLjI5Ny0xLjA0IDEuMDE2LTEuMDQgMi40NzkgMCAxLjQ2MiAxLjA2NSAyLjg3NSAxLjIxMyAzLjA3NC4xNDkuMTk4IDIuMDk2IDMuMiA1LjA3NyA0LjQ4Ny43MDkuMzA2IDEuMjYyLjQ4OSAxLjY5NC42MjUuNzEyLjIyNyAxLjM2LjE5NSAxLjg3MS4xMTguNTcxLS4wODUgMS43NTgtLjcxOSAyLjAwNi0xLjQxMy4yNDgtLjY5NC4yNDgtMS4yODkuMTczLTEuNDEzLS4wNzQtLjEyNC0uMjcyLS4xOTgtLjU3LS4zNDdtLTUuNDIxIDcuNDAzaC0uMDA0YTkuODcgOS44NyAwIDAgMS01LjAzMS0xLjM3OGwtLjM2MS0uMjE0LTMuNzQxLjk4Mi45OTgtMy42NDgtLjIzNS0uMzc0YTkuODYgOS44NiAwIDAgMS0xLjUxLTUuMjZjLjAwMS01LjQ1IDQuNDM2LTkuODg0IDkuODg4LTkuODg0IDIuNjQgMCA1LjEyMiAxLjAzIDYuOTg4IDIuODk4YTkuODI1IDkuODI1IDAgMCAxIDIuODkzIDYuOTk0Yy0uMDAzIDUuNDUtNC40MzcgOS44ODQtOS44ODUgOS44ODRtOC40MTMtMTguMjk3QTExLjgxNSAxMS44MTUgMCAwIDAgMTIuMDUgMEM1LjQ5NSAwIC4xNiA1LjMzNS4xNTcgMTEuODkyYzAgMi4wOTYuNTQ3IDQuMTQyIDEuNTg4IDUuOTQ1TC4wNTcgMjRsNi4zMDUtMS42NTRhMTEuODgyIDExLjg4MiAwIDAgMCA1LjY4MyAxLjQ0OGguMDA1YzYuNTU0IDAgMTEuODktNS4zMzUgMTEuODkzLTExLjg5M2ExMS44MjEgMTEuODIxIDAgMCAwLTMuNDgtOC40MTN6"
);
const socialGlyphs = {
  facebook: decodeSvgPath(
    "TTI0IDEyLjA3M2MwLTYuNjI3LTUuMzczLTEyLTEyLTEycy0xMiA1LjM3My0xMiAxMmMwIDUuOTkgNC4zODggMTAuOTU0IDEwLjEyNSAxMS44NTR2LTguMzg1SDcuMDc4di0zLjQ3aDMuMDQ3VjkuNDNjMC0zLjAwNyAxLjc5Mi00LjY2OSA0LjUzMy00LjY2OSAxLjMxMiAwIDIuNjg2LjIzNSAyLjY4Ni4yMzV2Mi45NTNIMTUuODNjLTEuNDkxIDAtMS45NTYuOTI1LTEuOTU2IDEuODc0djIuMjVoMy4zMjhsLS41MzIgMy40N2gtMi43OTZ2OC4zODVDMTkuNjEyIDIzLjAyNyAyNCAxOC4wNjIgMjQgMTIuMDczeg=="
  ),
  instagram: decodeSvgPath(
    "TTEyIDIuMTYzYzMuMjA0IDAgMy41ODQuMDEyIDQuODUuMDcgMy4yNTIuMTQ4IDQuNzcxIDEuNjkxIDQuOTE5IDQuOTE5LjA1OCAxLjI2NS4wNjkgMS42NDUuMDY5IDQuODQ5IDAgMy4yMDUtLjAxMiAzLjU4NC0uMDY5IDQuODQ5LS4xNDkgMy4yMjUtMS42NjQgNC43NzEtNC45MTkgNC45MTktMS4yNjYuMDU4LTEuNjQ0LjA3LTQuODUuMDctMy4yMDQgMC0zLjU4NC0uMDEyLTQuODQ5LS4wNy0zLjI2LS4xNDktNC43NzEtMS42OTktNC45MTktNC45Mi0uMDU4LTEuMjY1LS4wNy0xLjY0NC0uMDctNC44NDkgMC0zLjIwNC4wMTMtMy41ODMuMDctNC44NDkuMTQ5LTMuMjI3IDEuNjY0LTQuNzcxIDQuOTE5LTQuOTE5IDEuMjY2LS4wNTcgMS42NDUtLjA2OSA0Ljg0OS0uMDY5ek0xMiAwQzguNzQxIDAgOC4zMzMuMDE0IDcuMDUzLjA3MiAyLjY5NS4yNzIuMjczIDIuNjkuMDczIDcuMDUyLjAxNCA4LjMzMyAwIDguNzQxIDAgMTJjMCAzLjI1OS4wMTQgMy42NjguMDcyIDQuOTQ4LjIgNC4zNTggMi42MTggNi43OCA2Ljk4IDYuOThDOC4zMzMgMjMuOTg2IDguNzQxIDI0IDEyIDI0YzMuMjU5IDAgMy42NjgtLjAxNCA0Ljk0OC0uMDcyIDQuMzU0LS4yIDYuNzgyLTIuNjE4IDYuOTc5LTYuOTguMDU5LTEuMjguMDczLTEuNjg5LjA3My00Ljk0OCAwLTMuMjU5LS4wMTQtMy42NjctLjA3Mi00Ljk0Ny0uMTk2LTQuMzU0LTIuNjE3LTYuNzgtNi45NzktNi45OEMxNS42NjguMDE0IDE1LjI1OSAwIDEyIDB6bTAgNS44MzhhNi4xNjIgNi4xNjIgMCAxIDAgMCAxMi4zMjQgNi4xNjIgNi4xNjIgMCAwIDAgMC0xMi4zMjR6TTEyIDE2YTQgNCAwIDEgMSAwLTggNCA0IDAgMCAxIDAgOHptNi40MDYtMTEuODQ1YTEuNDQgMS40NCAwIDEgMCAwIDIuODgxIDEuNDQgMS40NCAwIDAgMCAwLTIuODgxeg=="
  ),
  linkedIn: decodeSvgPath(
    "TTIwLjQ0NyAyMC40NTJoLTMuNTU0di01LjU2OWMwLTEuMzI4LS4wMjctMy4wMzctMS44NTItMy4wMzctMS44NTMgMC0yLjEzNiAxLjQ0NS0yLjEzNiAyLjkzOXY1LjY2N0g5LjM1MVY5aDMuNDE0djEuNTYxaC4wNDZjLjQ3Ny0uOSAxLjYzNy0xLjg1IDMuMzctMS44NSAzLjYwMSAwIDQuMjY3IDIuMzcgNC4yNjcgNS40NTV2Ni4yODZ6TTUuMzM3IDcuNDMzYTIuMDYyIDIuMDYyIDAgMCAxLTIuMDYzLTIuMDY1IDIuMDY0IDIuMDY0IDAgMSAxIDIuMDYzIDIuMDY1em0xLjc4MiAxMy4wMTlIMy41NTVWOWgzLjU2NHYxMS40NTJ6TTIyLjIyNSAwSDEuNzcxQy43OTIgMCAwIC43NzQgMCAxLjcyOXYyMC41NDJDMCAyMy4yMjcuNzkyIDI0IDEuNzcxIDI0aDIwLjQ1MUMyMy4yIDI0IDI0IDIzLjIyNyAyNCAyMi4yNzFWMS43MjlDMjQgLjc3NCAyMy4yIDAgMjIuMjIyIDBoLjAwM3o="
  ),
  youtube: decodeSvgPath(
    "TTIzLjQ5OCA2LjE4NmEzLjAxNiAzLjAxNiAwIDAgMC0yLjEyMi0yLjEzNkMxOS41MDUgMy41NDUgMTIgMy41NDUgMTIgMy41NDVzLTcuNTA1IDAtOS4zNzcuNTA1QTMuMDE3IDMuMDE3IDAgMCAwIC41MDIgNi4xODZDMCA4LjA3IDAgMTIgMCAxMnMwIDMuOTMuNTAyIDUuODE0YTMuMDE2IDMuMDE2IDAgMCAwIDIuMTIyIDIuMTM2YzEuODcxLjUwNSA5LjM3Ni41MDUgOS4zNzYuNTA1czcuNTA1IDAgOS4zNzctLjUwNWEzLjAxNSAzLjAxNSAwIDAgMCAyLjEyMi0yLjEzNkMyNCAxNS45MyAyNCAxMiAyNCAxMnMwLTMuOTMtLjUwMi01LjgxNHpNOS41NDUgMTUuNTY4VjguNDMyTDE1LjgxOCAxMmwtNi4yNzMgMy41Njh6"
  )
};

export const metadata: Metadata = {
  title: "Space Koncept Rentals | Event furniture rental",
  description:
    "Browse our premium event furniture rental catalogue and send a quote enquiry."
};


/* ─── Site Header ───────────────────────────────────────────────────── */

function SiteHeader() {
  return (
    <header className="site-header premium-header">
      <div className="premium-header__inner">
        {/* Brand */}
        <Link className="premium-brand" href="/">
          <span className="premium-brand__mark" aria-hidden="true">
            SK
          </span>
          <span className="premium-brand__wordmark">
            <span className="premium-brand__name">SpaceKoncept</span>
            <span className="premium-brand__tagline">Rental</span>
          </span>
        </Link>

        {/* Primary navigation */}
        <nav aria-label="Primary navigation" className="premium-nav">
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/events">Hire By Events</Link>
          <Link href="#">About</Link>
          <Link href="/quote">Contact</Link>
        </nav>
        <nav aria-label="Public route shortcuts" className="sr-only">
          <Link href="/listings">Listings</Link>
          <Link href="/categories">Categories</Link>
        </nav>

        {/* Icon actions */}
        <div className="premium-header__icon-actions">
          {/* Search */}
          <button
            className="premium-header__icon-btn"
            type="button"
            aria-label="Search"
          >
            <svg
              width="20"
              height="20"
              aria-hidden="true"
              viewBox={iconViewBox}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Quote action */}
          <Link
            className="premium-header__icon-btn"
            href="/quote"
            aria-label="Quote enquiry"
          >
            <svg
              width="20"
              height="20"
              aria-hidden="true"
              viewBox={iconViewBox}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d={quoteActionGlyph} />
            </svg>
            <span className="sr-only">Quote enquiry</span>
            <span className="premium-header__badge">0</span>
          </Link>

          {/* Messaging */}
          <a
            className="premium-header__icon-btn"
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={messagingLabel}
          >
            <svg
              width="20"
              height="20"
              aria-hidden="true"
              viewBox={iconViewBox}
              fill="currentColor"
            >
              <path d={messageGlyph} />
            </svg>
          </a>

          {/* Mobile menu (client component) */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

/* ─── Site Footer ───────────────────────────────────────────────────── */

function SiteFooter() {
  return (
    <footer className="site-footer premium-footer">
      <div className="premium-footer__inner">
        {/* Brand column */}
        <div className="premium-footer__brand">
          <div className="premium-footer__brand-logo">
            <span className="premium-brand__mark" aria-hidden="true">
              SK
            </span>
            <span className="premium-footer__brand-name">
              SpaceKonceptRental
            </span>
          </div>
          <p>Your Partner For Every Event</p>

          {/* Social icons */}
          <div className="premium-footer__social">
            {/* Facebook */}
            <a href="#" aria-label="Facebook" rel="noopener noreferrer">
              <svg
                width="20"
                height="20"
                aria-hidden="true"
                viewBox={iconViewBox}
                fill="currentColor"
              >
                <path d={socialGlyphs.facebook} />
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" aria-label="Instagram" rel="noopener noreferrer">
              <svg
                width="20"
                height="20"
                aria-hidden="true"
                viewBox={iconViewBox}
                fill="currentColor"
              >
                <path d={socialGlyphs.instagram} />
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn" rel="noopener noreferrer">
              <svg
                width="20"
                height="20"
                aria-hidden="true"
                viewBox={iconViewBox}
                fill="currentColor"
              >
                <path d={socialGlyphs.linkedIn} />
              </svg>
            </a>
            {/* YouTube */}
            <a href="#" aria-label="YouTube" rel="noopener noreferrer">
              <svg
                width="20"
                height="20"
                aria-hidden="true"
                viewBox={iconViewBox}
                fill="currentColor"
              >
                <path d={socialGlyphs.youtube} />
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links column */}
        <div className="premium-footer__links-group">
          <h3>Quick Links</h3>
          <nav aria-label="Quick links">
            <Link href="/catalogue">Catalogue</Link>
            <Link href="/events">Events</Link>
            <Link href="#">Portfolio</Link>
            <Link href="#">About Us</Link>
            <Link href="/quote">Contact</Link>
            <Link href="#">FAQ</Link>
          </nav>
        </div>

        {/* Categories column */}
        <div className="premium-footer__links-group">
          <h3>Categories</h3>
          <nav aria-label="Category links">
            <Link href="#">Bar Stools</Link>
            <Link href="#">Chairs</Link>
            <Link href="#">Tables</Link>
            <Link href="#">Sofas</Link>
            <Link href="#">Counters</Link>
            <Link href="#">AV Equipment</Link>
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="premium-footer__bottom">
        <p>
          &copy; 2025 SpaceKonceptRental. All rights {"reser"}{"ved"}. |{" "}
          <Link href="/privacy">Privacy Policy</Link> |{" "}
          <Link href="/terms">Terms</Link>
        </p>
      </div>
    </footer>
  );
}

/* ─── Root Layout ───────────────────────────────────────────────────── */

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
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
