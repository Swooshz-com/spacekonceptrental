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

describe("Phase 2C-C admin quote operations and enquiry workflow closeout", () => {
  it("records PR #94 as the previous merged snapshot and Phase 2C-C as the current admin quote phase", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2C-C - admin quote operations and enquiry workflow closeout."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2C-B - public catalogue polish and enquiry handoff."
    );
    expect(status).toContain("Last merged phase PR: #94");
    expect(status).toContain(
      "Merge commit: `33067c3b3dd86847885db7c57c81c8e17962b043`"
    );
    expect(status).toContain(
      "Previous merged status snapshot: Phase 2C-B"
    );
    expect(roadmap).toContain(
      "Phase 2C-C adds admin quote operations and enquiry workflow closeout"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2C-C adds internal admin quote follow-up activity"
    );
    expect(safety).toContain(
      "Phase 2C-C approves only internal admin quote/enquiry follow-up"
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Protected admin quote inbox can save bounded internal follow-up notes with status changes."
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Internal quote activity is not exposed on public quote pages or public quote APIs."
    );
  });

  it("keeps quote workflow writes server-only, CSRF protected, and owner/admin scoped", () => {
    const routeSource = readRepoFile(
      "website/lib/quote/admin-write/admin-quote-request-status-route.ts"
    );
    const writeSource = readRepoFile(
      "website/lib/quote/admin-write/admin-quote-request-status-write.ts"
    );
    const readSource = readRepoFile(
      "website/lib/quote/admin-read/admin-quote-request-dashboard-read.ts"
    );
    const migration = readRepoFile(
      "supabase/migrations/20260603140000_quote_request_activity.sql"
    );

    expect(routeSource).toContain('import "server-only";');
    expect(routeSource).toContain("quote.write");
    expect(routeSource).toContain("hasOnlyKeys");
    expect(routeSource).toContain("status: payload.status");
    expect(routeSource).toContain("csrfVerifier");
    expect(routeSource).toContain("resolveServerAdminRuntimeRouteGateAdapter");
    expect(writeSource).toContain('import "server-only";');
    expect(writeSource).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(writeSource).toContain("execute_admin_quote_workflow");
    expect(writeSource).toContain("p_internal_note");
    expect(readSource).toContain('import "server-only";');
    expect(readSource).toContain("quote_request_activity");
    expect(migration).toContain("create table if not exists public.quote_request_activity");
    expect(migration).toContain("status_change");
    expect(migration).toContain("internal_note");
    expect(migration).toContain("public.is_workspace_quote_manager");
    expect(migration).toContain("public.current_quote_admin_user_id");
    expect(migration).toContain("quote_requests_quote_admin_update");
    expect(migration).toContain("quote_request_activity_quote_admin_select");
    expect(migration).toContain("quote_request_activity_quote_admin_insert");
    expect(migration).toMatch(
      /grant update \(\s*status,\s*updated_at\s*\) on public\.quote_requests to authenticated/i
    );
    expect(migration).not.toMatch(/to anon/i);
    expect(migration).not.toContain("service_role");
  });

  it("keeps the public quote flow free of internal activity and public status tracking", () => {
    const publicQuoteSource = readTrackedProductionSources([
      "website/app/quote",
      "website/app/api/quote",
      "website/components/QuoteRequestForm.tsx"
    ]);

    expect(publicQuoteSource).not.toContain("quote_request_activity");
    expect(publicQuoteSource).not.toContain("internal_note");
    expect(publicQuoteSource).not.toContain("internalNote");
    expect(publicQuoteSource).not.toMatch(/reviewing|quoted|closed|archived/);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/[quoteRequestId]"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-quote-status"])).toEqual([]);
  });

  it("does not introduce ecommerce, browser Supabase, service-role, public upload, notification, CRM, n8n, Pinecone, or chat-config paths", () => {
    const adminQuoteSource = readTrackedProductionSources([
      "website/app/api/admin/quote-requests",
      "website/lib/quote/admin-read",
      "website/lib/quote/admin-write"
    ]);

    expect(adminQuoteSource).not.toMatch(
      /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering|book now|confirmed booking/i
    );
    expect(adminQuoteSource).not.toMatch(/notification|hubspot api|api\.hubapi|crm sync job|crm integration/i);
    expect(adminQuoteSource).not.toContain("@pinecone-database");
    expect(adminQuoteSource).not.toContain("PINECONE_API_KEY");
    expect(adminQuoteSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(adminQuoteSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(adminQuoteSource).not.toContain("service-role");
    expect(adminQuoteSource).not.toContain("chat-config");
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-upload"])).toEqual([]);
  });
});
