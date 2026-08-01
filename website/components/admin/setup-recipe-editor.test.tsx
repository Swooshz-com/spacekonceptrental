import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SetupRecipeEditor } from "./setup-recipe-editor";

const setupProductId = "setup-1";
const products = [
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

function renderEditor() {
  return render(
    <SetupRecipeEditor
      availableProducts={products}
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

  it("renders the not-found state and starts a recipe from the first available product", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));
    renderEditor();

    expect(await screen.findByText(/No recipe exists yet/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Recipe" }));

    expect(screen.getByText(/Revision: 0 \| Items: 1/)).toBeInTheDocument();
    expect(screen.getByText("Child A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Recipe" })).toBeEnabled();
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
    await screen.findByText("setup-1");
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
    render(
      <SetupRecipeEditor
        availableProducts={[...twenty, { id: "child-extra", name: "Extra Child" }]}
        setupProductId={setupProductId}
        setupProductName="Botanical Wedding"
        workspaceId="workspace-1"
      />
    );
    await screen.findByText(/Revision: 1 \| Items: 20/);

    expect(screen.queryByRole("button", { name: "Add Product" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
  });

  it("sends a replace request, announces success, and reloads authoritative data", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ revision: 3, items: recipeItems(["child-a"], 2) }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, operation: "replace", revision: 4 }))
      .mockResolvedValueOnce(jsonResponse({ revision: 4, items: recipeItems(["child-b"], 5) }));

    renderEditor();
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
      .mockResolvedValueOnce(jsonResponse({ ok: true, operation: "remove", revision: 4 }));
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
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(requestBody(fetchMock.mock.calls[1]!)).toEqual({
      action: "write",
      operation: "remove",
      setupProductId,
      expectedRevision: 3,
      items: []
    });
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
      .mockReturnValueOnce(pendingWrite);
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
