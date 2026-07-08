import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveServerAdminRuntimeRouteGateAdapter } from "../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import { resolveAdminProductDashboardRead } from "../../lib/products/admin-read/admin-product-dashboard-read";
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

const repoRoot = process.cwd();

function readAppFile(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

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
    process.env.ADMIN_TRUSTED_WORKSPACE_ID =
      "99999999-9999-4999-8999-999999999999";

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
        images: [],
        imageSummary: {
          totalImages: 0,
          activeImages: 0,
          primaryImages: 0
        }
      }
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "authorised_admin",
      dashboard: {
        status: "loaded",
        data: {
          categories: [],
          products: [],
          images: [],
          imageSummary: {
            totalImages: 0,
            activeImages: 0,
            primaryImages: 0
          }
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
              trustedServerWorkspaceId:
                "99999999-9999-4999-8999-999999999999"
            }
          }
        }
      }
    );
    expect(resolveAdminProductDashboardRead).toHaveBeenCalledWith({
      env: {
        ADMIN_TRUSTED_WORKSPACE_ID:
          "99999999-9999-4999-8999-999999999999"
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

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "authorised_admin",
      dashboard: {
        status: "unavailable"
      }
    });
  });

  it("renders the compact six-page dashboard without quote CRM controls", () => {
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
                  productCount: 1,
                  publishedProductCount: 0
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
              images: [
                {
                  id: "image-1",
                  productId: "product-1",
                  storageBucket: "catalogue-metadata",
                  storagePath: "fixtures/lounge-main.jpg",
                  altText: "Lounge set",
                  sortOrder: 1,
                  isPrimary: true,
                  status: "active"
                }
              ],
              imageSummary: {
                totalImages: 2,
                activeImages: 2,
                primaryImages: 1
              }
            }
          }
        }}
      />
    );

    expect(
      screen.getAllByRole("heading", { name: /spacekonceptrental admin/i })
        .length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/protected admin/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/admin menu - dashboard/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: /^dashboard$/i }).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/^published$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^draft$/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /content status/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /attention required/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /quick links/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /spacekonceptrental admin dashboard/i
      })
    ).toHaveAttribute("href", "/admin");
    expect(screen.getByText(/missing alt text/i)).toBeInTheDocument();
    expect(screen.getByText(/missing images/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /^hero/i })[0]
    ).toHaveAttribute("href", "/admin/hero");
    expect(
      screen.getAllByRole("link", { name: /^catalogue/i })[0]
    ).toHaveAttribute("href", "/admin/catalogue");
    expect(
      screen.getAllByRole("link", { name: /^setups/i })[0]
    ).toHaveAttribute("href", "/admin/setups");
    expect(
      screen.getAllByRole("link", { name: /enquiry email/i })[0]
    ).toHaveAttribute("href", "/admin/enquiry-email");
    expect(
      screen.getAllByRole("link", { name: /delivery log/i })[0]
    ).toHaveAttribute("href", "/admin/delivery-log");
    expect(
      screen.getByRole("link", { name: /view public site/i })
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /quote inbox/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("QR-20260603-NEWEST")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save category metadata/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save listing metadata/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save image metadata/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: new RegExp("notify|email|send|check" + "out|pay" + "ment|book|reserve", "i")
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i)
    ).not.toBeInTheDocument();
  }, 15000);

  it("renders the owner-friendly Catalogue workflow without raw image path controls", () => {
    render(
      <AdminShellContent
        view={{ kind: "catalogue" }}
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
                  productCount: 1,
                  publishedProductCount: 0
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
              images: [
                {
                  id: "image-1",
                  productId: "product-1",
                  storageBucket: "catalogue-metadata",
                  storagePath: "fixtures/lounge-main.jpg",
                  altText: "Lounge set",
                  sortOrder: 1,
                  isPrimary: true,
                  status: "active"
                }
              ],
              imageSummary: {
                totalImages: 2,
                activeImages: 2,
                primaryImages: 1
              }
            }
          }
        }}
      />
    );

    expect(
      screen.getAllByRole("heading", { name: /^catalogue$/i }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/manage rental catalogue items shown on the public site/i)
        .length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /add catalogue item/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view public catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(screen.getByLabelText(/search item name/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^public status$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/^category$/i).length).toBeGreaterThan(0);

    const catalogueCard = screen.getByRole("article", {
      name: /catalogue item modular lounge/i
    });

    expect(catalogueCard).toHaveTextContent(/modular lounge/i);
    expect(catalogueCard).toHaveTextContent(/lounge/i);
    expect(catalogueCard).toHaveTextContent(/draft/i);
    expect(catalogueCard).toHaveTextContent(/image ready/i);
    expect(
      screen.getByRole("region", { name: /catalogue item editor/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save catalogue item/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload listing image for review/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save image metadata/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/categories are derived from catalogue item assignments/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/advanced category details/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save category metadata/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create category|new category|create tag|new tag/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^style$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^context$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/new image path/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/image path/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/image bucket/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fixtures\/lounge-main\.jpg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/catalogue-metadata/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="url"]')).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: new RegExp("check" + "out|pay" + "ment|book|reserve|cart", "i")
      })
    ).not.toBeInTheDocument();
  }, 15000);

  it("renders derived Setups review from existing catalogue data only", () => {
    render(
      <AdminShellContent
        view={{ kind: "setups" }}
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
                  productCount: 3,
                  publishedProductCount: 2
                }
              ],
              products: [
                {
                  id: "product-1",
                  categoryId: "category-1",
                  slug: "modular-lounge",
                  name: "Modular Lounge",
                  shortDescription: "Soft lounge seating for enquiry context.",
                  rentalUnit: "set",
                  status: "published",
                  sortOrder: 10,
                  imageCount: 2,
                  primaryImageAltText: "Lounge set"
                },
                {
                  id: "product-2",
                  categoryId: "category-1",
                  slug: "accent-chair",
                  name: "Accent Chair",
                  rentalUnit: "item",
                  status: "published",
                  sortOrder: 20,
                  imageCount: 1
                },
                {
                  id: "product-3",
                  categoryId: "category-1",
                  slug: "hidden-plinth",
                  name: "Hidden Plinth",
                  rentalUnit: "item",
                  status: "draft",
                  sortOrder: 30,
                  imageCount: 0
                }
              ],
              images: [
                {
                  id: "image-1",
                  productId: "product-1",
                  storageBucket: "catalogue-metadata",
                  storagePath: "fixtures/lounge-main.jpg",
                  altText: "Lounge set",
                  sortOrder: 1,
                  isPrimary: true,
                  status: "active"
                }
              ],
              imageSummary: {
                totalImages: 1,
                activeImages: 1,
                primaryImages: 1
              }
            }
          }
        }}
      />
    );

    expect(
      screen.getByRole("region", { name: /derived setup review workflow/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^setups$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/review setup-style presentation derived from published catalogue items/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /manage catalogue/i })
    ).toHaveAttribute("href", "/admin/catalogue");
    expect(
      screen.getByRole("link", { name: /view public setups/i })
    ).toHaveAttribute("href", "/setups");
    expect(
      screen.getByText(/setups are currently derived from published catalogue items/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no setup-specific editor or records/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /derived setup overview/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/available for setups/i)).toBeInTheDocument();
    expect(screen.getByText(/draft or hidden catalogue items excluded/i)).toBeInTheDocument();
    expect(screen.getByText(/image review/i)).toBeInTheDocument();

    const loungeCard = screen.getByRole("article", {
      name: /setup candidate modular lounge/i
    });
    expect(loungeCard).toHaveTextContent(/modular lounge/i);
    expect(loungeCard).toHaveTextContent(/lounge/i);
    expect(loungeCard).toHaveTextContent(/published/i);
    expect(loungeCard).toHaveTextContent(/image ready/i);
    expect(loungeCard).toHaveTextContent(/soft lounge seating/i);

    const chairCard = screen.getByRole("article", {
      name: /setup candidate accent chair/i
    });
    expect(chairCard).toHaveTextContent(/needs image alt text/i);
    expect(
      screen.getAllByRole("link", { name: /edit in catalogue/i }).length
    ).toBe(2);
    expect(screen.queryByText(/hidden plinth/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add setup|edit setup/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /add setup|edit setup/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/image bucket|image path|raw url|url/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/catalogue-metadata|fixtures\/lounge-main\.jpg/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="url"]')).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(
      /\b(?:cart|checkout|order|payment|purchase|booking|reservation|inventory|stock|fulfilment|fulfillment|customer account|crm|pipeline)\b/i
    );
  }, 15000);

  it("renders a calm derived Setups empty state when no published catalogue items exist", () => {
    render(
      <AdminShellContent
        view={{ kind: "setups" }}
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "loaded",
            data: {
              categories: [],
              products: [
                {
                  id: "product-1",
                  slug: "draft-lounge",
                  name: "Draft Lounge",
                  rentalUnit: "set",
                  status: "draft",
                  sortOrder: 10,
                  imageCount: 0
                }
              ],
              images: [],
              imageSummary: {
                totalImages: 0,
                activeImages: 0,
                primaryImages: 0
              }
            }
          }
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: /no public setup candidates yet/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/published catalogue items will populate setups/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /manage catalogue/i })
    ).toHaveLength(2);
    for (const link of screen.getAllByRole("link", { name: /manage catalogue/i })) {
      expect(link).toHaveAttribute("href", "/admin/catalogue");
    }
    expect(screen.queryByRole("article", { name: /setup candidate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add setup|edit setup/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /add setup|edit setup/i })).not.toBeInTheDocument();
  });

  it("keeps Setups source derived and free of fake editor or storage path controls", () => {
    const shellSource = readAppFile("app/admin/protected-admin-shell.tsx");

    expect(shellSource).toContain("Derived setup review workflow");
    expect(shellSource).toContain('href="/setups"');
    expect(shellSource).toContain('href="/admin/catalogue"');
    expect(shellSource).toContain('product.status === "published"');
    expect(shellSource).not.toContain('href="/listings"');
    expect(shellSource).not.toContain("storageBucket");
    expect(shellSource).not.toContain("storagePath");
    expect(shellSource).not.toMatch(
      /Add setup|Edit setup|setup database|input type="url"|name="setupUrl"/i
    );
  });

  it("maps catalogue images into an owner-safe client DTO", () => {
    const shellSource = readAppFile("app/admin/protected-admin-shell.tsx");
    const ownerWorkflowSource = readAppFile(
      "components/admin/catalogue-owner-workflow.tsx"
    );

    expect(ownerWorkflowSource).not.toContain("storageBucket");
    expect(ownerWorkflowSource).not.toContain("storagePath");
    expect(ownerWorkflowSource).not.toContain("advancedCategoryPanel");
    expect(ownerWorkflowSource).not.toContain("Advanced category details");
    expect(shellSource).toContain(
      "const ownerSafeImages = dashboard.data.images.map"
    );
    expect(shellSource).toContain(
      "({ id, productId, altText, sortOrder, isPrimary, status })"
    );
    expect(shellSource).toContain("images={ownerSafeImages}");
    expect(shellSource).not.toContain("images={dashboard.data.images}");
    expect(shellSource).not.toContain("storageBucket");
    expect(shellSource).not.toContain("storagePath");
    expect(shellSource).not.toContain("CategoryManagementPanel");
  });

  it("redirects unauthenticated protected admin page requests to the login route", () => {
    for (const path of [
      "app/admin/page.tsx",
      "app/admin/hero/page.tsx",
      "app/admin/catalogue/page.tsx",
      "app/admin/setups/page.tsx",
      "app/admin/enquiry-email/page.tsx",
      "app/admin/delivery-log/page.tsx"
    ]) {
      const source = readAppFile(path);

      expect(source).toContain('state.status === "unauthenticated"');
      expect(source).toContain('redirect("/admin/login?state=unauthenticated")');
    }
  });

  it("keeps protected admin navigation aligned to the approved six-page workspace IA", () => {
    render(
      <AdminShellContent
        view={{ kind: "home" }}
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "loaded",
            data: {
              categories: [],
              products: [],
              images: [],
              imageSummary: {
                totalImages: 0,
                activeImages: 0,
                primaryImages: 0
              }
            }
          }
        }}
      />
    );

    expect(
      screen.getAllByRole("link", { name: /dashboard/i })[0]
    ).toHaveAttribute("href", "/admin");
    expect(
      screen.getAllByRole("link", { name: /^hero/i })[0]
    ).toHaveAttribute("href", "/admin/hero");
    expect(
      screen.getAllByRole("link", { name: /catalogue/i })[0]
    ).toHaveAttribute("href", "/admin/catalogue");
    expect(
      screen.getAllByRole("link", { name: /setups/i })[0]
    ).toHaveAttribute("href", "/admin/setups");
    expect(
      screen.getAllByRole("link", { name: /enquiry email/i })[0]
    ).toHaveAttribute("href", "/admin/enquiry-email");
    expect(
      screen.getAllByRole("link", { name: /delivery log/i })[0]
    ).toHaveAttribute("href", "/admin/delivery-log");
    expect(
      screen.queryByRole("link", { name: /quote inbox/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^listings$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^categories$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^media$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /readiness/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /public qa/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /release control/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /view public site/i })[0]
    ).toHaveAttribute("href", "/");
  });

  it("does not expose protected owner CMS route links before authorisation", () => {
    const protectedAdminRoutes = [
      "/admin",
      "/admin/hero",
      "/admin/catalogue",
      "/admin/setups",
      "/admin/enquiry-email",
      "/admin/delivery-log"
    ];
    const blockedStates = [
      {
        status: "unauthenticated" as const
      },
      {
        status: "authenticated_not_authorised" as const
      },
      {
        status: "unavailable" as const
      }
    ];

    for (const state of blockedStates) {
      const { container, unmount } = render(
        <AdminShellContent state={state} view={{ kind: "catalogue" }} />
      );

      for (const href of protectedAdminRoutes) {
        expect(container.querySelector(`a[href="${href}"]`)).toBeNull();
      }
      expect(
        screen.queryByLabelText(/admin workspace sections/i)
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /admin sign in|sign in/i })
      ).toHaveAttribute("href", "/admin/login");
      expect(
        screen.getByRole("link", { name: /public site/i })
      ).toHaveAttribute("href", "/");

      unmount();
    }
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
        }
      }
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} />);

      expect(
        screen.queryByRole("button", { name: /create category/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^create listing$/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /create listing image metadata/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /upload listing image for review/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/listing image file/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/listing image metadata management/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/listing image upload/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/category management/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/listing management/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: /derived setup review workflow/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /edit in catalogue/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /add setup|edit setup/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /add setup|edit setup/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /save follow-up/i })
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
          }
        }}
      />
    );

    expect(
      screen.getAllByRole("heading", { name: /^dashboard$/i }).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/unavailable/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/sql/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
  });

  it("renders a real hero-only form plus calm empty states for enquiry email and delivery log", () => {
    const baseState = {
      status: "authorised_admin" as const,
      dashboard: {
        status: "loaded" as const,
        data: {
          categories: [],
          products: [],
          images: [],
          imageSummary: {
            totalImages: 0,
            activeImages: 0,
            primaryImages: 0
          }
        }
      }
    };

    const { unmount: unmountHero } = render(
      <AdminShellContent state={baseState} view={{ kind: "hero" }} />
    );
    expect(
      screen.getByRole("heading", { name: /homepage hero image/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /headline/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /body/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /cta/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /hero image url/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /image url/i })
    ).not.toBeInTheDocument();
    expect(document.querySelector('input[type="url"]')).toBeNull();
    expect(
      screen.getByLabelText(/image alt text/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: /publish hero image/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save hero image/i })
    ).toBeEnabled();
    expect(
      screen.queryByRole("heading", { name: /about story media/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /about story image url/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /about story image alt/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: /publish about story image/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save about story image/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /replace hero image/i })
    ).not.toBeInTheDocument();
    unmountHero();

    const { unmount: unmountEmail } = render(
      <AdminShellContent state={baseState} view={{ kind: "enquiry-email" }} />
    );
    expect(
      screen.getByRole("heading", { name: /enquiry email handoff status/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/needs setup/i)).toBeInTheDocument();
    expect(screen.getByText(/recipient not configured/i)).toBeInTheDocument();
    expect(screen.getByText(/provider not configured/i)).toBeInTheDocument();
    expect(screen.getByText(/environment-managed/i)).toBeInTheDocument();
    expect(screen.getByText(/no internal quote inbox/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open delivery log/i })
    ).toHaveAttribute("href", "/admin/delivery-log");
    expect(
      screen.queryByRole("heading", { name: /routing settings/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /template preview/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save configuration/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send/i })
    ).not.toBeInTheDocument();
    unmountEmail();

    render(
      <AdminShellContent state={baseState} view={{ kind: "delivery-log" }} />
    );
    expect(
      screen.getByRole("heading", { name: /email delivery log/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /No enquiry email delivery attempts have been recorded yet\./i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/QR-20260603-NEWEST/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders configured enquiry email status without editable settings", () => {
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "loaded",
            data: {
              categories: [],
              products: [],
              images: [],
              imageSummary: {
                totalImages: 0,
                activeImages: 0,
                primaryImages: 0
              }
            }
          }
        }}
        view={{
          kind: "enquiry-email",
          config: {
            provider: "resend",
            providerConfigured: true,
            recipientConfigured: true,
            recipientEmail: "ev***@spacekoncept.example"
          }
        }}
      />
    );

    expect(screen.getByText(/^ready$/i)).toBeInTheDocument();
    expect(screen.getByText(/provider configured/i)).toBeInTheDocument();
    expect(screen.getByText(/recipient configured/i)).toBeInTheDocument();
    expect(screen.getByText("ev***@spacekoncept.example")).toBeInTheDocument();
    expect(screen.getAllByText(/environment-managed/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /open delivery log/i })
    ).toHaveAttribute("href", "/admin/delivery-log");
    expect(
      screen.queryByRole("textbox", { name: /primary recipient email/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /cc recipients/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save configuration/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /routing settings/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /template preview/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /set recipient|send/i })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("RESEND_API_KEY");
    expect(document.body.textContent).not.toContain("resend-secret");
    expect(document.body.textContent).not.toContain("raw provider body");
  });

  it("renders compact delivery log records without quote detail workflow", () => {
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "loaded",
            data: {
              categories: [],
              products: [],
              images: [],
              imageSummary: {
                totalImages: 0,
                activeImages: 0,
                primaryImages: 0
              }
            }
          }
        }}
        view={{
          kind: "delivery-log",
          deliveryLog: {
            status: "loaded",
            records: [
              {
                id: "80000000-0000-4000-8000-000000000001",
                quoteRequestId: "70000000-0000-4000-8000-000000000001",
                publicReference: "QR-20260612-ABC12345",
                attemptedAt: "2026-06-12T09:30:00.000Z",
                recipientEmail: "ev***@spacekoncept.example",
                provider: "resend",
                deliveryStatus: "sent",
                providerMessageId: "resend-message-1",
                requestId: "route-request-1"
              },
              {
                id: "80000000-0000-4000-8000-000000000002",
                quoteRequestId: "70000000-0000-4000-8000-000000000002",
                publicReference: "QR-20260612-FAILED",
                attemptedAt: "2026-06-12T09:20:00.000Z",
                recipientEmail: "ev***@spacekoncept.example",
                provider: "resend",
                deliveryStatus: "failed",
                errorCode: "provider_rejected",
                requestId: "route-request-2"
              },
              {
                id: "80000000-0000-4000-8000-000000000003",
                quoteRequestId: "70000000-0000-4000-8000-000000000003",
                publicReference: "QR-20260612-NOTCONF",
                attemptedAt: "2026-06-12T09:10:00.000Z",
                recipientEmail: "Not configured",
                provider: "resend",
                deliveryStatus: "not_configured",
                errorCode: "email_recipient_not_configured",
                requestId: "route-request-3"
              }
            ]
          }
        }}
      />
    );

    expect(screen.getByRole("table", { name: /email delivery attempts/i })).toBeInTheDocument();
    expect(screen.getByText("QR-20260612-ABC12345")).toBeInTheDocument();
    expect(screen.getByText("QR-20260612-FAILED")).toBeInTheDocument();
    expect(screen.getByText("QR-20260612-NOTCONF")).toBeInTheDocument();
    expect(screen.getAllByText("ev***@spacekoncept.example")).toHaveLength(2);
    expect(screen.getByText("Not configured")).toBeInTheDocument();
    expect(screen.getByText("sent")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("not_configured")).toBeInTheDocument();
    expect(screen.getByText("resend-message-1")).toBeInTheDocument();
    expect(screen.getByText("provider_rejected")).toBeInTheDocument();
    expect(screen.getByText("email_recipient_not_configured")).toBeInTheDocument();
    expect(screen.queryByText(/Please recommend/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Modular lounge set/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /quote detail|open quote|review/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /follow-up|archive|review|send/i })
    ).not.toBeInTheDocument();
  });
});
