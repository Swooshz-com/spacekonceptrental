import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { updateAdminQuoteRequestCrmHandoffStatus } from "./admin-quote-request-crm-handoff-write";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const quoteRequestId = "22222222-2222-4222-8222-222222222222";
const adminContext = {
  workspaceId,
  adminUserId: "33333333-3333-4333-8333-333333333333",
  membershipId: "44444444-4444-4444-8444-444444444444",
  resolution: "server-auth-membership" as const
};

type MutationResult = {
  data: unknown;
  error: unknown;
};

function createRpcSupabase(
  result: MutationResult = {
    data: quoteRequestId,
    error: null
  }
) {
  const calls: Array<{
    fn: string;
    args: Record<string, unknown>;
  }> = [];
  const client = {
    rpc(fn: string, args: Record<string, unknown>) {
      calls.push({
        fn,
        args
      });

      return {
        single: vi.fn(async () => result)
      };
    }
  };

  return {
    calls,
    client: client as never
  };
}

describe("admin quote request CRM handoff queue write boundary", () => {
  it("marks an enquiry as locally queued for future CRM handoff", async () => {
    const { calls, client } = createRpcSupabase();

    await expect(
      updateAdminQuoteRequestCrmHandoffStatus(
        {
          admin: adminContext,
          quoteRequestId,
          crmSyncStatus: "queued"
        },
        {
          supabase: {
            configured: true,
            client,
            missingEnv: []
          }
        }
      )
    ).resolves.toStrictEqual({
      ok: true,
      record: {
        id: quoteRequestId,
        type: "quoteRequest",
        crmProvider: "hubspot",
        crmSyncStatus: "queued"
      }
    });

    expect(calls).toStrictEqual([
      {
        fn: "execute_admin_quote_crm_handoff_queue_update",
        args: {
          p_quote_request_id: quoteRequestId,
          p_workspace_id: workspaceId,
          p_crm_provider: "hubspot",
          p_crm_sync_status: "queued"
        }
      }
    ]);
  });

  it("returns an enquiry to not queued without touching customer or triage fields", async () => {
    const { calls, client } = createRpcSupabase();

    await expect(
      updateAdminQuoteRequestCrmHandoffStatus(
        {
          admin: adminContext,
          quoteRequestId,
          crmSyncStatus: "not_queued"
        },
        {
          supabase: {
            configured: true,
            client,
            missingEnv: []
          }
        }
      )
    ).resolves.toMatchObject({
      ok: true,
      record: {
        crmSyncStatus: "not_queued"
      }
    });

    expect(JSON.stringify(calls)).not.toContain("customer_name");
    expect(JSON.stringify(calls)).not.toContain("customer_email");
    expect(JSON.stringify(calls)).not.toContain("customer_phone");
    expect(JSON.stringify(calls)).not.toContain("customer_message");
    expect(JSON.stringify(calls)).not.toContain("p_status");
    expect(JSON.stringify(calls)).not.toContain("crm_contact_id");
    expect(JSON.stringify(calls)).not.toContain("crm_deal_id");
    expect(JSON.stringify(calls)).not.toContain("crm_last_sync_attempt_at");
  });

  it("prepares retry from failed to queued without provider calls or sync timestamps", async () => {
    const { calls, client } = createRpcSupabase();

    await expect(
      updateAdminQuoteRequestCrmHandoffStatus(
        {
          admin: adminContext,
          quoteRequestId,
          crmSyncStatus: "queued"
        },
        {
          supabase: {
            configured: true,
            client,
            missingEnv: []
          }
        }
      )
    ).resolves.toMatchObject({
      ok: true,
      record: {
        crmSyncStatus: "queued"
      }
    });

    const serialized = JSON.stringify(calls);

    expect(serialized).not.toContain("hubapi");
    expect(serialized).not.toContain("n8n");
    expect(serialized).not.toContain("send");
    expect(serialized).not.toContain("crm_last_sync_attempt_at");
  });

  it("rejects invalid CRM handoff status and provider values", async () => {
    const { client } = createRpcSupabase();

    await expect(
      updateAdminQuoteRequestCrmHandoffStatus(
        {
          admin: adminContext,
          quoteRequestId,
          crmSyncStatus: "synced" as never
        },
        {
          supabase: {
            configured: true,
            client,
            missingEnv: []
          }
        }
      )
    ).resolves.toStrictEqual({
      ok: false,
      code: "QUOTE_CRM_HANDOFF_STATUS_UPDATE_FAILED"
    });

    await expect(
      updateAdminQuoteRequestCrmHandoffStatus(
        {
          admin: adminContext,
          quoteRequestId,
          crmProvider: "salesforce" as never,
          crmSyncStatus: "queued"
        },
        {
          supabase: {
            configured: true,
            client,
            missingEnv: []
          }
        }
      )
    ).resolves.toStrictEqual({
      ok: false,
      code: "QUOTE_CRM_HANDOFF_STATUS_UPDATE_FAILED"
    });
  });

  it("fails safely without leaking SQL, internal, or provider errors", async () => {
    const result = await updateAdminQuoteRequestCrmHandoffStatus(
      {
        admin: adminContext,
        quoteRequestId,
        crmSyncStatus: "queued"
      },
      {
        supabase: {
          configured: true,
          client: createRpcSupabase({
            data: null,
            error: new Error("sql hubspot token env stack workspace-secret")
          }).client,
          missingEnv: []
        }
      }
    );

    expect(result).toStrictEqual({
      ok: false,
      code: "QUOTE_CRM_HANDOFF_STATUS_UPDATE_FAILED"
    });

    const serialized = JSON.stringify(result).toLowerCase();

    for (const leakedTerm of [
      "sql",
      "hubspot",
      "token",
      "env",
      "stack",
      "workspace-secret"
    ]) {
      expect(serialized).not.toContain(leakedTerm);
    }
  });

  it("keeps CRM handoff queue writes server-only and separate from public routes", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "lib/quote/admin-write/admin-quote-request-crm-handoff-write.ts"
      ),
      "utf8"
    );
    const publicSources = [
      readFileSync(resolve(process.cwd(), "app/api/quote/route.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/quote/page.tsx"), "utf8")
    ].join("\n");

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).toContain("execute_admin_quote_crm_handoff_queue_update");
    expect(source).toContain("not_queued");
    expect(source).toContain("queued");
    expect(source).toContain("failed");
    expect(source).not.toContain("hubapi");
    expect(source).not.toContain("hubspot/api-client");
    expect(source).not.toContain(`N8N_CHAT_${"WEBHOOK_URL"}`);
    expect(source).not.toContain("new " + "Resend");
    expect(source).not.toContain("crm_contact_id:");
    expect(source).not.toContain("crm_deal_id:");
    expect(source).not.toContain("crm_last_sync_attempt_at:");
    expect(source).not.toContain("SUPABASE_" + "SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_" + "SUPABASE");
    expect(publicSources).not.toContain("admin-quote-request-crm-handoff-write");
  });
});
