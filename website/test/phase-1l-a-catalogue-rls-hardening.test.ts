import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  return readdirSync(resolve(repoRoot, "supabase/migrations"))
    .filter((filePath) => filePath.endsWith(".sql"))
    .sort()
    .map((filePath) => readRepoFile(`supabase/migrations/${filePath}`))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

describe("Phase 1M-A catalogue RLS hardening proof", () => {
  it("documents the trusted active-workspace hardening strategy after SQL changes", () => {
    const strategyPath = "docs/SUPABASE-CATALOGUE-RLS-HARDENING.md";

    expect(existsSync(resolve(repoRoot, strategyPath))).toBe(true);

    const strategy = readRepoFile(strategyPath);

    expect(strategy).toContain("trusted active-workspace");
    expect(strategy).toContain("CATALOGUE_WORKSPACE_ID");
    expect(strategy).toContain("cross-workspace denial");
    expect(strategy).toMatch(/DB-backed\s+catalogue\s+reads/);
    expect(strategy).toContain("No browser Supabase client");
    expect(strategy).toContain("No service-role key");
    expect(strategy).toContain("get_public_catalogue");
    expect(strategy).toContain("catalogue_public_workspace_config");
    expect(strategy).toMatch(/direct anonymous\s+base-table reads are denied/);
  });

  it("hardens direct anonymous base-table catalogue reads behind a trusted RPC", () => {
    const sql = readAllMigrationSql();

    expect(sql).toContain("categories_public_read_published");
    expect(sql).toContain("products_public_read_published");
    expect(sql).toContain("product_images_public_read_published_products");
    expect(sql).toContain("catalogue_public_workspace_config");
    expect(sql).toContain("create or replace function public.get_public_catalogue");
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = public");
    expect(sql).toContain("grant execute on function public.get_public_catalogue(uuid, text) to anon, authenticated");
    expect(sql).toMatch(
      /alter policy categories_public_read_published on public\.categories to anon, authenticated using \(false\);/
    );
    expect(sql).toMatch(
      /alter policy products_public_read_published on public\.products to anon, authenticated using \(false\);/
    );
    expect(sql).toMatch(
      /alter policy product_images_public_read_published_products on public\.product_images to anon, authenticated using \(false\);/
    );
    expect(sql).not.toContain("current_setting('app.catalogue_workspace_id");
  });

  it("keeps the catalogue runtime server-only and trusted RPC scoped", () => {
    const source = readRepoFile("website/lib/catalogue/catalogue-repository.ts");

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createServerSupabaseClient");
    expect(source).toContain("CATALOGUE_WORKSPACE_ID");
    expect(source).toContain('rpc("get_public_catalogue"');
    expect(source).toContain("expected_workspace_id");
    expect(source).not.toContain('from("categories")');
    expect(source).not.toContain('from("products")');
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
