import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";
import type { TrustedQuoteAdminContext } from "./admin-quote-request-status-write";

export type AdminQuoteRequestCrmProvider = "hubspot";

export type AdminQuoteRequestCrmHandoffQueueStatus =
  | "not_queued"
  | "queued"
  | "failed";

export type AdminQuoteRequestCrmHandoffWriteRecord = {
  id: string;
  type: "quoteRequest";
  crmProvider: AdminQuoteRequestCrmProvider;
  crmSyncStatus: AdminQuoteRequestCrmHandoffQueueStatus;
};

export type AdminQuoteRequestCrmHandoffWriteResult =
  | {
      ok: true;
      record: AdminQuoteRequestCrmHandoffWriteRecord;
    }
  | {
      ok: false;
      code:
        | "QUOTE_CRM_HANDOFF_STATUS_UPDATE_UNAVAILABLE"
        | "QUOTE_ADMIN_CONTEXT_INVALID"
        | "QUOTE_CRM_HANDOFF_STATUS_UPDATE_FAILED";
    };

type MutationResult = {
  data: unknown;
  error: unknown;
};

export type AdminQuoteRequestCrmHandoffWriteSupabaseClient = {
  rpc(
    fn: "execute_admin_quote_crm_handoff_queue_update",
    args: {
      p_quote_request_id: string;
      p_workspace_id: string;
      p_crm_provider: AdminQuoteRequestCrmProvider;
      p_crm_sync_status: AdminQuoteRequestCrmHandoffQueueStatus;
    }
  ): {
    single(): Promise<MutationResult>;
  };
};

export type AdminQuoteRequestCrmHandoffWriteSupabaseClientResult =
  | {
      configured: true;
      client: AdminQuoteRequestCrmHandoffWriteSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_write_client_required";
    };

export type UpdateAdminQuoteRequestCrmHandoffStatusInput = {
  admin: TrustedQuoteAdminContext;
  quoteRequestId: string;
  crmProvider?: AdminQuoteRequestCrmProvider;
  crmSyncStatus: AdminQuoteRequestCrmHandoffQueueStatus;
};

export type AdminQuoteRequestCrmHandoffWritePersistence = {
  updateCrmHandoffStatus: (
    input: UpdateAdminQuoteRequestCrmHandoffStatusInput
  ) => Promise<AdminQuoteRequestCrmHandoffWriteResult>;
};

type AdminQuoteRequestCrmHandoffWriteOptions = {
  supabase?: AdminQuoteRequestCrmHandoffWriteSupabaseClientResult;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const crmHandoffQueueStatuses = new Set<AdminQuoteRequestCrmHandoffQueueStatus>([
  "not_queued",
  "queued",
  "failed"
]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function isCrmProvider(value: unknown): value is AdminQuoteRequestCrmProvider {
  return value === "hubspot";
}

function isCrmHandoffQueueStatus(
  value: unknown
): value is AdminQuoteRequestCrmHandoffQueueStatus {
  return (
    typeof value === "string" &&
    crmHandoffQueueStatuses.has(value as AdminQuoteRequestCrmHandoffQueueStatus)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validAdminContext(admin: TrustedQuoteAdminContext) {
  return (
    admin.resolution === "server-auth-membership" &&
    isUuid(admin.workspaceId) &&
    isUuid(admin.adminUserId) &&
    (admin.membershipId === undefined || isUuid(admin.membershipId))
  );
}

function success(
  id: string,
  crmSyncStatus: AdminQuoteRequestCrmHandoffQueueStatus
): AdminQuoteRequestCrmHandoffWriteResult {
  return {
    ok: true,
    record: {
      id,
      type: "quoteRequest",
      crmProvider: "hubspot",
      crmSyncStatus
    }
  };
}

function failure(
  code: Extract<AdminQuoteRequestCrmHandoffWriteResult, { ok: false }>["code"]
): AdminQuoteRequestCrmHandoffWriteResult {
  return {
    ok: false,
    code
  };
}

async function createDefaultSupabase(): Promise<AdminQuoteRequestCrmHandoffWriteSupabaseClientResult> {
  const supabase = await createSessionBoundSupabaseAdminReadClient();

  if (!supabase.configured) {
    return {
      configured: false,
      client: null,
      reason: "authenticated_admin_write_client_required"
    };
  }

  return {
    configured: true,
    client: supabase.client as unknown as AdminQuoteRequestCrmHandoffWriteSupabaseClient,
    missingEnv: []
  };
}

function resultRecordId(result: MutationResult) {
  if (result.error) {
    return null;
  }

  if (isUuid(result.data)) {
    return result.data.trim();
  }

  if (!isRecord(result.data)) {
    return null;
  }

  const id = result.data.id;

  return isUuid(id) ? id.trim() : null;
}

export async function updateAdminQuoteRequestCrmHandoffStatus(
  input: UpdateAdminQuoteRequestCrmHandoffStatusInput,
  options: AdminQuoteRequestCrmHandoffWriteOptions = {}
): Promise<AdminQuoteRequestCrmHandoffWriteResult> {
  const crmProvider = input.crmProvider ?? "hubspot";

  if (!validAdminContext(input.admin)) {
    return failure("QUOTE_ADMIN_CONTEXT_INVALID");
  }

  if (
    !isUuid(input.quoteRequestId) ||
    !isCrmProvider(crmProvider) ||
    !isCrmHandoffQueueStatus(input.crmSyncStatus)
  ) {
    return failure("QUOTE_CRM_HANDOFF_STATUS_UPDATE_FAILED");
  }

  const supabase = options.supabase ?? (await createDefaultSupabase());

  if (!supabase.configured) {
    return failure("QUOTE_CRM_HANDOFF_STATUS_UPDATE_UNAVAILABLE");
  }

  try {
    const result = await supabase.client
      .rpc("execute_admin_quote_crm_handoff_queue_update", {
        p_quote_request_id: input.quoteRequestId.trim(),
        p_workspace_id: input.admin.workspaceId,
        p_crm_provider: crmProvider,
        p_crm_sync_status: input.crmSyncStatus
      })
      .single();
    const id = resultRecordId(result);

    return id ? success(id, input.crmSyncStatus) : failure("QUOTE_CRM_HANDOFF_STATUS_UPDATE_FAILED");
  } catch {
    return failure("QUOTE_CRM_HANDOFF_STATUS_UPDATE_FAILED");
  }
}

export const adminQuoteRequestCrmHandoffWritePersistence: AdminQuoteRequestCrmHandoffWritePersistence = {
  updateCrmHandoffStatus: updateAdminQuoteRequestCrmHandoffStatus
};
