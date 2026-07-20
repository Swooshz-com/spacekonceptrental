import { describe, expect, it } from "vitest";
import { finalizeQuoteHandoff } from "./quote-handoff-repository";

const input = {
  quoteRequestId: "70000000-0000-4000-8000-000000000001",
  submissionRequestId: "visitor-submission-20260612-001",
  claimToken: "71000000-0000-4000-8000-000000000001",
  delivery: { status: "delivered" as const, requestId: "route-request-1", providerMessageId: "n8n-message-1" }
};

describe("quote handoff repository", () => {
  it("finalizes only the exact durable claim through the narrow RPC", async () => {
    const calls: unknown[] = [];
    const result = await finalizeQuoteHandoff(input, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase: {
        configured: true,
        missingEnv: [],
        client: {
          async rpc(functionName, args) {
            calls.push({ functionName, args });
            return { data: true, error: null };
          }
        }
      }
    });

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual([{
      functionName: "finalize_public_quote_handoff",
      args: {
        p_quote_request_id: input.quoteRequestId,
        p_workspace_id: "11111111-1111-4111-8111-111111111111",
        p_submission_request_id: input.submissionRequestId,
        p_claim_token: input.claimToken,
        p_outcome: "completed",
        p_delivery_status: "delivered",
        p_provider_message_id: "n8n-message-1",
        p_error_code: null,
        p_request_id: "route-request-1"
      }
    }]);
  });

  it("normalizes provider errors and does not expose their details", async () => {
    const result = await finalizeQuoteHandoff(input, {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      supabase: {
        configured: true,
        missingEnv: [],
        client: {
          async rpc() {
            return { data: null, error: new Error("private database details") };
          }
        }
      }
    });

    expect(result).toEqual({
      ok: false,
      code: "QUOTE_HANDOFF_FINALIZATION_FAILED"
    });
    expect(JSON.stringify(result)).not.toContain("private database details");
  });
});
