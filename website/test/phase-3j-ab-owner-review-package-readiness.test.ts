import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3iMergeCommit = "0d2d40898c4e716032fdec130704117494c542d6";
const ownerReviewPackagePath = "docs/OWNER-REVIEW-READINESS-PACKAGE.md";
const ownerManualQaPath = "docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md";
const previewHandoffPath = "docs/PREVIEW-DEPLOYMENT-HANDOFF.md";
const forbiddenDeploymentCommandPattern =
  /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i;
const forbiddenSupabaseCloudCommandPattern =
  /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i;
const forbiddenEnvInstructionPattern =
  /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i;
const forbiddenLiveSmokePattern = /\bnpm run smoke:preview\b|live preview smoke/i;
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;
const forbiddenInventedClaimPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery/i;

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

describe("Phase 3J-A/B owner review readiness package", () => {
  it("records Phase 3J-A/B as current after Phase 3I completed in PR #131", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const currentStatus = normalizeWhitespace(
      status.split("## Remaining-work map")[0] ?? status
    );
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const validator = readRepoFile("scripts/validate-preview-handoff.cjs");

    expect(currentStatus).toContain(
      "Current phase: Phase 3J-A/B - owner review readiness package, manual QA runbook, and release-decision preparation."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3I-A/B full-site acceptance QA, public SEO/accessibility polish, and non-deployment release hardening."
    );
    expect(currentStatus).toContain("Last merged capability PR: #131");
    expect(currentStatus).toContain(`Merge commit: \`${phase3iMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3I-A/B status");
    expect(status).toContain("Previous Current Phase 3H-A/B status");
    expect(roadmap).toContain(
      "Phase 3J-A/B adds an owner review readiness package, manual QA runbook, and release-decision preparation"
    );
    expect(readiness).toContain("Current Phase 3J-A/B status");
    expect(readiness).toContain("Previous Current Phase 3I-A/B status");
    expect(readiness).toContain("Previous Current Phase 3H-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3J-A/B adds an owner review readiness package, manual QA runbook, and release-decision preparation."
    );
    expect(checklist).toContain(
      "## Phase 3J-A/B Owner Review Readiness Package Manual QA Runbook And Release-Decision Preparation"
    );
    expect(validator).toContain(phase3iMergeCommit);
    expect(validator).toContain(ownerReviewPackagePath);
    expect(validator).toContain(ownerManualQaPath);
    expect(validator).toContain("Phase 3J-A/B");
  });

  it("adds an owner review package with safe go/no-go decision boundaries", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewPackagePath))).toBe(true);
    const packageDoc = readRepoFile(ownerReviewPackagePath);
    const normalizedPackage = normalizeWhitespace(packageDoc);

    for (const required of [
      "Ready for owner review",
      "Intentionally not implemented",
      "Public website journey readiness",
      "Admin listing/category/media readiness",
      "Quote/enquiry intake and admin triage readiness",
      "Known deferred capabilities",
      "Non-deployment decision status",
      "Owner go/no-go decision points",
      "Hold deployment",
      "Approve future deployment separately",
      "Needs owner-supplied content",
      "Needs deployment approval later",
      "Explicitly deferred features"
    ]) {
      expect(normalizedPackage).toContain(required);
    }
    expect(normalizedPackage).toContain(
      "This package does not approve deployment and does not deploy anything."
    );
    expect(packageDoc).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(packageDoc).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(packageDoc).not.toMatch(forbiddenEnvInstructionPattern);
    expect(packageDoc).not.toMatch(forbiddenLiveSmokePattern);
    expect(packageDoc).not.toMatch(forbiddenInventedClaimPattern);
  });

  it("adds a non-live manual QA runbook for public and protected admin review", () => {
    expect(existsSync(resolve(repoRoot, ownerManualQaPath))).toBe(true);
    const runbook = readRepoFile(ownerManualQaPath);
    const normalizedRunbook = normalizeWhitespace(runbook);

    for (const required of [
      "/",
      "/catalogue",
      "/listings",
      "/listings/[slug]",
      "/categories",
      "/catalogue/[slug]",
      "/events",
      "/quote",
      "Not-found/recovery states",
      "Protected admin overview",
      "Protected admin listings",
      "Protected admin categories",
      "Protected admin media",
      "Protected admin quotes",
      "Protected admin quote detail",
      "cd website && npm test",
      "cd website && npm run typecheck",
      "cd website && npm run build",
      "npm run validate:preview-handoff"
    ]) {
      expect(normalizedRunbook).toContain(required);
    }
    expect(normalizedRunbook).toContain("non-live");
    expect(normalizedRunbook).toContain("does not approve deployment");
    expect(runbook).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(runbook).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(runbook).not.toMatch(forbiddenEnvInstructionPattern);
    expect(runbook).not.toMatch(forbiddenLiveSmokePattern);
    expect(runbook).not.toMatch(forbiddenInventedClaimPattern);
  });

  it("adds owner-decision clarity to preview handoff without live evidence", () => {
    const handoff = readRepoFile(previewHandoffPath);
    const normalizedHandoff = normalizeWhitespace(handoff);

    expect(normalizedHandoff).toContain("Owner Review Decision Inputs");
    expect(normalizedHandoff).toContain("review `docs/OWNER-REVIEW-READINESS-PACKAGE.md`");
    expect(normalizedHandoff).toContain("review `docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md`");
    expect(normalizedHandoff).toContain("What the owner should supply before launch");
    expect(normalizedHandoff).toContain("What remains blocked until explicit approval");
    expect(normalizedHandoff).toContain("Hold deployment");
    expect(normalizedHandoff).toContain("Approve future deployment separately");
    expect(handoff).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(handoff).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(handoff).not.toMatch(forbiddenEnvInstructionPattern);
  });

  it("keeps Phase 3J inside owner review and non-deployment scope", () => {
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const publicSource = readTrackedProductionSources([
      "website/app/layout.tsx",
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/components/QuoteRequestForm.tsx"
    ]);

    expect(publicSource).not.toMatch(forbiddenCommercePattern);
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", "website/vercel.json", ".vercel"])).toEqual([]);
    expect(readTrackedFiles(["supabase/config.toml", "supabase/.branches"])).toEqual([]);
    expect(readTrackedFiles(["docs/evidence", "docs/production-evidence"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-accounts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-tracking"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/crm"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/chat/retrieval"])).toEqual([]);
  });
});
