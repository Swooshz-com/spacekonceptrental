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
  "Protected admin upload could not be completed. Check selected listing, file type, public-safe alt text, primary label, and display position before retrying.";

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
    sortOrder: String(parsed),
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
  onMutationComplete = reloadDashboard,
}: ListingImageUploadPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle",
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
        message: genericFailureMessage,
      });
      return;
    }

    setStatus({
      kind: "pending",
      message: "Protected admin upload is checking listing media...",
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
          "x-csrf-proof": csrfProof,
        },
        body: uploadBody,
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
        message:
          "Listing image saved for protected admin review. Refreshing dashboard.",
      });

      try {
        await onMutationComplete();
      } catch {
        // Keep rendered state generic if the refresh hook is unavailable.
      }
    } catch {
      setStatus({
        kind: "error",
        message: genericFailureMessage,
      });
    }
  }

  return (
    <section className="premium-section" aria-label="Listing image upload">
      <div className="premium-container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Protected admin upload</p>
          <h2 className="premium-title-section" style={{ fontSize: '28px', marginBottom: '16px' }}>Upload listing image for review</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '16px' }}>
            Upload reviewed image files for furniture and event-rental listings.
            The protected server stores the file and creates listing image
            metadata; public users cannot upload files here. Media metadata is
            protected admin review context only.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', background: 'var(--background)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            Use reviewed listing images only. Primary uploaded images can support
            public catalogue display after the image metadata is active; this is
            not an availability or visual outcome assertion. Protected
            admin upload stores media metadata for business owner review. If
            upload fails, keep the listing draft/protected, check file type and
            public-safe alt text, and retry the protected write locally.
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

        <form
          aria-label="Upload listing image"
          className="premium-form-card"
          onSubmit={handleUpload}
        >
          <div style={{ display: 'grid', gap: '24px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              Upload image listing
              <select id="upload-image-product" name="productId" required className="premium-input" style={{ width: '100%', height: '48px', appearance: 'auto' }}>
                <option value="">Choose listing</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Create a protected draft listing before uploading media for that
                listing; selected listing context stays admin-only.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              Listing image file
              <input
                accept="image/jpeg,image/png,image/webp,image/avif"
                id="upload-image-file"
                name="imageFile"
                required
                type="file"
                className="premium-input"
                style={{ padding: '10px' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              Upload image alt text
              <input id="upload-image-alt-text" maxLength={240} name="altText" className="premium-input" />
              <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                Describe the rental furniture setup shown in the image with
                public-safe wording for public catalogue accessibility; do not add
                availability, proof, policy, or owner sign-off claims.
              </small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              Upload image display position
              <input
                id="upload-image-sort-order"
                max={1000000}
                min={0}
                name="sortOrder"
                type="number"
                className="premium-input"
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, padding: '16px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <input id="upload-image-primary" name="isPrimary" type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
              Mark uploaded image as primary public browsing image after alt-text review
            </label>

            <button className="premium-button premium-button--primary" type="submit" style={{ marginTop: '8px' }}>
              Upload listing image for review
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
