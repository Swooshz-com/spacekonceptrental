"use client";

import { useEffect, useState, type FormEvent, type SyntheticEvent } from "react";

import {
  DEFAULT_HOMEPAGE_HERO_CONTENT,
  validateHomepageHeroImageInput,
  type HomepageHeroContent
} from "../../lib/hero/homepage-hero-content";
import styles from "./hero-content-management-panel.module.css";

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
  "Protected admin hero image save could not be completed. Check the image file and alt text before retrying.";

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
  const [imageDimensions, setImageDimensions] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const currentImageUrl = heroImageUrl(hero);
  const currentImageAlt = heroImageAlt(hero);

  useEffect(() => {
    const image = new Image();

    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setImageDimensions({
          height: image.naturalHeight,
          width: image.naturalWidth
        });
      }
    };
    image.src = currentImageUrl;
  }, [currentImageUrl]);

  function handlePreviewLoad(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;

    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setImageDimensions({
        height: image.naturalHeight,
        width: image.naturalWidth
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedFile = formData.get("imageFile");
    const imageFile = isSelectedFile(selectedFile) ? selectedFile : null;
    const imageAlt = formValue(formData, "imageAlt");
    const validation = validateHomepageHeroImageInput(
      {
        imageAlt,
        isEnabled: true
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
      uploadBody.set("isEnabled", "true");

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
        message: "Hero image saved and active. Refreshing dashboard."
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
    <section
      className={styles.heroPanel}
      aria-label="Homepage hero image management"
    >
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>Protected admin save</p>
        <h2>Homepage hero image</h2>
        <p>
          Update the main visual for the homepage. Homepage copy and
          call-to-action text are code-managed and cannot be edited via this
          admin.
        </p>
      </div>

      {status.kind !== "idle" ? (
        <div
          className={styles.statusMessage}
          style={statusStyles(status.kind)}
          aria-live="polite"
        >
          {status.message}
        </div>
      ) : null}

      <form
        aria-label="Homepage hero image"
        className={styles.heroForm}
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={styles.heroFormGrid}>
          <section aria-label="Current hero image" className={styles.cardColumn}>
            <p className={styles.columnLabel}>Current hero image</p>
            <div className={styles.previewFrame}>
              <img
                alt={currentImageAlt}
                onLoad={handlePreviewLoad}
                src={currentImageUrl}
              />
              <span className={styles.previewBadge}>
                Current
              </span>
            </div>
            <dl className={styles.previewMeta}>
              <div>
                <dt>Resolution</dt>
                <dd>
                  {imageDimensions
                    ? `${imageDimensions.width}x${imageDimensions.height}px`
                    : "Loading"}
                </dd>
              </div>
              <div>
                <dt>Alt Text</dt>
                <dd title={currentImageAlt}>{currentImageAlt}</dd>
              </div>
            </dl>
          </section>

          <section aria-label="Upload new hero image" className={styles.cardColumn}>
            <p className={styles.columnLabel}>Upload new image</p>
            <label className={styles.dropzone} htmlFor="hero-image-file">
              <span className={styles.uploadIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M12 16V7" />
                  <path d="m8.5 10.5 3.5-3.5 3.5 3.5" />
                  <path d="M6.5 18.5h10.25a4 4 0 0 0 .45-7.98 5.75 5.75 0 0 0-11.04-1.55A4.75 4.75 0 0 0 6.5 18.5Z" />
                </svg>
              </span>
              <span className={styles.dropzoneTitle}>
                Drag and drop new image here
              </span>
              <span className={styles.dropzoneSubtitle}>
                or click to browse from files
              </span>
              <span className={styles.fileButton}>Select File</span>
              <input
                aria-label="Select a hero image"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className={styles.fileInput}
                id="hero-image-file"
                name="imageFile"
                type="file"
              />
            </label>
            <p className={styles.uploadHelp}>
              Supported formats: JPG, PNG, WEBP, AVIF. Max size: 5MB.
              Recommended ratio: 16:9.
            </p>
          </section>
        </div>

        <div className={styles.altTextArea}>
          <label className={styles.fieldLabel}>
            Image alt text
            <input
              className={styles.altInput}
              defaultValue={currentImageAlt}
              maxLength={240}
              name="imageAlt"
              required
            />
            <small>
              Crucial for accessibility and SEO. Describe the image content
              clearly.
            </small>
          </label>
        </div>

        <div className={styles.formFooter}>
          <button className={styles.saveButton} type="submit">
            Save hero image
          </button>
        </div>
      </form>
    </section>
  );
}
