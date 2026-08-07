import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveProtectedAdminShellState } from "../protected-admin-shell";
import type { ProtectedAdminShellState } from "../protected-admin-shell";
import { resolveAdminAppOperationEventOperationsRead } from "../../../lib/application-events/app-operation-event-operations-read";
import { getAppOperationEventSinkStatus } from "../../../lib/application-events/app-operation-event-sink";
import AdminOperationsPage from "./page";

vi.mock("../protected-admin-shell", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../protected-admin-shell")>();

  return {
    ...original,
    resolveProtectedAdminShellState: vi.fn()
  };
});

vi.mock(
  "../../../lib/application-events/app-operation-event-operations-read",
  () => ({
    resolveAdminAppOperationEventOperationsRead: vi.fn()
  })
);

vi.mock("../../../lib/application-events/app-operation-event-sink", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../lib/application-events/app-operation-event-sink")>();

  return {
    ...original,
    getAppOperationEventSinkStatus: vi.fn()
  };
});

const workspaceId = "11111111-1111-4111-8111-111111111111";

function authorisedState(): Extract<
  ProtectedAdminShellState,
  { status: "authorised_admin" }
> {
  return {
    status: "authorised_admin" as const,
    workspaceId,
    dashboard: {
      status: "loaded" as const,
      data: {
        categories: [],
        products: [],
        setupRecipeProductIds: [],
        setupRecipeChildProductIds: [],
        images: [],
        imageSummary: {
          totalImages: 0,
          activeImages: 0,
          primaryImages: 0
        }
      }
    },
    adminAccess: {
      status: "loaded" as const,
      currentAdmin: {
        email: "owner@example.com",
        role: "owner",
        canManageAccess: true
      },
      records: []
    }
  };
}

const loadedRead = {
  status: "loaded" as const,
  query: {},
  records: [
    {
      eventId: "22222222-2222-4222-8222-222222222222",
      category: "quote.handoff" as const,
      outcome: "pending" as const,
      referenceType: "request_id" as const,
      referenceValue: "123e4567-e89b-42d3-a456-426614174000",
      errorCode: "handoff_pending",
      routeKey: "/api/quote",
      httpStatus: 503,
      occurredAt: "2026-08-07T01:02:03.000Z",
      createdAt: "2026-08-07T01:02:03.500Z",
      retentionEligibleAt: "2026-11-05T01:02:03.500Z",
      actorExists: false
    }
  ],
  summary: {
    total: 1,
    byCategory: {
      "quote.submission": 0,
      "quote.handoff": 1,
      "admin.auth": 0,
      "rate.limit": 0
    },
    byOutcome: {
      failed: 0,
      denied: 0,
      disabled: 0,
      pending: 1
    }
  }
};

describe("admin operations page", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the protected operations review through the admin shell when authorised", async () => {
    vi.mocked(resolveProtectedAdminShellState).mockResolvedValueOnce(
      authorisedState()
    );
    vi.mocked(resolveAdminAppOperationEventOperationsRead).mockResolvedValueOnce(
      loadedRead
    );
    vi.mocked(getAppOperationEventSinkStatus).mockReturnValueOnce({
      state: "disabled"
    });

    render(
      await AdminOperationsPage({
        searchParams: Promise.resolve({})
      })
    );

    expect(
      screen.getAllByRole("link", { name: /^operations$/i })[0]
    ).toHaveAttribute("href", "/admin/operations");
    expect(
      screen.getByRole("heading", { name: /^operations$/i })
    ).toBeInTheDocument();
    const sinkPanel = screen.getByLabelText("Operation event sink status");
    expect(
      within(sinkPanel).getByRole("heading", { name: /operation event sink/i })
    ).toBeInTheDocument();
    expect(within(sinkPanel).getByText(/^disabled$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /operation events/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/handoff_pending/i)).toBeInTheDocument();
  });

  it("passes an invalid-filter result into the shell without echoing the value", async () => {
    vi.mocked(resolveProtectedAdminShellState).mockResolvedValueOnce(
      authorisedState()
    );
    vi.mocked(resolveAdminAppOperationEventOperationsRead).mockResolvedValueOnce(
      { status: "invalid_filter" }
    );
    vi.mocked(getAppOperationEventSinkStatus).mockReturnValueOnce({
      state: "ready"
    });

    render(
      await AdminOperationsPage({
        searchParams: Promise.resolve({ category: "not.locked" })
      })
    );

    expect(
      screen.getByText(/filter is not supported/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /clear filters/i })
    ).toHaveAttribute("href", "/admin/operations");
    expect(document.body.textContent).not.toContain("not.locked");
  });

  it("renders a public-safe unavailable state without provider details", async () => {
    vi.mocked(resolveProtectedAdminShellState).mockResolvedValueOnce(
      authorisedState()
    );
    vi.mocked(resolveAdminAppOperationEventOperationsRead).mockResolvedValueOnce(
      { status: "unavailable" }
    );
    vi.mocked(getAppOperationEventSinkStatus).mockReturnValueOnce({
      state: "temporarily_unavailable"
    });

    render(
      await AdminOperationsPage({
        searchParams: Promise.resolve({})
      })
    );

    expect(screen.getAllByText(/unavailable/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/sql|supabase|exception|stack/i)).toBeNull();
  });
});
