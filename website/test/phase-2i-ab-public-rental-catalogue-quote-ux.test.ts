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

describe("Phase 2I-A/B public rental catalogue and quote request UX MVP", () => {
  it("records Phase 2I-A/B as the latest completed public rental catalogue and quote UX MVP", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "PR #114 merged Phase 2I-A/B public rental catalogue and quote request UX MVP"
    );
    expect(status).toContain(
      "Phase 2I-A/B completed the public rental catalogue and quote request UX MVP."
    );
    expect(roadmap).toContain(
      "Phase 2I-A/B adds the public rental catalogue and quote request UX MVP"
    );
    expect(readiness).toContain("Previous Current Phase 2I-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2I-A/B adds the public rental catalogue and quote request UX MVP."
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Public rental catalogue browsing, listing detail, category browsing, and quote request handoff are improved."
    );
  });

  it("adds public listing and category routes backed by the existing public catalogue read boundary", () => {
    expect(readTrackedFiles(["website/app/listings"])).toEqual([
      "website/app/listings/[slug]/not-found.tsx",
      "website/app/listings/[slug]/page.tsx",
      "website/app/listings/page.tsx"
    ]);
    expect(readTrackedFiles(["website/app/categories"])).toEqual([
      "website/app/categories/page.tsx"
    ]);

    const listingsPage = readRepoFile("website/app/listings/page.tsx");
    const listingDetailPage = readRepoFile(
      "website/app/listings/[slug]/page.tsx"
    );
    const categoriesPage = readRepoFile("website/app/categories/page.tsx");
    const layoutSource = readRepoFile("website/app/layout.tsx");

    expect(listingsPage).toContain("getPublicCatalogue");
    expect(listingsPage).toContain("CataloguePageContent");
    expect(listingsPage).toContain('detailBasePath="/listings"');
    expect(listingDetailPage).toContain("getPublicProductBySlug");
    expect(listingDetailPage).toContain("ProductPageContent");
    expect(categoriesPage).toContain("getPublicCatalogue");
    expect(categoriesPage).toContain("getQuoteHrefForListing");
    expect(layoutSource).toContain('href="/listings"');
    expect(layoutSource).toContain('href="/categories"');

    for (const source of [listingsPage, listingDetailPage, categoriesPage]) {
      expect(source).toContain('dynamic = "force-dynamic"');
      expect(source).not.toContain("@supabase/");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
      expect(source).not.toMatch(/draft|archived|internalNote|quote_request_activity/);
    }
  });

  it("keeps public quote/enquiry flow first-party and free from public workflow tracking", () => {
    const publicQuoteSource = readTrackedProductionSources([
      "website/app/quote",
      "website/app/api/quote",
      "website/components/QuoteRequestForm.tsx",
      "website/lib/catalogue/quote-handoff.ts"
    ]);

    expect(publicQuoteSource).toContain("/api/quote");
    expect(publicQuoteSource).toContain("getQuoteHrefForListing");
    expect(publicQuoteSource).toContain("notes");
    expect(publicQuoteSource).not.toContain("/api/admin/quote-requests");
    expect(publicQuoteSource).not.toContain("execute_admin_quote_workflow");
    expect(publicQuoteSource).not.toContain("internalNote");
    expect(publicQuoteSource).not.toContain("quote_request_activity");
    expect(publicQuoteSource).not.toMatch(/reviewing|quoted|closed|archived/);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual([]);
  });

  it("keeps forbidden public runtime surfaces absent", () => {
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const publicSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib/catalogue",
      "website/lib/quote"
    ]);
    const chatRoute = readRepoFile("website/app/api/chat/route.ts");

    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(publicSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(publicSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(publicSource).not.toContain("@pinecone-database");
    expect(publicSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(chatRoute).not.toMatch(
      /pinecone|retrieval|rerank|vector|embedding|rag|search[_ -]?index/i
    );
    expect(publicSource).not.toMatch(
      /cart|checkout|payments?|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i
    );
    expect(publicSource).not.toMatch(/notification|hubspot api|api\.hubapi|crm sync job|crm integration/i);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-upload"])).toEqual([]);
    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });
});
