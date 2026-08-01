import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SetupRecipeEditor } from "./setup-recipe-editor";

const setupProductId = "setup-1";
const products = [
  { id: setupProductId, name: "Botanical Wedding" },
  { id: "child-a", name: "Child A" },
  { id: "child-b", name: "Child B" },
  { id: "child-c", name: "Child C" },
  { id: "child-d", name: "Child D" }
];

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body)
  };
}

function recipeItems(ids: string[], quantity = 1) {
  return ids.map((included_product_id, position) => ({
    included_product_id,
    position,
    base_quantity: quantity
  }));
}

function renderEditor({
  availableProducts = products,
  parentStatus = "draft" as const,
  csrfProofFetcher
}: {
  availableProducts?: Array<{ id: string; name: string }>;
  parentStatus?: "draft" | "published" | "archived";
  csrfProofFetcher?: typeof fetch;
} = {}) {
  const proofFetcher = csrfProofFetcher ?? (vi.fn(async () =>
    jsonResponse({ ok: true, csrfProof: "test-csrf-proof" })
  ) as unknown as typeof fetch);

  return render(
    <SetupRecipeEditor
      availableProducts={availableProducts}
      csrfProofFetcher={proofFetcher}
      fetcher={globalThis.fetch}
      parentStatus={parentStatus}
      setupProductId={setupProductId}
      setupProductName="Botanical Wedding"
      workspaceId="workspace-1"
    />
  );
}

function requestBody(call: unknown[]) {
  const init = call[1] as RequestInit;
  return JSON.parse(String(init.body)) as Record<string, unknown>;
}

describe("SetupRecipeEditor behavioural workflow", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows the initial loading state while the recipe read is pending", () => {
    fetchMock.mockReturnValueOnce(new Promise(() => undefined));
    renderEditor();

    expect(screen.getByText("Loading recipe...")).toBeInTheDocument();
  });

  it("shows a generic load failure and retries successfully", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("provider secret should not be shown"))
      .mockResolvedValueOnce(jsonResponse({ revision: 2, items: recipeItems(["child-a"]) }));

    renderEditor();
    expect(await screen.findByRole("alert")).toHaveTextContent("Network error loading recipe.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("provider secret");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("heading", { name: "Recipe: Botanical Wedding" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats an item-query failure as unavailable and sends no write", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "read-failure" }, 503)
    );

    renderEditor();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to load recipe."
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Save Recipe" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Recipe" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestBody(fetchMock.mock.calls[0]!)).toMatchObject({ action: "read" });
  });

  it("requests the exact operation proof and sends it on the protected recipe request", async () => {
    const proofMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      const operation = body.requestedOperation;
      return jsonResponse({
        ok: true,
        csrfProof: operation === "admin.setupRecipe.write" ? "write-proof" : "read-proof"
      });
    });

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ revision: 3, items: recipeItems(["child-a"]) }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, operation: "replace", revision: 4 }))
      .mockResolvedValueOnce(jsonResponse({ revision: 4, items: recipeItems(["child-a"]) }));

    renderEditor({ csrfProofFetcher: proofMock as unknown as typeof fetch });
    await screen.findByText("Child A");

    expect(proofMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(proofMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      requestedOperation: "admin.setupRecipe.read",
      operation: "admin.setupRecipe.read"
    });
    expect(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).headers
    ).toMatchObject({ "x-csrf-proof": "read-proof" });

    fireEvent.click(screen.getByRole("button", { name: "Save Recipe" }));
    await screen.findByText("Recipe saved successfully.");

    expect(
      proofMock.mock.calls.some((call) =>
        JSON.parse(String(call[1]?.body)).requestedOperation ===
        "admin.setupRecipe.write"
      )
    ).toBe(true);
    const writeCall = fetchMock.mock.calls.find(
      (call) => requestBody(call).action === "write"
    );
    expect((writeCall?.[1] as RequestInit).headers).toMatchObject({
      "x-csrf-proof": "write-proof"
    });
  });

  it("cannot overwrite an existing recipe after a later item-query failure", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ revision: 3, items: recipeItems(["child-a"]) }))
      .mockResolvedValueOnce(jsonResponse({ error: "read-failure" }, 503));

    renderEditor();
    await screen.findByText("Child A");
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load recipe.");
    expect(screen.queryByRole("button", { name: "Save Recipe" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Recipe" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.some((call) => requestBody(call).action === "write")).toBe(false);
  });

  it("renders the not-found state and starts a recipe from the first eligible non-parent product", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));
    renderEditor();

    expect(await screen.findByText(/No recipe exists yet/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Recipe" }));

    expect(screen.getByText(/Revision: 0 \| Items: 1/)).toBeInTheDocument();
    expect(screen.getByText("Child A")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove setup-1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Recipe" })).toBeEnabled();
  });

  it("completes Start Recipe through Save and an authoritative reload", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404))
      .mockResolvedValueOnce(jsonResponse({ ok: true, operation: "replace", revision: 1 }))
      .mockResolvedValueOnce(jsonResponse({ revision: 1, items: recipeItems(["child-a"], 2) }));

    renderEditor();
    expect(await screen.findByText(/No recipe exists yet/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Recipe" }));
    expect(screen.getByRole("button", { name: "Remove child-a" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove setup-1" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Recipe" }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some((call) => requestBody(call).action === "write")
      ).toBe(true)
    );
    const writeCall = fetchMock.mock.calls.find(
      (call) => requestBody(call).action === "write"
    );
    expect(requestBody(writeCall!)).toEqual({
      action: "write",
      operation: "replace",
      setupProductId,
      expectedRevision: 0,
      items: [{ included_product_id: "child-a", position: 0, base_quantity: 1 }]
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3), { timeout: 3000 });
    expect(await screen.findByText("Child A")).toBeInTheDocument();
    expect(screen.getByText("Revision: 1 | Items: 1")).toBeInTheDocument();
  });

  it("fails closed for a published parent without an existing recipe", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));
    renderEditor({ parentStatus: "published" });

    expect(await screen.findByText(/must be created before publication/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Recipe" })).toBeDisabled();
    expect(screen.getByRole("link", { name: /manage catalogue/i })).toHaveAttribute(
      "href",
      "/admin/catalogue"
    );

    fireEvent.click(screen.getByRole("button", { name: "Start Recipe" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps editing for a published parent but never offers removal", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ revision: 3, items: recipeItems(["child-a"]) }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, operation: "replace", revision: 4 }))
      .mockResolvedValueOnce(jsonResponse({ revision: 4, items: recipeItems(["child-a"]) }));

    renderEditor({ parentStatus: "published" });
    await screen.findByText("Child A");

    expect(screen.queryByRole("button", { name: "Remove Recipe" })).not.toBeInTheDocument();
    expect(screen.getByText(/published setup recipes remain in place/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Recipe" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(requestBody(fetchMock.mock.calls[1]!)).toMatchObject({
      operation: "replace",
      expectedRevision: 3
    });
    expect(fetchMock.mock.calls.some((call) => requestBody(call).operation === "remove")).toBe(false);
  });

  it("does not create a self-referencing draft when the parent is the only product", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));
    renderEditor({ availableProducts: [{ id: setupProductId, name: "Botanical Wedding" }] });

    expect(await screen.findByText(/at least one eligible rental child/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Recipe" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save Recipe" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("adds and removes children through the product picker with native buttons", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ revision: 1, items: recipeItems(["child-a"]) })
    );
    renderEditor();
    await screen.findByRole("heading", { name: "Recipe: Botanical Wedding" });

    fireEvent.click(screen.getByRole("button", { name: "Add Product" }));
    const dialog = screen.getByRole("dialog", { name: "Add product" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    fireEvent.click(within(dialog).getByRole("button", { name: "Child B" }));
    expect(screen.getByText(/Revision: 1 \| Items: 2/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove child-b" }));
    expect(screen.getByText(/Revision: 1 \| Items: 1/)).toBeInTheDocument();
    expect(screen.queryByText("Child B")).not.toBeInTheDocument();
  });

  it("reorders children and keeps positions contiguous", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ revision: 1, items: recipeItems(["child-a", "child-b", "child-c"]) })
    );
    renderEditor();
    await screen.findByText("Child C");

    fireEvent.click(screen.getByRole("button", { name: "Move child-c up" }));
    fireEvent.click(screen.getByRole("button", { name: "Move child-c up" }));

    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => within(row).getByText(/^[1-3]\.$/).textContent)).toEqual([
      "1.",
      "2.",
      "3."
    ]);
    expect(rows.map((row) => within(row).getByText(/^Child /).textContent)).toEqual([
      "Child C",
      "Child A",
      "Child B"
    ]);
  });

  it("enforces quantity lower and upper bounds in the editor control", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ revision: 1, items: recipeItems(["child-a"], 1) })
    );
    renderEditor();
    await screen.findByText("Child A");

    const quantity = screen.getByRole("spinbutton", { name: "Quantity" });
    expect(quantity).toHaveAttribute("min", "1");
    expect(quantity).toHaveAttribute("max", "99");

    fireEvent.change(quantity, { target: { value: "0" } });
    expect(quantity).toHaveValue(1);
    fireEvent.change(quantity, { target: { value: "99" } });
    expect(quantity).toHaveValue(99);
    fireEvent.change(quantity, { target: { value: "100" } });
    expect(quantity).toHaveValue(99);
  });

  it("rejects self-reference and duplicate children before sending a write", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ revision: 1, items: [{ included_product_id: setupProductId, position: 0, base_quantity: 1 }] })
    );
    renderEditor();
    await screen.findByText("Botanical Wedding");
    fireEvent.click(screen.getByRole("button", { name: "Save Recipe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("cannot include itself");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    cleanup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        revision: 1,
        items: [
          { included_product_id: "child-a", position: 0, base_quantity: 1 },
          { included_product_id: "child-a", position: 1, base_quantity: 1 }
        ]
      })
    );
    renderEditor();
    await screen.findByText(/Items: 2/);
    fireEvent.click(screen.getByRole("button", { name: "Save Recipe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Duplicate products are not allowed.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("enforces the maximum of 20 items", async () => {
    const twenty = Array.from({ length: 20 }, (_, index) => ({
      id: `child-${index}`,
      name: `Child ${index}`
    }));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ revision: 1, items: recipeItems(twenty.map((item) => item.id)) })
    );
    renderEditor({
      availableProducts: [...twenty, { id: "child-extra", name: "Extra Child" }]
    });
    await screen.findByText(/Revision: 1 \| Items: 20/);

    expect(screen.queryByRole("button", { name: "Add Product" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
  });

  it("sends a replace request, announces success, and reloads authoritative data", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ revision: 3, items: recipeItems(["child-a"], 2) }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, operation: "replace", revision: 4 }))
      .mockResolvedValueOnce(jsonResponse({ revision: 4, items: recipeItems(["child-b"], 5) }));

    renderEditor({ parentStatus: "published" });
    await screen.findByText("Child A");
    fireEvent.click(screen.getByRole("button", { name: "Save Recipe" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Recipe saved successfully."));
    expect(requestBody(fetchMock.mock.calls[1]!)).toEqual({
      action: "write",
      operation: "replace",
      setupProductId,
      expectedRevision: 3,
      items: [{ included_product_id: "child-a", position: 0, base_quantity: 2 }]
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3), { timeout: 3000 });
    expect(await screen.findByText("Child B")).toBeInTheDocument();
    expect(screen.queryByText("Child A")).not.toBeInTheDocument();
    expect(screen.getByText("Revision: 4 | Items: 1")).toBeInTheDocument();
  });

  it("requires confirmation before a remove request", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ revision: 3, items: recipeItems(["child-a"]) }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, operation: "remove", revision: 4 }))
      .mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));
    renderEditor();
    await screen.findByText("Child A");

    fireEvent.click(screen.getByRole("button", { name: "Remove Recipe" }));
    const dialog = screen.getByRole("dialog", { name: "Remove recipe?" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog", { name: "Remove recipe?" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Recipe" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Remove recipe?" })).getByRole("button", {
        name: "Confirm remove recipe"
      })
    );
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some((call) => requestBody(call).action === "write")
      ).toBe(true)
    );
    const writeCall = fetchMock.mock.calls.find(
      (call) => requestBody(call).action === "write"
    );
    expect(requestBody(writeCall!)).toEqual({
      action: "write",
      operation: "remove",
      setupProductId,
      expectedRevision: 3,
      items: []
    });
    await waitFor(() => expect(screen.getByText(/No recipe exists yet/)).toBeInTheDocument());
    expect(await screen.findByRole("status")).toHaveTextContent("Recipe removed successfully.");
  });

  it("reloads after a revision conflict and keeps provider errors out of announcements", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ revision: 3, items: recipeItems(["child-a"]) }))
      .mockResolvedValueOnce(jsonResponse({ error: "postgres password and private provider details" }, 409))
      .mockResolvedValueOnce(jsonResponse({ revision: 5, items: recipeItems(["child-c"]) }));
    renderEditor();
    await screen.findByText("Child A");
    fireEvent.click(screen.getByRole("button", { name: "Save Recipe" }));

    const conflict = await screen.findByRole("alert");
    expect(conflict).toHaveTextContent("Recipe was modified by another user.");
    expect(conflict).not.toHaveTextContent("postgres password");
    fireEvent.click(screen.getByRole("button", { name: "Reload Now" }));
    expect(await screen.findByText("Child C")).toBeInTheDocument();
  });

  it("disables editing controls during saving and closes dialogs with Escape", async () => {
    let resolveWrite!: (value: unknown) => void;
    const pendingWrite = new Promise((resolve) => {
      resolveWrite = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ revision: 1, items: recipeItems(["child-a", "child-b"]) }))
      .mockReturnValueOnce(pendingWrite)
      .mockResolvedValueOnce(jsonResponse({ revision: 2, items: recipeItems(["child-a", "child-b"]) }));
    renderEditor();
    await screen.findByText("Child B");

    fireEvent.click(screen.getByRole("button", { name: "Save Recipe" }));
    expect(await screen.findByRole("button", { name: "Saving..." })).toBeDisabled();
    screen
      .getAllByRole("spinbutton", { name: "Quantity" })
      .forEach((input) => expect(input).toBeDisabled());
    expect(screen.getByRole("button", { name: "Remove Recipe" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reload" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move child-a down" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove child-a" })).toBeDisabled();

    resolveWrite(jsonResponse({ ok: true, operation: "replace", revision: 2 }));
    await act(async () => undefined);

    fireEvent.click(screen.getByRole("button", { name: "Add Product" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Add product" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Recipe" }));
    expect(screen.getByRole("dialog", { name: "Remove recipe?" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Remove recipe?" })).not.toBeInTheDocument();
  });

  it("announces non-conflict write errors generically", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ revision: 1, items: recipeItems(["child-a"]) }))
      .mockResolvedValueOnce(jsonResponse({ error: "private SQL/provider failure" }, 400));
    renderEditor();
    await screen.findByText("Child A");
    fireEvent.click(screen.getByRole("button", { name: "Save Recipe" }));

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("Recipe could not be saved. Check the items and try again.");
    expect(error).not.toHaveTextContent("private SQL/provider failure");
  });
});
