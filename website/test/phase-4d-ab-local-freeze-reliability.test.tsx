import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const localFreezePath = "docs/content/LOCAL-RELEASE-CANDIDATE-FREEZE.md";
const fullSuiteGatePath = "docs/content/FULL-SUITE-RELIABILITY-GATE.md";
const deploymentFirewallPath = "docs/content/DEPLOYMENT-PLANNING-FIREWALL-CLOSURE.md";
const phase151MergeCommit = "9c7d167f98694f2ffbb1d9a0439c9fbbed4a9336";

const publicLeakPattern = new RegExp(
  [
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
    "Owner-review templates",
    "protected admin urls",
    "internal notes",
    "recovery lane statuses",
    "destructive-action safeguards",
    "status-transition matrix details",
    "\\/admin\\/"
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
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|preview evidence captured|production evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on/i;

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

describe("Phase 4D-A/B local freeze reliability gate", () => {
  afterEach(() => cleanup());

  it("adds template-only local freeze, full-suite reliability, and deployment firewall docs", () => {
    expect(readTrackedFiles([localFreezePath, fullSuiteGatePath, deploymentFirewallPath]).sort()).toEqual(
      [localFreezePath, fullSuiteGatePath, deploymentFirewallPath].sort()
    );

    const combined = normalizeWhitespace(
      [readRepoFile(localFreezePath), readRepoFile(fullSuiteGatePath), readRepoFile(deploymentFirewallPath)].join("\n")
    );

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Locally frozen",
      "Owner input still required",
      "Local correction still required",
      "Protected admin review still required",
      "Public visibility still blocked",
      "Deployment planning still blocked",
      "Requires separate deployment approval",
      "Freeze area",
      "Required local proof",
      "Remaining blocker placeholder",
      "Owner input boundary",
      "Public exposure boundary",
      "Evidence status",
      "Deployment approval status",
      "[NOT EVIDENCE / NOT RECORDED]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]",
      "Full website tests must not hang",
      "Targeted tests do not replace the full suite",
      "CI-green is required before merge",
      "No validator or suite may be altered to skip Docker-required checks",
      "No safety assertion may be removed just to pass tests",
      "Local release-candidate freeze is not deployment approval",
      "Owner review rehearsal is not owner sign-off",
      "Owner input placeholders are not owner decisions",
      "Passing local tests is not provider approval",
      "Preview deployment planning is blocked until explicit owner approval",
      "Production launch is blocked"
    ]) {
      expect(combined).toContain(required);
    }

    expect(combined).not.toMatch(forbiddenEvidencePattern);
  });

  it("rolls status docs forward from PR #151", () => {
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

    expect(combined).toContain("Current phase: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure");
    expect(combined).toContain("Latest completed capability: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator");
    expect(combined).toContain("Last merged capability PR: #151");
    expect(combined).toContain(phase151MergeCommit);
    expect(combined).toContain(localFreezePath);
    expect(combined).toContain(fullSuiteGatePath);
    expect(combined).toContain(deploymentFirewallPath);
    expect(combined).toContain("validate:local-freeze");
  });

  it("renders the Phase 4D local-freeze snapshot only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "release-control" }} />);
    expect(screen.getByRole("heading", { name: /phase 4d-a\/b local release-candidate freeze/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /phase 4d local-freeze snapshot/i })).toBeInTheDocument();
    expect(screen.getAllByText(localFreezePath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(fullSuiteGatePath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(deploymentFirewallPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Owner input boundary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Local correction boundary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Public exposure boundary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Evidence boundary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Deployment approval boundary").length).toBeGreaterThan(0);
    cleanup();

    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      render(<AdminShellContent state={state} view={{ kind: "release-control" }} />);
      expect(screen.queryByRole("heading", { name: /phase 4d local-freeze snapshot/i })).not.toBeInTheDocument();
      expect(screen.queryByText(localFreezePath)).not.toBeInTheDocument();
      cleanup();
    }
  });

  it("keeps protected admin shell and route wired to Phase 4D docs", () => {
    const shell = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const route = readRepoFile("website/app/admin/release-control/page.tsx");

    expect(shell).toContain(localFreezePath);
    expect(shell).toContain(fullSuiteGatePath);
    expect(shell).toContain(deploymentFirewallPath);
    expect(shell).toContain("phase4dLocalFreezeSnapshot");
    expect(shell).toContain("phase4dLocalFreezeDocs");
    expect(shell).toContain("Phase 4D local-freeze snapshot");
    expect(route).toContain('view={{ kind: "release-control" }}');
  });

  it("keeps public source free of local-freeze internals and blocked public wording", () => {
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
  });

  it("registers validate:local-freeze", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    expect(packageJson.scripts["validate:local-freeze"]).toBe("node scripts/validate-local-freeze.cjs");
  });
});
