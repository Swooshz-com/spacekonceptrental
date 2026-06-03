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

describe("Phase 2C-B public catalogue polish and enquiry handoff", () => {
  it("records PR #93 as the previous merged snapshot and Phase 2C-B as the public polish phase", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2C-B - public catalogue polish and enquiry handoff."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2C-A - storage-backed listing media upload and public image rendering."
    );
    expect(status).toContain("Last merged phase PR: #93");
    expect(status).toContain(
      "Merge commit: `88f8b7147bcabb06189f44c300187a4149415c2f`"
    );
    expect(status).toContain(
      "Previous merged status snapshot: Phase 2C-A"
    );
    expect(roadmap).toContain(
      "Phase 2C-B adds public catalogue/detail polish and quote enquiry handoff"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2C-B improves public catalogue/detail presentation"
    );
    expect(safety).toContain(
      "Phase 2C-B approves only public read-only catalogue/detail polish"
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Public catalogue and listing detail pages render uploaded listing images with stable fallbacks."
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Quote enquiry handoff uses optional validated public listing context without changing the quote backend contract."
    );
  });

  it("keeps public catalogue, detail, and quote handoff read-only without ecommerce or upload routes", () => {
    const publicSource = readTrackedProductionSources([
      "website/app/catalogue",
      "website/app/quote",
      "website/components/QuoteRequestForm.tsx",
      "website/lib/catalogue"
    ]);
    const quoteHandoffSource = readRepoFile(
      "website/lib/catalogue/quote-handoff.ts"
    );
    const combinedPublicSource = `${publicSource}\n${quoteHandoffSource}`;

    expect(combinedPublicSource).toContain("publicUrl");
    expect(combinedPublicSource).toContain("listing=");
    expect(combinedPublicSource).not.toMatch(
      /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering|book now|confirmed booking/i
    );
    expect(combinedPublicSource).not.toContain("ListingImageUploadPanel");
    expect(combinedPublicSource).not.toContain("handleAdminProductImageUploadRoute");
    expect(combinedPublicSource).not.toContain("productImage.write");
    expect(combinedPublicSource).not.toContain("@supabase/ssr");
    expect(combinedPublicSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(combinedPublicSource).not.toContain("service-role");
    expect(combinedPublicSource).not.toContain("chat-config");
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/catalogue-images"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
  });
});
