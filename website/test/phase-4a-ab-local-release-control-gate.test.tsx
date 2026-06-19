import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase4aGatePath = "docs/release/PHASE-4A-LOCAL-RELEASE-CONTROL-GATE.md";
const ownerRehearsalPath = "docs/content/OWNER-REVIEW-REHEARSAL-RUNBOOK.md";
const firewallMatrixPath = "docs/content/DEPLOYMENT-APPROVAL-FIREWALL-MATRIX.md";
const phase3zMergeCommit = "26792f73f8e7943eac5e421c6d829bde7613b562";

const publicLeakPattern = new RegExp(
  [
    "release-control gate details",
    "owner-review rehearsal details",
    "deployment approval firewall matrix",
    "protected admin urls",
    "internal notes",
    "recovery lane statuses",
    "destructive-action safeguards",
    "status-transition matrix details",
    "owner-review templates",
    "Phase 4A-A/B release-control gate",
    "\/admin\/release-control",
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
  quoteInbox: { status: "loaded" as const, data: { quoteRequests: [] } }
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

describe("Phase 4A-A/B local release-control gate", () => {
  afterEach(() => cleanup());

  it("adds template-only release-control, owner-review rehearsal, and deployment firewall docs", () => {
    expect(readTrackedFiles([phase4aGatePath, ownerRehearsalPath, firewallMatrixPath]).sort()).toEqual(
      [phase4aGatePath, ownerRehearsalPath, firewallMatrixPath].sort()
    );

    const combined = normalizeWhitespace(
      [readRepoFile(phase4aGatePath), readRepoFile(ownerRehearsalPath), readRepoFile(firewallMatrixPath)].join("\n")
    );

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Local review ready",
      "Owner input required",
      "Local correction required",
      "Protected admin review required",
      "Blocked before public visibility",
      "Blocked before deployment planning",
      "Requires separate deployment approval",
      "Public route readiness",
      "Quote/enquiry expectation boundary",
      "Listing/category/media readiness",
      "Protected admin write/destructive-action safeguards",
      "Public leakage boundary",
      "Fake-fact/business-claim boundary",
      "Provider/runtime/deployment boundary",
      "Local acceptance command boundary",
      "What to show",
      "What not to claim",
      "Owner decision needed placeholder",
      "Missing owner input placeholder",
      "Local correction placeholder",
      "Deployment approval placeholder",
      "No owner feedback is recorded",
      "No owner sign-off is recorded",
      "No deployment approval is granted",
      "No preview/production evidence is created",
      "Local review",
      "Local tests",
      "Local build",
      "Local seed/sandbox checks",
      "Owner review rehearsal",
      "Owner feedback intake",
      "Preview deployment planning",
      "Actual deployment",
      "Production launch",
      "[LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(combined).toContain(required);
    }

    expect(combined).not.toMatch(forbiddenEvidencePattern);
  });

  it("rolls status docs forward from PR #148", () => {
    const combined = normalizeWhitespace(
      [
        readRepoFile("docs/PHASE-STATUS.md"),
        readRepoFile("docs/PHASE-ROADMAP.md"),
        readRepoFile("docs/PHASE-2-READINESS-PLAN.md"),
        readRepoFile("docs/DECISION-LOG.md"),
        readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md"),
        readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md"),
        readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md"),
        readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md")
      ].join("\n")
    );

    expect(combined).toContain("Current phase: Phase 4A-A/B");
    expect(combined).toContain(
      "Latest completed capability: Phase 3Z-A/B public route readiness closure, protected admin review bridge, and local acceptance coverage"
    );
    expect(combined).toContain("Last merged capability PR: #148");
    expect(combined).toContain(phase3zMergeCommit);
    expect(combined).toContain(phase4aGatePath);
    expect(combined).toContain(ownerRehearsalPath);
    expect(combined).toContain(firewallMatrixPath);
  });

  it("renders the release-control workspace only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "release-control" }} />);
    expect(screen.getByRole("heading", { name: /phase 4d-a\/b local release-candidate freeze/i })).toBeInTheDocument();
    expect(screen.getByText("Current phase")).toBeInTheDocument();
    expect(screen.getByText("Phase 4C-A/B")).toBeInTheDocument();
    expect(screen.getByText("Last merged capability PR")).toBeInTheDocument();
    expect(screen.getByText("#150")).toBeInTheDocument();
    expect(screen.getByText(phase4aGatePath)).toBeInTheDocument();
    expect(screen.getByText(ownerRehearsalPath)).toBeInTheDocument();
    expect(screen.getByText(firewallMatrixPath)).toBeInTheDocument();
    cleanup();

    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      render(<AdminShellContent state={state} view={{ kind: "release-control" }} />);
      expect(screen.queryByRole("heading", { name: /phase 4d-a\/b local release-candidate freeze/i })).not.toBeInTheDocument();
      expect(screen.queryByText(phase4aGatePath)).not.toBeInTheDocument();
      cleanup();
    }
  });

  it("keeps protected admin shell and route wired to release-control docs", () => {
    const shell = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const route = readRepoFile("website/app/admin/release-control/page.tsx");

    expect(shell).toContain(phase4aGatePath);
    expect(shell).toContain(ownerRehearsalPath);
    expect(shell).toContain(firewallMatrixPath);
    expect(shell).toContain("phase4aReleaseControlSnapshot");
    expect(shell).toContain("Release control");
    expect(shell).toContain('view.kind === "release-control"');
    expect(route).toContain('view={{ kind: "release-control" }}');
  });

  it("keeps public source free of protected release-control internals and blocked public wording", () => {
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

    expect(publicSource).not.toMatch(publicLeakPattern);
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
