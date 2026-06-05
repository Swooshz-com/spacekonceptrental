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

describe("transcript metadata diagnostic denylist hotfix", () => {
  it("records the focused hotfix after Phase 2G-A", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

    for (const doc of [status, roadmap, readiness, checklist, decisionLog]) {
      const normalizedDoc = normalizeWhitespace(doc);

      expect(doc).toContain("metadata diagnostic denylist hotfix");
      expect(normalizedDoc).toContain("provider debug");
      expect(normalizedDoc).toContain("trace dump");
      expect(normalizedDoc).toContain("no transcript runtime writes or reads");
      expect(normalizedDoc).toContain("no Pinecone/n8n runtime changes");
    }
  });

  it("keeps the final SQL helper and TypeScript contract aligned on diagnostic denylist classes", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260605122000_transcript_metadata_diagnostic_denylist_hotfix.sql"
    );
    const contract = readRepoFile("website/lib/chat/audit/contract.ts");

    expect(migration).toContain(
      "create or replace function public.is_safe_transcript_metadata"
    );
    expect(migration).toContain("with recursive metadata_walk");
    expect(migration).toContain(
      "revoke all on function public.is_safe_transcript_metadata(jsonb, integer) from public;"
    );

    for (const denylistFragment of [
      "provider[_-]?debug",
      "trace[_-]?dump",
      "full[_-]?transcript",
      "transcript[_-]?content",
      "raw[_-]?provider[_-]?payload",
      "provider[_-]?payload",
      "debug[_-]?payload",
      "workflow[_-]?payload",
      "customer[_-]?visible[_-]?internal[_-]?notes"
    ]) {
      expect(migration).toContain(denylistFragment);
      expect(contract).toContain(denylistFragment);
    }
  });

  it("does not wire transcript runtime paths or add Pinecone/n8n runtime work", () => {
    const routeSource = readRepoFile("website/app/api/chat/route.ts");
    const runtimeSource = readTrackedProductionSources(
      ["website/app", "website/components", "website/lib/chat"],
      ["website/lib/chat/audit"]
    );

    expect(routeSource).not.toMatch(
      /TranscriptAudit|recordTranscriptAuditEvent|recordTranscriptEvidenceRecord|persistTranscript|transcript.*read/i
    );
    expect(runtimeSource).not.toMatch(
      /TranscriptAudit|recordTranscriptAuditEvent|recordTranscriptEvidenceRecord|insertTranscriptAuditEvent|insertTranscriptEvidenceRecord/i
    );
    expect(runtimeSource).not.toContain("@pinecone-database");
    expect(runtimeSource).not.toContain("PINECONE");
    expect(runtimeSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(runtimeSource).not.toContain("chat-config");

    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
    expect(readTrackedFiles(["website/app/api/transcript-audit"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcript-evidence"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/admin/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
  });
});
