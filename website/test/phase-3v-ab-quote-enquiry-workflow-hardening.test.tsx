import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import { CataloguePageContent } from "../app/catalogue/page";
import { CategoriesPageContent } from "../app/categories/page";
import EventsPage from "../app/events/page";
import QuotePage from "../app/quote/page";
import type { PublicCatalogue, PublicCatalogueProduct } from "../lib/catalogue/types";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3uMergeCommit = "dd2c3c0176c427e69efa01d6e54841637d61548c";
const quoteWorkflowChecklistPath =
  "docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md";
const localReleaseCandidateValidatorPath =
  "scripts/validate-local-release-candidate.cjs";
const previewHandoffValidatorPath = "scripts/validate-preview-handoff.cjs";
const protectedAdminShellPath = "website/app/admin/protected-admin-shell.tsx";

const forbiddenCustomerFlowTermPattern = new RegExp(
  `\\b(?:${[
    "ecom" + "merce",
    "ca" + "rt",
    "check" + "out",
    "ord" + "er",
    "pay" + "ment",
    "pur" + "chase",
    "trans" + "action",
    "ret" + "ail",
    "booking",
    "reservation",
    "reserved",
    "fulfil" + "ment"
  ].join("|")})s?\\b`,
  "i"
);
const publicInternalLeakPattern =
  /Owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|owner input required|issue backlog|route inventory|acceptance status|local release-candidate|command centre|owner handoff|handoff pack|deployment firewall|acceptance triage|final local owner handoff|quote\/enquiry acceptance snapshot|\/admin\/content-readiness/i;
const forbiddenBusinessFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|proof claim/i;
const forbiddenContactFactPattern =
  /\b(?!(?:\d{4}-\d{2}-\d{2})\b)(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const filledEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on|suite passed on|owner feedback recorded|quote workflow accepted/i;
const forbiddenRunnerPattern =
  /vercel\s+(?:deploy|link|env|pull|promote)|supabase\s+(?:link|login|secrets|projects|functions|db\s+(?:push|pull|remote|reset))|smoke:preview|curl\b|fetch\s*\(|https?:\/\/|www\.|docs\/(?:evidence|preview-evidence|production-evidence|owner-review-evidence)|(?:^|[\\/])\.env(?:\.|$)|website\/chat-config\.js/i;

const sampleProduct: PublicCatalogueProduct = {
  id: "product-1",
  slug: "modular-lounge-set",
  name: "Modular Lounge Set",
  shortDescription: "Lounge seating for event furniture rental planning.",
  description: "Flexible modular seating for receptions and networking areas.",
  rentalUnit: "set",
  sortOrder: 1,
  categoryId: "category-1",
  categoryName: "Lounge",
  source: "fallback"
};

const sampleCatalogue: PublicCatalogue = {
  source: "fallback",
  categories: [
    {
      id: "category-1",
      slug: "lounge",
      name: "Lounge",
      description: "Lounge seating and tables for event setups.",
      sortOrder: 1
    }
  ],
  products: [sampleProduct]
};

const loadedAdminState = {
  status: "authorised_admin" as const,
  dashboard: {
    status: "unavailable" as const
  },
  quoteInbox: {
    status: "loaded" as const,
    data: {
      quoteRequests: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          publicReference: "QR-LOCAL-001",
          customerName: "Sample customer",
          customerEmail: "sample@example.test",
          customerMessage: "Needs lounge seating alternatives for a reception.",
          eventDate: "2026-07-15",
          venue: "Sample venue",
          status: "new" as const,
          source: "website" as const,
          createdAt: "2026-06-09T00:00:00.000Z",
          items: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              quoteRequestId: "11111111-1111-4111-8111-111111111111",
              productNameSnapshot: "Modular Lounge Set",
              quantity: 2,
              notes: "Add access and timing notes before follow-up.",
              createdAt: "2026-06-09T00:00:00.000Z"
            }
          ],
          activity: [
            {
              id: "33333333-3333-4333-8333-333333333333",
              quoteRequestId: "11111111-1111-4111-8111-111111111111",
              activityType: "internal_note" as const,
              note: "Admin-only follow-up context.",
              createdAt: "2026-06-09T00:00:00.000Z"
            }
          ]
        }
      ]
    }
  }
};

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
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

function readTrackedProductionSources(paths: string[]) {
  return readTrackedFiles(paths)
    .filter(isProductionSource)
    .map((filePath) => readRepoFile(filePath))
    .join("\n");
}

function extractRequiredSection(source: string, start: string, end?: string) {
  const startIndex = source.indexOf(start);
  expect(startIndex).toBeGreaterThanOrEqual(0);

  if (!end) {
    return source.slice(startIndex);
  }

  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("Phase 3V-A/B quote enquiry workflow hardening", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3V-A/B as current after Phase 3U completed in PR #143", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const currentStatus = normalizeWhitespace(
      status.split("Previous Current Phase 3U-A/B status:")[0] ?? status
    );
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const ownerReview = readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md");
    const manualQa = readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md");
    const handoff = readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md");
    const localValidator = readRepoFile(localReleaseCandidateValidatorPath);
    const previewValidator = readRepoFile(previewHandoffValidatorPath);

    expect(currentStatus).toContain(
      "Current phase: Phase 3V-A/B - quote/enquiry workflow hardening, protected admin triage polish, and local acceptance coverage."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3U-A/B final local owner handoff pack, acceptance triage board, and deployment decision firewall."
    );
    expect(currentStatus).toContain("Last merged capability PR: #143");
    expect(currentStatus).toContain(`Merge commit: \`${phase3uMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3U-A/B status");
    expect(roadmap).toContain(
      "Phase 3V-A/B hardens the public quote/enquiry conversion path and protected admin quote triage"
    );
    expect(readiness).toContain("Current Phase 3V-A/B status");
    expect(readiness).toContain("Previous Current Phase 3U-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3V-A/B hardens the quote/enquiry workflow, protected admin triage, and local acceptance coverage."
    );
    expect(checklist).toContain(
      "## Phase 3V-A/B Quote Enquiry Workflow Hardening Protected Admin Triage Polish And Local Acceptance Coverage"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(quoteWorkflowChecklistPath);
    expect(normalizeWhitespace(manualQa)).toContain(
      "Confirm required-field validation keeps entered rental details and selected listing context in the form."
    );
    expect(normalizeWhitespace(manualQa)).toContain(
      "Confirm failed submit recovery says the quote request was not sent, asks the visitor to review details and try again, and keeps entered details where browser state allows."
    );
    expect(normalizeWhitespace(manualQa)).toContain(
      "Confirm successful submit shows receipt-like manual follow-up copy and keeps requested listing/item context available for protected admin triage."
    );
    expect(localValidator).toContain(quoteWorkflowChecklistPath);
    expect(previewValidator).toContain(quoteWorkflowChecklistPath);
  });

  it("adds a template-only quote/enquiry workflow acceptance checklist", () => {
    expect(existsSync(resolve(repoRoot, quoteWorkflowChecklistPath))).toBe(true);
    expect(readTrackedFiles([quoteWorkflowChecklistPath])).toEqual([
      quoteWorkflowChecklistPath
    ]);

    const checklist = readRepoFile(quoteWorkflowChecklistPath);
    const normalized = normalizeWhitespace(checklist);

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Public quote/enquiry route expectations",
      "Listing/category/event handoff expectations",
      "Protected admin quote triage expectations",
      "Public copy allowed wording",
      "Public copy forbidden wording",
      "Admin-only internal note boundary",
      "Local acceptance placeholders",
      "Deployment boundary",
      "[ROUTE / AREA]",
      "[PUBLIC / PROTECTED ADMIN]",
      "[QUOTE / ENQUIRY CHECK]",
      "[LOCAL ACCEPTANCE STATE: NOT RUN / PASS / NEEDS FOLLOW-UP]",
      "[OWNER INPUT REQUIRED]",
      "[LOCAL FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalized).toContain(required);
    }

    for (const required of [
      "Validation errors keep entered rental details and selected listing context available for review.",
      "Failed submit recovery says the quote request was not sent, asks the visitor to review details and try again, and keeps entered details where browser state allows.",
      "Successful submit keeps receipt copy manual-follow-up focused and preserves requested listing/item context for protected admin triage."
    ]) {
      expect(normalized).toContain(required);
    }

    expect(checklist).not.toMatch(filledEvidencePattern);
    expect(checklist).not.toMatch(forbiddenBusinessFactPattern);
    expect(checklist).not.toMatch(forbiddenContactFactPattern);
  });

  it("hardens the public quote/enquiry page guidance with customer-facing rental wording", async () => {
    render(await QuotePage({ searchParams: { listing: "missing-listing" } }));

    expect(screen.getByRole("heading", { name: /curate your event/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/venue or location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/requested listings or items/i)).toBeInTheDocument();
    expect(screen.getAllByText(/quantities/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/alternates/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/setup, access, and timing notes/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/preferred contact method/i)).toBeInTheDocument();
    expect(readRepoFile("website/components/QuoteRequestForm.tsx")).toContain("Enquiry Received");
    expect(screen.getAllByText(/share more details/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/the listing link may be old or unavailable/i)).toBeInTheDocument();

    const quotePageSource = readRepoFile("website/app/quote/page.tsx");
    const formSource = readRepoFile("website/components/QuoteRequestForm.tsx");
    const publicQuoteSource = `${quotePageSource}\n${formSource}`;

    expect(publicQuoteSource).toMatch(/listing/i);
    expect(publicQuoteSource).toMatch(/enquiry/i);
    expect(publicQuoteSource).toMatch(/quote/i);
    expect(publicQuoteSource).toMatch(/request/i);
    expect(publicQuoteSource).toMatch(/rental/i);
    expect(publicQuoteSource).toMatch(/event furniture/i);
    expect(publicQuoteSource).not.toMatch(publicInternalLeakPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenCustomerFlowTermPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenBusinessFactPattern);
    expect(publicQuoteSource).not.toMatch(forbiddenContactFactPattern);
  });

  it("keeps listing, category, and event handoff links public-safe", () => {
    render(<ProductPageContent product={sampleProduct} />);
    expect(screen.getByRole("link", { name: /request a quote/i })).toHaveAttribute(
      "href",
      "/quote?listing=modular-lounge-set"
    );
    expect(screen.getByText(/bring event details/i)).toBeInTheDocument();
    expect(screen.getByText(/add quantities and alternatives/i)).toBeInTheDocument();
    expect(screen.getByText(/share setup, access, and timing notes/i)).toBeInTheDocument();

    cleanup();
    render(<CataloguePageContent catalogue={sampleCatalogue} />);
    expect(screen.getByRole("link", { name: /add modular lounge set to quote/i })).toHaveAttribute(
      "href",
      "/quote?listing=modular-lounge-set"
    );
    expect(screen.getByRole("link", { name: /view details for modular lounge set/i })).toHaveAttribute(
      "href",
      "/catalogue/modular-lounge-set"
    );

    cleanup();
    render(<CategoriesPageContent catalogue={sampleCatalogue} />);
    expect(
      screen
        .getAllByRole("link", { name: /send an enquiry/i })
        .every((link) => link.getAttribute("href") === "/quote")
    ).toBe(true);

    cleanup();
    render(<EventsPage />);
    expect(screen.getByRole("link", { name: /browse setups/i })).toHaveAttribute(
      "href",
      "/listings"
    );
    expect(screen.getByRole("link", { name: /start a rental enquiry/i })).toHaveAttribute(
      "href",
      "/quote"
    );
  });

  it("renders an admin-only quote/enquiry acceptance snapshot for authorised admins", () => {
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "unavailable"
          },
          quoteInbox: {
            status: "unavailable"
          }
        }}
        view={{ kind: "content-readiness" }}
      />
    );

    const shellSource = readRepoFile(protectedAdminShellPath);
    expect(shellSource).toContain(quoteWorkflowChecklistPath);
    expect(shellSource).toContain("quoteEnquiryAcceptanceSnapshot");
    expect(shellSource).toContain("quoteEnquiryAcceptanceLastLocalUpdate");

    const heading = screen.getByRole("heading", {
      name: /quote\/enquiry acceptance snapshot/i
    });
    expect(heading).toBeInTheDocument();
    const card = heading.closest("section");
    expect(card).not.toBeNull();
    const snapshot = within(card as HTMLElement);

    expect(screen.getByText(quoteWorkflowChecklistPath)).toBeInTheDocument();
    expect(snapshot.getAllByText(/quote\/enquiry workflow checklist/i).length).toBeGreaterThan(0);
    expect(snapshot.getByText(/public quote route/i)).toBeInTheDocument();
    expect(snapshot.getByText(/listing\/category\/event handoff/i)).toBeInTheDocument();
    expect(snapshot.getByText(/protected admin triage/i)).toBeInTheDocument();
    expect(snapshot.getByText(/internal notes boundary/i)).toBeInTheDocument();
    expect(snapshot.getByText(/^Not added$/i)).toBeInTheDocument();
    expect(
      snapshot.getByText(/not approved \/ separate explicit approval required/i)
    ).toBeInTheDocument();
    expect(snapshot.getByText(/\[DATE PLACEHOLDER\]/i)).toBeInTheDocument();
  });

  it("does not render the quote/enquiry acceptance snapshot for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(
        screen.queryByText(/quote\/enquiry acceptance snapshot/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(quoteWorkflowChecklistPath)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps admin quote triage grouped and protected", () => {
    render(<AdminShellContent state={loadedAdminState} view={{ kind: "quotes" }} />);

    expect(screen.getByRole("heading", { name: /quote request inbox/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /contact and follow-up/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /event and setup details/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /requested listings and items/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /admin-only status history/i })).toBeInTheDocument();
    expect(screen.getByText(/internal status history stays inside this protected admin workspace/i)).toBeInTheDocument();

    const publicSource = readTrackedProductionSources([
      "website/app/layout.tsx",
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/not-found.tsx",
      "website/components/QuoteRequestForm.tsx"
    ]);

    expect(publicSource).not.toMatch(/internal note|status history|admin-only status/i);
  });

  it("keeps Phase 3V materials inside no-provider, no-deploy, no-evidence boundaries", () => {
    const phase3vDocs = [
      extractRequiredSection(
        readRepoFile("docs/DECISION-LOG.md"),
        "## 2026-06-09: Quote Enquiry Workflow Hardening, Protected Admin Triage Polish, And Local Acceptance Coverage",
        "## 2026-06-09: Final Local Owner Handoff Pack, Acceptance Triage Board, And Deployment Decision Firewall"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-ROADMAP.md"),
        "## Phase 3V: Quote Enquiry Workflow Hardening, Protected Admin Triage Polish, And Local Acceptance Coverage",
        "## Phase 3U: Final Local Owner Handoff Pack, Acceptance Triage Board, And Deployment Decision Firewall"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-STATUS.md"),
        "Current phase: Phase 3V-A/B - quote/enquiry workflow hardening, protected admin triage polish, and local acceptance coverage.",
        "Previous Current Phase 3U-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-2-READINESS-PLAN.md"),
        "Current Phase 3V-A/B status:",
        "Previous Current Phase 3U-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md"),
        "## Phase 3V-A/B Quote Enquiry Workflow Hardening Protected Admin Triage Polish And Local Acceptance Coverage",
        "## Phase 3U-A/B Final Local Owner Handoff Pack Acceptance Triage Board And Deployment Decision Firewall"
      ),
      readRepoFile(quoteWorkflowChecklistPath)
    ].join("\n");
    const runner = readRepoFile("scripts/validate-release-candidate-suite.cjs");
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);

    expect(phase3vDocs).not.toMatch(filledEvidencePattern);
    expect(phase3vDocs).not.toMatch(forbiddenBusinessFactPattern);
    expect(phase3vDocs).not.toMatch(forbiddenContactFactPattern);
    expect(runner).not.toMatch(forbiddenRunnerPattern);
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(
      readTrackedFiles([
        "website/chat-config.js",
        "vercel.json",
        "website/vercel.json",
        ".vercel",
        "supabase/config.toml",
        "supabase/.branches",
        ".env",
        ".env.local",
        ".env.development",
        ".env.production",
        ".env.test",
        "website/.env",
        "website/.env.local",
        "website/.env.development",
        "website/.env.production",
        "website/.env.test",
        "docs/evidence",
        "docs/production-evidence",
        "docs/owner-review-evidence",
        "docs/preview-evidence",
        "website/app/api/customer-uploads",
        "website/app/api/public/uploads",
        "website/app/api/customer-accounts",
        "website/app/api/quote-tracking",
        "website/app/api/quote-status",
        "website/app/quote/status",
        "website/app/api/notifications",
        "website/app/api/crm",
        "website/app/api/chat/retrieval"
      ])
    ).toEqual([]);
  });
});
