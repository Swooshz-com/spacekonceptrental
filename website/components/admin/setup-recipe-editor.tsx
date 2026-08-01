"use client";

import { useCallback, useEffect, useReducer, useState } from "react";

type RecipeItem = {
  included_product_id: string;
  position: number;
  base_quantity: number;
  name?: string;
};

type RecipeState =
  | { status: "loading" }
  | { status: "loaded"; revision: number; items: RecipeItem[] }
  | { status: "not-found" }
  | { status: "error"; message: string };

type EditorAction =
  | { kind: "set-recipe"; revision: number; items: RecipeItem[] }
  | { kind: "set-not-found" }
  | { kind: "set-error"; message: string }
  | { kind: "set-loading" }
  | { kind: "set-quantity"; index: number; quantity: number }
  | { kind: "remove-item"; index: number }
  | { kind: "add-item"; productId: string; productName?: string }
  | { kind: "move-item"; fromIndex: number; toIndex: number }
  | { kind: "replace-items"; productIds: { id: string; name?: string }[] }
  | { kind: "clear-items" };

type EditorActionState = "idle" | "saving" | "error" | "conflict" | "success";
type ParentStatus = "draft" | "published" | "archived";
type WriteResponse =
  | { ok: true; operation: string; revision: number }
  | { ok: false; code: string };

function editorReducer(
  state: RecipeState,
  action: EditorAction
): RecipeState {
  switch (action.kind) {
    case "set-recipe":
      return { status: "loaded", revision: action.revision, items: action.items };
    case "set-not-found":
      return { status: "not-found" };
    case "set-error":
      return { status: "error", message: action.message };
    case "set-loading":
      return { status: "loading" };
    case "set-quantity": {
      if (state.status !== "loaded") return state;
      const items = [...state.items];
      items[action.index] = { ...items[action.index], base_quantity: action.quantity };
      return { ...state, items };
    }
    case "remove-item": {
      if (state.status !== "loaded") return state;
      const removed = state.items.filter((_item, i) => i !== action.index);
      const reindexed = removed.map((item, i) => ({ ...item, position: i }));
      return { ...state, items: reindexed };
    }
    case "add-item": {
      if (state.status !== "loaded") return state;
      if (state.items.length >= 20) return state;
      const newItem: RecipeItem = {
        included_product_id: action.productId,
        position: state.items.length,
        base_quantity: 1,
        name: action.productName
      };
      return { ...state, items: [...state.items, newItem] };
    }
    case "move-item": {
      if (state.status !== "loaded") return state;
      if (action.fromIndex === action.toIndex) return state;
      const moved = [...state.items];
      const [item] = moved.splice(action.fromIndex, 1);
      moved.splice(action.toIndex, 0, item);
      const reindexed = moved.map((item, i) => ({ ...item, position: i }));
      return { ...state, items: reindexed };
    }
    case "replace-items": {
      if (action.productIds.length < 1 || action.productIds.length > 20) return state;
      if (state.status !== "loaded" && state.status !== "not-found") return state;
      const newItems: RecipeItem[] = action.productIds.map((p, i) => ({
        included_product_id: p.id,
        position: i,
        base_quantity: state.status === "loaded" ? state.items[i]?.base_quantity ?? 1 : 1,
        name: p.name
      }));
      return {
        status: "loaded",
        revision: state.status === "loaded" ? state.revision : 0,
        items: newItems
      };
    }
    case "clear-items": {
      if (state.status !== "loaded") return state;
      return { ...state, items: [] };
    }
    default:
      return state;
  }
}

function validateItems(items: RecipeItem[], setupProductId: string): string | null {
  if (items.length < 1) return "At least one item is required.";
  if (items.length > 20) return "Maximum 20 items allowed.";
  const ids = new Set(items.map((i) => i.included_product_id));
  if (ids.size !== items.length) return "Duplicate products are not allowed.";
  if (ids.has(setupProductId)) return "A setup cannot include itself.";
  for (const item of items) {
    if (item.base_quantity < 1 || item.base_quantity > 99) return "Quantity must be 1-99.";
    if (item.position < 0 || item.position >= items.length) return "Invalid item position.";
  }
  const positions = new Set(items.map((i) => i.position));
  for (let p = 0; p < items.length; p++) {
    if (!positions.has(p)) return "Positions must be contiguous (0, 1, 2, ...).";
  }
  return null;
}

export function SetupRecipeEditor({
  workspaceId,
  setupProductId,
  setupProductName,
  availableProducts,
  parentStatus
}: {
  workspaceId: string;
  setupProductId: string;
  setupProductName: string;
  availableProducts: Array<{ id: string; name: string }>;
  parentStatus: ParentStatus;
}) {
  const [state, dispatch] = useReducer(editorReducer, { status: "loading" } as RecipeState);
  const [actionState, setActionState] = useState<EditorActionState>("idle");
  const [actionError, setActionError] = useState<string>("");
  const [lastRevision, setLastRevision] = useState<number | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const firstEligibleChild = availableProducts.find(
    (product) => product.id !== setupProductId
  );
  const canStartRecipe = parentStatus === "draft" && firstEligibleChild !== undefined;

  const loadRecipe = useCallback(async () => {
    dispatch({ kind: "set-loading" });
    try {
      const res = await fetch("/api/admin/setup-recipe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "read", setupProductId })
      });
      if (!res.ok) {
        if (res.status === 404) {
          dispatch({ kind: "set-not-found" });
          setLastRevision(0);
        } else {
          dispatch({ kind: "set-error", message: "Failed to load recipe." });
        }
        return;
      }
      const data = await res.json();
      const revision = Number(data.revision ?? 0);
      const items: RecipeItem[] = (
        Array.isArray(data.items) ? data.items : []
      ).map((item: Record<string, unknown>) => ({
        included_product_id: String(item.included_product_id ?? ""),
        position: Number(item.position ?? 0),
        base_quantity: Number(item.base_quantity ?? 1)
      }));
      dispatch({ kind: "set-recipe", revision, items });
      setLastRevision(revision);
    } catch {
      dispatch({ kind: "set-error", message: "Network error loading recipe." });
    }
  }, [setupProductId]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const doWrite = useCallback(
    async (operation: "replace" | "remove", items: RecipeItem[]) => {
      if (lastRevision === null) return;
      if (operation === "replace" && lastRevision === 0 && parentStatus !== "draft") {
        setActionState("error");
        setActionError("Recipe creation is unavailable for this parent.");
        return;
      }
      setActionState("saving");
      setActionError("");
      try {
        const body =
          operation === "remove"
            ? {
                action: "write",
                operation: "remove",
                setupProductId,
                expectedRevision: lastRevision,
                items: []
              }
            : {
                action: "write",
                operation: "replace",
                setupProductId,
                expectedRevision: lastRevision,
                items: items.map((item) => ({
                  included_product_id: item.included_product_id,
                  position: item.position,
                  base_quantity: item.base_quantity
                }))
              };

        const res = await fetch("/api/admin/setup-recipe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          await res.json().catch(() => undefined);
          if (res.status === 409) {
            setActionState("conflict");
            setActionError("Recipe was modified by another user. Reload and try again.");
          } else {
            setActionState("error");
            setActionError("Recipe could not be saved. Check the items and try again.");
          }
          return;
        }

        const data: WriteResponse = await res.json();
        if (data.ok) {
          setActionState("success");
          setLastRevision(data.revision);
          setTimeout(() => {
            setActionState("idle");
            loadRecipe();
          }, 1000);
        } else {
          setActionState("error");
          setActionError("Recipe could not be saved. Check the items and try again.");
        }
      } catch {
        setActionState("error");
        setActionError("Network error.");
      }
    },
    [lastRevision, parentStatus, setupProductId, loadRecipe]
  );

  const handleSave = useCallback(() => {
    if (state.status !== "loaded") return;
    const error = validateItems(state.items, setupProductId);
    if (error) {
      setActionState("error");
      setActionError(error);
      return;
    }
    doWrite("replace", state.items);
  }, [state, setupProductId, doWrite]);

  const handleRemove = useCallback(() => {
    setShowRemoveConfirmation(false);
    doWrite("remove", []);
  }, [doWrite]);

  const handleReload = useCallback(() => {
    setActionState("idle");
    setActionError("");
    loadRecipe();
  }, [loadRecipe]);

  useEffect(() => {
    if (!showProductPicker && !showRemoveConfirmation) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setShowProductPicker(false);
      setShowRemoveConfirmation(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showProductPicker, showRemoveConfirmation]);

  const quantityInputId = (index: number) => `setup-recipe-qty-${index}`;

  if (state.status === "loading") {
    return <div className="skr-admin-panel"><p aria-live="polite">Loading recipe...</p></div>;
  }

  if (state.status === "error") {
    return (
      <div className="skr-admin-panel" role="alert">
        <p>{state.message}</p>
        <button onClick={handleReload} type="button">Retry</button>
      </div>
    );
  }

  if (state.status === "not-found") {
    const notFoundMessage =
      parentStatus === "published"
        ? "A recipe must be created before publication. Manage the product in Catalogue, then return here after it is eligible."
        : parentStatus === "archived"
          ? "This archived product is not eligible for recipe creation. Manage its catalogue status before returning here."
          : firstEligibleChild
            ? "No recipe exists yet. Add items to create a recipe for this setup."
            : "At least one eligible rental child, different from the parent, is required before a recipe can be created.";

    return (
      <div className="skr-admin-panel" aria-label={`Setup recipe for ${setupProductName}`}>
        <h2>Recipe: {setupProductName}</h2>
        <p>{notFoundMessage}</p>
        {(parentStatus === "published" || parentStatus === "archived") && (
          <p>
            <a href="/admin/catalogue">Manage catalogue</a>
          </p>
        )}
        <div className="skr-admin-actions">
          <button
            className="skr-admin-button skr-admin-button--primary"
            disabled={actionState === "saving" || !canStartRecipe}
            onClick={() => dispatch({
              kind: "replace-items",
              productIds: firstEligibleChild ? [firstEligibleChild] : []
            })}
            type="button"
          >
            Start Recipe
          </button>
        </div>
        {actionState === "error" && <p className="skr-admin-error" role="alert">{actionError}</p>}
        {actionState === "conflict" && (
          <p className="skr-admin-warning" role="alert">
            {actionError}
            <button onClick={handleReload} type="button">Reload</button>
          </p>
        )}
      </div>
    );
  }

  const availableForAdd = availableProducts.filter(
    (p) =>
      p.id !== setupProductId &&
      !state.items.some((item) => item.included_product_id === p.id)
  );

  return (
    <div className="skr-admin-panel" aria-label={`Setup recipe for ${setupProductName}`}>
      <h2>Recipe: {setupProductName}</h2>
      <p className="skr-admin-meta">Revision: {state.revision} | Items: {state.items.length}</p>

      {state.items.length > 0 ? (
        <ul className="skr-recipe-item-list" aria-label="Recipe items">
          {state.items.map((item, index) => (
            <li className="skr-recipe-item" key={`${item.included_product_id}-${index}`}>
              <span className="skr-recipe-item-position">{index + 1}.</span>
              <span className="skr-recipe-item-name">
                {availableProducts.find((p) => p.id === item.included_product_id)?.name ?? item.included_product_id}
              </span>
              <label htmlFor={quantityInputId(index)} className="skr-sr-only">Quantity</label>
              <input
                id={quantityInputId(index)}
                type="number"
                min={1}
                max={99}
                value={item.base_quantity}
                disabled={actionState === "saving"}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isFinite(v) && v >= 1 && v <= 99) {
                    dispatch({ kind: "set-quantity", index, quantity: v });
                  }
                }}
                className="skr-recipe-qty-input"
              />
              <div className="skr-recipe-item-actions">
                <button
                  type="button"
                  onClick={() => dispatch({ kind: "move-item", fromIndex: index, toIndex: Math.max(0, index - 1) })}
                  disabled={index === 0 || actionState === "saving"}
                  aria-label={`Move ${item.included_product_id} up`}
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ kind: "move-item", fromIndex: index, toIndex: Math.min(state.items.length - 1, index + 1) })}
                  disabled={index === state.items.length - 1 || actionState === "saving"}
                  aria-label={`Move ${item.included_product_id} down`}
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ kind: "remove-item", index })}
                  disabled={actionState === "saving"}
                  aria-label={`Remove ${item.included_product_id}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No items in recipe.</p>
      )}

      {showProductPicker && (
        <div
          aria-label="Add product"
          aria-modal="true"
          className="skr-admin-product-picker"
          role="dialog"
        >
          <h3>Add Product</h3>
          <ul>
            {availableForAdd.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ kind: "add-item", productId: p.id, productName: p.name });
                    setShowProductPicker(false);
                  }}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setShowProductPicker(false)}>Cancel</button>
        </div>
      )}

      <div className="skr-admin-actions">
        {state.items.length < 20 && availableForAdd.length > 0 && (
          <button
            type="button"
            onClick={() => setShowProductPicker(true)}
            disabled={actionState === "saving"}
            className="skr-admin-button skr-admin-button--secondary"
          >
            Add Product
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={actionState === "saving" || state.items.length === 0}
          className="skr-admin-button skr-admin-button--primary"
        >
          {actionState === "saving" ? "Saving..." : "Save Recipe"}
        </button>
        <button
          type="button"
          onClick={() => setShowRemoveConfirmation(true)}
          disabled={actionState === "saving"}
          className="skr-admin-button skr-admin-button--danger"
        >
          Remove Recipe
        </button>
        <button
          type="button"
          onClick={handleReload}
          disabled={actionState === "saving"}
          className="skr-admin-button skr-admin-button--secondary"
        >
          Reload
        </button>
      </div>

      {showRemoveConfirmation ? (
        <div
          aria-labelledby="setup-recipe-remove-title"
          aria-modal="true"
          className="skr-admin-confirmation-dialog"
          role="dialog"
        >
          <h3 id="setup-recipe-remove-title">Remove recipe?</h3>
          <p>This removes the current recipe from the setup.</p>
          <div className="skr-admin-actions">
            <button
              onClick={handleRemove}
              type="button"
            >
              Confirm remove recipe
            </button>
            <button
              onClick={() => setShowRemoveConfirmation(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {actionState === "success" && <p className="skr-admin-success" role="status">Recipe saved successfully.</p>}
      {actionState === "error" && <p className="skr-admin-error" role="alert">{actionError}</p>}
      {actionState === "conflict" && (
        <p className="skr-admin-warning" role="alert">
          {actionError}
          <button onClick={handleReload} type="button">Reload Now</button>
        </p>
      )}
    </div>
  );
}
