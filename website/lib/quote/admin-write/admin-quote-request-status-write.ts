import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";

export type AdminQuoteRequestStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "closed"
  | "archived";

export type TrustedQuoteAdminContext = {
  workspaceId: string;
  adminUserId: string;
  membershipId?: string;
  resolution: "server-auth-membership";
};

export type AdminQuoteRequestStatusWriteRecord = {
  id: string;
  type: "quoteRequest";
};

export type AdminQuoteRequestStatusWriteResult =
  | {
      ok: true;
      record: AdminQuoteRequestStatusWriteRecord;
    }
  | {
      ok: false;
      code:
        | "QUOTE_STATUS_UPDATE_UNAVAILABLE"
        | "QUOTE_ADMIN_CONTEXT_INVALID"
        | "QUOTE_STATUS_UPDATE_FAILED";
    };

type MutationResult = {
  data: unknown;
  error: unknown;
};

type SelectSingleResult = {
  data: unknown;
  error: unknown;
};

type QuoteRequestStatusSelectBuilder = {
  eq(column: string, value: string): QuoteRequestStatusSelectBuilder;
  single(): Promise<SelectSingleResult>;
};

type QuoteRequestStatusUpdateBuilder = {
  eq(column: string, value: string): QuoteRequestStatusUpdateBuilder;
  select(columns: string): {
    single(): Promise<MutationResult>;
  };
};

export type AdminQuoteRequestStatusWriteSupabaseClient = {
  from(table: "quote_requests"): {
    select(columns: string): QuoteRequestStatusSelectBuilder;
    update(payload: {
      status: AdminQuoteRequestStatus;
      updated_at: string;
    }): QuoteRequestStatusUpdateBuilder;
  };
  from(table: "quote_request_activity"): {
    insert(payload: QuoteRequestActivityInsert[]): {
      select(columns: string): Promise<MutationResult>;
    };
  };
};

export type AdminQuoteRequestStatusWriteSupabaseClientResult =
  | {
      configured: true;
      client: AdminQuoteRequestStatusWriteSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_write_client_required";
    };

export type UpdateAdminQuoteRequestStatusInput = {
  admin: TrustedQuoteAdminContext;
  quoteRequestId: string;
  status: AdminQuoteRequestStatus;
  internalNote?: string;
};

export type AdminQuoteRequestStatusWritePersistence = {
  updateStatus: (
    input: UpdateAdminQuoteRequestStatusInput
  ) => Promise<AdminQuoteRequestStatusWriteResult>;
};

type AdminQuoteRequestStatusWriteOptions = {
  supabase?: AdminQuoteRequestStatusWriteSupabaseClientResult;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const quoteRequestStatuses = new Set<AdminQuoteRequestStatus>([
  "new",
  "reviewing",
  "quoted",
  "closed",
  "archived"
]);
const maxInternalNoteLength = 1200;

type QuoteRequestActivityInsert = {
  workspace_id: string;
  quote_request_id: string;
  actor_admin_user_id: string;
  activity_type: "status_change" | "internal_note";
  status_from: AdminQuoteRequestStatus | null;
  status_to: AdminQuoteRequestStatus | null;
  note: string | null;
};

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function isQuoteRequestStatus(value: unknown): value is AdminQuoteRequestStatus {
  return (
    typeof value === "string" &&
    quoteRequestStatuses.has(value as AdminQuoteRequestStatus)
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

function success(id: string): AdminQuoteRequestStatusWriteResult {
  return {
    ok: true,
    record: {
      id,
      type: "quoteRequest"
    }
  };
}

function failure(
  code: Extract<AdminQuoteRequestStatusWriteResult, { ok: false }>["code"]
): AdminQuoteRequestStatusWriteResult {
  return {
    ok: false,
    code
  };
}

async function createDefaultSupabase(): Promise<AdminQuoteRequestStatusWriteSupabaseClientResult> {
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
    client: supabase.client as unknown as AdminQuoteRequestStatusWriteSupabaseClient,
    missingEnv: []
  };
}

function resultRecordId(result: MutationResult) {
  if (result.error || !isRecord(result.data)) {
    return null;
  }

  const id = result.data.id;

  return isUuid(id) ? id.trim() : null;
}

function resultCurrentStatus(result: SelectSingleResult) {
  if (result.error || !isRecord(result.data)) {
    return null;
  }

  const id = result.data.id;
  const status = result.data.status;

  return isUuid(id) &&
    typeof status === "string" &&
    isQuoteRequestStatus(status)
    ? {
        id: id.trim(),
        status
      }
    : null;
}

function normalizeInternalNote(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const note = value.trim();

  if (!note) {
    return undefined;
  }

  return note.length <= maxInternalNoteLength ? note : null;
}

function activityRecordIds(result: MutationResult) {
  if (result.error || !Array.isArray(result.data)) {
    return null;
  }

  return result.data.every((row) => isRecord(row) && isUuid(row.id))
    ? result.data.map((row) => String((row as { id: string }).id).trim())
    : null;
}

export async function updateAdminQuoteRequestStatus(
  input: UpdateAdminQuoteRequestStatusInput,
  options: AdminQuoteRequestStatusWriteOptions = {}
): Promise<AdminQuoteRequestStatusWriteResult> {
  if (!validAdminContext(input.admin)) {
    return failure("QUOTE_ADMIN_CONTEXT_INVALID");
  }

  if (!isUuid(input.quoteRequestId) || !isQuoteRequestStatus(input.status)) {
    return failure("QUOTE_STATUS_UPDATE_FAILED");
  }

  const internalNote = normalizeInternalNote(input.internalNote);

  if (internalNote === null) {
    return failure("QUOTE_STATUS_UPDATE_FAILED");
  }

  const supabase = options.supabase ?? (await createDefaultSupabase());

  if (!supabase.configured) {
    return failure("QUOTE_STATUS_UPDATE_UNAVAILABLE");
  }

  try {
    const currentStatusResult = await supabase.client
      .from("quote_requests")
      .select("id, status")
      .eq("id", input.quoteRequestId.trim())
      .eq("workspace_id", input.admin.workspaceId)
      .single();
    const currentStatus = resultCurrentStatus(currentStatusResult);

    if (!currentStatus) {
      return failure("QUOTE_STATUS_UPDATE_FAILED");
    }

    const result = await supabase.client
      .from("quote_requests")
      .update({
        status: input.status,
        updated_at: new Date().toISOString()
      })
      .eq("id", input.quoteRequestId.trim())
      .eq("workspace_id", input.admin.workspaceId)
      .select("id")
      .single();
    const id = resultRecordId(result);

    if (!id) {
      return failure("QUOTE_STATUS_UPDATE_FAILED");
    }

    const activityRows: QuoteRequestActivityInsert[] = [];

    if (currentStatus.status !== input.status) {
      activityRows.push({
        workspace_id: input.admin.workspaceId,
        quote_request_id: input.quoteRequestId.trim(),
        actor_admin_user_id: input.admin.adminUserId,
        activity_type: "status_change",
        status_from: currentStatus.status,
        status_to: input.status,
        note: null
      });
    }

    if (internalNote) {
      activityRows.push({
        workspace_id: input.admin.workspaceId,
        quote_request_id: input.quoteRequestId.trim(),
        actor_admin_user_id: input.admin.adminUserId,
        activity_type: "internal_note",
        status_from: null,
        status_to: null,
        note: internalNote
      });
    }

    if (activityRows.length > 0) {
      const activityResult = await supabase.client
        .from("quote_request_activity")
        .insert(activityRows)
        .select("id");
      const activityIds = activityRecordIds(activityResult);

      if (!activityIds || activityIds.length !== activityRows.length) {
        return failure("QUOTE_STATUS_UPDATE_FAILED");
      }
    }

    return success(id);
  } catch {
    return failure("QUOTE_STATUS_UPDATE_FAILED");
  }
}

export const adminQuoteRequestStatusWritePersistence: AdminQuoteRequestStatusWritePersistence = {
  updateStatus: updateAdminQuoteRequestStatus
};
