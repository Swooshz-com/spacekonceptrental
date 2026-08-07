import type { ReactNode } from "react";

import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import {
  resolveAdminProductDashboardRead,
  type AdminProductDashboardProduct,
  type AdminProductDashboardReadResult
} from "../../lib/products/admin-read/admin-product-dashboard-read";
import { getAdminRouteRuntimeConfig } from "../../lib/server-runtime-config";
import { CatalogueOwnerWorkflow } from "../../components/admin/catalogue-owner-workflow";
import { AdminAccessManagementPanel } from "../../components/admin/admin-access-management-panel";
import { HeroContentManagementPanel } from "../../components/admin/hero-content-management-panel";
import {
  SetupRecipeSelector,
  type SetupRecipeEditorCandidate
} from "../../components/admin/setup-recipe-selector";
import {
  resolveAdminAccessDashboardRead,
  type AdminAccessDashboardReadResult
} from "../../lib/admin/access/admin-access-management";
import type { AdminHomepageHeroReadResult } from "../../lib/hero/admin-homepage-hero-read";
import type { AdminQuoteEmailDeliveryLogReadResult } from "../../lib/quote/admin-read/admin-quote-email-delivery-log";
import type { QuoteEnquiryEmailConfigStatus } from "../../lib/quote/email-handoff";
import type { AdminAppOperationEventOperationsReadResult } from "../../lib/application-events/app-operation-event-operations-read";
import type { AppOperationEventOperationsQuery } from "../../lib/application-events/app-operation-event-operations-query";
import type {
  AppOperationEventCategory,
  AppOperationEventOutcome,
  AppOperationEventSinkState
} from "../../lib/application-events/app-operation-event-types";
import {
  appOperationEventCategories,
  appOperationEventOutcomes
} from "../../lib/application-events/app-operation-event-types";
import { appOperationEventSinkStateLabel } from "../../lib/application-events/app-operation-event-sink-display";
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
      workspaceId: string;
      dashboard: AdminProductDashboardReadResult;
      adminAccess?: AdminAccessDashboardReadResult;
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
    }
  | {
      kind: "operations";
      read?: AdminAppOperationEventOperationsReadResult;
      sinkState?: AppOperationEventSinkState;
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
  },
  {
    kind: "operations",
    href: "/admin/operations",
    label: "Operations",
    meta: "Events"
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
  ),
  operations: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 12h3l2-6 3.5 12 3-8 1.5 2h4.5" />
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
    const adminAccess = await resolveAdminAccessDashboardRead();

    return {
      status: "authorised_admin",
      workspaceId: trustedServerWorkspaceId ?? "",
      dashboard,
      adminAccess
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
      "Manage setup recipes for editable unpublished parents and existing recipe parents.",
    "enquiry-email": "Check the server-side n8n enquiry handoff status.",
    "delivery-log": "Review technical enquiry handoff delivery attempts.",
    operations:
      "Review bounded application operation events recorded for the trusted workspace."
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
      <a className={styles.secondaryButton} href="/admin/operations">
        Open operations
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
  adminAccess,
  dashboard
}: {
  adminAccess?: AdminAccessDashboardReadResult;
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

      <div className={styles.dashboardWidePanel}>
        {adminAccess?.status === "loaded" ? (
          <AdminAccessManagementPanel
            currentAdmin={adminAccess.currentAdmin}
            records={adminAccess.records}
          />
        ) : (
          <section
            className={styles.dashboardCard}
            aria-label="Admin access unavailable"
          >
            <h2>Admin access</h2>
            <p>
              Google admin access records are temporarily unavailable. Protected
              content remains gated while access data is recovered.
            </p>
          </section>
        )}
      </div>
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
  dashboard,
  workspaceId
}: {
  dashboard: AdminProductDashboardReadResult;
  workspaceId: string;
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
    dashboard.data.categories.map((category) => [category.id, category])
  );
  const existingSetupParentIds = new Set(dashboard.data.setupRecipeProductIds);
  const recipeChildIds = new Set(dashboard.data.setupRecipeChildProductIds);
  const parentEditorCandidates = dashboard.data.products.filter(
    (product) =>
      product.status !== "archived" &&
      !recipeChildIds.has(product.id) &&
      (product.status === "draft" || existingSetupParentIds.has(product.id))
  );
  const isPublicCatalogueProduct = (product: AdminProductDashboardProduct) =>
    product.status === "published" &&
    (!product.categoryId || categoryById.get(product.categoryId)?.isPublished === true);
  const childCandidatesByParent = new Map(
    parentEditorCandidates.map((parent) => [
      parent.id,
      dashboard.data.products
        .filter((product) => product.id !== parent.id)
        .filter((product) => !existingSetupParentIds.has(product.id))
        .filter((product) => product.status !== "archived")
        .filter(
          (product) =>
            parent.status !== "published" || isPublicCatalogueProduct(product)
        )
        .map((product) => ({ id: product.id, name: product.name }))
    ])
  );
  const excludedItems = dashboard.data.products.length - parentEditorCandidates.length;
  const needsImageReview = parentEditorCandidates.filter(
    (product) =>
      product.status === "published" &&
      (product.imageCount === 0 || !hasText(product.primaryImageAltText))
  );
  const allCandidatesNeedImageReview =
    parentEditorCandidates.some((product) => product.status === "published") &&
    needsImageReview.length ===
      parentEditorCandidates.filter((product) => product.status === "published").length;

  return (
    <section
      className={styles.managementStack}
      aria-label="Setup recipe management workflow"
    >
      <section className={styles.placeholderPanel}>
        <div className={styles.panelTitleRow}>
          <div>
            <h2>Setup recipe management</h2>
            <p>
              Authoritative setup recipes define ordered rental pieces with base
              quantities. Server-owned recipe data is used for public display and
              quote reconstruction.
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
      </section>

      <section
        className={styles.metricGridThree}
        aria-label="Derived setup overview"
      >
        <dl className={styles.metricCard}>
          <dt>Recipe parents</dt>
          <dd>{parentEditorCandidates.length}</dd>
          <p>Editable unpublished parents and existing recipe parents.</p>
        </dl>
        <dl className={styles.metricCard}>
          <dt>Excluded</dt>
          <dd>{excludedItems}</dd>
          <p>Catalogue items outside the setup-parent editor contract.</p>
        </dl>
        <dl
          className={`${styles.metricCard} ${
            needsImageReview.length > 0 ? styles.metricCardAttention : ""
          }`}
        >
          <dt>Image review</dt>
          <dd>{needsImageReview.length}</dd>
          <p>Published recipe parents missing image coverage or primary image alt text.</p>
        </dl>
      </section>

      {parentEditorCandidates.length === 0 ? (
        <section className={styles.emptyStatePanel}>
          <h2>No setup parent editors available</h2>
          <p>
            Add an editable unpublished catalogue item or create a recipe for an
            eligible parent, then return here to manage setup composition.
          </p>
          <a className={styles.primaryButton} href="/admin/catalogue">
            Manage catalogue
          </a>
        </section>
      ) : (
        <section className={styles.rowPanel}>
          <div className={styles.tableHeader}>
            <div>
              <h2>Setup recipe editor</h2>
              <p>
                Define ordered rental pieces for each setup using the authoritative
                server-side recipe. Changes are atomic and versioned.
              </p>
            </div>
          </div>

          {allCandidatesNeedImageReview ? (
            <p className={styles.reviewNotice}>
              Every published recipe parent needs image or alt-text review.
              Fix image coverage in Catalogue before launch review.
            </p>
          ) : null}

          <SetupRecipeSelector
            workspaceId={workspaceId}
            candidates={parentEditorCandidates.map<SetupRecipeEditorCandidate>((product) => ({
              id: product.id,
              slug: product.slug,
              name: product.name,
              sortOrder: product.sortOrder,
              parentStatus: product.status,
              categoryName: product.categoryId
                ? categoryById.get(product.categoryId)?.name ?? "Unassigned category"
                : "Unassigned category",
              imageReady:
                product.imageCount > 0 && hasText(product.primaryImageAltText),
              availableProducts: childCandidatesByParent.get(product.id) ?? []
            }))}
          />
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

const operationCategoryLabels: Record<AppOperationEventCategory, string> = {
  "quote.submission": "Quote submission",
  "quote.handoff": "Quote handoff",
  "admin.auth": "Admin auth",
  "rate.limit": "Rate limit"
};

const operationOutcomeLabels: Record<AppOperationEventOutcome, string> = {
  failed: "Failed",
  denied: "Denied",
  disabled: "Disabled",
  pending: "Pending"
};

function operationsHref(
  base: AppOperationEventOperationsQuery,
  patch: {
    category?: string;
    outcome?: string;
  }
) {
  const params = new URLSearchParams();

  if (patch.category) {
    params.set("category", patch.category);
  }

  if (patch.outcome) {
    params.set("outcome", patch.outcome);
  }

  if (base.search) {
    params.set("referenceType", base.search.referenceType);
    params.set("referenceValue", base.search.referenceValue);
  }

  const queryString = params.toString();

  return queryString ? `/admin/operations?${queryString}` : "/admin/operations";
}

function sinkPillClassName(state: AppOperationEventSinkState) {
  if (state === "ready") {
    return styles.statusPillReady;
  }

  if (state === "temporarily_unavailable" || state === "misconfigured") {
    return styles.statusPillWarning;
  }

  return styles.statusPillMuted;
}

function OperationsFilterLink({
  active,
  activeLabel,
  children,
  href
}: {
  active: boolean;
  activeLabel: string;
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      aria-current={active ? "page" : undefined}
      className={`${styles.operationsFilterLink} ${
        active ? styles.operationsFilterLinkActive : ""
      }`}
      href={href}
    >
      {children}
      {active ? <span className={styles.srOnly}> - {activeLabel}</span> : null}
    </a>
  );
}

function AdminOperationEventsSinkStatus({
  sinkState
}: {
  sinkState: AppOperationEventSinkState;
}) {
  return (
    <section
      aria-label="Operation event sink status"
      className={styles.statusSummaryPanel}
    >
      <div className={styles.statusSummaryHeader}>
        <div>
          <p className={styles.eyebrow}>Operations</p>
          <h2>Operation event sink</h2>
        </div>
        <span className={`${styles.statusPill} ${sinkPillClassName(sinkState)}`}>
          {appOperationEventSinkStateLabel(sinkState)}
        </span>
      </div>
      <p className={styles.statusSummaryCopy}>
        Bounded application operation events are recorded for the trusted
        workspace when the internal event sink is active. This surface shows
        stored public-safe values only; configuration and admission material
        stay out of the admin UI.
      </p>
    </section>
  );
}

function AdminOperationEventsInvalidFilterPanel() {
  return (
    <section
      aria-label="Operation events filter invalid"
      className={styles.unavailablePanel}
    >
      <p className={styles.eyebrow}>Filter not supported</p>
      <h2>Operation events filter is not supported</h2>
      <p>
        The supplied category, outcome or safe-reference search does not match
        the supported values. Filters must use exact allowlisted categories and
        outcomes, or a valid paired request ID or public reference.
      </p>
      <nav
        className={styles.inlineActions}
        aria-label="Operation events filter recovery"
      >
        <a className={styles.primaryButton} href="/admin/operations">
          Clear filters
        </a>
      </nav>
      <AdminWorkspaceRecoveryLinks />
    </section>
  );
}

function AdminOperationEventsEmptyPanel() {
  return (
    <AdminEmptyState
      eyebrow="Operations"
      title="No operation events recorded yet"
      message="No operation events have been recorded yet for the trusted workspace. Recorded edge outcomes appear here once the internal event sink is active."
      icon={emptyStateIcons.log}
    />
  );
}

function AdminOperationEventsLoadedPanel({
  read
}: {
  read: Extract<
    AdminAppOperationEventOperationsReadResult,
    { status: "loaded" }
  >;
}) {
  const { query, records, summary } = read;

  return (
    <section className={styles.managementStack}>
      <section className={styles.rowPanel} aria-label="Operation event filters">
        <div className={styles.panelTitleRow}>
          <div>
            <h2>Filter operation events</h2>
            <p>
              Exact category and outcome filters and paired safe-reference
              search apply to the latest 200 stored events for the trusted
              workspace.
            </p>
          </div>
          <nav
            className={styles.inlineActions}
            aria-label="Operation events filter recovery"
          >
            <a className={styles.secondaryButton} href="/admin/operations">
              Clear filters
            </a>
          </nav>
        </div>
        <div className={styles.operationsFilterStack}>
          <div
            aria-label="Filter by category"
            className={styles.operationsFilterGroup}
            role="group"
          >
            <span className={styles.operationsFilterLabel}>Category</span>
            <div className={styles.operationsFilterLinks}>
              <OperationsFilterLink
                active={!query.category}
                activeLabel="current category filter: all categories"
                href={operationsHref(query, { outcome: query.outcome })}
              >
                All categories
              </OperationsFilterLink>
              {appOperationEventCategories.map((category) => (
                <OperationsFilterLink
                  active={query.category === category}
                  activeLabel={`current category filter: ${operationCategoryLabels[category]}`}
                  href={operationsHref(query, {
                    category,
                    outcome: query.outcome
                  })}
                  key={category}
                >
                  {operationCategoryLabels[category]}
                </OperationsFilterLink>
              ))}
            </div>
          </div>
          <div
            aria-label="Filter by outcome"
            className={styles.operationsFilterGroup}
            role="group"
          >
            <span className={styles.operationsFilterLabel}>Outcome</span>
            <div className={styles.operationsFilterLinks}>
              <OperationsFilterLink
                active={!query.outcome}
                activeLabel="current outcome filter: all outcomes"
                href={operationsHref(query, { category: query.category })}
              >
                All outcomes
              </OperationsFilterLink>
              {appOperationEventOutcomes.map((outcome) => (
                <OperationsFilterLink
                  active={query.outcome === outcome}
                  activeLabel={`current outcome filter: ${operationOutcomeLabels[outcome]}`}
                  href={operationsHref(query, {
                    category: query.category,
                    outcome
                  })}
                  key={outcome}
                >
                  {operationOutcomeLabels[outcome]}
                </OperationsFilterLink>
              ))}
            </div>
          </div>
          <form
            action="/admin/operations"
            aria-label="Search operation events by reference"
            className={styles.operationsSearchForm}
            method="get"
          >
            {query.category ? (
              <input type="hidden" name="category" value={query.category} />
            ) : null}
            {query.outcome ? (
              <input type="hidden" name="outcome" value={query.outcome} />
            ) : null}
            <div className={styles.operationsSearchField}>
              <label htmlFor="operationsReferenceType">Reference type</label>
              <select
                defaultValue={query.search?.referenceType ?? ""}
                id="operationsReferenceType"
                name="referenceType"
                required
              >
                <option value="">Reference type</option>
                <option value="request_id">Request ID</option>
                <option value="public_reference">Public reference</option>
              </select>
            </div>
            <div className={styles.operationsSearchField}>
              <label htmlFor="operationsReferenceValue">Reference value</label>
              <input
                defaultValue={query.search?.referenceValue ?? ""}
                id="operationsReferenceValue"
                maxLength={128}
                name="referenceValue"
                type="text"
                required
              />
            </div>
            <button className={styles.primaryButton} type="submit">
              Search
            </button>
          </form>
        </div>
      </section>

      <section
        aria-label="Derived operation event summary"
        className={styles.metricGridThree}
      >
        <dl className={styles.metricCard}>
          <dt>Events loaded</dt>
          <dd>{summary.total}</dd>
          <p>Latest stored events for the trusted workspace, capped at 200.</p>
        </dl>
        {appOperationEventOutcomes.map((outcome) => (
          <dl className={styles.metricCard} key={outcome}>
            <dt>{operationOutcomeLabels[outcome]}</dt>
            <dd>{summary.byOutcome[outcome]}</dd>
            <p>Outcome count within the loaded events.</p>
          </dl>
        ))}
        {appOperationEventCategories.map((category) => (
          <dl className={styles.metricCard} key={category}>
            <dt>{operationCategoryLabels[category]}</dt>
            <dd>{summary.byCategory[category]}</dd>
            <p>Category count within the loaded events.</p>
          </dl>
        ))}
      </section>

      {records.length === 0 ? (
        <AdminOperationEventsEmptyPanel />
      ) : (
        <section className={styles.tablePanel} aria-label="Operation events review">
          <div className={styles.tableHeader}>
            <h2>Operation events</h2>
          </div>
          <div
            aria-label="Operation events"
            className={`${styles.dataTable} ${styles.operationsTable}`}
            role="table"
          >
            <div role="row">
              <strong role="columnheader">Category</strong>
              <strong role="columnheader">Outcome</strong>
              <strong role="columnheader">Reference</strong>
              <strong role="columnheader">Error code</strong>
              <strong role="columnheader">Route</strong>
              <strong role="columnheader">HTTP</strong>
              <strong role="columnheader">Occurred at</strong>
              <strong role="columnheader">Created at</strong>
              <strong role="columnheader">Actor</strong>
            </div>
            {records.map((record) => (
              <div role="row" key={record.eventId}>
                <span role="cell">
                  {operationCategoryLabels[record.category]}
                </span>
                <span role="cell">
                  {operationOutcomeLabels[record.outcome]}
                </span>
                <span role="cell" title={record.referenceType}>
                  {record.referenceValue ?? "—"}
                </span>
                <span role="cell">{record.errorCode ?? "—"}</span>
                <span role="cell">{record.routeKey}</span>
                <span role="cell">{record.httpStatus ?? "—"}</span>
                <span role="cell">{record.occurredAt}</span>
                <span role="cell">{record.createdAt}</span>
                <span role="cell">
                  {record.actorExists ? "Recorded" : "None"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function AdminOperationEventsReview({
  read,
  sinkState
}: {
  read?: AdminAppOperationEventOperationsReadResult;
  sinkState?: AppOperationEventSinkState;
}) {
  const state = sinkState ?? "disabled";

  return (
    <section
      aria-label="Operation events review"
      className={styles.managementStack}
    >
      <AdminOperationEventsSinkStatus sinkState={state} />
      {read?.status === "loaded" ? (
        <AdminOperationEventsLoadedPanel read={read} />
      ) : read?.status === "invalid_filter" ? (
        <AdminOperationEventsInvalidFilterPanel />
      ) : (
        <AdminUnavailableWorkspace
          title="Operations"
          description="Operation events are temporarily unavailable. The protected operations route remains in place while existing reads recover."
        />
      )}
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
    return <AdminSetupsOperations dashboard={state.dashboard} workspaceId={state.workspaceId} />;
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

  if (view.kind === "operations") {
    return (
      <AdminOperationEventsReview
        read={view.read}
        sinkState={view.sinkState}
      />
    );
  }

  return (
    <AdminOperationsHome
      adminAccess={state.adminAccess}
      dashboard={state.dashboard}
    />
  );
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
