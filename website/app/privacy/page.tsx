import type { Metadata } from "next";
import Link from "next/link";
import { StitchPageIntro } from "../../components/PublicStitch";

export const metadata: Metadata = {
  title: "Privacy Policy | SpaceKonceptRental",
  description:
    "How SpaceKonceptRental handles quote enquiry and chat details for manual follow-up."
};

export default function PrivacyPage() {
  return (
    <>
      <section className="stitch-legal-hero">
        <div className="stitch-container">
          <StitchPageIntro
            eyebrow="Legal"
            title="Privacy Policy"
            intro="This page explains the practical MVP privacy posture for browsing rental listings, sending quote requests, and using the chat widget."
          />
        </div>
      </section>

      <section className="stitch-section stitch-legal-section">
        <div className="stitch-container">
          <div className="stitch-legal-grid">
            <article className="stitch-legal-card">
              <div>Data collection</div>
              <h3>What you share</h3>
              <p>
                Quote requests may ask for your name, email or phone, event date, venue or location, requested listings or items, quantities, and setup notes. Chat messages may include rental questions and page context needed to answer them.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Data usage</div>
              <h3>How details are used</h3>
              <p>
                The team uses quote request details for manual follow-up about the rental enquiry. Chat access depends on the configured chat provider, and chat responses are for browsing guidance only.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Limitations</div>
              <h3>What is not promised</h3>
              <p>
                This website does not provide an instant quote, does not set aside furniture, does not collect money, and does not finalise rental details online.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Security</div>
              <h3>Care with logs</h3>
              <p>
                Unexpected errors may create a support reference in privacy-minimised server logs. Those logs are intended for support tracing and should not include raw quote details, raw chat messages, secrets, provider URLs, or private payloads.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Consent</div>
              <h3>Your choices</h3>
              <p>
                Share only the event and rental details needed for follow-up. If you prefer not to use chat, send a quote request through the form and include the details you want the team to review.
              </p>
            </article>

            <article className="stitch-legal-card">
              <div>Agreement</div>
              <h3>Terms</h3>
              <p>
                Review the site expectations and rental enquiry boundaries in the{" "}
                <Link href="/terms">Terms of Use</Link>.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
