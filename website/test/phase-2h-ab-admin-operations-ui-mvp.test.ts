import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

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

describe("Phase 2H-A/B admin operations UI MVP", () => {
  it("records Phase 2H-A/B as a completed admin operations UI MVP", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "PR #113 merged Phase 2H-A/B protected admin operations UI MVP"
    );
    expect(status).toContain(
      "The latest completed capability is Phase 2H-A/B protected admin operations UI MVP."
    );
    expect(roadmap).toContain(
      "Phase 2H-A/B adds the admin operations UI MVP"
    );
    expect(readiness).toContain("Previous Current Phase 2H-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2H-A/B adds the protected admin operations UI MVP."
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Protected admin operations dashboard links to listing, category, media, and quote workflow surfaces."
    );
  });

  it("adds protected admin operations pages without public/customer admin drift", () => {
    expect(readTrackedFiles(["website/app/admin"])).toEqual([
      "website/app/admin/catalogue/page.tsx",
      "website/app/admin/delivery-log/page.tsx",
      "website/app/admin/enquiry-email/page.tsx",
      "website/app/admin/hero/page.tsx",
      "website/app/admin/login/page.test.tsx",
      "website/app/admin/login/page.tsx",
      "website/app/admin/logout/route.test.ts",
      "website/app/admin/logout/route.ts",
      "website/app/admin/page.tsx",
      "website/app/admin/protected-admin-shell.module.css",
      "website/app/admin/protected-admin-shell.test.tsx",
      "website/app/admin/protected-admin-shell.tsx",
      "website/app/admin/setups/page.tsx"
    ]);

    for (const page of [
      "website/app/admin/page.tsx",
      "website/app/admin/hero/page.tsx",
      "website/app/admin/catalogue/page.tsx",
      "website/app/admin/setups/page.tsx",
      "website/app/admin/enquiry-email/page.tsx",
      "website/app/admin/delivery-log/page.tsx"
    ]) {
      const source = readRepoFile(page);

      expect(source).toContain("resolveProtectedAdminShellState");
      expect(source).toContain("AdminShellContent");
      expect(source).toContain('dynamic = "force-dynamic"');
      expect(source).not.toContain("@supabase/");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    }

    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
  });

  it("keeps listing/category/image writes on approved product write and upload boundaries", () => {
    const adminSource = readTrackedProductionSources([
      "website/app/admin",
      "website/components/admin",
      "website/lib/products",
      "website/lib/listings"
    ]);

    expect(adminSource).toContain("/api/admin/products");
    expect(adminSource).toContain("/api/admin/categories");
    expect(adminSource).toContain("/api/admin/product-images");
    expect(adminSource).toContain('rpc("execute_admin_product_write"');
    expect(adminSource).toContain("productImage.write");
    expect(adminSource).toContain("ListingImageUploadPanel");
    expect(adminSource).not.toMatch(/from\("products"\)\.(?:insert|update|upsert|delete)/);
    expect(adminSource).not.toMatch(/from\("categories"\)\.(?:insert|update|upsert|delete)/);
    expect(adminSource).not.toMatch(/from\("product_images"\)\.(?:insert|update|upsert|delete)/);
    expect(adminSource).not.toContain("@pinecone-database");
    expect(adminSource).not.toContain("PINECONE");
  });

  it("keeps quote workflow protected, admin-only, and backed by the approved RPC", () => {
    const quoteAdminSource = readTrackedProductionSources([
      "website/app/api/admin/quote-requests",
      "website/lib/quote/admin-read",
      "website/lib/quote/admin-write"
    ]);
    const publicQuoteSource = readTrackedProductionSources([
      "website/app/quote",
      "website/app/api/quote",
      "website/components/QuoteRequestForm.tsx"
    ]);

    expect(quoteAdminSource).toContain('rpc("execute_admin_quote_workflow"');
    expect(quoteAdminSource).toContain("internalNote");
    expect(quoteAdminSource).toContain("quote.write");
    expect(publicQuoteSource).not.toContain("quote_request_activity");
    expect(publicQuoteSource).not.toContain("internalNote");
    expect(publicQuoteSource).not.toMatch(/reviewing|quoted|closed|archived/);
  });

  it("keeps forbidden runtime surfaces absent from the admin operations MVP", () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);

    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(productionSource).not.toMatch(
      /retrieval|rerank|vector[_ -]?(?:upsert|delete)|embedding runtime/i
    );
    expect(productionSource).not.toMatch(
      /cart|checkout|payments?|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i
    );
    expect(productionSource).not.toMatch(/notification|hubspot api|api\.hubapi|crm sync job|crm integration/i);
    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });
});
