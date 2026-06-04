import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
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

describe("Phase 2E-A conversation privacy and retention governance", () => {
  it("records Phase 2E-A as current and Phase 2D-B / PR #98 as completed", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklistIndex = readRepoFile("docs/checklists/README.md");
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2E-A - privacy, retention, identity, and conversation/message governance planning."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2D-B - post-readiness status, remaining-work map, and evidence guard reconciliation."
    );
    expect(status).toContain("Last merged phase PR: #98");
    expect(status).toContain(
      "Merge commit: `173138e81e612e8effe54803c495c056f2c5bfd3`"
    );
    expect(status).toContain(
      "Previous merged status snapshot: Phase 2D-B"
    );
    expect(roadmap).toContain(
      "Phase 2E-A adds privacy, retention, identity, and conversation/message governance planning"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2E-A documents conversation privacy, retention, identity, and transcript governance"
    );
    expect(checklistIndex).toContain(
      "PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );
    expect(checklist).toContain(
      "Phase 2E-A Conversation Privacy And Retention Governance"
    );
  });

  it("adds a governance document covering privacy, identity, retention, deletion/export, access, and admin boundaries", () => {
    const governance = readRepoFile(
      "docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md"
    );

    for (const requiredText of [
      "Privacy and PII minimisation model",
      "Anonymous visitor identity model",
      "Future authenticated/admin-linked identity considerations",
      "Conversation/message retention rules",
      "Deletion and export expectations",
      "Transcript access rules",
      "Admin visibility boundaries",
      "Future persistence idempotency expectations",
      "Redaction and minimisation guidance",
      "Non-goals and blocked work"
    ]) {
      expect(governance).toContain(requiredText);
    }

    expect(governance).toContain(
      "Anonymous chat must remain unlinkable to a named customer account"
    );
    expect(governance).toContain(
      "Admins may view transcripts only through a future protected admin boundary"
    );
    expect(governance).toContain(
      "Retention timers must be defined before any migration stores transcripts"
    );
  });

  it("keeps conversation/message persistence and runtime expansion explicitly blocked", () => {
    const docs = [
      "docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md",
      "docs/PHASE-STATUS.md",
      "docs/PHASE-ROADMAP.md",
      "docs/PHASE-2-READINESS-PLAN.md",
      "docs/PROJECT-CONTEXT.md",
      "docs/SAFETY-BOUNDARIES.md",
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    ]
      .map(readRepoFile)
      .join("\n");

    const normalizedDocs = docs.toLowerCase();

    for (const forbiddenBoundary of [
      "conversation/message persistence is not implemented",
      "transcript storage is not implemented",
      "admin transcript UI is not implemented",
      "customer accounts are not approved",
      "public quote tracking is not approved",
      "notifications are not approved",
      "CRM integration is not approved",
      "n8n/Pinecone runtime changes are not approved",
      "SaaS chatbot runtime work is not approved",
      "deployment is not approved",
      "browser Supabase remains forbidden",
      "service-role runtime paths remain forbidden",
      "`website/chat-config.js` access remains forbidden"
    ]) {
      expect(normalizedDocs).toContain(forbiddenBoundary.toLowerCase());
    }
  });

  it("does not introduce persistence tables, transcript routes, customer accounts, quote tracking, deployment config, or unsafe runtime code", () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);

    expect(
      readTrackedFiles(["supabase/migrations"]).filter((filePath) =>
        /conversation|message|transcript/i.test(filePath)
      )
    ).toEqual([]);
    expect(readTrackedFiles(["website/app/api/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/conversations"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/messages"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/account"])).toEqual([]);
    expect(readTrackedFiles(["website/app/customer"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", "website/vercel.json"])).toEqual(
      []
    );
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("chat-config");
    expect(productionSource).not.toMatch(
      /conversation transcript|transcript export|customer account|quote status tracking|crm|notification/i
    );
  });

  it("keeps governance docs free of real URLs, secrets, env values, tokens, customer data, and production evidence", () => {
    const docs = [
      "docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md",
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md",
      "docs/PHASE-STATUS.md",
      "docs/PHASE-ROADMAP.md",
      "docs/PHASE-2-READINESS-PLAN.md",
      "docs/PROJECT-CONTEXT.md",
      "docs/SAFETY-BOUNDARIES.md",
      "docs/DECISION-LOG.md"
    ]
      .map(readRepoFile)
      .join("\n");

    expect(docs).not.toMatch(/https?:\/\/[^\s"'`<>]+/i);
    expect(docs).not.toMatch(/\b[A-Z0-9_]+\s*=\s*[^\s]+/);
    expect(docs).not.toMatch(/\bsk-[A-Za-z0-9_-]{20,}\b/);
    expect(docs).not.toMatch(
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
    );
    expect(docs).not.toContain(".supabase.co");
    expect(docs).not.toContain(".vercel.app");
    expect(docs).not.toMatch(/production evidence|customer data captured/i);
  });
});
