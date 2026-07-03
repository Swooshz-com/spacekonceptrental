import { describe, expect, it } from "vitest";

import { resolveAdminQuoteEmailDeliveryLogRead } from "./admin-quote-email-delivery-log";

function createMockSupabase(rows: unknown[], error: unknown = null) {
  const calls: { table: string; columns?: string; eq?: unknown[]; order?: unknown[]; limit?: number }[] = [];
  const query = {
    eq(column: string, value: string) {
      calls[calls.length - 1].eq = [column, value];
      return query;
    },
    order(column: string, options?: { ascending?: boolean }) {
      calls[calls.length - 1].order = [column, options];
      return query;
    },
    async limit(count: number) {
      calls[calls.length - 1].limit = count;
      return { data: rows, error };
    }
  };
  const client = {
    from(table: "quote_email_delivery_log") {
      calls.push({ table });
      return {
        select(columns: string) {
          calls[calls.length - 1].columns = columns;
          return query;
        }
      };
    }
  };

  return {
    calls,
    supabase: {
      configured: true as const,
      client,
      missingEnv: [] as []
    }
  };
}

describe("admin quote email delivery log read", () => {
  it("reads bounded technical delivery records for the trusted workspace", async () => {
    const { calls, supabase } = createMockSupabase([
      {
        id: "80000000-0000-4000-8000-000000000001",
        quote_request_id: "70000000-0000-4000-8000-000000000001",
        public_reference: "QR-20260612-ABC12345",
        attempted_at: "2026-06-12T09:30:00.000Z",
        recipient_email_redacted: "ev***@spacekoncept.example",
        provider: "resend",
        delivery_status: "sent",
        provider_message_id: "resend-message-1",
        error_code: null,
        request_id: "route-request-1"
      }
    ]);

    const result = await resolveAdminQuoteEmailDeliveryLogRead({
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: "11111111-1111-4111-8111-111111111111"
      },
      supabase
    });

    expect(result).toEqual({
      status: "loaded",
      records: [
        {
          id: "80000000-0000-4000-8000-000000000001",
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260612-ABC12345",
          attemptedAt: "2026-06-12T09:30:00.000Z",
          recipientEmail: "ev***@spacekoncept.example",
          provider: "resend",
          deliveryStatus: "sent",
          providerMessageId: "resend-message-1",
          errorCode: undefined,
          requestId: "route-request-1"
        }
      ]
    });
    expect(calls).toEqual([
      {
        table: "quote_email_delivery_log",
        columns:
          "id, quote_request_id, public_reference, attempted_at, recipient_email_redacted, provider, delivery_status, provider_message_id, error_code, request_id",
        eq: ["workspace_id", "11111111-1111-4111-8111-111111111111"],
        order: ["attempted_at", { ascending: false }],
        limit: 100
      }
    ]);
    expect(JSON.stringify(result)).not.toContain("Please recommend");
    expect(JSON.stringify(result)).not.toContain("Modular lounge set");
  });

  it("keeps not-configured rows with missing recipient visible as technical records", async () => {
    const { supabase } = createMockSupabase([
      {
        id: "80000000-0000-4000-8000-000000000003",
        quote_request_id: "70000000-0000-4000-8000-000000000003",
        public_reference: "QR-20260612-NOTCONF",
        attempted_at: "2026-06-12T09:10:00.000Z",
        recipient_email_redacted: null,
        provider: "resend",
        delivery_status: "not_configured",
        provider_message_id: null,
        error_code: "email_recipient_not_configured",
        request_id: "route-request-not-configured"
      }
    ]);

    const result = await resolveAdminQuoteEmailDeliveryLogRead({
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: "11111111-1111-4111-8111-111111111111"
      },
      supabase
    });

    expect(result).toEqual({
      status: "loaded",
      records: [
        {
          id: "80000000-0000-4000-8000-000000000003",
          quoteRequestId: "70000000-0000-4000-8000-000000000003",
          publicReference: "QR-20260612-NOTCONF",
          attemptedAt: "2026-06-12T09:10:00.000Z",
          recipientEmail: "Not configured",
          provider: "resend",
          deliveryStatus: "not_configured",
          providerMessageId: undefined,
          errorCode: "email_recipient_not_configured",
          requestId: "route-request-not-configured"
        }
      ]
    });
    expect(JSON.stringify(result)).not.toContain("events@spacekoncept.example");
  });

  it("fails closed when the admin read client or workspace is unavailable", async () => {
    await expect(
      resolveAdminQuoteEmailDeliveryLogRead({
        supabase: {
          configured: false,
          client: null,
          reason: "authenticated_admin_read_client_required"
        }
      })
    ).resolves.toEqual({ status: "unavailable" });
  });
});
