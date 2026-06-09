"use client";

import { useState, type FormEvent } from "react";

export type ListingManagementCategory = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isPublished: boolean;
  productCount: number;
};

export type ListingManagementProduct = {
  id: string;
  categoryId?: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  rentalUnit: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  imageCount: number;
  primaryImageAltText?: string;
};

type ListingManagementPanelProps = {
  categories: ListingManagementCategory[];
  products: ListingManagementProduct[];
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

type ListingPayload = {
  categoryId?: string;
  slug?: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  rentalUnit?: string;
  status?: ListingManagementProduct["status"];
  sortOrder?: number;
};

const listingWriteOperation = "product.write";
const genericFailureMessage =
  "Listing change could not be saved. Check required fields, keep public fields factual, and try again.";

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

function parseStatus(value: string): ListingManagementProduct["status"] | null {
  return value === "draft" || value === "published" || value === "archived"
    ? value
    : null;
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function listingReadiness(product: ListingManagementProduct) {
  const hasCategory = hasText(product.categoryId);
  const hasShortDescription = hasText(product.shortDescription);
  const hasDescription = hasText(product.description);
  const hasRentalUnit = hasText(product.rentalUnit);
  const hasImageMetadata = product.imageCount > 0;
  const hasPrimaryImage = hasText(product.primaryImageAltText);
  const hasQuotePlanning = hasShortDescription && hasDescription && hasRentalUnit;
  const ready =
    product.status === "published" &&
    hasCategory &&
    hasShortDescription &&
    hasDescription &&
    hasRentalUnit &&
    hasImageMetadata &&
    hasPrimaryImage;

  return {
    ready,
    label:
      product.status === "archived"
        ? "Archived from public browsing"
        : ready
          ? "Ready for public browsing"
          : "Needs attention before publishing",
    checks: [
      hasCategory ? "Category assigned" : "Missing category assignment",
      hasShortDescription
        ? "Short description present"
        : "Missing short description",
      hasDescription ? "Full description present" : "Missing full description",
      hasRentalUnit ? "Rental unit present" : "Missing rental unit",
      hasImageMetadata
        ? `${product.imageCount} image metadata records`
        : "Add image metadata before publishing",
      hasPrimaryImage
        ? "Primary public image available"
        : "Missing primary public image",
      hasQuotePlanning
        ? "Quote-planning details ready"
        : "Add quote-planning details before publication"
    ]
  };
}

function listingStatusCount(
  products: ListingManagementProduct[],
  status: ListingManagementProduct["status"]
) {
  return products.filter((product) => product.status === status).length;
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

async function requestListingWriteProof(fetcher: typeof fetch) {
  const response = await fetcher("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requestedOperation: listingWriteOperation,
      operation: listingWriteOperation
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

function buildPayload(
  formData: FormData,
  sortOrder: number | undefined
): ListingPayload | null {
  const status = parseStatus(formValue(formData, "status"));

  if (!status) {
    return null;
  }

  const categoryId = formValue(formData, "categoryId");
  const payload: ListingPayload = {
    ...(categoryId ? { categoryId } : {}),
    slug: formValue(formData, "slug"),
    name: formValue(formData, "name"),
    shortDescription: formValue(formData, "shortDescription"),
    description: formValue(formData, "description"),
    rentalUnit: formValue(formData, "rentalUnit"),
    status,
    ...(sortOrder !== undefined ? { sortOrder } : {})
  };

  return payload;
}

export function ListingManagementPanel({
  categories,
  products,
  fetcher = fetch,
  onMutationComplete = reloadDashboard
}: ListingManagementPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle"
  });
  const listingReadinessById = new Map(
    products.map((product) => [product.id, listingReadiness(product)])
  );
  const readyListings = products.filter(
    (product) => listingReadinessById.get(product.id)?.ready
  ).length;
  const listingsNeedingAttention = products.length - readyListings;
  const publishedListingsNeedingFixes = products.filter(
    (product) =>
      product.status === "published" &&
      !listingReadinessById.get(product.id)?.ready
  );

  async function submitListingMutation(
    endpoint: string,
    payload: ListingPayload,
    successMessage: string
  ) {
    setStatus({
      kind: "pending",
      message: "Saving protected listing write..."
    });

    try {
      const csrfProof = await requestListingWriteProof(fetcher);

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

    const formData = new FormData(event.currentTarget);
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

    const payload = buildPayload(formData, sortOrder.sortOrder);

    if (!payload) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    await submitListingMutation(
      "/api/admin/products",
      payload,
      "Listing created. Refreshing dashboard."
    );
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    product: ListingManagementProduct
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
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

    const payload = buildPayload(formData, sortOrder.sortOrder);

    if (!payload) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    await submitListingMutation(
      `/api/admin/products/${encodeURIComponent(product.id)}`,
      payload,
      "Listing updated. Refreshing dashboard."
    );
  }

  async function handleStatusChange(
    product: ListingManagementProduct,
    nextStatus: Extract<ListingManagementProduct["status"], "draft" | "published">
  ) {
    await submitListingMutation(
      `/api/admin/products/${encodeURIComponent(product.id)}`,
      {
        status: nextStatus
      },
      "Listing status updated. Refreshing dashboard."
    );
  }

  async function handleArchive(product: ListingManagementProduct) {
    await submitListingMutation(
      `/api/admin/products/${encodeURIComponent(product.id)}/archive`,
      {},
      "Listing archived. Refreshing dashboard."
    );
  }

  return (
    <section className="category-management" aria-label="Listing management">
      <div className="category-management__header">
        <p className="eyebrow">Metadata-only listing writes</p>
        <h2>Listing management</h2>
        <p>
          Create, update, publish, unpublish, and archive furniture listing
          metadata through the protected admin API. Public-facing fields should
          describe rental/event furniture only; internal readiness cues stay here.
        </p>
      </div>

      <div
        className={`category-management__status category-management__status--${status.kind}`}
        aria-live="polite"
      >
        {status.kind === "idle"
          ? "Listing write controls are ready."
          : status.message}
      </div>

      <section className="admin-readiness" aria-label="Publication readiness">
        <h3>Publication readiness</h3>
        <div className="admin-readiness__summary" aria-label="Listing status summary">
          <p>Published: {listingStatusCount(products, "published")}</p>
          <p>Draft: {listingStatusCount(products, "draft")}</p>
          <p>Archived: {listingStatusCount(products, "archived")}</p>
        </div>
        <p>
          {readyListings} ready for public browsing.{" "}
          {listingsNeedingAttention} needing attention.
        </p>
        <p>
          {publishedListingsNeedingFixes.length}{" "}
          {publishedListingsNeedingFixes.length === 1
            ? "published listing needs"
            : "published listings need"}{" "}
          publication fixes before public browsing.
        </p>
        {publishedListingsNeedingFixes.length > 0 ? (
          <p>
            Published listings needing fixes:{" "}
            {publishedListingsNeedingFixes
              .map((product) => product.name)
              .join(", ")}
          </p>
        ) : null}
        <p className="category-management__hint">
          Readiness is derived from existing listing metadata, category,
          descriptions, rental unit, and image metadata already available in
          this admin workspace. It is an admin-only cue, not a public availability claim.
        </p>
      </section>

      <form
        aria-label="Create listing"
        className="category-management__form"
        onSubmit={handleCreate}
      >
        <h3>Create listing</h3>
        <label htmlFor="new-listing-category">
          New listing category
          <select id="new-listing-category" name="categoryId">
            <option value="">No category - keep as draft until grouped</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <small>Choose the public category grouping used for browsing and quote/enquiry recovery.</small>
        </label>
        <label htmlFor="new-listing-slug">
          New listing slug
          <input
            id="new-listing-slug"
            name="slug"
            pattern="[a-z0-9][a-z0-9-]{1,98}[a-z0-9]"
            required
            type="text"
          />
          <small>Use lowercase letters, numbers, and hyphens; this can become part of the public listing URL.</small>
        </label>
        <label htmlFor="new-listing-name">
          New listing name
          <input id="new-listing-name" maxLength={160} name="name" required />
          <small>Use owner-approved rental/event furniture wording only; do not add unsupported availability assertions.</small>
        </label>
        <label htmlFor="new-listing-short-description">
          New listing short description
          <textarea
            id="new-listing-short-description"
            maxLength={240}
            name="shortDescription"
            rows={2}
          />
          <small>Short public browsing summary for quote planning; keep unsupported claims out.</small>
        </label>
        <label htmlFor="new-listing-description">
          New listing description
          <textarea
            id="new-listing-description"
            maxLength={2000}
            name="description"
            rows={4}
          />
          <small>Full public description should help enquiry planning without self-service or completion-flow language.</small>
        </label>
        <label htmlFor="new-listing-rental-unit">
          New listing rental unit
          <input
            defaultValue="item"
            id="new-listing-rental-unit"
            maxLength={80}
            name="rentalUnit"
            required
          />
          <small>Examples include item, set, or piece; this supports quote/request wording and is not stock availability.</small>
        </label>
        <label htmlFor="new-listing-status">
          New listing status
          <select defaultValue="draft" id="new-listing-status" name="status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <small>Draft stays protected, published can appear publicly when readiness checks pass, archived is hidden from active browsing.</small>
        </label>
        <label htmlFor="new-listing-sort-order">
          New listing sort order
          <input
            id="new-listing-sort-order"
            max={1000000}
            min={0}
            name="sortOrder"
            type="number"
          />
          <small>Lower numbers appear earlier in admin/public grouping where sorting is used.</small>
        </label>
        <button className="button" type="submit">
          Create listing
        </button>
      </form>

      <div className="category-management__list" aria-label="Update listings">
        {products.length === 0 ? (
          <section className="admin-dashboard__card admin-dashboard__card--summary">
            <p>
              No furniture listings are available to update yet. Create a draft
              listing above before adding media or publishing.
            </p>
          </section>
        ) : (
          products.map((product) => (
            <article className="category-management__item" key={product.id}>
              {(() => {
                const readiness = listingReadinessById.get(product.id) ??
                  listingReadiness(product);

                return (
                  <>
                    <div>
                      <h3>{product.name}</h3>
                      <p>
                        {product.slug} - {product.status} -{" "}
                        {product.imageCount} image metadata records
                      </p>
                    </div>
                    <section
                      className="admin-readiness admin-readiness--inline"
                      aria-label={`Publication readiness ${product.name}`}
                    >
                      <p
                        className={`admin-readiness__badge ${
                          readiness.ready
                            ? "admin-readiness__badge--ready"
                            : "admin-readiness__badge--attention"
                        }`}
                      >
                        {readiness.label}
                      </p>
                      <ul className="admin-readiness__list">
                        {readiness.checks.map((check) => (
                          <li key={check}>{check}</li>
                        ))}
                      </ul>
                    </section>
                  </>
                );
              })()}
              <form
                aria-label={`Update listing ${product.name}`}
                className="category-management__form"
                onSubmit={(event) => void handleUpdate(event, product)}
              >
                <label htmlFor={`listing-category-${product.id}`}>
                  Listing category for {product.name}
                  <select
                    defaultValue={product.categoryId ?? ""}
                    id={`listing-category-${product.id}`}
                    name="categoryId"
                  >
                    <option value="">No category - keep as draft until grouped</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <small>Public category grouping supports browsing and quote/enquiry recovery.</small>
                </label>
                <label htmlFor={`listing-slug-${product.id}`}>
                  Listing slug for {product.name}
                  <input
                    defaultValue={product.slug}
                    id={`listing-slug-${product.id}`}
                    name="slug"
                    pattern="[a-z0-9][a-z0-9-]{1,98}[a-z0-9]"
                    required
                    type="text"
                  />
                  <small>Slug may be used by public listing routes; keep it stable and factual.</small>
                </label>
                <label htmlFor={`listing-name-${product.id}`}>
                  Listing name for {product.name}
                  <input
                    defaultValue={product.name}
                    id={`listing-name-${product.id}`}
                    maxLength={160}
                    name="name"
                    required
                  />
                  <small>Public name should describe the rental/event furniture without unsupported assertions.</small>
                </label>
                <label htmlFor={`listing-short-description-${product.id}`}>
                  Listing short description for {product.name}
                  <textarea
                    defaultValue={product.shortDescription ?? ""}
                    id={`listing-short-description-${product.id}`}
                    maxLength={240}
                    name="shortDescription"
                    rows={2}
                  />
                  <small>Short description appears in browsing contexts and should support quote/request planning.</small>
                </label>
                <label htmlFor={`listing-description-${product.id}`}>
                  Listing description for {product.name}
                  <textarea
                    defaultValue={product.description ?? ""}
                    id={`listing-description-${product.id}`}
                    maxLength={2000}
                    name="description"
                    rows={4}
                  />
                  <small>Full description remains a public field; avoid self-service or completion-flow wording.</small>
                </label>
                <label htmlFor={`listing-rental-unit-${product.id}`}>
                  Rental unit label for {product.name}
                  <input
                    defaultValue={product.rentalUnit}
                    id={`listing-rental-unit-${product.id}`}
                    maxLength={80}
                    name="rentalUnit"
                    required
                  />
                  <small>Rental unit helps quote/enquiry wording and does not confirm availability.</small>
                </label>
                <label htmlFor={`listing-status-${product.id}`}>
                  Listing status for {product.name}
                  <select
                    defaultValue={product.status}
                    id={`listing-status-${product.id}`}
                    name="status"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <small>Draft is protected, published can be public when ready, and archived is hidden from active browsing.</small>
                </label>
                <label htmlFor={`listing-sort-order-${product.id}`}>
                  Listing sort order for {product.name}
                  <input
                    defaultValue={product.sortOrder}
                    id={`listing-sort-order-${product.id}`}
                    max={1000000}
                    min={0}
                    name="sortOrder"
                    type="number"
                  />
                  <small>Sort order controls display ordering where listing groups use it.</small>
                </label>
                <p className="category-management__hint">
                  Protected write boundary: save changes only after checking public-facing fields. Archive hides this listing from public browsing and active admin work; it does not delete it.
                </p>
                <div className="category-management__actions">
                  <button className="button" type="submit">
                    Save listing {product.name}
                  </button>
                  <button
                    className="button button--secondary"
                    onClick={() =>
                      void handleStatusChange(
                        product,
                        product.status === "published" ? "draft" : "published"
                      )
                    }
                    type="button"
                  >
                    {product.status === "published"
                      ? `Unpublish listing ${product.name}`
                      : `Publish listing ${product.name}`}
                  </button>
                  <button
                    className="button button--secondary"
                    onClick={() => void handleArchive(product)}
                    type="button"
                  >
                    Archive listing {product.name}
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
