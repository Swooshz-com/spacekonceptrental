"use client";

import { useState, type FormEvent } from "react";

import {
  DEFAULT_HOMEPAGE_HERO_CONTENT,
  validateHomepageHeroImageInput,
  type HomepageHeroContent
} from "../../lib/hero/homepage-hero-content";

type HeroContentManagementPanelProps = {
  hero: HomepageHeroContent | null;
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

const heroWriteOperation = "hero.write";
const maxImageFileSizeBytes = 5 * 1024 * 1024;
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
]);
const genericFailureMessage =
  "Protected admin hero image save could not be completed. Check the image file, alt text, and publish state before retrying.";

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function readSafeJson(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function requestHeroWriteProof(fetcher: typeof fetch) {
  const response = await fetcher("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requestedOperation: heroWriteOperation,
      operation: heroWriteOperation
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

function heroImageUrl(hero: HomepageHeroContent | null) {
  return hero?.imageUrl || DEFAULT_HOMEPAGE_HERO_CONTENT.imageUrl;
}

function heroImageAlt(hero: HomepageHeroContent | null) {
  return hero?.imageAlt || DEFAULT_HOMEPAGE_HERO_CONTENT.imageAlt;
}

function isSelectedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && Boolean(value.name.trim());
}

function validateSelectedFile(file: File | null) {
  if (!file) {
    return true;
  }

  return (
    file.size <= maxImageFileSizeBytes &&
    allowedImageTypes.has(file.type.toLowerCase())
  );
}

function statusStyles(kind: Exclude<PanelStatus["kind"], "idle">) {
  if (kind === "success") {
    return {
      background: "rgba(34, 197, 94, 0.1)",
      color: "#166534",
      border: "1px solid rgba(34, 197, 94, 0.22)"
    };
  }

  if (kind === "error") {
    return {
      background: "rgba(185, 28, 28, 0.08)",
      color: "#991b1b",
      border: "1px solid rgba(185, 28, 28, 0.22)"
    };
  }

  return {
    background: "rgba(120, 113, 108, 0.1)",
    color: "#57534e",
    border: "1px solid rgba(120, 113, 108, 0.24)"
  };
}

export function HeroContentManagementPanel({
  hero,
  fetcher = fetch,
  onMutationComplete = reloadDashboard
}: HeroContentManagementPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({ kind: "idle" });
  const currentImageUrl = heroImageUrl(hero);
  const currentImageAlt = heroImageAlt(hero);
  const currentPublished = hero?.isEnabled ?? true;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const enabledInput = form.elements.namedItem("isEnabled");
    const selectedFile = formData.get("imageFile");
    const imageFile = isSelectedFile(selectedFile) ? selectedFile : null;
    const imageAlt = formValue(formData, "imageAlt");
    const isEnabled =
      enabledInput instanceof HTMLInputElement ? enabledInput.checked : false;
    const validation = validateHomepageHeroImageInput(
      {
        imageAlt,
        isEnabled
      },
      {
        imageUrlRequired: false
      }
    );

    if (!validation.ok || !validateSelectedFile(imageFile)) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    setStatus({
      kind: "pending",
      message: "Protected admin save is checking hero image access..."
    });

    try {
      const csrfProof = await requestHeroWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericFailureMessage
        });
        return;
      }

      const uploadBody = new FormData();
      uploadBody.set("imageAlt", validation.image.imageAlt);
      uploadBody.set("isEnabled", validation.image.isEnabled ? "true" : "false");

      if (imageFile) {
        uploadBody.set("imageFile", imageFile);
      }

      const response = await fetcher("/api/admin/hero", {
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
        message: "Hero image saved for protected admin review. Refreshing dashboard."
      });

      try {
        await onMutationComplete();
      } catch {
        // Keep UI status generic if the refresh hook is unavailable.
      }
    } catch {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
    }
  }

  return (
    <section className="premium-section" aria-label="Homepage hero image management">
      <div className="premium-container" style={{ maxWidth: "1100px" }}>
        <div
          style={{
            borderBottom: "1px solid rgba(68, 64, 60, 0.18)",
            marginBottom: "34px",
            paddingBottom: "24px"
          }}
        >
          <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            Protected admin save
          </p>
          <h2 className="premium-title-section" style={{ fontSize: "32px", marginBottom: "12px" }}>
            Homepage hero image
          </h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            Update the main visual for the homepage. Homepage copy and calls to
            action are code-managed and cannot be edited in this admin.
          </p>
        </div>

        {status.kind !== "idle" ? (
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              marginBottom: "28px",
              fontSize: "14px",
              fontWeight: 600,
              ...statusStyles(status.kind)
            }}
            aria-live="polite"
          >
            {status.message}
          </div>
        ) : null}

        <form
          aria-label="Homepage hero image"
          className="premium-form-card"
          noValidate
          onSubmit={handleSubmit}
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div
            style={{
              display: "grid",
              gap: "32px",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              padding: "32px"
            }}
          >
            <section aria-label="Current hero image" style={{ display: "grid", gap: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                Current hero image
              </p>
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16 / 9",
                  overflow: "hidden",
                  border: "1px solid rgba(68, 64, 60, 0.18)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--background)"
                }}
              >
                <img
                  alt={currentImageAlt}
                  src={currentImageUrl}
                  style={{
                    display: "block",
                    height: "100%",
                    objectFit: "cover",
                    width: "100%"
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "12px",
                    bottom: "12px",
                    background: currentPublished ? "#111111" : "#78716c",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.6px",
                    padding: "6px 9px",
                    textTransform: "uppercase"
                  }}
                >
                  {currentPublished ? "Published" : "Unpublished"}
                </span>
              </div>
              <dl style={{ display: "grid", gap: "10px", color: "var(--muted)", fontSize: "14px", margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                  <dt>Alt text</dt>
                  <dd style={{ color: "var(--foreground)", margin: 0, textAlign: "right" }}>
                    {currentImageAlt}
                  </dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                  <dt>Copy</dt>
                  <dd style={{ color: "var(--foreground)", margin: 0, textAlign: "right" }}>
                    Code-managed
                  </dd>
                </div>
              </dl>
            </section>

            <section aria-label="Upload new hero image" style={{ display: "grid", gap: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                Upload new image
              </p>
              <label
                htmlFor="hero-image-file"
                style={{
                  alignItems: "center",
                  border: "2px dashed rgba(68, 64, 60, 0.28)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  justifyContent: "center",
                  minHeight: "280px",
                  padding: "28px",
                  textAlign: "center"
                }}
              >
                <span aria-hidden="true" style={{ color: "var(--accent)", fontSize: "34px", lineHeight: 1 }}>
                  +
                </span>
                <span style={{ color: "var(--foreground)", fontSize: "18px", fontWeight: 700 }}>
                  Select a hero image
                </span>
                <span style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.5 }}>
                  JPG, PNG, WEBP, or AVIF. Maximum file size 5MB. Use a wide
                  image for the homepage hero.
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="premium-input"
                  id="hero-image-file"
                  name="imageFile"
                  type="file"
                  style={{ marginTop: "8px", maxWidth: "320px", padding: "10px" }}
                />
              </label>
            </section>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(68, 64, 60, 0.16)",
              display: "grid",
              gap: "24px",
              padding: "28px 32px"
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Image alt text
              <input
                className="premium-input"
                defaultValue={currentImageAlt}
                maxLength={240}
                name="imageAlt"
                required
                style={{ textTransform: "none", letterSpacing: 0 }}
              />
              <small style={{ fontWeight: 400, color: "var(--muted)", fontSize: "13px", letterSpacing: 0, lineHeight: 1.5, textTransform: "none" }}>
                Describe the image clearly for public accessibility. Do not add
                availability or policy claims.
              </small>
            </label>
          </div>

          <div
            style={{
              alignItems: "center",
              background: "rgba(120, 113, 108, 0.08)",
              borderTop: "1px solid rgba(68, 64, 60, 0.16)",
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              justifyContent: "space-between",
              padding: "28px 32px"
            }}
          >
            <label style={{ alignItems: "center", display: "flex", gap: "14px", fontSize: "16px", fontWeight: 600 }}>
              <input
                defaultChecked={currentPublished}
                name="isEnabled"
                type="checkbox"
                style={{ width: "22px", height: "22px", accentColor: "#111111" }}
              />
              Publish hero image
            </label>

            <button className="premium-button premium-button--primary" type="submit" style={{ minWidth: "200px" }}>
              Save hero image
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
