import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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
    .map((filePath) => ({
      filePath,
      source: readRepoFile(filePath)
    }));
}

function readAllMigrationSql() {
  return readTrackedFiles(["supabase/migrations"])
    .filter((filePath) => filePath.endsWith(".sql"))
    .map(readRepoFile)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

describe("Phase 1L-A catalogue RLS hardening scaffold", () => {
  it("documents the trusted active-workspace hardening strategy before SQL changes", () => {
    const strategyPath = "docs/SUPABASE-CATALOGUE-RLS-HARDENING.md";

    expect(existsSync(resolve(repoRoot, strategyPath))).toBe(true);

    const strategy = readRepoFile(strategyPath);

    expect(strategy).toContain("trusted active-workspace");
    expect(strategy).toContain("CATALOGUE_WORKSPACE_ID");
    expect(strategy).toContain("cross-workspace denial");
    expect(strategy).toMatch(/DB-backed\s+catalogue\s+reads/);
    expect(strategy).toContain("No browser Supabase client");
    expect(strategy).toContain("No service-role key");
    expect(strategy).toMatch(
      /direct anonymous\s+catalogue RLS hardening remains deferred/
    );
  });

  it("keeps current migrations in deferred published-row anonymous-read mode", () => {
    const sql = readAllMigrationSql();

    expect(sql).toContain("categories_public_read_published");
    expect(sql).toContain("products_public_read_published");
    expect(sql).toContain("product_images_public_read_published_products");
    expect(sql).toMatch(
      /create policy categories_public_read_published on public\.categories for select to anon, authenticated using \(is_published = true\);/
    );
    expect(sql).toMatch(
      /create policy products_public_read_published on public\.products for select to anon, authenticated using \(status = 'published'\);/
    );
    expect(sql).not.toContain("catalogue_active_workspace");
    expect(sql).not.toContain("trusted_active_workspace");
    expect(sql).not.toContain("current_setting('app.catalogue_workspace_id");
  });

  it("keeps the catalogue runtime server-only and trusted workspace scoped", () => {
    const source = readRepoFile("website/lib/catalogue/catalogue-repository.ts");

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createServerSupabaseClient");
    expect(source).toContain("CATALOGUE_WORKSPACE_ID");
    expect(source).toContain('eq("workspace_id", workspaceId)');
    expect(source).toContain('eq("is_published", true)');
    expect(source).toContain('eq("status", "published")');
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("chat-config");
  });

  it("keeps browser-facing production source away from Supabase and legacy chat config", () => {
    const sources = readTrackedProductionSources([
      "website/app",
      "website/components"
    ]).filter(({ filePath }) => !filePath.startsWith("website/app/api/"));
    const combinedSource = sources.map(({ source }) => source).join("\n");

    expect(combinedSource).not.toContain("@supabase/");
    expect(combinedSource).not.toContain("lib/supabase");
    expect(combinedSource).not.toContain("SUPABASE_URL");
    expect(combinedSource).not.toContain("SUPABASE_ANON_KEY");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(combinedSource).not.toContain("N8N_CHAT_WEBHOOK_URL");
    expect(combinedSource).not.toContain("chat-config");
  });

  it("keeps production source free of service-role keys and catalogue mutation writes", () => {
    const sources = readTrackedProductionSources(["website/app", "website/lib"]);
    const combinedSource = sources.map(({ source }) => source).join("\n");
    const catalogueSource = readRepoFile("website/lib/catalogue/catalogue-repository.ts");

    expect(combinedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(catalogueSource).not.toContain('from("quote_requests")');
    expect(catalogueSource).not.toContain('from("quote_request_items")');
    expect(catalogueSource).not.toContain('from("conversations")');
    expect(catalogueSource).not.toContain('from("messages")');
    expect(catalogueSource).not.toContain('from("memberships")');
  });
});
