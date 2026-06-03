import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveServerAdminRuntimeRouteGateAdapter } from "../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import { resolveAdminProductDashboardRead } from "../../lib/products/admin-read/admin-product-dashboard-read";
import { resolveAdminQuoteRequestInboxRead } from "../../lib/quote/admin-read/admin-quote-request-dashboard-read";
import {
  AdminShellContent,
  resolveProtectedAdminShellState
} from "./protected-admin-shell";

vi.mock("../../lib/admin/authorization/server-admin-runtime-route-gate-adapter", () => ({
  resolveServerAdminRuntimeRouteGateAdapter: vi.fn()
}));
vi.mock("../../lib/products/admin-read/admin-product-dashboard-read", () => ({
  resolveAdminProductDashboardRead: vi.fn()
}));
vi.mock("../../lib/quote/admin-read/admin-quote-request-dashboard-read", () => ({
  resolveAdminQuoteRequestInboxRead: vi.fn()
}));

describe("protected admin shell", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    delete process.env.ADMIN_EXPECTED_ORIGIN;
    delete process.env.ADMIN_EXPECTED_HOST;
    delete process.env.ADMIN_TRUSTED_WORKSPACE_ID;
  });

  it("uses the approved route-gate adapter for admin shell access", async () => {
    process.env.ADMIN_EXPECTED_ORIGIN = "https://space.example";
    process.env.ADMIN_EXPECTED_HOST = "space.example";
    process.env.ADMIN_TRUSTED_WORKSPACE_ID = "workspace-admin";

    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-secret"
    });

    vi.mocked(resolveAdminProductDashboardRead).mockResolvedValueOnce({
      status: "loaded",
      data: {
        categories: [],
        products: [],
        imageSummary: {
          totalImages: 0,
          activeImages: 0,
          primaryImages: 0
        }
      }
    });
    vi.mocked(resolveAdminQuoteRequestInboxRead).mockResolvedValueOnce({
      status: "loaded",
      data: {
        quoteRequests: []
      }
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "authorised_admin",
      dashboard: {
        status: "loaded",
        data: {
          categories: [],
          products: [],
          imageSummary: {
            totalImages: 0,
            activeImages: 0,
            primaryImages: 0
          }
        }
      },
      quoteInbox: {
        status: "loaded",
        data: {
          quoteRequests: []
        }
      }
    });

    expect(resolveServerAdminRuntimeRouteGateAdapter).toHaveBeenCalledWith(
      {
        requestedOperation: "admin.shell.access",
        requestMethod: "GET"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://space.example",
          expectedHost: "space.example"
        },
        gate: {
          decision: {
            workspace: {
              trustedServerWorkspaceId: "workspace-admin"
            }
          }
        }
      }
    );
    expect(resolveAdminProductDashboardRead).toHaveBeenCalledWith({
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: "workspace-admin"
      }
    });
    expect(resolveAdminQuoteRequestInboxRead).toHaveBeenCalledWith({
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID: "workspace-admin"
      }
    });
  });

  it("maps unauthenticated users to a safe login-required state", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: false,
      reason: "unauthenticated",
      statusCode: 401
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "unauthenticated"
    });
    expect(resolveAdminProductDashboardRead).not.toHaveBeenCalled();
    expect(resolveAdminQuoteRequestInboxRead).not.toHaveBeenCalled();
  });

  it("maps authenticated viewers to a safe not-authorised state", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: false,
      reason: "role_not_allowed",
      statusCode: 403
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "authenticated_not_authorised"
    });
    expect(resolveAdminProductDashboardRead).not.toHaveBeenCalled();
    expect(resolveAdminQuoteRequestInboxRead).not.toHaveBeenCalled();
  });

  it("maps request-security denials to a generic unavailable state", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: false,
      reason: "origin_missing",
      statusCode: 400
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "unavailable"
    });
    expect(resolveAdminProductDashboardRead).not.toHaveBeenCalled();
    expect(resolveAdminQuoteRequestInboxRead).not.toHaveBeenCalled();
  });

  it("maps missing env or dependency failures to a safe unavailable state", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: false,
      reason: "admin_authorization_gate_unavailable",
      statusCode: 503
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "unavailable"
    });
    expect(resolveAdminProductDashboardRead).not.toHaveBeenCalled();
    expect(resolveAdminQuoteRequestInboxRead).not.toHaveBeenCalled();
  });

  it("keeps authorised admins in a safe state when dashboard reads are unavailable", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-secret"
    });
    vi.mocked(resolveAdminProductDashboardRead).mockResolvedValueOnce({
      status: "unavailable"
    });
    vi.mocked(resolveAdminQuoteRequestInboxRead).mockResolvedValueOnce({
      status: "loaded",
      data: {
        quoteRequests: []
      }
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "authorised_admin",
      dashboard: {
        status: "unavailable"
      },
      quoteInbox: {
        status: "loaded",
        data: {
          quoteRequests: []
        }
      }
    });
  });

  it("renders safe dashboard data with category/listing controls and the quote status inbox", () => {
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "loaded",
            data: {
              categories: [
                {
                  id: "category-1",
                  slug: "lounge",
                  name: "Lounge",
                  sortOrder: 20,
                  isPublished: true,
                  productCount: 1
                }
              ],
              products: [
                {
                  id: "product-1",
                  categoryId: "category-1",
                  slug: "modular-lounge",
                  name: "Modular Lounge",
                  rentalUnit: "set",
                  status: "draft",
                  sortOrder: 10,
                  imageCount: 2,
                  primaryImageAltText: "Lounge set"
                }
              ],
              imageSummary: {
                totalImages: 2,
                activeImages: 2,
                primaryImages: 1
              }
            }
          },
          quoteInbox: {
            status: "loaded",
            data: {
              quoteRequests: [
                {
                  id: "quote-1",
                  publicReference: "QR-20260603-NEWEST",
                  customerName: "Maya Tan",
                  customerEmail: "maya@example.test",
                  customerPhone: "+65 8123 4567",
                  eventDate: "2026-06-20",
                  venue: "Marina Bay Sands",
                  status: "new",
                  source: "website",
                  createdAt: "2026-06-03T10:30:00.000Z",
                  items: [
                    {
                      id: "item-1",
                      quoteRequestId: "quote-1",
                      productNameSnapshot: "Modular lounge set",
                      quantity: 2,
                      notes: "VIP reception area",
                      createdAt: "2026-06-03T10:31:00.000Z"
                    }
                  ]
                }
              ]
            }
          }
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: /admin workspace/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /read-only catalogue dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Lounge").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Modular Lounge").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/2 listing image metadata records/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create category/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save category lounge/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archive category lounge/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create listing/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save listing modular lounge/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /publish listing modular lounge/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archive listing modular lounge/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /quote request inbox/i })
    ).toBeInTheDocument();
    expect(screen.getByText("QR-20260603-NEWEST")).toBeInTheDocument();
    expect(screen.getByText("Maya Tan")).toBeInTheDocument();
    expect(screen.getByText("maya@example.test")).toBeInTheDocument();
    expect(screen.getByText("+65 8123 4567")).toBeInTheDocument();
    expect(screen.getByText("2026-06-20")).toBeInTheDocument();
    expect(screen.getByText("Marina Bay Sands")).toBeInTheDocument();
    expect(screen.getByText("new - website")).toBeInTheDocument();
    expect(screen.getByText(/2 x Modular lounge set/i)).toBeInTheDocument();
    expect(screen.getByText(/VIP reception area/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /save status for QR-20260603-NEWEST/i
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: /create product|edit product|archive product|publish product|product image/i
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /notify|email|send|crm|checkout|payment|book|reserve/i
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/image upload|storage path/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/product editor/i)).not.toBeInTheDocument();
  });

  it("does not render category write controls outside loaded authorised dashboard state", () => {
    const blockedStates = [
      {
        status: "unauthenticated" as const
      },
      {
        status: "authenticated_not_authorised" as const
      },
      {
        status: "unavailable" as const
      },
      {
        status: "authorised_admin" as const,
        dashboard: {
          status: "unavailable" as const
        },
        quoteInbox: {
          status: "unavailable" as const
        }
      }
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} />);

      expect(
        screen.queryByRole("button", { name: /create category/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /create listing/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/category management/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/listing management/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /save status/i })
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("renders a safe dashboard unavailable state without provider details", () => {
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "unavailable"
          },
          quoteInbox: {
            status: "unavailable"
          }
        }}
      />
    );

    expect(screen.getByText(/catalogue data is temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/sql/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
  });

  it("renders an empty quote request inbox state for authorised admins", () => {
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "unavailable"
          },
          quoteInbox: {
            status: "loaded",
            data: {
              quoteRequests: []
            }
          }
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: /quote request inbox/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/no quote requests are visible yet/i)).toBeInTheDocument();
  });

  it("renders a generic quote request unavailable state without provider details", () => {
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "unavailable"
          },
          quoteInbox: {
            status: "unavailable"
          }
        }}
      />
    );

    expect(
      screen.getByText(/quote requests are temporarily unavailable/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/sql/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
  });
});
