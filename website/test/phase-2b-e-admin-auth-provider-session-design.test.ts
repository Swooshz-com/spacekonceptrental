import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const designDocPath = "docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md";
const implementationChecklistPath =
  "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md";
const membershipDesignPath = "docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md";
const adminAuthorizationModulePaths = [
  "website/lib/admin/authorization/admin-authorization-policy.ts",
  "website/lib/admin/authorization/admin-authorization-resolver.ts",
  "website/lib/admin/authorization/admin-authorization-adapters.ts"
];
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

describe("Phase 2B-E admin auth provider and session design", () => {
  it("adds the auth provider/session design and implementation checklist", () => {
    expect(existsSync(resolve(repoRoot, designDocPath))).toBe(true);
    expect(existsSync(resolve(repoRoot, implementationChecklistPath))).toBe(
      true
    );
  });

  it("documents the server-only auth provider and session security contract without implementing it", () => {
    const design = readRepoFile(designDocPath);
    const membershipDesign = readRepoFile(membershipDesignPath);
    const normalizedDesign = design.toLowerCase();

    expect(normalizedDesign).toContain("purpose");
    expect(normalizedDesign).toContain("scope");
    expect(normalizedDesign).toContain("non-goals");
    expect(normalizedDesign).toContain("recommended auth provider");
    expect(normalizedDesign).toContain(
      "why supabase auth is the preferred future provider"
    );
    expect(normalizedDesign).toContain("server-only auth boundary");
    expect(normalizedDesign).toContain("session/cookie model");
    expect(normalizedDesign).toContain("csrf expectations");
    expect(normalizedDesign).toContain("login/logout route expectations");
    expect(normalizedDesign).toContain("protected admin page expectations");
    expect(normalizedDesign).toContain("admin identity mapping");
    expect(normalizedDesign).toContain("admin profile lookup expectations");
    expect(normalizedDesign).toContain("workspace membership lookup expectations");
    expect(normalizedDesign).toContain("adapter integration expectations");
    expect(normalizedDesign).toContain("error handling expectations");
    expect(normalizedDesign).toContain("redirect expectations");
    expect(normalizedDesign).toContain("audit/security event expectations");
    expect(normalizedDesign).toContain("testing expectations");
    expect(normalizedDesign).toContain("forbidden shortcuts");
    expect(normalizedDesign).toContain("first implementation pr after this design");
    expect(design).toContain(
      "This PR adds auth provider/session/security design only."
    );
    expect(design).toContain("This PR does not implement real auth.");
    expect(design).toContain("This PR does not add Supabase Auth runtime wiring.");
    expect(design).toContain("This PR does not read cookies.");
    expect(design).toContain("This PR does not read headers.");
    expect(design).toContain("This PR does not add login/logout routes.");
    expect(design).toContain("This PR does not add protected admin pages.");
    expect(design).toContain("This PR does not add admin UI.");
    expect(design).toContain("This PR does not add product writes.");
    expect(design).toContain("Browser Supabase remains forbidden.");
    expect(design).toContain(
      "Service-role runtime paths remain forbidden unless separately approved."
    );
    expect(design).toContain("Future auth must remain server-side.");
    expect(design).toContain(
      "Future session cookies must be HttpOnly, Secure in production, and have reviewed SameSite behaviour."
    );
    expect(design).toContain(
      "Future state-changing admin routes/server actions need CSRF strategy before implementation."
    );
    expect(design).toContain(
      "Admin identity must be resolved server-side and mapped to active admin profile before membership role is trusted."
    );
    expect(design).toContain(
      "Membership role must belong to the active server-resolved admin profile."
    );
    expect(design).toContain(
      "Browser/request workspace IDs remain validation-only and never trusted authority."
    );
    expect(membershipDesign).toContain(
      "This PR adds auth provider/session/security design only."
    );
  });

  it("keeps the auth implementation checklist real implementation items unchecked", () => {
    const checklist = readRepoFile(implementationChecklistPath);
    const uncheckedItems = [
      "Supabase Auth provider approved.",
      "Server-only auth boundary approved.",
      "Session cookie strategy approved.",
      "CSRF strategy approved.",
      "Login route design approved.",
      "Logout route design approved.",
      "Protected admin page design approved.",
      "Admin identity to `admin_users.auth_user_id` mapping approved.",
      "Admin profile lookup approved.",
      "Membership lookup approved.",
      "Adapter integration approved.",
      "Anonymous denial tests planned.",
      "Inactive admin profile tests planned.",
      "Missing membership tests planned.",
      "Wrong-actor membership tests planned.",
      "Cross-workspace denial tests planned.",
      "Viewer write denial tests planned.",
      "Admin allowed path tests planned.",
      "Owner membership-management tests planned.",
      "Safe auth error tests planned.",
      "Explicit approval obtained before real auth runtime wiring.",
      "Explicit approval obtained before login/logout routes.",
      "Explicit approval obtained before protected admin pages.",
      "Explicit approval obtained before admin UI.",
      "Explicit approval obtained before product writes.",
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Cookie reads.",
      "Header reads.",
      "Login/logout routes.",
      "Protected admin pages.",
      "Admin UI.",
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

  it("does not add admin routes, auth routes, login/logout routes, or product mutation routes", () => {
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

  it("does not wire resolver or adapter modules into runtime routes, pages, or server actions", () => {
    const runtimeSources = readTrackedProductionSources([
      "website/app",
      "website/components"
    ]);
    const runtimeSource = runtimeSources.map(({ source }) => source).join("\n");

    expect(runtimeSource).not.toContain("admin-authorization-resolver");
    expect(runtimeSource).not.toContain("admin-authorization-adapters");
    expect(runtimeSource).not.toContain("resolveAdminAuthorizationForRequest");
    expect(runtimeSource).not.toContain("resolveAdminAuthorizationWithAdapters");
    expect(runtimeSource).not.toContain("buildAdminAuthorizationInput");
  });

  it("keeps admin authorization modules server-only and free of real auth/session integrations", () => {
    const combinedAdminAuthSource = adminAuthorizationModulePaths
      .map(readRepoFile)
      .join("\n");

    expect(combinedAdminAuthSource).toContain('import "server-only";');
    expect(combinedAdminAuthSource).not.toContain("@supabase/");
    expect(combinedAdminAuthSource).not.toContain("createServerSupabaseClient");
    expect(combinedAdminAuthSource).not.toContain("process.env");
    expect(combinedAdminAuthSource).not.toContain("cookies");
    expect(combinedAdminAuthSource).not.toContain("headers");
    expect(combinedAdminAuthSource).not.toMatch(/\bRequest\s*[<({]/);
    expect(combinedAdminAuthSource).not.toMatch(/\bResponse\s*[<({]/);
    expect(combinedAdminAuthSource).not.toContain("chat-config");
    expect(combinedAdminAuthSource).not.toContain(".insert(");
    expect(combinedAdminAuthSource).not.toContain(".update(");
    expect(combinedAdminAuthSource).not.toContain(".upsert(");
    expect(combinedAdminAuthSource).not.toContain(".delete(");
  });

  it("does not add Supabase Auth runtime wiring, browser Supabase, service-role paths, or public envs", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const combinedSource = productionSources
      .map(({ source }) => source)
      .join("\n");
    const browserSource = productionSources
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
