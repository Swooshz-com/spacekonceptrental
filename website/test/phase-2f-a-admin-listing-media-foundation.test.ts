import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ");
}

function normalizePathForGit(path: string) {
  return path.replace(/\\/g, "/").replace(/\/$/, "");
}

function readTrackedFiles(paths: string[]) {
  return execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((filePath) =>
      paths
        .map(normalizePathForGit)
        .some((path) => filePath === path || filePath.startsWith(`${path}/`))
    );
}

describe("Phase 2F-A admin rental listing/media foundation", () => {
  it("records Phase 2F-A as completed after PR #108", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

    expect(status).toContain(
      "PR #108 merged Phase 2F-A admin rental listing/media foundation"
    );
    expect(status).toContain(
      "commit `8385ac2d925b5edd44cdf016707bb2cd00d67264`"
    );
    expect(status).toContain(
      "Phase 2F-A admin rental listing/media foundation is complete"
    );
    expect(roadmap).toContain(
      "Phase 2F-A adds a server-only listing-facing admin domain foundation"
    );
    expect(readiness).toContain("Previous Current Phase 2F-A status");
    expect(adminOpsChecklist).toContain(
      "Phase 2F-A Admin Rental Listing/Media Foundation"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2F-A adds a server-only listing-facing admin domain foundation."
    );
    expect(
      [status, roadmap, readiness, adminOpsChecklist, decisionLog].join("\n")
    ).toContain("listing/enquiry/quote/request");
  });

  it("reuses the existing product/image tables instead of creating duplicate listing tables", () => {
    const migrations = readTrackedFiles(["supabase/migrations"])
      .map(readRepoFile)
      .join("\n");
    const baseSchema = readRepoFile(
      "supabase/migrations/20260526163104_create_base_schema.sql"
    );

    expect(baseSchema).toContain("create table if not exists public.products");
    expect(baseSchema).toContain(
      "create table if not exists public.product_images"
    );
    expect(migrations).not.toMatch(
      /create table(?: if not exists)? public\.(rental_)?listings/i
    );
    expect(migrations).not.toMatch(
      /create table(?: if not exists)? public\.listing_images/i
    );
  });

  it("keeps the listing admin domain server-only, injected, and free of browser/runtime shortcuts", () => {
    const source = [
      "website/lib/listings/admin/index.ts",
      "website/lib/listings/admin/types.ts",
      "website/lib/listings/admin/disabled-rental-listing-admin.ts",
      "website/lib/listings/admin/product-backed-rental-listing-admin.ts"
    ]
      .map(readRepoFile)
      .join("\n");
    const sourceWithoutSafetyPattern = source.replace(
      /const unsafePayloadKeyPattern =[\s\S]*?\);\r?\n/,
      ""
    );

    expect(source).toContain('import "server-only"');
    expect(source).toContain("RentalListingDraft");
    expect(source).toContain("ListingImageMetadataDraft");
    expect(source).toContain("ProductPersistence");
    expect(source).toContain("createProductBackedRentalListingAdminAdapter");
    expect(source).toContain("disabledRentalListingAdmin");
    expect(source).toContain("title");
    expect(source).toContain("details");
    expect(source).toContain("rentalUnit");
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("createClient(");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain(".rpc(");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("chat-config");
    expect(sourceWithoutSafetyPattern).not.toMatch(
      /\bcarts?\b|\bcheckout\b|\bpayments?\b|\borders?\b|stock[_ -]?reservation|fulfil(?:ment)?|confirmed booking|online ordering/i
    );
    expect(source).not.toMatch(/customer[_ -]?visible[_ -]?internal[_ -]?notes/i);
  });

  it("does not add public/customer upload routes or transcript audit wiring", () => {
    const routeSource = readRepoFile("website/app/api/chat/route.ts");
    const publicCatalogueTypes = readRepoFile("website/lib/catalogue/types.ts");

    expect(readTrackedFiles(["website/app/api/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/listing-media"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(routeSource).not.toMatch(
      /TranscriptAudit|recordTranscriptAuditEvent|recordTranscriptEvidenceRecord|createRpcTranscriptAuditAdapter|insertTranscriptAuditEvent|insertTranscriptEvidenceRecord/i
    );
    expect(publicCatalogueTypes).not.toMatch(
      /internalNotes|customerVisibleInternalNotes|adminNotes/i
    );
  });
});
