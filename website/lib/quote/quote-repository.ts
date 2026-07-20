import "server-only";

import { getQuoteWorkspaceId } from "../server-runtime-config";
import { createServerSupabaseClient } from "../supabase/server";
import type { SupabaseServerEnvName } from "../supabase/env";
import type { QuotePersistenceResult, QuoteSubmission } from "./types";
import { prepareQuoteForPersistence } from "./validation";

type SupabaseMutationResult = {
  data: unknown;
  error: unknown;
};

type QuoteSupabaseClient = {
  rpc: (
    functionName: "submit_public_quote_request",
    args: Record<string, unknown>
  ) => Promise<SupabaseMutationResult>;
};

type QuoteRpcRow = {
  quote_request_id: string;
  public_reference: string;
  was_created: boolean;
};

type QuoteSupabaseResult =
  | {
      configured: true;
      client: QuoteSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      missingEnv: SupabaseServerEnvName[];
    };

type QuoteRepositoryOptions = {
  workspaceId?: string;
  supabase?: QuoteSupabaseResult;
  createId?: () => string;
  createPublicReference?: () => string;
  env?: {
    QUOTE_WORKSPACE_ID?: string;
  };
};

function defaultCreateId() {
  return crypto.randomUUID();
}

function defaultCreatePublicReference() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  return `QR-${datePart}-${randomPart.toUpperCase()}`;
}

function readWorkspaceId(options: QuoteRepositoryOptions) {
  if (options.workspaceId !== undefined) {
    return (
      getQuoteWorkspaceId({
        QUOTE_WORKSPACE_ID: options.workspaceId
      }) ?? undefined
    );
  }

  return getQuoteWorkspaceId(options.env ?? process.env) ?? undefined;
}

function getSupabase(options: QuoteRepositoryOptions = {}) {
  return (
    options.supabase ?? (createServerSupabaseClient() as QuoteSupabaseResult)
  );
}

export async function createQuoteRequest(
  quote: QuoteSubmission,
  options: QuoteRepositoryOptions = {}
): Promise<QuotePersistenceResult> {
  const supabase = getSupabase(options);

  if (!supabase.configured) {
    return {
      ok: false,
      code: "SUPABASE_NOT_CONFIGURED",
      missingEnv: supabase.missingEnv
    };
  }

  const workspaceId = readWorkspaceId(options);

  if (!workspaceId) {
    return {
      ok: false,
      code: "QUOTE_WORKSPACE_NOT_CONFIGURED"
    };
  }

  const quoteRequestId = (options.createId ?? defaultCreateId)();
  const publicReference =
    (options.createPublicReference ?? defaultCreatePublicReference)();
  const quotePayload = prepareQuoteForPersistence(quote);
  const rpcResult = await supabase.client.rpc("submit_public_quote_request", {
    p_quote_request_id: quoteRequestId,
    p_workspace_id: workspaceId,
    p_public_reference: publicReference,
    p_customer_name: quotePayload.customerName,
    p_customer_email: quotePayload.customerEmail ?? null,
    p_customer_phone: quotePayload.customerPhone ?? null,
    p_customer_message: quotePayload.customerMessage ?? null,
    p_event_date: quotePayload.eventDate ?? null,
    p_venue: quotePayload.venue ?? null,
    p_source_page_path: quotePayload.sourcePagePath,
    p_source_listing_slug: quotePayload.sourceListingSlug,
    p_submission_request_id: quotePayload.submissionRequestId,
    p_items: quote.items.map((item) => ({
      product_name_snapshot: item.productName,
      quantity: item.quantity,
      notes: item.notes ?? null
    }))
  });

  const rows = Array.isArray(rpcResult.data) ? rpcResult.data : [];
  const row = rows.length === 1 ? (rows[0] as Partial<QuoteRpcRow>) : null;

  if (
    rpcResult.error ||
    !row ||
    typeof row.quote_request_id !== "string" ||
    typeof row.public_reference !== "string" ||
    typeof row.was_created !== "boolean"
  ) {
    return {
      ok: false,
      code: "QUOTE_PERSISTENCE_FAILED"
    };
  }

  return {
    ok: true,
    quoteRequestId: row.quote_request_id,
    publicReference: row.public_reference,
    itemPersistenceStatus: "complete",
    wasCreated: row.was_created
  };
}
