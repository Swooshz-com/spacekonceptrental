import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
let trackedFilesCache: string[] | undefined;

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ");
}

function normalizePathForGit(path: string) {
  return path.replace(/\\/g, "/").replace(/\/$/, "");
}

function readAllTrackedFiles() {
  trackedFilesCache ??= execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(Boolean);

  return trackedFilesCache;
}

function readTrackedFiles(paths: string[]) {
  const normalizedPaths = paths.map(normalizePathForGit);

  return readAllTrackedFiles().filter((filePath) =>
    normalizedPaths.some(
      (path) => filePath === path || filePath.startsWith(`${path}/`)
    )
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

describe("Phase 2E-H transcript audit/evidence foundation", () => {
  it("records Phase 2E-H as current with Phase 2E-G PR #105 completed", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

    expect(status).toContain(
      "Current phase: Phase 2E-H - transcript audit/evidence local schema, RLS, and server-only contract foundation."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2E-G - transcript audit/evidence model and operator runbook readiness."
    );
    expect(status).toContain("Last merged phase PR: #105");
    expect(status).toContain(
      "Merge commit: `a59547130c33ec56e275dfdee48ceac9a1f8587f`"
    );
    expect(status).toContain(
      "PR #105 merged Phase 2E-G transcript audit/evidence model and operator runbook readiness"
    );
    expect(readiness).toContain("Current Phase 2E-H status");
    expect(roadmap).toContain(
      "Phase 2E-H adds local transcript audit/evidence schema, RLS, and server-only contract foundation only."
    );
    expect(checklist).toContain(
      "Phase 2E-H Completed Local Schema/RLS And Server-Only Contract Foundation"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2E-H adds transcript audit/evidence local schema, RLS, and server-only contract foundation only."
    );
    expect(decisionLog).toContain(
      "PR #105 merged at `a59547130c33ec56e275dfdee48ceac9a1f8587f`"
    );
  });

  it("adds local audit/evidence tables with RLS and no browser grants or unsafe storage columns", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260604110000_transcript_audit_evidence_foundation.sql"
    );
    const sql = normalizeWhitespace(migration);

    expect(sql).toContain(
      "create table if not exists public.transcript_audit_events"
    );
    expect(sql).toContain(
      "create table if not exists public.transcript_evidence_records"
    );
    expect(sql).toContain(
      "constraint transcript_audit_events_metadata_safe_check check (public.is_safe_transcript_metadata(metadata, 4096))"
    );
    expect(sql).toContain(
      "constraint transcript_evidence_records_metadata_safe_check check (public.is_safe_transcript_metadata(metadata, 4096))"
    );
    expect(sql).toContain(
      "alter table public.transcript_audit_events enable row level security;"
    );
    expect(sql).toContain(
      "alter table public.transcript_evidence_records enable row level security;"
    );
    expect(sql).toContain(
      "revoke all on table public.transcript_audit_events from anon, authenticated;"
    );
    expect(sql).toContain(
      "revoke all on table public.transcript_evidence_records from anon, authenticated;"
    );
    expect(migration).not.toMatch(
      /grant\s+(select|insert|update|delete|all)[\s\S]*?on table public\.transcript_(audit_events|evidence_records) to (anon|authenticated)/i
    );
    expect(migration).not.toMatch(
      /create policy [^;]* on public\.transcript_(audit_events|evidence_records)/i
    );

    for (const columnName of [
      "full_transcript",
      "transcript_content",
      "raw_provider_payload",
      "provider_payload",
      "workflow_payload",
      "webhook_url",
      "raw_headers",
      "cookies",
      "tokens",
      "api_keys",
      "private_keys",
      "secrets",
      "service_role_material",
      "production_evidence"
    ]) {
      expect(sql).not.toMatch(
        new RegExp(`\\b${columnName}\\b\\s+(text|jsonb|bytea|uuid)`)
      );
    }
  });

  it("keeps the audit contract server-only, disabled by default, and injected only", () => {
    const auditFiles = readTrackedFiles(["website/lib/chat/audit"]);
    const auditSource = readTrackedProductionSources(["website/lib/chat/audit"]);

    expect(auditFiles).toEqual([
      "website/lib/chat/audit/contract.ts",
      "website/lib/chat/audit/disabled-transcript-audit.ts",
      "website/lib/chat/audit/index.ts",
      "website/lib/chat/audit/rpc-transcript-audit-adapter.test.ts",
      "website/lib/chat/audit/rpc-transcript-audit-adapter.ts",
      "website/lib/chat/audit/transcript-audit-contract.test.ts",
      "website/lib/chat/audit/types.ts"
    ]);
    expect(auditSource.match(/import "server-only";/g)).toHaveLength(5);
    expect(auditSource).toContain("TranscriptAuditAdapter");
    expect(auditSource).toContain("disabledTranscriptAudit");
    expect(auditSource).toContain("getTranscriptAuditAdapter");
    expect(auditSource).toContain("createRpcTranscriptAuditAdapter");
    expect(auditSource).not.toContain("@supabase/");
    expect(auditSource).not.toContain("createClient(");
    expect(auditSource).not.toContain("createServerSupabaseClient");
    expect(auditSource).not.toContain("process.env");
    expect(auditSource).not.toContain("headers()");
    expect(auditSource).not.toContain("cookies()");
    expect(auditSource).not.toContain(".insert(");
    expect(auditSource).not.toContain(".upsert(");
    expect(auditSource).not.toContain(".select(");
    expect(auditSource).not.toContain(".rpc(");
    expect(auditSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(auditSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(auditSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(auditSource).not.toContain("PINECONE");
    expect(auditSource).not.toContain("chat-config");
  });

  it("keeps /api/chat and runtime transcript lifecycle surfaces unwired", () => {
    const routeSource = readRepoFile("website/app/api/chat/route.ts");
    const runtimeSource = readTrackedProductionSources(
      ["website/app", "website/components", "website/lib/chat"],
      ["website/lib/chat/audit"]
    );

    expect(routeSource).not.toMatch(
      /TranscriptAudit|recordTranscriptAuditEvent|recordTranscriptEvidenceRecord|createTranscriptAuditEventCommand|createTranscriptEvidenceRecordCommand|getTranscriptAuditAdapter/i
    );
    expect(runtimeSource).not.toContain("@supabase/");
    expect(runtimeSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(runtimeSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(runtimeSource).not.toMatch(
      /deleteTranscript|exportTranscript|retentionCleanup|cleanupExpiredTranscripts|transcriptRetentionJob|scheduleTranscript/i
    );

    expect(readTrackedFiles(["website/app/api/transcript-audit"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcript-evidence"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/api/transcript-delete"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcript-export"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcript-retention"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/api/cron"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/jobs"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/chat/evidence"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/chat/retention"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/chat/lifecycle"])).toEqual([]);
    expect(readTrackedFiles(["website/app/admin/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/admin/transcripts"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/account"])).toEqual([]);
    expect(readTrackedFiles(["website/app/customer"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/crm"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/crm"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/rag"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/saas-chatbot"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", "website/vercel.json"])).toEqual(
      []
    );
    expect(readTrackedFiles(["docs/evidence"])).toEqual([]);
    expect(readTrackedFiles(["docs/production-evidence"])).toEqual([]);
    expect(readTrackedFiles(["docs/transcript-evidence"])).toEqual([]);
  });
});
