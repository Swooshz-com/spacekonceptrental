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

describe("Phase 2B-AQ furniture listing catalogue direction pivot", () => {
  it("records the current direction as furniture listings and enquiries, not ecommerce", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const context = readRepoFile("docs/PROJECT-CONTEXT.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

    expect(status).toContain(
      "Current phase: Phase 2B-AQ - furniture listing catalogue direction pivot."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AP - admin category management UI boundary."
    );
    expect(status).toContain("Last merged phase PR: #83");
    expect(status).toContain(
      "Merge commit: `110888f684f55fa55dc03bc4f26f71500e5d17ab`"
    );
    expect(status).toContain("Last merged phase PR: #83");
    expect(status).not.toContain(
      "Merge commit: `faff042ac1e9e0b0d2cc6b4740fac0e237141e21`"
    );
    for (const source of [status, context, roadmap, safety, decisionLog]) {
      expect(source).toContain("furniture");
      expect(source).toContain("listing");
      expect(source).toMatch(/enquiry|quote request/i);
      expect(source).toMatch(/cart|checkout|payment|order/i);
    }
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AQ pivots the current product direction to furniture/event-rental listings plus customer enquiries."
    );
  });

  it("keeps technical product internals explicitly deferred instead of renaming tables or routes", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");

    expect(status).toContain(
      "Internal database/API names such as `products`, `categories`, and `product_images` remain unchanged"
    );
    expect(decisionLog).toContain(
      "Renaming those database/API concepts is explicitly deferred"
    );
    const listingLibFiles = readTrackedFiles(["website/lib/listings"]);

    expect(readTrackedFiles(["website/app/api/listings"])).toEqual([]);
    expect(
      listingLibFiles.filter(
        (filePath) => !filePath.startsWith("website/lib/listings/admin/")
      )
    ).toEqual([]);
    expect(productionSource).not.toContain("from(\"listings\")");
    expect(productionSource).not.toContain("/api/admin/listings");
  });

  it("updates safe visible copy without adding ecommerce or storage/runtime drift", () => {
    const adminShell = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const categoryPanel = readRepoFile(
      "website/components/admin/category-management-panel.tsx"
    );
    const cataloguePage = readRepoFile("website/app/catalogue/page.tsx");
    const detailPage = readRepoFile("website/app/catalogue/[slug]/page.tsx");
    const eventPage = readRepoFile("website/app/events/page.tsx");
    const combinedVisibleSource = [
      adminShell,
      categoryPanel,
      cataloguePage,
      detailPage,
      eventPage
    ].join("\n");

    expect(adminShell).toContain("Furniture listings");
    expect(adminShell).toContain("Listing image metadata summary");
    expect(categoryPanel).toContain(
      "Furniture listing edits use their own protected"
    );
    expect(categoryPanel).toContain("file handling stays out of scope.");
    expect(cataloguePage).toContain("View rental listing");
    expect(detailPage).toContain("Furniture listing");
    expect(detailPage).toContain("Request a quote");
    expect(eventPage).toContain("Event rentals");
    expect(eventPage).toContain("furniture rentals");
    expect(eventPage).toContain("styled setups");
    expect(eventPage).toContain("Start a rental enquiry");
    expect(eventPage).not.toMatch(/shell|mvp/i);
    expect(combinedVisibleSource).not.toMatch(/cart|checkout|payment|order fulfilment/i);
    expect(combinedVisibleSource).not.toContain("@supabase/");
  });
});
