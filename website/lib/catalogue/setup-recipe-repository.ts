import "server-only";

import {
  createSessionBoundSupabaseAdminReadClient,
  resolveSupabaseAdminAuthIdentity,
  type SupabaseAdminAuthIdentityDependencies,
  type SupabaseAdminReadClientFactoryDependencies,
  type SupabaseAdminAuthIdentityResult
} from "../admin/authorization/supabase-admin-auth-identity-adapter";
import type { SupabaseAdminReadClientResult } from "../admin/authorization/supabase-admin-profile-membership-adapters";
import type {
  AdminRecipeWriteRequest,
  AdminRecipeWriteResult,
  AdminRecipeReadResult,
  AdminRecipeReadItem
} from "./setup-recipe-types";
import {
  parseAdminRecipeWriteRpcResult
} from "./setup-recipe-types";

type RecipeSupabaseQueryResult = {
  data: unknown;
  error: unknown;
  status?: number;
  statusText?: string;
};

type RecipeSupabaseQuery = {
  select(columns: string): RecipeSupabaseQuery;
  eq(column: string, value: string): RecipeSupabaseQuery;
  single(): PromiseLike<RecipeSupabaseQueryResult>;
  order(column: string): PromiseLike<RecipeSupabaseQueryResult>;
};

type RecipeSupabaseClient = {
  rpc(
    functionName: string,
    args: Record<string, unknown>
  ): PromiseLike<RecipeSupabaseQueryResult>;
  from(table: string): RecipeSupabaseQuery;
};

export type SetupRecipeRepositoryDependencies = {
  resolveAuthIdentity?: (
    dependencies?: SupabaseAdminAuthIdentityDependencies
  ) => Promise<SupabaseAdminAuthIdentityResult>;
  createReadClient?: (
    dependencies?: SupabaseAdminReadClientFactoryDependencies
  ) => Promise<SupabaseAdminReadClientResult>;
  auth?: SupabaseAdminAuthIdentityDependencies;
  readClient?: SupabaseAdminReadClientFactoryDependencies;
};

type AuthenticatedRecipeClientResult =
  | { ok: true; client: RecipeSupabaseClient }
  | { ok: false; code: "not-authenticated" | "rpc-unavailable" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const reviewedAuthorizationErrorCodes = new Set(["42501"]);
const reviewedAuthenticationErrorIdentifiers = new Set([
  "PGRST301",
  "PGRST302"
]);
const reviewedAuthorizationErrorIdentifiers = new Set([
  "unauthorized_admin_action"
]);
const reviewedConflictErrorIdentifiers = new Set([
  "setup_recipe_revision_conflict"
]);
const reviewedValidationErrorIdentifiers = new Set([
  "setup_recipe_workspace_required",
  "unsupported_setup_recipe_operation",
  "setup_recipe_parent_required",
  "setup_recipe_items_array_required",
  "setup_recipe_parent_missing",
  "setup_recipe_remove_items_must_be_empty",
  "setup_recipe_not_found",
  "setup_recipe_published_parent_remove",
  "setup_recipe_empty_replacement",
  "setup_recipe_item_count_invalid",
  "setup_recipe_invalid_item",
  "setup_recipe_self_reference",
  "setup_recipe_position_invalid",
  "setup_recipe_quantity_invalid",
  "setup_recipe_duplicate_child",
  "setup_recipe_duplicate_position",
  "setup_recipe_positions_not_contiguous",
  "setup_recipe_child_workspace_mismatch",
  "setup_recipe_nested_setup",
  "setup_recipe_published_parent_invalid",
  "setup_recipe_published_child_invalid",
  "setup_recipe_revision_exhausted",
  "setup_recipe_creation_revision_required",
  "setup_recipe_parent_published",
  "setup_recipe_published_child_protected"
]);

function providerErrorCode(error: unknown): string | undefined {
  if (!isRecord(error) || typeof error.code !== "string") return undefined;
  return error.code;
}

function providerErrorStatus(
  result: RecipeSupabaseQueryResult
): number | undefined {
  if (typeof result.status === "number") return result.status;
  return isRecord(result.error) && typeof result.error.status === "number"
    ? result.error.status
    : undefined;
}

function isProviderAuthenticationFailure(
  result: RecipeSupabaseQueryResult
): boolean {
  return (
    providerErrorStatus(result) === 401 ||
    hasReviewedIdentifier(
      providerErrorIdentifiers(result.error),
      reviewedAuthenticationErrorIdentifiers
    )
  );
}

function isExplicitNoRowFailure(
  result: RecipeSupabaseQueryResult
): boolean {
  return (
    providerErrorCode(result.error) === "PGRST116" &&
    isRecord(result.error) &&
    result.error.details === "The result contains 0 rows"
  );
}

function classifyRecipeReadError(
  result: RecipeSupabaseQueryResult
): "not-found" | "not-authenticated" | "unauthorized" | "read-failure" {
  if (isExplicitNoRowFailure(result)) return "not-found";
  if (isProviderAuthenticationFailure(result)) return "not-authenticated";
  return "read-failure";
}

async function getAuthenticatedRecipeClient(
  dependencies: SetupRecipeRepositoryDependencies
): Promise<AuthenticatedRecipeClientResult> {
  const resolveAuthIdentity =
    dependencies.resolveAuthIdentity ?? resolveSupabaseAdminAuthIdentity;
  const createReadClient =
    dependencies.createReadClient ?? createSessionBoundSupabaseAdminReadClient;

  let identity: SupabaseAdminAuthIdentityResult;
  try {
    identity = await resolveAuthIdentity(dependencies.auth);
  } catch {
    return { ok: false, code: "not-authenticated" };
  }

  if (!identity.authenticated) {
    return {
      ok: false,
      code:
        identity.reason === "supabase_server_env_missing"
          ? "rpc-unavailable"
          : "not-authenticated"
    };
  }

  let supabase: SupabaseAdminReadClientResult;
  try {
    supabase = await createReadClient(dependencies.readClient);
  } catch {
    return { ok: false, code: "rpc-unavailable" };
  }

  if (!supabase.configured) {
    return { ok: false, code: "rpc-unavailable" };
  }

  return {
    ok: true,
    client: supabase.client as unknown as RecipeSupabaseClient
  };
}

function providerErrorIdentifiers(error: unknown) {
  if (!isRecord(error)) return [];

  return [error.code, error.message].filter(
    (value): value is string => typeof value === "string" && Boolean(value.trim())
  ).map((value) => value.trim());
}

function hasReviewedIdentifier(identifiers: string[], reviewed: Set<string>) {
  return identifiers.some((identifier) => reviewed.has(identifier));
}

function rpcErrorCode(
  result: RecipeSupabaseQueryResult
):
  | "not-authenticated"
  | "conflict"
  | "unauthorized"
  | "validation-failure"
  | "rpc-failure" {
  const identifiers = providerErrorIdentifiers(result.error);
  if (hasReviewedIdentifier(identifiers, reviewedAuthenticationErrorIdentifiers)) {
    return "not-authenticated";
  }
  if (
    providerErrorStatus(result) === 403 ||
    reviewedAuthorizationErrorCodes.has(providerErrorCode(result.error) ?? "") ||
    hasReviewedIdentifier(identifiers, reviewedAuthorizationErrorIdentifiers)
  ) {
    return "unauthorized";
  }
  if (hasReviewedIdentifier(identifiers, reviewedConflictErrorIdentifiers)) {
    return "conflict";
  }
  if (hasReviewedIdentifier(identifiers, reviewedValidationErrorIdentifiers)) {
    return "validation-failure";
  }
  return "rpc-failure" as const;
}

export async function executeAdminSetupRecipeWrite(
  request: AdminRecipeWriteRequest,
  dependencies: SetupRecipeRepositoryDependencies = {}
): Promise<AdminRecipeWriteResult> {
  const supabase = await getAuthenticatedRecipeClient(dependencies);

  if (!supabase.ok) {
    return { ok: false, code: supabase.code };
  }

  try {
    const result = await supabase.client.rpc("execute_admin_setup_recipe_write", {
      p_operation: request.operation,
      p_expected_workspace_id: request.expectedWorkspaceId,
      p_setup_product_id: request.setupProductId,
      p_expected_revision: request.expectedRevision,
      p_items: request.items
    });

    if (result.error) {
      if (isProviderAuthenticationFailure(result)) {
        return { ok: false, code: "not-authenticated" };
      }

      if (
        providerErrorStatus(result) === 403 ||
        providerErrorCode(result.error) === "42501"
      ) {
        return { ok: false, code: "unauthorized" };
      }

      return { ok: false, code: rpcErrorCode(result) };
    }

    if (!isRecord(result.data)) {
      return { ok: false, code: "rpc-failure" };
    }

    const parsed = parseAdminRecipeWriteRpcResult(result.data, {
      operation: request.operation,
      setupProductId: request.setupProductId
    });

    if (!parsed.ok) {
      return { ok: false, code: "rpc-failure" };
    }

    return {
      ok: true,
      ...parsed.value
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("fetch") || message.includes("network")) {
      return { ok: false, code: "network-error" };
    }
    return { ok: false, code: "unknown-error" };
  }
}

export async function readAdminSetupRecipe(
  workspaceId: string,
  setupProductId: string,
  dependencies: SetupRecipeRepositoryDependencies = {}
): Promise<AdminRecipeReadResult> {
  const supabase = await getAuthenticatedRecipeClient(dependencies);

  if (!supabase.ok) {
    return {
      ok: false,
      code: supabase.code
    };
  }

  try {
    const headerResult = await supabase.client
      .from("setup_recipes")
      .select("revision")
      .eq("workspace_id", workspaceId)
      .eq("setup_product_id", setupProductId)
      .single();

    if (headerResult.error) {
      return { ok: false, code: classifyRecipeReadError(headerResult) };
    }

    if (!isRecord(headerResult.data)) {
      return { ok: false, code: "read-failure" };
    }

    const revision = headerResult.data.revision;
    if (
      typeof revision !== "number" ||
      !Number.isSafeInteger(revision) ||
      revision <= 0
    ) {
      return { ok: false, code: "read-failure" };
    }

    const itemsResult = await supabase.client
      .from("setup_recipe_items")
      .select("workspace_id,setup_product_id,included_product_id,position,base_quantity")
      .eq("workspace_id", workspaceId)
      .eq("setup_product_id", setupProductId)
      .order("position");

    if (itemsResult.error) {
      return {
        ok: false,
        code: isProviderAuthenticationFailure(itemsResult)
          ? "not-authenticated"
          : "read-failure"
      };
    }

    if (!Array.isArray(itemsResult.data) || itemsResult.data.length < 1) {
      return { ok: false, code: "read-failure" };
    }

    const items: AdminRecipeReadItem[] = [];
    for (const row of itemsResult.data) {
      if (!isRecord(row)) {
        return { ok: false, code: "read-failure" };
      }

      const workspace = getString(row.workspace_id);
      const setupProduct = getString(row.setup_product_id);
      const includedProduct = getString(row.included_product_id);
      const position = row.position;
      const baseQuantity = row.base_quantity;

      if (
        !workspace ||
        !setupProduct ||
        !includedProduct ||
        workspace !== workspaceId ||
        setupProduct !== setupProductId ||
        typeof position !== "number" ||
        !Number.isSafeInteger(position) ||
        position < 0 ||
        position > 19 ||
        typeof baseQuantity !== "number" ||
        !Number.isSafeInteger(baseQuantity) ||
        baseQuantity < 1 ||
        baseQuantity > 99
      ) {
        return { ok: false, code: "read-failure" };
      }

      items.push({
        workspace_id: workspace,
        setup_product_id: setupProduct,
        included_product_id: includedProduct,
        position,
        base_quantity: baseQuantity
      });
    }

    const positions = new Set(items.map((item) => item.position));
    const childIds = new Set(items.map((item) => item.included_product_id));
    if (
      positions.size !== items.length ||
      childIds.size !== items.length ||
      items.some((item, index) => item.position !== index)
    ) {
      return { ok: false, code: "read-failure" };
    }

    return { ok: true, revision, items };
  } catch {
    return { ok: false, code: "read-failure" };
  }
}
