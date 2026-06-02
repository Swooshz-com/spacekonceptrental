import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import {
  resolveAdminProductDashboardRead,
  type AdminProductDashboardReadResult
} from "../../lib/products/admin-read/admin-product-dashboard-read";
import { CategoryManagementPanel } from "../../components/admin/category-management-panel";

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

type ProtectedAdminShellGateState =
  | Exclude<ProtectedAdminShellState, { status: "authorised_admin" }>
  | {
      status: "authorised_admin";
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

  if (result.statusCode === 503) {
    return {
      status: "unavailable"
    };
  }

  return {
    status: "authenticated_not_authorised"
  };
}

export async function resolveProtectedAdminShellState(): Promise<ProtectedAdminShellState> {
  const trustedServerWorkspaceId = process.env.ADMIN_TRUSTED_WORKSPACE_ID ?? null;

  try {
    const result = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "admin.shell.access",
        requestMethod: "GET"
      },
      {
        requestMetadata: {
          expectedOrigin: process.env.ADMIN_EXPECTED_ORIGIN ?? null,
          expectedHost: process.env.ADMIN_EXPECTED_HOST ?? null
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

    return {
      status: "authorised_admin",
      dashboard: await resolveAdminProductDashboardRead({
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: trustedServerWorkspaceId
        }
      })
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
            <dt>Products</dt>
            <dd>{dashboard.data.products.length}</dd>
          </div>
          <div>
            <dt>Images</dt>
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
                    {category.productCount} products ·{" "}
                    {category.isPublished ? "Published" : "Not published"}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-dashboard__card">
          <h3>Products</h3>
          {dashboard.data.products.length === 0 ? (
            <p>No products are visible for this workspace.</p>
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
                    {product.imageCount} image metadata records
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
          <h3>Image metadata summary</h3>
          <p>
            {dashboard.data.imageSummary.totalImages} image metadata records,
            {" "}
            {dashboard.data.imageSummary.activeImages} active,{" "}
            {dashboard.data.imageSummary.primaryImages} primary.
          </p>
        </section>
      </div>
      <CategoryManagementPanel categories={dashboard.data.categories} />
    </section>
  );
}

function AdminStatusMessage({ state }: { state: ProtectedAdminShellState }) {
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
      </>
    );
  }

  if (state.status === "unavailable") {
    return (
      <>
        <h1>Admin access unavailable</h1>
        <p>Admin access is temporarily unavailable.</p>
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
      <AdminDashboard dashboard={state.dashboard} />
    </>
  );
}

export function AdminShellContent({
  state
}: {
  state: ProtectedAdminShellState;
}) {
  return (
    <section className="section admin-shell" aria-live="polite">
      <div className="admin-shell__panel">
        <p className="eyebrow">Secure admin</p>
        <AdminStatusMessage state={state} />
      </div>
    </section>
  );
}
