import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ownerApprovalPacketPath = "docs/content/OWNER-APPROVAL-REQUEST-PACKET.md";
const previewPlanningHandoffPath = "docs/content/PREVIEW-PLANNING-HANDOFF-TEMPLATE.md";
const finalNoDeployGatePath = "docs/content/FINAL-NO-DEPLOY-DECISION-GATE.md";
const phase152MergeCommit = "10950d11ca6c40580982f35e615b3cf063f58a49";

const publicLeakPattern = new RegExp(
  [
    "Owner approval request packet",
    "Preview-planning handoff template",
    "Final no-deploy decision gate",
    "Local release-candidate freeze",
    "Full-suite reliability gate",
    "Deployment-planning firewall closure",
    "Local owner-review rehearsal pack",
    "Local blocker ledger",
    "Local acceptance drill",
    "Owner-input intake control",
    "Local correction queue",
    "Review-ready handoff closure",
    "Release-control internals",
    "Owner-input queue internals",
    "Owner-review templates",
    "protected admin urls",
    "internal notes",
    "recovery lane statuses",
    "destructive-action safeguards",
    "status-transition matrix details",
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
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|preview evidence captured|production evidence captured|manual QA completed|acceptance passed on/i;

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

describe("Phase 4E-A/B owner approval request gate", () => {
  afterEach(() => cleanup());

  it("adds template-only approval request, preview-planning handoff, and no-deploy gate docs", () => {
    expect(readTrackedFiles([ownerApprovalPacketPath, previewPlanningHandoffPath, finalNoDeployGatePath]).sort()).toEqual(
      [ownerApprovalPacketPath, previewPlanningHandoffPath, finalNoDeployGatePath].sort()
    );

    const combined = normalizeWhitespace(
      [readRepoFile(ownerApprovalPacketPath), readRepoFile(previewPlanningHandoffPath), readRepoFile(finalNoDeployGatePath)].join("\n")
    );

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Owner content review approval",
      "Owner public wording approval",
      "Owner listing/category/media fact approval",
      "Owner quote/enquiry expectation approval",
      "Owner contact/business/service-area fact approval",
      "Owner legal/policy/guarantee wording approval",
      "Owner protected admin workflow review approval",
      "Preview planning approval",
      "Provider/environment setup approval",
      "Deployment approval",
      "Approval request category",
      "What approval would allow",
      "What approval would not allow",
      "Required owner response placeholder",
      "[OWNER RESPONSE PLACEHOLDER:",
      "[NOT EVIDENCE / NOT RECORDED]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]",
      "This PR does not perform preview planning",
      "This PR does not create preview evidence",
      "This PR does not approve provider setup",
      "This PR does not approve deployment",
      "No approval requested",
      "Owner approval required",
      "Preview planning blocked",
      "Provider setup blocked",
      "Deployment blocked",
      "Evidence capture blocked",
      "Owner sign-off not recorded",
      "Allowed now",
      "Blocked now",
      "Required to unblock",
      "Forbidden shortcut",
      "Passing all local validators and tests does not equal approval"
    ]) {
      expect(combined).toContain(required);
    }

    expect(combined).not.toMatch(forbiddenEvidencePattern);
  });

  it("rolls status docs forward from PR #152", () => {
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

    expect(combined).toContain("Current phase: Phase 4E-A/B owner approval request packet, preview-planning handoff template, and final no-deploy decision gate");
    expect(combined).toContain("Latest completed capability: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure");
    expect(combined).toContain("Last merged capability PR: #152");
    expect(combined).toContain(phase152MergeCommit);
    expect(combined).toContain(ownerApprovalPacketPath);
    expect(combined).toContain(previewPlanningHandoffPath);
    expect(combined).toContain(finalNoDeployGatePath);
    expect(combined).toContain("validate:owner-approval-request");
  });

  it("renders the Phase 4E approval-request snapshot only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "release-control" }} />);
    expect(screen.getByRole("heading", { name: /phase 4e approval-request snapshot/i })).toBeInTheDocument();
    expect(screen.getAllByText(ownerApprovalPacketPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(previewPlanningHandoffPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(finalNoDeployGatePath).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Approval request boundary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Owner sign-off boundary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Evidence capture boundary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Provider setup boundary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Deployment approval boundary").length).toBeGreaterThan(0);
    cleanup();

    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      render(<AdminShellContent state={state} view={{ kind: "release-control" }} />);
      expect(screen.queryByRole("heading", { name: /phase 4e approval-request snapshot/i })).not.toBeInTheDocument();
      expect(screen.queryByText(ownerApprovalPacketPath)).not.toBeInTheDocument();
      cleanup();
    }
  });

  it("keeps protected admin shell and route wired to Phase 4E docs", () => {
    const shell = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const route = readRepoFile("website/app/admin/release-control/page.tsx");

    expect(shell).toContain(ownerApprovalPacketPath);
    expect(shell).toContain(previewPlanningHandoffPath);
    expect(shell).toContain(finalNoDeployGatePath);
    expect(shell).toContain("phase4eOwnerApprovalRequestSnapshot");
    expect(shell).toContain("phase4eOwnerApprovalRequestDocs");
    expect(shell).toContain("Phase 4E approval-request snapshot");
    expect(route).toContain('view={{ kind: "release-control" }}');
  });

  it("keeps public source free of Phase 4E internals and blocked public wording", () => {
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

  it("keeps forbidden runtime/provider/deployment files, env reads, suite bypasses, and test skips absent", () => {
    expect(existsSync(resolve(repoRoot, "website/chat-config.js"))).toBe(false);
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
    const suiteRunner = readRepoFile("scripts/validate-release-candidate-suite.cjs");
    const websiteTests = readTrackedFiles(["website"])
      .filter((filePath) => /\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath))
      .map((filePath) => readRepoFile(filePath))
      .join("\n");
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toMatch(/NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N|SUPABASE_SERVICE_ROLE|PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(suiteRunner).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
    expect(websiteTests).not.toMatch(/\b(?:describe|it|test)\.(?:skip|only)\s*\(/);
    expect(websiteTests).not.toMatch(new RegExp(["fake pass place" + "holder", "place" + "holder pass", "safety assertion remo" + "ved", "broad safety assertion re" + "mov"].join("|"), "i"));
  });

  it("registers validate:owner-approval-request", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    expect(packageJson.scripts["validate:owner-approval-request"]).toBe("node scripts/validate-owner-approval-request.cjs");
  });
});
