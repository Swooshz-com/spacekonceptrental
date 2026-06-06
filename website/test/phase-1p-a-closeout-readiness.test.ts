import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const closeoutDocPath = "docs/PHASE-1-CLOSEOUT-AUDIT.md";
const readinessPlanPath = "docs/PHASE-2-READINESS-PLAN.md";
const checklistPath = "docs/checklists/PHASE-1-MVP.md";
const bootstrapExamplePath =
  "docs/examples/supabase/active-catalogue-workspace.example.sql";
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

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

describe("Phase 1P-A closeout audit and Phase 2 readiness", () => {
  it("adds an honest Phase 1 closeout audit with the required sections", () => {
    expect(existsSync(resolve(repoRoot, closeoutDocPath))).toBe(true);

    const doc = readRepoFile(closeoutDocPath);

    expect(doc).toContain("Completed foundation");
    expect(doc).toContain("Completed Supabase/database work");
    expect(doc).toContain("Completed catalogue/quote work");
    expect(doc).toContain("Completed chat boundary work");
    expect(doc).toContain("Completed safety/guard work");
    expect(doc).toContain("Deferred work");
    expect(doc).toContain("Non-goals still active");
    expect(doc).toContain("What must not be mistaken as complete");
    expect(doc).toContain("Risks if someone jumps to deployment too early");
    expect(doc).toContain("Recommended Phase 2 sequencing");
    expect(doc).toContain("npm run test:supabase-rls");
    expect(doc).toContain("cd website && npm test");
    expect(doc).toContain("No runtime feature is added by this closeout");
  });

  it("adds a Phase 2 readiness plan with safety-ranked tracks and explicit gates", () => {
    expect(existsSync(resolve(repoRoot, readinessPlanPath))).toBe(true);

    const plan = readRepoFile(readinessPlanPath);

    expect(plan).toContain("A. Deployment/Supabase Cloud path");
    expect(plan).toContain("B. Admin/auth/product management path");
    expect(plan).toContain("C. Conversation/message persistence path");
    expect(plan).toContain("D. Supabase Storage/product media path");
    expect(plan).toContain("E. Internal SaaS chat/RAG path");
    expect(plan).toContain("What it unlocks");
    expect(plan).toContain("Required prerequisites");
    expect(plan).toContain("Main risks");
    expect(plan).toContain("Required tests/guards");
    expect(plan).toContain("What should still be forbidden");
    expect(plan).toContain("Suggested first PR");
    expect(plan).toContain(
      "Do not start product writes before admin/auth boundaries."
    );
    expect(plan).toContain(
      "Do not start message persistence before privacy/identity/retention decisions."
    );
    expect(normalizeWhitespace(plan)).toContain(
      "Do not deploy before env, active workspace config, quote workspace, n8n server-only webhook, and smoke tests are reviewed."
    );
    expect(plan).toContain(
      "Do not add Storage before media ownership/path/policy design is approved."
    );
    expect(plan).toContain(
      "Browser Supabase remains forbidden unless separately approved."
    );
    expect(plan).toContain(
      "Service-role runtime paths remain forbidden unless separately approved."
    );
  });

  it("updates the Phase 1 checklist without marking deferred work complete", () => {
    const checklist = readRepoFile(checklistPath);

    expect(checklist).toContain(
      "- [x] Add Phase 1 closeout audit and Phase 2 readiness plan."
    );
    expect(checklist).toContain(
      "- [x] Static guard tests for Phase 1 closeout and Phase 2 readiness."
    );

    const deferredItems = [
      "Add product persistence.",
      "Add category/product/product image mutation routes.",
      "Add product image uploads.",
      "Add Supabase Storage wiring.",
      "Add conversation persistence.",
      "Add message persistence.",
      "Connect to Supabase Cloud.",
      "Add deployment.",
      "No admin/auth UI.",
      "No service-role runtime write paths.",
      "No production seed data.",
      "No browser Supabase client.",
      "No Vercel deployment configuration."
    ];

    for (const item of deferredItems) {
      expect(checklist).toContain(`- [ ] ${item}`);
    }
  });

  it("keeps browser-facing production code away from Supabase and n8n runtime config", () => {
    const browserSources = readTrackedProductionSources([
      "website/app",
      "website/components"
    ]).filter(({ filePath }) => !filePath.startsWith("website/app/api/"));
    const combinedSource = browserSources.map(({ source }) => source).join("\n");

    expect(combinedSource).not.toContain("@supabase/");
    expect(combinedSource).not.toContain("lib/supabase");
    expect(combinedSource).not.toContain("SUPABASE_URL");
    expect(combinedSource).not.toContain("SUPABASE_ANON_KEY");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(combinedSource).not.toContain("N8N_CHAT_WEBHOOK_URL");
    expect(combinedSource).not.toContain("chat-config");
  });

  it("keeps forbidden env names, deployment config, and production seed data out of production source", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const combinedSource = productionSources
      .map(({ source }) => source)
      .join("\n");
    const deploymentConfigFiles = readTrackedFiles([
      "vercel.json",
      ".vercel",
      "website/vercel.json",
      "netlify.toml",
      "render.yaml",
      "fly.toml"
    ]);
    const workflows = readTrackedFiles([".github/workflows"]);
    const workflowSource = workflows.map(readRepoFile).join("\n").toLowerCase();
    const seedSource = readTrackedFiles(["supabase/seeds"])
      .map(readRepoFile)
      .join("\n");

    expect(combinedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(deploymentConfigFiles).toEqual([]);
    expect(workflowSource).not.toContain("vercel");
    expect(workflowSource).not.toContain("deploy");
    expect(workflowSource).not.toContain("supabase login");
    expect(workflowSource).not.toContain("supabase link");
    expect(workflowSource).not.toContain("supabase db push");
    expect(seedSource).not.toContain("catalogue_public_workspace_config");
  });

  it("keeps catalogue, quote, disabled persistence, and bootstrap boundaries unchanged", () => {
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
    const bootstrapExample = readRepoFile(bootstrapExamplePath);

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
    expect(bootstrapExample).toContain("EXAMPLE ONLY");
    expect(bootstrapExample).toContain("rollback;");
  });

  it("keeps the closeout docs free of real secret-looking values", () => {
    const docSource = [
      readRepoFile(closeoutDocPath),
      readRepoFile(readinessPlanPath)
    ].join("\n");

    expect(docSource).not.toMatch(/https?:\/\/[^\s"'`<>]+/i);
    expect(docSource).not.toMatch(/\bsk-[A-Za-z0-9_-]{20,}\b/);
    expect(docSource).not.toMatch(
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
    );
    expect(docSource).not.toMatch(/\b[A-Z0-9_]+\s*=\s*[^\s]+/);
    expect(docSource).not.toContain("SpaceKonceptRental@gmail.com");
    expect(docSource).not.toContain(".supabase.co");
    expect(docSource).not.toContain(".vercel.app");
  });
});
