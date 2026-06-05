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
    .map((filePath) => readRepoFile(filePath))
    .join("\n");
}

describe("Phase 2E-G transcript audit/evidence governance", () => {
  it("records Phase 2E-H as current and Phase 2E-G PR #105 as completed", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
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

  it("documents the future audit/evidence model, safe fields, and forbidden fields", () => {
    const governance = normalizeWhitespace(
      readRepoFile("docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md")
    );
    const safety = normalizeWhitespace(readRepoFile("docs/SAFETY-BOUNDARIES.md"));
    const auditEvents = [
      "Transcript persistence attempt",
      "Transcript access/read",
      "Transcript export request",
      "Transcript deletion request",
      "Retention expiry processing",
      "Retention cleanup failure",
      "Admin override",
      "Lifecycle disable/rollback",
      "Operator approval",
      "Evidence capture"
    ];
    const approvedFields = [
      "`event_type`",
      "`workspace_id`",
      "`conversation_id` where approved",
      "`quote_request_id` where approved",
      "`actor_type`",
      "`actor_admin_user_id` where approved",
      "`request_id`",
      "`approval_reference`",
      "`reason_code`",
      "`result_status`",
      "`affected_record_count`",
      "`created_at`",
      "Minimal redacted metadata"
    ];
    const forbiddenFields = [
      "Full transcript content",
      "Raw provider payloads",
      "n8n workflow payloads",
      "Webhook URLs",
      "Raw headers",
      "Cookies",
      "Tokens",
      "API keys",
      "Private keys",
      "Secrets",
      "Service-role material",
      "Customer-visible internal notes"
    ];

    expect(governance).toContain(
      "Phase 2E-G is governance/readiness and static-guard coverage only"
    );
    expect(safety).toContain(
      "Phase 2E-G approves only transcript audit/evidence model and operator runbook readiness"
    );

    for (const eventName of auditEvents) {
      expect(governance, eventName).toContain(eventName);
    }

    for (const field of approvedFields) {
      expect(governance, field).toContain(field);
    }

    for (const field of forbiddenFields) {
      expect(governance, field).toContain(field);
      expect(safety, field).toContain(field);
    }
  });

  it("documents future operator runbook and evidence template readiness", () => {
    const governance = normalizeWhitespace(
      readRepoFile("docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md")
    );
    const runbookRequirements = [
      "Owner approval capture",
      "Dry-run/local proof before production action",
      "Local SQL/RLS proof",
      "Static guard proof",
      "Evidence template completion",
      "Failure triage",
      "Rollback/disable steps",
      "Audit review",
      "Data minimisation review",
      "Redaction review",
      "Post-action verification",
      "\"Do not proceed\" stop conditions"
    ];
    const evidencePlaceholders = [
      "Action type",
      "Approved by",
      "Approval reference",
      "Environment",
      "Commit SHA",
      "Local validation commands",
      "Dry-run result",
      "Affected record count",
      "Rollback/disable plan",
      "Operator notes",
      "Follow-up checklist",
      "no secrets or transcript content are copied into evidence"
    ];

    for (const requirement of runbookRequirements) {
      expect(governance, requirement).toContain(requirement);
    }

    for (const placeholder of evidencePlaceholders) {
      expect(governance, placeholder).toContain(placeholder);
    }
  });

  it("keeps audit/evidence approval gates unchecked for future work", () => {
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );
    const uncheckedGates = [
      "Audit event model owner approval",
      "Evidence template owner approval",
      "Operator runbook owner approval",
      "Redaction policy approval",
      "Stop-condition approval",
      "Rollback/disable approval",
      "Local SQL/RLS proof",
      "Static guard proof",
      "No full transcript content in audit/evidence",
      "No secrets/provider payloads in audit/evidence"
    ];

    for (const gate of uncheckedGates) {
      expect(checklist, gate).toContain(`- [ ] ${gate}.`);
    }
  });

  it("keeps audit/evidence runtime writers, lifecycle routes, jobs, and deployment surfaces absent", () => {
    const routeSource = readRepoFile("website/app/api/chat/route.ts");
    const persistenceSource = readTrackedProductionSources([
      "website/lib/chat/persistence"
    ]);
    const auditContractSource = readTrackedProductionSources([
      "website/lib/chat/audit"
    ]);
    const browserSurfaceSource = readTrackedProductionSources([
      "website/app",
      "website/components"
    ]);
    const chatRuntimeSource = readTrackedProductionSources([
      "website/app/api/chat",
      "website/lib/chat"
    ], [
      "website/lib/chat/audit"
    ]);
    const auditContractFiles = readTrackedFiles(["website/lib/chat/audit"]);

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
    expect(auditContractSource.match(/import "server-only";/g)).toHaveLength(5);
    expect(auditContractSource).not.toContain("@supabase/");
    expect(auditContractSource).not.toContain("createClient(");
    expect(auditContractSource).not.toContain("createServerSupabaseClient");
    expect(auditContractSource).not.toContain("process.env");
    expect(auditContractSource).not.toContain("headers()");
    expect(auditContractSource).not.toContain("cookies()");
    expect(auditContractSource).not.toContain(".insert(");
    expect(auditContractSource).not.toContain(".upsert(");
    expect(auditContractSource).not.toContain(".select(");
    expect(auditContractSource).not.toContain(".rpc(");
    expect(auditContractSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(auditContractSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(auditContractSource).not.toContain("chat-config");
    expect(browserSurfaceSource).not.toContain("@supabase/");
    expect(browserSurfaceSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(browserSurfaceSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(chatRuntimeSource).not.toMatch(
      /writeTranscriptAudit|recordTranscriptAudit|persistTranscriptAudit|captureTranscriptEvidence|auditTranscriptLifecycle|createTranscriptEvidence/i
    );
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
    expect(readTrackedFiles(["website/app/api/transcript-audit"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcript-evidence"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/api/cron"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/jobs"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/chat/retention"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/chat/lifecycle"])).toEqual([]);
    expect(auditContractFiles).toEqual([
      "website/lib/chat/audit/contract.ts",
      "website/lib/chat/audit/disabled-transcript-audit.ts",
      "website/lib/chat/audit/index.ts",
      "website/lib/chat/audit/rpc-transcript-audit-adapter.test.ts",
      "website/lib/chat/audit/rpc-transcript-audit-adapter.ts",
      "website/lib/chat/audit/transcript-audit-contract.test.ts",
      "website/lib/chat/audit/types.ts"
    ]);
    expect(readTrackedFiles(["website/lib/chat/evidence"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/chat/transcript-audit"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/lib/chat/transcript-evidence"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/admin/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/admin/transcripts"])).toEqual(
      []
    );
    expect(readTrackedFiles(["website/app/api/admin/transcript-audit"])).toEqual(
      []
    );
    expect(
      readTrackedFiles(["website/app/api/admin/transcript-evidence"])
    ).toEqual([]);
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
    expect(readTrackedFiles(["website/app/api/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/rag"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/saas-chatbot"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles([".env", ".env.local", "website/.env"])).toEqual(
      []
    );
    expect(readTrackedFiles(["vercel.json", "website/vercel.json"])).toEqual(
      []
    );
    expect(readTrackedFiles(["docs/evidence"])).toEqual([]);
    expect(readTrackedFiles(["docs/production-evidence"])).toEqual([]);
    expect(readTrackedFiles(["docs/transcript-evidence"])).toEqual([]);
    expect(readTrackedFiles(["docs/chat-transcript-evidence"])).toEqual([]);
    expect(readTrackedFiles(["supabase/seeds"])).toEqual([
      "supabase/seeds/README.md",
      "supabase/seeds/sample_catalogue.sql"
    ]);
  });
});
