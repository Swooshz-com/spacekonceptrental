import type { Metadata } from "next";
import Link from "next/link";
import { StitchPageIntro } from "../../components/PublicStitch";

export const metadata: Metadata = {
  title: "Terms of Use | SpaceKonceptRental",
  description:
    "Simple Terms of Use for browsing rental listings and sending quote enquiries."
};

export default function TermsPage() {
  return (
    <>
      <section className="stitch-legal-hero">
        <div className="stitch-container">
          <StitchPageIntro
            eyebrow="Legal"
            title="Terms of Use"
            intro="These terms describe the current MVP website experience for browsing furniture rental listings and sending quote enquiries."
          />
        </div>
      </section>

      <section className="stitch-section stitch-legal-section">
        <div className="stitch-container">
          <div className="stitch-legal-grid">
            <article className="stitch-legal-card">
              <div>Discovery</div>
              <h3>Browsing listings</h3>
              <p>
                Catalogue and listing pages are browsing aids. Listing names, descriptions, images, categories, and rental units help you prepare an enquiry, but the team reviews fit and details directly.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Process</div>
              <h3>Quote enquiries</h3>
              <p>
                A quote request starts manual follow-up by the business. It does not create an instant quote, does not set aside furniture, and does not finalise rental details online.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Support</div>
              <h3>Chat guidance</h3>
              <p>
                Chat access depends on the configured chat provider. Chat replies are guidance for browsing and preparing an enquiry, not a final rental decision.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Requirements</div>
              <h3>Information accuracy</h3>
              <p>
                Share practical event details such as date, venue or location, quantities, setup, access, timing, and alternates. The team may ask follow-up questions before quote details are ready.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Conduct</div>
              <h3>Use of the site</h3>
              <p>
                Use the site for normal furniture and event rental enquiries. Do not submit secrets, private credentials, or unrelated sensitive information through public forms or chat.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Data handling</div>
              <h3>Privacy</h3>
              <p>
                The{" "}
                <Link href="/privacy">Privacy Policy</Link> explains how enquiry and chat details are handled for this MVP website.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
