import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const policyPath =
  "website/lib/admin/authorization/admin-authorization-policy.ts";
const checklistPath = "docs/checklists/PHASE-2B-ADMIN-AUTH.md";
const designDocPath = "docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md";
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

describe("Phase 2B-B admin authorization policy boundary", () => {
  it("adds only the pure server-only policy module and keeps docs honest", () => {
    expect(existsSync(resolve(repoRoot, policyPath))).toBe(true);

    const policy = readRepoFile(policyPath);
    const design = readRepoFile(designDocPath);
    const checklist = readRepoFile(checklistPath);

    expect(policy).toContain('import "server-only";');
    expect(policy).toContain("authorizeAdminOperation");
    expect(design).toContain("pure server-only policy module");
    expect(design).toContain("This PR does not implement real auth.");
    expect(design).toContain("This PR does not add Supabase Auth runtime wiring.");
    expect(design).toContain("This PR does not add login/logout routes.");
    expect(design).toContain("This PR does not add protected admin pages.");
    expect(design).toContain(
      "Product writes remain blocked until real auth/membership resolution, RLS, audit, and route/action boundaries are implemented and tested."
    );
    expect(checklist).toContain(
      "- [x] Add pure server-only admin authorization policy module."
    );
    expect(checklist).toContain(
      "- [x] Add policy tests for anonymous, inactive admin, missing membership, cross-workspace, role denial, and allowed-member decisions."
    );
    expect(checklist).toContain("- [ ] Real auth runtime wiring.");
    expect(checklist).toContain("- [ ] Admin UI.");
    expect(checklist).toContain("- [ ] Login/logout routes.");
    expect(checklist).toContain("- [ ] Product writes.");
    expect(checklist).toContain("- [ ] Storage.");
    expect(checklist).toContain("- [ ] Service-role runtime paths.");
    expect(checklist).toContain("- [ ] Browser Supabase.");
  });

  it("keeps the policy module free of runtime integrations and side effects", () => {
    const source = readRepoFile(policyPath);

    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("cookies");
    expect(source).not.toContain("headers");
    expect(source).not.toContain("Request");
    expect(source).not.toContain("Response");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
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
