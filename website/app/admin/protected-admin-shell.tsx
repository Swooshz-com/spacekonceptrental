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
    meta: "Public /listings"
  },
  {
    kind: "enquiry-email",
    href: "/admin/enquiry-email",
    label: "Enquiry Email",
    meta: "Recipient"
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
    home: "Manage public website content: hero image, catalogue records, setup presentation, enquiry recipient, and delivery visibility.",
    hero: "Manage the public homepage hero image reference.",
    catalogue:
      "Manage rental catalogue items shown on the public site.",
    setups:
      "Review the public setups presentation, which derives from published catalogue records on /listings.",
    "enquiry-email": "Check the quote enquiry email handoff status.",
    "delivery-log": "Review technical enquiry email delivery attempts."
  };

  return descriptions[activeNavigationKind(view)];
}

function quoteEmailSetupIssueLabel(reason?: string) {
  const labels: Record<string, string> = {
    email_provider_api_key_not_configured: "Provider API key missing",
    email_provider_not_configured: "Provider not configured",
    email_provider_unsupported: "Unsupported provider",
    email_recipient_not_configured: "Recipient not configured",
    email_from_not_configured: "From address not configured"
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
  const setupRecords = dashboard.data.products
    .filter((product) => product.status === "published")
    .slice(0, 5);

  return (
    <section className={styles.settingsGrid} aria-label="Setups management">
      <section className={styles.placeholderPanel}>
        <h2>Current setup source</h2>
        <p>
          Public setups stay on <code>/listings</code> and currently derive
          from published catalogue records ({setupRecords.length} shown). Edit
          them through Catalogue until setup-specific storage exists.
        </p>
        <nav className={styles.inlineActions} aria-label="Setup actions">
          <a className={styles.secondaryButton} href="/admin/catalogue">
            Manage catalogue
          </a>
          <a className={styles.secondaryButton} href="/listings">
            View public setups
          </a>
        </nav>
      </section>

      <section className={styles.rowPanel}>
        <h2>Published setup candidates</h2>
        {setupRecords.length === 0 ? (
          <p className={styles.tableEmpty}>
            No published catalogue records are available to derive public setup
            cards yet.
          </p>
        ) : (
          <div
            className={styles.compactTable}
            role="table"
            aria-label="Setup candidates"
          >
            <div role="row">
              <strong role="columnheader">Name</strong>
              <strong role="columnheader">Category</strong>
              <strong role="columnheader">Order</strong>
            </div>
            {setupRecords.map((product) => (
              <div role="row" key={product.id}>
                <span role="cell">{product.name}</span>
                <span role="cell">
                  {product.categoryId
                    ? categoryById.get(product.categoryId) ?? "Unmapped"
                    : "Unmapped"}
                </span>
                <span role="cell">{product.sortOrder}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function AdminEnquiryEmailStatusOperations({
  config = {
    provider: "resend",
    providerConfigured: false,
    recipientConfigured: false
  }
}: {
  config?: QuoteEnquiryEmailConfigStatus;
}) {
  const providerStatus = config.providerConfigured
    ? "Provider configured"
    : "Provider not configured";
  const recipientStatus = config.recipientConfigured
    ? "Recipient configured"
    : "Recipient not configured";
  const setupIssue = quoteEmailSetupIssueLabel(config.missingReason);
  const statusLabel =
    config.providerConfigured && config.recipientConfigured
      ? "Ready"
      : config.missingReason === "email_provider_unsupported"
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
        Quote requests are emailed to the configured recipient for manual
        follow-up. Email routing is environment-managed for now, with no internal
        quote inbox.
      </p>
      <dl className={styles.adminRows}>
        <div>
          <dt>Provider</dt>
          <dd>{providerStatus}</dd>
        </div>
        <div>
          <dt>Recipient</dt>
          <dd>{recipientStatus}</dd>
        </div>
        <div>
          <dt>Provider name</dt>
          <dd>{config.provider}</dd>
        </div>
        {config.recipientEmail ? (
          <div>
            <dt>Recipient email</dt>
            <dd>{config.recipientEmail}</dd>
          </div>
        ) : null}
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
        title="Email delivery log"
        message="No enquiry email delivery attempts have been recorded yet."
        icon={emptyStateIcons.log}
      />
    );
  }

  return (
    <section className={styles.tablePanel} aria-label="Email delivery log">
      <div className={styles.tableHeader}>
        <h2>Email delivery log</h2>
      </div>
      <div
        className={styles.dataTable}
        role="table"
        aria-label="Email delivery attempts"
      >
        <div role="row">
          <strong role="columnheader">Attempted</strong>
          <strong role="columnheader">Reference</strong>
          <strong role="columnheader">Recipient</strong>
          <strong role="columnheader">Status</strong>
          <strong role="columnheader">Provider result</strong>
        </div>
        {deliveryLog.records.map((record) => (
          <div role="row" key={record.id}>
            <span role="cell">{record.attemptedAt}</span>
            <span role="cell">
              {record.publicReference || record.quoteRequestId}
            </span>
            <span role="cell">{record.recipientEmail}</span>
            <span role="cell">
              <span
                className={`${styles.statusTag} ${
                  record.deliveryStatus === "sent"
                    ? styles.statusTagPublished
                    : styles.statusTagMuted
                }`}
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
    return <AdminEnquiryEmailStatusOperations config={view.config} />;
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
