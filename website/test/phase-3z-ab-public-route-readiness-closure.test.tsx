import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CataloguePageContent } from "../app/catalogue/page";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import { CategoriesPageContent } from "../app/categories/page";
import EventsPage from "../app/events/page";
import HomePage from "../app/page";
import QuotePage from "../app/quote/page";
import QuoteRequestForm from "../components/QuoteRequestForm";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3yMergeCommit = "7f422fd47ffa75cf982bd4f9d859b530a96961ad";
const publicJourneyPath = "docs/content/PUBLIC-JOURNEY-READINESS-CLOSURE.md";
const quoteBoundaryPath = "docs/content/QUOTE-ENQUIRY-PUBLIC-EXPECTATION-BOUNDARY.md";
const protectedBridgePath = "docs/content/PROTECTED-ADMIN-PUBLIC-REVIEW-BRIDGE.md";

const publicInternalLeakPattern = new RegExp(
  [
    "admin-only readiness",
    "protected admin urls",
    "internal notes",
    "recovery lane statuses",
    "destructive-action safeguards",
    "status-transition matrix",
    "owner-review templates",
    "owner-demo",
    "content readiness workspace",
    "public-review bridge",
    "\/admin\/content-readiness",
    "\/admin\/"
  ].join("|"),
  "i"
);
const forbiddenPublicFlowPattern = new RegExp(
  `\\b(?:${[
    "ecom" + "merce",
    "ca" + "rt",
    "check" + "out",
    "ord" + "er",
    "pay" + "ment",
    "pur" + "chase",
    "book" + "ing",
    "reser" + "vation",
    "fulfil" + "ment",
    "stock-reser" + "vation"
  ].join("|")})s?\\b`,
  "i"
);
const forbiddenFakeFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i;
const forbiddenEvidencePattern =
  /owner approved|owner sign-?off complete|review completed on|signed off by|preview evidence captured|production evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on/i;

const sampleCategory = {
  id: "category-1",
  slug: "lounge",
  name: "Lounge",
  description: "Lounge grouping for rental planning.",
  sortOrder: 1
};
const sampleProduct = {
  id: "product-1",
  categoryId: "category-1",
  categoryName: "Lounge",
  slug: "modular-lounge-set",
  name: "Modular Lounge Set",
  shortDescription: "Flexible lounge setup for event furniture rental planning.",
  description: "Flexible modular seating for receptions and networking areas.",
  rentalUnit: "set",
  sortOrder: 1,
  source: "fallback" as const,
  primaryImage: undefined,
  images: []
};
const sampleCatalogue = {
  source: "fallback" as const,
  categories: [sampleCategory],
  products: [sampleProduct]
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

describe("Phase 3Z-A/B public route readiness closure", () => {
  afterEach(() => cleanup());

  it("adds template-only public readiness, quote boundary, and protected bridge docs", () => {
    expect(readTrackedFiles([publicJourneyPath, quoteBoundaryPath, protectedBridgePath]).sort()).toEqual(
      [publicJourneyPath, quoteBoundaryPath, protectedBridgePath].sort()
    );

    const combined = normalizeWhitespace(
      [readRepoFile(publicJourneyPath), readRepoFile(quoteBoundaryPath), readRepoFile(protectedBridgePath)].join("\n")
    );

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Homepage",
      "Listings route",
      "Listing detail route",
      "Catalogue/category routes where present",
      "Events/event-use route where present",
      "Quote/enquiry request route",
      "Public not-found/recovery states",
      "Public confirmation is receipt-style only",
      "Safe public copy examples",
      "Unsafe public copy examples",
      "Public-safe",
      "Owner input required",
      "Keep protected",
      "Needs local correction",
      "Admin-only detail",
      "Blocked before public visibility",
      "Requires separate deployment approval",
      "[LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(combined).toContain(required);
    }

    expect(combined).not.toMatch(forbiddenEvidencePattern);
  });

  it("rolls status docs forward from the Phase 3Y PR #147 merge commit", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = normalizeWhitespace(readRepoFile("docs/DECISION-LOG.md"));
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const ownerDocs = normalizeWhitespace(
      [
        readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md"),
        readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md"),
        readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md")
      ].join("\n")
    );

    expect(status).toContain(
      "Current phase: Phase 3Z-A/B - public route readiness closure, protected admin review bridge, and local acceptance coverage."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3Y-A/B protected admin destructive-action safeguards, recovery lanes, and local acceptance coverage."
    );
    expect(status).toContain("Last merged capability PR: #147");
    expect(status).toContain(`Merge commit: \`${phase3yMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3Y-A/B status");
    expect(roadmap).toContain("Phase 3Z-A/B closes the repo-local public journey/readiness gap");
    expect(readiness).toContain("Current Phase 3Z-A/B status");
    expect(readiness).toContain("Previous Current Phase 3Y-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3Z-A/B adds public journey readiness closure docs, a quote/enquiry public expectation boundary, a protected admin public-review bridge"
    );
    expect(checklist).toContain(
      "## Phase 3Z-A/B Public Route Readiness Closure Protected Admin Review Bridge And Local Acceptance Coverage"
    );
    expect(ownerDocs).toContain(publicJourneyPath);
    expect(ownerDocs).toContain(quoteBoundaryPath);
    expect(ownerDocs).toContain(protectedBridgePath);
  });

  it("renders safe public rental/enquiry copy without introducing public scope creep", async () => {
    render(await HomePage());
    expect(screen.getByRole("heading", { name: /premium furniture rentals for considered events/i })).toBeInTheDocument();
    expect(screen.getByText(/request a manual quote from the SpaceKonceptRental team/i)).toBeInTheDocument();
    cleanup();

    render(<CataloguePageContent catalogue={sampleCatalogue} />);
    expect(screen.getByText(/manual quote review/i)).toBeInTheDocument();
    cleanup();

    render(<ProductPageContent product={sampleProduct} />);
    expect(screen.getByText(/team reviews each enquiry before final rental details/i)).toBeInTheDocument();
    cleanup();

    render(<CategoriesPageContent catalogue={sampleCatalogue} />);
    expect(screen.getByRole("heading", { name: /furniture catalogue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /increase modular lounge set quantity/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/modular lounge set quantity selected/i)).toHaveTextContent("Qty 0");
    expect(screen.getByRole("link", { name: /view details for modular lounge set/i })).toHaveAttribute(
      "href",
      "/catalogue/modular-lounge-set"
    );
    cleanup();

    render(<EventsPage />);
    expect(screen.getByText(/The team reviews submitted details before preparing a tailored proposal/i)).toBeInTheDocument();
    cleanup();

    render(await QuotePage());
    expect(screen.getByText(/guided enquiry for selected rental items/i)).toBeInTheDocument();
    expect(screen.getByText(/reviews each request manually and follows up by email/i)).toBeInTheDocument();
    expect(screen.getByText(/does not confirm final rental details/i)).toBeInTheDocument();
    cleanup();

    render(<QuoteRequestForm />);
    expect(screen.getByText(/guided enquiry to share selected rental items/i)).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/checkout|payment|customer account|public tracking/i);
  });

  it("keeps public source free from protected admin details, fake facts, and blocked public flows", () => {
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

    for (const required of ["listing", "enquiry", "quote", "request", "rental", "event furniture"]) {
      expect(publicSource).toMatch(new RegExp(required, "i"));
    }

    expect(publicSource).not.toMatch(publicInternalLeakPattern);
    expect(publicSource).not.toMatch(forbiddenPublicFlowPattern);
    expect(publicSource).not.toMatch(forbiddenFakeFactPattern);
    expect(publicSource).not.toMatch(/public quote tracking|customer account|customer upload|CRM|notification/i);
  });

  it("keeps forbidden runtime/provider/deployment files untracked and env reads absent", () => {
    expect(readTrackedFiles([
      "website/chat-config.js",
      "website/app/api/customer-uploads",
      "website/app/api/public/uploads",
      "website/app/api/customer-accounts",
      "website/app/api/quote-tracking",
      "website/app/api/quote-status",
      "website/app/quote/status",
      "website/app/api/notifications",
      "website/app/api/crm",
      "website/app/api/chat/retrieval",
      "vercel.json",
      "website/vercel.json",
      ".vercel",
      "supabase/config.toml",
      "supabase/.branches",
      "docs/evidence",
      "docs/preview-evidence",
      "docs/production-evidence",
      "docs/owner-review-evidence"
    ])).toEqual([]);

    const appAndLibSource = readTrackedProductionSources(["website/app", "website/components", "website/lib"]);
    const packageSource = readRepoFile("package.json") + readRepoFile("website/package.json");
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toMatch(/NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N|SUPABASE_SERVICE_ROLE|PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
  });
});
