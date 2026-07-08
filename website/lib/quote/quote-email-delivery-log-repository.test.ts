import { describe, expect, it } from "vitest";

import { recordQuoteEmailDeliveryAttempt } from "./quote-email-delivery-log-repository";

function createMockSupabase(error: unknown = null) {
  const inserts: { table: string; rows: unknown }[] = [];
  const client = {
    from(table: string) {
      return {
        async insert(rows: unknown) {
          inserts.push({ table, rows });
          return { data: null, error };
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

describe("quote email delivery log repository", () => {
  it("inserts only safe technical delivery metadata", async () => {
    const { inserts, supabase } = createMockSupabase();

    await expect(
      recordQuoteEmailDeliveryAttempt(
        {
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260612-ABC12345",
          recipientEmail: null,
          provider: "n8n",
          status: "delivered",
          errorCode: null,
          requestId: "route-request-1"
        },
        {
          workspaceId: "11111111-1111-4111-8111-111111111111",
          supabase
        }
      )
    ).resolves.toEqual({ ok: true });

    expect(inserts).toEqual([
      {
        table: "quote_email_delivery_log",
        rows: {
          workspace_id: "11111111-1111-4111-8111-111111111111",
          quote_request_id: "70000000-0000-4000-8000-000000000001",
          public_reference: "QR-20260612-ABC12345",
          recipient_email_redacted: null,
          provider: "n8n",
          delivery_status: "delivered",
          provider_message_id: null,
          error_code: null,
          request_id: "route-request-1"
        }
      }
    ]);
    expect(JSON.stringify(inserts)).not.toContain("Please recommend");
    expect(JSON.stringify(inserts)).not.toContain("Modular lounge set");
  });

  it("fails safely when Supabase or the quote workspace is unavailable", async () => {
    await expect(
      recordQuoteEmailDeliveryAttempt(
        {
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260612-ABC12345",
          recipientEmail: null,
          provider: "n8n",
          status: "not_configured",
          errorCode: "n8n_webhook_not_configured",
          requestId: "route-request-1"
        },
        {
          env: {
            QUOTE_WORKSPACE_ID: ""
          },
          supabase: {
            configured: false,
            client: null,
            missingEnv: ["SUPABASE_URL"]
          }
        }
      )
    ).resolves.toEqual({ ok: false, code: "delivery_log_unavailable" });
  });
});
