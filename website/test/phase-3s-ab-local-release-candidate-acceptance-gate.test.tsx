import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import { CataloguePageContent } from "../app/catalogue/page";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import { CategoriesPageContent } from "../app/categories/page";
import EventsPage from "../app/events/page";
import HomePage from "../app/page";
import NotFound from "../app/not-found";
import QuotePage from "../app/quote/page";
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
const phase3rMergeCommit = "ef18c2357d37fdb613851c427130bb108861de31";
const acceptanceMatrixPath =
  "docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md";
const routeInventoryFreezePath =
  "docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md";
const localReleaseCandidateValidatorPath =
  "scripts/validate-local-release-candidate.cjs";
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
    "ret" + "ail"
  ].join("|")})s?\\b`,
  "i"
);
const publicInternalLeakPattern =
  /Owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|owner input required|issue backlog|route decision matrix|\/admin\/content-readiness|release-candidate acceptance matrix|route inventory freeze|acceptance status|local release-candidate/i;
const forbiddenBusinessFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i;
const forbiddenContactFactPattern =
  /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const filledEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on/i;
const forbiddenProviderCommandPattern =
  /\b(?:vercel\s+(?:deploy|link|env|pull|promote)|supabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))|curl\s+|fetch\()\b/i;

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

describe("Phase 3S-A/B local release-candidate acceptance gate", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3S-A/B as current after Phase 3R completed in PR #140", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const currentStatus = normalizeWhitespace(
      status.split("Previous Current Phase 3R-A/B status:")[0] ?? status
    );
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const ownerReview = readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md");
    const manualQa = readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md");
    const handoff = readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md");
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const previewValidator = readRepoFile("scripts/validate-preview-handoff.cjs");
    const localValidator = readRepoFile(localReleaseCandidateValidatorPath);

    expect(currentStatus).toContain(
      "Current phase: Phase 3S-A/B - repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3R-A/B repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness."
    );
    expect(currentStatus).toContain("Last merged capability PR: #140");
    expect(currentStatus).toContain(`Merge commit: \`${phase3rMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3R-A/B status");
    expect(roadmap).toContain(
      "Phase 3S-A/B adds a repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness"
    );
    expect(readiness).toContain("Current Phase 3S-A/B status");
    expect(readiness).toContain("Previous Current Phase 3R-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3S-A/B adds a repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness."
    );
    expect(checklist).toContain(
      "## Phase 3S-A/B Local Release-Candidate Acceptance Gate Route Inventory Freeze And Public-Admin Regression Harness"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(acceptanceMatrixPath);
    expect(combinedOwnerDocs).toContain(routeInventoryFreezePath);
    expect(combinedOwnerDocs).toContain("local release-candidate acceptance gate");
    expect(packageJson.scripts["validate:local-release-candidate"]).toBe(
      "node scripts/validate-local-release-candidate.cjs"
    );
    expect(previewValidator).toContain(acceptanceMatrixPath);
    expect(previewValidator).toContain(routeInventoryFreezePath);
    expect(localValidator).toContain(phase3rMergeCommit);
    expect(localValidator).not.toMatch(forbiddenProviderCommandPattern);
  });

  it("adds a template-only local release-candidate acceptance matrix", () => {
    expect(existsSync(resolve(repoRoot, acceptanceMatrixPath))).toBe(true);
    expect(readTrackedFiles([acceptanceMatrixPath])).toEqual([
      acceptanceMatrixPath
    ]);

    const matrix = readRepoFile(acceptanceMatrixPath);
    const normalizedMatrix = normalizeWhitespace(matrix);

    for (const required of [
      "This matrix is repo-local, template-only, non-live, and not evidence.",
      "Public route inventory",
      "Protected admin route inventory",
      "Route purpose",
      "Audience",
      "Allowed public wording",
      "Forbidden public wording",
      "Data boundary",
      "Owner input status",
      "Deployment boundary",
      "Acceptance status placeholder",
      "Follow-up placeholder",
      "[ROUTE]",
      "[PUBLIC / PROTECTED ADMIN]",
      "[PURPOSE]",
      "[DATA BOUNDARY]",
      "[ACCEPTANCE STATUS: NOT RUN / PASS / NEEDS FOLLOW-UP]",
      "[OWNER INPUT REQUIRED]",
      "[LOCAL FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalizedMatrix).toContain(required);
    }

    expect(matrix).not.toMatch(filledEvidencePattern);
    expect(matrix).not.toMatch(forbiddenProviderCommandPattern);
    expect(matrix).not.toMatch(forbiddenBusinessFactPattern);
    expect(matrix).not.toMatch(forbiddenContactFactPattern);
  });

  it("adds a local route inventory freeze without preview or production evidence", () => {
    expect(existsSync(resolve(repoRoot, routeInventoryFreezePath))).toBe(true);
    expect(readTrackedFiles([routeInventoryFreezePath])).toEqual([
      routeInventoryFreezePath
    ]);

    const routeFreeze = readRepoFile(routeInventoryFreezePath);
    const normalizedRouteFreeze = normalizeWhitespace(routeFreeze);

    for (const required of [
      "This is a freeze of local expectations only.",
      "It is not production route evidence.",
      "It is not preview evidence.",
      "Public homepage",
      "Public listings/catalogue index",
      "Public listing detail",
      "Public categories",
      "Public category-to-listing journey",
      "Public events/event-use guidance",
      "Public quote/enquiry request",
      "Public not-found/recovery",
      "Protected admin overview",
      "Protected admin listings/categories/media",
      "Protected admin quote inbox/detail",
      "Protected content readiness workspace",
      "Audience",
      "Public/admin visibility",
      "Allowed wording",
      "Forbidden public leakage",
      "Data boundary",
      "Expected local test coverage",
      "Deployment boundary"
    ]) {
      expect(normalizedRouteFreeze).toContain(required);
    }

    expect(routeFreeze).not.toMatch(filledEvidencePattern);
    expect(routeFreeze).not.toMatch(forbiddenProviderCommandPattern);
    expect(routeFreeze).not.toMatch(forbiddenBusinessFactPattern);
    expect(routeFreeze).not.toMatch(forbiddenContactFactPattern);
  });

  it("keeps public route copy customer-facing for the rental website candidate", async () => {
    render(await HomePage());
    expect(screen.getByRole("heading", { name: /event furniture rental/i })).toBeInTheDocument();
    expect(screen.getByText(/request a rental quote/i)).toBeInTheDocument();
    expect(screen.getByText(/event furniture/i)).toBeInTheDocument();

    cleanup();
    render(<CataloguePageContent catalogue={emptyCatalogue} />);
    expect(screen.getByRole("link", { name: /browse categories/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /browse event setup guidance/i })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: /send a general enquiry/i })).toHaveAttribute("href", "/quote");

    cleanup();
    render(<CategoriesPageContent catalogue={catalogue} />);
    expect(screen.getByRole("link", { name: /compare lounge listings/i })).toHaveAttribute("href", "/listings?category=lounge");

    cleanup();
    render(<ProductPageContent product={loungeProduct} />);
    expect(screen.getByRole("heading", { name: /rental details/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /fit check before enquiry/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request this listing/i })).toHaveAttribute("href", "/quote?listing=modular-lounge-set");

    cleanup();
    render(<EventsPage />);
    expect(screen.getByRole("heading", { name: /plan an event setup/i })).toBeInTheDocument();
    expect(screen.getByText(/quote request/i)).toBeInTheDocument();

    cleanup();
    render(await QuotePage());
    expect(screen.getByRole("heading", { name: /request a rental quote/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /check your enquiry details/i })).toBeInTheDocument();

    cleanup();
    render(<NotFound />);
    expect(screen.getByRole("link", { name: /browse categories/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /request a quote/i })).toHaveAttribute("href", "/quote");
  });

  it("renders an admin-only local acceptance snapshot for authorised admins", () => {
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
    expect(shellSource).toContain(acceptanceMatrixPath);
    expect(shellSource).toContain(routeInventoryFreezePath);
    expect(shellSource).toContain("localAcceptanceSnapshot");
    expect(shellSource).toContain("localAcceptanceLastLocalUpdate");

    const heading = screen.getByRole("heading", {
      name: /local release-candidate acceptance snapshot/i
    });
    expect(heading).toBeInTheDocument();
    const card = heading.closest("section");
    expect(card).not.toBeNull();
    const snapshot = within(card as HTMLElement);

    expect(screen.getByText(acceptanceMatrixPath)).toBeInTheDocument();
    expect(screen.getByText(routeInventoryFreezePath)).toBeInTheDocument();
    expect(snapshot.getAllByText(/^Template only$/i).length).toBeGreaterThanOrEqual(2);
    expect(snapshot.getByText(/public route acceptance/i)).toBeInTheDocument();
    expect(snapshot.getByText(/protected admin acceptance/i)).toBeInTheDocument();
    expect(snapshot.getByText(/public leakage audit/i)).toBeInTheDocument();
    expect(
      snapshot.getByText(/not approved \/ separate explicit approval required/i)
    ).toBeInTheDocument();
    expect(snapshot.getByText(/\[DATE PLACEHOLDER\]/i)).toBeInTheDocument();
  });

  it("does not render the local acceptance snapshot for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(
        screen.queryByText(/local release-candidate acceptance snapshot/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(acceptanceMatrixPath)).not.toBeInTheDocument();
      expect(screen.queryByText(routeInventoryFreezePath)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps tracked public source and local gate inside no-provider, no-deploy, no-evidence boundaries", () => {
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
    const phase3sDocs = [
      extractRequiredSection(
        readRepoFile("docs/DECISION-LOG.md"),
        "## 2026-06-09: Local Release-Candidate Acceptance Gate, Route Inventory Freeze, And Public/Admin Regression Harness",
        "## 2026-06-08: Product Acceptance Hardening, Public/Admin Route Polish, And Owner-Demo Issue Backlog Readiness"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-ROADMAP.md"),
        "## Phase 3S: Local Release-Candidate Acceptance Gate, Route Inventory Freeze, And Public/Admin Regression Harness"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-STATUS.md"),
        "Current phase: Phase 3S-A/B - repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness.",
        "Previous Current Phase 3R-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-2-READINESS-PLAN.md"),
        "Current Phase 3S-A/B status:",
        "Previous Current Phase 3R-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md"),
        "## Phase 3S-A/B Local Release-Candidate Acceptance Gate Route Inventory Freeze And Public-Admin Regression Harness",
        "## Phase 3R-A/B Product Acceptance Hardening Public-Admin Route Polish And Owner-Demo Issue Backlog Readiness"
      ),
      readRepoFile(acceptanceMatrixPath),
      readRepoFile(routeInventoryFreezePath)
    ].join("\n");
    const localValidator = readRepoFile(localReleaseCandidateValidatorPath);

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
    expect(phase3sDocs).not.toMatch(filledEvidencePattern);
    expect(phase3sDocs).not.toMatch(forbiddenProviderCommandPattern);
    expect(localValidator).not.toMatch(forbiddenProviderCommandPattern);
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
