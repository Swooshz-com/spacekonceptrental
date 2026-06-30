import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const publicQuoteSourceRoots = [
  "website/app/quote",
  "website/components/QuoteRequestForm.tsx"
];
const quoteReceiptSourceRoots = [
  "website/app/quote",
  "website/components/QuoteRequestForm.tsx",
  "website/app/api/quote"
];
const adminQuoteSourceRoots = [
  "website/app/admin",
  "website/components/admin/quote-request-inbox-panel.tsx"
];
const forbiddenPublicFlowPattern = /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i;
const forbiddenRentalCompletionPattern = /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i;
const forbiddenFakeFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i;
const forbiddenPublicInternalPattern =
  /admin triage helper|admin-only status|response-readiness checklist|internal notes|release-control internals|owner handoff internals|admin urls?|\/admin\//i;
const forbiddenPublicScopePattern =
  /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|outbound messaging|email sending|sms sending|whatsapp/i;
const forbiddenReceiptPromisePattern =
  /tracking portal|status lookup|accepted outcome|availability statement|\bhold\b|confirmed|reserved|booked|ordered|paid|completed rental|guaranteed|response time|fulfilment|fulfillment|payment|purchase/i;
const forbiddenAdminOutboundPattern =
  /(?<!does not )(?<!do not )send(?:s|ing)?\s+(?:an?\s+)?(?:email|sms|whatsapp)|webhook dispatch|notification sending|CRM integration|Pinecone|\bRAG\b|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i;
const dockerBypassPattern = /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i;

const quoteRequest = {
  id: "70000000-0000-4000-8000-000000000001",
  publicReference: "QR-20260610-LOCAL1",
  customerName: "Maya Tan",
  customerEmail: "maya@example.test",
  customerMessage: "Please review lounge quantities and setup access notes.",
  eventDate: "2026-06-12",
  venue: "Event venue placeholder",
  status: "new" as const,
  source: "website" as const,
  createdAt: "2026-06-10T00:00:00.000Z",
  updatedAt: "2026-06-10T00:00:00.000Z",
  items: [
    {
      id: "80000000-0000-4000-8000-000000000001",
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      productNameSnapshot: "Modular lounge set",
      quantity: 2,
      notes: "Access notes and alternates.",
      createdAt: "2026-06-10T00:00:00.000Z"
    }
  ],
  activity: []
};

const authorisedAdminState = {
  status: "authorised_admin" as const,
  dashboard: {
    status: "loaded" as const,
    data: {
      categories: [],
      products: [],
      images: [],
      imageSummary: { totalImages: 0, activeImages: 0, primaryImages: 0 }
    }
  },
  quoteInbox: {
    status: "loaded" as const,
    data: {
      quoteRequests: [quoteRequest]
    }
  }
};

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function readTrackedFiles(paths: string[]) {
  return execFileSync("git", ["ls-files", "--", ...paths], {
    cwd: repoRoot,
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

function isProductionSource(filePath: string) {
  return (
    sourceExtensions.has(extname(filePath)) &&
    !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath) &&
    !filePath.startsWith("website/test/")
  );
}

function readProductionSource(paths: string[]) {
  return readTrackedFiles(paths)
    .filter(isProductionSource)
    .map((filePath) => `${filePath}\n${readRepoFile(filePath)}`)
    .join("\n");
}

describe("Phase 5F-A/B quote triage readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected admin quote triage helper only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "quotes" }} />);

    expect(screen.getByRole("heading", { name: /quote intake parity helper/i })).toBeInTheDocument();
    expect(screen.getByText(/docs\/content\/LOCAL-QUOTE-TRIAGE-READINESS\.md/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /manual follow-up checklist/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /manual response checklist/i })).toBeInTheDocument();
    expect(screen.getByText(/do not promise availability or response time/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Future CRM handoff readiness/i })).not.toBeInTheDocument();
    for (const hiddenCrmAction of [
      /Review queued CRM handoff packet/i,
      /Run CSV import preflight/i,
      /Run CRM handoff reconciliation/i,
      /Run HubSpot sync dry-run/i,
      /Download HubSpot import CSV/i
    ]) {
      expect(screen.queryByRole("button", { name: hiddenCrmAction })).not.toBeInTheDocument();
    }
  });

  it("does not render the protected helper for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const view = render(<AdminShellContent state={state} view={{ kind: "quotes" }} />);

      expect(screen.queryByRole("heading", { name: /quote intake parity helper/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /manual response checklist/i })).not.toBeInTheDocument();
      view.unmount();
    }
  });

  it("shows admin quote triage summaries, missing detail cues, and no-promise reminders", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "quotes" }} />);

    expect(screen.getByRole("heading", { name: /customer\/contact summary/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Maya Tan/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/maya@example\.test/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /event date\/venue summary and submitted notes/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Event venue placeholder/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /requested listing\/item summary/i })).toBeInTheDocument();
    expect(screen.getByText(/2 x Modular lounge set/i)).toBeInTheDocument();
    expect(screen.getByText(/review requested rental details/i)).toBeInTheDocument();
    expect(screen.getByText(/contact the visitor using the submitted email or phone/i)).toBeInTheDocument();
    expect(screen.getByText(/public reference QR-20260610-LOCAL1 is a receipt reference only/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready: customer name present/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready: email or phone contact present/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing: owner\/business facts still need owner-supplied confirmation/i)).toBeInTheDocument();
    expect(screen.getByText(/do not promise availability or response time/i)).toBeInTheDocument();
    expect(screen.getByText(/do not treat the public reference as tracking/i)).toBeInTheDocument();
  });

  it("keeps public quote/enquiry source free of admin triage and tracking details", () => {
    const publicQuoteSource = readProductionSource(publicQuoteSourceRoots);
    const quoteReceiptSource = readProductionSource(quoteReceiptSourceRoots);

    expect(publicQuoteSource).toMatch(/does not confirm final rental details/i);
    expect(publicQuoteSource).not.toMatch(forbiddenPublicInternalPattern);
    expect(publicQuoteSource).not.toMatch(/status lookup|tracking portal|public tracking/i);
    expect(quoteReceiptSource).not.toMatch(forbiddenReceiptPromisePattern);
  });

  it("keeps public source free of sales flows, fake facts, accounts, uploads, notifications, and CRM", () => {
    const publicQuoteSource = readProductionSource(publicQuoteSourceRoots);

    expect(publicQuoteSource).not.toMatch(forbiddenPublicFlowPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenRentalCompletionPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenFakeFactPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenPublicScopePattern);
  });

  it("keeps admin source free of outbound/provider runtime integrations", () => {
    const adminSource = readProductionSource(adminQuoteSourceRoots);

    expect(adminSource).toMatch(/Manual response checklist/i);
    expect(adminSource).toMatch(/Manual follow-up checklist/i);
    expect(adminSource).not.toMatch(/CRM handoff placeholder/i);
    expect(adminSource).not.toMatch(/CRM sync trigger|CRM sync job|HubSpot API/i);
    expect(adminSource).not.toMatch(forbiddenAdminOutboundPattern);
  });

  it("registers the quote triage validator and keeps the release suite non-bypassing", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(packageJson.scripts["validate:quote-triage-readiness"]).toBe(
      "node scripts/validate-quote-triage-readiness.cjs"
    );
    expect(suite).toContain("args: ['run', 'validate:quote-triage-readiness']");
    expect(suite).not.toMatch(dockerBypassPattern);
  });
});
