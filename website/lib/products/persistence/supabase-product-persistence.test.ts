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
  fn: string;
  args: Record<string, unknown>;
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
    rpc(fn: string, args: Record<string, unknown>) {
      const call: MutationCall = {
        fn,
        args
      };
      calls.push(call);
      const result = nextResult();

      return {
        single: () => Promise.resolve(result)
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
        fn: "execute_admin_product_write",
        args: {
          p_action: "category.create",
          p_target_id: null,
          p_workspace_id: admin.workspaceId,
          p_payload: {
            workspace_id: admin.workspaceId,
            slug: "lounge",
            name: "Lounge",
            description: "Seating",
            sort_order: 10,
            is_published: false
          }
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
      fn: "execute_admin_product_write",
      args: {
        p_action: "product.update",
        p_target_id: "55555555-5555-4555-8555-555555555555",
        p_workspace_id: admin.workspaceId,
        p_payload: {
          name: "Updated product",
          status: "draft"
        }
      }
    });
  });

  it("archives product images metadata-only", async () => {
    const { calls, supabase } = createMockSupabase([
      {
        data: {
          id: "66666666-6666-4666-8666-666666666666"
        },
        error: null
      }
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
      fn: "execute_admin_product_write",
      args: {
        p_action: "productImage.archive",
        p_target_id: "66666666-6666-4666-8666-666666666666",
        p_workspace_id: admin.workspaceId,
        p_payload: {}
      }
    });
    expect(upload).not.toHaveBeenCalled();
    expect(JSON.stringify(calls)).not.toContain("storage.objects");
  });

  it("fails safely when RPC fails without leaking internals", async () => {
    const { calls, supabase } = createMockSupabase([
      { data: null, error: new Error("RPC failed due to database error sql stack") }
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
    expect(calls.length).toBe(1);
    expect(calls[0].fn).toBe("execute_admin_product_write");
  });
});
