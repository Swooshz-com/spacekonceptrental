"use client";

import { useState, type FormEvent } from "react";

import {
  DEFAULT_HOMEPAGE_HERO_CONTENT,
  validateHomepageHeroContentInput,
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
const genericFailureMessage =
  "Protected admin save could not be completed. Check headline, links, image URL, and alt text before retrying.";
type HeroTextField =
  | "eyebrow"
  | "headline"
  | "body"
  | "primaryCtaLabel"
  | "primaryCtaHref"
  | "secondaryCtaLabel"
  | "secondaryCtaHref"
  | "imageUrl"
  | "imageAlt";

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

function heroValue(hero: HomepageHeroContent | null, key: HeroTextField) {
  return typeof hero?.[key] === "string"
    ? hero[key]
    : DEFAULT_HOMEPAGE_HERO_CONTENT[key];
}

export function HeroContentManagementPanel({
  hero,
  fetcher = fetch,
  onMutationComplete = reloadDashboard
}: HeroContentManagementPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const enabledInput = form.elements.namedItem("isEnabled");
    const payload = {
      eyebrow: formValue(formData, "eyebrow"),
      headline: formValue(formData, "headline"),
      body: formValue(formData, "body"),
      primaryCtaLabel: formValue(formData, "primaryCtaLabel"),
      primaryCtaHref: formValue(formData, "primaryCtaHref"),
      secondaryCtaLabel: formValue(formData, "secondaryCtaLabel"),
      secondaryCtaHref: formValue(formData, "secondaryCtaHref"),
      imageUrl: formValue(formData, "imageUrl"),
      imageAlt: formValue(formData, "imageAlt"),
      isEnabled:
        enabledInput instanceof HTMLInputElement ? enabledInput.checked : false
    };
    const validation = validateHomepageHeroContentInput(payload);

    if (!validation.ok) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    setStatus({
      kind: "pending",
      message: "Protected admin save is checking hero content..."
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

      const response = await fetcher("/api/admin/hero", {
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
        message: "Hero content saved for protected admin review. Refreshing dashboard."
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
    <section className="premium-section" aria-label="Homepage hero content management">
      <div className="premium-container" style={{ maxWidth: "1000px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            Protected admin save
          </p>
          <h2 className="premium-title-section" style={{ fontSize: "28px", marginBottom: "16px" }}>
            Homepage hero content
          </h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            Edit homepage hero text, calls to action, and image reference through
            the protected admin API. Media upload remains separate; use a reviewed
            HTTPS or same-site image reference only.
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
          aria-label="Homepage hero content"
          className="premium-form-card"
          onSubmit={handleSubmit}
        >
          <div style={{ display: "grid", gap: "20px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
              Hero eyebrow
              <input
                className="premium-input"
                defaultValue={heroValue(hero, "eyebrow")}
                maxLength={120}
                name="eyebrow"
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
              Hero headline
              <input
                className="premium-input"
                defaultValue={heroValue(hero, "headline")}
                maxLength={160}
                name="headline"
                required
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
              Hero body
              <textarea
                className="premium-input"
                defaultValue={heroValue(hero, "body")}
                maxLength={500}
                name="body"
                required
                rows={4}
                style={{ resize: "vertical" }}
              />
            </label>

            <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                Primary CTA label
                <input
                  className="premium-input"
                  defaultValue={heroValue(hero, "primaryCtaLabel")}
                  maxLength={80}
                  name="primaryCtaLabel"
                  required
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                Primary CTA href
                <input
                  className="premium-input"
                  defaultValue={heroValue(hero, "primaryCtaHref")}
                  maxLength={300}
                  name="primaryCtaHref"
                  required
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                Secondary CTA label
                <input
                  className="premium-input"
                  defaultValue={heroValue(hero, "secondaryCtaLabel")}
                  maxLength={80}
                  name="secondaryCtaLabel"
                  required
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                Secondary CTA href
                <input
                  className="premium-input"
                  defaultValue={heroValue(hero, "secondaryCtaHref")}
                  maxLength={300}
                  name="secondaryCtaHref"
                  required
                />
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
              Hero image URL
              <input
                className="premium-input"
                defaultValue={heroValue(hero, "imageUrl")}
                maxLength={1000}
                name="imageUrl"
                required
              />
              <small style={{ fontWeight: 400, color: "var(--muted)", fontSize: "12px" }}>
                Use HTTPS or a same-site public image reference. This form does
                not upload files.
              </small>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
              Hero image alt
              <input
                className="premium-input"
                defaultValue={heroValue(hero, "imageAlt")}
                maxLength={240}
                name="imageAlt"
                required
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 500, padding: "16px", background: "var(--background)", borderRadius: "var(--radius-md)" }}>
              <input
                defaultChecked={hero?.isEnabled ?? true}
                name="isEnabled"
                type="checkbox"
                style={{ width: "18px", height: "18px", accentColor: "var(--accent)" }}
              />
              Publish hero content
            </label>

            <button className="premium-button premium-button--primary" type="submit" style={{ marginTop: "12px" }}>
              Save hero content
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
