import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const forbiddenCommercePattern =
  /cart|checkout|payments?|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ");
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

describe("Phase 2L-A/B release-candidate acceptance suite", () => {
  it("records Phase 2L-A/B as release-candidate ready without deployment", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const environmentReadiness = readRepoFile(
      "docs/DEPLOYMENT-ENVIRONMENT-READINESS.md"
    );
    const smokeRunbook = readRepoFile("docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2L-A/B - release-candidate acceptance suite and final MVP polish."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 2K-A/B admin write-boundary hardening and deployment readiness."
    );
    expect(status).toContain("Last merged capability PR: #116");
    expect(status).toContain(
      "Merge commit: `0bf12dad7255ce667cdbfbdc86c27b59abaac4bc`"
    );
    expect(roadmap).toContain(
      "Phase 2L-A/B adds the release-candidate acceptance suite and final MVP polish"
    );
    expect(readiness).toContain("Current Phase 2L-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2L-A/B marks the MVP release candidate as locally acceptance-covered."
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Release-candidate acceptance coverage proves public catalogue/quote UX, admin operations, quote workflow, and admin write boundaries locally."
    );
    expect(`${environmentReadiness}\n${smokeRunbook}`).toContain(
      "release-candidate acceptance"
    );
    expect(`${environmentReadiness}\n${smokeRunbook}`).toContain(
      "No deployment is performed"
    );
  });

  it("pins public route polish, safe not-found states, and non-ecommerce wording", () => {
    expect(existsSync(resolve(repoRoot, "website/app/not-found.tsx"))).toBe(true);

    const homepage = readRepoFile("website/app/page.tsx");
    const listingsPage = readRepoFile("website/app/listings/page.tsx");
    const listingDetail = readRepoFile("website/app/listings/[slug]/page.tsx");
    const listingNotFound = readRepoFile(
      "website/app/listings/[slug]/not-found.tsx"
    );
    const categoriesPage = readRepoFile("website/app/categories/page.tsx");
    const cataloguePage = readRepoFile("website/app/catalogue/page.tsx");
    const catalogueDetail = readRepoFile("website/app/catalogue/[slug]/page.tsx");
    const catalogueNotFound = readRepoFile(
      "website/app/catalogue/[slug]/not-found.tsx"
    );
    const quotePage = readRepoFile("website/app/quote/page.tsx");
    const eventsPage = readRepoFile("website/app/events/page.tsx");
    const globalNotFound = readRepoFile("website/app/not-found.tsx");
    const publicSource = [
      homepage,
      listingsPage,
      listingDetail,
      listingNotFound,
      categoriesPage,
      cataloguePage,
      catalogueDetail,
      catalogueNotFound,
      quotePage,
      eventsPage,
      globalNotFound
    ].join("\n");

    expect(homepage).toContain("Request a quote");
    expect(homepage).toContain("Browse listings");
    expect(listingsPage).toContain("Rental listings");
    expect(listingsPage).toContain("No public rental listings match this view");
    expect(listingsPage).toContain('detailBasePath="/listings"');
    expect(listingDetail).toContain("ProductPageContent");
    expect(listingDetail).toContain("notFound()");
    expect(listingNotFound).toContain("Listing unavailable");
    expect(listingNotFound).toContain("Send an enquiry");
    expect(categoriesPage).toContain("Rental categories");
    expect(categoriesPage).toContain("No public categories are available");
    expect(cataloguePage).toContain("Furniture catalogue");
    expect(cataloguePage).toContain("Send an enquiry");
    expect(cataloguePage).toContain("fallbackImage");
    expect(catalogueDetail).toContain("Furniture listing");
    expect(catalogueDetail).toContain("Request a quote");
    expect(catalogueNotFound).toContain("Listing unavailable");
    expect(quotePage).toContain("Quote request");
    expect(quotePage).toContain("QuoteRequestForm");
    expect(eventsPage).toContain("Start a rental enquiry");
    expect(globalNotFound).toContain("Page unavailable");
    expect(globalNotFound).toContain("Browse listings");
    expect(globalNotFound).toContain("Request a quote");

    expect(publicSource).not.toMatch(forbiddenCommercePattern);
    expect(publicSource).not.toMatch(
      /supabase error|sql|stack trace|token|cookie|internal note|quote_request_activity/i
    );
  });

  it("pins public quote acceptance coverage without public tracking or raw error leakage", () => {
    const quoteForm = readRepoFile("website/components/QuoteRequestForm.tsx");
    const quoteFormTest = readRepoFile(
      "website/components/QuoteRequestForm.test.tsx"
    );
    const quoteRoute = readRepoFile("website/app/api/quote/route.ts");
    const quoteRouteTest = readRepoFile("website/app/api/quote/route.test.ts");
    const publicQuoteSource = [
      quoteForm,
      quoteRoute,
      readRepoFile("website/app/quote/page.tsx"),
      readRepoFile("website/lib/quote/types.ts"),
      readRepoFile("website/lib/quote/validation.ts"),
      readRepoFile("website/lib/quote/quote-repository.ts")
    ].join("\n");

    expect(quoteForm).toContain('fetch("/api/quote"');
    expect(quoteForm).toContain('status: "success"');
    expect(quoteForm).toContain(
      "Quote requests are temporarily unavailable. Please try again later with the same event details."
    );
    expect(quoteFormTest).toContain(
      "posts browser quote requests only to the first-party API route"
    );
    expect(quoteFormTest).toContain(
      "preserves a customer message when no item snapshots are provided"
    );
    expect(quoteFormTest).toContain("item-specific notes");
    expect(quoteFormTest).toContain("queryByRole(\"link\", { name: /track|status/i })");
    expect(quoteRoute).toContain("validateQuoteSubmission");
    expect(quoteRoute).toContain("FALLBACK_MESSAGE");
    expect(quoteRouteTest).toContain(
      "fails safely when quote persistence is not configured"
    );
    expect(quoteRouteTest).toContain("not.toContain(\"SUPABASE_URL\")");
    expect(quoteRouteTest).toContain("not.toContain(\"Maya\")");

    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual([]);
    expect(publicQuoteSource).not.toContain("/api/admin/quote-requests");
    expect(publicQuoteSource).not.toContain("execute_admin_quote_workflow");
    expect(publicQuoteSource).not.toContain("internalNote");
    expect(publicQuoteSource).not.toMatch(/reviewing|quoted|closed|archived/);
    expect(publicQuoteSource).not.toMatch(forbiddenCommercePattern);
  });

  it("pins protected admin operations and quote-detail separation", () => {
    const adminPages = readTrackedFiles([
      "website/app/admin/page.tsx",
      "website/app/admin/listings/page.tsx",
      "website/app/admin/categories/page.tsx",
      "website/app/admin/media/page.tsx",
      "website/app/admin/quotes/page.tsx",
      "website/app/admin/quotes/[quoteRequestId]/page.tsx"
    ]);
    const adminPageSource = adminPages.map((file) => readRepoFile(file)).join("\n");
    const shell = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const shellTest = readRepoFile(
      "website/app/admin/protected-admin-shell.test.tsx"
    );
    const inboxPanel = readRepoFile(
      "website/components/admin/quote-request-inbox-panel.tsx"
    );
    const inboxPanelTest = readRepoFile(
      "website/components/admin/quote-request-inbox-panel.test.tsx"
    );

    expect(adminPageSource).toContain("resolveProtectedAdminShellState");
    expect(adminPageSource).toContain("AdminShellContent");
    expect(shell).toContain('"/admin/listings"');
    expect(shell).toContain('"/admin/categories"');
    expect(shell).toContain('"/admin/media"');
    expect(shell).toContain('"/admin/quotes"');
    expect(shell).toContain("Quote request details are temporarily unavailable.");
    expect(shellTest).toContain("maps unauthenticated users to a safe login-required state");
    expect(shellTest).toContain("does not render category write controls outside loaded authorised dashboard state");
    expect(inboxPanel).toContain("requestQuoteWriteProof");
    expect(inboxPanel).toContain('requestedOperation: quoteWriteOperation');
    expect(inboxPanel).toContain("genericFailureMessage");
    expect(inboxPanel).toContain("Customer message");
    expect(inboxPanel).toContain("Requested listings and items");
    expect(inboxPanel).toContain("Admin-only status history");
    expect(inboxPanelTest).toContain("does not imply ecommerce or customer-facing quote tracking");
    expect(`${shell}\n${inboxPanel}`).not.toMatch(forbiddenCommercePattern);
    expect(`${shell}\n${inboxPanel}`).not.toMatch(
      /raw exception|sql|stack trace|env value|token|cookie/i
    );
  });

  it("pins admin write, quote workflow, and local search-index boundaries", () => {
    const productPersistence = readRepoFile(
      "website/lib/products/persistence/supabase-product-persistence.ts"
    );
    const productRoute = readRepoFile(
      "website/lib/products/persistence/admin-product-write-route.ts"
    );
    const quoteWorkflow = readRepoFile(
      "website/lib/quote/admin-write/admin-quote-request-status-write.ts"
    );
    const searchIndexAdapter = readRepoFile(
      "website/lib/search-index/supabase-search-index-adapter.ts"
    );
    const searchIndexAdapterTest = readRepoFile(
      "website/lib/search-index/supabase-search-index-adapter.test.ts"
    );
    const hardeningMigration = readRepoFile(
      "supabase/migrations/20260606143000_admin_write_boundary_hardening.sql"
    );
    const rlsTest = readRepoFile("scripts/test-supabase-rls.cjs");
    const migrationTest = readRepoFile(
      "scripts/validate-supabase-migrations.test.cjs"
    );

    expect(productPersistence).toContain('rpc("execute_admin_product_write"');
    expect(productPersistence).not.toMatch(/from\(["']categories["']\)/);
    expect(productPersistence).not.toMatch(/from\(["']products["']\)/);
    expect(productPersistence).not.toMatch(/from\(["']product_images["']\)/);
    expect(productRoute).toContain("csrfVerifier");
    expect(productRoute).toContain("resolveServerAdminRuntimeRouteGateAdapter");
    expect(productRoute).toContain("resolveServerAdminCsrfProofSessionWorkspaceBinding");
    expect(quoteWorkflow).toContain('rpc("execute_admin_quote_workflow"');
    expect(hardeningMigration).toContain("product_category_workspace_mismatch");
    expect(hardeningMigration).toContain("product_image_workspace_mismatch");
    expect(rlsTest).toContain(
      "execute_admin_product_write rejects cross-workspace relationship payloads"
    );
    expect(rlsTest).toContain(
      "admin listing and media writes enqueue local search-index jobs only"
    );
    expect(migrationTest).toContain(
      "execute_admin_product_write should validate product category relationships"
    );
    expect(searchIndexAdapter).toContain('rpc("enqueue_search_index_job"');
    expect(searchIndexAdapter).toContain("recordDocument");
    expect(searchIndexAdapter).toContain('reason: "adapter_unavailable"');
    expect(searchIndexAdapterTest).toContain("does not provide direct search document writes");
    expect(`${productPersistence}\n${searchIndexAdapter}`).not.toContain(
      "search_index_documents"
    );
  });

  it("keeps final static security boundaries free of new runtime scope", () => {
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const browserFacingSource = readTrackedProductionSources([
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/components"
    ]);
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib/catalogue",
      "website/lib/products",
      "website/lib/quote",
      "website/lib/search-index"
    ]);
    const chatRoute = readRepoFile("website/app/api/chat/route.ts");

    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(browserFacingSource).not.toContain("@supabase/");
    expect(browserFacingSource).not.toContain("createBrowserClient");
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(chatRoute).not.toMatch(
      /pinecone|retrieval|rerank|vector|embedding|rag|search[_ -]?index/i
    );
    expect(appAndLibSource).not.toMatch(forbiddenCommercePattern);
    expect(appAndLibSource).not.toMatch(/notification|hubspot api|api\.hubapi|crm sync job|crm integration/i);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-account"])).toEqual([]);
    expect(readTrackedFiles(["website/app/customer-account"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/crm"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/search-index/sync"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/chat/retrieval"])).toEqual([]);
    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });
});
