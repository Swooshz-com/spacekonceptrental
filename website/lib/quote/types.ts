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
  items: QuoteItemSubmission[];
};

export type QuotePersistenceResult =
  | {
      ok: true;
      quoteRequestId: string;
      publicReference: string;
      itemPersistenceStatus?: "complete" | "failed";
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
