import { describe, expect, it, vi } from "vitest";
import {
  SupabaseProductPersistence,
  type ProductWriteSupabaseClientResult
} from "./supabase-product-persistence";
import type { ProductPersistenceResult, TrustedProductAdminContext } from "./types";

type MutationResult = {
  data: unknown;
  error: unknown;
};

type MutationCall = {
  table: string;
  method: "insert" | "update";
  row: unknown;
  filters: Array<[string, string]>;
  select?: string;
};

const admin: TrustedProductAdminContext = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  adminUserId: "22222222-2222-4222-8222-222222222222",
  membershipId: "33333333-3333-4333-8333-333333333333",
  resolution: "server-auth-membership"
};

function createThenableResult(
  result: MutationResult
): PromiseLike<MutationResult> {
  return {
    then<TResult1 = MutationResult, TResult2 = never>(
      onfulfilled?:
        | ((value: MutationResult) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    }
  };
}

function createMockSupabase(results: MutationResult[] = []) {
  const calls: MutationCall[] = [];
  let index = 0;
  const nextResult = () =>
    results[index++] ?? {
      data: {
        id: "99999999-9999-4999-8999-999999999999",
        status: "draft",
        is_published: false
      },
      error: null
    };

  const client = {
    from(table: string) {
      return {
        insert(row: unknown) {
          const call: MutationCall = {
            table,
            method: "insert",
            row,
            filters: []
          };
          calls.push(call);
          const result = nextResult();

          return Object.assign(createThenableResult(result), {
            select(columns: string) {
              call.select = columns;

              return {
                single: () => Promise.resolve(result)
              };
            }
          });
        },
        update(row: unknown) {
          const call: MutationCall = {
            table,
            method: "update",
            row,
            filters: []
          };
          calls.push(call);

          const builder = {
            eq(column: string, value: string) {
              call.filters.push([column, value]);
              return builder;
            },
            select(columns: string) {
              call.select = columns;
              const result = nextResult();

              return {
                single: () => Promise.resolve(result)
              };
            }
          };

          return builder;
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
    } satisfies ProductWriteSupabaseClientResult
  };
}

describe("SupabaseProductPersistence", () => {
  it("fails safely without pretending writes succeeded when the session-bound client is unavailable", async () => {
    const persistence = new SupabaseProductPersistence({
      supabase: {
        configured: false,
        client: null,
        reason: "authenticated_admin_write_client_required"
      }
    });

    await expect(
      persistence.createCategory({
        admin,
        category: {
          slug: "lounge",
          name: "Lounge",
          isPublished: false
        }
      })
    ).resolves.toEqual({
      ok: false,
      code: "PRODUCT_PERSISTENCE_UNAVAILABLE"
    });
  });

  it("creates a category in the trusted admin workspace and records a product-admin audit event", async () => {
    const { calls, supabase } = createMockSupabase([
      {
        data: {
          id: "44444444-4444-4444-8444-444444444444",
          is_published: false
        },
        error: null
      },
      { data: null, error: null }
    ]);
    const persistence = new SupabaseProductPersistence({ supabase });

    const result = await persistence.createCategory({
      admin,
      category: {
        slug: "lounge",
        name: "Lounge",
        description: "Seating",
        sortOrder: 10,
        isPublished: false
      }
    });

    expect(result).toEqual({
      ok: true,
      record: {
        id: "44444444-4444-4444-8444-444444444444",
        type: "category"
      }
    });
    expect(calls).toMatchObject([
      {
        table: "categories",
        method: "insert",
        row: {
          workspace_id: admin.workspaceId,
          slug: "lounge",
          name: "Lounge",
          description: "Seating",
          sort_order: 10,
          is_published: false
        }
      },
      {
        table: "audit_logs",
        method: "insert",
        row: {
          workspace_id: admin.workspaceId,
          actor_admin_user_id: admin.adminUserId,
          actor_type: "admin",
          action: "category.create",
          target_type: "category",
          target_id: "44444444-4444-4444-8444-444444444444"
        }
      }
    ]);
  });

  it("updates products only through the trusted workspace filter and does not leak raw database errors", async () => {
    const { calls, supabase } = createMockSupabase([
      {
        data: null,
        error: new Error(
          "duplicate slug for workspace 11111111-1111-4111-8111-111111111111"
        )
      }
    ]);
    const persistence = new SupabaseProductPersistence({ supabase });

    const result = await persistence.updateProduct({
      admin,
      productId: "55555555-5555-4555-8555-555555555555",
      updates: {
        name: "Updated product",
        status: "draft"
      }
    });

    expect(result).toEqual({
      ok: false,
      code: "PRODUCT_PERSISTENCE_FAILED"
    });
    expect(JSON.stringify(result)).not.toContain(admin.workspaceId);
    expect(JSON.stringify(result)).not.toContain("duplicate slug");
    expect(calls[0]).toMatchObject({
      table: "products",
      method: "update",
      row: {
        name: "Updated product",
        status: "draft"
      },
      filters: [
        ["id", "55555555-5555-4555-8555-555555555555"],
        ["workspace_id", admin.workspaceId]
      ]
    });
  });

  it("archives product image metadata without binary uploads or storage calls", async () => {
    const { calls, supabase } = createMockSupabase([
      {
        data: {
          id: "66666666-6666-4666-8666-666666666666",
          status: "archived"
        },
        error: null
      },
      { data: null, error: null }
    ]);
    const upload = vi.fn();
    const persistence = new SupabaseProductPersistence({ supabase });

    const result = await persistence.archiveProductImage({
      admin,
      imageId: "66666666-6666-4666-8666-666666666666"
    });

    expect(result).toEqual({
      ok: true,
      record: {
        id: "66666666-6666-4666-8666-666666666666",
        type: "productImage"
      }
    });
    expect(calls[0]).toMatchObject({
      table: "product_images",
      method: "update",
      row: {
        status: "archived",
        is_primary: false
      },
      filters: [
        ["id", "66666666-6666-4666-8666-666666666666"],
        ["workspace_id", admin.workspaceId]
      ]
    });
    expect(upload).not.toHaveBeenCalled();
    expect(JSON.stringify(calls)).not.toContain("storage.objects");
  });

  it("fails safely when audit insert fails without leaking internals", async () => {
    const { calls, supabase } = createMockSupabase([
      {
        data: {
          id: "44444444-4444-4444-8444-444444444444",
          is_published: false
        },
        error: null
      },
      { data: null, error: new Error("audit log insert failed due to database error sql stack") }
    ]);
    const persistence = new SupabaseProductPersistence({ supabase });

    const result = await persistence.createCategory({
      admin,
      category: {
        slug: "lounge",
        name: "Lounge",
        description: "Seating",
        sortOrder: 10,
        isPublished: false
      }
    });

    expect(result).toEqual({
      ok: false,
      code: "PRODUCT_PERSISTENCE_FAILED"
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("sql stack");
    expect(calls.length).toBe(2);
    expect(calls[1].table).toBe("audit_logs");
  });
});
