import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ");
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

describe("Phase 2K-A/B admin write hardening and readiness", () => {
  it("records Phase 2K-A/B as the current admin write hardening phase", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2K-A/B - admin write-boundary hardening and deployment readiness."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 2J-A/B MVP hardening, quote intake correctness, and demo readiness."
    );
    expect(status).toContain("Last merged capability PR: #115");
    expect(status).toContain(
      "Merge commit: `611ef1eafee5971b1d60929d17ab41a94a357522`"
    );
    expect(roadmap).toContain(
      "Phase 2K-A/B adds admin write-boundary hardening and deployment readiness"
    );
    expect(readiness).toContain("Current Phase 2K-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 2K-A/B hardens admin write boundaries and deployment/demo readiness."
    );
    expect(adminOpsChecklist).toContain(
      "- [x] Direct authenticated browser-role writes to listing metadata tables are blocked."
    );
  });

  it("adds a migration that hardens listing metadata writes behind execute_admin_product_write", () => {
    const migrationPath =
      "supabase/migrations/20260606143000_admin_write_boundary_hardening.sql";

    expect(existsSync(resolve(repoRoot, migrationPath))).toBe(true);

    const migration = readRepoFile(migrationPath);
    const normalized = normalizeWhitespace(migration);

    expect(normalized).toMatch(
      /create or replace function public\.execute_admin_product_write\( p_action text, p_target_id uuid, p_workspace_id uuid, p_payload jsonb \) returns uuid language plpgsql security definer set search_path = public/
    );
    expect(
      normalized.match(
        /from public\.categories c where c\.id = v_category_id and c\.workspace_id = p_workspace_id/g
      )?.length ?? 0
    ).toBeGreaterThanOrEqual(2);
    expect(
      normalized.match(/raise exception 'product_category_workspace_mismatch';/g)
        ?.length ?? 0
    ).toBeGreaterThanOrEqual(2);
    expect(normalized).toMatch(
      /from public\.products p where p\.id = v_product_id and p\.workspace_id = p_workspace_id/
    );
    expect(normalized).toContain(
      "raise exception 'product_image_workspace_mismatch';"
    );
    expect(normalized).toContain(
      "grant execute on function public.execute_admin_product_write(text, uuid, uuid, jsonb) to authenticated"
    );
    for (const tableName of ["categories", "products", "product_images"]) {
      expect(normalized).toMatch(
        new RegExp(`revoke insert .* on public\\.${tableName} from authenticated`)
      );
      expect(normalized).toMatch(
        new RegExp(`revoke update .* on public\\.${tableName} from authenticated`)
      );
    }
    expect(normalized).toContain(
      "alter policy categories_product_admin_insert on public.categories with check (false)"
    );
    expect(normalized).toContain(
      "alter policy products_product_admin_insert on public.products with check (false)"
    );
    expect(normalized).toContain(
      "alter policy product_images_product_admin_insert on public.product_images with check (false)"
    );
    expect(normalized).toContain(
      "alter policy audit_logs_product_admin_insert on public.audit_logs with check (false)"
    );
    expect(migration).not.toMatch(/service[_ -]?role|supabase_service_role/i);
    expect(migration).not.toMatch(/to anon/i);
  });

  it("keeps admin product writes on approved API/RPC boundaries", () => {
    const productPersistenceSource = readTrackedProductionSources([
      "website/lib/products/persistence"
    ]);
    const productWriteSource = readTrackedProductionSources([
      "website/app/api/admin/categories",
      "website/app/api/admin/products",
      "website/app/api/admin/product-images",
      "website/components/admin"
    ]);

    expect(productPersistenceSource).toContain("execute_admin_product_write");
    expect(productWriteSource).toContain("/api/admin/categories");
    expect(productWriteSource).toContain("/api/admin/products");
    expect(productWriteSource).toContain("/api/admin/product-images");
    expect(productPersistenceSource).not.toMatch(/from\(["']categories["']\)/);
    expect(productPersistenceSource).not.toMatch(/from\(["']products["']\)/);
    expect(productPersistenceSource).not.toMatch(/from\(["']product_images["']\)/);
    expect(`${productPersistenceSource}\n${productWriteSource}`).not.toContain(
      "SUPABASE_SERVICE_ROLE"
    );
    expect(`${productPersistenceSource}\n${productWriteSource}`).not.toContain(
      "NEXT_PUBLIC_SUPABASE"
    );
  });

  it("keeps quote and public catalogue sanity boundaries in source", () => {
    const quoteSource = readTrackedProductionSources([
      "website/app/api/quote",
      "website/app/api/admin/quote-requests",
      "website/components/QuoteRequestForm.tsx",
      "website/lib/quote"
    ]);
    const catalogueSource = readTrackedProductionSources([
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/lib/catalogue"
    ]);

    expect(quoteSource).toContain("customerMessage");
    expect(quoteSource).toContain("customer_message");
    expect(quoteSource).toContain("execute_admin_quote_workflow");
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(catalogueSource).toContain('rpc("get_public_catalogue"');
    expect(catalogueSource).not.toMatch(/from\(["']categories["']\)/);
    expect(catalogueSource).not.toMatch(/from\(["']products["']\)/);
    expect(catalogueSource).not.toMatch(/from\(["']product_images["']\)/);
    expect(`${quoteSource}\n${catalogueSource}`).not.toContain(
      "NEXT_PUBLIC_SUPABASE"
    );
    expect(`${quoteSource}\n${catalogueSource}`).not.toContain(
      "SUPABASE_SERVICE_ROLE"
    );
  });

  it("expands deployment and smoke-test readiness without adding forbidden runtime scope", () => {
    const environmentReadiness = readRepoFile(
      "docs/DEPLOYMENT-ENVIRONMENT-READINESS.md"
    );
    const smokeRunbook = readRepoFile("docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md");
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib/catalogue",
      "website/lib/products",
      "website/lib/quote"
    ]);
    const chatRoute = readRepoFile("website/app/api/chat/route.ts");

    expect(environmentReadiness).toContain("ADMIN_TRUSTED_WORKSPACE_ID");
    expect(environmentReadiness).toContain("CATALOGUE_WORKSPACE_ID");
    expect(environmentReadiness).toContain("QUOTE_TRUSTED_CLIENT_IP_HEADER");
    expect(environmentReadiness).toContain("execute_admin_product_write");
    expect(environmentReadiness).toContain("local search-index job");
    expect(smokeRunbook).toContain("cd website && npm test");
    expect(smokeRunbook).toContain("npm run test:supabase-rls");
    expect(smokeRunbook).toContain(
      "Public quote/enquiry can submit customer message with no item selected."
    );
    expect(smokeRunbook).toContain(
      "Local search-index job is enqueued after admin listing/category/image write."
    );
    expect(smokeRunbook).toContain(
      "Public user cannot read quote records back."
    );
    expect(smokeRunbook).toContain("Rollback notes");

    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(chatRoute).not.toMatch(
      /pinecone|retrieval|rerank|vector|embedding|rag|search[_ -]?index/i
    );
    expect(productionSource).not.toMatch(
      /cart|checkout|payments?|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i
    );
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public-upload"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-upload"])).toEqual([]);
  });
});
