import "server-only";

import { getQuoteWorkspaceId } from "../server-runtime-config";
import { createServerSupabaseClient } from "../supabase/server";
import type { SupabaseServerEnvName } from "../supabase/env";
import type { QuoteHandoffFinalizationResult } from "./types";

type QuoteHandoffDelivery =
  | {
      status: "delivered" | "pending";
      requestId: string;
      providerMessageId?: string;
    }
  | {
      status: "failed" | "not_configured";
      requestId: string;
      errorCode: string;
    };

export type QuoteHandoffFinalizationInput = {
  quoteRequestId: string;
  submissionRequestId: string;
  claimToken: string;
  delivery: QuoteHandoffDelivery;
};

type SupabaseRpcResult = { data: unknown; error: unknown };
type QuoteHandoffSupabaseClient = {
  rpc: (
    functionName: "finalize_public_quote_handoff",
    args: Record<string, unknown>
  ) => Promise<SupabaseRpcResult>;
};
type QuoteHandoffSupabaseResult =
  | {
      configured: true;
      client: QuoteHandoffSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      missingEnv: SupabaseServerEnvName[];
    };

type QuoteHandoffRepositoryOptions = {
  workspaceId?: string;
  supabase?: QuoteHandoffSupabaseResult;
  env?: { QUOTE_WORKSPACE_ID?: string };
};

export async function finalizeQuoteHandoff(
  input: QuoteHandoffFinalizationInput,
  options: QuoteHandoffRepositoryOptions = {}
): Promise<QuoteHandoffFinalizationResult> {
  const supabase =
    options.supabase ??
    (createServerSupabaseClient() as QuoteHandoffSupabaseResult);

  if (!supabase.configured) {
    return { ok: false, code: "SUPABASE_NOT_CONFIGURED" };
  }

  const workspaceId =
    options.workspaceId !== undefined
      ? getQuoteWorkspaceId({ QUOTE_WORKSPACE_ID: options.workspaceId })
      : getQuoteWorkspaceId(options.env ?? process.env);

  if (!workspaceId) {
    return { ok: false, code: "QUOTE_WORKSPACE_NOT_CONFIGURED" };
  }

  const result = await supabase.client.rpc("finalize_public_quote_handoff", {
    p_quote_request_id: input.quoteRequestId,
    p_workspace_id: workspaceId,
    p_submission_request_id: input.submissionRequestId,
    p_claim_token: input.claimToken,
    p_outcome:
      input.delivery.status === "delivered" || input.delivery.status === "pending"
        ? "completed"
        : "retryable_failed",
    p_delivery_status: input.delivery.status,
    p_provider_message_id:
      "providerMessageId" in input.delivery
        ? input.delivery.providerMessageId ?? null
        : null,
    p_error_code: "errorCode" in input.delivery ? input.delivery.errorCode : null,
    p_request_id: input.delivery.requestId
  });

  if (result.error || result.data !== true) {
    return { ok: false, code: "QUOTE_HANDOFF_FINALIZATION_FAILED" };
  }

  return { ok: true };
}
