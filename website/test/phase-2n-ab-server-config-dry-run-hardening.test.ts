import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const serverRuntimeEnvNames = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "CATALOGUE_WORKSPACE_ID",
  "QUOTE_WORKSPACE_ID",
  "ADMIN_TRUSTED_WORKSPACE_ID",
  "ADMIN_EXPECTED_ORIGIN",
  "ADMIN_EXPECTED_HOST",
  "ADMIN_CSRF_PROOF_SECRET",
  "CHAT_PROVIDER",
  "N8N_CHAT_WEBHOOK_URL",
  "N8N_CHAT_WEBHOOK_TIMEOUT_MS",
  "CHAT_TRUSTED_CLIENT_IP_HEADER",
  "QUOTE_TRUSTED_CLIENT_IP_HEADER"
] as const;

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

describe("Phase 2N-A/B server config dry-run hardening", () => {
  it("records Phase 2N-A/B as current and Phase 2M-A/B as completed", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");

    expect(status).toContain(
      "Current phase: Phase 2N-A/B - server runtime configuration hardening and deploy dry-run harness."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 2M-A/B preview/deployment review preflight and CI parity hardening."
    );
    expect(status).toContain("Last merged capability PR: #118");
    expect(status).toContain(
      "Merge commit: `a8bd77239ebf8e6908d36bc5f5c4866ffa2dd489`"
    );
    expect(roadmap).toContain(
      "Phase 2N-A/B adds server runtime configuration hardening and a local deploy dry-run harness"
    );
    expect(readiness).toContain("Current Phase 2N-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2N-A/B hardens server-only runtime configuration parsing and deploy dry-run validation."
    );
    expect(checklist).toContain(
      "## Phase 2N-A/B Server Runtime Configuration Hardening And Deploy Dry-Run Harness"
    );
  });

  it("adds a local deploy dry-run script without live deployment commands", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const dryRunScript = readRepoFile("scripts/validate-deploy-dry-run.cjs");
    const preflight = readRepoFile("docs/PREVIEW-DEPLOYMENT-PREFLIGHT.md");
    const smokeRunbook = readRepoFile("docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md");

    expect(packageJson.scripts["validate:deploy-dry-run"]).toBe(
      "node scripts/validate-deploy-dry-run.cjs"
    );
    expect(dryRunScript).toContain("validate:release-candidate");
    expect(dryRunScript).toContain("server-runtime-config");
    expect(dryRunScript).toContain("serverRuntimeEnvNames");
    expect(dryRunScript).toContain("git ls-files");
    expect(dryRunScript).not.toMatch(/vercel\s+(?:deploy|link|env|pull)/i);
    expect(dryRunScript).not.toMatch(/supabase\s+(?:link|login|db|secrets|projects)/i);
    expect(dryRunScript).not.toMatch(/\bcurl\b|fetch\s*\(/i);
    expect(preflight).toContain("npm run validate:deploy-dry-run");
    expect(smokeRunbook).toContain("npm run validate:deploy-dry-run");
  });

  it("centralizes the reviewed server-only runtime config contract", () => {
    const source = readRepoFile("website/lib/server-runtime-config.ts");

    expect(source).toContain('import "server-only";');
    expect(source).toContain("serverRuntimeEnvNames");
    expect(source).toContain("parseServerRuntimeConfig");
    expect(source).toContain("getPublicSafeServerRuntimeConfigSummary");

    for (const envName of serverRuntimeEnvNames) {
      expect(source).toContain(envName);
    }

    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("NEXT_PUBLIC_N8N");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("chat-config");
  });

  it("keeps the dry-run scope free of deployment config, secrets, and runtime expansion", () => {
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
    expect(readTrackedFiles(["website/app/api/chat/retrieval"])).toEqual([]);
    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-enquiry-handoff.workflow.json",
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
