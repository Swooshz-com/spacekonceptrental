import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import HomePage from "../app/page";
import QuotePage from "../app/quote/page";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3sMergeCommit = "7d6af15e09f7603e2107801f3b6417fd4d2d40bc";
const commandCentrePath =
  "docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md";
const suiteRunnerPath = "scripts/validate-release-candidate-suite.cjs";
const localReleaseCandidateValidatorPath =
  "scripts/validate-local-release-candidate.cjs";
const previewHandoffValidatorPath = "scripts/validate-preview-handoff.cjs";
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
  /Owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|owner input required|issue backlog|route inventory|acceptance status|local release-candidate|command centre|\/admin\/content-readiness/i;
const forbiddenBusinessFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim/i;
const forbiddenContactFactPattern =
  /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const filledEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on|suite passed on/i;
const forbiddenRunnerPattern =
  /vercel\s+(?:deploy|link|env|pull|promote)|supabase\s+(?:link|login|secrets|projects|functions|db\s+(?:push|pull|remote|reset))|smoke:preview|curl\b|fetch\s*\(|https?:\/\/|www\.|docs\/(?:evidence|preview-evidence|production-evidence|owner-review-evidence)|(?:^|[\\/])\.env(?:\.|$)|website\/chat-config\.js/i;

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

describe("Phase 3T-A/B local RC command centre", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3T-A/B as current after Phase 3S completed in PR #141", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const currentStatus = normalizeWhitespace(
      status.split("Previous Current Phase 3S-A/B status:")[0] ?? status
    );
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const ownerReview = readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md");
    const manualQa = readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md");
    const handoff = readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md");
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const localValidator = readRepoFile(localReleaseCandidateValidatorPath);
    const previewValidator = readRepoFile(previewHandoffValidatorPath);

    expect(currentStatus).toContain(
      "Current phase: Phase 3T-A/B - local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3S-A/B repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness."
    );
    expect(currentStatus).toContain("Last merged capability PR: #141");
    expect(currentStatus).toContain(`Merge commit: \`${phase3sMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3S-A/B status");
    expect(roadmap).toContain(
      "Phase 3T-A/B adds a local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist"
    );
    expect(readiness).toContain("Current Phase 3T-A/B status");
    expect(readiness).toContain("Previous Current Phase 3S-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3T-A/B adds a local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist."
    );
    expect(checklist).toContain(
      "## Phase 3T-A/B Local Release-Candidate Command Centre Acceptance-Suite Orchestration And No-Deploy Command Allowlist"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(commandCentrePath);
    expect(combinedOwnerDocs).toContain("local release-candidate command centre");
    expect(packageJson.scripts["validate:release-candidate-suite"]).toBe(
      "node scripts/validate-release-candidate-suite.cjs"
    );
    expect(localValidator).toContain(commandCentrePath);
    expect(localValidator).toContain(suiteRunnerPath);
    expect(previewValidator).toContain(commandCentrePath);
    expect(previewValidator).toContain(suiteRunnerPath);
  });

  it("adds a template-only local release-candidate command centre", () => {
    expect(existsSync(resolve(repoRoot, commandCentrePath))).toBe(true);
    expect(readTrackedFiles([commandCentrePath])).toEqual([commandCentrePath]);

    const commandCentre = readRepoFile(commandCentrePath);
    const normalized = normalizeWhitespace(commandCentre);

    for (const required of [
      "This command centre is repo-local, template-only, non-live, and not evidence.",
      "Safe local command groups",
      "Forbidden commands",
      "Local acceptance-suite sequence",
      "What each command proves",
      "What each command does not prove",
      "What remains blocked until explicit future approval",
      "How to report failures without creating filled evidence",
      "[COMMAND GROUP]",
      "[COMMAND]",
      "[LOCAL PURPOSE]",
      "[PASS / FAIL / NOT RUN]",
      "[LOCAL FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalized).toContain(required);
    }

    expect(commandCentre).not.toMatch(filledEvidencePattern);
    expect(commandCentre).not.toMatch(forbiddenBusinessFactPattern);
    expect(commandCentre).not.toMatch(forbiddenContactFactPattern);
  });

  it("adds a tracked local suite runner and package script with an allowlisted command sequence", () => {
    expect(existsSync(resolve(repoRoot, suiteRunnerPath))).toBe(true);
    expect(readTrackedFiles([suiteRunnerPath])).toEqual([suiteRunnerPath]);

    const runner = readRepoFile(suiteRunnerPath);
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const expectedScripts = [
      "validate:preview-approval-package",
      "validate:preview-smoke-harness",
      "validate:preview-handoff",
      "validate:local-release-candidate",
      "validate:supabase-migrations",
      "test:supabase-seed",
      "test:supabase-rls",
      "validate:n8n",
      "test:n8n-validation"
    ];
    const expectedWebsiteScripts = ["test", "typecheck", "build"];

    expect(packageJson.scripts["validate:release-candidate-suite"]).toBe(
      "node scripts/validate-release-candidate-suite.cjs"
    );
    for (const script of expectedScripts) {
      expect(runner).toContain(script);
    }
    for (const script of expectedWebsiteScripts) {
      expect(runner).toContain(`website:${script}`);
    }
    expect(runner).toContain(
      "Local release-candidate suite passed. No deployment was performed. This does not approve deployment."
    );
    expect(runner).not.toMatch(forbiddenRunnerPattern);
  });

  it("renders an admin-only command centre snapshot for authorised admins", () => {
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
    expect(shellSource).toContain(commandCentrePath);
    expect(shellSource).toContain("localCommandCentreSnapshot");
    expect(shellSource).toContain("localCommandCentreLastLocalUpdate");

    const heading = screen.getByRole("heading", {
      name: /local release-candidate command centre snapshot/i
    });
    expect(heading).toBeInTheDocument();
    const card = heading.closest("section");
    expect(card).not.toBeNull();
    const snapshot = within(card as HTMLElement);

    expect(screen.getByText(commandCentrePath)).toBeInTheDocument();
    expect(snapshot.getByText(/^Template only$/i)).toBeInTheDocument();
    expect(snapshot.getByText(/^Local only$/i)).toBeInTheDocument();
    expect(snapshot.getByText(/safe command allowlist/i)).toBeInTheDocument();
    expect(snapshot.getByText(/forbidden command audit/i)).toBeInTheDocument();
    expect(snapshot.getByText(/public leakage audit/i)).toBeInTheDocument();
    expect(
      snapshot.getByText(/not approved \/ separate explicit approval required/i)
    ).toBeInTheDocument();
    expect(snapshot.getByText(/\[DATE PLACEHOLDER\]/i)).toBeInTheDocument();
  });

  it("does not render the command centre snapshot for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(
        screen.queryByText(/local release-candidate command centre snapshot/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(commandCentrePath)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps public source customer-facing and free of command-centre leakage", async () => {
    render(await HomePage());
    expect(screen.getByRole("heading", { name: /event furniture rental/i })).toBeInTheDocument();
    expect(screen.getByText(/request a rental quote/i)).toBeInTheDocument();

    cleanup();
    render(await QuotePage());
    expect(screen.getByRole("heading", { name: /request a rental quote/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /check your enquiry details/i })).toBeInTheDocument();

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

    expect(publicSource).toMatch(/listing/i);
    expect(publicSource).toMatch(/enquiry/i);
    expect(publicSource).toMatch(/quote/i);
    expect(publicSource).toMatch(/request/i);
    expect(publicSource).toMatch(/rental/i);
    expect(publicSource).toMatch(/event furniture/i);
    expect(publicSource).not.toMatch(publicInternalLeakPattern);
    expect(publicSource).not.toMatch(forbiddenCustomerFlowTermPattern);
    expect(publicSource).not.toMatch(forbiddenBusinessFactPattern);
    expect(publicSource).not.toMatch(forbiddenContactFactPattern);
  });

  it("keeps Phase 3T local command materials inside no-provider, no-deploy, no-evidence boundaries", () => {
    const phase3tDocs = [
      extractRequiredSection(
        readRepoFile("docs/DECISION-LOG.md"),
        "## 2026-06-09: Local Release-Candidate Command Centre, Acceptance-Suite Orchestration, And No-Deploy Command Allowlist",
        "## 2026-06-09: Local Release-Candidate Acceptance Gate, Route Inventory Freeze, And Public/Admin Regression Harness"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-ROADMAP.md"),
        "## Phase 3T: Local Release-Candidate Command Centre, Acceptance-Suite Orchestration, And No-Deploy Command Allowlist"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-STATUS.md"),
        "Current phase: Phase 3T-A/B - local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist.",
        "Previous Current Phase 3S-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-2-READINESS-PLAN.md"),
        "Current Phase 3T-A/B status:",
        "Previous Current Phase 3S-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md"),
        "## Phase 3T-A/B Local Release-Candidate Command Centre Acceptance-Suite Orchestration And No-Deploy Command Allowlist",
        "## Phase 3S-A/B Local Release-Candidate Acceptance Gate Route Inventory Freeze And Public-Admin Regression Harness"
      ),
      readRepoFile(commandCentrePath)
    ].join("\n");
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);

    expect(phase3tDocs).not.toMatch(filledEvidencePattern);
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
