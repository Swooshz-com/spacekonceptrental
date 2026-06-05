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

function readTrackedProductionSources(paths: string[], excludePaths: string[] = []) {
  const normalizedExcludePaths = excludePaths.map(normalizePathForGit);

  return readTrackedFiles(paths)
    .filter(
      (filePath) =>
        !normalizedExcludePaths.some(
          (path) => filePath === path || filePath.startsWith(`${path}/`)
        )
    )
    .filter(isProductionSource)
    .map(readRepoFile)
    .join("\n");
}

describe("Phase 2G-A RAG search-index architecture and sync governance", () => {
  it("records Phase 2G-A status after PR #109", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const ragChecklist = readRepoFile(
      "docs/checklists/PHASE-4-RAG-KNOWLEDGE.md"
    );
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const plan = readRepoFile("docs/RAG-SEARCH-INDEX-PLAN.md");

    expect(status).toContain(
      "PR #109 merged Phase 2G-A RAG search-index architecture and sync governance"
    );
    expect(status).toContain(
      "Phase 2G-A RAG search-index architecture and sync governance is complete as docs/static-guard work only."
    );
    expect(status).toContain("02a16bdfd938841ddeac408f4d204d455050f714");
    expect(roadmap).toContain(
      "Phase 2G-A adds RAG/search-index architecture and sync governance only."
    );
    expect(readiness).toContain("Current Phase 2G-A status");
    expect(ragChecklist).toContain(
      "Phase 2G-A RAG Search-Index Governance"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2G-A defines future-safe RAG/search-index architecture and sync governance."
    );
    expect(plan).toContain("Supabase/listing data remains canonical");
  });

  it("documents the future derived-index model, sync lifecycle, and retrieval gates", () => {
    const plan = normalizeWhitespace(
      readRepoFile("docs/RAG-SEARCH-INDEX-PLAN.md")
    );

    expect(plan).toContain("Pinecone is a future derived search index only");
    expect(plan).toContain("outbox/worker pattern");
    expect(plan).toContain("admin listing writes must not be blocked");
    expect(plan).toContain("idempotent, retryable, auditable, and replayable");
    expect(plan).toContain("stable IDs");
    expect(plan).toContain("content_hash");
    expect(plan).toContain("delete or mark invisible");
    expect(plan).toContain("metadata filters");
    expect(plan).toContain("workspace");
    expect(plan).toContain("public_chat");
    expect(plan).toContain("top 30-50");
    expect(plan).toContain("top 5-8");
    expect(plan).toContain("reranking");
    expect(plan).toContain("Hybrid search is a later decision gate");
    expect(plan).toContain("listing_image_alt_text");
    expect(plan).toContain("customer-visible internal notes");
    expect(plan).toContain("No transcript content");
    expect(plan).toContain("Pinecone namespaces must isolate environment/workspace");
  });

  it("does not add Pinecone runtime code, packages, env reads, or chat retrieval wiring", () => {
    const productionSource = readTrackedProductionSources(
      ["website/app", "website/components", "website/lib"],
      ["website/lib/search-index"]
    );
    const rootPackage = readRepoFile("package.json");
    const websitePackage = readRepoFile("website/package.json");
    const chatRoute = readRepoFile("website/app/api/chat/route.ts");

    expect(rootPackage).not.toMatch(/@pinecone-database|pinecone/i);
    expect(websitePackage).not.toMatch(/@pinecone-database|pinecone/i);
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toMatch(/process\.env\.[A-Z0-9_]*PINECONE/i);
    expect(productionSource).not.toMatch(
      /pinecone|vector[_ -]?upsert|vector[_ -]?delete|embedding|rerank|retrieval/i
    );
    expect(chatRoute).not.toMatch(
      /pinecone|retrieval|rerank|vector|embedding|rag|search[_ -]?index/i
    );
  });

  it("does not add n8n workflow drift, public uploads, notes exposure, or ecommerce flow", () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const plan = readRepoFile("docs/RAG-SEARCH-INDEX-PLAN.md");

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
    expect(productionSource).not.toMatch(
      /customerVisibleInternalNotes|customer-visible internal notes/i
    );
    expect(productionSource).not.toMatch(
      /\bcarts?\b|\bcheckout\b|\bpayments?\b|order fulfilment|stock[_ -]?reservation|confirmed booking|online ordering/i
    );
    expect(plan).not.toMatch(/publicly retrievable customer-visible internal notes/i);
  });
});
