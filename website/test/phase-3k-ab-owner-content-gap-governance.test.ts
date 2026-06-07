import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3jMergeCommit = "1c7dc0ac7c2532fa8a837cd46b0d1f0103d5ccfa";
const ownerContentIntakePath = "docs/content/OWNER-CONTENT-INTAKE.md";
const contentGapRegisterPath = "docs/content/CONTENT-GAP-REGISTER.md";
const ownerReviewPackagePath = "docs/OWNER-REVIEW-READINESS-PACKAGE.md";
const ownerManualQaPath = "docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md";
const previewHandoffPath = "docs/PREVIEW-DEPLOYMENT-HANDOFF.md";
const forbiddenDeploymentCommandPattern =
  /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i;
const forbiddenSupabaseCloudCommandPattern =
  /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i;
const forbiddenEnvInstructionPattern =
  /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i;
const forbiddenInventedClaimPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured/i;
const forbiddenContactFactPattern =
  /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;

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

describe("Phase 3K-A/B owner content gap governance", () => {
  it("records Phase 3K-A/B as current after Phase 3J completed in PR #132", () => {
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
      "Current phase: Phase 3K-A/B - owner content intake, content gap register, and launch-blocker governance."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3J-A/B owner review readiness package, manual QA runbook, and release-decision preparation."
    );
    expect(currentStatus).toContain("Last merged capability PR: #132");
    expect(currentStatus).toContain(`Merge commit: \`${phase3jMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3J-A/B status");
    expect(status).toContain("Previous Current Phase 3I-A/B status");
    expect(roadmap).toContain(
      "Phase 3K-A/B adds owner content intake, a content gap register, and launch-blocker governance"
    );
    expect(readiness).toContain("Current Phase 3K-A/B status");
    expect(readiness).toContain("Previous Current Phase 3J-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3K-A/B adds owner content intake, content gap register, and launch-blocker governance."
    );
    expect(checklist).toContain(
      "## Phase 3K-A/B Owner Content Intake Content Gap Register And Launch-Blocker Governance"
    );
    expect(validator).toContain(phase3jMergeCommit);
    expect(validator).toContain(ownerContentIntakePath);
    expect(validator).toContain(contentGapRegisterPath);
    expect(validator).toContain("Phase 3K-A/B");
  });

  it("adds owner content intake without inventing real-world business facts", () => {
    expect(existsSync(resolve(repoRoot, ownerContentIntakePath))).toBe(true);
    const intake = readRepoFile(ownerContentIntakePath);
    const normalizedIntake = normalizeWhitespace(intake);

    for (const required of [
      "Approved brand spelling and public display name",
      "Approved listing/product names",
      "Listing/category/event descriptions",
      "Image selection and alt text",
      "Public service-area wording",
      "Public contact details",
      "Business hours",
      "Operating expectations",
      "Legal/policy wording",
      "Admin access/workspace ownership expectations",
      "Owner input required"
    ]) {
      expect(normalizedIntake).toContain(required);
    }
    expect(intake).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(intake).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(intake).not.toMatch(forbiddenEnvInstructionPattern);
    expect(intake).not.toMatch(forbiddenInventedClaimPattern);
    expect(intake).not.toMatch(forbiddenContactFactPattern);
  });

  it("adds a content gap register with launch-blocker governance fields", () => {
    expect(existsSync(resolve(repoRoot, contentGapRegisterPath))).toBe(true);
    const register = readRepoFile(contentGapRegisterPath);
    const normalizedRegister = normalizeWhitespace(register);

    for (const required of [
      "Brand and naming",
      "Public route copy",
      "Listings/categories/events",
      "Images and alt text",
      "Quote/enquiry expectations",
      "Admin access and operator ownership",
      "Launch/legal/policy/contact content",
      "Gap",
      "Impact",
      "Required owner input",
      "Launch blocker status",
      "Deferred / not required for current owner review",
      "Owner input required",
      "Blocks owner review",
      "Blocks launch/deployment",
      "Deferred after launch",
      "Not in scope by owner direction"
    ]) {
      expect(normalizedRegister).toContain(required);
    }
    expect(register).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(register).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(register).not.toMatch(forbiddenEnvInstructionPattern);
    expect(register).not.toMatch(forbiddenInventedClaimPattern);
    expect(register).not.toMatch(forbiddenContactFactPattern);
  });

  it("cross-links content governance into owner review and deployment handoff docs", () => {
    const ownerReview = readRepoFile(ownerReviewPackagePath);
    const manualQa = readRepoFile(ownerManualQaPath);
    const handoff = readRepoFile(previewHandoffPath);
    const combined = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));

    expect(combined).toContain("docs/content/OWNER-CONTENT-INTAKE.md");
    expect(combined).toContain("docs/content/CONTENT-GAP-REGISTER.md");
    expect(combined).toContain("Owner content blockers");
    expect(combined).toContain("Missing real contact/legal/business-hour content does not get invented");
    expect(combined).toContain(
      "Public launch cannot proceed until required owner content and explicit deployment approval are both supplied"
    );
    expect(combined).toContain("Owner review can continue without deployment");
    expect(ownerReview).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(manualQa).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(handoff).not.toMatch(forbiddenEnvInstructionPattern);
  });

  it("keeps Phase 3K inside documentation governance and non-deployment scope", () => {
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
