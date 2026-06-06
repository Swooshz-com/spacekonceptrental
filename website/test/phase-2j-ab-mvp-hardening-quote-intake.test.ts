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

describe("Phase 2J-A/B MVP hardening and quote intake correctness", () => {
  it("records Phase 2J-A/B as the current MVP hardening phase", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2J-A/B - MVP hardening, quote intake correctness, and demo readiness."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 2I-A/B public rental catalogue and quote request UX MVP."
    );
    expect(status).toContain("Last merged capability PR: #114");
    expect(status).toContain(
      "Merge commit: `6bf9202df80fbfac995ee168dceea0ef7c26edfa`"
    );
    expect(roadmap).toContain(
      "Phase 2J-A/B adds MVP hardening, quote intake correctness, and demo readiness"
    );
    expect(readiness).toContain("Current Phase 2J-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2J-A/B adds MVP hardening, quote intake correctness, and demo readiness."
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Public quote/enquiry customer messages are preserved safely."
    );
  });

  it("adds a safe quote request customer message schema extension", () => {
    expect(
      readTrackedFiles([
        "supabase/migrations/20260606110000_quote_customer_message_hardening.sql"
      ])
    ).toEqual([
      "supabase/migrations/20260606110000_quote_customer_message_hardening.sql"
    ]);

    const migration = readRepoFile(
      "supabase/migrations/20260606110000_quote_customer_message_hardening.sql"
    );
    const normalized = normalizeWhitespace(migration);

    expect(normalized).toContain(
      "alter table public.quote_requests add column if not exists customer_message text"
    );
    expect(normalized).toContain(
      "constraint quote_requests_customer_message_length_check check (customer_message is null or char_length(customer_message) <= 1200)"
    );
    expect(normalized).toContain(
      "grant insert ( customer_message ) on public.quote_requests to anon"
    );
    expect(migration).toContain("comment on column public.quote_requests.customer_message");
    expect(migration).not.toMatch(/for select to anon|grant select .*to anon/i);
    expect(migration).not.toMatch(/customer[_ -]?visible[_ -]?internal[_ -]?notes/i);
  });

  it("keeps public quote intake first-party while preserving customer messages", () => {
    const quoteSource = readTrackedProductionSources([
      "website/app/quote",
      "website/app/api/quote",
      "website/components/QuoteRequestForm.tsx",
      "website/lib/quote/types.ts",
      "website/lib/quote/validation.ts",
      "website/lib/quote/quote-repository.ts"
    ]);

    expect(quoteSource).toContain("customerMessage");
    expect(quoteSource).toContain("customer_message");
    expect(quoteSource).toContain("/api/quote");
    expect(quoteSource).not.toContain("/api/admin/quote-requests");
    expect(quoteSource).not.toContain("execute_admin_quote_workflow");
    expect(quoteSource).not.toContain("internalNote");
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual([]);
  });

  it("adds a protected server-only admin quote detail read path", () => {
    const detailRead = readRepoFile(
      "website/lib/quote/admin-read/admin-quote-request-detail-read.ts"
    );
    const detailPage = readRepoFile(
      "website/app/admin/quotes/[quoteRequestId]/page.tsx"
    );
    const shellSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(detailRead).toContain('import "server-only";');
    expect(detailRead).toContain("resolveAdminQuoteRequestDetailRead");
    expect(detailRead).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(detailRead).toContain('from("quote_requests")');
    expect(detailRead).toContain("customer_message");
    expect(detailRead).toContain('from("quote_request_items")');
    expect(detailRead).toContain('from("quote_request_activity")');
    expect(detailRead).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(detailRead).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(detailPage).toContain("quoteDetailId");
    expect(shellSource).toContain("resolveAdminQuoteRequestDetailRead");
    expect(shellSource).toContain("quoteDetail");
  });

  it("keeps forbidden runtime surfaces absent", () => {
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib/catalogue",
      "website/lib/quote"
    ]);
    const chatRoute = readRepoFile("website/app/api/chat/route.ts");

    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(chatRoute).not.toMatch(
      /pinecone|retrieval|rerank|vector|embedding|rag|search[_ -]?index/i
    );
    expect(productionSource).not.toMatch(
      /cart|checkout|payments?|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i
    );
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
