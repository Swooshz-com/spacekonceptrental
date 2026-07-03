"use client";

import { useState, type FormEvent } from "react";

export type ListingImageMetadataProduct = {
  id: string;
  slug: string;
  name: string;
  rentalUnit: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  imageCount: number;
  categoryId?: string;
  shortDescription?: string;
  description?: string;
  primaryImageAltText?: string;
};

export type ListingImageMetadataImage = {
  id: string;
  productId: string;
  storageBucket: string;
  storagePath: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  status: "active" | "archived";
};

type ListingImageMetadataManagementPanelProps = {
  products: ListingImageMetadataProduct[];
  images: ListingImageMetadataImage[];
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

type ImagePayload = {
  productId?: string;
  storageBucket?: string;
  storagePath?: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

const productImageWriteOperation = "productImage.write";
const genericFailureMessage =
  "Protected admin save could not be completed. Check selected listing, image context, public-safe alt text, primary label, active or archived status, and sort order before retrying.";

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

async function requestProductImageWriteProof(fetcher: typeof fetch) {
  const response = await fetcher("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestedOperation: productImageWriteOperation,
      operation: productImageWriteOperation,
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

function imageLabel(image: ListingImageMetadataImage) {
  return image.altText || image.storagePath;
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function imageReadiness(
  image: ListingImageMetadataImage,
  product: ListingImageMetadataProduct | undefined,
) {
  return [
    product ? `Matched to listing ${product.name}` : "Unmatched listing",
    image.status === "active"
      ? "Active image is available to listing media"
      : "Archived image is hidden from active listing media",
    image.altText
      ? "Alt text ready for public accessibility"
      : "Missing alt text for public accessibility",
    image.isPrimary && image.status === "active"
      ? "Primary active image can lead the public listing gallery"
      : image.isPrimary
        ? "Primary selection is inactive while archived"
        : "Secondary image supports the listing gallery",
  ];
}

function listingVisibilityLabel(status: ListingImageMetadataProduct["status"]) {
  if (status === "published") {
    return "Published - visible in public catalogue";
  }

  if (status === "archived") {
    return "Archived - hidden from active browsing";
  }

  return "Draft - protected";
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function mediaCoverageChecks(
  product: ListingImageMetadataProduct,
  images: ListingImageMetadataImage[],
) {
  const productImages = images.filter(
    (image) => image.productId === product.id,
  );
  const activeImages = productImages.filter(
    (image) => image.status === "active",
  );
  const activePrimaryImages = activeImages.filter((image) => image.isPrimary);
  const activeImagesMissingAlt = activeImages.filter(
    (image) => !hasText(image.altText),
  );
  const checks = [
    productImages.length > 0
      ? `${pluralize(productImages.length, "image")} linked to this listing`
      : "No public image",
    activeImages.length > 0
      ? `${pluralize(activeImages.length, "active image")}`
      : productImages.length > 0
        ? "Only fallback image or archived media needs review"
        : "No active public image",
    activePrimaryImages.length > 0
      ? "Primary public image selected"
      : "Missing primary public image",
    activeImagesMissingAlt.length > 0
      ? "Missing alt text"
      : activeImages.length > 0
        ? "Public image text is present"
        : "Add public image text when media is selected",
  ];

  if (product.status !== "published" && activeImages.length > 0) {
    checks.push("Image exists while listing is draft");
  }

  if (product.status === "published" && activeImages.length === 0) {
    checks.push("Published listing has no active public image");
  }

  return checks;
}

function mediaReadinessByListing(
  product: ListingImageMetadataProduct,
  images: ListingImageMetadataImage[],
) {
  const productImages = images.filter(
    (image) => image.productId === product.id,
  );
  const activeImages = productImages.filter(
    (image) => image.status === "active",
  );
  const activePrimaryImages = activeImages.filter((image) => image.isPrimary);
  const activeImagesMissingAlt = activeImages.filter(
    (image) => !hasText(image.altText),
  );
  const messages: string[] = [];

  if (product.status === "published" && activeImages.length === 0) {
    messages.push(`${product.name} has no active public image metadata.`);
  }

  if (activeImages.length > 0 && activePrimaryImages.length === 0) {
    messages.push(`${product.name} is missing an active primary image.`);
  }

  if (activePrimaryImages.length > 1) {
    messages.push(
      `${product.name} has ${activePrimaryImages.length} active primary images. Keep one active primary image before publication.`,
    );
  }

  if (activeImagesMissingAlt.length > 0) {
    messages.push(
      `${product.name} has ${activeImagesMissingAlt.length} active ${
        activeImagesMissingAlt.length === 1 ? "image" : "images"
      } missing alt text.`,
    );
  }

  return messages.length > 0
    ? messages
    : [`${product.name} media coverage is clear for current review state.`];
}

function buildImagePayload(
  form: HTMLFormElement,
  formData: FormData,
  sortOrder: number | undefined,
  includeProductId: boolean,
) {
  const isPrimaryInput = form.elements.namedItem("isPrimary");
  const payload: ImagePayload = {
    ...(includeProductId
      ? { productId: formValue(formData, "productId") }
      : {}),
    storageBucket: formValue(formData, "storageBucket"),
    storagePath: formValue(formData, "storagePath"),
    altText: formValue(formData, "altText"),
    isPrimary:
      isPrimaryInput instanceof HTMLInputElement
        ? isPrimaryInput.checked
        : false,
  };

  if (sortOrder !== undefined) {
    payload.sortOrder = sortOrder;
  }

  return payload;
}

export function ListingImageMetadataManagementPanel({
  products,
  images,
  fetcher = fetch,
  onMutationComplete = reloadDashboard,
}: ListingImageMetadataManagementPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle",
  });
  const archivedImageCount = images.filter(
    (image) => image.status === "archived",
  ).length;

  async function submitImageMutation(
    endpoint: string,
    payload: ImagePayload,
    successMessage: string,
  ) {
    setStatus({
      kind: "pending",
      message: "Protected admin save is checking image metadata...",
    });

    try {
      const csrfProof = await requestProductImageWriteProof(fetcher);

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

    await submitImageMutation(
      "/api/admin/product-images",
      buildImagePayload(form, formData, sortOrder.sortOrder, true),
      "Image metadata saved for protected admin review. Refreshing dashboard.",
    );
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    image: ListingImageMetadataImage,
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

    await submitImageMutation(
      `/api/admin/product-images/${encodeURIComponent(image.id)}`,
      buildImagePayload(form, formData, sortOrder.sortOrder, false),
      "Image metadata saved for protected admin review. Refreshing dashboard.",
    );
  }

  async function handleArchive(image: ListingImageMetadataImage) {
    await submitImageMutation(
      `/api/admin/product-images/${encodeURIComponent(image.id)}/archive`,
      {},
      "Image archive state saved for protected admin review. Refreshing dashboard.",
    );
  }

  return (
    <section
      className="premium-section"
      aria-label="Listing image metadata management"
    >
      <div className="premium-container" style={{ maxWidth: '1000px' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Protected admin save</p>
          <h2 className="premium-title-section" style={{ fontSize: '28px', marginBottom: '16px' }}>Listing image metadata management</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Create, update, and archive listing image metadata through the
            protected admin API. Alt text and primary state can affect public
            browsing, but media metadata is review context only and is not an
            availability assertion. If a save fails, keep the prior protected
            media state, review selected listing context, public-safe alt text,
            primary label, and active or archived status, then retry locally.
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
          <section className="premium-card" style={{ padding: '24px' }} aria-label="Media public-safe copy review">
            <h3 className="premium-title-card" style={{ fontSize: '18px', marginBottom: '12px' }}>Public-safe copy review</h3>
            <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '16px' }}>
              Save image metadata only after checking selected listing context,
              image path context, public-safe alt text, primary image label,
              active/archived state, fallback expectation, validation errors, and
              sort order.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', background: 'var(--background)', padding: '12px', borderRadius: 'var(--radius-md)', margin: 0 }}>
              Protected admin save only updates image metadata. Media metadata is
              review context only and does not confirm visual outcome, availability,
              or inventory.
            </p>
          </section>

          <section className="premium-card" style={{ padding: '24px' }} aria-label="Media coverage">
            <h3 className="premium-title-card" style={{ fontSize: '18px', marginBottom: '12px' }}>Media coverage</h3>
            <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '16px' }}>
              Public-ready media needs an active image, useful public-safe alt text,
              and a clear primary image when the listing should lead with that
              setup. These protected admin cues do not prove availability.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', background: 'var(--background)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              Strong listing images help visitors compare rental options before
              requesting a quote. Image text should describe the furniture or event
              rental item shown, not internal file names or source details.
            </p>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Media coverage by listing</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {products.flatMap((product) =>
                mediaReadinessByListing(product, images).map((message) => (
                  <li key={`${product.id}-${message}`}>{message}</li>
                )),
              )}
            </ul>
            {archivedImageCount > 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                Archived image metadata stays hidden from public catalogue and
                listing galleries.
              </p>
            ) : null}
          </section>
        </div>

        <section
          className="premium-card"
          style={{ padding: '24px', marginBottom: '48px' }}
          aria-label="Listing media coverage checklist"
        >
          <h3 className="premium-title-card" style={{ fontSize: '18px', marginBottom: '12px' }}>Listing media coverage checklist</h3>
          <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '24px' }}>
            Scan each rental listing before editing image metadata. Use these cues
            to spot listings with no public image, only fallback or archived media,
            missing alt text, or images attached while the listing is still draft.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {products.map((product) => (
              <article
                aria-label={`Media coverage ${product.name}`}
                key={product.id}
                style={{ padding: '20px', background: 'var(--surface-strong)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', color: '#fff', margin: 0, marginBottom: '12px' }}>{product.name}</h4>
                  <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', margin: 0, fontSize: '13px' }}>
                    <div>
                      <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Listing slug</dt>
                      <dd style={{ margin: 0, color: 'var(--text)' }}>{product.slug}</dd>
                    </div>
                    <div>
                      <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Visibility</dt>
                      <dd style={{ margin: 0, color: 'var(--text)' }}>{listingVisibilityLabel(product.status)}</dd>
                    </div>
                    <div>
                      <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Image records</dt>
                      <dd style={{ margin: 0, color: 'var(--text)' }}>{pluralize(product.imageCount, "image")}</dd>
                    </div>
                    <div>
                      <dt style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Primary image text</dt>
                      <dd style={{ margin: 0, color: 'var(--text)' }}>
                        {hasText(product.primaryImageAltText)
                          ? "Primary public image text is present"
                          : "Missing primary public image text"}
                      </dd>
                    </div>
                  </dl>
                  <nav
                    aria-label={`Media actions ${product.name}`}
                    style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}
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
                      href={`/admin/catalogue#listing-form-${product.id}`}
                    >
                      Edit listing
                    </a>
                    <a
                      aria-label={`Manage images ${product.name}`}
                      className="premium-button premium-button--secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', height: 'auto' }}
                      href="#update-listing-image-metadata"
                    >
                      Manage images
                    </a>
                  </nav>
                </div>
                <section
                  aria-label={`Public image helper ${product.name}`}
                  style={{ padding: '16px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}
                >
                  <h5 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, marginBottom: '8px' }}>Public image helper</h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mediaCoverageChecks(product, images).map((check) => (
                      <li key={check}>{check}</li>
                    ))}
                  </ul>
                </section>
              </article>
            ))}
          </div>
        </section>

        <form
          aria-label="Create listing image metadata"
          className="premium-form-card"
          style={{ marginBottom: '64px' }}
          onSubmit={handleCreate}
        >
          <h3 className="premium-title-section" style={{ fontSize: '20px', marginBottom: '24px' }}>Create listing image metadata</h3>

          <div style={{ display: 'grid', gap: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New image listing
              <select id="new-image-product" name="productId" required className="premium-input" style={{ width: '100%', height: '48px', appearance: 'auto' }}>
                <option value="">Choose listing</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Associate media with the correct rental listing before public-safe copy review.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New image bucket
              <input
                id="new-image-bucket"
                maxLength={120}
                name="storageBucket"
                required
                className="premium-input"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New image path
              <input
                id="new-image-path"
                maxLength={512}
                name="storagePath"
                required
                className="premium-input"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New image alt text
              <input id="new-image-alt-text" maxLength={240} name="altText" className="premium-input" />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Describe the visible rental furniture setup for public catalogue accessibility; do not claim availability assertions.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              New image sort order
              <input
                id="new-image-sort-order"
                max={1000000}
                min={0}
                name="sortOrder"
                type="number"
                className="premium-input"
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, padding: '16px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <input id="new-image-primary" name="isPrimary" type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
              Mark new image as primary public browsing image
            </label>

            <button className="premium-button premium-button--primary" type="submit" style={{ marginTop: '12px' }}>
              Create listing image metadata
            </button>
          </div>
        </form>

        <div
          id="update-listing-image-metadata"
          aria-label="Update listing image metadata"
        >
          <h3 className="premium-title-section" style={{ fontSize: '24px', marginBottom: '24px' }}>Existing Listing Images</h3>
          {images.length === 0 ? (
            <div className="premium-card" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                No listing image metadata records are available to update yet. Add
                reviewed listing media metadata before choosing public primary
                images or completing media coverage review.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {images.map((image) => {
                const label = imageLabel(image);
                const product = products.find(
                  (item) => item.id === image.productId,
                );

                return (
                  <article className="premium-card" key={image.id} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '24px', background: 'var(--surface-strong)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <h3 className="premium-title-card" style={{ fontSize: '20px', color: '#fff', margin: 0, marginBottom: '4px' }}>{label}</h3>
                        <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0 }}>
                          {product?.name ?? "Unmatched listing"} • <span style={{ color: image.status === 'active' ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>{image.status}</span> •{" "}
                          <span style={{ fontWeight: image.isPrimary ? 700 : 400 }}>{image.isPrimary ? "Primary" : "Secondary"}</span>
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: '24px' }}>
                      <section
                        aria-label={`Media coverage ${label}`}
                        style={{ marginBottom: '24px', padding: '16px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}
                      >
                        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {imageReadiness(image, product).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </section>

                      <form
                        aria-label={`Update image metadata ${label}`}
                        onSubmit={(event) => void handleUpdate(event, image)}
                        style={{ display: 'grid', gap: '20px' }}
                      >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                          Image bucket
                          <input
                            defaultValue={image.storageBucket}
                            id={`image-bucket-${image.id}`}
                            maxLength={120}
                            name="storageBucket"
                            required
                            className="premium-input"
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                          Image path for {label}
                          <input
                            defaultValue={image.storagePath}
                            id={`image-path-${image.id}`}
                            maxLength={512}
                            name="storagePath"
                            required
                            className="premium-input"
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                          Image alt text for {label}
                          <input
                            defaultValue={image.altText ?? ""}
                            id={`image-alt-text-${image.id}`}
                            maxLength={240}
                            name="altText"
                            className="premium-input"
                          />
                          <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                            Alt text supports public browsing accessibility only and
                            must not be used as an availability assertion.
                          </small>
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                          Image sort order
                          <input
                            defaultValue={image.sortOrder}
                            id={`image-sort-order-${image.id}`}
                            max={1000000}
                            min={0}
                            name="sortOrder"
                            type="number"
                            className="premium-input"
                          />
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, padding: '16px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                          <input
                            defaultChecked={image.isPrimary}
                            id={`image-primary-${image.id}`}
                            name="isPrimary"
                            type="checkbox"
                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                          />
                          Mark {label} as primary public browsing image
                        </label>

                        <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                          Protected write boundary: primary and active media choices
                          can affect public browsing. Archive removes this image from
                          active listing media; it does not delete the file from
                          storage. If save fails, keep the prior media state, review
                          alt text and primary selection, and retry locally.
                        </p>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                          <button className="premium-button premium-button--primary" type="submit" style={{ flex: 1 }}>
                            Save image metadata
                          </button>
                          <button
                            aria-label={`Archive image metadata ${label}`}
                            className="premium-button premium-button--secondary"
                            onClick={() => void handleArchive(image)}
                            type="button"
                            style={{ flex: 1 }}
                          >
                            Archive image metadata
                          </button>
                        </div>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
