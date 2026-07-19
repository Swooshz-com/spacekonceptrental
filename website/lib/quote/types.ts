import type { SupabaseServerEnvName } from "../supabase/env";

export type QuoteItemSubmission = {
  productName: string;
  quantity: number;
  notes?: string;
};

export type QuoteSubmission = {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerMessage?: string;
  eventDate?: string;
  venue?: string;
  sourcePath?: string;
  listingSlug?: string;
  requestId?: string;
  items: QuoteItemSubmission[];
};

export type CrmProvider = "hubspot";

export type CrmSyncStatus =
  | "not_queued"
  | "queued"
  | "synced"
  | "failed";

export type QuotePersistencePayload = QuoteSubmission & {
  sourcePagePath: string | null;
  sourceListingSlug: string | null;
  submissionRequestId: string | null;
  crmProvider: CrmProvider;
  crmSyncStatus: CrmSyncStatus;
  crmContactId: string | null;
  crmDealId: string | null;
  crmLastSyncAttemptAt: string | null;
  crmSyncError: string | null;
};

export type QuotePersistenceResult =
  | {
      ok: true;
      quoteRequestId: string;
      publicReference: string;
      itemPersistenceStatus?: "complete";
    }
  | {
      ok: false;
      code: "SUPABASE_NOT_CONFIGURED";
      missingEnv: readonly SupabaseServerEnvName[];
    }
  | {
      ok: false;
      code: "QUOTE_WORKSPACE_NOT_CONFIGURED" | "QUOTE_PERSISTENCE_FAILED";
    };
