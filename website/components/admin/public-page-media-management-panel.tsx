"use client";

import { useState, type FormEvent } from "react";

import {
  ABOUT_STORY_MEDIA_SLOT,
  defaultPublicPageMediaForSlot,
  validatePublicPageMediaInput,
  type AdminPublicPageMediaContent,
  type PublicPageMediaSlot
} from "../../lib/page-media/public-page-media-content";

type PublicPageMediaManagementPanelProps = {
  media: AdminPublicPageMediaContent | null;
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

const publicMediaWriteOperation = "hero.write";
const genericFailureMessage =
  "Protected admin save could not be completed. Check image URL, alt text, and publish state before retrying.";

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

async function requestPublicMediaWriteProof(fetcher: typeof fetch) {
  const response = await fetcher("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requestedOperation: publicMediaWriteOperation,
      operation: publicMediaWriteOperation
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

function slotFallback(slot: PublicPageMediaSlot) {
  return defaultPublicPageMediaForSlot(slot);
}

function mediaValue(
  media: AdminPublicPageMediaContent | null,
  key: "imageUrl" | "imageAlt"
) {
  return typeof media?.[key] === "string"
    ? media[key]
    : slotFallback(ABOUT_STORY_MEDIA_SLOT)[key];
}

export function PublicPageMediaManagementPanel({
  media,
  fetcher = fetch,
  onMutationComplete = reloadDashboard
}: PublicPageMediaManagementPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const enabledInput = form.elements.namedItem("isEnabled");
    const payload = {
      slot: ABOUT_STORY_MEDIA_SLOT,
      imageUrl: formValue(formData, "imageUrl"),
      imageAlt: formValue(formData, "imageAlt"),
      isEnabled:
        enabledInput instanceof HTMLInputElement ? enabledInput.checked : false
    };
    const validation = validatePublicPageMediaInput(payload);

    if (!validation.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    setStatus({
      kind: "pending",
      message: "Protected admin save is checking About story media..."
    });

    try {
      const csrfProof = await requestPublicMediaWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericFailureMessage
        });
        return;
      }

      const response = await fetcher("/api/admin/page-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-proof": csrfProof
        },
        body: JSON.stringify(validation.content)
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
        message: "About story image saved for protected admin review. Refreshing dashboard."
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
    <section className="premium-section" aria-label="Public page media management">
      <div className="premium-container" style={{ maxWidth: "1000px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            Protected admin save
          </p>
          <h2 className="premium-title-section" style={{ fontSize: "28px", marginBottom: "16px" }}>
            About story media
          </h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            Edit the public About page Our Story image reference and alt text.
            Media upload remains separate; use a reviewed HTTPS or same-site
            image reference only.
          </p>
        </div>

        {status.kind !== "idle" ? (
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              marginBottom: "32px",
              fontSize: "14px",
              fontWeight: 500,
              ...(status.kind === "success"
                ? {
                    background: "rgba(34, 197, 94, 0.1)",
                    color: "#22c55e",
                    border: "1px solid rgba(34, 197, 94, 0.2)"
                  }
                : status.kind === "error"
                  ? {
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.2)"
                    }
                  : {
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "#3b82f6",
                      border: "1px solid rgba(59, 130, 246, 0.2)"
                    })
            }}
            aria-live="polite"
          >
            {status.message}
          </div>
        ) : null}

        <form
          aria-label="About story media"
          className="premium-form-card"
          onSubmit={handleSubmit}
        >
          <div style={{ display: "grid", gap: "20px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
              About story image URL
              <input
                className="premium-input"
                defaultValue={mediaValue(media, "imageUrl")}
                maxLength={1000}
                name="imageUrl"
                required
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
              About story image alt
              <input
                className="premium-input"
                defaultValue={mediaValue(media, "imageAlt")}
                maxLength={240}
                name="imageAlt"
                required
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 600 }}>
              <input
                defaultChecked={media?.isEnabled ?? true}
                name="isEnabled"
                type="checkbox"
                style={{ width: "18px", height: "18px", accentColor: "var(--accent)" }}
              />
              Publish About story image
            </label>

            <button className="premium-button premium-button--primary" type="submit">
              Save About story image
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
