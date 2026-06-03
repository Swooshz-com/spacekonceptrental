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

describe("Phase 2C-A storage-backed listing media upload and public rendering", () => {
  it("records PR #92 as the previous merged snapshot and Phase 2C-A as the current storage media phase", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2C-A - storage-backed listing media upload and public image rendering."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AY - admin listing image metadata UI boundary."
    );
    expect(status).toContain("Last merged phase PR: #92");
    expect(status).toContain(
      "Merge commit: `eaf6f19a42e47b9bfb7f9ecb780bbec5bed50cbd`"
    );
    expect(status).toContain(
      "Previous merged status snapshot: Phase 2B-AY"
    );
    expect(roadmap).toContain(
      "Phase 2C-A adds storage-backed listing media upload and public image rendering"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2C-A approves admin-controlled listing media upload"
    );
    expect(safety).toContain(
      "Phase 2C-A approves only admin-controlled listing media upload"
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Admin-controlled listing media upload stores approved image files in the `listing-media` bucket."
    );
    expect(status).toContain(
      "unguessable server-generated URL"
    );
    expect(roadmap).toContain(
      "catalogue metadata gates which URLs the website renders"
    );
    expect(safety).toContain(
      "public URL serving gate"
    );
    expect(adminOpsChecklist).toContain(
      "- [x] The public bucket serving model is documented as public-by-unguessable-server-generated-URL, with catalogue rendering gated by metadata."
    );
  });

  it("keeps upload server-only and reuses the existing product image route without browser Supabase", () => {
    const uploadRoute = readRepoFile(
      "website/lib/products/media/admin-product-image-upload-route.ts"
    );
    const productImagesRoute = readRepoFile(
      "website/app/api/admin/product-images/route.ts"
    );
    const uploadPanel = readRepoFile(
      "website/components/admin/listing-image-upload-panel.tsx"
    );

    expect(uploadRoute).toContain('import "server-only";');
    expect(uploadRoute).toContain("productImage.write");
    expect(uploadRoute).toContain("listing-media");
    expect(uploadRoute).toContain("maxImageFileSizeBytes");
    expect(uploadRoute).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(uploadRoute).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(uploadRoute).not.toContain("service-role");
    expect(productImagesRoute).toContain("multipart/form-data");
    expect(productImagesRoute).toContain("handleAdminProductImageUploadRoute");
    expect(uploadPanel).toContain('"use client";');
    expect(uploadPanel).toContain('type="file"');
    expect(uploadPanel).toContain("FormData");
    expect(uploadPanel).toContain("/api/admin/product-images");
    expect(uploadPanel).not.toContain("@supabase/");
    expect(uploadPanel).not.toContain("SUPABASE_SERVICE_ROLE");
  });

  it("adds narrow storage policy SQL without customer uploads, SVG, or anonymous write policies", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260603090000_listing_media_storage.sql"
    );

    expect(migration).toContain("'listing-media'");
    expect(migration).toContain("5242880");
    expect(migration).toContain("'image/jpeg'");
    expect(migration).toContain("'image/png'");
    expect(migration).toContain("'image/webp'");
    expect(migration).toContain("'image/avif'");
    expect(migration).toContain("listing_media_product_admin_insert");
    expect(migration).toContain("public.is_listing_media_product_admin_object");
    expect(migration).toMatch(
      /public\.is_workspace_product_manager\(\r?\n\s+split_part\(object_name, '\/', 1\)::uuid\r?\n\s+\)/
    );
    expect(migration).not.toContain("listing_media_public_read");
    expect(migration).not.toContain("public.is_public_listing_media_object");
    expect(migration).not.toContain("grant select on storage.objects to anon");
    expect(migration).not.toMatch(/for select\s+to anon/i);
    expect(migration).not.toMatch(/image\/svg|svg/i);
    expect(migration).not.toMatch(/for insert\s+to anon/i);
    expect(migration).toContain("Customer uploads");
    expect(migration).not.toMatch(/checkout|payment|crm|notification/i);
    expect(migration).not.toContain("service_role");
  });

  it("renders public images read-only without importing admin upload or write logic into public routes", () => {
    const publicSources = readTrackedProductionSources([
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/page.tsx",
      "website/lib/catalogue"
    ])
      .map(({ source }) => source)
      .join("\n");

    expect(publicSources).toContain("publicUrl");
    expect(publicSources).not.toContain("ListingImageUploadPanel");
    expect(publicSources).not.toContain("handleAdminProductImageUploadRoute");
    expect(publicSources).not.toContain("productImage.write");
    expect(publicSources).not.toContain("@supabase/ssr");
    expect(publicSources).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/catalogue-images"])).toEqual([]);
  });

  it("does not introduce ecommerce, customer upload, notification, CRM, n8n, Pinecone, or chat-config runtime paths", () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");

    expect(productionSource).not.toMatch(
      /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering|book now|confirmed booking/i
    );
    expect(productionSource).not.toMatch(/customer image upload|public upload/i);
    expect(productionSource).not.toMatch(/notification|crm/i);
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("chat-config");
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-upload"])).toEqual([]);
  });
});
