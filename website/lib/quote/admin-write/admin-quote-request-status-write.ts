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

type QuoteRequestStatusUpdateBuilder = {
  eq(column: string, value: string): QuoteRequestStatusUpdateBuilder;
  select(columns: string): {
    single(): Promise<MutationResult>;
  };
};

export type AdminQuoteRequestStatusWriteSupabaseClient = {
  from(table: "quote_requests"): {
    update(payload: {
      status: AdminQuoteRequestStatus;
    }): QuoteRequestStatusUpdateBuilder;
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

  const supabase = options.supabase ?? (await createDefaultSupabase());

  if (!supabase.configured) {
    return failure("QUOTE_STATUS_UPDATE_UNAVAILABLE");
  }

  try {
    const result = await supabase.client
      .from("quote_requests")
      .update({
        status: input.status
      })
      .eq("id", input.quoteRequestId.trim())
      .eq("workspace_id", input.admin.workspaceId)
      .select("id")
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
