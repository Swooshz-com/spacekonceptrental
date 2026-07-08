import type { ReactNode } from "react";

import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import {
  resolveAdminProductDashboardRead,
  type AdminProductDashboardReadResult
} from "../../lib/products/admin-read/admin-product-dashboard-read";
import { getAdminRouteRuntimeConfig } from "../../lib/server-runtime-config";
import { CatalogueOwnerWorkflow } from "../../components/admin/catalogue-owner-workflow";
import { HeroContentManagementPanel } from "../../components/admin/hero-content-management-panel";
import type { AdminHomepageHeroReadResult } from "../../lib/hero/admin-homepage-hero-read";
import type { AdminQuoteEmailDeliveryLogReadResult } from "../../lib/quote/admin-read/admin-quote-email-delivery-log";
import type { QuoteEnquiryEmailConfigStatus } from "../../lib/quote/email-handoff";
import styles from "./protected-admin-shell.module.css";

export type ProtectedAdminShellState =
  | {
      status: "unauthenticated";
    }
  | {
      status: "authenticated_not_authorised";
    }
  | {
      status: "authorised_admin";
      dashboard: AdminProductDashboardReadResult;
    }
  | {
      status: "unavailable";
    };

export type AdminShellView =
  | {
      kind: "home";
    }
  | {
      kind: "hero";
      hero?: AdminHomepageHeroReadResult;
    }
  | {
      kind: "catalogue";
    }
  | {
      kind: "setups";
    }
  | {
      kind: "enquiry-email";
      config?: QuoteEnquiryEmailConfigStatus;
      deliveryLog?: AdminQuoteEmailDeliveryLogReadResult;
    }
  | {
      kind: "delivery-log";
      deliveryLog?: AdminQuoteEmailDeliveryLogReadResult;
    };

type ProtectedAdminShellGateState =
  | Exclude<ProtectedAdminShellState, { status: "authorised_admin" }>
  | {
      status: "authorised_admin";
    };

const requestSecurityDenyReasons = new Set<string>([
  "operation_not_supported",
  "request_method_missing",
  "request_method_not_allowed",
  "origin_missing",
  "host_missing",
  "origin_host_mismatch",
  "csrf_proof_missing",
  "csrf_verifier_unavailable",
  "csrf_verification_failed",
  "csrf_proof_invalid",
  "csrf_proof_stale",
  "csrf_proof_replayed",
  "csrf_proof_mismatched"
]);

const adminNavigationItems = [
  {
    kind: "home",
    href: "/admin",
    label: "Dashboard",
    meta: "Home"
  },
  {
    kind: "hero",
    href: "/admin/hero",
    label: "Hero",
    meta: "Image"
  },
  {
    kind: "catalogue",
    href: "/admin/catalogue",
    label: "Catalogue",
    meta: "Items"
  },
  {
    kind: "setups",
    href: "/admin/setups",
    label: "Setups",
    meta: "Derived"
  },
  {
    kind: "enquiry-email",
    href: "/admin/enquiry-email",
    label: "Enquiry Email",
    meta: "Handoff"
  },
  {
    kind: "delivery-log",
    href: "/admin/delivery-log",
    label: "Delivery Log",
    meta: "Technical"
  }
] as const;

type AdminNavigationKind = (typeof adminNavigationItems)[number]["kind"];

const adminNavigationIcons: Record<AdminNavigationKind, ReactNode> = {
  home: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <rect x="14" y="14" width="6" height="6" />
    </svg>
  ),
  hero: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  ),
  catalogue: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <rect x="14" y="14" width="6" height="6" />
    </svg>
  ),
  setups: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 4 8 5-8 5-8-5 8-5Z" />
      <path d="m4 15 8 5 8-5" />
    </svg>
  ),
  "enquiry-email": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  ),
  "delivery-log": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h11v9H4z" />
      <path d="M15 10h3l2 2.5V16h-5z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  )
};

const emptyStateIcons: Record<"log", ReactNode> = {
  log: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </svg>
  )
};

function mapGateResult(
  result: ServerAdminRuntimeRouteGateAdapterResult
): ProtectedAdminShellGateState {
  if (result.allowed) {
    return {
      status: "authorised_admin"
    };
  }

  if (result.statusCode === 401 || result.reason === "unauthenticated") {
    return {
      status: "unauthenticated"
    };
  }

  if (
    result.statusCode === 503 ||
    requestSecurityDenyReasons.has(result.reason)
  ) {
    return {
      status: "unavailable"
    };
  }

  return {
    status: "authenticated_not_authorised"
  };
}

export async function resolveProtectedAdminShellState(): Promise<ProtectedAdminShellState> {
  const routeConfig = getAdminRouteRuntimeConfig();
  const trustedServerWorkspaceId = routeConfig.trustedServerWorkspaceId;

  try {
    const result = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "admin.shell.access",
        requestMethod: "GET"
      },
      {
        requestMetadata: {
          expectedOrigin: routeConfig.expectedOrigin,
          expectedHost: routeConfig.expectedHost
        },
        gate: {
          decision: {
            workspace: {
              trustedServerWorkspaceId
            }
          }
        }
      }
    );

    const gateState = mapGateResult(result);

    if (gateState.status !== "authorised_admin") {
      return gateState;
    }

    const dashboard = await resolveAdminProductDashboardRead({
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: trustedServerWorkspaceId
      }
    });

    return {
      status: "authorised_admin",
      dashboard
    };
  } catch {
    return {
      status: "unavailable"
    };
  }
}

function activeNavigationKind(view: AdminShellView): AdminNavigationKind {
  return view.kind;
}

function workspaceTitle(view: AdminShellView) {
  const activeKind = activeNavigationKind(view);
  const item = adminNavigationItems.find(({ kind }) => kind === activeKind);

  return item ? item.label : "Dashboard";
}

function workspaceDescription(view: AdminShellView) {
  const descriptions: Record<AdminNavigationKind, string> = {
    home: "Manage public website content: hero image, catalogue records, setup presentation, enquiry handoff, and delivery visibility.",
    hero: "Manage the public homepage hero image reference.",
    catalogue:
      "Manage rental catalogue items shown on the public site.",
    setups:
      "Review setup-style presentation derived from published catalogue items.",
    "enquiry-email": "Check the server-side n8n enquiry handoff status.",
    "delivery-log": "Review technical enquiry handoff delivery attempts."
  };

  return descriptions[activeNavigationKind(view)];
}

function quoteEmailSetupIssueLabel(reason?: string) {
  const labels: Record<string, string> = {
    n8n_handoff_not_configured: "n8n handoff not configured",
    n8n_shared_secret_not_configured: "Shared secret not configured",
    n8n_timeout_invalid: "Timeout setting invalid",
    n8n_webhook_invalid: "Webhook endpoint invalid",
    n8n_webhook_not_configured: "Webhook endpoint not configured"
  };

  return reason ? labels[reason] ?? "Configuration incomplete" : null;
}

function hasText(value?: string) {
  return Boolean(value?.trim());
}

function AdminWorkspaceRecoveryLinks() {
  return (
    <nav className={styles.recoveryNav} aria-label="Admin recovery">
      <a className={styles.secondaryButton} href="/admin">
        Open admin overview
      </a>
      <a className={styles.secondaryButton} href="/admin/hero">
        Open hero
      </a>
      <a className={styles.secondaryButton} href="/admin/catalogue">
        Open catalogue
      </a>
      <a className={styles.secondaryButton} href="/admin/setups">
        Open setups
      </a>
      <a className={styles.secondaryButton} href="/admin/enquiry-email">
        Open enquiry email
      </a>
      <a className={styles.secondaryButton} href="/admin/delivery-log">
        Open delivery log
      </a>
    </nav>
  );
}

function AdminAccessRecoveryLinks({
  signInLabel = "Return to admin sign in"
}: {
  signInLabel?: string;
}) {
  return (
    <nav className={styles.recoveryNav} aria-label="Admin access recovery">
      <a className={styles.primaryButton} href="/admin/login">
        {signInLabel}
      </a>
      <a className={styles.secondaryButton} href="/">
        View public site
      </a>
    </nav>
  );
}

function AdminOperationsNavigation({ view }: { view: AdminShellView }) {
  const activeKind = activeNavigationKind(view);

  return (
    <nav className={styles.navList} aria-label="Admin sections">
      {adminNavigationItems.map((item) => {
        const isActive = item.kind === activeKind;

        return (
          <a
            aria-current={isActive ? "page" : undefined}
            className={`${styles.navLink} ${
              isActive ? styles.navLinkActive : ""
            }`}
            href={item.href}
            key={item.href}
          >
            <span className={styles.navIcon} aria-hidden="true">
              {adminNavigationIcons[item.kind]}
            </span>
            <span className={styles.navLabel}>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function AdminUnavailableWorkspace({
  description,
  title
}: {
  description: string;
  title: string;
}) {
  return (
    <section
      className={styles.unavailablePanel}
      aria-label={`${title} unavailable`}
    >
      <p className={styles.eyebrow}>Temporarily unavailable</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <AdminWorkspaceRecoveryLinks />
    </section>
  );
}

function AdminMetricCard({
  description,
  label,
  tone = "neutral",
  value
}: {
  description?: string;
  label: string;
  tone?: "neutral" | "attention";
  value: number | string;
}) {
  return (
    <dl
      className={`${styles.metricCard} ${
        tone === "attention" ? styles.metricCardAttention : ""
      }`}
    >
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
      {description ? <p>{description}</p> : null}
    </dl>
  );
}

function AdminDashboardCountRow({
  description,
  label,
  tone = "neutral",
  value
}: {
  description: string;
  label: string;
  tone?: "neutral" | "attention";
  value: number | string;
}) {
  return (
    <li>
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <span
        className={`${styles.dashboardCount} ${
          tone === "attention" ? styles.dashboardCountAttention : ""
        }`}
      >
        {value}
      </span>
    </li>
  );
}

function AdminDashboardQuickLink({
  href,
  label
}: {
  href: string;
  label: string;
}) {
  return (
    <a className={styles.quickLinkCard} href={href}>
      <span>{label}</span>
      <svg
        aria-hidden="true"
        className={styles.quickLinkIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </a>
  );
}

function AdminEmptyState({
  eyebrow,
  title,
  message,
  icon
}: {
  eyebrow: string;
  title: string;
  message: string;
  icon?: ReactNode;
}) {
  return (
    <section className={styles.emptyStatePanel} aria-label={title}>
      {icon ? (
        <span className={styles.emptyStateIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}

function AdminOperationsHome({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status !== "loaded") {
    return (
      <AdminUnavailableWorkspace
        title="Dashboard"
        description="Catalogue data is temporarily unavailable. The read-only overview will return once existing catalogue reads recover."
      />
    );
  }

  const { products } = dashboard.data;
  const publishedCount = products.filter(
    (product) => product.status === "published"
  ).length;
  const draftCount = products.filter(
    (product) => product.status === "draft"
  ).length;
  const hiddenCount = products.filter(
    (product) => product.status === "archived"
  ).length;
  const missingAltText = products.filter(
    (product) =>
      product.status !== "archived" &&
      product.imageCount > 0 &&
      !hasText(product.primaryImageAltText)
  ).length;
  const missingImages = products.filter(
    (product) => product.status !== "archived" && product.imageCount === 0
  ).length;

  return (
    <section className={styles.dashboardGrid} aria-label="Admin dashboard">
      <section className={styles.dashboardCard} aria-label="Content Status">
        <h2>Content Status</h2>
        <ul className={styles.dashboardList}>
          <AdminDashboardCountRow
            label="Published"
            description="Visible on the public site."
            value={publishedCount}
          />
          <AdminDashboardCountRow
            label="Draft"
            description="Work in progress."
            value={draftCount}
          />
          <AdminDashboardCountRow
            label="Hidden"
            description="Records currently not public."
            value={hiddenCount}
          />
        </ul>
      </section>

      <section className={styles.dashboardCard} aria-label="Attention Required">
        <h2>Attention Required</h2>
        <ul className={styles.dashboardList}>
          <AdminDashboardCountRow
            label="Missing Alt Text"
            description="Listings needing accessibility updates."
            tone={missingAltText > 0 ? "attention" : "neutral"}
            value={missingAltText}
          />
          <AdminDashboardCountRow
            label="Missing Images"
            description="Listings without media uploaded."
            tone={missingImages > 0 ? "attention" : "neutral"}
            value={missingImages}
          />
        </ul>
      </section>

      <section className={styles.dashboardCard} aria-label="Quick Links">
        <h2>Quick Links</h2>
        <div className={styles.quickLinkGrid}>
          <AdminDashboardQuickLink href="/admin/hero" label="Manage Hero" />
          <AdminDashboardQuickLink
            href="/admin/catalogue"
            label="Manage Catalogue"
          />
          <AdminDashboardQuickLink href="/admin/setups" label="Manage Setups" />
        </div>
      </section>
    </section>
  );
}

function AdminHeroOperations({
  hero = {
    status: "loaded",
    hero: null
  }
}: {
  hero?: AdminHomepageHeroReadResult;
}) {
  if (hero.status === "unavailable") {
    return (
      <AdminUnavailableWorkspace
        title="Homepage hero image"
        description="Hero image data is temporarily unavailable. The protected Hero route remains in place while existing reads recover."
      />
    );
  }

  return <HeroContentManagementPanel hero={hero.hero} />;
}

function AdminCatalogueOperations({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return (
      <AdminUnavailableWorkspace
        title="Catalogue management"
        description="Catalogue data is temporarily unavailable. The protected catalogue route remains in place while existing reads recover."
      />
    );
  }

  const ownerSafeImages = dashboard.data.images.map(
    ({ id, productId, altText, sortOrder, isPrimary, status }) => ({
      id,
      productId,
      altText,
      sortOrder,
      isPrimary,
      status
    })
  );

  return (
    <div className={styles.managementStack}>
      <CatalogueOwnerWorkflow
        categories={dashboard.data.categories}
        products={dashboard.data.products}
        images={ownerSafeImages}
      />
    </div>
  );
}

function AdminSetupsOperations({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return (
      <AdminUnavailableWorkspace
        title="Setups management"
        description="Setup data is temporarily unavailable because it currently derives from catalogue reads."
      />
    );
  }

  const categoryById = new Map(
    dashboard.data.categories.map((category) => [category.id, category.name])
  );
  const setupCandidates = dashboard.data.products.filter(
    (product) => product.status === "published"
  );
  const excludedItems = dashboard.data.products.filter(
    (product) => product.status !== "published"
  ).length;
  const needsImageReview = setupCandidates.filter(
    (product) => product.imageCount === 0 || !hasText(product.primaryImageAltText)
  );
  const allCandidatesNeedImageReview =
    setupCandidates.length > 0 &&
    needsImageReview.length === setupCandidates.length;

  return (
    <section
      className={styles.managementStack}
      aria-label="Derived setup review workflow"
    >
      <section className={styles.placeholderPanel}>
        <div className={styles.panelTitleRow}>
          <div>
            <h2>Setup presentation review</h2>
            <p>
              Setups are currently derived from published Catalogue items. To
              change setup content for launch, edit the relevant Catalogue item.
            </p>
          </div>
          <nav className={styles.inlineActions} aria-label="Setup actions">
            <a className={styles.primaryButton} href="/admin/catalogue">
              Manage catalogue
            </a>
            <a className={styles.secondaryButton} href="/setups">
              View public setups
            </a>
          </nav>
        </div>
        <p>
          Only published, public-ready catalogue items should appear in the
          public setup presentation. No setup-specific editor or records are
          available in this launch slice.
        </p>
      </section>

      <section
        className={styles.metricGridThree}
        aria-label="Derived setup overview"
      >
        <dl className={styles.metricCard}>
          <dt>Available for setups</dt>
          <dd>{setupCandidates.length}</dd>
          <p>Published catalogue items available for public setup cards.</p>
        </dl>
        <dl className={styles.metricCard}>
          <dt>Excluded</dt>
          <dd>{excludedItems}</dd>
          <p>Draft or hidden catalogue items excluded from public setups.</p>
        </dl>
        <dl
          className={`${styles.metricCard} ${
            needsImageReview.length > 0 ? styles.metricCardAttention : ""
          }`}
        >
          <dt>Image review</dt>
          <dd>{needsImageReview.length}</dd>
          <p>Published items missing image coverage or primary image alt text.</p>
        </dl>
      </section>

      {setupCandidates.length === 0 ? (
        <section className={styles.emptyStatePanel}>
          <h2>No public setup candidates yet</h2>
          <p>
            Published catalogue items will populate Setups. Add or publish a
            public-ready catalogue item, then return here to review it.
          </p>
          <a className={styles.primaryButton} href="/admin/catalogue">
            Manage catalogue
          </a>
        </section>
      ) : (
        <section className={styles.rowPanel}>
          <div className={styles.tableHeader}>
            <div>
              <h2>Public setup candidates</h2>
              <p>
                Public-like setup cards sourced from existing Catalogue data.
              </p>
            </div>
            <span className={`${styles.statusPill} ${styles.statusPillMuted}`}>
              Derived from Catalogue
            </span>
          </div>

          {allCandidatesNeedImageReview ? (
            <p className={styles.reviewNotice}>
              Every published setup candidate needs image or alt-text review.
              Fix image coverage in Catalogue before launch review.
            </p>
          ) : null}

          <div className={styles.setupCardGrid}>
            {setupCandidates.map((product) => {
              const categoryName = product.categoryId
                ? categoryById.get(product.categoryId) ?? "Unassigned category"
                : "Unassigned category";
              const imageReady =
                product.imageCount > 0 && hasText(product.primaryImageAltText);
              const readinessLabel = imageReady
                ? "Image ready"
                : product.imageCount > 0
                  ? "Needs image alt text"
                  : "Needs image";

              return (
                <article
                  className={styles.setupCard}
                  key={product.id}
                  aria-label={`Setup candidate ${product.name}`}
                >
                  <div className={styles.setupCardHeader}>
                    <div>
                      <h3>{product.name}</h3>
                      <p>{categoryName}</p>
                    </div>
                    <span
                      className={`${styles.statusTag} ${styles.statusTagPublished}`}
                    >
                      Published
                    </span>
                  </div>
                  <p>
                    {product.shortDescription ??
                      "Catalogue item available for setup presentation and enquiry context."}
                  </p>
                  <div className={styles.setupCardMeta}>
                    <span
                      className={`${styles.statusTag} ${
                        imageReady
                          ? styles.statusTagPublished
                          : styles.statusPillWarning
                      }`}
                    >
                      {readinessLabel}
                    </span>
                    <span>{product.imageCount} image(s)</span>
                  </div>
                  <a className={styles.secondaryButton} href="/admin/catalogue">
                    Edit in Catalogue
                  </a>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}

function deliveryProviderLabel(provider: "n8n" | "resend") {
  return provider === "n8n" ? "n8n handoff" : "legacy email handoff";
}

function deliveryStatusClassName(
  status: "pending" | "delivered" | "sent" | "failed" | "not_configured"
) {
  if (status === "delivered" || status === "sent") {
    return styles.statusTagPublished;
  }

  if (status === "failed") {
    return styles.statusTagWarning;
  }

  return styles.statusTagMuted;
}

function AdminEnquiryEmailStatusOperations({
  config = {
    provider: "n8n",
    handoffMode: "n8n",
    handoffConfigured: false,
    webhookConfigured: false,
    sharedSecretConfigured: false,
    timeoutMs: 10000
  },
  deliveryLog
}: {
  config?: QuoteEnquiryEmailConfigStatus;
  deliveryLog?: AdminQuoteEmailDeliveryLogReadResult;
}) {
  const webhookStatus = config.webhookConfigured
    ? "Endpoint configured"
    : "Endpoint not configured";
  const sharedSecretStatus = config.sharedSecretConfigured
    ? "Signing configured"
    : "Signing not configured";
  const setupIssue = quoteEmailSetupIssueLabel(config.missingReason);
  const latestRecord =
    deliveryLog?.status === "loaded" ? deliveryLog.records[0] : undefined;
  const statusLabel =
    config.handoffConfigured
      ? "Ready"
      : config.missingReason === "n8n_webhook_invalid" ||
          config.missingReason === "n8n_timeout_invalid"
        ? "Unavailable"
        : "Needs setup";
  const statusClassName =
    statusLabel === "Ready"
      ? styles.statusPillReady
      : statusLabel === "Unavailable"
        ? styles.statusPillMuted
        : styles.statusPillWarning;

  return (
    <section
      className={styles.statusSummaryPanel}
      aria-label="Enquiry email handoff status"
    >
      <div className={styles.statusSummaryHeader}>
        <div>
          <p className={styles.eyebrow}>Enquiry Email</p>
          <h2>Enquiry email handoff status</h2>
        </div>
        <span className={`${styles.statusPill} ${statusClassName}`}>
          {statusLabel}
        </span>
      </div>
      <p className={styles.statusSummaryCopy}>
        SKR stores each public enquiry first. After persistence succeeds, the
        server-side handoff triggers n8n for internal email handling. This page
        shows readiness only; webhook and signing values stay out of the admin UI.
      </p>
      <dl className={styles.adminRows}>
        <div>
          <dt>Handoff mode</dt>
          <dd>Server-side n8n</dd>
        </div>
        <div>
          <dt>Handoff endpoint</dt>
          <dd>{webhookStatus}</dd>
        </div>
        <div>
          <dt>Request signing</dt>
          <dd>{sharedSecretStatus}</dd>
        </div>
        <div>
          <dt>Last delivery status</dt>
          <dd>
            {latestRecord
              ? `${latestRecord.deliveryStatus} - ${latestRecord.publicReference}`
              : deliveryLog?.status === "unavailable"
                ? "Delivery log unavailable"
                : "No delivery attempts yet"}
          </dd>
        </div>
        {setupIssue ? (
          <div>
            <dt>Setup issue</dt>
            <dd>{setupIssue}</dd>
          </div>
        ) : null}
      </dl>
      <nav className={styles.inlineActions} aria-label="Enquiry email actions">
        <a className={styles.secondaryButton} href="/admin/delivery-log">
          Open delivery log
        </a>
      </nav>
    </section>
  );
}

function AdminDeliveryLogTableOperations({
  deliveryLog = {
    status: "loaded",
    records: []
  }
}: {
  deliveryLog?: AdminQuoteEmailDeliveryLogReadResult;
}) {
  if (deliveryLog.status === "unavailable") {
    return (
      <AdminUnavailableWorkspace
        title="Email delivery log"
        description="Delivery log records are temporarily unavailable. The protected delivery log remains technical-only and will return once existing reads recover."
      />
    );
  }

  if (deliveryLog.records.length === 0) {
    return (
      <AdminEmptyState
        eyebrow="Delivery Log"
        title="Enquiry handoff delivery log"
        message="No enquiry handoff attempts have been recorded yet. Delivery attempts appear after real public enquiry submissions are stored and SKR tries the server-side n8n handoff."
        icon={emptyStateIcons.log}
      />
    );
  }

  return (
    <section className={styles.tablePanel} aria-label="Enquiry handoff delivery log">
      <div className={styles.tableHeader}>
        <h2>Enquiry handoff delivery log</h2>
      </div>
      <div
        className={styles.dataTable}
        role="table"
        aria-label="Enquiry handoff delivery attempts"
      >
        <div role="row">
          <strong role="columnheader">Attempted</strong>
          <strong role="columnheader">Enquiry reference</strong>
          <strong role="columnheader">Channel</strong>
          <strong role="columnheader">Status</strong>
          <strong role="columnheader">Safe result</strong>
        </div>
        {deliveryLog.records.map((record) => (
          <div role="row" key={record.id}>
            <span role="cell">{record.attemptedAt}</span>
            <span role="cell">
              {record.publicReference || record.quoteRequestId}
            </span>
            <span role="cell">{deliveryProviderLabel(record.provider)}</span>
            <span role="cell">
              <span
                className={`${styles.statusTag} ${deliveryStatusClassName(
                  record.deliveryStatus
                )}`}
              >
                {record.deliveryStatus}
              </span>
            </span>
            <span role="cell">
              {record.providerMessageId ?? record.errorCode ?? "Recorded"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminOperationsView({
  state,
  view
}: {
  state: Extract<ProtectedAdminShellState, { status: "authorised_admin" }>;
  view: AdminShellView;
}) {
  if (view.kind === "hero") {
    return <AdminHeroOperations hero={view.hero} />;
  }

  if (view.kind === "catalogue") {
    return <AdminCatalogueOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "setups") {
    return <AdminSetupsOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "enquiry-email") {
    return (
      <AdminEnquiryEmailStatusOperations
        config={view.config}
        deliveryLog={view.deliveryLog}
      />
    );
  }

  if (view.kind === "delivery-log") {
    return <AdminDeliveryLogTableOperations deliveryLog={view.deliveryLog} />;
  }

  return <AdminOperationsHome dashboard={state.dashboard} />;
}

function AdminTopbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.brandLine}>
        <h1 className={styles.brandTitle}>
          <a
            className={styles.brandHomeLink}
            href="/admin"
            aria-label="SpaceKonceptRental Admin dashboard"
          >
            SpaceKonceptRental Admin
          </a>
        </h1>
        <span className={styles.workspaceBadge}>Protected Workspace</span>
      </div>
      <div className={styles.topbarActions}>
        <a className={styles.topbarLink} href="/">
          View public site
        </a>
        <form action="/admin/logout" method="post">
          <button className={styles.signOutButton} type="submit">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

function AdminPageHeader({ view }: { view: AdminShellView }) {
  return (
    <header
      className={`${styles.pageHeader} ${
        view.kind === "home" ? styles.pageHeaderPlain : ""
      }`}
      aria-label="Admin page header"
    >
      <p className={styles.eyebrow}>Protected Admin</p>
      <h2>{workspaceTitle(view)}</h2>
      <p>{workspaceDescription(view)}</p>
    </header>
  );
}

function AdminStatusMessage({
  state,
  view
}: {
  state: ProtectedAdminShellState;
  view: AdminShellView;
}) {
  if (state.status === "unauthenticated") {
    return (
      <div className={`${styles.statusCard} ${styles.statusPanel}`}>
        <p className={styles.eyebrow}>Protected admin</p>
        <h1>Admin sign in required</h1>
        <p>Sign in to continue to SpaceKonceptRental Admin.</p>
        <AdminAccessRecoveryLinks signInLabel="Sign in" />
      </div>
    );
  }

  if (state.status === "authenticated_not_authorised") {
    return (
      <div
        className={`${styles.statusCard} ${styles.statusPanel} ${styles.statusPanelDenied}`}
      >
        <p className={styles.eyebrow}>Protected admin</p>
        <h1>Access denied</h1>
        <p>
          Your account is signed in but not authorised for
          SpaceKonceptRental Admin.
        </p>
        <AdminAccessRecoveryLinks />
      </div>
    );
  }

  if (state.status === "unavailable") {
    return (
      <div className={`${styles.statusCard} ${styles.statusPanel}`}>
        <p className={styles.eyebrow}>Protected admin</p>
        <h1>Admin access unavailable</h1>
        <p>Admin access is temporarily unavailable. Please try again shortly.</p>
        <AdminAccessRecoveryLinks />
      </div>
    );
  }

  return (
    <div
      className={`${styles.workspaceFrame} ${
        view.kind === "home" ? styles.workspaceFrameDashboard : ""
      }`}
    >
      <AdminTopbar />
      <details className={styles.mobileMenu}>
        <summary className={styles.mobileSummary}>
          Admin menu - {workspaceTitle(view)}
        </summary>
        <div className={styles.mobileNavPanel}>
          <AdminOperationsNavigation view={view} />
        </div>
      </details>
      <div className={styles.workspaceBody}>
        <aside className={styles.sidebar} aria-label="Admin sidebar">
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarLabel}>Workspace</span>
          </div>
          <AdminOperationsNavigation view={view} />
        </aside>
        <main className={styles.mainPanel}>
          <AdminPageHeader view={view} />
          <AdminOperationsView state={state} view={view} />
        </main>
      </div>
    </div>
  );
}

export function AdminShellContent({
  state,
  view = {
    kind: "home"
  }
}: {
  state: ProtectedAdminShellState;
  view?: AdminShellView;
}) {
  return (
    <section
      aria-live="polite"
      className={`skr-admin-workspace ${styles.workspace}`}
    >
      <AdminStatusMessage state={state} view={view} />
    </section>
  );
}
