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
        select: vi.fn((columns: string) => {
          calls.push({
            step: "quote_select",
            args: [columns]
          });

          const quoteSelectBuilder = {
            eq: vi.fn((column: string, value: string) => {
              calls.push({
                step: "quote_eq",
                args: [column, value]
              });

              return quoteSelectBuilder;
            }),
            single: vi.fn(async () => ({
              data: {
                id: quoteRequestId,
                status: "new"
              },
              error: null
            }))
          };

          return quoteSelectBuilder;
        }),
        update: vi.fn((payload: Record<string, unknown>) => {
          calls.push({
            step: "update",
            args: [payload]
          });

          return builder;
        }),
        insert: vi.fn((payload: unknown) => {
          calls.push({
            step: "activity_insert",
            args: [payload]
          });

          return {
            select: vi.fn(async (columns: string) => {
              calls.push({
                step: "activity_select",
                args: [columns]
              });

              return {
                data: [
                  {
                    id: "55555555-5555-4555-8555-555555555555"
                  }
                ],
                error: null
              };
            })
          };
        })
      };
    })
  };

  return {
    calls,
    client
  };
}

function createWorkflowSupabase({
  currentStatus = "new",
  updateResult = {
    data: {
      id: quoteRequestId
    },
    error: null
  },
  activityResult = {
    data: [
      {
        id: "55555555-5555-4555-8555-555555555555"
      },
      {
        id: "66666666-6666-4666-8666-666666666666"
      }
    ],
    error: null
  }
}: {
  currentStatus?: string;
  updateResult?: MutationResult;
  activityResult?: MutationResult;
} = {}) {
  const calls: Array<{
    step: string;
    args: unknown[];
  }> = [];
  const quoteSelectBuilder = {
    eq: vi.fn((column: string, value: string) => {
      calls.push({
        step: "quote_eq",
        args: [column, value]
      });

      return quoteSelectBuilder;
    }),
    single: vi.fn(async () => ({
      data: {
        id: quoteRequestId,
        status: currentStatus
      },
      error: null
    }))
  };
  const updateBuilder = {
    eq: vi.fn((column: string, value: string) => {
      calls.push({
        step: "update_eq",
        args: [column, value]
      });

      return updateBuilder;
    }),
    select: vi.fn((columns: string) => {
      calls.push({
        step: "update_select",
        args: [columns]
      });

      return {
        single: vi.fn(async () => updateResult)
      };
    })
  };
  const activityInsertBuilder = {
    select: vi.fn((columns: string) => {
      calls.push({
        step: "activity_select",
        args: [columns]
      });

      return Promise.resolve(activityResult);
    })
  };
  const client = {
    from: vi.fn((table: string) => {
      calls.push({
        step: "from",
        args: [table]
      });

      if (table === "quote_requests") {
        return {
          select: vi.fn((columns: string) => {
            calls.push({
              step: "quote_select",
              args: [columns]
            });

            return quoteSelectBuilder;
          }),
          update: vi.fn((payload: Record<string, unknown>) => {
            calls.push({
              step: "update",
              args: [payload]
            });

            return updateBuilder;
          })
        };
      }

      return {
        insert: vi.fn((payload: unknown) => {
          calls.push({
            step: "activity_insert",
            args: [payload]
          });

          return activityInsertBuilder;
        })
      };
    })
  };

  return {
    calls,
    client: client as never
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

    expect(calls).toEqual(
      expect.arrayContaining([
      {
        step: "from",
        args: ["quote_requests"]
      },
      {
        step: "quote_select",
        args: ["id, status"]
      },
      {
        step: "update",
        args: [
          {
            status: "reviewing",
            updated_at: expect.any(String)
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
      ])
    );
    expect(calls).toContainEqual({
      step: "activity_insert",
      args: [
        [
          {
            workspace_id: workspaceId,
            quote_request_id: quoteRequestId,
            actor_admin_user_id: adminContext.adminUserId,
            activity_type: "status_change",
            status_from: "new",
            status_to: "reviewing",
            note: null
          }
        ]
      ]
    });
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

  it("writes internal status activity and bounded notes for the trusted workspace", async () => {
    const { calls, client } = createWorkflowSupabase();

    await expect(
      updateAdminQuoteRequestStatus(
        {
          admin: adminContext,
          quoteRequestId,
          status: "reviewing",
          internalNote: "Call Maya about sofa quantities."
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

    expect(calls).toContainEqual({
      step: "quote_select",
      args: ["id, status"]
    });
    expect(calls).toContainEqual({
      step: "update",
      args: [
        {
          status: "reviewing",
          updated_at: expect.any(String)
        }
      ]
    });
    expect(calls).toContainEqual({
      step: "activity_insert",
      args: [
        [
          {
            workspace_id: workspaceId,
            quote_request_id: quoteRequestId,
            actor_admin_user_id: adminContext.adminUserId,
            activity_type: "status_change",
            status_from: "new",
            status_to: "reviewing",
            note: null
          },
          {
            workspace_id: workspaceId,
            quote_request_id: quoteRequestId,
            actor_admin_user_id: adminContext.adminUserId,
            activity_type: "internal_note",
            status_from: null,
            status_to: null,
            note: "Call Maya about sofa quantities."
          }
        ]
      ]
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
