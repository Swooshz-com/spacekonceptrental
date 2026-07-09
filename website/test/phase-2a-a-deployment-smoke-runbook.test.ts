import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const runbookPath = "docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md";
const checklistPath = "docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md";
const evidenceTemplatePath = "docs/templates/DEPLOYMENT-EVIDENCE.md";
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
    .map((filePath) => ({
      filePath,
      source: readRepoFile(filePath)
    }));
}

function expectUnchecked(markdown: string, item: string) {
  expect(markdown).toContain(`- [ ] ${item}`);
}

describe("Phase 2A-A deployment smoke-test runbook", () => {
  it("adds the deployment runbook, operator checklist, and evidence template", () => {
    expect(existsSync(resolve(repoRoot, runbookPath))).toBe(true);
    expect(existsSync(resolve(repoRoot, checklistPath))).toBe(true);
    expect(existsSync(resolve(repoRoot, evidenceTemplatePath))).toBe(true);
  });

  it("keeps the smoke-test runbook readiness-only and placeholder-only", () => {
    const runbook = readRepoFile(runbookPath);

    expect(runbook).toContain("This runbook does not approve or perform deployment.");
    expect(runbook).toContain("Purpose");
    expect(runbook).toContain("Scope");
    expect(runbook).toContain("Non-goals");
    expect(runbook).toContain("Required preflight review");
    expect(runbook).toContain("Server-only env placement checks");
    expect(runbook).toContain("Forbidden public/browser env checks");
    expect(runbook).toContain("Active catalogue workspace checks");
    expect(runbook).toContain("Quote workspace checks");
    expect(runbook).toContain("Server-only n8n enquiry handoff checks");
    expect(runbook).toContain("Server-only n8n chat webhook checks");
    expect(runbook).toContain("Trusted proxy/client IP header checks");
    expect(runbook).toContain("Catalogue fallback smoke tests");
    expect(runbook).toContain("DB-backed catalogue smoke tests");
    expect(runbook).toContain("Quote submission smoke tests");
    expect(runbook).toContain("Chat fallback smoke tests");
    expect(runbook).toContain("Server-only n8n chat smoke tests");
    expect(runbook).toContain("Failure/rollback checks");
    expect(runbook).toContain("Post-deployment monitoring checks");
    expect(runbook).toContain("Evidence to capture in the future deployment PR");
    expect(runbook).toContain("server-only Supabase env placement");
    expect(runbook).toContain("NEXT_PUBLIC_SUPABASE_*");
    expect(runbook).toContain("NEXT_PUBLIC_N8N*");
    expect(runbook).toContain(
      "Service-role runtime paths remain forbidden unless separately approved."
    );
    expect(runbook).toContain("<server-only-supabase-url>");
    expect(runbook).toContain("<deployment-url>");
    expect(runbook).toContain("<server-only-n8n-enquiry-handoff-webhook-url>");
    expect(runbook).toContain("<server-only-n8n-chat-webhook-url>");
    expect(runbook).toContain("<approved-catalogue-workspace-id>");
  });

  it("keeps the deployment operator checklist unchecked for real deployment approvals", () => {
    const checklist = readRepoFile(checklistPath);

    expectUnchecked(checklist, "Supabase Cloud project selected and reviewed.");
    expectUnchecked(checklist, "Server-only Supabase env placement reviewed.");
    expectUnchecked(checklist, "No `NEXT_PUBLIC_SUPABASE_*` variables added.");
    expectUnchecked(
      checklist,
      "No `SUPABASE_SERVICE_ROLE_KEY` runtime path added."
    );
    expectUnchecked(checklist, "Active catalogue workspace selected.");
    expectUnchecked(checklist, "`catalogue_public_workspace_config` row reviewed.");
    expectUnchecked(checklist, "Quote workspace selected.");
    expectUnchecked(checklist, "Server-only n8n webhook reviewed.");
    expectUnchecked(checklist, "Trusted proxy/client IP header strategy reviewed.");
    expectUnchecked(checklist, "Catalogue fallback smoke test planned.");
    expectUnchecked(checklist, "DB-backed catalogue smoke test planned.");
    expectUnchecked(checklist, "Quote submission smoke test planned.");
    expectUnchecked(checklist, "Chat fallback smoke test planned.");
    expectUnchecked(checklist, "Server-only n8n smoke test planned.");
    expectUnchecked(checklist, "Rollback plan reviewed.");
    expectUnchecked(checklist, "Deployment evidence template prepared.");
    expectUnchecked(checklist, "Explicit approval obtained before real deployment.");
  });

  it("keeps the deployment evidence template structured for future safety proof", () => {
    const template = readRepoFile(evidenceTemplatePath);

    expect(template).toContain("Deployment summary");
    expect(template).toContain("Environment reviewed");
    expect(template).toContain("Env placement confirmation");
    expect(template).toContain("Forbidden public env confirmation");
    expect(template).toContain("Supabase Cloud confirmation");
    expect(template).toContain("Active catalogue workspace confirmation");
    expect(template).toContain("Quote workspace confirmation");
    expect(template).toContain("n8n server-only webhook confirmation");
    expect(template).toContain("Smoke-test evidence");
    expect(template).toContain("Rollback plan");
    expect(template).toContain("Known limitations");
    expect(template).toContain("Safety confirmations");
    expect(template).toContain("<deployment-url>");
    expect(template).toContain("<environment-name>");
    expect(template).toContain("<approved-catalogue-workspace-id>");
    expect(template).toContain("No real secrets or env values are included in this PR body.");
  });

  it("keeps the new deployment docs free of real secret-looking values", () => {
    const docs = [
      readRepoFile(runbookPath),
      readRepoFile(checklistPath),
      readRepoFile(evidenceTemplatePath)
    ].join("\n");

    expect(docs).not.toMatch(/https?:\/\/[^\s"'`<>]+/i);
    expect(docs).not.toMatch(/\bsk-[A-Za-z0-9_-]{20,}\b/);
    expect(docs).not.toMatch(
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
    );
    expect(docs).not.toMatch(/\b[A-Z0-9_]+\s*=\s*[^\s]+/);
    expect(docs).not.toContain("SpaceKonceptRental@gmail.com");
    expect(docs).not.toContain(".supabase.co");
    expect(docs).not.toContain(".vercel.app");
  });

  it("does not add deployment config, production config, production seed data, or workflow files", () => {
    const deploymentConfigFiles = readTrackedFiles([
      "vercel.json",
      ".vercel",
      "website/vercel.json",
      "netlify.toml",
      "render.yaml",
      "fly.toml"
    ]);
    const productionConfigFiles = readTrackedFiles([
      ".env",
      ".env.local",
      ".env.production",
      ".env.test",
      "website/.env",
      "website/.env.local",
      "website/.env.production",
      "website/.env.test"
    ]);
    const workflowFiles = readTrackedFiles(["n8n-workflows"]).sort();
    const seedSource = readTrackedFiles(["supabase/seeds"])
      .map(readRepoFile)
      .join("\n");

    expect(deploymentConfigFiles).toEqual([]);
    expect(productionConfigFiles).toEqual([]);
    expect(workflowFiles).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-enquiry-handoff.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
    expect(seedSource).not.toContain("catalogue_public_workspace_config");
  });

  it("keeps browser-facing and production source away from forbidden deployment env paths", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const combinedSource = productionSources
      .map(({ source }) => source)
      .join("\n");
    const browserSource = readTrackedProductionSources([
      "website/app",
      "website/components"
    ])
      .filter(({ filePath }) => !filePath.startsWith("website/app/api/"))
      .map(({ source }) => source)
      .join("\n");

    expect(combinedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(browserSource).not.toContain("@supabase/");
    expect(browserSource).not.toContain("lib/supabase");
    expect(browserSource).not.toContain("SUPABASE_URL");
    expect(browserSource).not.toContain("SUPABASE_ANON_KEY");
    expect(browserSource).not.toContain("N8N_CHAT_WEBHOOK_URL");
    expect(browserSource).not.toContain("chat-config");
  });

  it("keeps catalogue, quote, product, and conversation/message runtime boundaries unchanged", () => {
    const catalogueSource = readRepoFile(
      "website/lib/catalogue/catalogue-repository.ts"
    );
    const quoteRouteSource = readRepoFile("website/app/api/quote/route.ts");
    const chatPersistenceSource = readRepoFile(
      "website/lib/chat/persistence/disabled-chat-persistence.ts"
    );
    const productPersistenceSource = readRepoFile(
      "website/lib/products/persistence/disabled-product-persistence.ts"
    );

    expect(catalogueSource).toContain('rpc("get_public_catalogue"');
    expect(catalogueSource).toContain("expected_workspace_id");
    expect(catalogueSource).not.toContain('from("categories")');
    expect(catalogueSource).not.toContain('from("products")');
    expect(catalogueSource).not.toContain(".insert(");
    expect(catalogueSource).not.toContain(".update(");
    expect(catalogueSource).not.toContain(".upsert(");
    expect(catalogueSource).not.toContain(".delete(");
    expect(quoteRouteSource).toContain("consumeQuoteRateLimit");
    expect(readRepoFile("website/lib/server-runtime-config.ts")).toContain(
      "QUOTE_TRUSTED_CLIENT_IP_HEADER"
    );
    expect(chatPersistenceSource).not.toContain("@supabase/");
    expect(chatPersistenceSource).not.toContain("createServerSupabaseClient");
    expect(productPersistenceSource).not.toContain("@supabase/");
    expect(productPersistenceSource).not.toContain("createServerSupabaseClient");
  });
});
