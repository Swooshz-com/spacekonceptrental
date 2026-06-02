"use client";

import { useState, type FormEvent } from "react";

export type CategoryManagementCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
  isPublished: boolean;
  productCount: number;
};

type CategoryManagementPanelProps = {
  categories: CategoryManagementCategory[];
  fetcher?: typeof fetch;
  onMutationComplete?: () => void | Promise<void>;
};

type PanelStatus =
  | {
      kind: "idle";
    }
  | {
      kind: "pending";
      message: string;
    }
  | {
      kind: "success";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    };

type CategoryPayload = {
  slug?: string;
  name?: string;
  description?: string;
  sortOrder?: number;
  isPublished?: boolean;
};

const categoryWriteOperation = "category.write";
const genericFailureMessage =
  "Category change could not be saved. Try again or refresh the page.";

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalSortOrder(value: string) {
  if (!value) {
    return {
      ok: true as const
    };
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 0 ||
    parsed > 1_000_000
  ) {
    return {
      ok: false as const
    };
  }

  return {
    ok: true as const,
    sortOrder: parsed
  };
}

async function readSafeJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function requestCategoryWriteProof(fetcher: typeof fetch) {
  const response = await fetcher("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requestedOperation: categoryWriteOperation,
      operation: categoryWriteOperation
    })
  });

  if (!response.ok) {
    return null;
  }

  const body = await readSafeJson(response);

  if (
    !isRecord(body) ||
    body.ok !== true ||
    typeof body.csrfProof !== "string" ||
    !body.csrfProof.trim()
  ) {
    return null;
  }

  return body.csrfProof;
}

function reloadDashboard() {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

export function CategoryManagementPanel({
  categories,
  fetcher = fetch,
  onMutationComplete = reloadDashboard
}: CategoryManagementPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle"
  });

  async function submitCategoryMutation(
    endpoint: string,
    payload: CategoryPayload,
    successMessage: string
  ) {
    setStatus({
      kind: "pending",
      message: "Saving category change..."
    });

    try {
      const csrfProof = await requestCategoryWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericFailureMessage
        });
        return;
      }

      const response = await fetcher(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-proof": csrfProof
        },
        body: JSON.stringify(payload)
      });
      const responseBody = await readSafeJson(response);

      if (!response.ok || !isRecord(responseBody) || responseBody.ok !== true) {
        setStatus({
          kind: "error",
          message: genericFailureMessage
        });
        return;
      }

      setStatus({
        kind: "success",
        message: successMessage
      });

      try {
        await onMutationComplete();
      } catch {
        // Keep the rendered result generic even if the refresh hook is unavailable.
      }
    } catch {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const sortOrder = parseOptionalSortOrder(
      formValue(formData, "sortOrder")
    );

    if (!sortOrder.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    const isPublishedInput = form.elements.namedItem("isPublished");
    const payload: CategoryPayload = {
      slug: formValue(formData, "slug"),
      name: formValue(formData, "name"),
      description: formValue(formData, "description"),
      isPublished:
        isPublishedInput instanceof HTMLInputElement
          ? isPublishedInput.checked
          : false
    };

    if (sortOrder.sortOrder !== undefined) {
      payload.sortOrder = sortOrder.sortOrder;
    }

    await submitCategoryMutation(
      "/api/admin/categories",
      payload,
      "Category created. Refreshing dashboard."
    );
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    category: CategoryManagementCategory
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const sortOrder = parseOptionalSortOrder(
      formValue(formData, "sortOrder")
    );

    if (!sortOrder.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    const isPublishedInput = form.elements.namedItem("isPublished");
    const payload: CategoryPayload = {
      name: formValue(formData, "name"),
      description: formValue(formData, "description"),
      isPublished:
        isPublishedInput instanceof HTMLInputElement
          ? isPublishedInput.checked
          : false
    };

    if (sortOrder.sortOrder !== undefined) {
      payload.sortOrder = sortOrder.sortOrder;
    }

    await submitCategoryMutation(
      `/api/admin/categories/${encodeURIComponent(category.id)}`,
      payload,
      "Category updated. Refreshing dashboard."
    );
  }

  async function handleArchive(category: CategoryManagementCategory) {
    await submitCategoryMutation(
      `/api/admin/categories/${encodeURIComponent(category.id)}/archive`,
      {},
      "Category archived. Refreshing dashboard."
    );
  }

  return (
    <section className="category-management" aria-label="Category management">
      <div className="category-management__header">
        <p className="eyebrow">Category-only writes</p>
        <h2>Category management</h2>
        <p>
          Create, update, and archive categories through the protected admin
          API. Furniture listing and listing image editing stay out of scope.
        </p>
      </div>

      <div
        className={`category-management__status category-management__status--${status.kind}`}
        aria-live="polite"
      >
        {status.kind === "idle"
          ? "Category write controls are ready."
          : status.message}
      </div>

      <form
        aria-label="Create category"
        className="category-management__form"
        onSubmit={handleCreate}
      >
        <h3>Create category</h3>
        <label htmlFor="new-category-slug">
          New category slug
          <input
            id="new-category-slug"
            name="slug"
            pattern="[a-z0-9][a-z0-9-]{1,98}[a-z0-9]"
            required
            type="text"
          />
        </label>
        <label htmlFor="new-category-name">
          New category name
          <input id="new-category-name" maxLength={120} name="name" required />
        </label>
        <label htmlFor="new-category-description">
          New category description
          <textarea
            id="new-category-description"
            maxLength={1000}
            name="description"
            rows={3}
          />
        </label>
        <label htmlFor="new-category-sort-order">
          New category sort order
          <input
            id="new-category-sort-order"
            max={1000000}
            min={0}
            name="sortOrder"
            type="number"
          />
        </label>
        <label className="category-management__checkbox" htmlFor="new-category-published">
          <input
            defaultChecked
            id="new-category-published"
            name="isPublished"
            type="checkbox"
          />
          Publish new category
        </label>
        <button className="button" type="submit">
          Create category
        </button>
      </form>

      <div className="category-management__list" aria-label="Update categories">
        {categories.length === 0 ? (
          <p>No categories are available to update yet.</p>
        ) : (
          categories.map((category) => (
            <article className="category-management__item" key={category.id}>
              <div>
                <h3>{category.name}</h3>
                <p>
                  {category.slug} - {category.productCount} listings -{" "}
                  {category.isPublished ? "Published" : "Not published"}
                </p>
              </div>
              <form
                aria-label={`Update category ${category.name}`}
                className="category-management__form"
                onSubmit={(event) => void handleUpdate(event, category)}
              >
                <label htmlFor={`category-name-${category.id}`}>
                  Category name for {category.name}
                  <input
                    defaultValue={category.name}
                    id={`category-name-${category.id}`}
                    maxLength={120}
                    name="name"
                    required
                  />
                </label>
                <label htmlFor={`category-description-${category.id}`}>
                  Category description for {category.name}
                  <textarea
                    defaultValue={category.description ?? ""}
                    id={`category-description-${category.id}`}
                    maxLength={1000}
                    name="description"
                    rows={3}
                  />
                </label>
                <label htmlFor={`category-sort-order-${category.id}`}>
                  Category sort order for {category.name}
                  <input
                    defaultValue={category.sortOrder}
                    id={`category-sort-order-${category.id}`}
                    max={1000000}
                    min={0}
                    name="sortOrder"
                    type="number"
                  />
                </label>
                <label
                  className="category-management__checkbox"
                  htmlFor={`category-published-${category.id}`}
                >
                  <input
                    defaultChecked={category.isPublished}
                    id={`category-published-${category.id}`}
                    name="isPublished"
                    type="checkbox"
                  />
                  Publish {category.name}
                </label>
                <div className="category-management__actions">
                  <button className="button" type="submit">
                    Save category {category.name}
                  </button>
                  <button
                    className="button button--secondary"
                    onClick={() => void handleArchive(category)}
                    type="button"
                  >
                    Archive category {category.name}
                  </button>
                </div>
              </form>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
