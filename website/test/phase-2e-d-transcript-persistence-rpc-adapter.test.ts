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

describe("Phase 2E-D transcript persistence RPC/adapter boundary", () => {
  it("keeps Phase 2E-D completed while status advances to Phase 2E-F", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2E-F - transcript lifecycle governance and retention/deletion/export readiness."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2E-E - transcript persistence activation governance and executor approval gate."
    );
    expect(status).toContain("Last merged phase PR: #103");
    expect(status).toContain(
      "Merge commit: `72a85eedfcd30da26e716f95973785cb1408760b`"
    );
    expect(normalizeWhitespace(roadmap)).toContain(
      "Phase 2E-D adds the server-only transcript persistence RPC/adapter boundary"
    );
    expect(readiness).toContain("Current Phase 2E-F status");
    expect(decisionLog).toContain(
      "Decision: Phase 2E-D adds only the server-only transcript persistence RPC/adapter boundary"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2E-D hotfixes conflicting clientMessageId reuse and malformed runtime validation"
    );
    expect(checklist).toContain(
      "Phase 2E-D Completed RPC And Adapter Boundary"
    );
    expect(checklist).toContain("Phase 2E-D Hotfix Completed Findings");
  });

  it("adds a local SQL RPC contract without granting browser roles transcript writes", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260604100000_transcript_persistence_rpc_boundary.sql"
    );

    expect(migration).toContain(
      "create or replace function public.persist_transcript_batch"
    );
    expect(migration).toContain(
      "create or replace function public.is_safe_transcript_metadata"
    );
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("on conflict (id) do update");
    expect(migration).toContain("client_message_id");
    expect(migration).toContain("transcript_client_message_id_conflict");
    expect(normalizeWhitespace(migration)).toContain(
      "exact duplicate retries are accepted while conflicting client_message_id reuse is rejected"
    );
    for (const field of [
      "role",
      "message_type",
      "content",
      "provider",
      "request_id",
      "sequence_number",
      "retention_expires_at",
      "metadata"
    ]) {
      expect(migration, field).toContain(`public.messages.${field}`);
      expect(migration, field).toContain(`excluded.${field}`);
    }
    expect(migration).toContain("transcript_metadata_unsafe");
    expect(migration).toContain(
      "revoke all on function public.persist_transcript_batch(uuid, jsonb, jsonb) from public"
    );
    expect(migration).not.toMatch(
      /grant execute on function public\.persist_transcript_batch\(uuid, jsonb, jsonb\) to (anon|authenticated)/i
    );
  });

  it("keeps the RPC adapter server-only, injected, and free of direct Supabase runtime shortcuts", () => {
    const productionFiles = [
      "website/lib/chat/persistence/types.ts",
      "website/lib/chat/persistence/contract.ts",
      "website/lib/chat/persistence/rpc-transcript-persistence-adapter.ts",
      "website/lib/chat/persistence/disabled-chat-persistence.ts",
      "website/lib/chat/persistence/index.ts"
    ];
    const source = productionFiles.map((filePath) => readRepoFile(filePath));
    const joinedSource = source.join("\n");

    expect(productionFiles.every(isProductionSource)).toBe(true);
    expect(source.every((fileSource) => fileSource.includes('import "server-only";'))).toBe(
      true
    );
    expect(joinedSource).toContain("TranscriptPersistenceRpcExecutor");
    expect(joinedSource).toContain("createRpcTranscriptPersistenceAdapter");
    expect(joinedSource).not.toContain("@supabase/");
    expect(joinedSource).not.toContain("createClient(");
    expect(joinedSource).not.toContain("createServerSupabaseClient");
    expect(joinedSource).not.toContain("process.env");
    expect(joinedSource).not.toContain("headers()");
    expect(joinedSource).not.toContain("cookies()");
    expect(joinedSource).not.toContain(".insert(");
    expect(joinedSource).not.toContain(".upsert(");
    expect(joinedSource).not.toContain(".select(");
    expect(joinedSource).not.toContain(".rpc(");
    expect(joinedSource).not.toContain('from("conversations")');
    expect(joinedSource).not.toContain('from("messages")');
    expect(joinedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(joinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(joinedSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(joinedSource).not.toContain("PINECONE");
    expect(joinedSource).not.toContain("chat-config");
  });

  it("keeps POST /api/chat and transcript read/runtime surfaces unwired", () => {
    const routeSource = readRepoFile("website/app/api/chat/route.ts");
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);

    expect(routeSource).not.toMatch(
      /persistTranscriptCommand|createRpcTranscriptPersistenceAdapter|createTranscriptPersistenceCommand|getChatPersistence|TranscriptPersistence/i
    );
    expect(readTrackedFiles(["website/app/api/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/conversations"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/messages"])).toEqual([]);
    expect(readTrackedFiles(["website/app/admin/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/admin/transcripts"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/components/admin/transcripts"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/account"])).toEqual([]);
    expect(readTrackedFiles(["website/app/customer"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual(
      []
    );
    expect(readTrackedFiles(["vercel.json", "website/vercel.json"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);

    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("chat-config");
    expect(productionSource).not.toMatch(
      /customer account|quote status tracking|admin transcript|crm integration|crm sync job|hubspot api|api\.hubapi|notification/i
    );
  });
});
