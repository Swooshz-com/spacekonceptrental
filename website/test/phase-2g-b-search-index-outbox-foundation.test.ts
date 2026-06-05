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

function normalizePathForGit(path: string) {
  return path.replace(/\\/g, "/").replace(/\/$/, "");
}

function readTrackedFiles(paths: string[]) {
  return execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((filePath) =>
      paths
        .map(normalizePathForGit)
        .some((path) => filePath === path || filePath.startsWith(`${path}/`))
    );
}

function isProductionSource(filePath: string) {
  return (
    sourceExtensions.has(extname(filePath)) &&
    !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath) &&
    !filePath.startsWith("website/test/")
  );
}

function readTrackedProductionSources(
  paths: string[],
  excludePaths: string[] = []
) {
  const normalizedExcludePaths = excludePaths.map(normalizePathForGit);

  return readTrackedFiles(paths)
    .filter(
      (filePath) =>
        !normalizedExcludePaths.some(
          (path) => filePath === path || filePath.startsWith(`${path}/`)
        )
    )
    .filter(isProductionSource)
    .map((filePath) => readRepoFile(filePath))
    .join("\n");
}

describe("Phase 2G-C/D search-index enqueue integration", () => {
  it("records Phase 2G-C/D as a completed local enqueue integration", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const ragChecklist = readRepoFile(
      "docs/checklists/PHASE-4-RAG-KNOWLEDGE.md"
    );
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const plan = normalizeWhitespace(
      readRepoFile("docs/RAG-SEARCH-INDEX-PLAN.md")
    );

    expect(status).toContain(
      "PR #112 merged Phase 2G-C/D server-only local search-index enqueue integration"
    );
    expect(status).toContain(
      "The latest completed capability is Phase 2G-C/D server-only local search-index enqueue integration."
    );
    expect(status).toContain(
      "at merge commit `116f3761032b2af23e2bc240a77b6e810f45e918`"
    );
    expect(status).toContain(
      "PR #111 merged Phase 2G-B local search-index outbox foundation"
    );
    expect(roadmap).toContain(
      "Phase 2G-C/D adds server-only local search-index enqueue integration only."
    );
    expect(readiness).toContain("Current Phase 2G-C/D status");
    expect(ragChecklist).toContain(
      "Phase 2G-C/D Server-Only Local Search-Index Enqueue Integration"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2G-C/D adds server-only local search-index enqueue integration only."
    );
    expect(plan).toContain("Phase 2G-C/D implements only the local enqueue step");
    expect(plan).toContain("Pinecone remains a future derived search index only");
  });

  it("adds local search-index tables with fail-closed RLS and safe metadata constraints", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260605133000_search_index_outbox_foundation.sql"
    );
    const normalized = normalizeWhitespace(migration);

    expect(migration).toContain(
      "create or replace function public.is_safe_search_index_metadata"
    );
    expect(migration).toContain("with recursive metadata_walk");
    expect(migration).toContain(
      "create table if not exists public.search_index_jobs"
    );
    expect(migration).toContain(
      "create table if not exists public.search_index_documents"
    );
    expect(normalized).toContain(
      "constraint search_index_jobs_metadata_safe_check check (public.is_safe_search_index_metadata(metadata, 4096))"
    );
    expect(normalized).toContain(
      "constraint search_index_documents_metadata_safe_check check (public.is_safe_search_index_metadata(metadata, 4096))"
    );
    expect(normalized).toContain(
      "create unique index if not exists search_index_jobs_active_idempotency_key"
    );
    expect(normalized).toContain(
      "constraint search_index_documents_source_visibility_key unique (workspace_id, source_type, source_id, visibility)"
    );

    for (const tableName of ["search_index_jobs", "search_index_documents"]) {
      expect(migration).toContain(
        `alter table public.${tableName} enable row level security;`
      );
      expect(migration).toContain(
        `revoke all on table public.${tableName} from public;`
      );
      expect(migration).toContain(
        `revoke all on table public.${tableName} from anon, authenticated;`
      );
      expect(migration).not.toMatch(
        new RegExp(`create policy [^;]* on public\\.${tableName}`, "i")
      );
    }

    for (const forbidden of [
      "provider[_-]?debug",
      "trace[_-]?dump",
      "api[_-]?key",
      "service[_-]?role",
      "customer[_-]?visible[_-]?internal[_-]?notes",
      "full[_-]?transcript",
      "webhook"
    ]) {
      expect(migration).toContain(forbidden);
    }
  });

  it("adds server-only TypeScript search-index contracts and local enqueue helpers without external executors", () => {
    const index = readRepoFile("website/lib/search-index/index.ts");
    const contract = readRepoFile("website/lib/search-index/contract.ts");
    const disabled = readRepoFile(
      "website/lib/search-index/disabled-search-index.ts"
    );
    const builder = readRepoFile("website/lib/search-index/search-index-builder.ts");
    const supabaseAdapter = readRepoFile(
      "website/lib/search-index/supabase-search-index-adapter.ts"
    );
    const types = readRepoFile("website/lib/search-index/types.ts");

    for (const source of [index, contract, disabled, builder, types]) {
      expect(source).toContain('import "server-only";');
      expect(source).not.toContain("@pinecone-database");
      expect(source).not.toMatch(/process\.env|cookies\(|headers\(/);
      expect(source).not.toMatch(/createClient|\.rpc\(|\.insert\(|\.select\(|\.upsert\(/);
    }

    expect(supabaseAdapter).toContain('import "server-only";');
    expect(supabaseAdapter).toContain("enqueue_search_index_job");
    expect(supabaseAdapter).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(supabaseAdapter).toContain("recordDocument");
    expect(supabaseAdapter).toContain("adapter_unavailable");
    expect(supabaseAdapter).not.toContain("@pinecone-database");
    expect(supabaseAdapter).not.toMatch(
      /process\.env|cookies\(|headers\(|createClient|\.insert\(|\.select\(|\.upsert\(/
    );

    expect(index).toContain("getSearchIndexAdapter");
    expect(index).toContain("disabledSearchIndex");
    expect(index).toContain("SupabaseSearchIndexAdapter");
    expect(index).toContain("buildListingSearchIndexJob");
    expect(index).toContain("buildCategorySearchIndexJob");
    expect(index).toContain("buildListingImageAltTextSearchIndexJob");
    expect(contract).toContain("createSearchIndexJobCommand");
    expect(contract).toContain("createSearchIndexDocumentCommand");
    expect(contract).toContain("recordSearchIndexJob");
    expect(contract).toContain("recordSearchIndexDocument");
    expect(disabled).toContain("DisabledSearchIndex");
    expect(types).toContain("SearchIndexSourceType");
    expect(types).toContain("SearchIndexVisibility");
    expect(types).toContain("SearchIndexOperation");
    expect(types).toContain("SearchIndexJobStatus");
  });

  it("keeps runtime retrieval, n8n workflow drift, uploads, notes exposure, and ecommerce absent", () => {
    const runtimeSource = readTrackedProductionSources(
      ["website/app", "website/components", "website/lib"],
      ["website/lib/search-index"]
    );
    const searchIndexSource = [
      readTrackedProductionSources(["website/lib/search-index"]),
      readRepoFile("website/lib/search-index/search-index-builder.ts"),
      readRepoFile("website/lib/search-index/supabase-search-index-adapter.ts")
    ].join("\n");
    const rootPackage = readRepoFile("package.json");
    const websitePackage = readRepoFile("website/package.json");
    const chatRoute = readRepoFile("website/app/api/chat/route.ts");

    expect(rootPackage).not.toMatch(/@pinecone-database|pinecone/i);
    expect(websitePackage).not.toMatch(/@pinecone-database|pinecone/i);
    expect(runtimeSource).not.toContain("@pinecone-database");
    expect(runtimeSource).not.toMatch(/process\.env\.[A-Z0-9_]*PINECONE/i);
    expect(searchIndexSource).not.toContain("@pinecone-database");
    expect(searchIndexSource).not.toMatch(
      /process\.env|createClient|\.insert\(|\.select\(|\.upsert\(/
    );
    expect(searchIndexSource).not.toMatch(
      /search_index_documents[\s\S]{0,80}\.(?:insert|upsert)\(/
    );
    expect(searchIndexSource).toContain('rpc("enqueue_search_index_job"');
    expect(chatRoute).not.toMatch(
      /pinecone|retrieval|rerank|vector|embedding|rag|search[_ -]?index/i
    );

    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
    expect(readTrackedFiles(["website/app/api/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(runtimeSource).not.toMatch(
      /customerVisibleInternalNotes|customer-visible internal notes/i
    );
    expect(runtimeSource).not.toMatch(
      /\bcarts?\b|\bcheckout\b|\bpayments?\b|order fulfilment|stock[_ -]?reservation|confirmed booking|online ordering/i
    );
  });
});
