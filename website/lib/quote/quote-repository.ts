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
  from: (table: string) => {
    insert: (rows: unknown) => Promise<SupabaseMutationResult>;
  };
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
  const quoteInsert = await supabase.client.from("quote_requests").insert({
    id: quoteRequestId,
    workspace_id: workspaceId,
    public_reference: publicReference,
    customer_name: quotePayload.customerName,
    customer_email: quotePayload.customerEmail ?? null,
    customer_phone: quotePayload.customerPhone ?? null,
    customer_message: quotePayload.customerMessage ?? null,
    event_date: quotePayload.eventDate ?? null,
    venue: quotePayload.venue ?? null,
    source_page_path: quotePayload.sourcePagePath,
    source_listing_slug: quotePayload.sourceListingSlug,
    submission_request_id: quotePayload.submissionRequestId,
    crm_provider: quotePayload.crmProvider,
    crm_sync_status: quotePayload.crmSyncStatus,
    crm_contact_id: quotePayload.crmContactId,
    crm_deal_id: quotePayload.crmDealId,
    crm_last_sync_attempt_at: quotePayload.crmLastSyncAttemptAt,
    crm_sync_error: quotePayload.crmSyncError,
    status: "new",
    source: "website"
  });

  if (quoteInsert.error) {
    return {
      ok: false,
      code: "QUOTE_PERSISTENCE_FAILED"
    };
  }

  if (quote.items.length > 0) {
    const itemRows = quote.items.map((item) => ({
      workspace_id: workspaceId,
      quote_request_id: quoteRequestId,
      product_name_snapshot: item.productName,
      quantity: item.quantity,
      notes: item.notes ?? null
    }));
    const itemInsert = await supabase.client
      .from("quote_request_items")
      .insert(itemRows);

    if (itemInsert.error) {
      return {
        ok: true,
        quoteRequestId,
        publicReference,
        itemPersistenceStatus: "failed"
      };
    }
  }

  return {
    ok: true,
    quoteRequestId,
    publicReference,
    itemPersistenceStatus: "complete"
  };
}
