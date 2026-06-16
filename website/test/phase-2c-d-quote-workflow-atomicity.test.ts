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

describe("Phase 2C-D quote workflow atomicity and admin operations hardening", () => {
  it("records PR #95 as the previous merged snapshot and Phase 2C-D as the current atomicity phase", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2C-D - quote workflow atomicity and admin operations hardening."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2C-C - admin quote operations and enquiry workflow closeout."
    );
    expect(status).toContain("Last merged phase PR: #95");
    expect(status).toContain(
      "Merge commit: `ab59adb8bf3c328b71ed91cc7a8141df9a43948e`"
    );
    expect(status).toContain(
      "Previous merged status snapshot: Phase 2C-C"
    );
    expect(roadmap).toContain(
      "Phase 2C-D adds quote workflow atomicity and admin operations hardening"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2C-D replaces the admin quote status/activity multi-call write"
    );
    expect(safety).toContain(
      "Phase 2C-D approves only atomic hardening of the existing internal admin quote"
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Admin quote status and internal activity writes use one atomic DB-side RPC boundary."
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Direct authenticated quote status update and quote activity insert grants are revoked or narrowed."
    );
  });

  it("adds a narrow atomic quote workflow RPC and removes direct write grants", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260603153000_quote_workflow_atomicity.sql"
    );

    expect(migration).toContain(
      "create or replace function public.execute_admin_quote_workflow"
    );
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("public.current_quote_admin_user_id");
    expect(migration).toContain("for update");
    expect(migration).toContain("update public.quote_requests");
    expect(migration).toContain("insert into public.quote_request_activity");
    expect(migration).toContain("char_length(v_note) > 1200");
    expect(migration).toContain(
      "grant execute on function public.execute_admin_quote_workflow(uuid, uuid, text, text) to authenticated"
    );
    expect(migration).toMatch(
      /revoke update \(\r?\n  status,\r?\n  updated_at\r?\n\) on public\.quote_requests from authenticated/
    );
    expect(migration).toContain(
      "revoke insert on public.quote_request_activity from authenticated"
    );
    expect(migration).toContain(
      "alter policy quote_requests_quote_admin_update"
    );
    expect(migration).toContain(
      "alter policy quote_request_activity_quote_admin_insert"
    );
    expect(migration).not.toMatch(/to anon/i);
    expect(migration).not.toContain("service_role");
  });

  it("uses the atomic RPC from the server-only persistence path without direct table writes", () => {
    const writeSource = readRepoFile(
      "website/lib/quote/admin-write/admin-quote-request-status-write.ts"
    );
    const routeSource = readRepoFile(
      "website/lib/quote/admin-write/admin-quote-request-status-route.ts"
    );

    expect(writeSource).toContain('import "server-only";');
    expect(writeSource).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(writeSource).toContain('rpc("execute_admin_quote_workflow"');
    expect(writeSource).toContain("p_internal_note");
    expect(writeSource).not.toContain('from("quote_requests")');
    expect(writeSource).not.toContain('from("quote_request_activity")');
    expect(writeSource).not.toContain(".update(");
    expect(writeSource).not.toContain(".insert(");
    expect(routeSource).toContain("quote.write");
    expect(routeSource).toContain("csrfVerifier");
    expect(routeSource).toContain("hasOnlyKeys");
    expect(routeSource).toContain("status: payload.status");
  });

  it("keeps public quote and admin hardening free of ecommerce, integrations, browser Supabase, service-role, and chat-config paths", () => {
    const productionSource = readTrackedProductionSources([
      "website/app/api/admin/quote-requests",
      "website/app/api/quote",
      "website/app/quote",
      "website/components/QuoteRequestForm.tsx",
      "website/components/admin/quote-request-inbox-panel.tsx",
      "website/lib/quote"
    ]);

    expect(productionSource).not.toMatch(
      /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering|book now|confirmed booking/i
    );
    expect(productionSource).not.toMatch(/notification|hubspot api|api\.hubapi|crm sync job|crm integration/i);
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("service-role");
    expect(productionSource).not.toContain("chat-config");
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-upload"])).toEqual([]);
  });
});
