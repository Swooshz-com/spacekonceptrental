"use client";

import { useState, type FormEvent } from "react";

export type ListingImageUploadProduct = {
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

type ListingImageUploadPanelProps = {
  products: ListingImageUploadProduct[];
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

const productImageWriteOperation = "productImage.write";
const genericFailureMessage =
  "Listing image upload could not be saved. Check the listing, file type, public-safe alt text, and try again.";

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
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
    sortOrder: String(parsed)
  };
}

function appendIfPresent(body: FormData, key: string, value: string) {
  if (value) {
    body.set(key, value);
  }
}

export function ListingImageUploadPanel({
  products,
  fetcher = fetch,
  onMutationComplete = reloadDashboard
}: ListingImageUploadPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle"
  });

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const productId = formValue(formData, "productId");
    const imageFile = formData.get("imageFile");
    const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));
    const isPrimaryInput = form.elements.namedItem("isPrimary");

    if (!productId || !(imageFile instanceof File) || !sortOrder.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    setStatus({
      kind: "pending",
      message: "Uploading protected listing image..."
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

      const uploadBody = new FormData();
      uploadBody.set("productId", productId);
      uploadBody.set("imageFile", imageFile);
      appendIfPresent(uploadBody, "altText", formValue(formData, "altText"));

      if (sortOrder.sortOrder !== undefined) {
        uploadBody.set("sortOrder", sortOrder.sortOrder);
      }

      if (
        isPrimaryInput instanceof HTMLInputElement &&
        isPrimaryInput.checked
      ) {
        uploadBody.set("isPrimary", "true");
      }

      const response = await fetcher("/api/admin/product-images", {
        method: "POST",
        headers: {
          "x-csrf-proof": csrfProof
        },
        body: uploadBody
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
        message: "Listing image uploaded. Refreshing dashboard."
      });

      try {
        await onMutationComplete();
      } catch {
        // Keep rendered state generic if the refresh hook is unavailable.
      }
    } catch {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
    }
  }

  return (
    <section className="category-management" aria-label="Listing image upload">
      <div className="category-management__header">
        <p className="eyebrow">Listing media</p>
        <h2>Upload listing image</h2>
        <p>
          Upload approved image files for furniture and event-rental listings.
          The protected server stores the file and creates listing image metadata; public users cannot upload files here.
        </p>
        <p className="category-management__hint">
          Use approved listing images only. Primary uploaded images can lead
          the public catalogue display after the image metadata is active; this is not an availability assertion.
        </p>
      </div>

      <div
        className={`category-management__status category-management__status--${status.kind}`}
        aria-live="polite"
      >
        {status.kind === "idle" ? "Listing image upload is ready." : status.message}
      </div>

      <form
        aria-label="Upload listing image"
        className="category-management__form"
        onSubmit={handleUpload}
      >
        <label htmlFor="upload-image-product">
          Upload image listing
          <select id="upload-image-product" name="productId" required>
            <option value="">Choose listing</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <small>
            Create a protected draft listing before uploading media for that listing.
          </small>
        </label>
        <label htmlFor="upload-image-file">
          Listing image file
          <input
            accept="image/jpeg,image/png,image/webp,image/avif"
            id="upload-image-file"
            name="imageFile"
            required
            type="file"
          />
        </label>
        <label htmlFor="upload-image-alt-text">
          Upload image alt text
          <input id="upload-image-alt-text" maxLength={240} name="altText" />
          <small>
            Describe the rental furniture setup shown in the image with public-safe wording for public
            catalogue accessibility; do not add availability, proof, or policy claims.
          </small>
        </label>
        <label htmlFor="upload-image-sort-order">
          Upload image sort order
          <input
            id="upload-image-sort-order"
            max={1000000}
            min={0}
            name="sortOrder"
            type="number"
          />
        </label>
        <label
          className="category-management__checkbox"
          htmlFor="upload-image-primary"
        >
          <input id="upload-image-primary" name="isPrimary" type="checkbox" />
          Mark uploaded image as primary public browsing image
        </label>
        <button className="button" type="submit">
          Upload listing image
        </button>
      </form>
    </section>
  );
}
