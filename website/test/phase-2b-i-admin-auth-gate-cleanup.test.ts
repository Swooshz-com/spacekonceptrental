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

function expectUnchecked(markdown: string, item: string) {
  expect(markdown).toContain(`- [ ] ${item}`);
}

function expectChecked(markdown: string, item: string) {
  expect(markdown).toContain(`- [x] ${item}`);
}

describe("Phase 2B-I admin auth gate cleanup", () => {
  it("records the current phase and latest completed Phase 2B-S base state", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

    expect(status).toContain(
      "Latest completed phase: Phase 2B-Y - server-only admin runtime route gate adapter boundary."
    );
    expect(status).toContain("Last merged phase PR: #65");
    expect(status).toContain(
      "Merge commit: `0dbf2b4ff739084a73ffbe4adf11cc38a7592dff`"
    );
    expect(roadmap).toContain(
      "Phase 2B-I cleans admin auth implementation gate wording and refines"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-I cleans stale stacked current-PR wording"
    );
  });

  it("keeps membership design phase history historical instead of current-PR stacked claims", () => {
    const design = readRepoFile("docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md");

    expect(design).toContain("Completed phase history:");
    expect(design).toContain(
      "- Phase 2B-D added server-only adapter contracts and dependency-injected resolver logic only."
    );
    expect(design).toContain(
      "- Phase 2B-E added auth provider/session/security design only."
    );
    expect(design).toContain(
      "- Phase 2B-H strengthened the reviewed server-side auth/membership resolution boundary with fake-adapter tests only."
    );
    expect(design).toContain(
      "Latest completed admin/auth boundary state: Phase 2B-Y server-only"
    );
    expect(design).not.toContain("This PR");
  });

  it("keeps runtime blockers unchecked and runtime paths unwired", () => {
    const adminAuthChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-ADMIN-AUTH.md"
    );
    const authImplementationChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);

    for (const item of [
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
      expectUnchecked(adminAuthChecklist, item);
      expectUnchecked(authImplementationChecklist, item);
    }

    expectUnchecked(
      adminAuthChecklist,
      "Cookie reads outside the Phase 2B-K server-only identity boundary."
    );
    expectChecked(
      authImplementationChecklist,
      "Server-only Supabase Auth identity boundary."
    );
    expectChecked(authImplementationChecklist, "Cookie reads.");
    expectChecked(
      authImplementationChecklist,
      "Server-only Supabase admin profile/membership read boundary."
    );

    expect(readTrackedFiles(["website/app/admin"])).toEqual([]);
    expect(readTrackedFiles(["website/app/login"])).toEqual([]);
    expect(readTrackedFiles(["website/app/logout"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/auth"])).toEqual([]);
    expect(productionSource).not.toContain("next/headers");
    expect(productionSource).not.toContain("cookies()");
    expect(productionSource).not.toContain("headers()");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("chat-config");
  });
});
