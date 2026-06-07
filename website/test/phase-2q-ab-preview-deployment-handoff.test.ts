import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase2pMergeCommit = "15a5d23941ac7fbe3297792311f50e414d622f5f";
const phase2qMergeCommit = "62c2b11b6b15192434eb4035ba0a66a44cd6f763";
const phase3aMergeCommit = "6e8bcf23bc8d7eef12b738613344764c0c1961e6";
const phase3bMergeCommit = "bfcf9916a0edd1b7133a1765719b9ddd73197dac";
const phase3cMergeCommit = "d031d7f47a6893f92d0b6739300d52147f6abfa4";
const phase3dMergeCommit = "de357ee234ed1d92ab27eb1f6d571c0c4f0ccd04";
const phase3fMergeCommit = "69665bb241b1af5c05ad34ac1464cdaeece8b7f8";
const phase3gMergeCommit = "75fd104966e3e8c69a434f2325f6f79e4742a40f";
const phase3hMergeCommit = "09f92ede4b5d9f725d0df560838a12fef27940b9";
const phase3iMergeCommit = "0d2d40898c4e716032fdec130704117494c542d6";
const handoffDocPath = "docs/PREVIEW-DEPLOYMENT-HANDOFF.md";
const branchFreezeDocPath = "docs/PREVIEW-DEPLOYMENT-BRANCH-FREEZE.md";
const handoffValidatorPath = "scripts/validate-preview-handoff.cjs";
const handoffDocPaths = [handoffDocPath, branchFreezeDocPath];

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

describe("Phase 2Q-A/B preview deployment handoff", () => {
  it("records Phase 2Q-A/B as the completed handoff after Phase 3J starts", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");

    expect(status).toContain(
      "Current phase: Phase 3J-A/B - owner review readiness package, manual QA runbook, and release-decision preparation."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3I-A/B full-site acceptance QA, public SEO/accessibility polish, and non-deployment release hardening."
    );
    expect(status).toContain("Last merged capability PR: #131");
    expect(status).toContain(`Merge commit: \`${phase3iMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3I-A/B status");
    expect(status).toContain("Previous Current Phase 3H-A/B status");
    expect(status).toContain("Previous Current Phase 3G-A/B status");
    expect(status).toContain("Previous Current Phase 3F-A/B status");
    expect(status).toContain("Previous Current Phase 3E-A/B status");
    expect(status).toContain("Previous Current Phase 3D-A/B status");
    expect(status).toContain("Previous Current Phase 3C-A/B status");
    expect(status).toContain("Previous Current Phase 3B-A/B status");
    expect(status).toContain("Previous Current Phase 3A-A/B status");
    expect(status).toContain("Previous Current Phase 2Q-A/B status");
    expect(roadmap).toContain(
      "Phase 2Q-A/B adds the final preview deployment handoff and branch-freeze package"
    );
    expect(readiness).toContain("Current Phase 3J-A/B status");
    expect(readiness).toContain("Previous Current Phase 3I-A/B status");
    expect(readiness).toContain("Previous Current Phase 3H-A/B status");
    expect(readiness).toContain("Previous Current Phase 3G-A/B status");
    expect(readiness).toContain("Previous Current Phase 3F-A/B status");
    expect(readiness).toContain("Previous Current Phase 3E-A/B status");
    expect(readiness).toContain("Previous Current Phase 3D-A/B status");
    expect(readiness).toContain("Previous Current Phase 3C-A/B status");
    expect(readiness).toContain("Previous Current Phase 3B-A/B status");
    expect(readiness).toContain("Previous Current Phase 3A-A/B status");
    expect(readiness).toContain("Previous Current Phase 2Q-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2Q-A/B adds the final preview deployment handoff and branch-freeze package."
    );
    expect(checklist).toContain(
      "## Phase 2Q-A/B Preview Deployment Handoff And Branch-Freeze Package"
    );
  });

  it("adds final handoff and branch-freeze docs without approving deployment", () => {
    const trackedDocs = readTrackedFiles(handoffDocPaths).sort();
    const docs = handoffDocPaths.map(readRepoFile).join("\n");
    const normalizedDocs = normalizeWhitespace(docs);

    expect(trackedDocs).toEqual([...handoffDocPaths].sort());
    expect(normalizedDocs).toContain("No deployment is performed by this PR.");
    expect(normalizedDocs).toContain("This does not approve deployment.");
    expect(normalizedDocs).toContain(
      "Future preview deployment requires explicit later approval."
    );
    expect(normalizedDocs).toContain("Approve preview deployment");
    expect(normalizedDocs).toContain("Hold deployment");
    expect(normalizedDocs).toContain("Pivot to product polish");
    expect(normalizedDocs).toContain("Stop doing generic deployment-prep PRs");
    expect(normalizedDocs).toContain("What counts as a blocker");
    expect(normalizedDocs).toContain("What does not count as a blocker");
    expect(normalizedDocs).toContain("npm run validate:release-candidate");
    expect(normalizedDocs).toContain("npm run validate:deploy-dry-run");
    expect(normalizedDocs).toContain("npm run validate:preview-approval-package");
    expect(normalizedDocs).toContain("npm run validate:preview-smoke-harness");
    expect(normalizedDocs).toContain("npm run smoke:preview");
    expect(normalizedDocs).toContain("operator-only");
    expect(normalizedDocs).toContain("<redacted>");
    expect(normalizedDocs).toContain("<reviewed externally>");
    expect(docs).not.toMatch(/https?:\/\/|www\./i);
    expect(docs).not.toMatch(
      /\b(?:sk|pk|rk|gh[pousr]|xox[baprs])_[A-Za-z0-9_-]{8,}\b/i
    );
    expect(docs).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
  });

  it("adds a deterministic no-network handoff validator for CI", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const validator = readRepoFile(handoffValidatorPath);
    const workflow = readRepoFile(".github/workflows/ci.yml");

    expect(packageJson.scripts["validate:preview-handoff"]).toBe(
      "node scripts/validate-preview-handoff.cjs"
    );
    expect(validator).toContain("git ls-files");
    expect(validator).toContain(handoffDocPath);
    expect(validator).toContain(branchFreezeDocPath);
    expect(validator).toContain("Phase 2Q-A/B");
    expect(validator).toContain(phase2pMergeCommit);
    expect(validator).toContain(phase2qMergeCommit);
    expect(validator).toContain(phase3aMergeCommit);
    expect(validator).toContain(phase3bMergeCommit);
    expect(validator).toContain(phase3cMergeCommit);
    expect(validator).toContain(phase3dMergeCommit);
    expect(validator).toContain(phase3fMergeCommit);
    expect(validator).toContain(phase3gMergeCommit);
    expect(validator).toContain(phase3hMergeCommit);
    expect(validator).toContain(phase3iMergeCommit);
    expect(validator).toContain("Phase 3J-A/B");
    expect(validator).toContain("Phase 3I-A/B");
    expect(validator).toContain("validate:release-candidate");
    expect(validator).toContain("validate:deploy-dry-run");
    expect(validator).toContain("validate:preview-approval-package");
    expect(validator).toContain("validate:preview-smoke-harness");
    expect(validator).toContain("smoke:preview");
    expect(validator).not.toMatch(/\bcurl\b|fetch\s*\(/i);
    expect(validator).not.toMatch(/\bvercel\s+(?:deploy|link|env|pull|promote)\b/i);
    expect(validator).not.toMatch(
      /\bsupabase\s+(?:link|login|db|secrets|projects|functions)\b/i
    );
    expect(validator).not.toMatch(/\bn8n\s+(?:import|execute|start)\b/i);
    expect(workflow).toContain("npm run validate:preview-handoff");
    expect(workflow).not.toContain("npm run smoke:preview");
  });

  it("keeps the handoff slice free of runtime/deployment/evidence expansion", { timeout: 15000 }, () => {
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
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

    expect(readTrackedFiles(["vercel.json", "website/vercel.json", ".vercel"])).toEqual([]);
    expect(readTrackedFiles(["supabase/config.toml", "supabase/.branches"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
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
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-accounts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-tracking"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/crm"])).toEqual([]);
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
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(chatRoute).not.toMatch(
      /pinecone|retrieval|rerank|vector|embedding|rag|search[_ -]?index/i
    );
  });
});
