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
  publishedProductCount?: number;
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
  "Protected admin save could not be completed. Check category name, slug, description, visibility, and sort order before retrying.";

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalSortOrder(value: string) {
  if (!value) {
    return {
      ok: true as const,
    };
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1_000_000) {
    return {
      ok: false as const,
    };
  }

  return {
    ok: true as const,
    sortOrder: parsed,
  };
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function publishedProductCount(category: CategoryManagementCategory) {
  return category.publishedProductCount ?? category.productCount;
}

function categoryVisibilityChecks(category: CategoryManagementCategory) {
  const publicListingCount = publishedProductCount(category);

  return [
    category.isPublished && publicListingCount > 0
      ? `Published grouping with ${publicListingCount} ${
          publicListingCount === 1 ? "listing" : "listings"
        } for public browsing`
      : category.isPublished
        ? "Published category has no published listings"
        : "Not published for public browsing",
    publicListingCount > 0
      ? "Listings are grouped for public browsing"
      : "Add listings before this category helps public browsing",
    hasText(category.description)
      ? "Category description present"
      : "Add a category description for admin clarity",
  ];
}

function categoriesWithoutPublishedListings(
  categories: CategoryManagementCategory[],
) {
  return categories.filter(
    (category) => category.isPublished && publishedProductCount(category) === 0,
  );
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
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestedOperation: categoryWriteOperation,
      operation: categoryWriteOperation,
    }),
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
  onMutationComplete = reloadDashboard,
}: CategoryManagementPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle",
  });
  const publishedEmptyCategories =
    categoriesWithoutPublishedListings(categories);

  async function submitCategoryMutation(
    endpoint: string,
    payload: CategoryPayload,
    successMessage: string,
  ) {
    setStatus({
      kind: "pending",
      message: "Protected admin save is checking category metadata...",
    });

    try {
      const csrfProof = await requestCategoryWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericFailureMessage,
        });
        return;
      }

      const response = await fetcher(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-proof": csrfProof,
        },
        body: JSON.stringify(payload),
      });
      const responseBody = await readSafeJson(response);

      if (!response.ok || !isRecord(responseBody) || responseBody.ok !== true) {
        setStatus({
          kind: "error",
          message: genericFailureMessage,
        });
        return;
      }

      setStatus({
        kind: "success",
        message: successMessage,
      });

      try {
        await onMutationComplete();
      } catch {
        // Keep the rendered result generic even if the refresh hook is unavailable.
      }
    } catch {
      setStatus({
        kind: "error",
        message: genericFailureMessage,
      });
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));

    if (!sortOrder.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage,
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
          : false,
    };

    if (sortOrder.sortOrder !== undefined) {
      payload.sortOrder = sortOrder.sortOrder;
    }

    await submitCategoryMutation(
      "/api/admin/categories",
      payload,
      "Category metadata saved for protected admin review. Refreshing dashboard.",
    );
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    category: CategoryManagementCategory,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));

    if (!sortOrder.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage,
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
          : false,
    };

    if (sortOrder.sortOrder !== undefined) {
      payload.sortOrder = sortOrder.sortOrder;
    }

    await submitCategoryMutation(
      `/api/admin/categories/${encodeURIComponent(category.id)}`,
      payload,
      "Category metadata saved for protected admin review. Refreshing dashboard.",
    );
  }

  async function handleArchive(category: CategoryManagementCategory) {
    await submitCategoryMutation(
      `/api/admin/categories/${encodeURIComponent(category.id)}/archive`,
      {},
      "Category archive state saved for protected admin review. Refreshing dashboard.",
    );
  }

  return (
    <section className="premium-section" aria-label="Category management">
      <div className="premium-container" style={{ maxWidth: '1000px' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Protected admin save</p>
          <h2 className="premium-title-section" style={{ fontSize: '28px', marginBottom: '16px' }}>Category management</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Create, update, set visibility, and archive categories through the
            protected admin API. Furniture listing edits use their own protected
            panel, and image file handling stays out of scope. Categories are
            public grouping metadata when visible.
          </p>
        </div>

        {status.kind !== "idle" && (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '32px',
              fontSize: '14px',
              fontWeight: 500,
              ...(status.kind === "success" ? { background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' } :
                  status.kind === "error" ? { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' } :
                  { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' })
            }}
            aria-live="polite"
          >
            {status.message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', marginBottom: '48px' }}>
          <section className="premium-card" style={{ padding: '24px' }} aria-label="Category public-safe copy review">
            <h3 className="premium-title-card" style={{ fontSize: '18px', marginBottom: '12px' }}>Public-safe copy review</h3>
            <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '16px' }}>
              Save category metadata only after reviewing category name, slug,
              description, visibility wording, empty category warnings, and sort order.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', background: 'var(--background)', padding: '12px', borderRadius: 'var(--radius-md)', margin: 0 }}>
              Protected admin save only updates category metadata. Use these notes
              to keep public catalogue grouping clear for visitors and business owners.
            </p>
          </section>

          <section className="premium-card" style={{ padding: '24px' }} aria-label="Category visibility review">
            <h3 className="premium-title-card" style={{ fontSize: '18px', marginBottom: '12px' }}>Category visibility review</h3>
            <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '16px' }}>
              Categories should group rental listings that are ready for public-safe
              copy review. Non-visible categories stay out of public catalogue grouping.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', background: 'var(--background)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              Category visibility checks use published listing counts when they are
              available from the admin dashboard. Empty published categories are
              protected admin recovery cues, not public promises.
            </p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: publishedEmptyCategories.length > 0 ? '#ef4444' : '#22c55e', margin: 0 }}>
              {publishedEmptyCategories.length > 0
                ? `Published categories without published listings: ${publishedEmptyCategories.map((category) => category.name).join(", ")}.`
                : "All published categories have published listings or are intentionally unpublished."}
            </p>
          </section>
        </div>

        <form
          aria-label="Create category"
          className="premium-form-card"
          style={{ marginBottom: '64px' }}
          onSubmit={handleCreate}
        >
          <h3 className="premium-title-section" style={{ fontSize: '20px', marginBottom: '24px' }}>Create category</h3>

          <div style={{ display: 'grid', gap: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New category slug
              <input
                id="new-category-slug"
                name="slug"
                pattern="[a-z0-9][a-z0-9-]{1,98}[a-z0-9]"
                required
                type="text"
                className="premium-input"
              />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Use lowercase letters, numbers, and hyphens for public category URLs.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New category name
              <input id="new-category-name" maxLength={120} name="name" required className="premium-input" />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Name the rental/event furniture grouping without sales-flow wording.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New category description
              <textarea
                id="new-category-description"
                maxLength={1000}
                name="description"
                rows={3}
                className="premium-input"
                style={{ resize: 'vertical' }}
              />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Description helps public browsing and quote/enquiry recovery; keep internal notes out.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New category sort order
              <input
                id="new-category-sort-order"
                max={1000000}
                min={0}
                name="sortOrder"
                type="number"
                className="premium-input"
              />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Lower numbers appear earlier where category ordering is used.
              </small>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, padding: '16px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <input
                defaultChecked
                id="new-category-published"
                name="isPublished"
                type="checkbox"
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
              />
              Make new category visible for public grouping after review
            </label>

            <button className="premium-button premium-button--primary" type="submit" style={{ marginTop: '12px' }}>
              Create category
            </button>
          </div>
        </form>

        <div aria-label="Update categories">
          <h3 className="premium-title-section" style={{ fontSize: '24px', marginBottom: '24px' }}>Existing Categories</h3>
          {categories.length === 0 ? (
            <div className="premium-card" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                No categories are available to update yet. Create a protected
                draft category before grouping public rental listings or
                recovering quote/enquiry context.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {categories.map((category) => (
                <article className="premium-card" key={category.id} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '24px', background: 'var(--surface-strong)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 className="premium-title-card" style={{ fontSize: '20px', color: '#fff', margin: 0, marginBottom: '4px' }}>{category.name}</h3>
                      <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0 }}>
                        {category.slug} • {category.productCount} listings •{" "}
                        <span style={{ color: category.isPublished ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>{category.isPublished ? "Published" : "Not published"}</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '24px' }}>
                    <section aria-label={`Category visibility review ${category.name}`} style={{ marginBottom: '24px', padding: '16px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {categoryVisibilityChecks(category).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <form
                      aria-label={`Update category ${category.name}`}
                      onSubmit={(event) => void handleUpdate(event, category)}
                      style={{ display: 'grid', gap: '20px' }}
                    >
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Category name for {category.name}
                        <input
                          defaultValue={category.name}
                          id={`category-name-${category.id}`}
                          maxLength={120}
                          name="name"
                          required
                          className="premium-input"
                        />
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Category description for {category.name}
                        <textarea
                          defaultValue={category.description ?? ""}
                          id={`category-description-${category.id}`}
                          maxLength={1000}
                          name="description"
                          rows={3}
                          className="premium-input"
                          style={{ resize: 'vertical' }}
                        />
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Category sort order for {category.name}
                        <input
                          defaultValue={category.sortOrder}
                          id={`category-sort-order-${category.id}`}
                          max={1000000}
                          min={0}
                          name="sortOrder"
                          type="number"
                          className="premium-input"
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, padding: '16px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                        <input
                          defaultChecked={category.isPublished}
                          id={`category-published-${category.id}`}
                          name="isPublished"
                          type="checkbox"
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                        />
                        Make {category.name} visible for public grouping
                      </label>

                      <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                        Protected write boundary: save category metadata only when
                        grouping and listing-count cues are clear. Check validation
                        errors and public-safe description before saving. Non-visible
                        or archived categories stay out of public browsing without
                        deleting the category record.
                      </p>

                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <button
                          aria-label={`Save category metadata for ${category.name}`}
                          className="premium-button premium-button--primary"
                          type="submit"
                          style={{ flex: 1 }}
                        >
                          Save category metadata
                        </button>
                        <button
                          aria-label={`Archive category ${category.name}`}
                          className="premium-button premium-button--secondary"
                          onClick={() => void handleArchive(category)}
                          type="button"
                          style={{ flex: 1 }}
                        >
                          Archive
                        </button>
                      </div>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
