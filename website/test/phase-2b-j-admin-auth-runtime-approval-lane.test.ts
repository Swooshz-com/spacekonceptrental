import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const approvedAuthBoundaryPath =
  "website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts";
const approvedRequestMetadataBoundaryPath =
  "website/lib/admin/authorization/server-admin-request-metadata-adapter.ts";
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
    .filter((filePath) => filePath !== approvedAuthBoundaryPath &&
          filePath !== approvedRequestMetadataBoundaryPath)
    .map((filePath) => readRepoFile(filePath))
    .join("\n");
}

function expectChecked(markdown: string, item: string) {
  expect(markdown).toContain(`- [x] ${item}`);
}

function expectUnchecked(markdown: string, item: string) {
  expect(markdown).toContain(`- [ ] ${item}`);
}

describe("Phase 2B-J admin auth runtime approval lane", () => {
  it("records Phase 2B-J status, roadmap, and decision-log approval lane", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

    expect(status).toContain(
      "Current phase: Phase 2B-AH - admin CSRF proof issuer route runtime boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AG - admin CSRF proof signer and nonce runtime dependency boundary."
    );
    expect(status).toContain("Last merged phase PR: #74");
    expect(status).toContain(
      "Merge commit: `bfbcca40ec21b7f278a62a638ccb95a2bcd9c2e7`"
    );
    expect(roadmap).toContain(
      "Phase 2B-J approves the future server-only Supabase Auth runtime lane"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-J selects Supabase Auth as the future admin auth provider"
    );
  });

  it("documents the approved future runtime lane without adding runtime auth", () => {
    const design = readRepoFile("docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md");

    expect(design).toContain("## Phase 2B-J Approved Future Runtime Lane");
    expect(design).toContain(
      "Supabase Auth is officially selected as the future admin auth provider."
    );
    expect(design).toContain(
      "Approved future implementation boundary: first-party server-only routes or server actions may use Supabase Auth server APIs only on the server."
    );
    expect(design).toContain(
      "Session cookies must be server-managed, HttpOnly, Secure in production, SameSite=Lax by default unless a later OAuth flow documents an exception, path-scoped, bounded by reviewed lifetime, rotated or refreshed server-side, and cleared on logout."
    );
    expect(design).toContain(
      "CSRF must be implemented before any state-changing admin route or server action by validating a signed per-session CSRF token or an equivalent framework-supported proof, checking Origin/Host, and failing closed for missing, stale, replayed, or mismatched proof."
    );
    expect(design).toContain(
      "Login and logout routes must be first-party server routes or server actions, use POST for state changes, validate safe same-origin redirects, return generic errors, avoid logging credentials or tokens, and never expose Supabase internals."
    );
    expect(design).toContain(
      "Protected admin pages must resolve identity, active admin profile, and active membership server-side before rendering workspace-scoped admin data."
    );
    expect(design).toContain(
      "Runtime auth is not complete until tests cover anonymous denial, expired session denial, inactive profile denial, missing membership denial, wrong-actor membership denial, cross-workspace denial, viewer write denial, admin allowed access, owner membership-management access, CSRF failure, safe redirect handling, safe auth errors, no browser Supabase, and no service-role runtime path."
    );
  });

  it("marks approval and test-plan gates only while runtime implementation remains unchecked", () => {
    const checklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );

    for (const item of [
      "Supabase Auth provider approved.",
      "Server-only auth boundary approved.",
      "Session cookie strategy approved.",
      "CSRF strategy approved.",
      "Login route design approved.",
      "Logout route design approved.",
      "Protected admin page design approved.",
      "Admin identity to `admin_users.auth_user_id` mapping approved.",
      "Admin profile lookup approved.",
      "Membership lookup approved.",
      "Adapter integration approved.",
      "Anonymous denial tests planned.",
      "Inactive admin profile tests planned.",
      "Missing membership tests planned.",
      "Wrong-actor membership tests planned.",
      "Cross-workspace denial tests planned.",
      "Viewer write denial tests planned.",
      "Admin allowed path tests planned.",
      "Owner membership-management tests planned.",
      "Safe auth error tests planned.",
      "CSRF failure tests planned.",
      "Safe redirect tests planned.",
      "Explicit approval obtained before real auth runtime wiring."
    ]) {
      expectChecked(checklist, item);
    }

    for (const item of [
      "Explicit approval obtained before login/logout routes.",
      "Explicit approval obtained before protected admin pages.",
      "Explicit approval obtained before admin UI.",
      "Explicit approval obtained before product writes.",
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Header reads outside the Phase 2B-V request metadata adapter.",
      "Login/logout routes.",
      "Protected admin pages.",
      "Admin UI.",
      "Product writes.",
      "Category writes.",
      "Product image writes.",
      "Storage.",
      "Service-role runtime paths.",
      "Browser Supabase."
    ]) {
      expectUnchecked(checklist, item);
    }

    expectChecked(checklist, "Server-only Supabase Auth identity boundary.");
    expectChecked(checklist, "Cookie reads.");
    expectChecked(
      checklist,
      "Server-only Supabase admin profile/membership read boundary."
    );
  });

  it("does not add disallowed runtime auth, admin, storage, deployment, n8n, Pinecone, or chat-config paths", { timeout: 15000 }, () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const browserSource = readTrackedFiles([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .filter(
        (filePath) =>
          isProductionSource(filePath) &&
          filePath !== approvedAuthBoundaryPath &&
          filePath !== approvedRequestMetadataBoundaryPath &&
          !filePath.startsWith("website/app/api/") &&
          !filePath.startsWith("website/lib/supabase/")
      )
      .map((filePath) => readRepoFile(filePath))
      .join("\n");

    expect(readTrackedFiles(["website/app/admin"])).toEqual([]);
    expect(readTrackedFiles(["website/app/login"])).toEqual([]);
    expect(readTrackedFiles(["website/app/logout"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/auth"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/login"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/logout"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/products"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/categories"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", ".vercel", "website/vercel.json"])).toEqual([]);

    expect(productionSource).not.toContain("next/headers");
    expect(productionSource).not.toContain("cookies()");
    expect(productionSource).not.toContain("headers()");
    expect(productionSource).not.toContain("@supabase/ssr");
    expect(productionSource).not.toMatch(
      /\.auth\.(?:getUser|getSession|signIn|signOut|setSession|exchangeCodeForSession)/m
    );
    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("chat-config");
    expect(browserSource).not.toContain("@supabase/");

    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });
});
