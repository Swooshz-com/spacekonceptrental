import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const checklistReadmePath = "docs/checklists/README.md";
const phaseStatusPath = "docs/PHASE-STATUS.md";
const phaseOneChecklistPath = "docs/checklists/PHASE-1-MVP.md";
const deploymentChecklistPath =
  "docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md";
const adminOpsChecklistPath = "docs/checklists/PHASE-2-ADMIN-OPS.md";
const adminAuthChecklistPath = "docs/checklists/PHASE-2B-ADMIN-AUTH.md";
const authImplementationChecklistPath =
  "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md";
const approvedAuthBoundaryPath =
  "website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts";
const approvedRequestMetadataBoundaryPath =
  "website/lib/admin/authorization/server-admin-request-metadata-adapter.ts";
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

const expectedN8nWorkflowHashes = new Map([
  [
    "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
    "96fe4b6832b6c4680f6d6dcbdd311b901e6c73610afd2747de7c0c06a84c1a2c"
  ],
  [
    "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
    "0f869a547cc9bde78335a16c9516e565b1e1097d9b3c5b95bc8448e00c01b9b2"
  ],
  [
    "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json",
    "913928a75068562eeb23eaa3ac6a69e2bee01a6a9eaf8e5c41e58eb153c54c6f"
  ]
]);

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

function expectChecked(markdown: string, item: string) {
  expect(markdown).toContain(`- [x] ${item}`);
}

function expectNoTrackedFiles(paths: string[]) {
  expect(readTrackedFiles(paths)).toEqual([]);
}

function hashRepoFile(relativePath: string) {
  return createHash("sha256")
    .update(readRepoFile(relativePath).replace(/\r\n/g, "\n"))
    .digest("hex");
}

describe("Phase 2B-F checklist hygiene and phase status reconciliation", () => {
  it("adds checklist maintenance rules with clear ownership and runtime-completion rules", () => {
    expect(existsSync(resolve(repoRoot, checklistReadmePath))).toBe(true);

    const readme = readRepoFile(checklistReadmePath);

    expect(readme).toContain("Checklist ownership");
    expect(readme).toContain(
      "`PHASE-1-MVP.md` is the historical Phase 1 closeout checklist."
    );
    expect(readme).toContain(
      "`PHASE-2A-DEPLOYMENT-READINESS.md` is the deployment readiness checklist."
    );
    expect(readme).toContain(
      "`PHASE-2B-ADMIN-AUTH.md` is the admin/auth readiness checklist."
    );
    expect(readme).toContain(
      "`PHASE-2B-AUTH-IMPLEMENTATION.md` is the future auth implementation checklist."
    );
    expect(readme).toContain(
      "Narrative plans, roadmaps, status summaries, and decision docs stay in `docs/`."
    );
    expect(readme).toContain(
      "Checkbox/status trackers stay in `docs/checklists/`."
    );
    expect(readme).toContain(
      "`docs/PHASE-2-READINESS-PLAN.md` is intentionally outside `docs/checklists/` because it is a sequencing/strategy plan, not a checklist."
    );
    expect(readme).toContain(
      "`docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md` is inside checklists because it is a checkbox readiness tracker."
    );
    expect(readme).toContain(
      "Every phase PR that changes status must update exactly the relevant checklist(s)."
    );
    expect(readme).toContain(
      "Do not duplicate the same item across checklists unless one entry is a cross-link or reference."
    );
    expect(readme).toContain(
      "Do not mark planned or scaffolded work complete as runtime complete."
    );
    expect(readme).toContain(
      "Completed design/scaffold/policy work must be named as design/scaffold/policy, not as implementation."
    );
    expect(readme).toContain(
      "Runtime blockers must remain unchecked until the runtime actually exists and tests prove it."
    );
  });

  it("adds a quick phase status page with current PR state and chatbot direction", () => {
    expect(existsSync(resolve(repoRoot, phaseStatusPath))).toBe(true);

    const status = readRepoFile(phaseStatusPath);

    expect(status).toContain("Current phase: Phase 2B-AB");
    expect(status).toContain("Latest completed phase: Phase 2B-AA");
    expect(status).toContain("Last merged phase PR: #68");
    expect(status).toContain(
      "Merge commit: `ca800f7604c5ef0a6e19a4f0724121a08576017b`"
    );
    expect(status).toContain("Completed foundation");
    expect(status).toContain("Completed deployment readiness docs");
    expect(status).toContain(
      "Completed admin/auth design and policy scaffolds"
    );
    expect(status).toContain("Still blocked");
    expect(status).toContain("Next recommended PR");
    expect(status).toContain(
      "Use `docs/PHASE-2-READINESS-PLAN.md` for Phase 2 sequencing and `docs/checklists/` for checkbox trackers."
    );
    expect(status).toContain(
      "The current SKR website may keep using the existing n8n/Pinecone chatbot workflow as a temporary production bridge."
    );
    expect(status).toContain(
      "The future SaaS chatbot should be a separate project/app."
    );
    expect(status).toContain(
      "SKR can later become the first client/tenant of that SaaS chatbot."
    );
    expect(status).toContain(
      "Do not implement SaaS chatbot work inside this repo yet."
    );
    expect(status).toContain("Do not migrate Pinecone in this repo yet.");
    expect(status).toContain(
      "n8n remains temporary server-side integration only."
    );
    expect(status).toContain("Browser must never call n8n directly.");
  });

  it("keeps the Phase 1 checklist historical without marking deferred runtime work complete", () => {
    const checklist = readRepoFile(phaseOneChecklistPath);

    expect(checklist).toContain("Historical/closeout checklist");
    expect(checklist).toContain(
      "Deferred runtime work below points to the current Phase 2 checklists and remains unchecked."
    );

    for (const item of [
      "Add product persistence.",
      "Add category/product/product image mutation routes.",
      "Add product image uploads.",
      "Add Supabase Storage wiring.",
      "Add conversation persistence.",
      "Add message persistence.",
      "Connect to Supabase Cloud.",
      "Add deployment."
    ]) {
      expectUnchecked(checklist, item);
    }
  });

  it("keeps deployment readiness deployment-prep only with real deployment items unchecked", () => {
    const checklist = readRepoFile(deploymentChecklistPath);

    expect(checklist).toContain("deployment-prep only");
    expect(checklist).toContain(
      "Auth implementation details belong in `PHASE-2B-AUTH-IMPLEMENTATION.md`."
    );

    for (const item of [
      "Supabase Cloud project selected and reviewed.",
      "Actual deployment.",
      "Vercel project config.",
      "Supabase Cloud connection.",
      "Production seed data.",
      "Service-role runtime paths.",
      "Browser Supabase client code."
    ]) {
      expectUnchecked(checklist, item);
    }
  });

  it("keeps admin/auth readiness complete only for design, policy, resolver, adapter, and provider-session milestones", () => {
    const checklist = readRepoFile(adminAuthChecklistPath);

    expect(checklist).toContain(
      "Completed design, policy, resolver, adapter, and provider-session milestones"
    );
    expect(checklist).toContain(
      "Real runtime implementation remains unchecked."
    );
    expect(checklist).toContain(
      "- [x] Add admin auth provider/session design."
    );

    for (const item of [
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Cookie reads outside the Phase 2B-K server-only identity boundary.",
      "Header reads outside the Phase 2B-V request metadata adapter.",
      "Login/logout routes.",
      "Protected admin pages.",
      "Admin UI.",
      "Product writes.",
      "Category writes.",
      "Product image writes.",
      "Storage.",
      "Service-role runtime paths.",
      "Browser Supabase."
    ]) {
      expectUnchecked(checklist, item);
    }
  });

  it("keeps the auth implementation checklist future-facing with all runtime items unchecked", () => {
    const checklist = readRepoFile(authImplementationChecklistPath);

    expect(checklist).toContain("future implementation checklist");
    expect(checklist).toContain(
      "Completed design-only milestones are referenced, not duplicated as implementation work."
    );

    for (const item of [
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Header reads outside the Phase 2B-V request metadata adapter.",
      "Login/logout routes.",
      "Protected admin pages.",
      "Admin UI.",
      "Product writes.",
      "Category writes.",
      "Product image writes.",
      "Storage.",
      "Service-role runtime paths.",
      "Browser Supabase."
    ]) {
      expectUnchecked(checklist, item);
    }

    expectChecked(checklist, "Server-only Supabase Auth identity boundary.");
    expectChecked(checklist, "Cookie reads.");
    expectChecked(
      checklist,
      "Server-only Supabase admin profile/membership read boundary."
    );
  });

  it("keeps admin operations from implying product CRUD is ready", () => {
    const checklist = readRepoFile(adminOpsChecklistPath);

    expect(checklist).toContain(
      "Product/category/product image writes are blocked until auth/membership/RLS/audit gates pass."
    );
    expect(checklist).not.toContain("- [x] Expand admin product CRUD.");
    expect(checklist).not.toContain("- [x] Add admin image upload");
    expectUnchecked(checklist, "Expand admin product CRUD.");
    expectUnchecked(checklist, "Add admin image upload, replace, and remove flows.");
  });

  it("does not add admin, auth, login/logout, or product mutation routes/pages", () => {
    expectNoTrackedFiles([
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
  });

  it("does not add runtime product or conversation writes, Supabase Auth wiring, cookies, headers, or browser Supabase", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const boundaryExcludedSources = productionSources.filter(
      ({ filePath }) =>
        filePath !== approvedAuthBoundaryPath &&
        filePath !== approvedRequestMetadataBoundaryPath
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
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(combinedSource).not.toMatch(
      /from\(["'](?:conversations|messages)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(combinedSource).not.toMatch(
      /\.auth\.(?:getUser|getSession|signIn|signOut|setSession|exchangeCodeForSession)/m
    );
    expect(combinedSource).not.toContain("createServerClient");
    expect(combinedSource).not.toContain("cookies()");
    expect(combinedSource).not.toContain("headers()");
    expect(combinedSource).not.toContain("next/headers");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(combinedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(browserSource).not.toContain("@supabase/");
    expect(browserSource).not.toContain("lib/supabase");
    expect(browserSource).not.toContain("SUPABASE_URL");
    expect(browserSource).not.toContain("SUPABASE_ANON_KEY");
  });

  it("does not add service-role paths, deployment config, env files, production seed data, or SaaS/Pinecone runtime code", () => {
    expectNoTrackedFiles([
      "vercel.json",
      ".vercel",
      "website/vercel.json",
      "netlify.toml",
      "render.yaml",
      "fly.toml",
      ".env",
      ".env.local",
      ".env.production",
      ".env.test",
      "website/.env",
      "website/.env.local",
      "website/.env.production",
      "website/.env.test",
      "website/app/saas",
      "website/app/api/saas",
      "website/lib/saas",
      "website/lib/pinecone",
      "website/app/api/pinecone"
    ]);

    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");
    const seedSource = readTrackedFiles(["supabase/seeds"])
      .map(readRepoFile)
      .join("\n");

    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("InternalSaasChatProvider");
    expect(seedSource).not.toContain("catalogue_public_workspace_config");
  });

  it("does not change catalogue runtime behaviour, quote throttling, or n8n workflow files", () => {
    const catalogueSource = readRepoFile(
      "website/lib/catalogue/catalogue-repository.ts"
    );
    const quoteRouteSource = readRepoFile("website/app/api/quote/route.ts");
    const workflowFiles = readTrackedFiles(["n8n-workflows"]).sort();

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
    expect(workflowFiles).toEqual([...expectedN8nWorkflowHashes.keys()].sort());

    for (const [filePath, expectedHash] of expectedN8nWorkflowHashes) {
      expect(hashRepoFile(filePath)).toBe(expectedHash);
    }
  });

  it("keeps website/chat-config.js untracked and unused without reading it", () => {
    expectNoTrackedFiles(["website/chat-config.js"]);

    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");

    expect(productionSource).not.toContain("chat-config");
  });

  it("keeps resolver and adapter modules out of runtime routes, pages, and server actions", () => {
    const runtimeSource = readTrackedProductionSources([
      "website/app",
      "website/components"
    ])
      .map(({ source }) => source)
      .join("\n");

    expect(runtimeSource).not.toContain("admin-authorization-resolver");
    expect(runtimeSource).not.toContain("admin-authorization-adapters");
    expect(runtimeSource).not.toContain("resolveAdminAuthorizationForRequest");
    expect(runtimeSource).not.toContain("resolveAdminAuthorizationWithAdapters");
    expect(runtimeSource).not.toContain("buildAdminAuthorizationInput");
  });
});
