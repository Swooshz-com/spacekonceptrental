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

describe("Phase 2E-F transcript lifecycle governance", () => {
  it("records Phase 2E-F as current and Phase 2E-E PR #103 as completed", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

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
    expect(status).toContain(
      "PR #103 merged the Phase 2E-D hotfix and Phase 2E-E transcript persistence activation governance"
    );
    expect(readiness).toContain("Current Phase 2E-F status");
    expect(checklist).toContain(
      "Phase 2E-F Lifecycle Governance And Retention/Deletion/Export Readiness"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2E-F adds transcript lifecycle governance and retention/deletion/export readiness only."
    );
    expect(decisionLog).toContain(
      "PR #103 merged at `72a85eedfcd30da26e716f95973785cb1408760b`"
    );
  });

  it("documents lifecycle requirements without approving runtime implementation", () => {
    const governance = normalizeWhitespace(
      readRepoFile("docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md")
    );
    const safety = normalizeWhitespace(readRepoFile("docs/SAFETY-BOUNDARIES.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const lifecycleRequirements = [
      "Transcript retention policy",
      "Retention expiry handling",
      "Manual deletion requests",
      "Export requests",
      "Admin-only transcript access review",
      "Audit/evidence requirements",
      "Operator runbook requirements",
      "Failure/rollback/disable controls",
      "Data minimisation and redaction requirements",
      "Customer identity/account linking risks",
      "Public quote tracking/public transcript access risks"
    ];

    for (const requirement of lifecycleRequirements) {
      expect(governance, requirement).toContain(requirement);
      expect(safety, requirement).toContain(requirement);
    }

    expect(governance).toContain(
      "Phase 2E-F is governance/readiness and static-guard coverage only"
    );
    expect(roadmap).toContain(
      "Phase 2E-F adds transcript lifecycle governance and retention/deletion/export readiness only"
    );
    expect(governance).toContain("does not implement runtime transcript deletion/export");
    expect(governance).toContain("does not implement retention cleanup jobs");
    expect(governance).toContain("does not wire transcript writes or reads into `/api/chat`");
  });

  it("keeps lifecycle approval gates unchecked for future work", () => {
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );
    const uncheckedGates = [
      "Retention/deletion/export owner approval",
      "Data classification review",
      "Admin access approval",
      "Audit event model approval",
      "Evidence template approval",
      "Failure rollback/disable plan approval",
      "Local SQL/RLS proof before any runtime implementation",
      "Static guard proof before any runtime implementation",
      "No customer-visible internal notes",
      "No public transcript visibility"
    ];

    for (const gate of uncheckedGates) {
      expect(checklist, gate).toContain(`- [ ] ${gate}.`);
    }
  });

  it("documents explicit blocked runtime and external-service boundaries", () => {
    const governance = normalizeWhitespace(
      readRepoFile("docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md")
    );
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const safety = normalizeWhitespace(readRepoFile("docs/SAFETY-BOUNDARIES.md"));
    const blockedBoundaries = [
      "Runtime transcript writes",
      "Runtime transcript reads",
      "Live Supabase RPC executor",
      "Any service-role or privileged DB execution strategy",
      "`/api/chat` transcript write wiring",
      "Transcript deletion/export runtime paths",
      "Retention cleanup jobs",
      "Admin transcript UI",
      "Customer accounts",
      "Public quote tracking or public transcript access",
      "Notifications",
      "CRM integration",
      "n8n/Pinecone runtime changes",
      "SaaS chatbot runtime work",
      "Deployment, Vercel config, Supabase Cloud config, env/secrets, production evidence"
    ];

    for (const boundary of blockedBoundaries) {
      expect(governance, boundary).toContain(boundary);
      expect(status, boundary).toContain(boundary);
      expect(safety, boundary).toContain(boundary);
    }
  });

  it("keeps transcript lifecycle runtime routes, executors, jobs, and browser/service-role paths absent", { timeout: 15000 }, () => {
    const routeSource = readRepoFile("website/app/api/chat/route.ts");
    const persistenceSource = readTrackedProductionSources([
      "website/lib/chat/persistence"
    ]);
    const browserSurfaceSource = readTrackedProductionSources([
      "website/app",
      "website/components"
    ]);
    const chatRuntimeSource = readTrackedProductionSources([
      "website/app/api",
      "website/lib/chat"
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
    expect(chatRuntimeSource).not.toMatch(
      /deleteTranscript|exportTranscript|retentionCleanup|cleanupExpiredTranscripts|transcriptRetentionJob|scheduleTranscript/i
    );

    expect(readTrackedFiles(["website/app/api/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/conversations"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/messages"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcript-export"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcript-delete"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcript-retention"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/api/cron"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/jobs"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/chat/retention"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/chat/lifecycle"])).toEqual([]);
    expect(readTrackedFiles(["website/app/admin/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/admin/transcripts"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/components/admin/transcripts"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/account"])).toEqual([]);
    expect(readTrackedFiles(["website/app/customer"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/api/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/crm"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/crm"])).toEqual([]);
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
