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
    .map((filePath) => ({
      filePath,
      source: readRepoFile(filePath)
    }));
}

describe("Phase 2B-AY admin listing image metadata UI boundary", () => {
  it("records PR #91 as the previous merged snapshot and Phase 2B-AY as the current narrow phase", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2B-AY - admin listing image metadata UI boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AX - admin quote request status update boundary."
    );
    expect(status).toContain("Last merged phase PR: #91");
    expect(status).toContain(
      "Merge commit: `0977f70a85c15cc82350160d6b8d8394b16ba5d9`"
    );
    expect(status).toContain(
      "Previous merged status snapshot: Phase 2B-AX"
    );
    expect(roadmap).toContain(
      "Phase 2B-AY adds only metadata listing image management UI"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AY adds only metadata listing image management controls"
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Listing image metadata create, update, and archive actions request `productImage.write` CSRF proofs."
    );
  });

  it("keeps image metadata controls in the protected shell and reuses existing backend routes", () => {
    const shellSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const panelSource = readRepoFile(
      "website/components/admin/listing-image-metadata-management-panel.tsx"
    );

    expect(shellSource).toContain("ListingImageMetadataManagementPanel");
    expect(shellSource).toContain("dashboard.data.images");
    expect(panelSource).toContain('"use client"');
    expect(panelSource).toContain("productImage.write");
    expect(panelSource).toContain("/api/admin/csrf-proof");
    expect(panelSource).toContain("/api/admin/product-images");
    expect(panelSource).toContain("x-csrf-proof");
    expect(readTrackedFiles(["website/app/api/admin/product-images"])).toEqual([
      "website/app/api/admin/product-images/[imageId]/archive/route.ts",
      "website/app/api/admin/product-images/[imageId]/route.ts",
      "website/app/api/admin/product-images/route.ts"
    ]);
  });

  it("keeps the browser image metadata UI metadata-only with no file or storage runtime", () => {
    const panelSource = readRepoFile(
      "website/components/admin/listing-image-metadata-management-panel.tsx"
    );

    expect(panelSource).not.toContain('type="file"');
    expect(panelSource).not.toContain("multipart/form-data");
    expect(panelSource).not.toContain("@supabase/");
    expect(panelSource).not.toContain("lib/supabase");
    expect(panelSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(panelSource).not.toContain("service-role");
    expect(panelSource).not.toMatch(/createBucket|getPublicUrl|\.storage\b/i);
    expect(panelSource).not.toMatch(/\bupload\s*\(/i);
    expect(panelSource).not.toMatch(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i);
  });

  it("keeps public routes away from admin image metadata write UI and admin write logic", () => {
    const publicSources = readTrackedProductionSources([
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/page.tsx"
    ])
      .map(({ source }) => source)
      .join("\n");

    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
    expect(publicSources).not.toContain("ListingImageMetadataManagementPanel");
    expect(publicSources).not.toContain("/api/admin/product-images");
    expect(publicSources).not.toContain("productImage.write");
    expect(publicSources).not.toContain("admin-product-write-route");
  });
});
