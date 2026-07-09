import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminAuthorizationAdapterSet } from "../lib/admin/authorization/admin-authorization-resolver";
import type { AdminRole } from "../lib/admin/authorization/admin-authorization-policy";
import {
  createServerAdminCsrfProofRuntimeDependencies,
  deriveServerAdminCsrfProofSessionWorkspaceBinding
} from "../lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies";
import {
  resolveServerAdminCsrfProofSessionWorkspaceBinding,
  type ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput
} from "../lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding";

const repoRoot = resolve(process.cwd(), "..");
const runtimeDependenciesPath =
  "website/lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies.ts";
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

const canonicalBindingInput: ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput =
  {
    requestedOperation: "product.write",
    authUserId: "auth-user-raw-1",
    adminUserId: "admin-user-raw-1",
    workspaceId: "workspace-raw-1",
    membershipRole: "admin"
  };

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

function createAdapterSet(role: AdminRole = "admin"): AdminAuthorizationAdapterSet {
  return {
    auth: {
      resolveIdentity: vi.fn(async () => ({
        authenticated: true,
        authUserId: canonicalBindingInput.authUserId
      }))
    },
    profile: {
      resolveAdminProfile: vi.fn(async () => ({
        id: canonicalBindingInput.adminUserId,
        status: "active" as const
      }))
    },
    workspace: {
      resolveWorkspaceForRequest: vi.fn(async () => ({
        serverResolvedWorkspaceId: canonicalBindingInput.workspaceId
      }))
    },
    membership: {
      resolveMembership: vi.fn(async () => ({
        adminUserId: canonicalBindingInput.adminUserId,
        workspaceId: canonicalBindingInput.workspaceId,
        status: "active" as const,
        role
      }))
    }
  };
}

function createConfiguredAdapters(role: AdminRole = "admin") {
  return vi.fn(async () => ({
    configured: true as const,
    adapters: createAdapterSet(role)
  }));
}

describe("Phase 2B-AJ - admin CSRF session/workspace binding runtime dependencies", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ADMIN_CSRF_PROOF_SECRET = "binding-secret";
    vi.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("records Phase 2B-AI as complete and Phase 2B-AJ as current", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const projectContext = readRepoFile("docs/PROJECT-CONTEXT.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2B-AN - admin auth login logout protected shell."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AM - admin product write audit atomicity boundary."
    );
    expect(status).toContain("Last merged phase PR: #80");
    expect(status).toContain(
      "Merge commit: `c61fd3511daba3a950e650378eb98152ec6a3ff2`"
    );
    expect(status).toContain(
      "This phase adds a minimal first-party admin login page"
    );
    expect(status).toContain(
      "Furniture listing metadata writes currently use the existing Phase 2B-AL/AM backend API route boundary, whose internal technical names still reference product/product image tables and routes."
    );
    expect(authChecklist).toContain(
      "- [x] Admin CSRF proof session/workspace binding runtime dependency boundary."
    );
    expect(roadmap).toContain(
      "Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace binding runtime dependency boundary."
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace binding runtime dependency boundary"
    );
    expect(projectContext).toContain(
      "Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace binding runtime dependency boundary."
    );
    expect(safety).toContain(
      "Phase 2B-AJ adds only the server-only admin CSRF proof session/workspace binding runtime dependency boundary"
    );
  });

  it("derives the same opaque binding for identical canonical input and secret", () => {
    const first =
      deriveServerAdminCsrfProofSessionWorkspaceBinding(canonicalBindingInput);
    const second =
      deriveServerAdminCsrfProofSessionWorkspaceBinding({
        ...canonicalBindingInput
      });

    expect(first).toBe(second);
    expect(first).toMatch(/^csrf-session-binding-v1\.[A-Za-z0-9_-]+$/);

    for (const rawValue of [
      canonicalBindingInput.authUserId,
      canonicalBindingInput.adminUserId,
      canonicalBindingInput.workspaceId,
      canonicalBindingInput.membershipRole,
      "cookie",
      "header",
      "supabase",
      "Error:"
    ]) {
      expect(first).not.toContain(rawValue);
    }
  });

  it.each<
    [
      keyof ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput,
      ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput[
        keyof ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput
      ]
    ]
  >([
    ["requestedOperation", "category.write"],
    ["authUserId", "auth-user-raw-2"],
    ["adminUserId", "admin-user-raw-2"],
    ["workspaceId", "workspace-raw-2"],
    ["membershipRole", "owner"]
  ])("changes the binding when %s changes", (field, changedValue) => {
    const original =
      deriveServerAdminCsrfProofSessionWorkspaceBinding(canonicalBindingInput);
    const changed = deriveServerAdminCsrfProofSessionWorkspaceBinding({
      ...canonicalBindingInput,
      [field]: changedValue
    });

    expect(changed).not.toBe(original);
  });

  it("fails closed on missing or blank secret", () => {
    delete process.env.ADMIN_CSRF_PROOF_SECRET;
    expect(
      deriveServerAdminCsrfProofSessionWorkspaceBinding(canonicalBindingInput)
    ).toBeNull();

    process.env.ADMIN_CSRF_PROOF_SECRET = "   ";
    expect(
      deriveServerAdminCsrfProofSessionWorkspaceBinding(canonicalBindingInput)
    ).toBeNull();
  });

  it.each([
    ["requestedOperation", " "],
    ["requestedOperation", "admin.auth.check"],
    ["authUserId", " "],
    ["adminUserId", " "],
    ["workspaceId", " "],
    ["membershipRole", "viewer"],
    ["membershipRole", "super-admin"]
  ])("fails closed on malformed %s", (field, value) => {
    expect(
      deriveServerAdminCsrfProofSessionWorkspaceBinding({
        ...canonicalBindingInput,
        [field]: value
      } as ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput)
    ).toBeNull();
  });

  it("fails closed when crypto derivation throws", async () => {
    vi.resetModules();
    vi.doMock("node:crypto", async (importOriginal) => {
      const actual = await importOriginal<typeof import("node:crypto")>();

      return {
        ...actual,
        createHmac: () => {
          throw new Error("hmac unavailable");
        }
      };
    });

    const {
      deriveServerAdminCsrfProofSessionWorkspaceBinding:
        deriveWithThrowingCrypto
    } = await import(
      "../lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies"
    );

    expect(deriveWithThrowingCrypto(canonicalBindingInput)).toBeNull();

    vi.doUnmock("node:crypto");
    vi.resetModules();
  });

  it("wires the binding deriver into the runtime dependency shape", async () => {
    const dependencies = createServerAdminCsrfProofRuntimeDependencies();

    expect(
      dependencies.sessionWorkspaceBindingDependencies
        .deriveSessionWorkspaceBinding
    ).toBe(deriveServerAdminCsrfProofSessionWorkspaceBinding);

    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: canonicalBindingInput.requestedOperation
      },
      {
        createAdapterSet: createConfiguredAdapters(),
        ...dependencies.sessionWorkspaceBindingDependencies
      }
    );

    expect(result).toStrictEqual({
      bound: true,
      sessionBinding:
        deriveServerAdminCsrfProofSessionWorkspaceBinding(canonicalBindingInput),
      adminContext: {
        workspaceId: canonicalBindingInput.workspaceId,
        adminUserId: canonicalBindingInput.adminUserId,
        resolution: "server-auth-membership"
      }
    });
  });

  it("keeps the runtime dependency helper server-only and scoped to existing crypto/env boundaries", () => {
    const source = readRepoFile(runtimeDependenciesPath);

    expect(source).toContain('import "server-only";');
    expect(source).toContain("node:crypto");
    expect(source).toContain("getAdminCsrfProofSecret");
    expect(source).toContain(
      "deriveServerAdminCsrfProofSessionWorkspaceBinding"
    );
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("chat-config");
  });

  it("keeps the admin CSRF route surface limited to auth-check and the Phase 2B-AK issuer", () => {
    expect(readTrackedFiles(["website/app/api/admin"])).toEqual([
      "website/app/api/admin/admin-access/route.test.ts",
      "website/app/api/admin/admin-access/route.ts",
      "website/app/api/admin/auth-check/route.test.ts",
      "website/app/api/admin/auth-check/route.ts",
      "website/app/api/admin/categories/[categoryId]/archive/route.ts",
      "website/app/api/admin/categories/[categoryId]/route.ts",
      "website/app/api/admin/categories/route.ts",
      "website/app/api/admin/csrf-proof/route.test.ts",
      "website/app/api/admin/csrf-proof/route.ts",
      "website/app/api/admin/hero/route.ts",
      "website/app/api/admin/login/callback/route.test.ts",
      "website/app/api/admin/login/callback/route.ts",
      "website/app/api/admin/login/route.test.ts",
      "website/app/api/admin/login/route.ts",
      "website/app/api/admin/page-media/route.ts",
      "website/app/api/admin/product-images/[imageId]/archive/route.ts",
      "website/app/api/admin/product-images/[imageId]/route.ts",
      "website/app/api/admin/product-images/route.ts",
      "website/app/api/admin/products/[productId]/archive/route.ts",
      "website/app/api/admin/products/[productId]/publish/route.ts",
      "website/app/api/admin/products/[productId]/route.ts",
      "website/app/api/admin/products/route.ts",
      "website/app/api/admin/quote-requests/[quoteRequestId]/crm-handoff/route.ts",
      "website/app/api/admin/quote-requests/[quoteRequestId]/status/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-sync-dry-run-contract/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/lifecycle-reconciliation/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/route.ts"
    ]);
    expect(readTrackedFiles(["website/app/api/products"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/categories"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
  });

  it("keeps state-changing operations CSRF-proof-required and runtime writes deferred", () => {
    const preflight = readRepoFile(
      "website/lib/admin/authorization/server-admin-request-security-preflight.ts"
    );
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const appSourceOutsideCsrfRoute = productionSources
      .filter(
        ({ filePath }) =>
          filePath.startsWith("website/app/") &&
          filePath !== "website/app/api/admin/csrf-proof/route.ts"
      )
      .map(({ source }) => source)
      .join("\n");
    const productionSource = productionSources
      .map(({ source }) => source)
      .join("\n");

    for (const operation of [
      "product.write",
      "category.write",
      "productImage.write",
      "membership.manage"
    ]) {
      expect(preflight).toContain(operation);
    }

    expect(preflight).toContain("csrf_proof_missing");
    expect(preflight).toContain("verifyCsrfProof");
    expect(appSourceOutsideCsrfRoute).not.toContain("issueServerAdminCsrfProof");
    expect(appSourceOutsideCsrfRoute).not.toContain("createServerAdminCsrfProofIssuer");
    expect(appSourceOutsideCsrfRoute).not.toContain("server-admin-csrf-proof-issuer");
    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
  });
});
