import "server-only";

import { getQuoteWorkspaceId } from "../server-runtime-config";
import { createServerSupabaseClient } from "../supabase/server";
import type { SupabaseServerEnvName } from "../supabase/env";
import type { QuoteEmailDeliveryLogInput } from "./email-handoff";

type SupabaseMutationResult = {
  data: unknown;
  error: unknown;
};

type QuoteEmailDeliveryLogSupabaseClient = {
  from: (table: string) => {
    insert: (rows: unknown) => Promise<SupabaseMutationResult>;
  };
};

type QuoteEmailDeliveryLogSupabaseResult =
  | {
      configured: true;
      client: QuoteEmailDeliveryLogSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      missingEnv: readonly SupabaseServerEnvName[];
    };

type QuoteEmailDeliveryLogOptions = {
  workspaceId?: string;
  supabase?: QuoteEmailDeliveryLogSupabaseResult;
  env?: {
    QUOTE_WORKSPACE_ID?: string | null;
  };
};

const maxProviderMessageIdLength = 120;
const maxErrorCodeLength = 80;

function readWorkspaceId(options: QuoteEmailDeliveryLogOptions) {
  if (options.workspaceId !== undefined) {
    return (
      getQuoteWorkspaceId({
        QUOTE_WORKSPACE_ID: options.workspaceId
      }) ?? undefined
    );
  }

  return getQuoteWorkspaceId(options.env ?? process.env) ?? undefined;
}

function getSupabase(options: QuoteEmailDeliveryLogOptions = {}) {
  return (
    options.supabase ??
    (createServerSupabaseClient() as QuoteEmailDeliveryLogSupabaseResult)
  );
}

function redactEmail(value: string | null) {
  if (!value) {
    return null;
  }

  const [localPart, domain] = value.toLowerCase().split("@");
  const prefix = localPart?.slice(0, 2) || "";

  return domain ? `${prefix}***@${domain}` : "***";
}

function boundedText(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();

  return normalized ? normalized.slice(0, maxLength) : null;
}

export async function recordQuoteEmailDeliveryAttempt(
  input: QuoteEmailDeliveryLogInput,
  options: QuoteEmailDeliveryLogOptions = {}
): Promise<{ ok: true } | { ok: false; code: "delivery_log_unavailable" }> {
  const supabase = getSupabase(options);
  const workspaceId = readWorkspaceId(options);

  if (!supabase.configured || !workspaceId) {
    return {
      ok: false,
      code: "delivery_log_unavailable"
    };
  }

  try {
    const result = await supabase.client.from("quote_email_delivery_log").insert({
      workspace_id: workspaceId,
      quote_request_id: input.quoteRequestId,
      public_reference: input.publicReference,
      recipient_email_redacted: redactEmail(input.recipientEmail),
      provider: input.provider,
      delivery_status: input.status,
      provider_message_id: boundedText(
        input.providerMessageId,
        maxProviderMessageIdLength
      ),
      error_code: boundedText(input.errorCode ?? undefined, maxErrorCodeLength),
      request_id: input.requestId
    });

    return result.error
      ? {
          ok: false,
          code: "delivery_log_unavailable"
        }
      : {
          ok: true
        };
  } catch {
    return {
      ok: false,
      code: "delivery_log_unavailable"
    };
  }
}
