import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  updateAdminQuoteRequestStatus,
  type AdminQuoteRequestStatusWriteSupabaseClient
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

function createSupabase(result: MutationResult = {
  data: {
    id: quoteRequestId
  },
  error: null
}) {
  const calls: Array<{
    step: string;
    args: unknown[];
  }> = [];
  const builder = {
    eq: vi.fn((column: string, value: string) => {
      calls.push({
        step: "eq",
        args: [column, value]
      });

      return builder;
    }),
    select: vi.fn((columns: string) => {
      calls.push({
        step: "select",
        args: [columns]
      });

      return {
        single: vi.fn(async () => result)
      };
    })
  };
  const client: AdminQuoteRequestStatusWriteSupabaseClient = {
    from: vi.fn((table) => {
      calls.push({
        step: "from",
        args: [table]
      });

      return {
        update: vi.fn((payload: Record<string, unknown>) => {
          calls.push({
            step: "update",
            args: [payload]
          });

          return builder;
        })
      };
    })
  };

  return {
    calls,
    client
  };
}

describe("admin quote request status write boundary", () => {
  it("updates only quote_requests.status for the trusted workspace", async () => {
    const { calls, client } = createSupabase();

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
        step: "from",
        args: ["quote_requests"]
      },
      {
        step: "update",
        args: [
          {
            status: "reviewing"
          }
        ]
      },
      {
        step: "eq",
        args: ["id", quoteRequestId]
      },
      {
        step: "eq",
        args: ["workspace_id", workspaceId]
      },
      {
        step: "select",
        args: ["id"]
      }
    ]);
    expect(JSON.stringify(calls)).not.toContain("customer_name");
    expect(JSON.stringify(calls)).not.toContain("quote_request_items");
  });

  it.each(["new", "reviewing", "quoted", "closed", "archived"] as const)(
    "accepts %s as a quote request status",
    async (status) => {
      const { client } = createSupabase();

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
          client: createSupabase().client,
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
          client: createSupabase().client,
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
          client: createSupabase().client,
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
          client: createSupabase({
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
    expect(source).toContain('from("quote_requests")');
    expect(source).toContain(".update(");
    expect(source).toContain('status');
    expect(source).not.toContain("quote_request_items");
    expect(source).not.toContain("customer_name");
    expect(source).not.toContain("customer_email");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("chat-config");
    expect(publicSources).not.toContain("admin-quote-request-status-write");
  });
});
