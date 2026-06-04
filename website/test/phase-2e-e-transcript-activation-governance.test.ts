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

describe("Phase 2E-E transcript activation governance", () => {
  it("records Phase 2E-E as current governance work on the PR #102 baseline", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const normalizedStatus = normalizeWhitespace(status);
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

    expect(status).toContain(
      "Current phase: Phase 2E-E - transcript persistence activation governance and executor approval gate."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2E-D - server-only transcript persistence RPC/adapter boundary."
    );
    expect(status).toContain("Last merged phase PR: #102");
    expect(status).toContain(
      "Merge commit: `b34cc02a67e73d497e9b90fd904786da3bbe77d3`"
    );
    expect(normalizedStatus).toContain(
      "PR #102 merged the Phase 2E-D server-only transcript persistence RPC/adapter boundary"
    );
    expect(readiness).toContain("Current Phase 2E-E status");
    expect(checklist).toContain(
      "Phase 2E-E Activation Governance And Executor Approval Gate"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2E-D hotfixes conflicting clientMessageId reuse and malformed runtime validation"
    );
    expect(decisionLog).toContain(
      "PR #102 merged at `b34cc02a67e73d497e9b90fd904786da3bbe77d3`"
    );
  });

  it("documents the Phase 2E-D hotfix findings and idempotency fingerprint", () => {
    const governance = normalizeWhitespace(
      readRepoFile("docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md")
    );
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );
    const migration = readRepoFile(
      "supabase/migrations/20260604100000_transcript_persistence_rpc_boundary.sql"
    );

    expect(governance).toContain(
      "conflicting `clientMessageId` reuse now rejects with `transcript_client_message_id_conflict`"
    );
    expect(governance).toContain(
      "The RPC idempotency fingerprint deliberately excludes `id`"
    );
    expect(governance).toContain(
      "transcript command validation is total and non-throwing for malformed JSON-like runtime input"
    );
    expect(checklist).toContain("Phase 2E-D Hotfix Completed Findings");
    expect(checklist).toContain(
      "Conflicting `clientMessageId` reuse is rejected instead of silently dropping changed messages."
    );
    expect(migration).toContain("transcript_client_message_id_conflict");
  });

  it("documents explicit approval gates before transcript activation work", () => {
    const governance = normalizeWhitespace(
      readRepoFile("docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md")
    );
    const safety = normalizeWhitespace(readRepoFile("docs/SAFETY-BOUNDARIES.md"));
    const checklist = normalizeWhitespace(
      readRepoFile("docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md")
    );
    const approvalGates = [
      "Live Supabase RPC executor",
      "Any service-role or privileged DB execution strategy",
      "`/api/chat` transcript write wiring",
      "Transcript read paths",
      "Admin transcript UI",
      "Transcript deletion/export paths",
      "Retention cleanup jobs",
      "Customer identity/account linking",
      "Public quote tracking or public transcript access",
      "Notifications or CRM integration"
    ];

    for (const gate of approvalGates) {
      expect(governance, gate).toContain(gate);
      expect(safety, gate).toContain(gate);
      expect(checklist, gate).toContain(gate);
    }

    expect(governance).toContain(
      "No live executor exists yet"
    );
    expect(governance).toContain(
      "A future live executor must have explicit owner approval"
    );
    expect(governance).toContain(
      "must not expose service-role material to browser/client code"
    );
    expect(governance).toContain("failure redaction");
    expect(governance).toContain("idempotency proof");
    expect(governance).toContain("audit/evidence requirements");
    expect(governance).toContain("rollback/disable controls");
    expect(governance).toContain(
      "must be tested before `/api/chat` can use it"
    );
  });

  it("keeps transcript runtime wiring, executor, reads, UI, and service-role paths absent", () => {
    const routeSource = readRepoFile("website/app/api/chat/route.ts");
    const persistenceSource = readTrackedProductionSources([
      "website/lib/chat/persistence"
    ]);
    const browserSurfaceSource = readTrackedProductionSources([
      "website/app",
      "website/components"
    ]);

    expect(routeSource).not.toMatch(
      /persistTranscriptCommand|createRpcTranscriptPersistenceAdapter|createTranscriptPersistenceCommand|getChatPersistence|TranscriptPersistence/i
    );
    expect(persistenceSource).not.toContain("@supabase/");
    expect(persistenceSource).not.toContain("createClient(");
    expect(persistenceSource).not.toContain("createServerSupabaseClient");
    expect(persistenceSource).not.toContain("process.env");
    expect(persistenceSource).not.toContain(".rpc(");
    expect(persistenceSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(persistenceSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(persistenceSource).not.toContain("chat-config");
    expect(browserSurfaceSource).not.toContain("@supabase/");
    expect(browserSurfaceSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(browserSurfaceSource).not.toContain("SUPABASE_SERVICE_ROLE");

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
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles([".env", ".env.local", "website/.env"])).toEqual(
      []
    );
    expect(readTrackedFiles(["vercel.json", "website/vercel.json"])).toEqual(
      []
    );
    expect(readTrackedFiles(["supabase/seeds"])).toEqual([
      "supabase/seeds/README.md",
      "supabase/seeds/sample_catalogue.sql"
    ]);
  });
});
