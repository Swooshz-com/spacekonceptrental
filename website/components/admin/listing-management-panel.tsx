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
  const hasActivePublicImage = product.imageCount > 0;
  const hasPrimaryImageAltText = hasText(product.primaryImageAltText);
  const hasQuotePlanning =
    hasShortDescription && hasDescription && hasRentalUnit;
  const ready =
    product.status === "published" &&
    hasCategory &&
    hasShortDescription &&
    hasDescription &&
    hasRentalUnit &&
    hasActivePublicImage &&
    hasPrimaryImageAltText;
  const statusCheck =
    product.status === "published"
      ? "Published - visible in public catalogue"
      : product.status === "archived"
        ? "Listing is archived and hidden from active browsing"
        : "Listing is draft and not publicly visible";
  const nextAction =
    ready
      ? "Next admin action: preview the public listing and keep quote request details accurate."
      : !hasCategory ||
          !hasShortDescription ||
          !hasDescription ||
          !hasRentalUnit ||
          !hasActivePublicImage
        ? "Next admin action: add public listing copy and public image coverage before setting public visibility."
        : !hasPrimaryImageAltText
          ? "Next admin action: choose a primary public image and add public image alt text."
          : "Next admin action: review visibility before publishing.";

  return {
    ready,
    label:
      product.status === "archived"
        ? "Archived from public browsing"
        : ready
          ? "Public-ready listing"
          : "Needs public-ready listing review",
    statusLabel:
      product.status === "archived"
        ? "Archived from public listing review"
        : ready
          ? "Ready for public listing review"
          : "Needs admin fixes before public listing review",
    nextAction,
    checks: [
      statusCheck,
      hasCategory ? "Category assigned" : "Missing category assignment",
      hasShortDescription
        ? "Short description present"
        : "Missing short description",
      hasDescription ? "Full description present" : "Missing full description",
      hasRentalUnit ? "Rental details present" : "Missing rental details",
      hasActivePublicImage
        ? "Active public image present"
        : "Missing active public image",
      hasActivePublicImage
        ? `${product.imageCount} image metadata records`
        : "Missing image or fallback image",
      hasPrimaryImageAltText
        ? "Primary public image available"
        : "Missing primary public image",
      hasPrimaryImageAltText
        ? "Primary image alt text present"
        : "Missing primary image alt text",
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
    return `${product.imageCount} image metadata records; primary image needs alt text`;
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
    <section className="premium-section" aria-label="Listing management">
      <div className="premium-container" style={{ maxWidth: '1000px' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Protected admin save</p>
          <h2 className="premium-title-section" style={{ fontSize: '28px', marginBottom: '16px' }}>Listing management</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Create, update, set visibility, and archive furniture listing metadata
            through the protected admin API. Public-facing fields should describe
            rental/event furniture only. Public-ready listing cues stay in this
            protected admin workspace for business owner review.
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '48px' }}>
          <section className="premium-card" style={{ padding: '24px' }} aria-label="Public-safe copy review">
            <h3 className="premium-title-card" style={{ fontSize: '18px', marginBottom: '12px' }}>Public-safe copy review</h3>
            <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '16px' }}>
              Save listing metadata only after reviewing listing title, slug,
              category, rental unit, short description, long description, visibility
              status, and sort order.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', background: 'var(--background)', padding: '12px', borderRadius: 'var(--radius-md)', margin: 0 }}>
              Protected admin save only updates listing metadata. Public-facing copy
              should use owner-supplied facts and help visitors prepare a quote
              request.
            </p>
          </section>

          <section className="premium-card" style={{ padding: '24px' }} aria-label="Public-ready listing summary">
            <h3 className="premium-title-card" style={{ fontSize: '18px', marginBottom: '16px' }}>Public-ready listing summary</h3>
            <div
              style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}
              aria-label="Listing status summary"
            >
              <div style={{ background: 'var(--background)', padding: '12px', borderRadius: 'var(--radius-md)', flex: 1, minWidth: '100px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{listingStatusCount(products, "published")}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Published</div>
              </div>
              <div style={{ background: 'var(--background)', padding: '12px', borderRadius: 'var(--radius-md)', flex: 1, minWidth: '100px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{listingStatusCount(products, "draft")}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Draft</div>
              </div>
              <div style={{ background: 'var(--background)', padding: '12px', borderRadius: 'var(--radius-md)', flex: 1, minWidth: '100px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{listingStatusCount(products, "archived")}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Archived</div>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0 }}>
                Published: {listingStatusCount(products, "published")}. Draft: {listingStatusCount(products, "draft")}. Archived: {listingStatusCount(products, "archived")}.
              </p>
              <p style={{ margin: 0 }}>
                {readyListings} public-ready listings; {listingsNeedingAttention}{" "}
                needing public-ready listing review.
              </p>
              <p style={{ margin: 0, color: publishedListingsNeedingFixes.length > 0 ? '#ef4444' : 'inherit' }}>
                <strong>{publishedListingsNeedingFixes.length}</strong>{" "}
                {publishedListingsNeedingFixes.length === 1
                  ? "published listing needs"
                  : "published listings need"}{" "}
                public-ready listing fixes before visitor browsing review.
              </p>
              {publishedListingsNeedingFixes.length > 0 && (
                <>
                  <p style={{ margin: 0 }}>
                    Published listings needing fixes: {publishedListingsNeedingFixes.map((product) => product.name).join(", ")}.
                  </p>
                  <p style={{ margin: 0, padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px' }}>
                    <strong>Fixes needed:</strong>{" "}
                    {publishedListingsNeedingFixes
                      .map((product) => product.name)
                      .join(", ")}
                  </p>
                </>
              )}
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>
                This summary is based on existing listing metadata, category,
                descriptions, rental unit, and image metadata already available in
                this protected admin workspace. It is an admin cue, not a public
                availability claim.
              </p>
            </div>
          </section>
        </div>

        <form
          aria-label="Create listing"
          className="premium-form-card"
          style={{ marginBottom: '64px' }}
          onSubmit={handleCreate}
        >
          <h3 className="premium-title-section" style={{ fontSize: '20px', marginBottom: '24px' }}>Create listing</h3>

          <div style={{ display: 'grid', gap: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New listing category
              <select id="new-listing-category" name="categoryId" className="premium-input" style={{ width: '100%', height: '48px', appearance: 'auto' }}>
                <option value="">No category - keep as draft until grouped</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Choose the public category grouping used for browsing and
                quote/enquiry recovery.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New listing slug
              <input
                id="new-listing-slug"
                name="slug"
                pattern="[a-z0-9][a-z0-9-]{1,98}[a-z0-9]"
                required
                type="text"
                className="premium-input"
              />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Use lowercase letters, numbers, and hyphens; this can become part of
                the public listing URL.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New listing name
              <input id="new-listing-name" maxLength={160} name="name" required className="premium-input" />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Use owner-supplied rental/event furniture wording only; do not add
                unsupported availability assertions.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New listing short description
              <textarea
                id="new-listing-short-description"
                maxLength={240}
                name="shortDescription"
                rows={2}
                className="premium-input"
                style={{ height: 'auto', resize: 'vertical' }}
              />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Short public browsing summary for quote planning; keep unsupported
                claims out.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New listing description
              <textarea
                id="new-listing-description"
                maxLength={2000}
                name="description"
                rows={4}
                className="premium-input"
                style={{ height: 'auto', resize: 'vertical' }}
              />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Full public description should help enquiry planning without
                self-service or completion-flow language.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New listing rental unit
              <input
                defaultValue="item"
                id="new-listing-rental-unit"
                maxLength={80}
                name="rentalUnit"
                required
                className="premium-input"
              />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Examples include item, set, or piece; this supports quote/request
                wording and is not stock availability.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New listing status
              <select defaultValue="draft" id="new-listing-status" name="status" className="premium-input" style={{ width: '100%', height: '48px', appearance: 'auto' }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Draft stays protected for recovery, published can appear publicly
                when public-ready checks pass, and archived is hidden from active
                browsing without deleting the record.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New listing sort order
              <input
                id="new-listing-sort-order"
                max={1000000}
                min={0}
                name="sortOrder"
                type="number"
                className="premium-input"
              />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Lower numbers appear earlier in admin/public grouping where sorting
                is used.
              </small>
            </label>

            <button className="premium-button premium-button--primary" type="submit" style={{ marginTop: '12px' }}>
              Create listing
            </button>
          </div>
        </form>

        <div aria-label="Update listings">
          <h3 className="premium-title-section" style={{ fontSize: '24px', marginBottom: '24px' }}>Existing Listings</h3>
          {products.length === 0 ? (
            <div className="premium-card" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                No furniture listings are available to update yet. Create a draft
                listing above before adding media or publishing.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {products.map((product) => (
                <article
                  aria-label={`Listing content ${product.name}`}
                  className="premium-card"
                  key={product.id}
                  style={{ overflow: 'hidden' }}
                >
                  {(() => {
                    const readiness =
                      listingReadinessById.get(product.id) ??
                      listingReadiness(product);
                    const formId = listingFormId(product);

                    return (
                      <>
                        <div style={{ padding: '24px', background: 'var(--surface-strong)', borderBottom: '1px solid var(--border)' }}>
                          <h3 className="premium-title-card" style={{ fontSize: '20px', color: '#fff', margin: 0, marginBottom: '16px' }}>{product.name}</h3>
                          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', margin: 0, fontSize: '13px', marginBottom: '24px' }}>
                            <div>
                              <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Category/type</dt>
                              <dd style={{ margin: 0, color: 'var(--text)' }}>{categoryLabel(product, categories)}</dd>
                            </div>
                            <div>
                              <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Public slug</dt>
                              <dd style={{ margin: 0, color: 'var(--text)' }}>{product.slug}</dd>
                            </div>
                            <div>
                              <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Visibility</dt>
                              <dd style={{ margin: 0, color: product.status === 'published' ? '#22c55e' : (product.status === 'draft' ? '#64748b' : '#f59e0b'), fontWeight: 500 }}>
                                {visibilityLabel(product.status)}
                              </dd>
                            </div>
                            <div>
                              <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Public-ready status</dt>
                              <dd style={{ margin: 0, color: readiness.ready ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{readiness.statusLabel}</dd>
                            </div>
                            <div>
                              <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Rental unit</dt>
                              <dd style={{ margin: 0, color: 'var(--text)' }}>{product.rentalUnit || "Missing rental unit"}</dd>
                            </div>
                            <div>
                              <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Image/fallback</dt>
                              <dd style={{ margin: 0, color: 'var(--text)' }}>{imagePresenceLabel(product)}</dd>
                            </div>
                          </dl>
                          <nav
                            aria-label={`Listing actions ${product.name}`}
                            style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
                          >
                            <a
                              aria-label={`View public listing ${product.name}`}
                              className="premium-button premium-button--secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', height: 'auto' }}
                              href={`/listings/${encodeURIComponent(product.slug)}`}
                            >
                              View public listing
                            </a>
                            <a
                              aria-label={`Edit listing ${product.name}`}
                              className="premium-button premium-button--secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', height: 'auto' }}
                              href={`#${formId}`}
                            >
                              Edit listing details
                            </a>
                            <a
                              aria-label={`Manage images ${product.name}`}
                              className="premium-button premium-button--secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', height: 'auto' }}
                              href="/admin/catalogue#update-listing-image-metadata"
                            >
                              Manage images
                            </a>
                            <a
                              aria-label="Return to catalogue admin"
                              className="premium-button premium-button--secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', height: 'auto' }}
                              href="/admin/catalogue"
                            >
                              Return to top
                            </a>
                          </nav>
                        </div>
                        <section
                          aria-label={`Public-ready listing helper ${product.name}`}
                          style={{ padding: '24px', background: 'var(--background)', borderBottom: '1px solid var(--border)' }}
                        >
                          <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px', margin: 0 }}>Public-ready listing helper</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              background: readiness.ready ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: readiness.ready ? '#22c55e' : '#f59e0b',
                              border: `1px solid ${readiness.ready ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                            }}>
                              {readiness.label}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{readiness.nextAction}</span>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)', fontSize: '13px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                            {readiness.checks.map((check) => (
                              <li key={check} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {check}
                              </li>
                            ))}
                          </ul>
                        </section>
                      </>
                );
              })()}
                  <div style={{ padding: '24px' }}>
                    <form
                      id={listingFormId(product)}
                      aria-label={`Update listing ${product.name}`}
                      onSubmit={(event) => void handleUpdate(event, product)}
                      style={{ display: 'grid', gap: '20px' }}
                    >
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Listing category
                        <select
                          defaultValue={product.categoryId ?? ""}
                          id={`listing-category-${product.id}`}
                          name="categoryId"
                          className="premium-input"
                          style={{ width: '100%', height: '48px', appearance: 'auto' }}
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
                        <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                          Public category grouping supports browsing and quote/enquiry
                          recovery.
                        </small>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Listing slug
                        <input
                          defaultValue={product.slug}
                          id={`listing-slug-${product.id}`}
                          name="slug"
                          pattern="[a-z0-9][a-z0-9-]{1,98}[a-z0-9]"
                          required
                          type="text"
                          className="premium-input"
                        />
                        <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                          Slug may be used by public listing routes; keep it stable
                          and factual.
                        </small>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Listing name
                        <input
                          aria-label={`Listing name for ${product.name}`}
                          defaultValue={product.name}
                          id={`listing-name-${product.id}`}
                          maxLength={160}
                          name="name"
                          required
                          className="premium-input"
                        />
                        <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                          Public name should describe the rental/event furniture
                          without unsupported assertions.
                        </small>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Listing short description
                        <textarea
                          defaultValue={product.shortDescription ?? ""}
                          id={`listing-short-description-${product.id}`}
                          maxLength={240}
                          name="shortDescription"
                          rows={2}
                          className="premium-input"
                          style={{ height: 'auto', resize: 'vertical' }}
                        />
                        <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                          Short description appears in browsing contexts and should
                          support quote/request planning.
                        </small>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Listing description
                        <textarea
                          defaultValue={product.description ?? ""}
                          id={`listing-description-${product.id}`}
                          maxLength={2000}
                          name="description"
                          rows={4}
                          className="premium-input"
                          style={{ height: 'auto', resize: 'vertical' }}
                        />
                        <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                          Full description remains a public field; avoid self-service
                          or completion-flow wording.
                        </small>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Rental unit label
                        <input
                          defaultValue={product.rentalUnit}
                          id={`listing-rental-unit-${product.id}`}
                          maxLength={80}
                          name="rentalUnit"
                          required
                          className="premium-input"
                        />
                        <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                          Rental unit helps quote/enquiry wording and does not confirm
                          availability.
                        </small>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Listing status
                        <select
                          defaultValue={product.status}
                          id={`listing-status-${product.id}`}
                          name="status"
                          className="premium-input"
                          style={{ width: '100%', height: '48px', appearance: 'auto' }}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                        <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                          Draft is protected, published is a public visibility state
                          only after public-safe copy review, and archived is hidden
                          from active browsing. Draft keeps the listing protected
                          until public-ready checks pass and archive does not delete it.
                        </small>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Listing sort order
                        <input
                          defaultValue={product.sortOrder}
                          id={`listing-sort-order-${product.id}`}
                          max={1000000}
                          min={0}
                          name="sortOrder"
                          type="number"
                          className="premium-input"
                        />
                        <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                          Sort order controls display ordering where listing groups
                          use it.
                        </small>
                      </label>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, margin: 0, padding: '12px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                        Protected write boundary: save listing metadata only after
                        checking public-facing fields, category, rental unit,
                        validation errors, and media checks. Archive hides this
                        listing from public browsing and active admin work; it does
                        not delete it.
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px' }}>
                        <button className="premium-button premium-button--primary" type="submit" style={{ flex: '1 1 auto' }}>
                          Save listing metadata
                        </button>
                        <section
                          aria-label={`Visibility and archive actions for ${product.name}`}
                          style={{
                            border: '1px solid rgba(155, 104, 78, 0.32)',
                            borderRadius: 'var(--radius-md)',
                            display: 'grid',
                            flex: '1 1 100%',
                            gap: '12px',
                            padding: '14px',
                            background: 'rgba(155, 104, 78, 0.08)'
                          }}
                        >
                          <p style={{ color: 'var(--text)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                            Visibility and archive actions change public browsing.
                            Use them after the routine metadata save has been reviewed.
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <button
                              aria-label={
                                product.status === "published"
                                  ? `Set ${product.name} to draft visibility`
                                  : `Set ${product.name} to public visibility`
                              }
                              className="premium-button premium-button--secondary"
                              onClick={() =>
                                void handleStatusChange(
                                  product,
                                  product.status === "published" ? "draft" : "published",
                                )
                              }
                              type="button"
                              style={{ flex: '1 1 auto' }}
                            >
                              {product.status === "published"
                                ? `Set to draft`
                                : `Set to published`}
                            </button>
                            <button
                              aria-label={`Archive listing ${product.name}`}
                              className="premium-button premium-button--secondary"
                              onClick={() => void handleArchive(product)}
                              type="button"
                              style={{ flex: '1 1 auto' }}
                            >
                              Archive listing
                            </button>
                          </div>
                        </section>
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
