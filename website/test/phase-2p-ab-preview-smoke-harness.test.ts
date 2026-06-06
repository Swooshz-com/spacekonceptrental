import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase2oMergeCommit = "81431f13836e0b9b182aaca9638ae2e07abd7571";
const smokeScriptPath = "scripts/smoke-preview.cjs";
const smokeValidatorPath = "scripts/validate-preview-smoke-harness.cjs";
const rollbackDrillPath = "docs/PREVIEW-ROLLBACK-DRILL.md";
const smokeResultTemplatePath =
  "docs/templates/preview-smoke-result-template.md";
const rollbackResultTemplatePath =
  "docs/templates/rollback-drill-result-template.md";
const smokeDocPaths = [
  rollbackDrillPath,
  smokeResultTemplatePath,
  rollbackResultTemplatePath
];

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

function runSmokeWithoutNetwork(env: Record<string, string | undefined>) {
  return spawnSync("node", [smokeScriptPath], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env
    }
  });
}

describe("Phase 2P-A/B external preview smoke harness", () => {
  it("records Phase 2P-A/B as current and Phase 2O-A/B as the completed capability", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");

    expect(status).toContain(
      "Current phase: Phase 2P-A/B - external preview smoke harness and rollback drill package."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 2O-A/B preview deployment approval package and operator evidence templates."
    );
    expect(status).toContain("Last merged capability PR: #120");
    expect(status).toContain(`Merge commit: \`${phase2oMergeCommit}\``);
    expect(roadmap).toContain(
      "Phase 2P-A/B adds an external preview smoke harness and rollback drill package"
    );
    expect(readiness).toContain("Current Phase 2P-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2P-A/B adds an operator-run external preview smoke harness and rollback drill package."
    );
    expect(checklist).toContain(
      "## Phase 2P-A/B External Preview Smoke Harness And Rollback Drill Package"
    );
  });

  it("adds a fail-closed operator preview smoke harness that redacts the supplied URL", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const smokeSource = readRepoFile(smokeScriptPath);
    const workflow = readRepoFile(".github/workflows/ci.yml");

    expect(packageJson.scripts["smoke:preview"]).toBe(
      "node scripts/smoke-preview.cjs"
    );
    expect(smokeSource).toContain("SKR_PREVIEW_BASE_URL");
    expect(smokeSource).toContain("assertSafePreviewBaseUrl");
    expect(smokeSource).toContain("redactPreviewBaseUrl");
    expect(smokeSource).toContain("fetch(");
    expect(smokeSource).toContain("/");
    expect(smokeSource).toContain("/listings");
    expect(smokeSource).toContain("/categories");
    expect(smokeSource).toContain("/quote");
    expect(smokeSource).toContain("/api/chat");
    expect(smokeSource).toContain("/admin");
    expect(smokeSource).not.toMatch(/SKR_PREVIEW_BASE_URL\s*=\s*["']/);
    expect(smokeSource).not.toMatch(/https?:\/\/|www\./i);
    expect(smokeSource).not.toMatch(/\bdotenv\b|readFileSync|["']\.env/i);
    expect(smokeSource).not.toMatch(/\bvercel\s+(?:deploy|link|env|pull|promote)\b/i);
    expect(smokeSource).not.toMatch(
      /\bsupabase\s+(?:link|login|db|secrets|projects|functions)\b/i
    );
    expect(smokeSource).not.toMatch(/\bn8n\s+(?:import|execute|start)\b/i);
    expect(smokeSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(workflow).not.toContain("npm run smoke:preview");

    const missing = runSmokeWithoutNetwork({
      SKR_PREVIEW_BASE_URL: undefined
    });
    const missingOutput = `${missing.stdout}\n${missing.stderr}`;

    expect(missing.status).not.toBe(0);
    expect(missingOutput).toContain("SKR_PREVIEW_BASE_URL");

    const unsafe = runSmokeWithoutNetwork({
      SKR_PREVIEW_BASE_URL: "http://localhost:3000"
    });
    const unsafeOutput = `${unsafe.stdout}\n${unsafe.stderr}`;

    expect(unsafe.status).not.toBe(0);
    expect(unsafeOutput).toContain("unsafe_preview_base_url");
    expect(unsafeOutput).not.toContain("localhost:3000");
  });

  it("adds a deterministic no-network smoke-harness validator for CI", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const validator = readRepoFile(smokeValidatorPath);
    const workflow = readRepoFile(".github/workflows/ci.yml");

    expect(packageJson.scripts["validate:preview-smoke-harness"]).toBe(
      "node scripts/validate-preview-smoke-harness.cjs"
    );
    expect(validator).toContain("smoke:preview");
    expect(validator).toContain("SKR_PREVIEW_BASE_URL");
    expect(validator).toContain("redactPreviewBaseUrl");
    expect(validator).toContain("git ls-files");
    expect(validator).toContain("unsafe_preview_base_url");
    expect(validator).not.toMatch(/\bcurl\b|fetch\s*\(/i);
    expect(validator).not.toMatch(/\bvercel\s+(?:deploy|link|env|pull|promote)\b/i);
    expect(validator).not.toMatch(
      /\bsupabase\s+(?:link|login|db|secrets|projects|functions)\b/i
    );
    expect(validator).not.toMatch(/\bn8n\s+(?:import|execute|start)\b/i);
    expect(workflow).toContain("npm run validate:preview-smoke-harness");
    expect(workflow).not.toContain("npm run smoke:preview");
  });

  it("adds rollback drill docs and redacted result templates without filled evidence", () => {
    const docs = smokeDocPaths.map(readRepoFile).join("\n");
    const normalizedDocs = normalizeWhitespace(docs);

    expect(readTrackedFiles(smokeDocPaths).sort()).toEqual(
      [...smokeDocPaths].sort()
    );
    expect(normalizedDocs).toContain("No deployment is performed by this PR.");
    expect(normalizedDocs).toContain(
      "Do not commit filled preview or production evidence."
    );
    expect(normalizedDocs).toContain(
      "Rollback is performed only after explicit operator approval."
    );
    expect(normalizedDocs).toContain("Abort Triggers");
    expect(normalizedDocs).toContain("<redacted>");
    expect(normalizedDocs).toContain("<reviewed externally>");
    expect(docs).not.toMatch(/https?:\/\/|www\./i);
    expect(docs).not.toMatch(
      /\b(?:sk|pk|rk|gh[pousr]|xox[baprs])_[A-Za-z0-9_-]{8,}\b/i
    );
    expect(docs).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
  });

  it("keeps the preview smoke slice free of runtime scope expansion", () => {
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
