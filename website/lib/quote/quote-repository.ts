import "server-only";

import { createServerSupabaseClient } from "../supabase/server";
import type { SupabaseServerEnvName } from "../supabase/env";
import type { QuotePersistenceResult, QuoteSubmission } from "./types";

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

const workspaceIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function defaultCreateId() {
  return crypto.randomUUID();
}

function defaultCreatePublicReference() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  return `QR-${datePart}-${randomPart.toUpperCase()}`;
}

function readWorkspaceId(options: QuoteRepositoryOptions) {
  const workspaceId =
    options.workspaceId ??
    options.env?.QUOTE_WORKSPACE_ID ??
    process.env.QUOTE_WORKSPACE_ID;
  const trimmed = workspaceId?.trim();

  return trimmed && workspaceIdPattern.test(trimmed) ? trimmed : undefined;
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
  const quoteInsert = await supabase.client.from("quote_requests").insert({
    id: quoteRequestId,
    workspace_id: workspaceId,
    public_reference: publicReference,
    customer_name: quote.customerName,
    customer_email: quote.customerEmail ?? null,
    customer_phone: quote.customerPhone ?? null,
    customer_message: quote.customerMessage ?? null,
    event_date: quote.eventDate ?? null,
    venue: quote.venue ?? null,
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
