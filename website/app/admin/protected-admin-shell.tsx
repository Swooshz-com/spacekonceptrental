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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <rect x="14" y="14" width="6" height="6" />
    </svg>
  ),
  hero: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  ),
  catalogue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <rect x="14" y="14" width="6" height="6" />
    </svg>
  ),
  setups: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 4 8 5-8 5-8-5 8-5Z" />
      <path d="m4 15 8 5 8-5" />
    </svg>
  ),
  "enquiry-email": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  ),
  "delivery-log": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h11v9H4z" />
      <path d="M15 10h3l2 2.5V16h-5z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  )
};

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
    catalogue: "Manage catalogue items, display position, published status, and listing images.",
    setups: "Review public setup presentation context derived from published catalogue records.",
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
            <span className={styles.navItemInner}>
              <span className={styles.navIcon} aria-hidden="true">
                {adminNavigationIcons[item.kind]}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </span>
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
      <span aria-hidden="true">-&gt;</span>
    </a>
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

  const { products, images, imageSummary } = dashboard.data;
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
    <section className="admin-dashboard" aria-label="Admin dashboard">
      <div className={styles.dashboardHub}>
        <section className={styles.dashboardCard} aria-label="Content status">
          <h3>Content status</h3>
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

        <section className={styles.dashboardCard} aria-label="Attention required">
          <h3>Attention required</h3>
          <ul className={styles.dashboardList}>
            <AdminDashboardCountRow
              label="Missing alt text"
              description="Listings needing accessibility updates."
              tone={missingAltText > 0 ? "attention" : "neutral"}
              value={missingAltText}
            />
            <AdminDashboardCountRow
              label="Missing images"
              description="Listings without media uploaded."
              tone={missingImages > 0 ? "attention" : "neutral"}
              value={missingImages}
            />
            <AdminDashboardCountRow
              label="Media records"
              description="Uploaded catalogue image records."
              value={imageSummary.totalImages}
            />
          </ul>
        </section>

        <section className={styles.dashboardCard} aria-label="Quick links">
          <h3>Quick links</h3>
          <div className={styles.quickLinkGrid}>
            <AdminDashboardQuickLink href="/admin/hero" label="Manage Hero" />
            <AdminDashboardQuickLink
              href="/admin/catalogue"
              label="Manage Catalogue"
            />
            <AdminDashboardQuickLink href="/admin/setups" label="Manage Setups" />
          </div>
        </section>
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
  const categoryOptions = dashboard.data.categories
    .map((category) => category.name)
    .sort((a, b) => a.localeCompare(b));

  return (
    <>
      <section className="admin-dashboard" aria-label="Catalogue management overview">
        <div className={styles.metricGridThree} aria-label="Catalogue summary">
          <AdminMetricCard label="Published" value={published} />
          <AdminMetricCard label="Draft" value={draft} />
          <AdminMetricCard label="Hidden" value={hidden} />
        </div>
      </section>
      <section className={styles.catalogueSaveIntro}>
        <p className="eyebrow">Protected Admin Save</p>
        <h3>Listing management</h3>
        <p>
          Create, update, set visibility, and archive furniture listing metadata
          through the protected admin API. Public-facing fields should describe
          rental/event furniture only.
        </p>
      </section>
      <section className={styles.catalogueFormPanel} aria-label="Create listing">
        <div className={styles.panelHeadingRow}>
          <div>
            <h3>Create listing</h3>
          </div>
        </div>
        <div className={styles.catalogueCreateForm}>
          <div className={styles.visualFormGrid}>
            <label>
              <span>Item name</span>
              <input
                readOnly
                placeholder="Enter item name"
              />
              <small>
                Use owner-supplied rental/event furniture wording only; do not
                add unsupported availability assertions.
              </small>
            </label>
            <div className={styles.visualFormSplit}>
              <label>
                <span>Category</span>
                <select disabled defaultValue="">
                  <option value="">Select category</option>
                  {categoryOptions.map((categoryName) => (
                    <option key={categoryName} value={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Style</span>
                <select disabled defaultValue="">
                  <option value="">Select style</option>
                </select>
              </label>
            </div>
            <label className={styles.visualFormFull}>
              <span>Description</span>
              <textarea
                readOnly
                placeholder="Enter full public description"
              />
              <small>
                Full public description should help enquiry planning without
                self-serve or completion-flow language.
              </small>
            </label>
            <div className={styles.uploadDropzonePreview} aria-label="Listing images">
              <span aria-hidden="true">Upload</span>
              <strong>Upload Listing Images</strong>
              <p>
                Save the listing first, then add real uploaded images through
                the existing protected image workflow.
              </p>
              <button className={styles.adminBtnGhost} disabled type="button">
                Select Files
              </button>
            </div>
            <div className={styles.publishRowPreview}>
              <div>
                <strong>Publish Status</strong>
                <p>Set to active to make visible on the public catalogue.</p>
              </div>
              <label className={styles.switchPreview}>
                <input disabled type="checkbox" />
                <span>Publish listing</span>
              </label>
            </div>
            <button className={styles.adminBtnPrimary} type="button" disabled>
              Create Listing
            </button>
          </div>
        </div>
      </section>
      <section className={styles.catalogueListPanel} aria-label="Existing listings">
        <div className={styles.panelHeadingRow}>
          <div>
            <h3>Existing Listings</h3>
          </div>
        </div>
        {dashboard.data.products.length === 0 ? (
          <p className={styles.tableEmpty}>
            No furniture listings are available to update yet. Create a draft
            listing in the next catalogue owner workflow slice before adding
            media or publishing.
          </p>
        ) : (
          <div className={styles.catalogueItemList}>
            {dashboard.data.products.slice(0, 4).map((product) => (
              <article className={styles.catalogueItemCard} key={product.id}>
                <div className={styles.catalogueItemThumb} aria-hidden="true">
                  {product.imageCount > 0 ? "Image" : "No image"}
                </div>
                <div>
                  <h4>{product.name}</h4>
                  <p>
                    {product.shortDescription ||
                      product.description ||
                      "Owner-managed rental catalogue item."}
                  </p>
                  <span>
                    {product.categoryId
                      ? dashboard.data.categories.find(
                          (category) => category.id === product.categoryId
                        )?.name ?? "Unmapped category"
                      : "Unmapped category"}
                  </span>
                </div>
                <span
                  className={`${styles.statusTag} ${
                    product.status === "published"
                      ? styles.statusTagPublished
                      : styles.statusTagMuted
                  }`}
                >
                  {product.status === "archived" ? "hidden" : product.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
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
    .slice(0, 8);

  return (
    <section className="admin-dashboard" aria-label="Setups management">
      <div className={styles.setupGrid}>
        <section className={styles.setupListPanel}>
          <div className={styles.panelHeadingRow}>
            <div>
              <p className="eyebrow">Setup Items</p>
              <h3>Manage Setups</h3>
            </div>
          </div>
          {setupRecords.length === 0 ? (
            <div className={styles.setupCandidateList}>
              <article className={styles.setupCandidateCard}>
                <div className={styles.setupImageStrip} aria-hidden="true">
                  <span />
                  <span />
                </div>
                <div>
                  <h4>No published setup candidates yet</h4>
                  <p>
                    Public setup cards are currently derived from published
                    catalogue records. Add or publish catalogue content first.
                  </p>
                </div>
                <span className={`${styles.statusTag} ${styles.statusTagMuted}`}>
                  Empty
                </span>
                <footer>
                  <span>Derived context: catalogue records</span>
                  <a href="/admin/catalogue">Manage catalogue</a>
                </footer>
              </article>
              <article className={`${styles.setupCandidateCard} ${styles.setupCandidateCardMuted}`}>
                <div className={styles.setupImageStrip} aria-hidden="true">
                  <span />
                </div>
                <div>
                  <h4>Setup editor deferred</h4>
                  <p>
                    Setup-specific saved records and grouped images need a later
                    owner workflow slice before they can be edited here.
                  </p>
                </div>
                <span className={`${styles.statusTag} ${styles.statusTagMuted}`}>
                  Deferred
                </span>
                <footer>
                  <span>Derived context: pending setup storage</span>
                  <a href="/admin/catalogue">Continue with catalogue</a>
                </footer>
              </article>
            </div>
          ) : (
            <div className={styles.setupCandidateList}>
              {setupRecords.map((product) => (
                <article className={styles.setupCandidateCard} key={product.id}>
                  <div className={styles.setupImageStrip} aria-hidden="true">
                    <span />
                    <span />
                  </div>
                  <div>
                    <h4>{product.name}</h4>
                    <p>
                      {product.shortDescription ||
                        product.description ||
                        "Published catalogue record available for public setup presentation."}
                    </p>
                  </div>
                  <span
                    className={`${styles.statusTag} ${styles.statusTagPublished}`}
                  >
                    Published
                  </span>
                  <footer>
                    <span>
                      Derived context:{" "}
                      {product.categoryId
                        ? categoryById.get(product.categoryId) ?? "Unmapped"
                        : "Unmapped"}
                    </span>
                    <a href={`/listings/${encodeURIComponent(product.slug)}`}>
                      View public listing
                    </a>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className={styles.setupEditorPanel} aria-label="Setup editor status">
          <div className={styles.panelHeadingRow}>
            <div>
              <p className="eyebrow">Setup Editor</p>
              <h3>Create New Setup</h3>
            </div>
          </div>
          <div className={styles.visualFormGrid}>
            <label>
              <span>Setup name</span>
              <input
                disabled
                placeholder="Setup-specific records are deferred"
              />
            </label>
            <label className={styles.visualFormFull}>
              <span>Description</span>
              <textarea
                disabled
                placeholder="Current public setup presentation derives from catalogue records."
              />
            </label>
            <label>
              <span>Context</span>
              <input disabled value="Published catalogue records" />
            </label>
            <div className={styles.uploadPreviewBox}>
              <span>Setup images</span>
              <strong>Deferred</strong>
              <p>
                Setup-specific image grouping needs a later storage and owner
                workflow slice.
              </p>
            </div>
            <label className={styles.publishVisualToggle}>
              <input disabled type="checkbox" />
              <span>Publish setup</span>
            </label>
            <a className={styles.adminBtnPrimary} href="/admin/catalogue">
              Manage catalogue
            </a>
          </div>
        </aside>
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
    <section className={styles.emailGrid} aria-label="Enquiry email handoff status">
      <div className={styles.emailConfigColumn}>
        <div className={styles.statusSummaryPanel}>
          <div className={styles.statusSummaryHeader}>
            <div>
              <p className="eyebrow">Enquiry Email</p>
              <h2>Handoff status</h2>
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
        </div>

        <div className={styles.routingSettingsPanel} aria-label="Environment-managed routing settings">
          <h2>Routing Settings</h2>
          <div className={styles.visualFormGrid}>
            <label>
              <span>Primary recipient email</span>
              <input
                disabled
                placeholder={config.recipientEmail ?? "Configured outside admin"}
                type="email"
              />
              <small>This address receives incoming rental enquiries.</small>
            </label>
            <label>
              <span>CC recipients</span>
              <input disabled placeholder="Environment-managed" type="text" />
              <small>Optional copy recipients are not editable in launch admin.</small>
            </label>
            <label className={styles.publishVisualToggle}>
              <input
                checked={config.providerConfigured && config.recipientConfigured}
                disabled
                type="checkbox"
              />
              <span>Active routing</span>
            </label>
            <button className={styles.adminBtnPrimary} disabled type="button">
              Save configuration
            </button>
          </div>
        </div>
      </div>

      <aside className={styles.templatePreviewPanel} aria-label="Enquiry email template preview">
        <h2>Template Preview</h2>
        <p>
          This is how a standard enquiry will appear in the recipient inbox.
          Private provider tokens are never displayed here.
        </p>
        <div className={styles.templatePreviewBox}>
          <div className={styles.templateHeaderRows}>
            <p>
              <strong>From:</strong> website@spacekoncept.com
            </p>
            <p>
              <strong>Reply-To:</strong> [Enquirer reply address]
            </p>
            <p>
              <strong>Subject:</strong> New Rental Enquiry - [Catalogue Item Name]
            </p>
          </div>
          <p>You have received a new rental enquiry from the website.</p>
          <div className={styles.templateInset}>
            <strong>Enquiry details:</strong>
            <ul>
              <li>Name: [Enquirer name]</li>
              <li>Organisation: [Organisation if supplied]</li>
              <li>Phone: [Phone number]</li>
            </ul>
          </div>
          <div className={styles.templateInset}>
            <strong>Requested items:</strong>
            <ul>
              <li>[Quantity]x [Catalogue item name]</li>
              <li>[Quantity]x [Catalogue item name]</li>
            </ul>
            <p>Event window: [Date range supplied in enquiry]</p>
          </div>
          <p className={styles.templateQuote}>
            "[Message supplied by the enquirer]"
          </p>
        </div>
      </aside>
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

  const usesSidebarMasthead =
    view.kind === "catalogue" ||
    view.kind === "setups" ||
    view.kind === "delivery-log";

  return (
    <div className={styles.workspaceFrame}>
      {!usesSidebarMasthead ? (
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
      ) : null}

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
          {usesSidebarMasthead ? (
            <div className={styles.sidebarMasthead}>
              <h2>SpaceKonceptRental Admin</h2>
              <p>Protected Workspace</p>
            </div>
          ) : null}
          <p className={styles.sidebarLabel}>Workspace</p>
          <AdminOperationsNavigation view={view} />
          {view.kind === "catalogue" ? (
            <div className={styles.sidebarActions}>
              <a className={styles.topbarLink} href="/">
                View public site
              </a>
              <form action="/admin/logout" method="post">
                <button className={styles.signOutButton} type="submit">
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </aside>
        <main className={styles.mainPanel}>
          <section className={styles.pageIntro} aria-label="Admin page header">
            <div className={styles.pageIntroText}>
              <p className="eyebrow">Protected admin</p>
              <h2>{workspaceTitle(view)}</h2>
              <p>{workspaceDescription(view)}</p>
            </div>
            {view.kind === "setups" ? (
              <div className={styles.pageIntroActions} aria-label="Setup actions">
                <a className={styles.adminBtnGhost} href="/admin/catalogue">
                  Manage catalogue
                </a>
                <a className={styles.adminBtnPrimary} href="/listings">
                  View public setups
                </a>
              </div>
            ) : null}
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
  const viewClassNames: Record<AdminNavigationKind, string> = {
    home: styles.viewHome,
    hero: styles.viewHero,
    catalogue: styles.viewCatalogue,
    setups: styles.viewSetups,
    "enquiry-email": styles.viewEnquiryEmail,
    "delivery-log": styles.viewDeliveryLog
  };
  const activeViewClassName = viewClassNames[activeNavigationKind(view)];

  return (
    <section
      aria-live="polite"
      className={`skr-admin-workspace ${styles.workspace} ${activeViewClassName}`}
    >
      <div className="premium-container">
        <AdminStatusMessage state={state} view={view} />
      </div>
    </section>
  );
}
