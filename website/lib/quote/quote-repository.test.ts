import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createQuoteRequest } from "./quote-repository";
import type { QuoteSubmission } from "./types";

type InsertCall = {
  table: string;
  rows: unknown;
};

const quoteSubmission: QuoteSubmission = {
  customerName: "Maya Tan",
  customerEmail: "maya@example.test",
  customerPhone: "+65 8123 4567",
  customerMessage:
    "Please recommend a warm lounge setup for a corporate reception.",
  eventDate: "2026-06-12",
  venue: "Marina Bay Sands",
  sourcePath: "/catalogue/modular-lounge-set",
  listingSlug: "modular-lounge-set",
  requestId: "visitor-submission-20260612-001",
  items: [
    {
      productName: "Modular lounge set",
      quantity: 2,
      notes: "VIP reception area"
    }
  ]
};

function createMockSupabase(
  responses: Record<string, { data: unknown; error: unknown }> = {}
) {
  const inserts: InsertCall[] = [];
  const client = {
    from(table: string) {
      return {
        insert(rows: unknown) {
          inserts.push({ table, rows });

          return Promise.resolve(
            responses[table] ?? { data: null, error: null }
          );
        }
      };
    }
  };

  return {
    inserts,
    supabase: {
      configured: true as const,
      client,
      missingEnv: [] as []
    }
  };
}

describe("quote repository", () => {
  it("fails safely without pretending persistence succeeded when Supabase is missing", async () => {
    const result = await createQuoteRequest(quoteSubmission, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase: {
        configured: false,
        client: null,
        missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
      }
    });

    expect(result).toEqual({
      ok: false,
      code: "SUPABASE_NOT_CONFIGURED",
      missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
    });
  });

  it("fails safely when the quote workspace is not configured", async () => {
    const { inserts, supabase } = createMockSupabase();

    const result = await createQuoteRequest(quoteSubmission, {
      supabase,
      env: {
        QUOTE_WORKSPACE_ID: ""
      }
    });

    expect(result).toEqual({
      ok: false,
      code: "QUOTE_WORKSPACE_NOT_CONFIGURED"
    });
    expect(inserts).toEqual([]);
  });

  it("inserts quote requests and quote items only into approved quote tables", async () => {
    const { inserts, supabase } = createMockSupabase();

    const result = await createQuoteRequest(quoteSubmission, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase,
      createId: () => "70000000-0000-4000-8000-000000000001",
      createPublicReference: () => "QR-20260527-ABC12345"
    });

    expect(result).toEqual({
      ok: true,
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345",
      itemPersistenceStatus: "complete"
    });
    expect(inserts.map((insert) => insert.table)).toEqual([
      "quote_requests",
      "quote_request_items"
    ]);
    expect(inserts[0].rows).toEqual({
      id: "70000000-0000-4000-8000-000000000001",
      workspace_id: "11111111-1111-4111-8111-111111111111",
      public_reference: "QR-20260527-ABC12345",
      customer_name: "Maya Tan",
      customer_email: "maya@example.test",
      customer_phone: "+65 8123 4567",
      customer_message:
        "Please recommend a warm lounge setup for a corporate reception.",
      event_date: "2026-06-12",
      venue: "Marina Bay Sands",
      source_page_path: "/catalogue/modular-lounge-set",
      source_listing_slug: "modular-lounge-set",
      submission_request_id: "visitor-submission-20260612-001",
      crm_provider: "hubspot",
      crm_sync_status: "not_queued",
      crm_contact_id: null,
      crm_deal_id: null,
      crm_last_sync_attempt_at: null,
      crm_sync_error: null,
      status: "new",
      source: "website"
    });
    expect(inserts[1].rows).toEqual([
      {
        workspace_id: "11111111-1111-4111-8111-111111111111",
        quote_request_id: "70000000-0000-4000-8000-000000000001",
        product_name_snapshot: "Modular lounge set",
        quantity: 2,
        notes: "VIP reception area"
      }
    ]);
  });

  it("normalizes database errors without exposing customer input", async () => {
    const { supabase } = createMockSupabase({
      quote_requests: {
        data: null,
        error: new Error("database rejected Maya Tan maya@example.test")
      }
    });

    const result = await createQuoteRequest(quoteSubmission, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase
    });

    expect(result).toEqual({
      ok: false,
      code: "QUOTE_PERSISTENCE_FAILED"
    });
    expect(JSON.stringify(result)).not.toContain("Maya");
    expect(JSON.stringify(result)).not.toContain("example.test");
  });

  it("fails closed when quote item persistence fails after the quote row is captured", async () => {
    const { inserts, supabase } = createMockSupabase({
      quote_request_items: {
        data: null,
        error: new Error("item insert failed for Maya Tan maya@example.test")
      }
    });

    const result = await createQuoteRequest(quoteSubmission, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase,
      createId: () => "70000000-0000-4000-8000-000000000001",
      createPublicReference: () => "QR-20260527-ABC12345"
    });

    expect(result).toEqual({
      ok: false,
      code: "QUOTE_PERSISTENCE_FAILED"
    });
    expect(inserts.map((insert) => insert.table)).toEqual([
      "quote_requests",
      "quote_request_items"
    ]);
    expect(JSON.stringify(result)).not.toContain("Maya");
    expect(JSON.stringify(result)).not.toContain("example.test");
  });

  it("keeps production quote persistence server-only and quote-scoped", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/quote/quote-repository.ts"),
      "utf8"
    );

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createServerSupabaseClient");
    expect(source).toContain('from("quote_requests")');
    expect(source).toContain('from("quote_request_items")');
    expect(source).not.toContain('from("products")');
    expect(source).not.toContain('from("categories")');
    expect(source).not.toContain('from("product_images")');
    expect(source).not.toContain('from("conversations")');
    expect(source).not.toContain('from("messages")');
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
  });
});
