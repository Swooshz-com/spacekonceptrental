import "server-only";

import { createServerSupabaseClient } from "../supabase/server";
import type {
  AdminRecipeWriteRequest,
  AdminRecipeWriteResult,
  AdminRecipeReadResult,
  AdminRecipeReadItem
} from "./setup-recipe-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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
  request: AdminRecipeWriteRequest
): Promise<AdminRecipeWriteResult> {
  const supabase = createServerSupabaseClient();

  if (!supabase.configured) {
    return { ok: false, code: "rpc-unavailable" };
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
  setupProductId: string
): Promise<AdminRecipeReadResult> {
  const supabase = createServerSupabaseClient();

  if (!supabase.configured) {
    return { ok: false, code: "rpc-unavailable" };
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
    if (!revision || revision <= 0) {
      return { ok: false, code: "not-found" };
    }

    const itemsResult = await supabase.client
      .from("setup_recipe_items")
      .select("workspace_id,setup_product_id,included_product_id,position,base_quantity")
      .eq("workspace_id", workspaceId)
      .eq("setup_product_id", setupProductId)
      .order("position");

    if (itemsResult.error) {
      return { ok: true, revision, items: [] };
    }

    const items: AdminRecipeReadItem[] = (
      Array.isArray(itemsResult.data) ? itemsResult.data : []
    ).map((row: unknown) => {
      const r = row as Record<string, unknown>;
      return {
        workspace_id: String(r.workspace_id ?? ""),
        setup_product_id: String(r.setup_product_id ?? ""),
        included_product_id: String(r.included_product_id ?? ""),
        position: Number(r.position ?? 0),
        base_quantity: Number(r.base_quantity ?? 0)
      };
    });

    return { ok: true, revision, items };
  } catch {
    return { ok: false, code: "unknown-error" };
  }
}
