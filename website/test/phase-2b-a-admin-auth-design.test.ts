import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const designDocPath = "docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md";
const checklistPath = "docs/checklists/PHASE-2B-ADMIN-AUTH.md";
const approvedAuthBoundaryPath =
  "website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts";
const approvedRequestMetadataBoundaryPath =
  "website/lib/admin/authorization/server-admin-request-metadata-adapter.ts";
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

describe("Phase 2B-A admin auth and membership design", () => {
  it("adds the admin/auth membership design and checklist", () => {
    expect(existsSync(resolve(repoRoot, designDocPath))).toBe(true);
    expect(existsSync(resolve(repoRoot, checklistPath))).toBe(true);
  });

  it("documents the required admin/auth boundaries without implementing them", () => {
    const design = readRepoFile(designDocPath);

    expect(design).toContain("Purpose");
    expect(design).toContain("Scope");
    expect(design).toContain("Non-goals");
    expect(design).toContain("Admin identity model");
    expect(design).toContain("Future auth provider assumptions");
    expect(design).toContain("Workspace membership model");
    expect(design).toContain("Role model");
    expect(design).toContain("Workspace resolution rules");
    expect(design).toContain("Route/server-action boundary rules");
    expect(design).toContain("Product/category/product image write gate");
    expect(design).toContain("Audit log expectations");
    expect(design).toContain("RLS expectations");
    expect(design).toContain("Error handling expectations");
    expect(design).toContain("Session/cookie expectations");
    expect(design).toContain("Forbidden shortcuts");
    expect(design).toContain("What remains deferred");
    expect(design).toContain("First implementation PR after this design");
    expect(design).toContain("This design does not implement real auth.");
    expect(design).toContain("This design does not add admin UI.");
    expect(design).toContain("This design does not add product writes.");
    expect(design).toContain(
      "Product/category/product image writes remain blocked until admin/auth boundaries are implemented and tested."
    );
    expect(design).toContain("Browser Supabase remains forbidden.");
    expect(design).toContain(
      "Service-role runtime paths remain forbidden unless separately approved."
    );
    expect(design).toContain(
      "Workspace ID must never be accepted from browser input for trusted admin write scope."
    );
    expect(design).toContain(
      "Admin write scope must be resolved server-side from authenticated identity + membership."
    );
    expect(design).toContain("Public mutation routes remain forbidden.");
    expect(design).toContain(
      "Audit expectations must exist before product writes."
    );
  });

  it("keeps the Phase 2B admin/auth checklist implementation items unchecked", () => {
    const checklist = readRepoFile(checklistPath);
    const uncheckedItems = [
      "Auth provider selected.",
      "Admin identity model approved.",
      "Workspace membership model approved.",
      "Role model approved.",
      "Server-side workspace resolution approved.",
      "Route/server-action boundary approved.",
      "Product/category/product image write gate approved.",
      "Audit log expectations approved.",
      "RLS expectations approved.",
      "Error handling expectations approved.",
      "Session/cookie expectations approved.",
      "Tests for anonymous denial planned.",
      "Tests for non-member denial planned.",
      "Tests for cross-workspace denial planned.",
      "Tests for admin/member allowed path planned.",
      "Explicit approval obtained before product writes.",
      "Explicit approval obtained before admin UI.",
      "Explicit approval obtained before service-role runtime path, if ever needed.",
      "Real auth runtime wiring.",
      "Admin UI.",
      "Login/logout routes.",
      "Product writes.",
      "Category writes.",
      "Product image writes.",
      "Storage.",
      "Service-role runtime paths.",
      "Browser Supabase."
    ];

    for (const item of uncheckedItems) {
      expectUnchecked(checklist, item);
    }
  });

  it("does not add admin routes, login/logout routes, or product mutation routes", () => {
    const forbiddenRoutes = readTrackedFiles([
      "website/app/admin",
      "website/app/login",
      "website/app/logout",
      "website/app/api/auth",
      "website/app/api/login",
      "website/app/api/logout",
      "website/app/api/products",
      "website/app/api/categories",
      "website/app/api/product-images",
      "website/app/api/catalogue"
    ]);

    expect(forbiddenRoutes).toEqual([]);
  });

  it("keeps product, category, product image, conversation, and message writes disabled", () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");
    const productPersistenceSource = readRepoFile(
      "website/lib/products/persistence/disabled-product-persistence.ts"
    );
    const chatPersistenceSource = readRepoFile(
      "website/lib/chat/persistence/disabled-chat-persistence.ts"
    );

    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(productionSource).not.toMatch(
      /from\(["'](?:conversations|messages)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(productPersistenceSource).not.toContain("@supabase/");
    expect(productPersistenceSource).not.toContain("createServerSupabaseClient");
    expect(chatPersistenceSource).not.toContain("@supabase/");
    expect(chatPersistenceSource).not.toContain("createServerSupabaseClient");
  });

  it("does not add Supabase Auth runtime wiring, browser Supabase, service-role paths, or public envs", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const boundaryExcludedSources = productionSources.filter(
      ({ filePath }) => filePath !== approvedAuthBoundaryPath
    );
    const combinedSource = boundaryExcludedSources
      .map(({ source }) => source)
      .join("\n");
    const browserSource = boundaryExcludedSources
      .filter(
        ({ filePath }) =>
          !filePath.startsWith("website/app/api/") &&
          !filePath.startsWith("website/lib/supabase/")
      )
      .map(({ source }) => source)
      .join("\n");

    expect(combinedSource).not.toMatch(
      /\.auth\.(?:getUser|getSession|signIn|signOut|setSession)/m
    );
    expect(combinedSource).not.toContain("createServerClient");
    expect(combinedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(browserSource).not.toContain("@supabase/");
    expect(browserSource).not.toContain("lib/supabase");
    expect(browserSource).not.toContain("SUPABASE_URL");
    expect(browserSource).not.toContain("SUPABASE_ANON_KEY");
    expect(browserSource).not.toContain("chat-config");
  });

  it("does not add deployment config, production config, production seed data, or workflow changes", () => {
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
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
    expect(seedSource).not.toContain("catalogue_public_workspace_config");
  });

  it("keeps catalogue runtime and quote throttling guardrails in place", () => {
    const catalogueSource = readRepoFile(
      "website/lib/catalogue/catalogue-repository.ts"
    );
    const quoteRouteSource = readRepoFile("website/app/api/quote/route.ts");

    expect(catalogueSource).toContain('rpc("get_public_catalogue"');
    expect(catalogueSource).toContain("expected_workspace_id");
    expect(catalogueSource).not.toContain('from("categories")');
    expect(catalogueSource).not.toContain('from("products")');
    expect(catalogueSource).not.toContain(".insert(");
    expect(catalogueSource).not.toContain(".update(");
    expect(catalogueSource).not.toContain(".upsert(");
    expect(catalogueSource).not.toContain(".delete(");
    expect(quoteRouteSource).toContain("consumeQuoteRateLimit");
    expect(quoteRouteSource).toContain("QUOTE_TRUSTED_CLIENT_IP_HEADER");
    expect(quoteRouteSource).toContain("RATE_LIMIT_MAX_REQUESTS");
  });
});
