import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import { CategoryManagementPanel } from "../components/admin/category-management-panel";
import { ListingImageMetadataManagementPanel } from "../components/admin/listing-image-metadata-management-panel";
import { ListingImageUploadPanel } from "../components/admin/listing-image-upload-panel";
import { ListingManagementPanel } from "../components/admin/listing-management-panel";
import { QuoteRequestInboxPanel } from "../components/admin/quote-request-inbox-panel";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3wMergeCommit = "54cd8d5e7b829e56d245da2ca503c9b4058dca76";
const checklistPath = "docs/content/PROTECTED-ADMIN-WRITE-OPS-ACCEPTANCE-CHECKLIST.md";
const protectedAdminShellPath = "website/app/admin/protected-admin-shell.tsx";

const publicInternalLeakPattern =
  /Owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|owner input required|issue backlog|route inventory|acceptance status|local release-candidate|command centre|owner handoff|handoff pack|deployment firewall|acceptance triage|protected admin write-ops checklist|protected admin write-ops acceptance snapshot|\/admin\/content-readiness/i;
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
const sampleQuoteInbox = {
  status: "loaded" as const,
  data: {
    quoteRequests: [
      {
        id: "quote-1",
        publicReference: "QR-20260608-SAMPLE",
        customerName: "Sample enquirer",
        customerEmail: "sample@example.test",
        customerMessage: "Please help with lounge setup options.",
        eventDate: "2026-08-01",
        venue: "Sample venue",
        status: "reviewing" as const,
        source: "website" as const,
        createdAt: "2026-06-08T00:00:00.000Z",
        items: [
          {
            id: "item-1",
            quoteRequestId: "quote-1",
            createdAt: "2026-06-08T00:00:00.000Z",
            productNameSnapshot: "Modular Lounge Set",
            quantity: 1
          }
        ],
        activity: []
      }
    ]
  }
};
const authorisedAdminState = {
  status: "authorised_admin" as const,
  dashboard: {
    status: "loaded" as const,
    data: {
      categories: [sampleCategory],
      products: [sampleListing],
      images: [sampleImage],
      imageSummary: {
        totalImages: 1,
        activeImages: 1,
        primaryImages: 1
      }
    }
  },
  quoteInbox: sampleQuoteInbox
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

describe("Phase 3X-A/B protected admin write-ops hardening", () => {
  afterEach(() => {
    cleanup();
  });

  it("rolls status docs forward from the Phase 3W PR #145 merge commit", () => {
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
      "Current phase: Phase 3X-A/B - protected admin write-ops hardening, content-operation guardrails, and local acceptance coverage."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3W-A/B catalogue listing media hardening, protected admin content-ops polish, and local acceptance coverage."
    );
    expect(status).toContain("Last merged capability PR: #145");
    expect(status).toContain(`Merge commit: \`${phase3wMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3W-A/B status");
    expect(roadmap).toContain("Phase 3X-A/B hardens the protected admin write operations lane");
    expect(readiness).toContain("Current Phase 3X-A/B status");
    expect(readiness).toContain("Previous Current Phase 3W-A/B status");
    expect(normalizeWhitespace(decisionLog)).toContain(
      "Decision: Phase 3X-A/B hardens protected admin listing, category, media, and quote follow-up write operations, content-operation guardrails, and local acceptance coverage."
    );
    expect(checklist).toContain(
      "## Phase 3X-A/B Protected Admin Write-Ops Hardening Content-Operation Guardrails And Local Acceptance Coverage"
    );
    expect(ownerDocs).toContain(checklistPath);
  });

  it("adds a template-only protected admin write-ops acceptance checklist", () => {
    expect(existsSync(resolve(repoRoot, checklistPath))).toBe(true);
    expect(readTrackedFiles([checklistPath])).toEqual([checklistPath]);

    const checklist = readRepoFile(checklistPath);
    const normalized = normalizeWhitespace(checklist);

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Listing Write-Operation Expectations",
      "Category Write-Operation Expectations",
      "Media Write-Operation Expectations",
      "Quote Follow-Up Write-Operation Expectations",
      "Protected Admin-Only Wording",
      "Public Exposure Boundary",
      "Safe Validation And Recovery Copy",
      "Forbidden Public/Customer Workflow Additions",
      "Local Acceptance Placeholders",
      "Deployment Boundary",
      "[ROUTE / AREA]",
      "[PROTECTED ADMIN WRITE CHECK]",
      "[WRITE BOUNDARY]",
      "[PUBLIC EXPOSURE: NONE / PUBLIC FIELD ONLY]",
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

  it("renders the protected admin write-ops snapshot only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "content-readiness" }} />);
    expect(screen.getByRole("heading", { name: /protected admin write-ops acceptance snapshot/i })).toBeInTheDocument();
    expect(screen.getByText("Protected admin write-ops checklist")).toBeInTheDocument();
    expect(screen.getByText("Listing write operations")).toBeInTheDocument();
    expect(screen.getByText("Category write operations")).toBeInTheDocument();
    expect(screen.getByText("Media write operations")).toBeInTheDocument();
    expect(screen.getByText("Quote follow-up operations")).toBeInTheDocument();
    expect(screen.getByText("Public uploads/accounts/tracking")).toBeInTheDocument();
    expect(screen.getByText("Last local write-ops update")).toBeInTheDocument();
    cleanup();

    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      render(<AdminShellContent state={state} view={{ kind: "content-readiness" }} />);
      expect(screen.queryByRole("heading", { name: /protected admin write-ops acceptance snapshot/i })).not.toBeInTheDocument();
      cleanup();
    }
  });

  it("shows listing write UI labels, helper text, readiness, and protected boundary cues", () => {
    render(<ListingManagementPanel categories={[sampleCategory]} products={[sampleListing]} />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/listing name/i);
    expect(text).toMatch(/listing slug/i);
    expect(text).toMatch(/public category grouping/i);
    expect(text).toMatch(/rental unit label/i);
    expect(text).toMatch(/listing short description/i);
    expect(text).toMatch(/listing description/i);
    expect(text).toMatch(/listing status/i);
    expect(text).toMatch(/draft is protected, published is a public visibility state/i);
    expect(text).toMatch(/Protected write boundary: save listing metadata only after checking public-facing fields/i);
  });

  it("shows category write UI labels, helper text, readiness, and protected boundary cues", () => {
    render(<CategoryManagementPanel categories={[sampleCategory]} />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/category name/i);
    expect(text).toMatch(/category slug/i);
    expect(text).toMatch(/category description/i);
    expect(text).toMatch(/category sort order/i);
    expect(text).toMatch(/public grouping/i);
    expect(text).toMatch(/quote\/enquiry recovery/i);
    expect(text).toMatch(/Protected write boundary: save category metadata only when grouping and listing-count cues are clear/i);
  });

  it("shows media write UI labels, public-safe alt text, readiness, and protected boundary cues", () => {
    render(<ListingImageUploadPanel products={[sampleListing]} />);
    let text = document.body.textContent ?? "";
    expect(text).toMatch(/upload image alt text/i);
    expect(text).toMatch(/primary public browsing image/i);
    expect(text).toMatch(/public users cannot upload files here/i);
    cleanup();

    render(<ListingImageMetadataManagementPanel images={[sampleImage]} products={[sampleListing]} />);
    text = document.body.textContent ?? "";
    expect(text).toMatch(/public-safe alt text/i);
    expect(text).toMatch(/Media coverage/i);
    expect(text).toMatch(/primary public browsing image/i);
    expect(text).toMatch(/availability assertion/i);
    expect(text).toMatch(/Protected write boundary: primary and active media choices can affect public browsing/i);
  });

  it("shows quote follow-up labels and protected internal status-only guidance", () => {
    render(<QuoteRequestInboxPanel inbox={sampleQuoteInbox} />);
    expect(screen.getByText(/Protected internal status/i)).toBeInTheDocument();
    expect(screen.getByText(/never shown as a public quote status view/i)).toBeInTheDocument();
    expect(screen.getAllByText(/does not contact the visitor or start an external process/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/does not send messages/i)).toBeInTheDocument();
  });

  it("keeps public source free from protected admin write-ops, completion-flow vocabulary, and fake facts", () => {
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

  it("keeps forbidden tracked config/runtime/evidence paths absent and chat config untracked", () => {
    const shell = readRepoFile(protectedAdminShellPath);
    expect(shell).toContain(checklistPath);
    expect(shell).toContain("protectedAdminWriteOpsAcceptanceSnapshot");
    expect(shell).toContain("Protected admin write-ops acceptance snapshot");
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
