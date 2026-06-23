import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import QuotePage from "../app/quote/page";
import { AdminShellContent } from "../app/admin/protected-admin-shell";
import QuoteRequestForm from "../components/QuoteRequestForm";

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
const forbiddenPublicFlowPattern = /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i;
const forbiddenRentalCompletionPattern = /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i;
const forbiddenFakeFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i;
const forbiddenInternalLeakPattern =
  /owner handoff bundle|owner-facing review brief|owner approval issue template|no-deploy preflight command center|owner approval packet|release-control internals|admin urls?|internal notes|recovery lanes?|destructive-action safeguards|status-transition matrix|\/admin\//i;
const forbiddenScopePattern = /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b/i;
const forbiddenReceiptPromisePattern =
  /tracking portal|status lookup|accepted outcome|availability statement|\bhold\b|confirmed|reserved|booked|ordered|paid|completed rental|guaranteed|response time|fulfilment|fulfillment|payment|purchase/i;
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

describe("Phase 5E-A/B quote/enquiry intake readiness", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders safe required/help/receipt copy for public quote enquiries", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "received",
          publicReference: "QR-20260610-LOCAL1"
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<QuoteRequestForm initialItemsText="Modular lounge set" />);

    expect(screen.getByText(/share your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your name \(required\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByText(/event date helps the team understand timing/i)).toBeInTheDocument();
    expect(screen.getByText(/email or phone required/i)).toBeInTheDocument();
    expect(screen.getByText(/requested listing or item/i)).toBeInTheDocument();
    expect(screen.getByText(/setup\/access\/timing notes/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.change(screen.getByLabelText(/requested listings or items/i), {
      target: { value: "Modular lounge set\nCategory interest: lounge" }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/enquiry received/i);
    });

    expect(screen.getByRole("status")).toHaveTextContent(/receipt only/i);
    expect(screen.getByRole("status")).toHaveTextContent(/team can review/i);
    expect(screen.getByRole("status")).toHaveTextContent(/follow up directly/i);
    expect(screen.getByRole("status")).toHaveTextContent(/does not set aside furniture/i);
    expect(screen.getByRole("status")).toHaveTextContent(/does not finalise rental details/i);
    expect(screen.getByRole("status")).toHaveTextContent(/public reference receipt/i);
  });

  it("keeps selected listing, category, event, and search context editable and request-only", async () => {
    const page = await QuotePage({
      searchParams: {
        category: "lounge",
        event: "gala",
        search: "sofa"
      }
    });

    render(page);

    expect(screen.getByText(/Discovery context is editable request intake only/i)).toBeInTheDocument();
    const items = screen.getByLabelText(/requested listings or items/i);
    expect(items).toHaveValue(
      "Category interest: lounge\nEvent-use interest: gala\nSearch interest: sofa"
    );
    expect(screen.getByText(/requested items editable in the form/i)).toBeInTheDocument();
    expect(screen.queryByText(forbiddenReceiptPromisePattern)).not.toBeInTheDocument();
  });

  it("shows public-safe validation errors without internal details", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch");

    render(<QuoteRequestForm />);
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/add your name/i);
    expect(screen.getByRole("alert")).not.toHaveTextContent(/schema|sql|supabase|stack|token|cookie|workspace|customerName|items\[/i);
    expect(fetcher).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/email address or phone number/i);
    expect(screen.getByRole("alert")).not.toHaveTextContent(/schema|sql|supabase|stack|token|cookie|workspace|customerEmail/i);
  });

  it("keeps quote/enquiry source free of forbidden public scope and receipt promises", () => {
    const publicQuoteSource = readProductionSource(publicQuoteSourceRoots);
    const quoteReceiptSource = readProductionSource(quoteReceiptSourceRoots);

    expect(publicQuoteSource).toMatch(/enquiry intake only/i);
    expect(publicQuoteSource).toMatch(/editable request text/i);
    expect(publicQuoteSource).toMatch(/receipt only/i);
    expect(publicQuoteSource).not.toMatch(forbiddenPublicFlowPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenRentalCompletionPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenFakeFactPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenInternalLeakPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenScopePattern);
    expect(quoteReceiptSource).not.toMatch(forbiddenReceiptPromisePattern);
  });

  it("renders protected admin quote triage parity helper only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "quotes" }} />);

    expect(screen.getByRole("heading", { name: /quote intake parity helper/i })).toBeInTheDocument();
    expect(screen.getByText(/Public intake fields/i)).toBeInTheDocument();
    expect(screen.getByText(/Context handoff sources/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt\/reference boundary/i)).toBeInTheDocument();
    expect(screen.getByText(/docs\/content\/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS\.md/i)).toBeInTheDocument();
  });

  it("does not render the protected helper for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const view = render(<AdminShellContent state={state} view={{ kind: "quotes" }} />);

      expect(screen.queryByRole("heading", { name: /quote intake parity helper/i })).not.toBeInTheDocument();
      view.unmount();
    }
  });

  it("registers the quote intake validator and keeps the release suite non-bypassing", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(packageJson.scripts["validate:quote-intake-readiness"]).toBe(
      "node scripts/validate-quote-intake-readiness.cjs"
    );
    expect(suite).toContain("args: ['run', 'validate:quote-intake-readiness']");
    expect(suite).not.toMatch(dockerBypassPattern);
  });
});
