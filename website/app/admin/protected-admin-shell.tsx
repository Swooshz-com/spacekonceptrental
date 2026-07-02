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
    }
  | {
      kind: "catalogue";
    }
  | {
      kind: "setups";
    }
  | {
      kind: "enquiry-email";
    }
  | {
      kind: "delivery-log";
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
    hero: "Replace the public homepage hero image.",
    catalogue: "Manage catalogue items, categories, display order, published status, and listing images.",
    setups: "Review the public setups presentation, which derives from published catalogue records on /listings.",
    "enquiry-email": "Set where quote enquiries are emailed once the email handoff is added.",
    "delivery-log": "Review enquiry email delivery attempts once delivery logging exists."
  };

  return descriptions[activeNavigationKind(view)];
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

function AdminRecoveryLinks({
  includeSignIn = false
}: {
  includeSignIn?: boolean;
}) {
  return (
    <nav className={styles.recoveryNav} aria-label="Admin recovery">
      {includeSignIn ? (
        <a className="premium-button premium-button--primary" href="/admin/login">
          Return to admin sign in
        </a>
      ) : null}
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

function AdminOperationsNavigation({
  view
}: {
  view: AdminShellView;
}) {
  const activeKind = activeNavigationKind(view);
  return (
    <nav className={styles.navList} aria-label="Admin workspace sections">
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
      className={`${styles.emptyState} admin-dashboard admin-dashboard--unavailable`}
      aria-label={`${title} unavailable`}
    >
      <p className="eyebrow">Temporarily unavailable</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <AdminRecoveryLinks />
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

function AdminEmptyState({
  eyebrow,
  title,
  message,
  futureLabel
}: {
  eyebrow: string;
  title: string;
  message: string;
  futureLabel?: string;
}) {
  return (
    <section className={styles.emptyStatePanel} aria-label={title}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{message}</p>
      {futureLabel ? (
        <div className={styles.futureControl}>
          <button className="button button--secondary" type="button" disabled>
            {futureLabel}
          </button>
          <span>Available once backend support is added.</span>
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
    </section>
  );
}

function AdminHeroOperations() {
  return (
    <AdminEmptyState
      eyebrow="Hero"
      title="Homepage hero image"
      message="Hero image management is not set up yet. Replacing the public homepage hero here needs protected image storage, which is not part of this release."
      futureLabel="Replace hero image"
    />
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
      <div className="admin-dashboard__header">
        <div>
          <p className="eyebrow">Setups</p>
          <h2>Setups management</h2>
          <p>
            Public setup pages remain on /listings. The current implementation
            derives setup cards from published catalogue records, so edits still
            happen through Catalogue until setup-specific storage exists.
          </p>
        </div>
        <dl className="admin-dashboard__stats" aria-label="Setups summary">
          <div>
            <dt>Derived setups</dt>
            <dd>{setupRecords.length}</dd>
          </div>
          <div>
            <dt>Public route</dt>
            <dd>/listings</dd>
          </div>
        </dl>
      </div>

      <div className={styles.settingsGrid}>
        <section className={styles.placeholderPanel}>
          <h3>Current setup source</h3>
          <p>Setup cards currently come from published catalogue records.</p>
          <nav className="hero__actions" aria-label="Setup actions">
            <a className="button button--secondary" href="/admin/catalogue">
              Manage catalogue
            </a>
            <a className="button button--secondary" href="/listings">
              View public setups
            </a>
          </nav>
        </section>

        <section className="admin-dashboard__card">
          <h3>Published setup candidates</h3>
          {setupRecords.length === 0 ? (
            <p>
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

function AdminEnquiryEmailOperations() {
  return (
    <AdminEmptyState
      eyebrow="Enquiry Email"
      title="Enquiry email recipient"
      message="Not configured yet. Quote enquiries will be emailed to the recipient set here once the email handoff is added. SpaceKonceptRental sends enquiries by email and has no internal quote inbox."
      futureLabel="Set recipient"
    />
  );
}

function AdminDeliveryLogOperations() {
  return (
    <AdminEmptyState
      eyebrow="Delivery Log"
      title="Email delivery log"
      message="No delivery records yet. Sent and failed enquiry emails — with provider id and a safe error reference — will be listed here once delivery logging exists."
    />
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
    return <AdminHeroOperations />;
  }

  if (view.kind === "catalogue") {
    return <AdminCatalogueOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "setups") {
    return <AdminSetupsOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "enquiry-email") {
    return <AdminEnquiryEmailOperations />;
  }

  if (view.kind === "delivery-log") {
    return <AdminDeliveryLogOperations />;
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
        <p>Sign in to continue to the protected workspace.</p>
        <a className="premium-button premium-button--primary" href="/admin/login">
          Sign in
        </a>
      </div>
    );
  }

  if (state.status === "authenticated_not_authorised") {
    return (
      <div className={`${styles.statusCard} ${styles.statusPanel} ${styles.statusPanelDenied}`}>
        <p className="eyebrow">Protected admin</p>
        <h1>Access denied</h1>
        <p>Your account is signed in but not authorised for this workspace.</p>
        <AdminRecoveryLinks includeSignIn />
      </div>
    );
  }

  if (state.status === "unavailable") {
    return (
      <div className={`${styles.statusCard} ${styles.statusPanel}`}>
        <p className="eyebrow">Protected admin</p>
        <h1>Admin access unavailable</h1>
        <p>Admin access is temporarily unavailable. Please try again shortly.</p>
        <AdminRecoveryLinks includeSignIn />
      </div>
    );
  }

  return (
    <div className={styles.workspaceFrame}>
      <header className={styles.topbar}>
        <div className={styles.brandCluster}>
          <div className={styles.brandLine}>
            <h1 className={styles.brandTitle}>SpaceKonceptRental Admin</h1>
            <span className={styles.workspaceBadge}>Protected workspace</span>
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
          <p className={styles.sidebarLabel}>Workspace</p>
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
