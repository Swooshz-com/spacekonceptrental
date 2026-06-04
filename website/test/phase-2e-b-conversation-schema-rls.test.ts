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

describe("Phase 2E-B conversation/message schema and RLS foundation", () => {
  it("records Phase 2E-B as current and Phase 2E-A / PR #99 as completed", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2E-B - conversation/message schema and RLS foundation."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2E-A - privacy, retention, identity, and conversation/message governance planning."
    );
    expect(status).toContain("Last merged phase PR: #99");
    expect(status).toContain(
      "Merge commit: `8fc982616e119cce9484ef5feb1f11dc4705c17e`"
    );
    expect(status).toContain(
      "Previous merged status snapshot: Phase 2E-A"
    );
    expect(roadmap).toContain(
      "Phase 2E-B adds the conversation/message schema and RLS foundation only"
    );
    expect(readiness).toContain("Current Phase 2E-B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2E-B adds only the conversation/message schema and RLS foundation"
    );
    expect(checklist).toContain(
      "Phase 2E-B Completed Schema/RLS Foundation"
    );
  });

  it("adds the reviewed migration for conversation/message schema constraints and fail-closed RLS", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260604090000_conversation_message_schema_rls_foundation.sql"
    );

    expect(migration).toContain("alter table public.conversations");
    expect(migration).toContain("metadata jsonb not null default '{}'::jsonb");
    expect(migration).toContain("retention_expires_at timestamptz");
    expect(migration).toContain("deleted_at timestamptz");
    expect(migration).toContain("last_message_at timestamptz");
    expect(migration).toContain(
      "conversations_client_session_hash_format_check"
    );
    expect(migration).toContain("conversations_metadata_safe_keys_check");
    expect(migration).toContain("alter table public.messages");
    expect(migration).toContain("message_type text not null default 'chat'");
    expect(migration).toContain("sequence_number integer");
    expect(migration).toContain("messages_message_type_check");
    expect(migration).toContain("messages_role_type_check");
    expect(migration).toContain("messages_content_length_check");
    expect(migration).toContain("messages_metadata_safe_keys_check");
    expect(migration).toContain(
      "alter policy conversations_member_read"
    );
    expect(migration).toContain("using (false)");
    expect(migration).toContain("alter policy messages_member_read");

    for (const tableName of ["conversations", "messages"]) {
      for (const action of ["insert", "update", "delete"]) {
        expect(migration).toContain(
          `create policy ${tableName}_no_direct_${action}`
        );
      }

      expect(migration).not.toMatch(
        new RegExp(
          `grant\\s+(select|insert|update|delete|all)[\\s\\S]*on public\\.${tableName} to (anon|authenticated)`,
          "i"
        )
      );
    }

    expect(migration).not.toMatch(
      /n8n|pinecone|webhook-test|raw headers|trace dump|token value/i
    );
  });

  it("keeps transcript persistence runtime writes and reads unwired", () => {
    const chatRuntimeSource = readTrackedProductionSources([
      "website/app/api/chat",
      "website/components/ChatWidget.tsx",
      "website/lib/chat"
    ]);

    expect(chatRuntimeSource).not.toMatch(
      /from\(["'](?:conversations|messages)["']\)\s*\.\s*(?:insert|upsert|update|select|delete)\s*\(/m
    );
    expect(chatRuntimeSource).not.toMatch(
      /rpc\(["'][^"']*(?:conversation|message|transcript)[^"']*["']/i
    );
    expect(readTrackedFiles(["website/app/api/transcripts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/conversations"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/messages"])).toEqual([]);
  });

  it("keeps admin transcript UI, customer accounts, public quote tracking, deployment, browser Supabase, and chat-config access blocked", () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);

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
      /customer account|quote status tracking|transcript export|admin transcript|crm|notification/i
    );
  });

  it("keeps docs explicit that Phase 2E-B is schema/RLS-only", () => {
    const docs = [
      "docs/PHASE-STATUS.md",
      "docs/PHASE-ROADMAP.md",
      "docs/PHASE-2-READINESS-PLAN.md",
      "docs/CONVERSATION-PRIVACY-RETENTION-GOVERNANCE.md",
      "docs/SAFETY-BOUNDARIES.md",
      "docs/checklists/PHASE-2E-CONVERSATION-GOVERNANCE.md"
    ]
      .map(readRepoFile)
      .join("\n");

    for (const requiredBoundary of [
      "Runtime transcript writes remain blocked",
      "Runtime transcript reads remain blocked",
      "Admin transcript UI remains blocked",
      "Customer accounts remain blocked",
      "Public quote tracking remains blocked",
      "Deployment remains blocked",
      "Browser Supabase remains forbidden",
      "Service-role runtime paths remain forbidden",
      "`website/chat-config.js` access remains forbidden"
    ]) {
      expect(docs).toContain(requiredBoundary);
    }
  });
});
