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
  "Protected admin save could not be completed. Check listing title, slug, category, rental unit, descriptions, status, and sort order before retrying.";

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
  const hasQuotePlanning =
    hasShortDescription && hasDescription && hasRentalUnit;
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
          ? "Public-ready listing"
          : "Needs public-ready listing review",
    checks: [
      hasCategory ? "Category assigned" : "Missing category assignment",
      hasShortDescription
        ? "Short description present"
        : "Missing short description",
      hasDescription ? "Full description present" : "Missing full description",
      hasRentalUnit ? "Rental unit present" : "Missing rental unit",
      hasImageMetadata
        ? `${product.imageCount} image metadata records`
        : "Missing image or fallback image",
      hasPrimaryImage
        ? "Primary public image available"
        : "Missing primary public image",
      hasQuotePlanning
        ? "Quote-planning details ready"
        : "Add quote-planning details before publication",
    ],
  };
}

function listingStatusCount(
  products: ListingManagementProduct[],
  status: ListingManagementProduct["status"],
) {
  return products.filter((product) => product.status === status).length;
}

function categoryLabel(
  product: ListingManagementProduct,
  categories: ListingManagementCategory[],
) {
  const category = categories.find((item) => item.id === product.categoryId);

  return category ? `${category.name} category` : "No category assigned";
}

function visibilityLabel(status: ListingManagementProduct["status"]) {
  if (status === "published") {
    return "Published - visible in public catalogue";
  }

  if (status === "archived") {
    return "Archived - hidden from active browsing";
  }

  return "Draft - protected";
}

function imagePresenceLabel(product: ListingManagementProduct) {
  if (product.imageCount <= 0) {
    return "Missing image or fallback image";
  }

  if (!hasText(product.primaryImageAltText)) {
    return `${product.imageCount} image metadata records; missing primary public image`;
  }

  return `${product.imageCount} image metadata records; primary public image ready`;
}

function listingFormId(product: ListingManagementProduct) {
  return `listing-form-${product.id}`;
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
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestedOperation: listingWriteOperation,
      operation: listingWriteOperation,
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

function buildPayload(
  formData: FormData,
  sortOrder: number | undefined,
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
    ...(sortOrder !== undefined ? { sortOrder } : {}),
  };

  return payload;
}

export function ListingManagementPanel({
  categories,
  products,
  fetcher = fetch,
  onMutationComplete = reloadDashboard,
}: ListingManagementPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle",
  });
  const listingReadinessById = new Map(
    products.map((product) => [product.id, listingReadiness(product)]),
  );
  const readyListings = products.filter(
    (product) => listingReadinessById.get(product.id)?.ready,
  ).length;
  const listingsNeedingAttention = products.length - readyListings;
  const publishedListingsNeedingFixes = products.filter(
    (product) =>
      product.status === "published" &&
      !listingReadinessById.get(product.id)?.ready,
  );

  async function submitListingMutation(
    endpoint: string,
    payload: ListingPayload,
    successMessage: string,
  ) {
    setStatus({
      kind: "pending",
      message: "Protected admin save is checking listing metadata...",
    });

    try {
      const csrfProof = await requestListingWriteProof(fetcher);

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

    const formData = new FormData(event.currentTarget);
    const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));

    if (!sortOrder.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage,
      });
      return;
    }

    const payload = buildPayload(formData, sortOrder.sortOrder);

    if (!payload) {
      setStatus({
        kind: "error",
        message: genericFailureMessage,
      });
      return;
    }

    await submitListingMutation(
      "/api/admin/products",
      payload,
      "Listing metadata saved for protected admin review. Refreshing dashboard.",
    );
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    product: ListingManagementProduct,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));

    if (!sortOrder.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage,
      });
      return;
    }

    const payload = buildPayload(formData, sortOrder.sortOrder);

    if (!payload) {
      setStatus({
        kind: "error",
        message: genericFailureMessage,
      });
      return;
    }

    await submitListingMutation(
      `/api/admin/products/${encodeURIComponent(product.id)}`,
      payload,
      "Listing metadata saved for protected admin review. Refreshing dashboard.",
    );
  }

  async function handleStatusChange(
    product: ListingManagementProduct,
    nextStatus: Extract<
      ListingManagementProduct["status"],
      "draft" | "published"
    >,
  ) {
    await submitListingMutation(
      `/api/admin/products/${encodeURIComponent(product.id)}`,
      {
        status: nextStatus,
      },
      "Listing status saved for protected admin review. Refreshing dashboard.",
    );
  }

  async function handleArchive(product: ListingManagementProduct) {
    await submitListingMutation(
      `/api/admin/products/${encodeURIComponent(product.id)}/archive`,
      {},
      "Listing archive state saved for protected admin review. Refreshing dashboard.",
    );
  }

  return (
    <section className="category-management" aria-label="Listing management">
      <div className="category-management__header">
        <p className="eyebrow">Protected admin save</p>
        <h2>Listing management</h2>
        <p>
          Create, update, set visibility, and archive furniture listing metadata
          through the protected admin API. Public-facing fields should describe
          rental/event furniture only. Public-ready listing cues stay in this
          protected admin workspace for business owner review.
        </p>
      </div>

      <div
        className={`category-management__status category-management__status--${status.kind}`}
        aria-live="polite"
      >
        {status.kind === "idle"
          ? "Listing write controls are ready for protected admin save."
          : status.message}
      </div>

      <section className="admin-readiness" aria-label="Public-safe copy review">
        <h3>Public-safe copy review</h3>
        <p>
          Save listing metadata only after reviewing listing title, slug,
          category, rental unit, short description, long description, visibility
          status, and sort order.
        </p>
        <p className="category-management__hint">
          Protected admin save only updates listing metadata. Public-facing copy
          should use owner-supplied facts and help visitors prepare a quote
          request.
        </p>
      </section>

      <section className="admin-readiness" aria-label="Public-ready listing summary">
        <h3>Public-ready listing summary</h3>
        <div
          className="admin-readiness__summary"
          aria-label="Listing status summary"
        >
          <p>Published: {listingStatusCount(products, "published")}</p>
          <p>Draft: {listingStatusCount(products, "draft")}</p>
          <p>Archived: {listingStatusCount(products, "archived")}</p>
        </div>
        <p>
          {readyListings} public-ready listings. {listingsNeedingAttention}{" "}
          needing public-ready listing review.
        </p>
        <p>
          {publishedListingsNeedingFixes.length}{" "}
          {publishedListingsNeedingFixes.length === 1
            ? "published listing needs"
            : "published listings need"}{" "}
          public-ready listing fixes before visitor browsing review.
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
          This summary is based on existing listing metadata, category,
          descriptions, rental unit, and image metadata already available in
          this protected admin workspace. It is an admin cue, not a public
          availability claim.
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
          <small>
            Choose the public category grouping used for browsing and
            quote/enquiry recovery.
          </small>
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
          <small>
            Use lowercase letters, numbers, and hyphens; this can become part of
            the public listing URL.
          </small>
        </label>
        <label htmlFor="new-listing-name">
          New listing name
          <input id="new-listing-name" maxLength={160} name="name" required />
          <small>
            Use owner-supplied rental/event furniture wording only; do not add
            unsupported availability assertions.
          </small>
        </label>
        <label htmlFor="new-listing-short-description">
          New listing short description
          <textarea
            id="new-listing-short-description"
            maxLength={240}
            name="shortDescription"
            rows={2}
          />
          <small>
            Short public browsing summary for quote planning; keep unsupported
            claims out.
          </small>
        </label>
        <label htmlFor="new-listing-description">
          New listing description
          <textarea
            id="new-listing-description"
            maxLength={2000}
            name="description"
            rows={4}
          />
          <small>
            Full public description should help enquiry planning without
            self-service or completion-flow language.
          </small>
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
          <small>
            Examples include item, set, or piece; this supports quote/request
            wording and is not stock availability.
          </small>
        </label>
        <label htmlFor="new-listing-status">
          New listing status
          <select defaultValue="draft" id="new-listing-status" name="status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <small>
            Draft stays protected for recovery, published can appear publicly
            when public-ready checks pass, and archived is hidden from active
            browsing without deleting the record.
          </small>
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
          <small>
            Lower numbers appear earlier in admin/public grouping where sorting
            is used.
          </small>
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
            <article
              aria-label={`Listing content ${product.name}`}
              className="category-management__item"
              key={product.id}
            >
              {(() => {
                const readiness =
                  listingReadinessById.get(product.id) ??
                  listingReadiness(product);
                const formId = listingFormId(product);

                return (
                  <>
                    <div>
                      <h3>{product.name}</h3>
                      <dl className="quote-inbox__details">
                        <div>
                          <dt>Category/type</dt>
                          <dd>{categoryLabel(product, categories)}</dd>
                        </div>
                        <div>
                          <dt>Public slug</dt>
                          <dd>{product.slug}</dd>
                        </div>
                        <div>
                          <dt>Visibility</dt>
                          <dd>{visibilityLabel(product.status)}</dd>
                        </div>
                        <div>
                          <dt>Rental unit</dt>
                          <dd>{product.rentalUnit || "Missing rental unit"}</dd>
                        </div>
                        <div>
                          <dt>Image/fallback</dt>
                          <dd>{imagePresenceLabel(product)}</dd>
                        </div>
                      </dl>
                      <nav
                        aria-label={`Listing actions ${product.name}`}
                        className="category-management__actions"
                      >
                        <a
                          className="button button--secondary"
                          href={`/listings/${encodeURIComponent(product.slug)}`}
                        >
                          View public listing {product.name}
                        </a>
                        <a
                          className="button button--secondary"
                          href={`#${formId}`}
                        >
                          Edit listing {product.name}
                        </a>
                        <a className="button button--secondary" href="/admin/listings">
                          Return to catalogue admin
                        </a>
                      </nav>
                    </div>
                    <section
                      className="admin-readiness admin-readiness--inline"
                      aria-label={`Public-ready listing helper ${product.name}`}
                    >
                      <h4>Public-ready listing helper</h4>
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
                id={listingFormId(product)}
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
                    <option value="">
                      No category - keep as draft until grouped
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <small>
                    Public category grouping supports browsing and quote/enquiry
                    recovery.
                  </small>
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
                  <small>
                    Slug may be used by public listing routes; keep it stable
                    and factual.
                  </small>
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
                  <small>
                    Public name should describe the rental/event furniture
                    without unsupported assertions.
                  </small>
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
                  <small>
                    Short description appears in browsing contexts and should
                    support quote/request planning.
                  </small>
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
                  <small>
                    Full description remains a public field; avoid self-service
                    or completion-flow wording.
                  </small>
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
                  <small>
                    Rental unit helps quote/enquiry wording and does not confirm
                    availability.
                  </small>
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
                  <small>
                    Draft is protected, published is a public visibility state
                    only after public-safe copy review, and archived is hidden
                    from active browsing. Draft keeps the listing protected
                    until public-ready checks pass and archive does not delete it.
                  </small>
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
                  <small>
                    Sort order controls display ordering where listing groups
                    use it.
                  </small>
                </label>
                <p className="category-management__hint">
                  Protected write boundary: save listing metadata only after
                  checking public-facing fields, category, rental unit,
                  validation errors, and media checks. Archive hides this
                  listing from public browsing and active admin work; it does
                  not delete it.
                </p>
                <div className="category-management__actions">
                  <button className="button" type="submit">
                    Save listing metadata
                  </button>
                  <button
                    className="button button--secondary"
                    onClick={() =>
                      void handleStatusChange(
                        product,
                        product.status === "published" ? "draft" : "published",
                      )
                    }
                    type="button"
                  >
                    {product.status === "published"
                      ? `Set ${product.name} to draft visibility`
                      : `Set ${product.name} to public visibility`}
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
