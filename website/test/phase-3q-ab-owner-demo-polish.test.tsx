import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import HomePage from "../app/page";
import QuotePage from "../app/quote/page";
import NotFound from "../app/not-found";
import type {
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
const phase3pMergeCommit = "586d17e3f909fcf2986115633bb329a06fbcdf49";
const ownerDemoWalkthroughPath = "docs/content/OWNER-DEMO-WALKTHROUGH.md";
const protectedAdminShellPath = "website/app/admin/protected-admin-shell.tsx";
const contentReadinessRoutePath = "website/app/admin/content-readiness/page.tsx";

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
const ownerOnlyDemoPattern =
  /Owner-demo walkthrough|Owner-demo walkthrough snapshot|Protected content readiness workspace|\/admin\/content-readiness|admin-only readiness|Admin-only notes|Current owner-review closure state|DEPLOYMENT APPROVAL: NOT GRANTED|Owner-review closure packet|Owner-review closure sign-off template|deployment approval separation|Public review prompts|Review the rental journey|Confirm each listing|Check that categories|Make sure the enquiry path|Request review|owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness/i;
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

describe("Phase 3Q-A/B owner-demo polish", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3Q-A/B as current after Phase 3P completed in PR #138", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const currentStatus = normalizeWhitespace(
      status.split("## Remaining-work map")[0] ?? status
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
      "Current phase: Phase 3Q-A/B - repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3P-A/B owner-review closure packet, readiness sign-off template, and deployment approval separation."
    );
    expect(currentStatus).toContain("Last merged capability PR: #138");
    expect(currentStatus).toContain(`Merge commit: \`${phase3pMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3P-A/B status");
    expect(roadmap).toContain(
      "Phase 3Q-A/B adds repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish"
    );
    expect(readiness).toContain("Current Phase 3Q-A/B status");
    expect(readiness).toContain("Previous Current Phase 3P-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3Q-A/B adds repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish."
    );
    expect(checklist).toContain(
      "## Phase 3Q-A/B Repo-Local Owner-Demo Polish Public Journey QA Hardening And Protected Admin Closure Workspace Polish"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(ownerDemoWalkthroughPath);
    expect(combinedOwnerDocs).toContain("Owner-demo walkthrough");
    expect(combinedOwnerDocs).toContain("public journey review");
    expect(combinedOwnerDocs).toContain("protected admin closure workspace");
    expect(validator).toContain(phase3pMergeCommit);
    expect(validator).toContain(ownerDemoWalkthroughPath);
    expect(validator).toContain("Phase 3Q-A/B");
  });

  it("adds a template-only owner-demo walkthrough without recording evidence or approval", () => {
    expect(existsSync(resolve(repoRoot, ownerDemoWalkthroughPath))).toBe(true);
    expect(readTrackedFiles([ownerDemoWalkthroughPath])).toEqual([
      ownerDemoWalkthroughPath
    ]);

    const walkthrough = readRepoFile(ownerDemoWalkthroughPath);
    const normalizedWalkthrough = normalizeWhitespace(walkthrough);

    for (const required of [
      "This walkthrough is repo-local, template-only, and non-live.",
      "Public homepage review",
      "Public catalogue/listing review",
      "Public category/event-use review",
      "Public quote/enquiry request review",
      "Protected admin overview review",
      "Protected admin listing/category/media review",
      "Protected admin quote workflow review",
      "Protected content readiness / closure workspace review",
      "What the owner should check",
      "What remains owner input required",
      "What remains blocked until explicit later approval",
      "This must not be treated as deployment approval",
      "[OWNER REVIEWER]",
      "[REVIEW DATE]",
      "[ROUTE REVIEWED]",
      "[OWNER INPUT REQUIRED]",
      "[LOCAL ISSUE / FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalizedWalkthrough).toContain(required);
    }

    expect(walkthrough).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(walkthrough).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(walkthrough).not.toMatch(forbiddenEnvInstructionPattern);
    expect(walkthrough).not.toMatch(forbiddenBusinessFactPattern);
    expect(walkthrough).not.toMatch(forbiddenContactFactPattern);
    expect(walkthrough).not.toMatch(forbiddenCustomerFlowTermPattern);
    expect(walkthrough).not.toMatch(filledReviewEvidencePattern);
  });

  it("polishes the public rental journey with customer-facing listing, enquiry, quote, request, rental, and event furniture wording", async () => {
    render(await HomePage());
    expect(
      screen.getByRole("heading", { name: /plan your rental journey/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/listings, categories, event-use guidance, and quote requests help you describe the setup/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /find suitable rental pieces/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /plan by event setup/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /send a quote request/i })
    ).toBeInTheDocument();

    cleanup();
    render(<ProductPageContent product={loungeProduct} />);
    expect(
      screen.getByRole("heading", { name: /before requesting a quote/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/send the listing with your event details for follow-up/i)
    ).toBeInTheDocument();

    cleanup();
    render(await QuotePage());
    expect(screen.getByText(/before you send/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /review before sending/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/event date, venue, requested listings, quantities, and setup notes/i)
    ).toBeInTheDocument();

    cleanup();
    render(<NotFound />);
    expect(
      screen.getByRole("link", { name: /plan event setups/i })
    ).toHaveAttribute("href", "/events");
  });

  it("renders an admin-only owner-demo snapshot inside the protected content readiness workspace", () => {
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

    expect(readRepoFile(contentReadinessRoutePath)).toContain(
      'view={{ kind: "content-readiness" }}'
    );
    const shellSource = readRepoFile(protectedAdminShellPath);
    expect(shellSource).toContain(ownerDemoWalkthroughPath);
    expect(shellSource).toContain("ownerDemoWalkthroughSnapshot");
    expect(shellSource).toContain("ownerDemoSnapshotLastLocalPacketUpdate");

    const ownerDemoSnapshotHeading = screen.getByRole("heading", {
      name: /owner-demo walkthrough snapshot/i
    });
    expect(ownerDemoSnapshotHeading).toBeInTheDocument();
    const ownerDemoSnapshotCard = ownerDemoSnapshotHeading.closest("section");
    expect(ownerDemoSnapshotCard).not.toBeNull();
    const ownerDemoSnapshot = within(ownerDemoSnapshotCard as HTMLElement);

    expect(screen.getByText(ownerDemoWalkthroughPath)).toBeInTheDocument();
    expect(ownerDemoSnapshot.getByText(/public journey review/i)).toBeInTheDocument();
    expect(ownerDemoSnapshot.getByText(/admin workflow review/i)).toBeInTheDocument();
    expect(ownerDemoSnapshot.getByText(/^Closure readiness$/i)).toBeInTheDocument();
    expect(
      ownerDemoSnapshot.getAllByText(/\[TEMPLATE ONLY\]/i).length
    ).toBeGreaterThan(2);
    expect(
      ownerDemoSnapshot.getByText(
        /not approved \/ separate explicit approval required/i
      )
    ).toBeInTheDocument();
    expect(ownerDemoSnapshot.getByText(/\[DATE PLACEHOLDER\]/i)).toBeInTheDocument();
  });

  it("does not render owner-demo or closure workspace details for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(
        screen.queryByText(/owner-demo walkthrough snapshot/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(ownerDemoWalkthroughPath)).not.toBeInTheDocument();
      expect(screen.queryByText(/\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps Phase 3Q public and admin copy inside repo-local no-provider, no-deploy, no-evidence scope", () => {
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
    const phase3qMaterials = [
      extractRequiredSection(
        readRepoFile("docs/DECISION-LOG.md"),
        "## 2026-06-08: Repo-Local Owner-Demo Polish, Public Journey QA Hardening, And Protected Admin Closure Workspace Polish",
        "## 2026-06-08: Owner-Review Closure Packet, Readiness Sign-Off Template, And Deployment Approval Separation"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-ROADMAP.md"),
        "## Phase 3Q: Repo-Local Owner-Demo Polish, Public Journey QA Hardening, And Protected Admin Closure Workspace Polish"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-STATUS.md"),
        "Current phase: Phase 3Q-A/B - repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish.",
        "Previous Current Phase 3P-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-2-READINESS-PLAN.md"),
        "Current Phase 3Q-A/B status:",
        "Previous Current Phase 3P-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md"),
        "## Phase 3Q-A/B Repo-Local Owner-Demo Polish Public Journey QA Hardening And Protected Admin Closure Workspace Polish",
        "## Phase 3P-A/B Owner-Review Closure Packet Readiness Sign-Off Template And Deployment Approval Separation"
      ),
      readRepoFile(ownerDemoWalkthroughPath)
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
    expect(publicSource).not.toMatch(ownerOnlyDemoPattern);
    expect(phase3qMaterials).not.toMatch(forbiddenCustomerFlowTermPattern);
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
