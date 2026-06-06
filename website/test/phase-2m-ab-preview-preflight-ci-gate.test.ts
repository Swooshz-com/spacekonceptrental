import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const forbiddenCommercePattern =
  /cart|checkout|payments?|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ");
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

describe("Phase 2M-A/B preview preflight CI gate", () => {
  it("records Phase 2M-A/B as current and Phase 2L-A/B as completed", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");

    expect(status).toContain(
      "Current phase: Phase 2M-A/B - preview/deployment review preflight and CI parity hardening."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 2L-A/B release-candidate acceptance suite and final MVP polish."
    );
    expect(status).toContain("Last merged capability PR: #117");
    expect(status).toContain(
      "Merge commit: `aceee2ded00aee41b4e20197091f8527d9e8f8b7`"
    );
    expect(roadmap).toContain(
      "Phase 2M-A/B adds preview/deployment review preflight and CI parity hardening"
    );
    expect(readiness).toContain("Current Phase 2M-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2M-A/B makes the release-candidate gate deterministic in CI."
    );
    expect(checklist).toContain(
      "## Phase 2M-A/B Preview/Deployment Review Preflight And CI Parity Hardening"
    );
  });

  it("pins the release-candidate gate in scripts and pull-request CI", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const releaseScript = readRepoFile("scripts/validate-release-candidate.cjs");
    const ci = readRepoFile(".github/workflows/ci.yml");
    const combinedGateSource = `${ci}\n${releaseScript}`;

    expect(packageJson.scripts["validate:release-candidate"]).toBe(
      "node scripts/validate-release-candidate.cjs"
    );
    expect(releaseScript).toContain("releaseGateCommands");
    expect(releaseScript).toContain("Docker is required for npm run test:supabase-rls");
    expect(releaseScript).toContain("npm --prefix website test");
    expect(releaseScript).toContain("npm --prefix website run typecheck");
    expect(releaseScript).toContain("npm --prefix website run build");
    expect(releaseScript).toContain("npm run validate:supabase-migrations");
    expect(releaseScript).toContain("npm run test:supabase-migrations");
    expect(releaseScript).toContain("npm run test:supabase-rls");
    expect(releaseScript).toContain("git diff --check");

    for (const expectedCommand of [
      "npm run validate:supabase-migrations",
      "npm run test:supabase-migrations",
      "npm run test:supabase-rls",
      "npm run validate:n8n",
      "npm run test:n8n-validation",
      "git diff --check",
      "npm run test",
      "npm run typecheck",
      "npm run build"
    ]) {
      expect(combinedGateSource).toContain(expectedCommand);
    }

    expect(ci).toContain("pull_request:");
    expect(ci).toContain("Run Supabase RLS/schema tests");
    expect(ci).toContain("Check diff hygiene");
    expect(ci).not.toContain("continue-on-error: true");
  });

  it("documents a future preview/deployment review without approving deployment", () => {
    const preflight = readRepoFile("docs/PREVIEW-DEPLOYMENT-PREFLIGHT.md");
    const environmentReadiness = readRepoFile(
      "docs/DEPLOYMENT-ENVIRONMENT-READINESS.md"
    );
    const smokeRunbook = readRepoFile("docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md");
    const combinedDocs = `${preflight}\n${environmentReadiness}\n${smokeRunbook}`;

    for (const heading of [
      "## Future Preview/Deployment Review Checklist",
      "## Environment Variable Inventory",
      "## Workspace ID Review Checklist",
      "## Supabase Cloud Review Checklist",
      "## Admin Access Review Checklist",
      "## Public Quote/Listing Smoke Checklist",
      "## Rollback/Abort Checklist"
    ]) {
      expect(preflight).toContain(heading);
    }

    expect(preflight).toContain("This checklist does not approve deployment.");
    expect(preflight).toContain("No deployment is performed by Phase 2M-A/B.");
    expect(preflight).toContain("server-only");
    expect(preflight).toContain("No public client environment variable is currently required");
    expect(preflight).toContain("CATALOGUE_WORKSPACE_ID");
    expect(preflight).toContain("QUOTE_WORKSPACE_ID");
    expect(preflight).toContain("ADMIN_TRUSTED_WORKSPACE_ID");
    expect(preflight).toContain("Supabase Cloud must remain disconnected");
    expect(preflight).toContain("Abort before public traffic");
    expect(preflight).toContain("listing");
    expect(preflight).toContain("quote");
    expect(preflight).toContain("enquiry");
    expect(combinedDocs).toContain("validate:release-candidate");
    expect(combinedDocs).toContain("test:supabase-rls");
    expect(combinedDocs).toContain("git diff --check");
    expect(combinedDocs).not.toMatch(
      /this pr approves deployment|phase 2m-a\/b approves deployment|deployment may proceed/i
    );
  });

  it("keeps preview preflight free of deployment config, secrets, and runtime scope", () => {
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib/catalogue",
      "website/lib/products",
      "website/lib/quote",
      "website/lib/search-index"
    ]);
    const browserFacingSource = readTrackedProductionSources([
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/components"
    ]);
    const chatRoute = readRepoFile("website/app/api/chat/route.ts");
    const docsSource = [
      readRepoFile("docs/PREVIEW-DEPLOYMENT-PREFLIGHT.md"),
      readRepoFile("docs/DEPLOYMENT-ENVIRONMENT-READINESS.md"),
      readRepoFile("docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md")
    ].join("\n");

    expect(readTrackedFiles(["vercel.json", "website/vercel.json", ".vercel"])).toEqual([]);
    expect(readTrackedFiles(["supabase/config.toml", "supabase/.branches"])).toEqual([]);
    expect(
      readTrackedFiles([
        ".env",
        ".env.local",
        ".env.development",
        ".env.production",
        ".env.test",
        "website/.env",
        "website/.env.local",
        "website/.env.development",
        "website/.env.production",
        "website/.env.test"
      ])
    ).toEqual([]);
    expect(readTrackedFiles(["docs/evidence", "docs/production-evidence"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-account"])).toEqual([]);
    expect(readTrackedFiles(["website/app/customer-account"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/crm"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/search-index/sync"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/chat/retrieval"])).toEqual([]);
    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);

    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(browserFacingSource).not.toContain("@supabase/");
    expect(browserFacingSource).not.toContain("createBrowserClient");
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(chatRoute).not.toMatch(
      /pinecone|retrieval|rerank|vector|embedding|rag|search[_ -]?index/i
    );
    expect(appAndLibSource).not.toMatch(forbiddenCommercePattern);
    expect(appAndLibSource).not.toMatch(/notification|crm/i);
    expect(docsSource).not.toMatch(/https:\/\/[^\s`<>]+/i);
    expect(docsSource).not.toMatch(/eyJ|secret value|api key value/i);
  });
});
