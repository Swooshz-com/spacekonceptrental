import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CategoryManagementPanel } from "../components/admin/category-management-panel";
import { ListingImageMetadataManagementPanel } from "../components/admin/listing-image-metadata-management-panel";
import { ListingImageUploadPanel } from "../components/admin/listing-image-upload-panel";
import { ListingManagementPanel } from "../components/admin/listing-management-panel";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3xMergeCommit = "50316a5c4052607487ba7409d5dc854889db6e24";
const safeguardPath = "docs/content/PROTECTED-ADMIN-DESTRUCTIVE-ACTION-SAFEGUARDS.md";
const recoveryPath = "docs/content/PROTECTED-ADMIN-RECOVERY-LANE.md";
const matrixPath = "docs/content/PROTECTED-ADMIN-STATUS-TRANSITION-MATRIX.md";

const publicInternalLeakPattern = new RegExp(
  [
    "Owner-demo",
    "walkthrough",
    "closure readiness",
    "deployment approval",
    "internal review",
    "admin-only",
    "protected content readiness",
    "owner input required",
    "issue backlog",
    "route inventory",
    "acceptance status",
    "local release-candidate",
    "command centre",
    "owner handoff",
    "handoff pack",
    "deployment firewall",
    "acceptance triage",
    "destructive-action safeguards",
    "recovery lane statuses",
    "status-transition matrix",
    "protected admin destructive-action/recovery snapshot",
    "protected admin urls",
    "internal notes",
    "admin-only readiness",
    "\/admin\/content-readiness"
  ].join("|"),
  "i"
);
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
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim/i;
const forbiddenContactFactPattern =
  /\b(?!(?:\d{4}-\d{2}-\d{2})\b)(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const filledEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on|suite passed on|owner feedback recorded/i;

const sampleCategory = {
  id: "category-1",
  slug: "lounge",
  name: "Lounge",
  description: "Lounge group",
  sortOrder: 1,
  isPublished: true,
  productCount: 1,
  publishedProductCount: 1,
  products: [
    {
      id: "product-1",
      slug: "modular-lounge-set",
      name: "Modular Lounge Set",
      status: "published" as const
    }
  ]
};
const sampleListing = {
  id: "product-1",
  categoryId: "category-1",
  slug: "modular-lounge-set",
  name: "Modular Lounge Set",
  shortDescription: "Flexible lounge setup for event furniture rental planning.",
  description: "Flexible modular seating for receptions and networking areas.",
  rentalUnit: "set",
  status: "published" as const,
  sortOrder: 1,
  imageCount: 1,
  primaryImageAltText: "Modular lounge set arranged for event furniture rental browsing."
};
const sampleImage = {
  id: "image-1",
  productId: "product-1",
  storageBucket: "public",
  storagePath: "sample/modular-lounge-set.png",
  altText: "Modular lounge set arranged for event furniture rental browsing.",
  sortOrder: 1,
  isPrimary: true,
  status: "active" as const
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

describe("Phase 3Y-A/B protected admin destructive-action safeguards", () => {
  afterEach(() => {
    cleanup();
  });

  it("rolls status docs forward from the Phase 3X PR #146 merge commit", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = normalizeWhitespace(readRepoFile("docs/DECISION-LOG.md"));
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const ownerDocs = normalizeWhitespace([
      readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md"),
      readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md"),
      readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md")
    ].join("\n"));

    expect(status).toContain(
      "Current phase: Phase 3Y-A/B - protected admin destructive-action safeguards, recovery lanes, and local acceptance coverage."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3X-A/B protected admin write-ops hardening, content-operation guardrails, and local acceptance coverage."
    );
    expect(status).toContain("Last merged capability PR: #146");
    expect(status).toContain(`Merge commit: \`${phase3xMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3X-A/B status");
    expect(roadmap).toContain("Phase 3Y-A/B hardens protected admin destructive-action safeguards");
    expect(readiness).toContain("Current Phase 3Y-A/B status");
    expect(readiness).toContain("Previous Current Phase 3X-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3Y-A/B adds protected admin destructive-action safeguard docs, recovery lane guidance, a status-transition matrix"
    );
    expect(checklist).toContain(
      "## Phase 3Y-A/B Protected Admin Destructive-Action Safeguards Recovery Lanes And Local Acceptance Coverage"
    );
    expect(ownerDocs).toContain(safeguardPath);
    expect(ownerDocs).toContain(recoveryPath);
    expect(ownerDocs).toContain(matrixPath);
  });

  it("adds template-only destructive-action, recovery lane, and transition matrix docs", () => {
    expect(readTrackedFiles([safeguardPath, recoveryPath, matrixPath]).sort()).toEqual([
      safeguardPath,
      recoveryPath,
      matrixPath
    ].sort());

    const safeguards = readRepoFile(safeguardPath);
    const recovery = readRepoFile(recoveryPath);
    const matrix = readRepoFile(matrixPath);
    const combined = normalizeWhitespace([safeguards, recovery, matrix].join("\n"));

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Listing archive",
      "Listing unpublish/draft",
      "Category unpublish/archive",
      "Media archive/deactivate",
      "Primary image changes",
      "Quote status transitions",
      "Quote internal note updates",
      "Recovery from failed admin writes",
      "Protected action",
      "Risk being guarded",
      "Admin confirmation/helper text",
      "Public exposure boundary",
      "Recovery path",
      "Local acceptance placeholder",
      "Deployment approval remains not granted",
      "Failed listing save",
      "Missing category",
      "Listing missing public-safe description",
      "Missing rental unit",
      "Listing missing media",
      "Media missing alt text",
      "Category published but empty",
      "Quote status update failure",
      "Quote internal note update failure",
      "Admin review required",
      "Owner input required",
      "Retry protected write",
      "Keep draft/protected",
      "Safe to retry locally",
      "Blocked before public visibility",
      "Requires separate deployment approval",
      "Listing",
      "Category",
      "Media",
      "Quote request",
      "draft",
      "published",
      "archived",
      "unpublished",
      "active",
      "primary",
      "new",
      "reviewing",
      "quoted",
      "closed",
      "No guaranteed availability",
      "No confirmed booking",
      "No public quote status tracking",
      "No payment/order/checkout wording",
      "No deployment approval",
      "[LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(combined).toContain(required);
    }

    expect(combined).not.toMatch(filledEvidencePattern);
    expect(combined.replace(/No guaranteed availability/g, "No availability guarantee")).not.toMatch(forbiddenBusinessFactPattern);
    expect(combined).not.toMatch(forbiddenContactFactPattern);
  });

  it("shows safer helper and recovery text in protected admin panels", () => {
    render(<ListingManagementPanel categories={[sampleCategory]} products={[sampleListing]} />);
    let text = document.body.textContent ?? "";
    expect(text).toMatch(/Draft keeps the listing protected/i);
    expect(text).toMatch(/Protected write boundary: save listing metadata only/i);
    cleanup();

    render(<CategoryManagementPanel categories={[sampleCategory]} />);
    text = document.body.textContent ?? "";
    expect(text).toMatch(/Non-visible or archived categories stay out of public browsing/i);
    expect(text).toMatch(/Protected write boundary: save category metadata only/i);
    cleanup();

    render(<ListingImageUploadPanel products={[sampleListing]} />);
    text = document.body.textContent ?? "";
    expect(text).toMatch(/If upload fails, keep the listing draft\/protected/i);
    expect(text).toMatch(/after alt-text review/i);
    cleanup();

    render(<ListingImageMetadataManagementPanel images={[sampleImage]} products={[sampleListing]} />);
    text = document.body.textContent ?? "";
    expect(text).toMatch(/keep the prior protected media state/i);
    expect(text).toMatch(/review alt text and primary selection/i);
  });

  it("keeps public source free from admin recovery details, forbidden customer flows, and fake facts", () => {
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
    expect(publicSource).not.toMatch(
      /Admin review required|Retry protected write|Keep draft\/protected|Safe to retry locally|Blocked before public visibility|Requires separate deployment approval|status-transition matrix|destructive-action safeguards|internal notes|admin-only readiness|\/admin\//i
    );
    expect(publicSource).not.toMatch(forbiddenCustomerFlowTermPattern);
    expect(publicSource).not.toMatch(forbiddenBusinessFactPattern);
    expect(publicSource).not.toMatch(forbiddenContactFactPattern);
    expect(publicSource).not.toMatch(/public quote tracking|customer account|customer upload|CRM|notification/i);
  });

  it("keeps forbidden runtime/provider/deployment files and env reads absent", () => {
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
