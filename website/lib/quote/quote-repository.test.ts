import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createQuoteRequest } from "./quote-repository";
import type { QuoteSubmission } from "./types";

const quoteSubmission: QuoteSubmission = {
  customerName: "Maya Tan",
  customerEmail: "maya@example.test",
  customerPhone: "+65 8123 4567",
  customerMessage: "Please recommend a warm lounge setup.",
  eventDate: "2026-06-12",
  venue: "Marina Bay Sands",
  sourcePath: "/catalogue/modular-lounge-set",
  listingSlug: "modular-lounge-set",
  requestId: "visitor-submission-20260612-001",
  items: [{ productName: "Modular lounge set", quantity: 2 }]
};
const payloadDigest = "d".repeat(64);
const proof = {
  payloadDigest,
  expiresAt: 1_784_592_060,
  signature: "e".repeat(64)
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
      return Promise.resolve(
        functionName === "get_public_quote_submission_digest"
          ? { data: payloadDigest, error: null }
          : response
      );
    }
  };
  return { calls, supabase: { configured: true as const, client, missingEnv: [] as [] } };
}

function validOptions(supabase: ReturnType<typeof createMockSupabase>["supabase"]) {
  return {
    workspaceId: "11111111-1111-4111-8111-111111111111",
    supabase,
    createId: () => "70000000-0000-4000-8000-000000000001",
    createClaimToken: () => "71000000-0000-4000-8000-000000000001",
    createPublicReference: () => "QR-20260527-ABC12345",
    issueAdmissionProof: () => proof
  };
}

describe("quote repository", () => {
  it("fails safely when Supabase or the quote workspace is unavailable", async () => {
    await expect(createQuoteRequest(quoteSubmission, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase: { configured: false, client: null, missingEnv: ["SUPABASE_URL"] }
    })).resolves.toEqual({ ok: false, code: "SUPABASE_NOT_CONFIGURED", missingEnv: ["SUPABASE_URL"] });

    const { calls, supabase } = createMockSupabase();
    await expect(createQuoteRequest(quoteSubmission, { supabase, env: { QUOTE_WORKSPACE_ID: "" } })).resolves.toEqual({ ok: false, code: "QUOTE_WORKSPACE_NOT_CONFIGURED" });
    expect(calls).toEqual([]);
  });

  it("gets a database-canonical digest, signs it, then uses one atomic mutation RPC", async () => {
    const { calls, supabase } = createMockSupabase();
    const result = await createQuoteRequest(quoteSubmission, validOptions(supabase));
    expect(result).toMatchObject({ ok: true, itemPersistenceStatus: "complete", handoffClaimStatus: "claimed" });
    expect(calls.map((call) => call.functionName)).toEqual([
      "get_public_quote_submission_digest",
      "submit_public_quote_request"
    ]);
    expect(calls[1]?.args).toMatchObject({
      p_submission_request_id: quoteSubmission.requestId,
      p_admission_payload_digest: payloadDigest,
      p_admission_expires_at: proof.expiresAt,
      p_admission_signature: proof.signature,
      p_items: [{ product_name_snapshot: "Modular lounge set", quantity: 2, notes: null }]
    });
  });

  it("preserves payload-bound idempotent completed replay results", async () => {
    const replay = createMockSupabase({
      data: [{
        quote_request_id: "70000000-0000-4000-8000-000000000001",
        public_reference: "QR-20260527-ABC12345",
        was_created: false,
        handoff_claim_status: "completed",
        handoff_claim_token: null
      }],
      error: null
    });
    await expect(
      createQuoteRequest(quoteSubmission, validOptions(replay.supabase))
    ).resolves.toMatchObject({ ok: true, handoffClaimStatus: "completed" });
    expect(replay.calls.map((call) => call.functionName)).toEqual([
      "get_public_quote_submission_digest",
      "submit_public_quote_request"
    ]);
  });

  it("fails closed before durable mutation when proof issuance is unavailable", async () => {
    const { calls, supabase } = createMockSupabase();
    const result = await createQuoteRequest(quoteSubmission, {
      ...validOptions(supabase),
      issueAdmissionProof: () => null
    });
    expect(result).toEqual({ ok: false, code: "QUOTE_PERSISTENCE_FAILED" });
    expect(calls.map((call) => call.functionName)).toEqual(["get_public_quote_submission_digest"]);
  });

  it("normalizes mutation errors and malformed results", async () => {
    const failed = createMockSupabase({ data: null, error: new Error("private database details") });
    await expect(createQuoteRequest(quoteSubmission, validOptions(failed.supabase))).resolves.toEqual({ ok: false, code: "QUOTE_PERSISTENCE_FAILED" });
    const malformed = createMockSupabase({ data: [], error: null });
    await expect(createQuoteRequest(quoteSubmission, validOptions(malformed.supabase))).resolves.toEqual({ ok: false, code: "QUOTE_PERSISTENCE_FAILED" });
  });

  it("keeps quote admission and persistence server-only without a service role", () => {
    const source = readFileSync(resolve(process.cwd(), "lib/quote/quote-repository.ts"), "utf8");
    expect(source).toContain('import "server-only";');
    expect(source).toContain('"get_public_quote_submission_digest"');
    expect(source).toContain('rpc("submit_public_quote_request"');
    expect(source).not.toContain('.from("quote_requests")');
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
  });
});
