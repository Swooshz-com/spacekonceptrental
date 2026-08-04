import { describe, expect, it, vi } from "vitest";

import {
  executeAdminSetupRecipeWrite,
  readAdminSetupRecipe,
  type SetupRecipeRepositoryDependencies
} from "./setup-recipe-repository";

function createReadClient(
  itemResult: { data: unknown; error: unknown; status?: number },
  headerResult: { data: unknown; error: unknown; status?: number } = {
    data: { revision: 3 },
    error: null
  }
) {
  const headerBuilder = {
    select: vi.fn(() => headerBuilder),
    eq: vi.fn(() => headerBuilder),
    single: vi.fn(async () => headerResult)
  };
  const itemBuilder = {
    select: vi.fn(() => itemBuilder),
    eq: vi.fn(() => itemBuilder),
    order: vi.fn(async () => itemResult)
  };
  const client = {
    from: vi.fn((table: string) =>
      table === "setup_recipes" ? headerBuilder : itemBuilder
    )
  };
  return client;
}

function authenticatedDependencies(
  client: ReturnType<typeof createReadClient>
): SetupRecipeRepositoryDependencies {
  return {
    resolveAuthIdentity: vi.fn(async () => ({
      authenticated: true as const,
      authUserId: "auth-user-1",
      email: "admin@example.test",
      provider: "google" as const
    })),
    createReadClient: vi.fn(async () => ({
      configured: true as const,
      client: client as never,
      missingEnv: [] as []
    }))
  };
}

describe("setup recipe repository read authority", () => {
  it("accepts only the provider's explicit zero-row response as recipe absence", async () => {
    const result = await readAdminSetupRecipe(
      "workspace-1",
      "setup-1",
      authenticatedDependencies(
        createReadClient(
          { data: null, error: null },
          {
            data: null,
            status: 406,
            error: {
              code: "PGRST116",
              details: "The result contains 0 rows",
              hint: null,
              message: "JSON object requested, multiple (or no) rows returned"
            }
          }
        )
      )
    );

    expect(result).toEqual({ ok: false, code: "not-found" });
  });

  it("preserves an authenticated recipe read", async () => {
    const result = await readAdminSetupRecipe(
      "workspace-1",
      "setup-1",
      authenticatedDependencies(
        createReadClient({
          data: [
            {
              workspace_id: "workspace-1",
              setup_product_id: "setup-1",
              included_product_id: "child-1",
              position: 0,
              base_quantity: 2
            }
          ],
          error: null
        })
      )
    );

    expect(result).toMatchObject({ ok: true, revision: 3 });
  });

  it("preserves an expired provider session as an authentication failure", async () => {
    const result = await readAdminSetupRecipe(
      "workspace-1",
      "setup-1",
      authenticatedDependencies(
        createReadClient(
          { data: null, error: null },
          {
            data: null,
            status: 401,
            error: {
              code: "PGRST301",
              details: "",
              hint: null,
              message: "provider failure"
            }
          }
        )
      )
    );

    expect(result).toEqual({ ok: false, code: "not-authenticated" });
  });

  it.each([
    ["permission", { status: 403, code: "42501", message: "permission denied" }],
    ["schema", { status: 404, code: "PGRST202", message: "schema cache failure" }],
    ["timeout", { status: 504, code: "PGRST000", message: "provider timeout" }],
    ["network", { status: 502, code: "PGRST000", message: "upstream network failure" }],
    ["unknown", { status: 500, code: undefined, message: undefined }]
  ] as const)("does not convert %s failures into recipe absence", async (_label, failure) => {
    const result = await readAdminSetupRecipe(
      "workspace-1",
      "setup-1",
      authenticatedDependencies(
        createReadClient(
          { data: null, error: null },
          {
            data: null,
            status: failure.status,
            error: {
              ...(failure.code ? { code: failure.code } : {}),
              ...(failure.message ? { message: failure.message } : {})
            }
          }
        )
      )
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
  });

  it("fails closed for a malformed successful header response", async () => {
    const result = await readAdminSetupRecipe(
      "workspace-1",
      "setup-1",
      authenticatedDependencies(
        createReadClient(
          { data: [], error: null },
          { data: null, error: null }
        )
      )
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
  });

  it("returns a typed read failure when the item query fails after the header succeeds", async () => {
    const result = await readAdminSetupRecipe(
      "workspace-1",
      "setup-1",
      authenticatedDependencies(
        createReadClient({ data: null, error: new Error("private provider detail") })
      )
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
    expect(result).not.toEqual({ ok: true, revision: 3, items: [] });
  });

  it("preserves authentication loss during the item read as not-authenticated", async () => {
    const result = await readAdminSetupRecipe(
      "workspace-1",
      "setup-1",
      authenticatedDependencies(
        createReadClient({
          data: null,
          status: 401,
          error: {
            code: "PGRST302",
            details: "",
            hint: null,
            message: "JWT missing"
          }
        })
      )
    );

    expect(result).toEqual({ ok: false, code: "not-authenticated" });
  });

  it("does not treat a malformed item result as an authoritative empty recipe", async () => {
    await expect(
      readAdminSetupRecipe(
        "workspace-1",
        "setup-1",
        authenticatedDependencies(
          createReadClient({ data: "not-an-array", error: null })
        )
      )
    ).resolves.toEqual({ ok: false, code: "read-failure" });
  });

  it("denies a missing session before invoking the authenticated read client", async () => {
    const createReadClient = vi.fn();

    await expect(
      readAdminSetupRecipe("workspace-1", "setup-1", {
        resolveAuthIdentity: vi.fn(async () => ({
          authenticated: false as const,
          reason: "auth_session_missing" as const,
          statusCode: 401 as const
        })),
        createReadClient
      })
    ).resolves.toEqual({ ok: false, code: "not-authenticated" });

    expect(createReadClient).not.toHaveBeenCalled();
  });

  it("allows an authenticated admin write through the session-bound server client", async () => {
    const setupProductId = "50000000-0000-4000-8000-000000000001";
    const rpc = vi.fn(async () => ({
      data: {
        operation: "replace",
        setup_product_id: setupProductId,
        revision: 4,
        item_count: 1
      },
      error: null
    }));
    const client = {
      rpc,
      from: vi.fn()
    };

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "replace",
        expectedWorkspaceId: "workspace-1",
        setupProductId,
        expectedRevision: 3,
        items: [
          {
            included_product_id: "child-1",
            position: 0,
            base_quantity: 1
          }
        ]
      },
      authenticatedDependencies(client as never)
    );

    expect(result).toMatchObject({ ok: true, revision: 4 });
    expect(rpc).toHaveBeenCalledWith(
      "execute_admin_setup_recipe_write",
      expect.objectContaining({
        p_expected_workspace_id: "workspace-1",
        p_setup_product_id: setupProductId
      })
    );
  });

  it("returns not-authenticated when the write RPC rejects an expired session", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      status: 401,
      error: {
        code: "PGRST301",
        details: "",
        hint: null,
        message: "provider failure"
      }
    }));
    const client = { rpc, from: vi.fn() };

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "remove",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: []
      },
      authenticatedDependencies(client as never)
    );

    expect(result).toEqual({ ok: false, code: "not-authenticated" });
  });

  it("maps the reviewed missing-JWT provider code on writes to not-authenticated", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      status: 401,
      error: {
        code: "PGRST302",
        details: "",
        hint: null,
        message: "JWT missing"
      }
    }));

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "remove",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: []
      },
      authenticatedDependencies({ rpc, from: vi.fn() } as never)
    );

    expect(result).toEqual({ ok: false, code: "not-authenticated" });
  });

  it("keeps an authenticated database permission denial as unauthorized", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      status: 403,
      error: {
        code: "42501",
        details: "",
        hint: null,
        message: "permission denied"
      }
    }));
    const client = { rpc, from: vi.fn() };

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "remove",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: []
      },
      authenticatedDependencies(client as never)
    );

    expect(result).toEqual({ ok: false, code: "unauthorized" });
  });

  it("maps the reviewed unauthorized RPC identifier to unauthorized", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      status: 400,
      error: {
        code: "P0001",
        details: "",
        hint: null,
        message: "unauthorized_admin_action"
      }
    }));

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "remove",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: []
      },
      authenticatedDependencies({ rpc, from: vi.fn() } as never)
    );

    expect(result).toEqual({ ok: false, code: "unauthorized" });
  });

  it.each([
    "setup_recipe_workspace_required",
    "unsupported_setup_recipe_operation",
    "setup_recipe_parent_required",
    "setup_recipe_items_array_required",
    "setup_recipe_parent_missing",
    "setup_recipe_remove_items_must_be_empty",
    "setup_recipe_not_found",
    "setup_recipe_published_parent_remove",
    "setup_recipe_empty_replacement",
    "setup_recipe_item_count_invalid",
    "setup_recipe_invalid_item",
    "setup_recipe_self_reference",
    "setup_recipe_position_invalid",
    "setup_recipe_quantity_invalid",
    "setup_recipe_duplicate_child",
    "setup_recipe_duplicate_position",
    "setup_recipe_positions_not_contiguous",
    "setup_recipe_child_workspace_mismatch",
    "setup_recipe_nested_setup",
    "setup_recipe_published_parent_invalid",
    "setup_recipe_published_child_invalid",
    "setup_recipe_revision_exhausted",
    "setup_recipe_creation_revision_required",
    "setup_recipe_parent_published"
  ] as const)("maps the reviewed validation identifier %s to validation-failure", async (identifier) => {
    const rpc = vi.fn(async () => ({
      data: null,
      status: 400,
      error: {
        code: "P0001",
        details: "",
        hint: null,
        message: identifier
      }
    }));

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "replace",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: [{
          included_product_id: "child-1",
          position: 0,
          base_quantity: 1
        }]
      },
      authenticatedDependencies({ rpc, from: vi.fn() } as never)
    );

    expect(result).toEqual({ ok: false, code: "validation-failure" });
  });

  it("maps the reviewed revision conflict identifier to conflict", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      status: 409,
      error: {
        code: "P0001",
        details: "",
        hint: null,
        message: "setup_recipe_revision_conflict"
      }
    }));

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "remove",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: []
      },
      authenticatedDependencies({ rpc, from: vi.fn() } as never)
    );

    expect(result).toEqual({ ok: false, code: "conflict" });
  });

  it.each([
    {
      code: "XX000",
      message: "invalid position child"
    },
    {
      code: "PGRST202",
      message: "schema cache failure: invalid position child"
    },
    {
      code: "PGRST000",
      message: "provider unavailable"
    }
  ])("fails closed for unknown or operational provider error %j", async (failure) => {
    const rpc = vi.fn(async () => ({
      data: null,
      status: 503,
      error: {
        code: failure.code,
        details: "private provider details",
        hint: null,
        message: failure.message
      }
    }));

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "remove",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: []
      },
      authenticatedDependencies({ rpc, from: vi.fn() } as never)
    );

    expect(result).toEqual({ ok: false, code: "rpc-failure" });
    expect(JSON.stringify(result)).not.toContain("private provider details");
  });

  it("rejects a coercively-shaped RPC result instead of repairing malformed authority", async () => {
    const setupProductId = "50000000-0000-4000-8000-000000000001";
    const rpc = vi.fn(async () => ({
      data: {
        operation: "replace",
        setup_product_id: setupProductId,
        revision: "4",
        item_count: "1"
      },
      error: null
    }));
    const client = { rpc, from: vi.fn() };

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "replace",
        expectedWorkspaceId: "workspace-1",
        setupProductId,
        expectedRevision: 3,
        items: [
          {
            included_product_id: "child-1",
            position: 0,
            base_quantity: 1
          }
        ]
      },
      authenticatedDependencies(client as never)
    );

    expect(result).toEqual({ ok: false, code: "rpc-failure" });
  });

  it("denies an anonymous write and never attempts the RPC", async () => {
    const rpc = vi.fn();
    const createReadClient = vi.fn();

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "remove",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: []
      },
      {
        resolveAuthIdentity: vi.fn(async () => ({
          authenticated: false as const,
          reason: "auth_session_missing" as const,
          statusCode: 401 as const
        })),
        createReadClient
      }
    );

    expect(result).toEqual({ ok: false, code: "not-authenticated" });
    expect(createReadClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("keeps wrong-workspace reads fail-closed at the database boundary", async () => {
    const result = await readAdminSetupRecipe(
      "workspace-2",
      "setup-1",
      authenticatedDependencies(
        createReadClient(
          { data: [], error: null },
          {
            data: null,
            status: 406,
            error: {
              code: "PGRST116",
              details: "The result contains 0 rows",
              hint: null,
              message: "JSON object requested, multiple (or no) rows returned"
            }
          }
        )
      )
    );

    expect(result).toEqual({ ok: false, code: "not-found" });
  });
});
