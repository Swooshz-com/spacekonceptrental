import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SetupRecipeSelector } from "./setup-recipe-selector";

vi.mock("./setup-recipe-editor", () => ({
  SetupRecipeEditor: ({ setupProductId }: { setupProductId: string }) => (
    <div data-testid="selected-editor">Selected editor: {setupProductId}</div>
  )
}));

const candidates = [
  {
    id: "product-z",
    slug: "twin-z",
    name: "Twin Name",
    sortOrder: 10,
    parentStatus: "draft" as const,
    categoryName: "Lounge",
    imageReady: false,
    availableProducts: []
  },
  {
    id: "product-a",
    slug: "twin-a",
    name: "Twin Name",
    sortOrder: 10,
    parentStatus: "draft" as const,
    categoryName: "Lounge",
    imageReady: false,
    availableProducts: []
  }
];

function renderSelector(values = candidates) {
  return render(
    <SetupRecipeSelector
      candidates={values}
      workspaceId="workspace-1"
    />
  );
}

describe("SetupRecipeSelector deterministic selection", () => {
  afterEach(() => {
    cleanup();
  });

  it("sorts equal-order duplicate names deterministically instead of using input order", () => {
    renderSelector();

    expect(screen.getByRole("combobox", { name: /setup recipe parent/i })).toHaveValue(
      "product-a"
    );
    expect(screen.getByTestId("selected-editor")).toHaveTextContent("product-a");
  });

  it("keeps duplicate-name options distinguishable to assistive technology", () => {
    renderSelector();

    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(new Set(options).size).toBe(options.length);
    expect(options.every((label) => label?.includes("twin-"))).toBe(true);
  });

  it("preserves the selected candidate across an authoritative refresh", () => {
    const { rerender } = renderSelector();
    const selector = screen.getByRole("combobox", { name: /setup recipe parent/i });
    fireEvent.change(selector, { target: { value: "product-z" } });

    rerender(
      <SetupRecipeSelector
        candidates={[...candidates].reverse()}
        workspaceId="workspace-1"
      />
    );

    expect(screen.getByRole("combobox", { name: /setup recipe parent/i })).toHaveValue(
      "product-z"
    );
    expect(screen.getByTestId("selected-editor")).toHaveTextContent("product-z");
  });

  it("falls back to the deterministic first candidate and remounts after disappearance", async () => {
    const { rerender } = renderSelector();
    const selector = screen.getByRole("combobox", { name: /setup recipe parent/i });
    fireEvent.change(selector, { target: { value: "product-z" } });

    rerender(
      <SetupRecipeSelector
        candidates={[{
          ...candidates[0],
          id: "product-c",
          slug: "twin-c"
        }, candidates[1]]}
        workspaceId="workspace-1"
      />
    );

    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /setup recipe parent/i })).toHaveValue(
        "product-a"
      )
    );
    expect(screen.getByTestId("selected-editor")).toHaveTextContent("product-a");
    expect(screen.getByTestId("selected-editor")).not.toHaveTextContent("product-z");
  });

  it("keeps one-candidate and empty-candidate states bounded", () => {
    const { rerender } = renderSelector([candidates[0]]);
    expect(screen.getAllByRole("option")).toHaveLength(1);

    rerender(
      <SetupRecipeSelector candidates={[]} workspaceId="workspace-1" />
    );
    expect(screen.queryByRole("combobox", { name: /setup recipe parent/i })).not.toBeInTheDocument();
  });
});
