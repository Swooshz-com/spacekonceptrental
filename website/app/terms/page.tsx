import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | Space Koncept Rentals",
  description:
    "Simple Terms of Use for browsing rental listings and sending quote enquiries."
};

export default function TermsPage() {
  return (
    <section className="section legal-page">
      <div className="page-title">
        <p className="eyebrow">Terms of Use</p>
        <h1>Terms of Use</h1>
        <p>
          These terms describe the current MVP website experience for browsing
          furniture rental listings and sending quote enquiries.
        </p>
      </div>

      <div className="route-grid">
        <article className="route-card">
          <h2>Browsing listings</h2>
          <p>
            Catalogue and listing pages are browsing aids. Listing names,
            descriptions, images, categories, and rental units help you prepare
            an enquiry, but the team reviews fit and details directly.
          </p>
        </article>

        <article className="route-card">
          <h2>Quote enquiries</h2>
          <p>
            A quote request starts manual follow-up by the business. It does not
            create an instant quote, does not set aside furniture, and does not
            finalise rental details online.
          </p>
        </article>

        <article className="route-card">
          <h2>Chat guidance</h2>
          <p>
            Chat availability depends on the configured chat provider. Chat
            replies are guidance for browsing and preparing an enquiry, not a
            final rental decision.
          </p>
        </article>

        <article className="route-card">
          <h2>Information accuracy</h2>
          <p>
            Share practical event details such as date, venue or location,
            quantities, setup, access, timing, and alternates. The team may ask
            follow-up questions before quote details are ready.
          </p>
        </article>

        <article className="route-card">
          <h2>Use of the site</h2>
          <p>
            Use the site for normal furniture and event rental enquiries. Do not
            submit secrets, private credentials, or unrelated sensitive
            information through public forms or chat.
          </p>
        </article>

        <article className="route-card">
          <h2>Privacy</h2>
          <p>
            The{" "}
            <Link href="/privacy">Privacy Policy</Link> explains how enquiry
            and chat details are handled for this MVP website.
          </p>
        </article>
      </div>
    </section>
  );
}
