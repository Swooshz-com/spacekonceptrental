import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  updateAdminQuoteRequestStatus
} from "./admin-quote-request-status-write";

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

function createRpcSupabase(result: MutationResult = {
  data: quoteRequestId,
  error: null
}) {
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

describe("admin quote request status write boundary", () => {
  it("persists internal triage status through a single atomic RPC boundary", async () => {
    const { calls, client } = createRpcSupabase();

    await expect(
      updateAdminQuoteRequestStatus(
        {
          admin: adminContext,
          quoteRequestId,
          status: "follow_up_needed"
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
        type: "quoteRequest"
      }
    });

    expect(calls).toStrictEqual([
      {
        fn: "execute_admin_quote_workflow",
        args: {
          p_quote_request_id: quoteRequestId,
          p_workspace_id: workspaceId,
          p_status: "follow_up_needed",
          p_internal_note: null
        }
      }
    ]);
  });

  it("passes only the narrow quote workflow payload for the trusted workspace", async () => {
    const { calls, client } = createRpcSupabase();

    await expect(
      updateAdminQuoteRequestStatus(
        {
          admin: adminContext,
          quoteRequestId,
          status: "reviewing"
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
        type: "quoteRequest"
      }
    });

    expect(calls).toStrictEqual([
      {
        fn: "execute_admin_quote_workflow",
        args: {
          p_quote_request_id: quoteRequestId,
          p_workspace_id: workspaceId,
          p_status: "reviewing",
          p_internal_note: null
        }
      }
    ]);
    expect(JSON.stringify(calls)).not.toContain("customer_name");
    expect(JSON.stringify(calls)).not.toContain("quote_request_items");
    expect(JSON.stringify(calls)).not.toContain("actor_admin_user_id");
    expect(JSON.stringify(calls)).not.toContain("crm_contact_id");
    expect(JSON.stringify(calls)).not.toContain("crm_deal_id");
    expect(JSON.stringify(calls)).not.toContain("crm_sync_status");
  });

  it.each(["new", "reviewing", "follow_up_needed", "quoted", "closed"] as const)(
    "accepts %s as a quote request status",
    async (status) => {
      const { client } = createRpcSupabase();

      await expect(
        updateAdminQuoteRequestStatus(
          {
            admin: adminContext,
            quoteRequestId,
            status
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
        ok: true
      });
    }
  );

  it("does not pass free-form notes through the triage status update foundation", async () => {
    const { calls, client } = createRpcSupabase();

    await expect(
      updateAdminQuoteRequestStatus(
        {
          admin: adminContext,
          quoteRequestId,
          status: "reviewing",
          internalNote: " Call Maya about sofa quantities. "
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
        type: "quoteRequest"
      }
    });

    expect(calls).toStrictEqual([
      {
        fn: "execute_admin_quote_workflow",
        args: {
          p_quote_request_id: quoteRequestId,
          p_workspace_id: workspaceId,
          p_status: "reviewing",
          p_internal_note: null
        }
      }
    ]);
  });

  it("rejects archive and provider-style statuses for the narrow triage update foundation", async () => {
    const { client } = createRpcSupabase();

    await expect(
      updateAdminQuoteRequestStatus(
        {
          admin: adminContext,
          quoteRequestId,
          status: "archived" as never
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
      code: "QUOTE_STATUS_UPDATE_FAILED"
    });
  });

  it("fails closed for invalid admin context, quote ID, status, missing client, and provider errors", async () => {
    const invalidContext = await updateAdminQuoteRequestStatus(
      {
        admin: {
          ...adminContext,
          workspaceId: "workspace-secret"
        },
        quoteRequestId,
        status: "reviewing"
      },
      {
        supabase: {
          configured: true,
          client: createRpcSupabase().client,
          missingEnv: []
        }
      }
    );
    const invalidQuoteId = await updateAdminQuoteRequestStatus(
      {
        admin: adminContext,
        quoteRequestId: "not-a-uuid",
        status: "reviewing"
      },
      {
        supabase: {
          configured: true,
          client: createRpcSupabase().client,
          missingEnv: []
        }
      }
    );
    const invalidStatus = await updateAdminQuoteRequestStatus(
      {
        admin: adminContext,
        quoteRequestId,
        status: "paid" as never
      },
      {
        supabase: {
          configured: true,
          client: createRpcSupabase().client,
          missingEnv: []
        }
      }
    );
    const unavailable = await updateAdminQuoteRequestStatus(
      {
        admin: adminContext,
        quoteRequestId,
        status: "reviewing"
      },
      {
        supabase: {
          configured: false,
          client: null,
          reason: "authenticated_admin_write_client_required"
        }
      }
    );
    const providerError = await updateAdminQuoteRequestStatus(
      {
        admin: adminContext,
        quoteRequestId,
        status: "reviewing"
      },
      {
        supabase: {
          configured: true,
          client: createRpcSupabase({
            data: null,
            error: new Error(
              "sql supabase stack env token cookie workspace-secret"
            )
          }).client,
          missingEnv: []
        }
      }
    );

    expect(invalidContext).toStrictEqual({
      ok: false,
      code: "QUOTE_ADMIN_CONTEXT_INVALID"
    });
    expect(invalidQuoteId).toStrictEqual({
      ok: false,
      code: "QUOTE_STATUS_UPDATE_FAILED"
    });
    expect(invalidStatus).toStrictEqual({
      ok: false,
      code: "QUOTE_STATUS_UPDATE_FAILED"
    });
    expect(unavailable).toStrictEqual({
      ok: false,
      code: "QUOTE_STATUS_UPDATE_UNAVAILABLE"
    });
    expect(providerError).toStrictEqual({
      ok: false,
      code: "QUOTE_STATUS_UPDATE_FAILED"
    });

    const serialized = JSON.stringify(providerError).toLowerCase();

    for (const leakedTerm of [
      "sql",
      "supabase",
      "stack",
      "env",
      "token",
      "cookie",
      "workspace-secret"
    ]) {
      expect(serialized).not.toContain(leakedTerm);
    }
  });

  it("keeps quote status writes server-only and separate from public routes", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "lib/quote/admin-write/admin-quote-request-status-write.ts"
      ),
      "utf8"
    );
    const publicSources = [
      readFileSync(resolve(process.cwd(), "app/api/quote/route.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/quote/page.tsx"), "utf8")
    ].join("\n");

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).toContain('rpc("execute_admin_quote_workflow"');
    expect(source).toContain('status');
    expect(source).toContain("follow_up_needed");
    expect(source).not.toContain('from("quote_requests")');
    expect(source).not.toContain('from("quote_request_activity")');
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain("quote_request_items");
    expect(source).not.toContain("customer_name");
    expect(source).not.toContain("customer_email");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("chat-config");
    expect(publicSources).not.toContain("admin-quote-request-status-write");
  });
});
