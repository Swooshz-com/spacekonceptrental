import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const bootstrapDocPath = "docs/SUPABASE-CATALOGUE-WORKSPACE-BOOTSTRAP.md";
const bootstrapExamplePath =
  "docs/examples/supabase/active-catalogue-workspace.example.sql";
const placeholderWorkspaceId = "00000000-0000-4000-8000-000000000000";
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

describe("Phase 1N-A catalogue workspace bootstrap scaffold", () => {
  it("documents the active workspace bootstrap boundary and safe fallback", () => {
    expect(existsSync(resolve(repoRoot, bootstrapDocPath))).toBe(true);

    const doc = readRepoFile(bootstrapDocPath);

    expect(doc).toContain("catalogue_public_workspace_config");
    expect(doc).toContain("get_public_catalogue");
    expect(doc).toContain("CATALOGUE_WORKSPACE_ID");
    expect(doc).toMatch(/missing config/i);
    expect(doc).toMatch(/safe fallback/i);
    expect(doc).toContain("deployment/database-owned configuration");
    expect(doc).toContain("not browser input");
    expect(doc).toContain("No service-role runtime writes");
    expect(doc).toContain("No production seed data");
    expect(doc).toContain("No Supabase Cloud work");
    expect(doc).toContain(bootstrapExamplePath);
  });

  it("keeps the active workspace SQL scaffold docs-only, placeholder-only, and non-secret", () => {
    expect(existsSync(resolve(repoRoot, bootstrapExamplePath))).toBe(true);
    expect(bootstrapExamplePath).not.toContain("supabase/migrations");

    const example = readRepoFile(bootstrapExamplePath);

    expect(example).toContain("EXAMPLE ONLY");
    expect(example).toContain(placeholderWorkspaceId);
    expect(example).toContain("catalogue_public_workspace_config");
    expect(example).toContain("rollback;");
    expect(example).not.toMatch(/\bSUPABASE_SERVICE_ROLE_KEY\b/i);
    expect(example).not.toMatch(/\bNEXT_PUBLIC_SUPABASE_/i);
    expect(example).not.toMatch(/\bsk-[A-Za-z0-9_-]{20,}\b/);
    expect(example).not.toMatch(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/);
    expect(example).not.toMatch(/https?:\/\/[^\s"'`<>]+/i);
    expect(example).not.toContain("SpaceKonceptRental@gmail.com");
    expect(example).not.toContain("n8n");
    expect(example).not.toMatch(/\binsert\s+into\s+public\.(categories|products|product_images)\b/i);
    expect(example).not.toMatch(/\bupdate\s+public\.(categories|products|product_images)\b/i);

    const uuids = example.match(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
    );

    expect(new Set(uuids)).toEqual(new Set([placeholderWorkspaceId]));
  });

  it("does not add production migrations, seed data, or runtime imports for the scaffold", () => {
    const migrations = readTrackedFiles(["supabase/migrations"]);
    const seeds = readTrackedFiles(["supabase/seeds"]);
    const migrationSql = migrations.map(readRepoFile).join("\n");
    const seedSql = seeds.map(readRepoFile).join("\n");
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const combinedSource = productionSources
      .map(({ source }) => source)
      .join("\n");

    expect(migrations).not.toContain(bootstrapExamplePath);
    expect(seeds).not.toContain(bootstrapExamplePath);
    expect(migrationSql).not.toContain("active-catalogue-workspace.example");
    expect(migrationSql).not.toMatch(/\binsert\s+into\s+public\.catalogue_public_workspace_config\b/i);
    expect(seedSql).not.toContain("catalogue_public_workspace_config");
    expect(combinedSource).not.toContain("active-catalogue-workspace.example");
    expect(combinedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(combinedSource).not.toContain("chat-config");
  });

  it("keeps browser-facing source away from Supabase and n8n runtime config", () => {
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

  it("keeps catalogue, chat scaffold, product scaffold, and quote throttling boundaries unchanged", () => {
    const catalogueSource = readRepoFile(
      "website/lib/catalogue/catalogue-repository.ts"
    );
    const chatPersistenceSource = readRepoFile(
      "website/lib/chat/persistence/disabled-chat-persistence.ts"
    );
    const productPersistenceSource = readRepoFile(
      "website/lib/products/persistence/disabled-product-persistence.ts"
    );
    const quoteRouteSource = readRepoFile("website/app/api/quote/route.ts");

    expect(catalogueSource).toContain('rpc("get_public_catalogue"');
    expect(catalogueSource).not.toContain(".insert(");
    expect(catalogueSource).not.toContain(".update(");
    expect(catalogueSource).not.toContain(".upsert(");
    expect(catalogueSource).not.toContain(".delete(");
    expect(chatPersistenceSource).not.toContain("@supabase/");
    expect(chatPersistenceSource).not.toContain("createServerSupabaseClient");
    expect(productPersistenceSource).not.toContain("@supabase/");
    expect(productPersistenceSource).not.toContain("createServerSupabaseClient");
    expect(quoteRouteSource).toContain("consumeQuoteRateLimit");
    expect(quoteRouteSource).toContain("RATE_LIMIT_MAX_REQUESTS");
    expect(readRepoFile("website/lib/server-runtime-config.ts")).toContain(
      "QUOTE_TRUSTED_CLIENT_IP_HEADER"
    );
  });
});
