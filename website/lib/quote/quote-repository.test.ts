import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createQuoteRequest } from "./quote-repository";
import type { QuoteSubmission } from "./types";

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
  items: [{ productName: "Modular lounge set", quantity: 2, notes: "VIP reception area" }]
};

function createMockSupabase(response: { data: unknown; error: unknown } = {
  data: [{
    quote_request_id: "70000000-0000-4000-8000-000000000001",
    public_reference: "QR-20260527-ABC12345",
    was_created: true,
    handoff_claim_status: "claimed",
    handoff_claim_token: "71000000-0000-4000-8000-000000000001"
  }],
  error: null
}) {
  const calls: Array<{ functionName: string; args: Record<string, unknown> }> = [];
  const client = {
    rpc(functionName: string, args: Record<string, unknown>) {
      calls.push({ functionName, args });
      return Promise.resolve(response);
    }
  };

  return {
    calls,
    supabase: { configured: true as const, client, missingEnv: [] as [] }
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
    const { calls, supabase } = createMockSupabase();
    const result = await createQuoteRequest(quoteSubmission, {
      supabase,
      env: { QUOTE_WORKSPACE_ID: "" }
    });

    expect(result).toEqual({
      ok: false,
      code: "QUOTE_WORKSPACE_NOT_CONFIGURED"
    });
    expect(calls).toEqual([]);
  });

  it("submits the parent and every item snapshot through one atomic RPC", async () => {
    const { calls, supabase } = createMockSupabase();
    const result = await createQuoteRequest(quoteSubmission, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase,
      createId: () => "70000000-0000-4000-8000-000000000001",
      createClaimToken: () => "71000000-0000-4000-8000-000000000001",
      createPublicReference: () => "QR-20260527-ABC12345"
    });

    expect(result).toEqual({
      ok: true,
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345",
      itemPersistenceStatus: "complete",
      wasCreated: true,
      handoffClaimStatus: "claimed",
      handoffClaimToken: "71000000-0000-4000-8000-000000000001"
    });
    expect(calls).toEqual([{
      functionName: "submit_public_quote_request",
      args: {
        p_quote_request_id: "70000000-0000-4000-8000-000000000001",
        p_workspace_id: "11111111-1111-4111-8111-111111111111",
        p_public_reference: "QR-20260527-ABC12345",
        p_customer_name: "Maya Tan",
        p_customer_email: "maya@example.test",
        p_customer_phone: "+65 8123 4567",
        p_customer_message:
          "Please recommend a warm lounge setup for a corporate reception.",
        p_event_date: "2026-06-12",
        p_venue: "Marina Bay Sands",
        p_source_page_path: "/catalogue/modular-lounge-set",
        p_source_listing_slug: "modular-lounge-set",
        p_submission_request_id: "visitor-submission-20260612-001",
        p_items: [{
          product_name_snapshot: "Modular lounge set",
          quantity: 2,
          notes: "VIP reception area"
        }],
        p_handoff_claim_token: "71000000-0000-4000-8000-000000000001"
      }
    }]);
  });

  it("normalizes RPC errors without exposing customer input", async () => {
    const { supabase } = createMockSupabase({
      data: null,
      error: new Error("database rejected Maya Tan maya@example.test")
    });
    const result = await createQuoteRequest(quoteSubmission, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase
    });

    expect(result).toEqual({ ok: false, code: "QUOTE_PERSISTENCE_FAILED" });
    expect(JSON.stringify(result)).not.toContain("Maya");
    expect(JSON.stringify(result)).not.toContain("example.test");
  });

  it("fails closed for a malformed RPC result", async () => {
    const { supabase } = createMockSupabase({ data: [], error: null });
    const result = await createQuoteRequest(quoteSubmission, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase
    });

    expect(result).toEqual({ ok: false, code: "QUOTE_PERSISTENCE_FAILED" });
  });

  it("returns persisted identifiers and replay state for a matching retry", async () => {
    const { supabase } = createMockSupabase({
      data: [{
        quote_request_id: "70000000-0000-4000-8000-000000000099",
        public_reference: "QR-20260527-EXISTING",
        was_created: false,
        handoff_claim_status: "completed",
        handoff_claim_token: null
      }],
      error: null
    });
    const result = await createQuoteRequest(quoteSubmission, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase,
      createId: () => "70000000-0000-4000-8000-000000000002",
      createPublicReference: () => "QR-20260527-NEWVALUE"
    });

    expect(result).toEqual({
      ok: true,
      quoteRequestId: "70000000-0000-4000-8000-000000000099",
      publicReference: "QR-20260527-EXISTING",
      itemPersistenceStatus: "complete",
      wasCreated: false,
      handoffClaimStatus: "completed",
      handoffClaimToken: null
    });
  });

  it("keeps production quote persistence server-only and quote-scoped", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/quote/quote-repository.ts"),
      "utf8"
    );

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createServerSupabaseClient");
    expect(source).toContain('rpc("submit_public_quote_request"');
    expect(source).not.toContain('.from("quote_requests")');
    expect(source).not.toContain('.from("quote_request_items")');
    expect(source).not.toContain('from("products")');
    expect(source).not.toContain('from("categories")');
    expect(source).not.toContain('from("product_images")');
    expect(source).not.toContain('from("conversations")');
    expect(source).not.toContain('from("messages")');
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
  });
});
