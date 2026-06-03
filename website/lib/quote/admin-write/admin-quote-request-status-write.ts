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

export type AdminQuoteRequestStatusWriteSupabaseClient = {
  rpc(
    fn: "execute_admin_quote_workflow",
    args: {
      p_quote_request_id: string;
      p_workspace_id: string;
      p_status: AdminQuoteRequestStatus;
      p_internal_note: string | null;
    }
  ): {
    single(): Promise<MutationResult>;
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
    const result = await supabase.client
      .rpc("execute_admin_quote_workflow", {
        p_quote_request_id: input.quoteRequestId.trim(),
        p_workspace_id: input.admin.workspaceId,
        p_status: input.status,
        p_internal_note: internalNote ?? null
      })
      .single();
    const id = resultRecordId(result);

    return id ? success(id) : failure("QUOTE_STATUS_UPDATE_FAILED");
  } catch {
    return failure("QUOTE_STATUS_UPDATE_FAILED");
  }
}

export const adminQuoteRequestStatusWritePersistence: AdminQuoteRequestStatusWritePersistence = {
  updateStatus: updateAdminQuoteRequestStatus
};
