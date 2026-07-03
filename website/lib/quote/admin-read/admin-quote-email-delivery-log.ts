import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";
import { getAdminTrustedWorkspaceId } from "../../server-runtime-config";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type AdminQuoteEmailDeliveryLogReadFilter = {
  eq(column: string, value: string): AdminQuoteEmailDeliveryLogReadFilter;
  order(
    column: string,
    options?: {
      ascending?: boolean;
    }
  ): AdminQuoteEmailDeliveryLogReadFilter;
  limit(count: number): Promise<QueryResult>;
};

export type AdminQuoteEmailDeliveryLogReadSupabaseClient = {
  from(table: "quote_email_delivery_log"): {
    select(columns: string): AdminQuoteEmailDeliveryLogReadFilter;
  };
};

export type AdminQuoteEmailDeliveryLogReadSupabaseClientResult =
  | {
      configured: true;
      client: AdminQuoteEmailDeliveryLogReadSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_read_client_required";
    };

export type AdminQuoteEmailDeliveryLogRecord = {
  id: string;
  quoteRequestId: string;
  publicReference: string;
  attemptedAt: string;
  recipientEmail: string;
  provider: "resend";
  deliveryStatus: "sent" | "failed" | "not_configured";
  providerMessageId?: string;
  errorCode?: string;
  requestId: string;
};

export type AdminQuoteEmailDeliveryLogReadResult =
  | {
      status: "loaded";
      records: AdminQuoteEmailDeliveryLogRecord[];
    }
  | {
      status: "unavailable";
    };

type AdminQuoteEmailDeliveryLogReadOptions = {
  supabase?: AdminQuoteEmailDeliveryLogReadSupabaseClientResult;
  env?: {
    ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
  };
};

type DeliveryLogRow = {
  id?: unknown;
  quote_request_id?: unknown;
  public_reference?: unknown;
  attempted_at?: unknown;
  recipient_email_redacted?: unknown;
  provider?: unknown;
  delivery_status?: unknown;
  provider_message_id?: unknown;
  error_code?: unknown;
  request_id?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses = new Set(["sent", "failed", "not_configured"]);
const missingRecipientPlaceholder = "Not configured";

function unavailable(): AdminQuoteEmailDeliveryLogReadResult {
  return {
    status: "unavailable"
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getWorkspaceId(options: AdminQuoteEmailDeliveryLogReadOptions) {
  return getAdminTrustedWorkspaceId(options.env ?? process.env);
}

async function getSupabase(
  options: AdminQuoteEmailDeliveryLogReadOptions
): Promise<AdminQuoteEmailDeliveryLogReadSupabaseClientResult> {
  if (options.supabase) {
    return options.supabase;
  }

  const supabase = await createSessionBoundSupabaseAdminReadClient();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AdminQuoteEmailDeliveryLogReadSupabaseClient,
        missingEnv: []
      }
    : {
        configured: false,
        client: null,
        reason: "authenticated_admin_read_client_required"
      };
}

function requireRows(result: QueryResult) {
  if (result.error || !Array.isArray(result.data)) {
    return null;
  }

  return result.data.every(isRecord) ? result.data : null;
}

function toRecord(row: DeliveryLogRow): AdminQuoteEmailDeliveryLogRecord | null {
  const id = isUuid(row.id) ? row.id.trim() : null;
  const quoteRequestId = isUuid(row.quote_request_id)
    ? row.quote_request_id.trim()
    : null;
  const publicReference = getString(row.public_reference);
  const attemptedAt = getString(row.attempted_at);
  const recipientEmail =
    getString(row.recipient_email_redacted) ?? missingRecipientPlaceholder;
  const provider = row.provider === "resend" ? row.provider : null;
  const deliveryStatus =
    typeof row.delivery_status === "string" && statuses.has(row.delivery_status)
      ? row.delivery_status
      : null;
  const requestId = getString(row.request_id);

  if (
    !id ||
    !quoteRequestId ||
    !publicReference ||
    !attemptedAt ||
    !provider ||
    !deliveryStatus ||
    !requestId
  ) {
    return null;
  }

  return {
    id,
    quoteRequestId,
    publicReference,
    attemptedAt,
    recipientEmail,
    provider,
    deliveryStatus: deliveryStatus as AdminQuoteEmailDeliveryLogRecord["deliveryStatus"],
    ...(getString(row.provider_message_id)
      ? { providerMessageId: getString(row.provider_message_id) }
      : {}),
    ...(getString(row.error_code) ? { errorCode: getString(row.error_code) } : {}),
    requestId
  };
}

export async function resolveAdminQuoteEmailDeliveryLogRead(
  options: AdminQuoteEmailDeliveryLogReadOptions = {}
): Promise<AdminQuoteEmailDeliveryLogReadResult> {
  const workspaceId = getWorkspaceId(options);

  if (!workspaceId) {
    return unavailable();
  }

  const supabase = await getSupabase(options);

  if (!supabase.configured) {
    return unavailable();
  }

  try {
    const result = await supabase.client
      .from("quote_email_delivery_log")
      .select(
        "id, quote_request_id, public_reference, attempted_at, recipient_email_redacted, provider, delivery_status, provider_message_id, error_code, request_id"
      )
      .eq("workspace_id", workspaceId)
      .order("attempted_at", { ascending: false })
      .limit(100);
    const rows = requireRows(result);

    if (!rows) {
      return unavailable();
    }

    const records = rows.map(toRecord);

    return records.some((record) => !record)
      ? unavailable()
      : {
          status: "loaded",
          records: records as AdminQuoteEmailDeliveryLogRecord[]
        };
  } catch {
    return unavailable();
  }
}
