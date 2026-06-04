import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
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

function parseEnvContract() {
  return JSON.parse(
    readRepoFile("docs/contracts/server-env-contract.json")
  ) as {
    phase?: string;
    status?: string;
    categories?: Array<{
      name?: string;
      visibility?: string;
      variables?: string[];
      rule?: string;
    }>;
    variables?: Array<{
      name?: string;
      visibility?: string;
      browserAllowed?: boolean;
      status?: string;
      notes?: string;
      value?: unknown;
    }>;
    forbidden?: Array<{
      namePattern?: string;
      browserAllowed?: boolean;
      status?: string;
      reason?: string;
      value?: unknown;
    }>;
  };
}

describe("Phase 2D-A deployment readiness and smoke-test runbook", () => {
  it("keeps Phase 2D-A recorded as the previous merged readiness snapshot", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const deploymentChecklist = readRepoFile(
      "docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md"
    );

    expect(status).toContain(
      "Previous merged status snapshot: Phase 2D-A"
    );
    expect(status).toContain(
      "Current phase: Phase 2D-A - deployment readiness, environment contract, and smoke-test runbook."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2C-D - quote workflow atomicity and admin operations hardening."
    );
    expect(status).toContain("Last merged phase PR: #96");
    expect(status).toContain(
      "Merge commit: `3147c1206e763412e9edc6e8b792cc87b80e523b`"
    );
    expect(status).toContain(
      "Previous merged status snapshot: Phase 2C-D"
    );
    expect(status).toMatch(/No deployment\s+is approved by this phase/);
    expect(roadmap).toContain(
      "Phase 2D-A adds deployment readiness, environment contract, and smoke-test runbook updates"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2D-A refreshes deployment readiness for catalogue media and quote workflow operations"
    );
    expect(safety).toContain(
      "Phase 2D-A is deployment readiness documentation and static guard coverage only"
    );
    expect(deploymentChecklist).toContain(
      "Phase 2D-A Deployment Readiness Refresh"
    );
  });

  it("classifies deployment env vars without storing values or approving browser exposure", () => {
    const doc = readRepoFile("docs/DEPLOYMENT-ENVIRONMENT-READINESS.md");
    const contract = parseEnvContract();

    for (const heading of [
      "Public-safe client env",
      "Server-only app env",
      "Supabase/project env",
      "n8n/server-only webhook env",
      "Admin/auth/workspace env",
      "Forbidden env exposure"
    ]) {
      expect(doc).toContain(heading);
      expect(contract.categories?.map((category) => category.name)).toContain(
        heading
      );
    }

    for (const envName of [
      "CATALOGUE_WORKSPACE_ID",
      "QUOTE_WORKSPACE_ID",
      "ADMIN_TRUSTED_WORKSPACE_ID",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "N8N_CHAT_WEBHOOK_URL"
    ]) {
      const variable = contract.variables?.find(({ name }) => name === envName);

      expect(doc).toContain(envName);
      expect(variable).toMatchObject({
        visibility: "server-only",
        browserAllowed: false
      });
      expect(variable).not.toHaveProperty("value");
    }

    expect(doc).toContain("No `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE`");
    expect(doc).toContain("No browser Supabase unless separately approved");
    expect(doc).toContain("Service-role key prohibition in runtime paths");
    expect(doc).toContain("n8n webhook values are server-only");
    expect(JSON.stringify(contract)).not.toMatch(/https?:\/\//i);
    expect(JSON.stringify(contract)).not.toMatch(
      /\b[A-Z0-9_]+\s*=\s*[^\s]+/
    );
  });

  it("requires operator smoke tests and evidence before public traffic", () => {
    const runbook = readRepoFile("docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md");
    const evidence = readRepoFile("docs/templates/DEPLOYMENT-EVIDENCE.md");

    for (const requiredText of [
      "No deployment is approved by this runbook",
      "Required pre-deployment review",
      "Static/fallback homepage",
      "Catalogue fallback without DB config",
      "DB-backed public catalogue reads for active workspace",
      "Listing detail page",
      "Uploaded listing image rendering using existing public bucket model",
      "Public quote form submission",
      "Quote handoff from catalogue/detail to quote page",
      "Admin login/protected shell",
      "Admin product/category/listing management access",
      "Admin listing image upload",
      "Admin quote inbox/status/internal note workflow",
      "Atomic quote workflow RPC behaviour",
      "Chat safe fallback",
      "Server-only n8n webhook path",
      "404/error states",
      "No provider/SQL/secret leakage",
      "No browser console exposure of server-only env values",
      "Evidence checklist"
    ]) {
      expect(runbook).toContain(requiredText);
    }

    expect(evidence).toContain("Admin listing media upload smoke test");
    expect(evidence).toContain("Atomic quote workflow RPC smoke test");
    expect(evidence).toContain("Browser console server-only env exposure check");
  });

  it("documents rollback and disable steps without adding runtime kill switches", () => {
    const runbook = readRepoFile("docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md");

    for (const requiredText of [
      "Disable public traffic",
      "Remove or rotate leaked env values",
      "Disable n8n webhook env",
      "Revert deployment",
      "Verify fallback catalogue behaviour",
      "Verify quote submission is unavailable or safe if env is removed",
      "Capture incident notes",
      "Do not add runtime kill switches in Phase 2D-A"
    ]) {
      expect(runbook).toContain(requiredText);
    }
  });

  it("keeps deployment docs free of real secrets and unsafe public env guidance", () => {
    const docs = [
      "docs/DEPLOYMENT-ENVIRONMENT-READINESS.md",
      "docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md",
      "docs/templates/DEPLOYMENT-EVIDENCE.md",
      "docs/contracts/server-env-contract.json"
    ]
      .map(readRepoFile)
      .join("\n");

    expect(docs).not.toMatch(/https?:\/\/[^\s"'`<>]+/i);
    expect(docs).not.toMatch(/\bsk-[A-Za-z0-9_-]{20,}\b/);
    expect(docs).not.toMatch(
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
    );
    expect(docs).not.toMatch(/\b[A-Z0-9_]+\s*=\s*[^\s]+/);
    expect(docs).not.toContain(".supabase.co");
    expect(docs).not.toContain(".vercel.app");
    expect(docs).not.toMatch(
      /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE[^.\n]*(allowed|configure|set|use)/i
    );
    expect(docs).toContain("never put service-role keys in browser/client/public env");
    expect(docs).toContain("server-only n8n webhook");
  });

  it("does not introduce deployment config, production seed data, ecommerce, browser Supabase, service-role runtime paths, or chat-config access", () => {
    const deploymentConfigFiles = readTrackedFiles([
      "vercel.json",
      ".vercel",
      "website/vercel.json",
      "netlify.toml",
      "render.yaml",
      "fly.toml"
    ]);
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const seedSource = readTrackedFiles(["supabase/seeds"])
      .map(readRepoFile)
      .join("\n");

    expect(deploymentConfigFiles).toEqual([]);
    expect(seedSource).not.toContain("catalogue_public_workspace_config");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("service-role");
    expect(productionSource).not.toContain("chat-config");
    expect(productionSource).not.toMatch(
      /cart|checkout|payment|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i
    );
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
  });
});
