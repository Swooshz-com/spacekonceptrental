import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import { CataloguePageContent } from "../app/catalogue/page";
import { CategoriesPageContent } from "../app/categories/page";
import EventsPage from "../app/events/page";
import type { PublicCatalogue, PublicCatalogueProduct } from "../lib/catalogue/types";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3vMergeCommit = "3904a661aa3d72606d4c48743030406656128b2c";
const checklistPath = "docs/content/CATALOGUE-LISTING-MEDIA-ACCEPTANCE-CHECKLIST.md";
const protectedAdminShellPath = "website/app/admin/protected-admin-shell.tsx";

const publicInternalLeakPattern =
  /Owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|owner input required|issue backlog|route inventory|acceptance status|local release-candidate|command centre|owner handoff|handoff pack|deployment firewall|acceptance triage|final local owner handoff|catalogue\/listing\/media acceptance snapshot|quote\/enquiry acceptance snapshot|\/admin\/content-readiness/i;
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
const forbiddenBusinessFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|proof claim/i;
const forbiddenContactFactPattern =
  /\b(?!(?:\d{4}-\d{2}-\d{2})\b)(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const filledEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on|suite passed on|owner feedback recorded|catalogue media accepted/i;

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
  primaryImage: {
    id: "image-1",
    storageBucket: "public",
    storagePath: "sample/modular-lounge-set.png",
    publicUrl: "https://images.example.test/modular-lounge-set.png",
    altText: "Modular lounge set arranged for event furniture rental browsing.",
    sortOrder: 1,
    isPrimary: true
  },
  images: [
    {
      id: "image-1",
      storageBucket: "public",
      storagePath: "sample/modular-lounge-set.png",
      publicUrl: "https://images.example.test/modular-lounge-set.png",
      altText: "Modular lounge set arranged for event furniture rental browsing.",
      sortOrder: 1,
      isPrimary: true
    }
  ],
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

const authorisedAdminState = {
  status: "authorised_admin" as const,
  dashboard: { status: "unavailable" as const },
  quoteInbox: {
    status: "loaded" as const,
    data: { quoteRequests: [] }
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

describe("Phase 3W-A/B catalogue listing media hardening", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("rolls status docs forward from the Phase 3V PR #144 merge commit", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const ownerDocs = normalizeWhitespace([
      readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md"),
      readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md"),
      readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md")
    ].join("\n"));

    expect(status).toContain(
      "Current phase: Phase 3W-A/B - catalogue listing media hardening, protected admin content-ops polish, and local acceptance coverage."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3V-A/B quote/enquiry workflow hardening, protected admin triage polish, and local acceptance coverage."
    );
    expect(status).toContain("Last merged capability PR: #144");
    expect(status).toContain(`Merge commit: \`${phase3vMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3V-A/B status");
    expect(roadmap).toContain(
      "Phase 3W-A/B hardens the public catalogue/listing/category/media discovery path and protected admin content-ops surfaces"
    );
    expect(readiness).toContain("Current Phase 3W-A/B status");
    expect(readiness).toContain("Previous Current Phase 3V-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3W-A/B hardens public catalogue/listing/category/media discovery, protected admin content operations, and local catalogue/listing/media acceptance coverage."
    );
    expect(checklist).toContain(
      "## Phase 3W-A/B Catalogue Listing Media Hardening Protected Admin Content-Ops Polish And Local Acceptance Coverage"
    );
    expect(ownerDocs).toContain(checklistPath);
  });

  it("adds a template-only catalogue/listing/media acceptance checklist", () => {
    expect(existsSync(resolve(repoRoot, checklistPath))).toBe(true);
    expect(readTrackedFiles([checklistPath])).toEqual([checklistPath]);

    const checklist = readRepoFile(checklistPath);
    const normalized = normalizeWhitespace(checklist);

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Public Catalogue Route Expectations",
      "Public Listing Detail Expectations",
      "Public Category Route Expectations",
      "Public Event-Use Handoff Expectations",
      "Protected Admin Listing Category Media Expectations",
      "Media And Alt-Text Expectations",
      "Public Allowed Wording",
      "Public Forbidden Wording",
      "Admin-Only Boundary",
      "Local Acceptance Placeholders",
      "Deployment Boundary",
      "[ROUTE / AREA]",
      "[PUBLIC / PROTECTED ADMIN]",
      "[CATALOGUE / LISTING / MEDIA CHECK]",
      "[LOCAL ACCEPTANCE STATE: NOT RUN / PASS / NEEDS FOLLOW-UP]",
      "[OWNER INPUT REQUIRED]",
      "[LOCAL FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalized).toContain(required);
    }

    expect(checklist).not.toMatch(filledEvidencePattern);
    expect(checklist).not.toMatch(forbiddenBusinessFactPattern);
    expect(checklist).not.toMatch(forbiddenContactFactPattern);
  });

  it("keeps catalogue, listing, category, and event routes customer-facing", () => {
    render(<CataloguePageContent catalogue={sampleCatalogue} />);
    expect(screen.getByRole("heading", { name: /furniture catalogue/i })).toBeInTheDocument();
    expect(screen.getByText(/rental unit: set/i)).toBeInTheDocument();
    expect(screen.getByText(/quote request starting point/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a quote/i })).toBeInTheDocument();
    cleanup();

    render(<ProductPageContent product={sampleProduct} />);
    expect(screen.getByRole("heading", { name: /rental details/i })).toBeInTheDocument();
    expect(screen.getAllByText(/category/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/rental unit/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/event-use context/i)).toBeInTheDocument();
    expect(screen.getByText(/media and fit check before enquiry/i)).toBeInTheDocument();
    expect(screen.getByText(/public-safe alt text/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a quote/i })).toBeInTheDocument();
    cleanup();

    render(<CategoriesPageContent catalogue={sampleCatalogue} />);
    expect(screen.getByRole("heading", { name: /rental categories/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /compare lounge listings/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /send an enquiry/i }).length).toBeGreaterThan(0);
    cleanup();

    render(<EventsPage />);
    expect(screen.getByRole("heading", { name: /plan an event setup/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse rental categories/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse listings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start a rental enquiry/i })).toBeInTheDocument();
  });

  it("keeps public sources free from internal language, transaction vocabulary, and fake facts", () => {
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
    expect(publicSource).not.toMatch(forbiddenCustomerFlowTermPattern);
    expect(publicSource).not.toMatch(forbiddenBusinessFactPattern);
    expect(publicSource).not.toMatch(forbiddenContactFactPattern);
  });

  it("renders the catalogue/listing/media snapshot only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "content-readiness" }} />);
    expect(screen.getByRole("heading", { name: /catalogue\/listing\/media acceptance snapshot/i })).toBeInTheDocument();
    expect(screen.getByText("Catalogue/listing/media checklist")).toBeInTheDocument();
    expect(screen.getByText("Public visitor uploads/accounts/tracking")).toBeInTheDocument();
    expect(screen.getAllByText("Not added").length).toBeGreaterThan(0);
    expect(screen.getByText("Last local catalogue/media update")).toBeInTheDocument();
    cleanup();

    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      render(<AdminShellContent state={state} view={{ kind: "content-readiness" }} />);
      expect(screen.queryByRole("heading", { name: /catalogue\/listing\/media acceptance snapshot/i })).not.toBeInTheDocument();
      cleanup();
    }
  });

  it("keeps admin content ops and forbidden runtime/config/evidence paths protected or absent", () => {
    const shell = readRepoFile(protectedAdminShellPath);
    expect(shell).toContain(checklistPath);
    expect(shell).toContain("catalogueListingMediaAcceptanceSnapshot");
    expect(shell).toContain("Media/alt-text boundary");
    expect(shell).toContain("Not added");

    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles([
      "website/app/api/customer-uploads",
      "website/app/api/public/uploads",
      "website/app/api/customer-accounts",
      "website/app/api/quote-tracking",
      "website/app/api/quote-status",
      "website/app/quote/status",
      "website/app/api/notifications",
      "website/app/api/crm",
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
