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

describe("Phase 2E-I transcript audit/evidence insert boundary", () => {
  it("records Phase 2E-I status with Phase 2E-H PR #106 completed", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

    expect(status).toContain(
      "Current phase: Phase 2E-I - transcript audit/evidence server-only insert boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2E-H - transcript audit/evidence local schema, RLS, and server-only contract foundation."
    );
    expect(status).toContain("Last merged phase PR: #106");
    expect(status).toContain(
      "Merge commit: `8607e16d3c405df0797ec08536cce79f1b4f68d2`"
    );
    expect(readiness).toContain("Current Phase 2E-I status");
    expect(roadmap).toContain(
      "Phase 2E-I adds a server-only local/test-only insert boundary for transcript audit/evidence rows."
    );
    expect(checklist).toContain(
      "Phase 2E-I Completed Server-Only Insert Boundary"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2E-I adds a server-only local/test-only insert boundary for transcript audit/evidence rows."
    );
    expect(
      [status, readiness, roadmap, checklist, decisionLog].join("\n")
    ).toContain("enquiry/quote/request");
  });

  it("adds ungranted local insert RPCs without browser role grants", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260604120000_transcript_audit_evidence_insert_boundary.sql"
    );
    const sql = normalizeWhitespace(migration);

    expect(migration).toMatch(
      /create or replace function public\.insert_transcript_audit_event\(\s*p_workspace_id uuid,\s*p_event jsonb\s*\)/
    );
    expect(migration).toMatch(
      /create or replace function public\.insert_transcript_evidence_record\(\s*p_workspace_id uuid,\s*p_evidence jsonb\s*\)/
    );
    expect(migration).toMatch(/returns jsonb/i);
    expect(migration).toMatch(/security definer/i);
    expect(migration).toMatch(/set search_path = public/i);
    expect(migration).toMatch(/public\.is_safe_transcript_metadata/);
    expect(sql).toContain("insert into public.transcript_audit_events");
    expect(sql).toContain("insert into public.transcript_evidence_records");
    expect(migration).toMatch(/transcript_audit_workspace_mismatch/);
    expect(migration).toMatch(/transcript_audit_conversation_workspace_mismatch/);
    expect(migration).toMatch(/transcript_audit_quote_request_workspace_mismatch/);
    expect(migration).toMatch(/transcript_audit_actor_workspace_mismatch/);
    expect(migration).toMatch(/transcript_evidence_workspace_mismatch/);
    expect(migration).toMatch(/transcript_evidence_audit_event_workspace_mismatch/);
    expect(migration).toMatch(/transcript_audit_metadata_unsafe/);
    expect(migration).toMatch(/transcript_evidence_metadata_unsafe/);
    expect(migration).toMatch(/transcript_evidence_text_unsafe/);

    for (const signature of [
      "public.insert_transcript_audit_event(uuid, jsonb)",
      "public.insert_transcript_evidence_record(uuid, jsonb)"
    ]) {
      expect(sql).toContain(`revoke all on function ${signature} from public;`);
      expect(sql).toContain(
        `revoke all on function ${signature} from anon, authenticated;`
      );
    }

    expect(migration).not.toMatch(
      /grant execute on function public\.insert_transcript_(audit_event|evidence_record)\(uuid, jsonb\) to (anon|authenticated)/i
    );
    expect(migration).not.toMatch(
      /grant\s+(select|insert|update|delete|all)[\s\S]*?on table public\.transcript_(audit_events|evidence_records) to (anon|authenticated)/i
    );
    expect(migration).not.toMatch(
      /service_role|service-role|NEXT_PUBLIC|chat-config/i
    );
  });

  it("keeps the audit insert adapter server-only, injected, and disabled by default", () => {
    const auditSource = readTrackedProductionSources(["website/lib/chat/audit"]);

    expect(auditSource).toContain("TranscriptAuditRpcExecutor");
    expect(auditSource).toContain("createRpcTranscriptAuditAdapter");
    expect(auditSource).toContain("disabledTranscriptAudit");
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

  it("keeps /api/chat and runtime transcript audit/evidence paths unwired", () => {
    const routeSource = readRepoFile("website/app/api/chat/route.ts");
    const runtimeSource = readTrackedProductionSources(
      ["website/app", "website/components", "website/lib/chat"],
      ["website/lib/chat/audit"]
    );

    expect(routeSource).not.toMatch(
      /TranscriptAudit|recordTranscriptAuditEvent|recordTranscriptEvidenceRecord|createRpcTranscriptAuditAdapter|insertTranscriptAuditEvent|insertTranscriptEvidenceRecord/i
    );
    expect(runtimeSource).not.toContain("TranscriptAudit");
    expect(runtimeSource).not.toContain("createRpcTranscriptAuditAdapter");
    expect(runtimeSource).not.toContain("insertTranscriptAuditEvent");
    expect(runtimeSource).not.toContain("insertTranscriptEvidenceRecord");
    expect(readTrackedFiles(["website/app/api/transcript-audit"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcript-evidence"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/admin/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/admin/transcripts"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", "website/vercel.json"])).toEqual(
      []
    );
  });
});
