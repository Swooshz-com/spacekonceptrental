import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CategoryManagementPanel,
  type CategoryManagementCategory
} from "./category-management-panel";

const category: CategoryManagementCategory = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "lounge",
  name: "Lounge",
  description: "Soft seating",
  sortOrder: 20,
  isPublished: true,
  productCount: 2
};
const rawProof = "raw-proof-value-that-must-not-render";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body)
  } as unknown as Response;
}

function createSuccessfulFetchMock() {
  return vi
    .fn()
    .mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        csrfProof: rawProof,
        expiresAt: Date.now() + 60_000
      })
    )
    .mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        record: {
          id: category.id
        }
      })
    );
}

describe("category management panel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders category-only create, update, and archive controls without product write controls", () => {
    render(<CategoryManagementPanel categories={[category]} />);

    expect(
      screen.getByRole("heading", { name: /category management/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/new category slug/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create category/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save category metadata/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archive category lounge/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /create product|edit product|archive product|publish product|product image/i
      })
    ).not.toBeInTheDocument();
  });

  it("uses visible MVP category guidance without old internal ladder wording", () => {
    render(<CategoryManagementPanel categories={[category]} />);

    expect(
      screen.getByRole("heading", { name: /category visibility review/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Categories should group rental listings/i)
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /readiness|phase|governance|provider handoff|CRM handoff|sync readiness|workflow readiness|future sync|future integration|provider sync|automation handoff|owner approval|evidence|deployment/i
    );
  });

  it("requests a category CSRF proof and sends create category writes with the proof header", async () => {
    const fetcher = createSuccessfulFetchMock();
    const onMutationComplete = vi.fn();

    render(
      <CategoryManagementPanel
        categories={[category]}
        fetcher={fetcher}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.change(screen.getByLabelText(/new category slug/i), {
      target: {
        value: "tables"
      }
    });
    fireEvent.change(screen.getByLabelText(/new category name/i), {
      target: {
        value: "Tables"
      }
    });
    fireEvent.change(screen.getByLabelText(/new category description/i), {
      target: {
        value: "Dining and cocktail tables"
      }
    });
    fireEvent.change(screen.getByLabelText(/new category display position/i), {
      target: {
        value: "30"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /create category/i }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[0][0]).toBe("/api/admin/csrf-proof");
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      requestedOperation: "category.write",
      operation: "category.write"
    });
    expect(fetcher.mock.calls[1][0]).toBe("/api/admin/categories");
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-proof": rawProof
      }
    });
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual({
      slug: "tables",
      name: "Tables",
      description: "Dining and cocktail tables",
      sortOrder: 30,
      isPublished: true
    });
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("sends update category writes through the category id endpoint", async () => {
    const fetcher = createSuccessfulFetchMock();

    render(
      <CategoryManagementPanel
        categories={[category]}
        fetcher={fetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/category name for lounge/i), {
      target: {
        value: "Premium Lounge"
      }
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save category metadata/i })
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[1][0]).toBe(
      "/api/admin/categories/11111111-1111-4111-8111-111111111111"
    );
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "x-csrf-proof": rawProof
      }
    });
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toMatchObject({
      name: "Premium Lounge",
      description: "Soft seating",
      sortOrder: 20,
      isPublished: true
    });
  });

  it("sends archive category writes through the category archive endpoint", async () => {
    const fetcher = createSuccessfulFetchMock();

    render(
      <CategoryManagementPanel
        categories={[category]}
        fetcher={fetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /archive category lounge/i })
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[1][0]).toBe(
      "/api/admin/categories/11111111-1111-4111-8111-111111111111/archive"
    );
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "x-csrf-proof": rawProof
      },
      body: "{}"
    });
  });

  it("handles CSRF and backend failures with generic UI copy", async () => {
    const csrfFailure = vi.fn().mockResolvedValueOnce(
      jsonResponse(
        {
          ok: false,
          error: "internal proof details"
        },
        false
      )
    );
    const backendFailure = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          csrfProof: rawProof
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            ok: false,
            error: "sql provider stack"
          },
          false
        )
      );

    const { rerender } = render(
      <CategoryManagementPanel
        categories={[category]}
        fetcher={csrfFailure}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/new category slug/i), {
      target: {
        value: "staging"
      }
    });
    fireEvent.change(screen.getByLabelText(/new category name/i), {
      target: {
        value: "Staging"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /create category/i }));

    expect(
      await screen.findByText(/protected admin save could not be completed/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/internal proof details/i)).not.toBeInTheDocument();

    rerender(
      <CategoryManagementPanel
        categories={[category]}
        fetcher={backendFailure}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/new category slug/i), {
      target: {
        value: "staging"
      }
    });
    fireEvent.change(screen.getByLabelText(/new category name/i), {
      target: {
        value: "Staging"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /create category/i }));

    expect(
      await screen.findByText(/protected admin save could not be completed/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/sql provider stack/i)).not.toBeInTheDocument();
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });
});
