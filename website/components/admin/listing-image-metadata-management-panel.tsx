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
  "Image metadata change could not be saved. Try again or refresh the page.";

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

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1_000_000) {
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

async function requestProductImageWriteProof(fetcher: typeof fetch) {
  const response = await fetcher("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requestedOperation: productImageWriteOperation,
      operation: productImageWriteOperation
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

function imageLabel(image: ListingImageMetadataImage) {
  return image.altText || image.storagePath;
}

function imageReadiness(
  image: ListingImageMetadataImage,
  product: ListingImageMetadataProduct | undefined
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
      ? "Primary active image can lead the public catalogue display"
      : image.isPrimary
        ? "Primary selection is inactive while archived"
        : "Secondary image supports the listing gallery"
  ];
}

function buildImagePayload(
  form: HTMLFormElement,
  formData: FormData,
  sortOrder: number | undefined,
  includeProductId: boolean
) {
  const isPrimaryInput = form.elements.namedItem("isPrimary");
  const payload: ImagePayload = {
    ...(includeProductId ? { productId: formValue(formData, "productId") } : {}),
    storageBucket: formValue(formData, "storageBucket"),
    storagePath: formValue(formData, "storagePath"),
    altText: formValue(formData, "altText"),
    isPrimary:
      isPrimaryInput instanceof HTMLInputElement
        ? isPrimaryInput.checked
        : false
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
  onMutationComplete = reloadDashboard
}: ListingImageMetadataManagementPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle"
  });

  async function submitImageMutation(
    endpoint: string,
    payload: ImagePayload,
    successMessage: string
  ) {
    setStatus({
      kind: "pending",
      message: "Saving image metadata change..."
    });

    try {
      const csrfProof = await requestProductImageWriteProof(fetcher);

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
    const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));

    if (!sortOrder.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    await submitImageMutation(
      "/api/admin/product-images",
      buildImagePayload(form, formData, sortOrder.sortOrder, true),
      "Image metadata created. Refreshing dashboard."
    );
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    image: ListingImageMetadataImage
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));

    if (!sortOrder.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    await submitImageMutation(
      `/api/admin/product-images/${encodeURIComponent(image.id)}`,
      buildImagePayload(form, formData, sortOrder.sortOrder, false),
      "Image metadata updated. Refreshing dashboard."
    );
  }

  async function handleArchive(image: ListingImageMetadataImage) {
    await submitImageMutation(
      `/api/admin/product-images/${encodeURIComponent(image.id)}/archive`,
      {},
      "Image metadata archived. Refreshing dashboard."
    );
  }

  return (
    <section
      className="category-management"
      aria-label="Listing image metadata management"
    >
      <div className="category-management__header">
        <p className="eyebrow">Metadata-only image writes</p>
        <h2>Listing image metadata management</h2>
        <p>
          Create, update, and archive listing image metadata through the
          protected admin API. Image files are handled outside this admin
          area.
        </p>
      </div>

      <div
        className={`category-management__status category-management__status--${status.kind}`}
        aria-live="polite"
      >
        {status.kind === "idle"
          ? "Image metadata write controls are ready."
          : status.message}
      </div>

      <section className="admin-readiness" aria-label="Media readiness">
        <h3>Media readiness</h3>
        <p>
          Public-ready media needs an active image, useful alt text, and a clear
          primary image when the listing should lead with that setup.
        </p>
      </section>

      <form
        aria-label="Create listing image metadata"
        className="category-management__form"
        onSubmit={handleCreate}
      >
        <h3>Create listing image metadata</h3>
        <label htmlFor="new-image-product">
          New image listing
          <select id="new-image-product" name="productId" required>
            <option value="">Choose listing</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="new-image-bucket">
          New image bucket
          <input id="new-image-bucket" maxLength={120} name="storageBucket" required />
        </label>
        <label htmlFor="new-image-path">
          New image path
          <input id="new-image-path" maxLength={512} name="storagePath" required />
        </label>
        <label htmlFor="new-image-alt-text">
          New image alt text
          <input id="new-image-alt-text" maxLength={240} name="altText" />
          <small>
            Describe the visible rental furniture setup for public catalogue
            accessibility.
          </small>
        </label>
        <label htmlFor="new-image-sort-order">
          New image sort order
          <input
            id="new-image-sort-order"
            max={1000000}
            min={0}
            name="sortOrder"
            type="number"
          />
        </label>
        <label className="category-management__checkbox" htmlFor="new-image-primary">
          <input id="new-image-primary" name="isPrimary" type="checkbox" />
          Mark new image as primary
        </label>
        <button className="button" type="submit">
          Create listing image metadata
        </button>
      </form>

      <div
        className="category-management__list"
        aria-label="Update listing image metadata"
      >
        {images.length === 0 ? (
          <section className="admin-dashboard__card admin-dashboard__card--summary">
            <p>
              No listing image metadata records are available to update yet.
              Add approved listing media before choosing primary images.
            </p>
          </section>
        ) : (
          images.map((image) => {
            const label = imageLabel(image);
            const product = products.find((item) => item.id === image.productId);

            return (
              <article className="category-management__item" key={image.id}>
                <div>
                  <h3>{label}</h3>
                  <p>
                    {product?.name ?? "Unmatched listing"} - {image.status} -
                    {" "}
                    {image.isPrimary ? "primary" : "secondary"}
                  </p>
                </div>
                <section
                  className="admin-readiness admin-readiness--inline"
                  aria-label={`Media readiness ${label}`}
                >
                  <ul className="admin-readiness__list">
                    {imageReadiness(image, product).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <form
                  aria-label={`Update image metadata ${label}`}
                  className="category-management__form"
                  onSubmit={(event) => void handleUpdate(event, image)}
                >
                  <label htmlFor={`image-bucket-${image.id}`}>
                    Image bucket for {label}
                    <input
                      defaultValue={image.storageBucket}
                      id={`image-bucket-${image.id}`}
                      maxLength={120}
                      name="storageBucket"
                      required
                    />
                  </label>
                  <label htmlFor={`image-path-${image.id}`}>
                    Image path for {label}
                    <input
                      defaultValue={image.storagePath}
                      id={`image-path-${image.id}`}
                      maxLength={512}
                      name="storagePath"
                      required
                    />
                  </label>
                  <label htmlFor={`image-alt-text-${image.id}`}>
                    Image alt text for {label}
                    <input
                      defaultValue={image.altText ?? ""}
                      id={`image-alt-text-${image.id}`}
                      maxLength={240}
                      name="altText"
                    />
                  </label>
                  <label htmlFor={`image-sort-order-${image.id}`}>
                    Image sort order for {label}
                    <input
                      defaultValue={image.sortOrder}
                      id={`image-sort-order-${image.id}`}
                      max={1000000}
                      min={0}
                      name="sortOrder"
                      type="number"
                    />
                  </label>
                  <label
                    className="category-management__checkbox"
                    htmlFor={`image-primary-${image.id}`}
                  >
                    <input
                      defaultChecked={image.isPrimary}
                      id={`image-primary-${image.id}`}
                      name="isPrimary"
                      type="checkbox"
                    />
                    Mark {label} as primary
                  </label>
                  <p className="category-management__hint">
                    Archive removes this image from active listing media; it
                    does not delete the file from storage.
                  </p>
                  <div className="category-management__actions">
                    <button className="button" type="submit">
                      Save image metadata {label}
                    </button>
                    <button
                      className="button button--secondary"
                      onClick={() => void handleArchive(image)}
                      type="button"
                    >
                      Archive image metadata {label}
                    </button>
                  </div>
                </form>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
