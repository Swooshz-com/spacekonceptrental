import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import { CategoriesPageContent } from "../app/categories/page";
import { CataloguePageContent } from "../app/catalogue/page";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import EventsPage from "../app/events/page";
import HomePage from "../app/page";
import QuotePage from "../app/quote/page";
import NotFound from "../app/not-found";
import type {
  PublicCatalogue,
  PublicCatalogueCategory,
  PublicCatalogueProduct
} from "../lib/catalogue/types";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3qMergeCommit = "0a0bd665111decffb6cdc837e48782943940f22f";
const ownerDemoIssueBacklogPath = "docs/content/OWNER-DEMO-ISSUE-BACKLOG.md";
const protectedAdminShellPath = "website/app/admin/protected-admin-shell.tsx";

const forbiddenDeploymentCommandPattern =
  /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i;
const forbiddenSupabaseCloudCommandPattern =
  /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i;
const forbiddenEnvInstructionPattern =
  /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i;
const forbiddenBusinessFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i;
const forbiddenContactFactPattern =
  /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const forbiddenCustomerFlowTermPattern = new RegExp(
  `\\b(?:${[
    "ecom" + "merce",
    "ca" + "rt",
    "check" + "out",
    "ord" + "er",
    "pay" + "ment",
    "pur" + "chase",
    "trans" + "action",
    "ret" + "ail"
  ].join("|")})s?\\b`,
  "i"
);
const publicInternalLeakPattern =
  /Owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|\/admin\/content-readiness|Owner input required|Ready for owner review|Blocks owner review|Blocks launch\/deployment|Route decision matrix|Issue ledger|Review execution checklist|Dry-run packet|Findings disposition|Launch decision rehearsal|Launch-blocker freeze gate|Correction PR plan|Public review prompts|Review the rental journey|Confirm each listing|Make sure the enquiry path/i;
const filledReviewEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off/i;

const loungeCategory: PublicCatalogueCategory = {
  id: "category-lounge",
  slug: "lounge",
  name: "Lounge",
  description: "Soft seating for receptions and VIP areas.",
  sortOrder: 10
};

const loungeProduct: PublicCatalogueProduct = {
  id: "product-lounge",
  slug: "modular-lounge-set",
  name: "Modular Lounge Set",
  shortDescription: "Soft seating for reception spaces.",
  description: "Published lounge set details.",
  rentalUnit: "set",
  sortOrder: 10,
  categoryId: loungeCategory.id,
  categoryName: loungeCategory.name,
  source: "fallback"
};

const catalogue: PublicCatalogue = {
  categories: [loungeCategory],
  products: [loungeProduct],
  source: "fallback"
};

const emptyCatalogue: PublicCatalogue = {
  categories: [],
  products: [],
  source: "fallback"
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

describe("Phase 3R-A/B product acceptance hardening", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3R-A/B as current after Phase 3Q completed in PR #139", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const currentStatus = normalizeWhitespace(
      status.split("Previous Current Phase 3Q-A/B status:")[0] ?? status
    );
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const ownerReview = readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md");
    const manualQa = readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md");
    const handoff = readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md");
    const validator = readRepoFile("scripts/validate-preview-handoff.cjs");

    expect(currentStatus).toContain(
      "Current phase: Phase 3R-A/B - repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3Q-A/B repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish."
    );
    expect(currentStatus).toContain("Last merged capability PR: #139");
    expect(currentStatus).toContain(`Merge commit: \`${phase3qMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3Q-A/B status");
    expect(roadmap).toContain(
      "Phase 3R-A/B adds repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness"
    );
    expect(readiness).toContain("Current Phase 3R-A/B status");
    expect(readiness).toContain("Previous Current Phase 3Q-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3R-A/B adds repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness."
    );
    expect(checklist).toContain(
      "## Phase 3R-A/B Product Acceptance Hardening Public-Admin Route Polish And Owner-Demo Issue Backlog Readiness"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(ownerDemoIssueBacklogPath);
    expect(combinedOwnerDocs).toContain("Owner-demo issue backlog");
    expect(combinedOwnerDocs).toContain("product acceptance hardening");
    expect(validator).toContain(phase3qMergeCommit);
    expect(validator).toContain(ownerDemoIssueBacklogPath);
    expect(validator).toContain("Phase 3R-A/B");
  });

  it("adds a template-only owner-demo issue backlog without recording evidence or approval", () => {
    expect(existsSync(resolve(repoRoot, ownerDemoIssueBacklogPath))).toBe(true);
    expect(readTrackedFiles([ownerDemoIssueBacklogPath])).toEqual([
      ownerDemoIssueBacklogPath
    ]);

    const backlog = readRepoFile(ownerDemoIssueBacklogPath);
    const normalizedBacklog = normalizeWhitespace(backlog);

    for (const required of [
      "This backlog is repo-local, template-only, and non-live.",
      "Public Route Issue Template",
      "Listing/Category/Media Issue Template",
      "Quote/Enquiry Workflow Issue Template",
      "Protected Admin Workflow Issue Template",
      "Content Readiness / Closure Workspace Issue Template",
      "Product polish",
      "Owner input required",
      "Blocks owner review",
      "Blocks future launch/deployment",
      "Deferred after launch",
      "Not in current scope",
      "[ISSUE ID]",
      "[ROUTE / AREA]",
      "[PUBLIC OR ADMIN]",
      "[OBSERVED ISSUE]",
      "[OWNER INPUT REQUIRED]",
      "[LOCAL FOLLOW-UP]",
      "[STATUS: OPEN / OWNER INPUT REQUIRED / LOCALLY RESOLVED / DEFERRED]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalizedBacklog).toContain(required);
    }

    expect(backlog).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(backlog).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(backlog).not.toMatch(forbiddenEnvInstructionPattern);
    expect(backlog).not.toMatch(forbiddenBusinessFactPattern);
    expect(backlog).not.toMatch(forbiddenContactFactPattern);
    expect(backlog).not.toMatch(forbiddenCustomerFlowTermPattern);
    expect(backlog).not.toMatch(filledReviewEvidencePattern);
  });

  it("hardens public route acceptance copy with customer-facing rental guidance", async () => {
    render(await HomePage());
    expect(
      screen.getByRole("heading", { name: /ready to request a rental quote/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/compare listings, categories, event setup notes, and quote details/i)
    ).toBeInTheDocument();

    cleanup();
    render(
      <CataloguePageContent
        catalogue={emptyCatalogue}
        emptyMessage="No public rental listings are available for this view yet."
      />
    );
    expect(
      screen.getByRole("link", { name: /browse event setup guidance/i })
    ).toHaveAttribute("href", "/events");

    cleanup();
    render(<CategoriesPageContent catalogue={catalogue} />);
    expect(
      screen.getByRole("link", { name: /compare lounge listings/i })
    ).toHaveAttribute("href", "/listings?category=lounge");

    cleanup();
    render(<ProductPageContent product={loungeProduct} />);
    expect(
      screen.getByRole("heading", { name: /fit check before enquiry/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/bring event date, venue, quantities, and setup notes/i)
    ).toBeInTheDocument();

    cleanup();
    render(<EventsPage />);
    expect(
      screen.getByText(/compare the setup guidance with catalogue listings before sending a quote request/i)
    ).toBeInTheDocument();

    cleanup();
    render(await QuotePage());
    expect(
      screen.getByRole("heading", { name: /check your enquiry details/i })
    ).toBeInTheDocument();

    cleanup();
    render(<NotFound />);
    expect(
      screen.getByRole("link", { name: /browse categories/i })
    ).toHaveAttribute("href", "/categories");
  });

  it("renders an admin-only owner-demo issue backlog snapshot for authorised admins", () => {
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
    expect(shellSource).toContain(ownerDemoIssueBacklogPath);
    expect(shellSource).toContain("ownerDemoIssueBacklogSnapshot");
    expect(shellSource).toContain("ownerDemoIssueBacklogLastLocalUpdate");

    const backlogHeading = screen.getByRole("heading", {
      name: /owner-demo issue backlog snapshot/i
    });
    expect(backlogHeading).toBeInTheDocument();
    const backlogCard = backlogHeading.closest("section");
    expect(backlogCard).not.toBeNull();
    const backlogSnapshot = within(backlogCard as HTMLElement);

    expect(screen.getByText(ownerDemoIssueBacklogPath)).toBeInTheDocument();
    expect(backlogSnapshot.getByText(/^Template only$/i)).toBeInTheDocument();
    expect(backlogSnapshot.getByText(/public route issues/i)).toBeInTheDocument();
    expect(backlogSnapshot.getByText(/admin workflow issues/i)).toBeInTheDocument();
    expect(backlogSnapshot.getByText(/future launch\/deployment blockers/i)).toBeInTheDocument();
    expect(
      backlogSnapshot.getByText(
        /not approved \/ separate explicit approval required/i
      )
    ).toBeInTheDocument();
    expect(backlogSnapshot.getByText(/\[DATE PLACEHOLDER\]/i)).toBeInTheDocument();
  });

  it("does not render owner-demo issue backlog details for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(
        screen.queryByText(/owner-demo issue backlog snapshot/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(ownerDemoIssueBacklogPath)).not.toBeInTheDocument();
      expect(screen.queryByText(/future launch\/deployment blockers/i)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps Phase 3R public and admin copy inside repo-local no-provider, no-deploy, no-evidence scope", () => {
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
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const phase3rMaterials = [
      extractRequiredSection(
        readRepoFile("docs/DECISION-LOG.md"),
        "## 2026-06-08: Product Acceptance Hardening, Public/Admin Route Polish, And Owner-Demo Issue Backlog Readiness",
        "## 2026-06-08: Repo-Local Owner-Demo Polish, Public Journey QA Hardening, And Protected Admin Closure Workspace Polish"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-ROADMAP.md"),
        "## Phase 3R: Product Acceptance Hardening, Public/Admin Route Polish, And Owner-Demo Issue Backlog Readiness"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-STATUS.md"),
        "Current phase: Phase 3R-A/B - repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness.",
        "Previous Current Phase 3Q-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-2-READINESS-PLAN.md"),
        "Current Phase 3R-A/B status:",
        "Previous Current Phase 3Q-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md"),
        "## Phase 3R-A/B Product Acceptance Hardening Public-Admin Route Polish And Owner-Demo Issue Backlog Readiness",
        "## Phase 3Q-A/B Repo-Local Owner-Demo Polish Public Journey QA Hardening And Protected Admin Closure Workspace Polish"
      ),
      readRepoFile(ownerDemoIssueBacklogPath)
    ].join("\n");

    expect(publicSource).toMatch(/listing/i);
    expect(publicSource).toMatch(/enquiry/i);
    expect(publicSource).toMatch(/quote/i);
    expect(publicSource).toMatch(/request/i);
    expect(publicSource).toMatch(/rental/i);
    expect(publicSource).toMatch(/event furniture/i);
    expect(publicSource).not.toMatch(forbiddenContactFactPattern);
    expect(publicSource).not.toMatch(forbiddenBusinessFactPattern);
    expect(publicSource).not.toMatch(forbiddenCustomerFlowTermPattern);
    expect(publicSource).not.toMatch(publicInternalLeakPattern);
    expect(phase3rMaterials).not.toMatch(forbiddenCustomerFlowTermPattern);
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
