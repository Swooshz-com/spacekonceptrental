import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import Link from "next/link";
import ChatWidget from "../components/ChatWidget";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Space Koncept Rentals | Event furniture rental",
  description:
    "Browse the event furniture rental catalogue and send a quote enquiry."
};

function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand__name">SpaceKonceptRental</span>
        <span className="brand__tagline">Event furniture, Singapore</span>
      </Link>
      <nav aria-label="Primary navigation" className="site-nav">
        <Link href="/">Home</Link>
        <Link href="/listings">Listings</Link>
        <Link href="/categories">Categories</Link>
        <Link href="/catalogue">Catalogue</Link>
        <Link href="/events">Events</Link>
        <Link className="site-nav__quote" href="/quote">
          Quote enquiry
        </Link>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-SG" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <div className="site-shell">
          <SiteHeader />
          <main className="site-main">{children}</main>
          <ChatWidget />
          <footer className="site-footer">
            <p>SpaceKonceptRental</p>
            <p>Singapore event furniture rental</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
