import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import {
  resolveAdminProductDashboardRead,
  type AdminProductDashboardReadResult
} from "../../lib/products/admin-read/admin-product-dashboard-read";
import {
  resolveAdminQuoteRequestInboxRead,
  type AdminQuoteRequestInboxReadResult
} from "../../lib/quote/admin-read/admin-quote-request-dashboard-read";
import {
  resolveAdminQuoteRequestDetailRead,
  type AdminQuoteRequestDetailReadResult
} from "../../lib/quote/admin-read/admin-quote-request-detail-read";
import { getAdminRouteRuntimeConfig } from "../../lib/server-runtime-config";
import { CategoryManagementPanel } from "../../components/admin/category-management-panel";
import { ListingImageMetadataManagementPanel } from "../../components/admin/listing-image-metadata-management-panel";
import { ListingImageUploadPanel } from "../../components/admin/listing-image-upload-panel";
import { ListingManagementPanel } from "../../components/admin/listing-management-panel";
import { QuoteRequestInboxPanel } from "../../components/admin/quote-request-inbox-panel";

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
      quoteInbox: AdminQuoteRequestInboxReadResult;
      quoteDetail?: AdminQuoteRequestDetailReadResult;
    }
  | {
      status: "unavailable";
    };

export type AdminShellView =
  | {
      kind: "overview";
    }
  | {
      kind: "home";
    }
  | {
      kind: "listings";
    }
  | {
      kind: "categories";
    }
  | {
      kind: "media";
    }
  | {
      kind: "quotes";
    }
  | {
      kind: "quote-detail";
      quoteRequestId: string;
    };

type ProtectedAdminShellGateState =
  | Exclude<ProtectedAdminShellState, { status: "authorised_admin" }>
  | {
      status: "authorised_admin";
    };

type ResolveProtectedAdminShellStateOptions = {
  quoteDetailId?: string;
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

export async function resolveProtectedAdminShellState(
  options: ResolveProtectedAdminShellStateOptions = {}
): Promise<ProtectedAdminShellState> {
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

    const [dashboard, quoteInbox, quoteDetail] = await Promise.all([
      resolveAdminProductDashboardRead({
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: trustedServerWorkspaceId
        }
      }),
      resolveAdminQuoteRequestInboxRead({
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: trustedServerWorkspaceId
        }
      }),
      options.quoteDetailId
        ? resolveAdminQuoteRequestDetailRead({
            quoteRequestId: options.quoteDetailId,
            env: {
              ADMIN_TRUSTED_WORKSPACE_ID: trustedServerWorkspaceId
            }
          })
        : Promise.resolve(undefined)
    ]);

    return {
      status: "authorised_admin",
      dashboard,
      quoteInbox,
      ...(quoteDetail ? { quoteDetail } : {})
    };
  } catch {
    return {
      status: "unavailable"
    };
  }
}

function statusLabel(value: string) {
  return value.replace(/_/g, " ");
}

function AdminDashboard({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return (
      <section className="admin-dashboard admin-dashboard--unavailable">
        <h2>Read-only catalogue dashboard</h2>
        <p>Catalogue data is temporarily unavailable.</p>
        <AdminRecoveryLinks />
      </section>
    );
  }

  return (
    <section className="admin-dashboard" aria-label="Read-only catalogue dashboard">
      <div className="admin-dashboard__header">
        <div>
          <p className="eyebrow">Read-only</p>
          <h2>Read-only catalogue dashboard</h2>
          <p>
            View catalogue management data for this workspace. Changes still go
            through backend-only protected routes.
          </p>
        </div>
        <dl className="admin-dashboard__stats" aria-label="Catalogue summary">
          <div>
            <dt>Categories</dt>
            <dd>{dashboard.data.categories.length}</dd>
          </div>
          <div>
            <dt>Furniture listings</dt>
            <dd>{dashboard.data.products.length}</dd>
          </div>
          <div>
            <dt>Listing images</dt>
            <dd>{dashboard.data.imageSummary.totalImages}</dd>
          </div>
        </dl>
      </div>

      <div className="admin-dashboard__grid">
        <section className="admin-dashboard__card">
          <h3>Categories</h3>
          {dashboard.data.categories.length === 0 ? (
            <p>No categories are visible for this workspace.</p>
          ) : (
            <ul className="admin-dashboard__list">
              {dashboard.data.categories.map((category) => (
                <li key={category.id}>
                  <div>
                    <strong>{category.name}</strong>
                    <span>{category.slug}</span>
                  </div>
                  <small>
                    {category.productCount} listings ·{" "}
                    {category.isPublished ? "Published" : "Not published"}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-dashboard__card">
          <h3>Furniture listings</h3>
          {dashboard.data.products.length === 0 ? (
            <p>No furniture listings are visible for this workspace.</p>
          ) : (
            <ul className="admin-dashboard__list">
              {dashboard.data.products.map((product) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>
                      {product.slug} · {statusLabel(product.status)}
                    </span>
                  </div>
                  <small>
                    {product.imageCount} listing image metadata records
                    {product.primaryImageAltText
                      ? ` · Primary alt: ${product.primaryImageAltText}`
                      : ""}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Listing image metadata summary</h3>
          <p>
            {dashboard.data.imageSummary.totalImages} listing image metadata records,
            {" "}
            {dashboard.data.imageSummary.activeImages} active,{" "}
            {dashboard.data.imageSummary.primaryImages} primary.
          </p>
        </section>
      </div>
      <CategoryManagementPanel categories={dashboard.data.categories} />
      <ListingManagementPanel
        categories={dashboard.data.categories}
        products={dashboard.data.products}
      />
      <ListingImageUploadPanel products={dashboard.data.products} />
      <ListingImageMetadataManagementPanel
        images={dashboard.data.images}
        products={dashboard.data.products}
      />
    </section>
  );
}

function AdminRecoveryLinks({
  includeSignIn = false
}: {
  includeSignIn?: boolean;
}) {
  return (
    <nav className="hero__actions" aria-label="Admin recovery">
      {includeSignIn ? (
        <a className="button" href="/admin/login">
          Return to admin sign in
        </a>
      ) : null}
      <a className="button button--secondary" href="/admin">
        Open admin overview
      </a>
      <a className="button button--secondary" href="/admin/listings">
        Open listings
      </a>
      <a className="button button--secondary" href="/admin/categories">
        Open categories
      </a>
      <a className="button button--secondary" href="/admin/media">
        Open media
      </a>
      <a className="button button--secondary" href="/admin/quotes">
        Open quote requests
      </a>
    </nav>
  );
}

function AdminOperationsNavigation() {
  const links = [
    ["Listings", "/admin/listings"],
    ["Categories", "/admin/categories"],
    ["Media", "/admin/media"],
    ["Quote requests", "/admin/quotes"]
  ] as const;

  return (
    <nav className="admin-ops-nav" aria-label="Admin operations">
      <a href="/admin">Overview</a>
      {links.map(([label, href]) => (
        <a href={href} key={href}>
          {label}
        </a>
      ))}
    </nav>
  );
}

function AdminOperationsHome({
  dashboard,
  quoteInbox
}: {
  dashboard: AdminProductDashboardReadResult;
  quoteInbox: AdminQuoteRequestInboxReadResult;
}) {
  const categoryCount =
    dashboard.status === "loaded" ? dashboard.data.categories.length : 0;
  const listingCount =
    dashboard.status === "loaded" ? dashboard.data.products.length : 0;
  const imageCount =
    dashboard.status === "loaded" ? dashboard.data.imageSummary.totalImages : 0;
  const quoteCount =
    quoteInbox.status === "loaded" ? quoteInbox.data.quoteRequests.length : 0;
  const cards = [
    {
      href: "/admin/listings",
      label: "Open listings",
      title: "Listings",
      count: listingCount,
      body: "Create, edit, publish, and archive rental/event furniture listings."
    },
    {
      href: "/admin/categories",
      label: "Open categories",
      title: "Categories",
      count: categoryCount,
      body: "Manage listing categories and publication state."
    },
    {
      href: "/admin/media",
      label: "Open media",
      title: "Listing media",
      count: imageCount,
      body: "Upload approved listing images and maintain image metadata."
    },
    {
      href: "/admin/quotes",
      label: "Open quote requests",
      title: "Quote requests",
      count: quoteCount,
      body: "Review enquiries and record admin-only follow-up notes."
    }
  ];

  return (
    <section className="admin-dashboard" aria-label="Admin operations">
      <div className="admin-dashboard__header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Admin operations</h2>
          <p>
            Use these protected work areas for listing management and quote
            request follow-up.
          </p>
        </div>
      </div>
      <div className="admin-dashboard__grid">
        {cards.map((card) => (
          <article className="admin-dashboard__card" key={card.href}>
            <p className="eyebrow">{card.count} records</p>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <a className="button button--secondary" href={card.href}>
              {card.label}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminListingOperations({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return <AdminDashboard dashboard={dashboard} />;
  }

  return (
    <>
      <section className="admin-dashboard" aria-label="Listing operations">
        <div className="admin-dashboard__header">
          <div>
            <p className="eyebrow">Listings</p>
            <h2>Listing operations</h2>
            <p>
              Review listing metadata by status, then create or update rental
              listing records through the protected write boundary.
            </p>
          </div>
          <dl className="admin-dashboard__stats" aria-label="Listing summary">
            <div>
              <dt>Published</dt>
              <dd>
                {
                  dashboard.data.products.filter(
                    (product) => product.status === "published"
                  ).length
                }
              </dd>
            </div>
            <div>
              <dt>Draft</dt>
              <dd>
                {
                  dashboard.data.products.filter(
                    (product) => product.status === "draft"
                  ).length
                }
              </dd>
            </div>
            <div>
              <dt>Archived</dt>
              <dd>
                {
                  dashboard.data.products.filter(
                    (product) => product.status === "archived"
                  ).length
                }
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <ListingManagementPanel
        categories={dashboard.data.categories}
        products={dashboard.data.products}
      />
    </>
  );
}

function AdminCategoryOperations({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return <AdminDashboard dashboard={dashboard} />;
  }

  return <CategoryManagementPanel categories={dashboard.data.categories} />;
}

function AdminMediaOperations({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return <AdminDashboard dashboard={dashboard} />;
  }

  return (
    <>
      <ListingImageUploadPanel products={dashboard.data.products} />
      <ListingImageMetadataManagementPanel
        images={dashboard.data.images}
        products={dashboard.data.products}
      />
    </>
  );
}

function AdminQuoteDetail({
  quoteDetail
}: {
  quoteDetail?: AdminQuoteRequestDetailReadResult;
}) {
  if (!quoteDetail || quoteDetail.status === "unavailable") {
    return (
      <section className="admin-dashboard admin-dashboard--unavailable">
        <h2>Quote request detail</h2>
        <p>Quote request details are temporarily unavailable.</p>
        <a className="button button--secondary" href="/admin/quotes">
          Back to quote requests
        </a>
      </section>
    );
  }

  if (quoteDetail.status === "not_found") {
    return (
      <section className="admin-dashboard admin-dashboard--unavailable">
        <h2>Quote request detail</h2>
        <p>Quote request details were not found for this workspace.</p>
        <a className="button button--secondary" href="/admin/quotes">
          Back to quote requests
        </a>
      </section>
    );
  }

  return (
    <>
      <section className="admin-dashboard" aria-label="Quote request detail">
        <div className="admin-dashboard__header">
          <div>
            <p className="eyebrow">Quote request detail</p>
            <h2>Quote request detail</h2>
            <p>
              Review the selected enquiry and save admin-only follow-up status
              or internal notes.
            </p>
          </div>
        </div>
      </section>
      <QuoteRequestInboxPanel
        inbox={{
          status: "loaded",
          data: {
            quoteRequests: [quoteDetail.data.quoteRequest]
          }
        }}
      />
    </>
  );
}

function AdminOperationsView({
  state,
  view
}: {
  state: Extract<ProtectedAdminShellState, { status: "authorised_admin" }>;
  view: AdminShellView;
}) {
  if (view.kind === "home") {
    return (
      <AdminOperationsHome
        dashboard={state.dashboard}
        quoteInbox={state.quoteInbox}
      />
    );
  }

  if (view.kind === "listings") {
    return <AdminListingOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "categories") {
    return <AdminCategoryOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "media") {
    return <AdminMediaOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "quotes") {
    return <QuoteRequestInboxPanel inbox={state.quoteInbox} />;
  }

  if (view.kind === "quote-detail") {
    return <AdminQuoteDetail quoteDetail={state.quoteDetail} />;
  }

  return (
    <>
      <AdminDashboard dashboard={state.dashboard} />
      <QuoteRequestInboxPanel inbox={state.quoteInbox} />
    </>
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
      <>
        <h1>Admin sign in required</h1>
        <p>Sign in to continue.</p>
        <a className="button" href="/admin/login">
          Sign in
        </a>
      </>
    );
  }

  if (state.status === "authenticated_not_authorised") {
    return (
      <>
        <h1>Admin access unavailable</h1>
        <p>Your account is authenticated but not authorised for this workspace.</p>
        <AdminRecoveryLinks includeSignIn />
      </>
    );
  }

  if (state.status === "unavailable") {
    return (
      <>
        <h1>Admin access unavailable</h1>
        <p>Admin access is temporarily unavailable.</p>
        <AdminRecoveryLinks includeSignIn />
      </>
    );
  }

  return (
    <>
      <h1>Admin workspace</h1>
      <p>Access is authorised for this admin workspace.</p>
      <form action="/admin/logout" method="post">
        <button className="button" type="submit">
          Sign out
        </button>
      </form>
      <AdminOperationsNavigation />
      <AdminOperationsView state={state} view={view} />
    </>
  );
}

export function AdminShellContent({
  state,
  view = {
    kind: "overview"
  }
}: {
  state: ProtectedAdminShellState;
  view?: AdminShellView;
}) {
  return (
    <section className="section admin-shell" aria-live="polite">
      <div className="admin-shell__panel">
        <p className="eyebrow">Secure admin</p>
        <AdminStatusMessage state={state} view={view} />
      </div>
    </section>
  );
}
