import type { Metadata } from "next";

import RouteShell from "./route-shell";
import "./globals.css";
import "./globals-premium.css";

export const metadata: Metadata = {
  title: "SpaceKonceptRental | Event furniture rental",
  description:
    "Browse the event furniture rental catalogue and submit a quote enquiry for manual team follow-up."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-SG">
      <body>
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}
