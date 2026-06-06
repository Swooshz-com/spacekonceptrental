import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase2nMergeCommit = "ad97aace9c2145af139a45f3e0f2d0b6d09a24a9";
const approvalPackagePath = "docs/PREVIEW-DEPLOYMENT-APPROVAL-PACKAGE.md";
const evidenceTemplatePath =
  "docs/templates/preview-deployment-evidence-template.md";
const envInventoryTemplatePath =
  "docs/templates/redacted-env-inventory-template.md";
const goNoGoTemplatePath = "docs/templates/go-no-go-decision-template.md";
const templatePaths = [
  evidenceTemplatePath,
  envInventoryTemplatePath,
  goNoGoTemplatePath
];
const approvalDocPaths = [approvalPackagePath, ...templatePaths];

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

describe("Phase 2O-A/B preview deployment approval package", () => {
  it("records Phase 2O-A/B as current and Phase 2N-A/B as the completed capability", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");

    expect(status).toContain(
      "Current phase: Phase 2O-A/B - preview deployment approval package and operator evidence templates."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 2N-A/B server runtime configuration hardening and deploy dry-run harness."
    );
    expect(status).toContain("Last merged capability PR: #119");
    expect(status).toContain(`Merge commit: \`${phase2nMergeCommit}\``);
    expect(roadmap).toContain(
      "Phase 2O-A/B adds preview deployment approval package docs and redacted operator evidence templates"
    );
    expect(readiness).toContain("Current Phase 2O-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2O-A/B adds preview deployment approval packaging and redacted operator evidence templates."
    );
    expect(checklist).toContain(
      "## Phase 2O-A/B Preview Deployment Approval Package And Operator Evidence Templates"
    );
  });

  it("adds the approval package and redacted templates without production evidence", () => {
    const approvalPackage = readRepoFile(approvalPackagePath);
    const approvalText = normalizeWhitespace(approvalPackage);

    expect(readTrackedFiles(approvalDocPaths).sort()).toEqual(
      approvalDocPaths.sort()
    );
    expect(approvalText).toContain("Purpose");
    expect(approvalText).toContain("Explicit Non-Approval Statement");
    expect(approvalText).toContain("Required Reviewer Checks");
    expect(approvalText).toContain("Required Validation Commands");
    expect(approvalText).toContain("Required Dry-Run Commands");
    expect(approvalText).toContain("Supabase Cloud Review Checklist");
    expect(approvalText).toContain("Vercel Project Review Checklist");
    expect(approvalText).toContain("Server-Only Environment Setup Checklist");
    expect(approvalText).toContain("Admin Access Review Checklist");
    expect(approvalText).toContain("Public Listing And Quote Smoke Checklist");
    expect(approvalText).toContain("Rollback And Abort Checklist");
    expect(approvalText).toContain("Final Go/No-Go Decision Table");
    expect(approvalPackage).toContain("npm run validate:release-candidate");
    expect(approvalPackage).toContain("npm run validate:deploy-dry-run");
    expect(approvalPackage).toContain("npm run validate:preview-approval-package");
    expect(approvalText).toContain(
      "This package does not approve deployment and does not deploy anything."
    );
    expect(approvalText).toContain(
      "A later current-turn approval is required before any deployment"
    );

    for (const templatePath of templatePaths) {
      const template = readRepoFile(templatePath);

      expect(template).toContain("Do not commit filled production evidence.");
      expect(template).toContain("Do not commit screenshots containing secrets.");
      expect(template).toContain("Do not commit real env values.");
      expect(template).toContain(
        "Store filled evidence outside the repo unless a later approved policy says otherwise."
      );
      expect(template).toContain("<redacted>");
      expect(template).not.toMatch(/https?:\/\/|www\./i);
      expect(template).not.toMatch(
        /\b(?:sk|pk|rk|gh[pousr]|xox[baprs])_[A-Za-z0-9_-]{8,}\b/i
      );
    }
  });

  it("adds a deterministic approval-package validator without live-provider commands", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const validatorPath = "scripts/validate-preview-approval-package.cjs";
    const validator = readRepoFile(validatorPath);
    const workflow = readRepoFile(".github/workflows/ci.yml");

    expect(packageJson.scripts["validate:preview-approval-package"]).toBe(
      "node scripts/validate-preview-approval-package.cjs"
    );
    expect(validator).toContain(phase2nMergeCommit);
    expect(validator).toContain(approvalPackagePath);
    expect(validator).toContain("validate:release-candidate");
    expect(validator).toContain("validate:deploy-dry-run");
    expect(validator).toContain("explicit later approval");
    expect(validator).toContain("git ls-files");
    expect(validator).not.toMatch(/\bvercel\s+(?:deploy|link|env|pull|promote)\b/i);
    expect(validator).not.toMatch(
      /\bsupabase\s+(?:link|login|db|secrets|projects|functions)\b/i
    );
    expect(validator).not.toMatch(/\bn8n\s+(?:import|execute|start)\b/i);
    expect(validator).not.toMatch(/\bcurl\b|fetch\s*\(/i);
    expect(workflow).toContain("npm run validate:preview-approval-package");
  });

  it("keeps the approval-package slice free of runtime scope expansion", () => {
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

    for (const docPath of approvalDocPaths) {
      expect(existsSync(resolve(repoRoot, docPath))).toBe(true);
    }
  });
});
