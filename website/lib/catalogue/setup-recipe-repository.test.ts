import { describe, expect, it, vi } from "vitest";

import {
  executeAdminSetupRecipeWrite,
  readAdminSetupRecipe,
  type SetupRecipeRepositoryDependencies
} from "./setup-recipe-repository";

function createReadClient(result: {
  data: unknown;
  error: unknown;
  status?: number;
}) {
  const rpc = vi.fn(async () => result);
  const client = {
    rpc,
    from: vi.fn()
  };
  return client;
}

function createReadDependencies(
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

const authenticatedDependencies = createReadDependencies;

describe("setup recipe repository read authority", () => {
  const workspaceId = "11111111-1111-4111-8111-111111111111";
  const setupProductId = "22222222-2222-4222-8222-222222222222";
  const childId = "33333333-3333-4333-8333-333333333333";

  const validItems = [
    {
      workspace_id: workspaceId,
      setup_product_id: setupProductId,
      included_product_id: childId,
      position: 0,
      base_quantity: 2
    }
  ];

  function successData(revision = 3, items = validItems) {
    return { data: { revision, items }, error: null };
  }

  it("accepts the reviewed explicit no-recipe RPC identifier as recipe absence", async () => {
    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(
        createReadClient({
          data: null,
          status: 400,
          error: {
            code: "P0001",
            details: "",
            hint: null,
            message: "setup_recipe_not_found"
          }
        })
      )
    );

    expect(result).toEqual({ ok: false, code: "not-found" });
  });

  it("preserves an authenticated atomic recipe read", async () => {
    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(createReadClient(successData(3)))
    );

    expect(result).toEqual({
      ok: true,
      revision: 3,
      items: validItems
    });
  });

  it("preserves an expired provider session as an authentication failure", async () => {
    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(
        createReadClient({
          data: null,
          status: 401,
          error: {
            code: "PGRST301",
            details: "",
            hint: null,
            message: "provider failure"
          }
        })
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
      workspaceId,
      setupProductId,
      createReadDependencies(
        createReadClient({
          data: null,
          status: failure.status,
          error: {
            ...(failure.code ? { code: failure.code } : {}),
            ...(failure.message ? { message: failure.message } : {})
          }
        })
      )
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
  });

  it("fails closed for a malformed successful RPC result", async () => {
    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(createReadClient({ data: null, error: null }))
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
  });

  it("fails closed when the RPC returns a malformed revision", async () => {
    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(
        createReadClient({ data: { revision: "3", items: validItems }, error: null })
      )
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
  });

  it("fails closed when the RPC returns a malformed item row", async () => {
    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(
        createReadClient({
          data: {
            revision: 3,
            items: [{ included_product_id: childId, position: 0, base_quantity: 2 }]
          },
          error: null
        })
      )
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
  });

  it("fails closed for duplicate positions or duplicate children", async () => {
    const duplicatePosition = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(
        createReadClient({
          data: {
            revision: 3,
            items: [
              {
                workspace_id: workspaceId,
                setup_product_id: setupProductId,
                included_product_id: "33333333-3333-4333-8333-333333333333",
                position: 0,
                base_quantity: 1
              },
              {
                workspace_id: workspaceId,
                setup_product_id: setupProductId,
                included_product_id: "44444444-4444-4444-8444-444444444444",
                position: 0,
                base_quantity: 1
              }
            ]
          },
          error: null
        })
      )
    );

    expect(duplicatePosition).toEqual({ ok: false, code: "read-failure" });

    const duplicateChild = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(
        createReadClient({
          data: {
            revision: 3,
            items: [
              {
                workspace_id: workspaceId,
                setup_product_id: setupProductId,
                included_product_id: childId,
                position: 0,
                base_quantity: 1
              },
              {
                workspace_id: workspaceId,
                setup_product_id: setupProductId,
                included_product_id: childId,
                position: 1,
                base_quantity: 1
              }
            ]
          },
          error: null
        })
      )
    );

    expect(duplicateChild).toEqual({ ok: false, code: "read-failure" });
  });

  it("preserves authentication loss during the atomic read as not-authenticated", async () => {
    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(
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

  it("does not treat a malformed item array as an authoritative empty recipe", async () => {
    await expect(
      readAdminSetupRecipe(
        workspaceId,
        setupProductId,
        createReadDependencies(
          createReadClient({ data: { revision: 3, items: "not-an-array" }, error: null })
        )
      )
    ).resolves.toEqual({ ok: false, code: "read-failure" });
  });

  it("keeps the ordered item positions contiguous in the parsed result", async () => {
    const items = [
      {
        workspace_id: workspaceId,
        setup_product_id: setupProductId,
        included_product_id: "33333333-3333-4333-8333-333333333333",
        position: 0,
        base_quantity: 1
      },
      {
        workspace_id: workspaceId,
        setup_product_id: setupProductId,
        included_product_id: "44444444-4444-4444-8444-444444444444",
        position: 1,
        base_quantity: 2
      }
    ];

    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(createReadClient(successData(5, items)))
    );

    expect(result).toEqual({ ok: true, revision: 5, items });
  });

  it("canonicalises uppercase accepted workspace and setup product UUIDs", async () => {
    const upperWorkspace = workspaceId.toUpperCase();
    const upperSetup = setupProductId.toUpperCase();
    const items = [
      {
        workspace_id: workspaceId,
        setup_product_id: setupProductId,
        included_product_id: childId,
        position: 0,
        base_quantity: 1
      }
    ];

    const result = await readAdminSetupRecipe(
      upperWorkspace,
      upperSetup,
      createReadDependencies(createReadClient(successData(3, items)))
    );

    expect(result).toEqual({ ok: true, revision: 3, items });
  });

  it("canonicalises mixed-case database-returned UUID identities", async () => {
    const items = [
      {
        workspace_id: workspaceId.toUpperCase(),
        setup_product_id: setupProductId.toUpperCase(),
        included_product_id: childId.toUpperCase(),
        position: 0,
        base_quantity: 1
      }
    ];

    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(createReadClient(successData(3, items)))
    );

    expect(result).toEqual({ ok: true, revision: 3, items: [
      {
        workspace_id: items[0].workspace_id,
        setup_product_id: items[0].setup_product_id,
        included_product_id: items[0].included_product_id,
        position: 0,
        base_quantity: 1
      }
    ] });
  });

  it("still rejects a genuinely different product identity after canonicalisation", async () => {
    const items = [
      {
        workspace_id: workspaceId,
        setup_product_id: "99999999-9999-4999-8999-999999999999",
        included_product_id: childId,
        position: 0,
        base_quantity: 1
      }
    ];

    const result = await readAdminSetupRecipe(
      workspaceId,
      setupProductId,
      createReadDependencies(createReadClient(successData(3, items)))
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
  });

  it("fails closed for an invalid trusted workspace UUID input", async () => {
    const result = await readAdminSetupRecipe(
      "not-a-uuid",
      setupProductId,
      createReadDependencies(createReadClient(successData()))
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
  });

  it("keeps wrong-workspace reads fail-closed at the database boundary", async () => {
    const result = await readAdminSetupRecipe(
      "99999999-9999-4999-8999-999999999999",
      setupProductId,
      createReadDependencies(
        createReadClient({
          data: null,
          status: 400,
          error: {
            code: "P0001",
            details: "",
            hint: null,
            message: "setup_recipe_not_found"
          }
        })
      )
    );

    expect(result).toEqual({ ok: false, code: "not-found" });
  });

  it("denies a missing session before invoking the authenticated read client", async () => {
    const createReadClient = vi.fn();

    await expect(
      readAdminSetupRecipe(workspaceId, setupProductId, {
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
});
