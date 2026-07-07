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
import { CategoryManagementPanel } from "../../components/admin/category-management-panel";
import { ListingImageMetadataManagementPanel } from "../../components/admin/listing-image-metadata-management-panel";
import { ListingImageUploadPanel } from "../../components/admin/listing-image-upload-panel";
import { ListingManagementPanel } from "../../components/admin/listing-management-panel";
import { HeroContentManagementPanel } from "../../components/admin/hero-content-management-panel";
import type { AdminHomepageHeroReadResult } from "../../lib/hero/admin-homepage-hero-read";
import type { QuoteEnquiryEmailConfigStatus } from "../../lib/quote/email-handoff";
import type { AdminQuoteEmailDeliveryLogReadResult } from "../../lib/quote/admin-read/admin-quote-email-delivery-log";
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

type LoadedAdminDashboard = Extract<
  AdminProductDashboardReadResult,
  { status: "loaded" }
>;
type AdminDashboardProduct = LoadedAdminDashboard["data"]["products"][number];
type AdminDashboardImage = LoadedAdminDashboard["data"]["images"][number];

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
    hero: "Manage the public homepage hero image. Homepage copy stays code-managed.",
    catalogue: "Manage catalogue items, categories, display order, published status, and listing images.",
    setups: "Review the public setups presentation, which derives from published catalogue records on /listings.",
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

function mediaAttentionListingCount(
  products: AdminDashboardProduct[],
  images: AdminDashboardImage[]
) {
  const listingIds = new Set<string>();

  for (const product of products) {
    if (
      product.status !== "archived" &&
      (product.imageCount === 0 || !hasText(product.primaryImageAltText))
    ) {
      listingIds.add(product.id);
    }
  }

  for (const image of images) {
    if (image.status === "active" && !hasText(image.altText)) {
      listingIds.add(image.productId);
    }
  }

  return listingIds.size;
}

function AdminWorkspaceRecoveryLinks() {
  return (
    <nav className={styles.recoveryNav} aria-label="Admin recovery">
      <a className="premium-button premium-button--secondary" href="/admin">
        Open admin overview
      </a>
      <a className="premium-button premium-button--secondary" href="/admin/hero">
        Open hero
      </a>
      <a className="premium-button premium-button--secondary" href="/admin/catalogue">
        Open catalogue
      </a>
      <a className="premium-button premium-button--secondary" href="/admin/setups">
        Open setups
      </a>
      <a className="premium-button premium-button--secondary" href="/admin/enquiry-email">
        Open enquiry email
      </a>
      <a className="premium-button premium-button--secondary" href="/admin/delivery-log">
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
      <a className="premium-button premium-button--primary" href="/admin/login">
        {signInLabel}
      </a>
      <a className="premium-button premium-button--secondary" href="/">
        View public site
      </a>
    </nav>
  );
}

function AdminOperationsNavigation({
  view
}: {
  view: AdminShellView;
}) {
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
            <span className={styles.navLabel}>{item.label}</span>
            <span className={styles.navMeta}>{item.meta}</span>
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
      className="admin-dashboard admin-dashboard--unavailable"
      aria-label={`${title} unavailable`}
    >
      <p className="eyebrow">Temporarily unavailable</p>
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

const emptyStateIcons: Record<"hero" | "mail" | "log", ReactNode> = {
  hero: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="M4 17.5l4.5-4 3.5 3 3.5-3.5 4.5 4.5" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7.5l8.5 6 8.5-6" />
    </svg>
  ),
  log: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </svg>
  )
};

function AdminEmptyState({
  eyebrow,
  title,
  message,
  futureLabel,
  icon
}: {
  eyebrow: string;
  title: string;
  message: string;
  futureLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <section className={styles.emptyStatePanel} aria-label={title}>
      {icon ? (
        <span className={styles.emptyStateIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{message}</p>
      {futureLabel ? (
        <div className={styles.futureControl}>
          <button className={styles.adminBtnGhost} type="button" disabled>
            {futureLabel}
          </button>
          <span className={styles.comingSoonTag}>Coming soon</span>
        </div>
      ) : null}
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

  const { categories, products, images, imageSummary } = dashboard.data;
  const catalogueItemCount = products.length;
  const publishedCount = products.filter(
    (product) => product.status === "published"
  ).length;
  const draftCount = products.filter(
    (product) => product.status === "draft"
  ).length;
  const hiddenCount = products.filter(
    (product) => product.status === "archived"
  ).length;
  const mediaAttention = mediaAttentionListingCount(products, images);
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name])
  );
  const catalogueRows = products.slice(0, 8);

  return (
    <section className="admin-dashboard" aria-label="Admin dashboard">
      <div className={styles.metricGrid} aria-label="Catalogue overview">
        <AdminMetricCard label="Catalogue items" value={catalogueItemCount} />
        <AdminMetricCard label="Published" value={publishedCount} />
        <AdminMetricCard label="Draft" value={draftCount} />
        <AdminMetricCard label="Hidden" value={hiddenCount} />
        <AdminMetricCard label="Media records" value={imageSummary.totalImages} />
      </div>

      <div className={styles.ownerGrid}>
        <section className={styles.workQueue} aria-label="Content status">
          <h3>Content status</h3>
          <ul className={styles.workList}>
            <li>
              <div>
                <strong>Published catalogue</strong>
                <span>Records visible on the public site.</span>
              </div>
              <span className={`${styles.chip} ${styles.chipStable}`}>
                {publishedCount}
              </span>
            </li>
            <li>
              <div>
                <strong>Draft or hidden</strong>
                <span>Records not currently public.</span>
              </div>
              <span className={`${styles.chip} ${styles.chipWarning}`}>
                {draftCount + hiddenCount}
              </span>
            </li>
            <li>
              <div>
                <strong>Media attention</strong>
                <span>Listings missing images or alt text.</span>
              </div>
              <span
                className={`${styles.chip} ${
                  mediaAttention > 0 ? styles.chipWarning : styles.chipStable
                }`}
              >
                {mediaAttention}
              </span>
            </li>
          </ul>
        </section>

        <section className={styles.rowPanel}>
          <h3>Catalogue summary</h3>
          <dl className={styles.adminRows}>
            <div>
              <dt>Categories</dt>
              <dd>{categories.length}</dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd>{catalogueItemCount}</dd>
            </div>
            <div>
              <dt>Media records</dt>
              <dd>{imageSummary.totalImages}</dd>
            </div>
            <div>
              <dt>Setup candidates</dt>
              <dd>{publishedCount}</dd>
            </div>
            <div>
              <dt>Setup source</dt>
              <dd>Published catalogue records</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className={styles.tablePanel} aria-label="Catalogue records">
        <div className={styles.tableHeader}>
          <h3>Catalogue</h3>
          <a className={styles.tableLink} href="/admin/catalogue">
            Manage
          </a>
        </div>
        {catalogueRows.length === 0 ? (
          <p className={styles.tableEmpty}>No catalogue records yet.</p>
        ) : (
          <div className={styles.dataTable} role="table" aria-label="Catalogue records table">
            <div role="row">
              <strong role="columnheader">Name</strong>
              <strong role="columnheader">Category</strong>
              <strong role="columnheader">Status</strong>
              <strong role="columnheader">Images</strong>
            </div>
            {catalogueRows.map((product) => {
              const statusText =
                product.status === "published"
                  ? "Published"
                  : product.status === "draft"
                    ? "Draft"
                    : "Hidden";
              return (
                <div role="row" key={product.id}>
                  <span role="cell">{product.name}</span>
                  <span role="cell">
                    {product.categoryId
                      ? categoryNameById.get(product.categoryId) ?? "Unmapped"
                      : "Unmapped"}
                  </span>
                  <span role="cell">
                    <span
                      className={`${styles.statusTag} ${
                        product.status === "published"
                          ? styles.statusTagPublished
                          : styles.statusTagMuted
                      }`}
                    >
                      {statusText}
                    </span>
                  </span>
                  <span role="cell">{product.imageCount}</span>
                </div>
              );
            })}
          </div>
        )}
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

  return (
    <HeroContentManagementPanel hero={hero.hero} />
  );
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

  const published = dashboard.data.products.filter(
    (product) => product.status === "published"
  ).length;
  const draft = dashboard.data.products.filter(
    (product) => product.status === "draft"
  ).length;
  const hidden = dashboard.data.products.filter(
    (product) => product.status === "archived"
  ).length;

  return (
    <>
      <section className="admin-dashboard" aria-label="Catalogue management">
        <dl className="admin-dashboard__stats" aria-label="Catalogue summary">
          <div>
            <dt>Published</dt>
            <dd>{published}</dd>
          </div>
          <div>
            <dt>Draft</dt>
            <dd>{draft}</dd>
          </div>
          <div>
            <dt>Hidden</dt>
            <dd>{hidden}</dd>
          </div>
        </dl>
      </section>
      <ListingManagementPanel
        categories={dashboard.data.categories}
        products={dashboard.data.products}
      />
      <CategoryManagementPanel categories={dashboard.data.categories} />
      <ListingImageUploadPanel products={dashboard.data.products} />
      <ListingImageMetadataManagementPanel
        images={dashboard.data.images}
        products={dashboard.data.products}
      />
    </>
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
    <section className="admin-dashboard" aria-label="Setups management">
      <div className={styles.settingsGrid}>
        <section className={styles.placeholderPanel}>
          <h3>Current setup source</h3>
          <p>
            Public setups stay on <code>/listings</code> and currently derive
            from published catalogue records ({setupRecords.length} shown). Edit
            them through Catalogue until setup-specific storage exists.
          </p>
          <nav className={styles.inlineActions} aria-label="Setup actions">
            <a className={styles.adminBtnGhost} href="/admin/catalogue">
              Manage catalogue
            </a>
            <a className={styles.adminBtnGhost} href="/listings">
              View public setups
            </a>
          </nav>
        </section>

        <section className={styles.rowPanel}>
          <h3>Published setup candidates</h3>
          {setupRecords.length === 0 ? (
            <p className={styles.tableEmpty}>
              No published catalogue records are available to derive public
              setup cards yet.
            </p>
          ) : (
            <div className={styles.compactTable} role="table" aria-label="Setup candidates">
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
      </div>
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
    <section className={styles.statusSummaryPanel} aria-label="Enquiry email handoff status">
      <div className={styles.statusSummaryHeader}>
        <div>
          <p className="eyebrow">Enquiry Email</p>
          <h2>Enquiry email handoff status</h2>
        </div>
        <span className={`${styles.statusPill} ${statusClassName}`}>
          {statusLabel}
        </span>
      </div>
      <p className={styles.statusSummaryCopy}>
        Quote requests are emailed to the configured recipient for manual
        follow-up. Settings are environment-managed for now, with no internal
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
        <a className={styles.adminBtnGhost} href="/admin/delivery-log">
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
        <h3>Email delivery log</h3>
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
            <span role="cell">{record.publicReference || record.quoteRequestId}</span>
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
        <p className="eyebrow">Protected admin</p>
        <h1>Admin sign in required</h1>
        <p>Sign in to continue to SpaceKonceptRental Admin.</p>
        <AdminAccessRecoveryLinks signInLabel="Sign in" />
      </div>
    );
  }

  if (state.status === "authenticated_not_authorised") {
    return (
      <div className={`${styles.statusCard} ${styles.statusPanel} ${styles.statusPanelDenied}`}>
        <p className="eyebrow">Protected admin</p>
        <h1>Access denied</h1>
        <p>Your account is signed in but not authorised for SpaceKonceptRental Admin.</p>
        <AdminAccessRecoveryLinks />
      </div>
    );
  }

  if (state.status === "unavailable") {
    return (
      <div className={`${styles.statusCard} ${styles.statusPanel}`}>
        <p className="eyebrow">Protected admin</p>
        <h1>Admin access unavailable</h1>
        <p>Admin access is temporarily unavailable. Please try again shortly.</p>
        <AdminAccessRecoveryLinks />
      </div>
    );
  }

  return (
    <div className={styles.workspaceFrame}>
      <header className={styles.topbar}>
        <div className={styles.brandCluster}>
          <div className={styles.brandLine}>
            <h1 className={styles.brandTitle}>SpaceKonceptRental Admin</h1>
            <span className={styles.workspaceBadge}>Protected admin</span>
          </div>
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
          <p className={styles.sidebarLabel}>SpaceKonceptRental Admin</p>
          <AdminOperationsNavigation view={view} />
        </aside>
        <main className={styles.mainPanel}>
          <section className={styles.pageIntro} aria-label="Admin page header">
            <p className="eyebrow">Protected admin</p>
            <h2>{workspaceTitle(view)}</h2>
            <p>{workspaceDescription(view)}</p>
          </section>
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
      <div className="premium-container">
        <AdminStatusMessage state={state} view={view} />
      </div>
    </section>
  );
}
