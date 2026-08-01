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

type RecipeSupabaseQueryResult = {
  data: unknown;
  error: unknown;
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

function rpcErrorCode(rawMessage: string): "conflict" | "unauthorized" | "validation-failure" | "rpc-failure" {
  const message = rawMessage.toLowerCase();
  if (message.includes("revision_conflict")) return "conflict" as const;
  if (message.includes("unauthorized")) return "unauthorized" as const;
  if (
    message.includes("invalid") ||
    message.includes("empty") ||
    message.includes("self_reference") ||
    message.includes("duplicate") ||
    message.includes("nested") ||
    message.includes("position") ||
    message.includes("quantity") ||
    message.includes("child") ||
    message.includes("workspace_required") ||
    message.includes("parent_required") ||
    message.includes("parent_missing") ||
    message.includes("parent_published") ||
    message.includes("items_array") ||
    message.includes("creation_revision") ||
    message.includes("not_found") ||
    message.includes("unsupported")
  )
    return "validation-failure" as const;
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
      const rawMessage =
        typeof result.error === "object" && result.error !== null
          ? ((result.error as unknown as Record<string, unknown>).message as string) ?? ""
          : "";

      if (rawMessage.includes("PGRST") || rawMessage.includes("JWT") || rawMessage.includes("session")) {
        return { ok: false, code: "not-authenticated" };
      }

      return { ok: false, code: rpcErrorCode(rawMessage) };
    }

    if (!isRecord(result.data)) {
      return { ok: false, code: "rpc-failure" };
    }

    const data = result.data;
    return {
      ok: true,
      operation: String(data.operation ?? ""),
      setupProductId: String(data.setup_product_id ?? ""),
      revision: Number(data.revision ?? 0),
      itemCount: Number(data.item_count ?? 0)
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
      code: supabase.code === "not-authenticated" ? "unauthorized" : supabase.code
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
      const errData = headerResult.error as unknown as { message?: string };
      const msg = String(errData?.message ?? "").toLowerCase();
      if (msg.includes("jwt") || msg.includes("session") || msg.includes("auth")) {
        return { ok: false, code: "unauthorized" };
      }
      return { ok: false, code: "not-found" };
    }

    const revision = Number(
      (headerResult.data as Record<string, unknown>)?.revision ?? 0
    );
    if (!Number.isSafeInteger(revision) || revision <= 0) {
      return { ok: false, code: "not-found" };
    }

    const itemsResult = await supabase.client
      .from("setup_recipe_items")
      .select("workspace_id,setup_product_id,included_product_id,position,base_quantity")
      .eq("workspace_id", workspaceId)
      .eq("setup_product_id", setupProductId)
      .order("position");

    if (itemsResult.error) {
      return { ok: false, code: "read-failure" };
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
    return { ok: false, code: "unknown-error" };
  }
}
