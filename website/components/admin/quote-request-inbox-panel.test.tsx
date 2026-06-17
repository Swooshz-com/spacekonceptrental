import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminQuoteRequestInboxQuoteRequest } from "../../lib/quote/admin-read/admin-quote-request-dashboard-read";
import { QuoteRequestInboxPanel } from "./quote-request-inbox-panel";

const quoteRequest: AdminQuoteRequestInboxQuoteRequest = {
  id: "22222222-2222-4222-8222-222222222222",
  publicReference: "QR-20260603-NEWEST",
  customerName: "Maya Tan",
  customerEmail: "maya@example.test",
  customerPhone: "+65 8123 4567",
  customerMessage:
    "Please recommend a warm lounge setup for a corporate reception.",
  eventDate: "2026-06-20",
  venue: "Marina Bay Sands",
  status: "new" as const,
  source: "website" as const,
  sourcePagePath: "/quote?listing=modular-lounge-set",
  sourceListingSlug: "modular-lounge-set",
  crmProvider: "hubspot" as const,
  crmSyncStatus: "not_queued" as const,
  crmContactId: undefined,
  crmDealId: undefined,
  createdAt: "2026-06-03T10:30:00.000Z",
  items: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      quoteRequestId: "22222222-2222-4222-8222-222222222222",
      productNameSnapshot: "Modular lounge set",
      quantity: 2,
      notes: "VIP reception area",
      createdAt: "2026-06-03T10:31:00.000Z"
    }
  ],
  activity: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      quoteRequestId: "22222222-2222-4222-8222-222222222222",
      activityType: "internal_note" as const,
      note: "Call Maya about sofa quantities.",
      createdAt: "2026-06-03T10:40:00.000Z"
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      quoteRequestId: "22222222-2222-4222-8222-222222222222",
      activityType: "status_change" as const,
      statusFrom: "new" as const,
      statusTo: "reviewing" as const,
      createdAt: "2026-06-03T10:35:00.000Z"
    }
  ]
};

function loadedInbox() {
  return {
    status: "loaded" as const,
    data: {
      quoteRequests: [quoteRequest]
    }
  };
}

function createJsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });
}

function createCsvResponse(body: string, init: ResponseInit = {}) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="skr-hubspot-import-queued-enquiries-20260617-093045.csv"'
    },
    ...init
  });
}

describe("QuoteRequestInboxPanel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Backward-compatible validator marker:
  // renders internal quote status controls for authorised inbox data
  // Local CRM handoff payload preview
  it("renders internal enquiry triage status controls for authorised inbox data", () => {
    render(<QuoteRequestInboxPanel inbox={loadedInbox()} />);

    expect(
      screen.getByRole("heading", { name: /quote request inbox/i })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/internal status for QR-20260603-NEWEST/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /update internal triage status for QR-20260603-NEWEST/i
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/internal note for QR-20260603-NEWEST/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /event and setup details/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/please recommend a warm lounge setup/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /requested listings and items/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /admin-only status history/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/call maya about sofa quantities/i)).toBeInTheDocument();
    expect(screen.getByText(/status changed from new to reviewing/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/internal triage status only/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/this does not contact the customer or sync to crm/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/source path/i)).toBeInTheDocument();
    expect(screen.getByText("/quote?listing=modular-lounge-set")).toBeInTheDocument();
    expect(screen.getByText(/requested listing slug/i)).toBeInTheDocument();
    expect(screen.getByText("modular-lounge-set")).toBeInTheDocument();
    expect(
      screen.getAllByText(/CRM handoff placeholder/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Provider - hubspot/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Sync status - not_queued/i)).toBeInTheDocument();
    expect(screen.getByText(/No CRM contact ID captured/i)).toBeInTheDocument();
    expect(screen.getByText(/No CRM deal ID captured/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /local CRM handoff payload preview/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Future provider - hubspot/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This does not sync to HubSpot or contact the customer/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/CRM handoff readiness/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /mark ready for CRM handoff for QR-20260603-NEWEST/i
      })
    ).toBeInTheDocument();
  });

  it("requests quote.write proof and sends status-only triage update POST with x-csrf-proof", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          record: {
            id: quoteRequest.id,
            type: "quoteRequest"
          }
        })
      );
    const onMutationComplete = vi.fn();

    render(
      <QuoteRequestInboxPanel
        fetcher={fetcher}
        inbox={loadedInbox()}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.change(
      screen.getByLabelText(/internal status for QR-20260603-NEWEST/i),
      {
        target: {
          value: "follow_up_needed"
        }
      }
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /update internal triage status for QR-20260603-NEWEST/i
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/admin/csrf-proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestedOperation: "quote.write",
        operation: "quote.write"
      })
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `/api/admin/quote-requests/${encodeURIComponent(quoteRequest.id)}/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-proof": "proof-secret"
        },
        body: JSON.stringify({
          status: "follow_up_needed"
        })
      }
    );
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/status updated for admin review/i)
    ).toBeInTheDocument();
  });

  it("sends local CRM handoff queue status update POST without contact IDs or provider calls", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          record: {
            id: quoteRequest.id,
            type: "quoteRequest",
            crmProvider: "hubspot",
            crmSyncStatus: "queued"
          }
        })
      );
    const onMutationComplete = vi.fn();

    render(
      <QuoteRequestInboxPanel
        fetcher={fetcher}
        inbox={loadedInbox()}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /mark ready for CRM handoff for QR-20260603-NEWEST/i
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    expect(fetcher).toHaveBeenNthCalledWith(2, `/api/admin/quote-requests/${encodeURIComponent(quoteRequest.id)}/crm-handoff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-proof": "proof-secret"
      },
      body: JSON.stringify({
        crmSyncStatus: "queued"
      })
    });
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmContactId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmDealId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmLastSyncAttemptAt");
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/Queued locally for future CRM handoff/i)
    ).toBeInTheDocument();
  });

  it("lets admins review a bounded queued CRM handoff packet without provider calls", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      },
      {
        ...quoteRequest,
        id: "66666666-6666-4666-8666-666666666666",
        publicReference: "QR-20260603-NOT-QUEUED",
        crmSyncStatus: "not_queued" as const
      }
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          packet: {
          generatedAt: "2026-06-16T12:00:00.000Z",
          provider: "hubspot",
          localCrmSyncStatus: "queued",
          limit: 25,
          recordCount: 1,
          records: [
            {
              id: quoteRequest.id,
              publicReference: quoteRequest.publicReference,
              createdAt: quoteRequest.createdAt,
              status: quoteRequest.status,
              customerName: quoteRequest.customerName,
              customerEmail: quoteRequest.customerEmail,
              customerPhone: quoteRequest.customerPhone,
              companyOrEventOrganisation: quoteRequest.venue,
              messageDetails: quoteRequest.customerMessage,
              sourcePagePath: quoteRequest.sourcePagePath,
              sourceListingSlug: quoteRequest.sourceListingSlug,
              futureProvider: "hubspot",
              localCrmSyncStatus: "queued"
            }
          ]
          },
          manifest: {
            id: "55555555-5555-4555-8555-555555555555",
            workspaceId: "11111111-1111-4111-8111-111111111111",
            provider: "hubspot",
            packetKind: "json_review_packet",
            statusFilter: "queued",
            limitRequested: 25,
            recordCount: 1,
            requestIds: [quoteRequest.id],
            requestIdCount: 1,
            generatedByAdminUserId: "77777777-7777-4777-8777-777777777777",
            generatedAt: "2026-06-16T12:00:00.000Z",
            source: "protected_admin"
          },
          recentManifests: [
            {
              id: "55555555-5555-4555-8555-555555555555",
              workspaceId: "11111111-1111-4111-8111-111111111111",
              provider: "hubspot",
              packetKind: "json_review_packet",
              statusFilter: "queued",
              limitRequested: 25,
              recordCount: 1,
              requestIds: [quoteRequest.id],
              requestIdCount: 1,
              generatedByAdminUserId: "77777777-7777-4777-8777-777777777777",
              generatedAt: "2026-06-16T12:00:00.000Z",
              source: "protected_admin"
            }
          ]
        })
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    expect(
      screen.getByRole("heading", {
        name: /queued CRM handoff packet review/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/eligible queued records/i)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.getByText(/Manual review\/export only/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not sync to HubSpot or contact customers/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not call n8n, does not send email, does not create provider IDs, and does not mark records as synced/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/audit\/manifest only/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No CRM handoff packet manifests loaded yet/i)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /review queued CRM handoff packet/i
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/admin/csrf-proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestedOperation: "quote.write",
        operation: "quote.write"
      })
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/admin/quote-requests/crm-handoff-packet?limit=25",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "x-csrf-proof": "proof-secret"
        }
      }
    );
    expect(
      await screen.findByText(/queued CRM handoff packet JSON preview/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/QR-20260603-NEWEST/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", {
        name: /recent CRM handoff packet manifests/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/2026-06-16T12:00:00.000Z/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/hubspot/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/queued/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/record count/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Request IDs: 1/i)).toBeInTheDocument();
    expect(screen.getByText(quoteRequest.id)).toBeInTheDocument();
    expect(screen.getByText(/protected_admin/i)).toBeInTheDocument();
    expect(screen.getByText(/json_review_packet/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin: 77777777-7777-4777-8777-777777777777/i)).toBeInTheDocument();
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("hubapi");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmContactId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmDealId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmLastSyncAttemptAt");
  });

  it("downloads a protected HubSpot import CSV after quote.write proof without provider calls", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURL = vi.fn(() => "blob:hubspot-import-csv");
    const revokeObjectURL = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createCsvResponse(
          '"Quote Request ID","Public Reference"\r\n"22222222-2222-4222-8222-222222222222","QR-20260603-NEWEST"\r\n'
        )
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    expect(
      screen.getByRole("button", {
        name: /download HubSpot import CSV/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/HubSpot import CSV is a protected admin export/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Records remain queued/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No HubSpot sync occurs/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no provider IDs are created/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no sync timestamp is set/i).length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: /download HubSpot import CSV/i
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/admin/csrf-proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestedOperation: "quote.write",
        operation: "quote.write"
      })
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv?limit=25&status=queued",
      {
        method: "POST",
        headers: {
          Accept: "text/csv",
          "x-csrf-proof": "proof-secret"
        }
      }
    );
    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:hubspot-import-csv");
    });
    expect(
      screen.getByText(/HubSpot import CSV prepared for manual admin export only/i)
    ).toBeInTheDocument();
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("hubapi");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("webhook");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmContactId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmDealId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmLastSyncAttemptAt");

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: originalCreateObjectURL
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: originalRevokeObjectURL
    });
    click.mockRestore();
  });

  it("runs protected HubSpot import CSV preflight and shows bounded readiness issues without provider calls", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          preflight: {
            generatedAt: "2026-06-17T10:00:00.000Z",
            provider: "hubspot",
            localCrmSyncStatus: "queued",
            limit: 25,
            totalRecordCount: 2,
            exportableRecordCount: 1,
            needsReviewRecordCount: 1,
            duplicateEmailCount: 1,
            duplicatePhoneCount: 0,
            formulaRiskCellCount: 1,
            issueCountsByType: {
              missing_customer_name: 1,
              missing_customer_email: 0,
              invalid_customer_email: 1,
              missing_customer_phone: 0,
              duplicate_customer_email_in_batch: 1,
              duplicate_customer_phone_in_batch: 0,
              missing_message_details: 0,
              message_details_too_long: 0,
              missing_public_reference: 0,
              missing_created_at: 0,
              csv_formula_risk_sanitised: 1,
              missing_source_context: 0
            },
            rowIssues: [
              {
                quoteRequestId: "55555555-5555-4555-8555-555555555555",
                publicReference: "QR-NEEDS-REVIEW",
                issueTypes: [
                  "missing_customer_name",
                  "invalid_customer_email",
                  "duplicate_customer_email_in_batch",
                  "csv_formula_risk_sanitised"
                ],
                issueCount: 4,
                exportable: false,
                formulaRiskCellCount: 1
              }
            ]
          }
        })
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    expect(
      screen.getByRole("button", {
        name: /run CSV import preflight/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Manual import\/export readiness only/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Records remain queued/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No HubSpot sync occurs/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No provider IDs are created/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No sync timestamp is set/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/CSV formula-risk cells are sanitised during export/i)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /run CSV import preflight/i
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/admin/csrf-proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestedOperation: "quote.write",
        operation: "quote.write"
      })
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight?limit=25&status=queued",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "x-csrf-proof": "proof-secret"
        }
      }
    );
    expect(
      await screen.findByRole("heading", {
        name: /HubSpot import CSV preflight summary/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/Total queued records checked/i)).toBeInTheDocument();
    expect(screen.getByText(/Exportable records/i)).toBeInTheDocument();
    expect(screen.getByText(/Needs review records/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicate emails/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicate phones/i)).toBeInTheDocument();
    expect(screen.getByText(/Formula-risk cells sanitised/i)).toBeInTheDocument();
    expect(screen.getByText(/QR-NEEDS-REVIEW/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing customer name/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid customer email/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicate customer email in batch/i)).toBeInTheDocument();
    expect(screen.getByText(/CSV formula-risk sanitised/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Latest CSV import preflight found records needing admin review/i)
    ).toBeInTheDocument();
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("hubapi");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("webhook");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmContactId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmDealId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmLastSyncAttemptAt");
  });

  it("handles protected HubSpot import CSV preflight failures generically", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            ok: false,
            error: "sql token session header provider stack"
          },
          {
            status: 503
          }
        )
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /run CSV import preflight/i
      })
    );

    expect(
      await screen.findByText(
        /HubSpot import CSV preflight could not be prepared\. Keep queued records unchanged and try again\./i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/sql token session/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/provider stack/i)).not.toBeInTheDocument();
  });

  it("runs protected CRM handoff lifecycle reconciliation and shows safe bounded rows without provider calls", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          reconciliation: {
            generatedAt: "2026-06-17T12:45:00.000Z",
            provider: "hubspot",
            localCrmSyncStatus: "queued",
            limit: 25,
            queuedRecordCount: 2,
            jsonReviewPacketManifestCount: 1,
            hubspotCsvManifestCount: 1,
            manualOutcomeCount: 1,
            queuedNeverExportedCount: 1,
            csvExportedNoOutcomeCount: 0,
            csvExportedReviewedCount: 1,
            csvCompletedOutsideSkrCount: 0,
            csvRejectedNeedsCorrectionCount: 0,
            csvPartialNeedsFollowUpCount: 0,
            preflightNeedsReviewCount: 0,
            staleManifestCount: 0,
            mismatchedManifestCount: 0,
            recommendedNextAction: "run_preflight",
            rows: [
              {
                quoteRequestId: quoteRequest.id,
                publicReference: quoteRequest.publicReference,
                createdAt: quoteRequest.createdAt,
                localCrmSyncStatus: "queued",
                lifecycleState: "queued_never_exported",
                relatedManifestId:
                  "66666666-6666-4666-8666-666666666666",
                latestOutcomeStatus: undefined,
                safeIssueCount: 0,
                recommendedNextAction: "run_preflight"
              }
            ]
          }
        })
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Run CRM handoff reconciliation/i
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/admin/quote-requests/crm-handoff-packet/lifecycle-reconciliation?limit=25&status=queued",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "x-csrf-proof": "proof-secret"
        }
      }
    );
    expect(
      screen.getByText(
        /CRM handoff lifecycle reconciliation prepared locally\. Queued records remain queued\./i
      )
    ).toBeInTheDocument();

    const panel = await screen.findByRole("region", {
      name: /CRM handoff lifecycle reconciliation summary/i
    });

    expect(within(panel).getByText(/Local reconciliation only/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Records remain queued/i)).toBeInTheDocument();
    expect(within(panel).getByText(/No HubSpot sync occurs/i)).toBeInTheDocument();
    expect(within(panel).getByText(/No provider IDs are created/i)).toBeInTheDocument();
    expect(within(panel).getByText(/No sync timestamp is set/i)).toBeInTheDocument();
    expect(within(panel).getByText(/This does not mutate enquiry records/i)).toBeInTheDocument();
    expect(
      within(panel).getAllByText(/Run CSV preflight/i).length
    ).toBeGreaterThan(0);
    expect(within(panel).getByText(/QR-20260603-NEWEST/i)).toBeInTheDocument();
    expect(
      within(panel).getByText(/Queued - never exported/i)
    ).toBeInTheDocument();
    expect(within(panel).queryByText(/Maya Tan/i)).not.toBeInTheDocument();
    expect(within(panel).queryByText(/maya@example\.test/i)).not.toBeInTheDocument();
    expect(
      within(panel).queryByText(/Please recommend a warm lounge setup/i)
    ).not.toBeInTheDocument();
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("hubapi");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("webhook");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmContactId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmDealId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain(
      "crmLastSyncAttemptAt"
    );
  });

  it("handles CRM handoff lifecycle reconciliation failures generically", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            ok: false,
            error: "sql hubspot token session header stack"
          },
          {
            status: 503
          }
        )
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Run CRM handoff reconciliation/i
      })
    );

    expect(
      await screen.findByText(
        /CRM handoff lifecycle reconciliation could not be prepared\. Keep queued records unchanged and try again\./i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/sql hubspot token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/session header stack/i)).not.toBeInTheDocument();
  });

  it("runs protected HubSpot sync dry-run and shows safe bounded rows without provider calls", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          dryRunContract: {
            generatedAt: "2026-06-17T12:45:00.000Z",
            provider: "hubspot",
            mode: "dry_run_only",
            localCrmSyncStatus: "queued",
            limit: 25,
            totalCandidateCount: 2,
            eligibleForFutureSyncCount: 1,
            blockedCandidateCount: 1,
            needsManualReviewCount: 1,
            wouldCreateOrUpdateContactCount: 1,
            wouldCreateOrUpdateDealCount: 1,
            wouldAssociateDealToContactCount: 1,
            idempotencyKeyCount: 2,
            recommendedNextAction: "review_dry_run_payload",
            rows: [
              {
                quoteRequestId: quoteRequest.id,
                publicReference: quoteRequest.publicReference,
                createdAt: quoteRequest.createdAt,
                localCrmSyncStatus: "queued",
                lifecycleState: "queued_manual_import_reviewed",
                dryRunState: "eligible_for_future_sync",
                relatedManifestId:
                  "66666666-6666-4666-8666-666666666666",
                latestOutcomeStatus: "manual_import_reviewed",
                safeIssueCount: 0,
                futureIdempotencyKey:
                  `skr_quote_request:11111111-1111-4111-8111-111111111111:${quoteRequest.id}:hubspot`,
                recommendedNextAction: "review_dry_run_payload",
                payloadPreview: {
                  futureContactProperties: {
                    email: "presence_only",
                    phone: "presence_only",
                    company: "presence_only"
                  },
                  futureDealProperties: {
                    dealname: "mapped_without_value",
                    pipeline: "future_credentials_design",
                    dealstage: "future_credentials_design",
                    skr_quote_reference: "presence_only"
                  },
                  futureAssociations: ["contact_to_deal"],
                  futureIdempotencyKey:
                    `skr_quote_request:11111111-1111-4111-8111-111111111111:${quoteRequest.id}:hubspot`
                }
              },
              {
                quoteRequestId: "77777777-7777-4777-8777-777777777777",
                publicReference: "QR-BLOCKED",
                createdAt: "2026-06-17T09:30:00.000Z",
                localCrmSyncStatus: "queued",
                lifecycleState: "queued_preflight_needs_review",
                dryRunState: "blocked_missing_required_contact_field",
                safeIssueCount: 1,
                futureIdempotencyKey:
                  "skr_quote_request:11111111-1111-4111-8111-111111111111:77777777-7777-4777-8777-777777777777:hubspot",
                recommendedNextAction: "fix_preflight_issues"
              }
            ]
          }
        })
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Run HubSpot sync dry-run/i
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/admin/quote-requests/crm-handoff-packet/hubspot-sync-dry-run-contract?limit=25&status=queued",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "x-csrf-proof": "proof-secret"
        }
      }
    );
    expect(
      screen.getByText(
        /HubSpot sync dry-run prepared locally\. No provider call occurred and queued records remain unchanged\./i
      )
    ).toBeInTheDocument();

    const panel = await screen.findByRole("region", {
      name: /HubSpot sync dry-run contract summary/i
    });

    expect(within(panel).getByText(/Dry-run only/i)).toBeInTheDocument();
    expect(within(panel).getByText(/No HubSpot sync occurs/i)).toBeInTheDocument();
    expect(within(panel).getByText(/No provider call occurs/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Records remain queued/i)).toBeInTheDocument();
    expect(within(panel).getByText(/No provider IDs are created/i)).toBeInTheDocument();
    expect(within(panel).getByText(/No sync timestamp is set/i)).toBeInTheDocument();
    expect(within(panel).getByText(/This does not mutate enquiry records/i)).toBeInTheDocument();
    expect(within(panel).getByText("Total candidates")).toBeInTheDocument();
    expect(within(panel).getByText("Eligible for future sync")).toBeInTheDocument();
    expect(within(panel).getByText("Blocked candidates")).toBeInTheDocument();
    expect(within(panel).getByText("Needs manual review")).toBeInTheDocument();
    expect(within(panel).getByText("Would prepare contact payloads")).toBeInTheDocument();
    expect(within(panel).getByText("Would prepare deal payloads")).toBeInTheDocument();
    expect(within(panel).getByText("Would prepare association payloads")).toBeInTheDocument();
    expect(within(panel).getAllByText(/Review dry-run payload/i).length)
      .toBeGreaterThan(0);
    expect(within(panel).getByText(/QR-20260603-NEWEST/i)).toBeInTheDocument();
    expect(within(panel).getByText(/QR-BLOCKED/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Eligible for future sync/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Blocked - missing required contact field/i))
      .toBeInTheDocument();
    expect(within(panel).getByText(/contact_to_deal/i)).toBeInTheDocument();
    expect(within(panel).queryByText(/Maya Tan/i)).not.toBeInTheDocument();
    expect(within(panel).queryByText(/maya@example\.test/i)).not.toBeInTheDocument();
    expect(
      within(panel).queryByText(/Please recommend a warm lounge setup/i)
    ).not.toBeInTheDocument();
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("hubapi");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("webhook");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("smtp");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmContactId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("crmDealId");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain(
      "crmLastSyncAttemptAt"
    );
  });

  it("handles HubSpot sync dry-run failures generically without showing provider details", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            ok: false,
            error: "sql hubspot token session header provider stack"
          },
          {
            status: 503
          }
        )
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Run HubSpot sync dry-run/i
      })
    );

    expect(
      await screen.findByText(
        /HubSpot sync dry-run could not be prepared\. Keep queued records unchanged and try again\./i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/sql hubspot token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/session header provider stack/i))
      .not.toBeInTheDocument();
  });

  it("posts controlled HubSpot manual import outcomes only for CSV manifests after quote.write proof", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const jsonManifest = {
      id: "66666666-6666-4666-8666-666666666666",
      provider: "hubspot",
      packetKind: "json_review_packet",
      statusFilter: "queued",
      limitRequested: 25,
      recordCount: 1,
      requestIds: [quoteRequest.id],
      requestIdCount: 1,
      generatedByAdminUserId: "77777777-7777-4777-8777-777777777777",
      generatedAt: "2026-06-17T10:00:00.000Z",
      source: "protected_admin"
    };
    const csvManifest = {
      ...jsonManifest,
      id: "88888888-8888-4888-8888-888888888888",
      packetKind: "hubspot_import_csv"
    };
    const outcome = {
      id: "99999999-9999-4999-8999-999999999999",
      workspaceId: "11111111-1111-4111-8111-111111111111",
      manifestId: csvManifest.id,
      provider: "hubspot",
      packetKind: "hubspot_import_csv",
      outcomeStatus: "manual_import_completed_outside_skr",
      recordCount: 1,
      requestIds: [quoteRequest.id],
      requestIdCount: 1,
      recordedByAdminUserId: "77777777-7777-4777-8777-777777777777",
      recordedAt: "2026-06-17T11:00:00.000Z",
      source: "protected_admin",
      customerName: "Leaked Customer",
      customerEmail: "leak@example.test",
      customerPhone: "+65 9999 0000",
      messageDetails: "Do not show this message",
      internalNotes: "Do not show this note",
      crmContactId: "contact-secret",
      crmDealId: "deal-secret",
      crmLastSyncAttemptAt: "2026-06-17T11:30:00.000Z"
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          packet: {
            provider: "hubspot"
          },
          manifest: jsonManifest,
          recentManifests: [jsonManifest, csvManifest]
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          outcome,
          recentOutcomes: [outcome]
        })
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /review queued CRM handoff packet/i
      })
    );

    expect(
      await screen.findByText(/hubspot_import_csv/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: new RegExp(`Mark manual import reviewed for manifest ${jsonManifest.id}`, "i")
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: new RegExp(`Mark manual import reviewed for manifest ${csvManifest.id}`, "i")
      })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`Mark manual import completed outside SKR for manifest ${csvManifest.id}`, "i")
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(4);
    });
    expect(fetcher).toHaveBeenNthCalledWith(3, "/api/admin/csrf-proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestedOperation: "quote.write",
        operation: "quote.write"
      })
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      4,
      "/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-proof": "proof-secret"
        },
        body: JSON.stringify({
          manifestId: csvManifest.id,
          outcomeStatus: "manual_import_completed_outside_skr"
        })
      }
    );
    expect(
      await screen.findByRole("heading", {
        name: /recent HubSpot manual import outcomes/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Manual import completed outside SKR/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Request IDs: 1/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Local audit only/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Records remain queued/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No HubSpot sync occurs/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No provider IDs are created/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No sync timestamp is set/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/This does not mutate enquiry records/i)).toBeInTheDocument();
    expect(screen.getByText(/No freeform notes are stored/i)).toBeInTheDocument();
    expect(screen.queryByText(/Leaked Customer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/leak@example\.test/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Do not show this message/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/contact-secret/i)).not.toBeInTheDocument();
    expect(JSON.stringify(fetcher.mock.calls[3])).not.toContain("Leaked Customer");
    expect(JSON.stringify(fetcher.mock.calls[3])).not.toContain("crmContactId");
    expect(JSON.stringify(fetcher.mock.calls[3])).not.toContain("crmDealId");
    expect(JSON.stringify(fetcher.mock.calls[3])).not.toContain("crmLastSyncAttemptAt");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("hubapi");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("webhook");
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("smtp");
  });

  it("handles HubSpot manual import outcome failures generically without showing provider details", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const csvManifest = {
      id: "88888888-8888-4888-8888-888888888888",
      provider: "hubspot",
      packetKind: "hubspot_import_csv",
      statusFilter: "queued",
      limitRequested: 25,
      recordCount: 1,
      requestIds: [quoteRequest.id],
      requestIdCount: 1,
      generatedByAdminUserId: "77777777-7777-4777-8777-777777777777",
      generatedAt: "2026-06-17T10:00:00.000Z",
      source: "protected_admin"
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          packet: {
            provider: "hubspot"
          },
          manifest: csvManifest,
          recentManifests: [csvManifest]
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            ok: false,
            error: "sql token session header hubapi provider stack"
          },
          {
            status: 503
          }
        )
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /review queued CRM handoff packet/i
      })
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: new RegExp(`Mark manual import reviewed for manifest ${csvManifest.id}`, "i")
      })
    );

    expect(
      await screen.findByText(
        /HubSpot manual import outcome could not be recorded\. Records remain queued and unchanged\./i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/sql token session/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/provider stack/i)).not.toBeInTheDocument();
  });

  it("disables queued packet review while loading and shows generic failures", async () => {
    let resolvePacket: ((value: Response) => void) | undefined;
    const packetRequest = new Promise<Response>((resolve) => {
      resolvePacket = resolve;
    });
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      }
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockReturnValueOnce(packetRequest);

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    const button = screen.getByRole("button", {
      name: /review queued CRM handoff packet/i
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    resolvePacket?.(
      createJsonResponse(
        {
          ok: false,
          error: "sql token stack workspace-secret"
        },
        {
          status: 503
        }
      )
    );

    expect(
      await screen.findByText(
        /CRM handoff packet could not be prepared\. Keep queued records unchanged and try again\./i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/workspace-secret/i)).not.toBeInTheDocument();
  });

  it("lets admins return queued enquiries to not queued and prepare failed retry locally", async () => {
    const queuedInbox = loadedInbox();
    queuedInbox.data.quoteRequests = [
      {
        ...quoteRequest,
        crmSyncStatus: "queued" as const
      },
      {
        ...quoteRequest,
        id: "66666666-6666-4666-8666-666666666666",
        publicReference: "QR-20260603-FAILED",
        crmSyncStatus: "failed" as const
      }
    ];
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          record: {
            id: quoteRequest.id,
            type: "quoteRequest",
            crmProvider: "hubspot",
            crmSyncStatus: "not_queued"
          }
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          record: {
            id: "66666666-6666-4666-8666-666666666666",
            type: "quoteRequest",
            crmProvider: "hubspot",
            crmSyncStatus: "queued"
          }
        })
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={queuedInbox} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /return to not queued for QR-20260603-NEWEST/i
      })
    );
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /prepare retry later for QR-20260603-FAILED/i
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(4);
    });

    expect(JSON.stringify(fetcher.mock.calls)).toContain('\\"crmSyncStatus\\":\\"not_queued\\"');
    expect(JSON.stringify(fetcher.mock.calls)).toContain('\\"crmSyncStatus\\":\\"queued\\"');
  });

  it("disables the triage status submit button while an update is pending", async () => {
    let resolveStatusUpdate: ((value: Response) => void) | undefined;
    const statusUpdate = new Promise<Response>((resolve) => {
      resolveStatusUpdate = resolve;
    });
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockReturnValueOnce(statusUpdate);

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={loadedInbox()} />);

    const button = screen.getByRole("button", {
      name: /update internal triage status for QR-20260603-NEWEST/i
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    resolveStatusUpdate?.(
      createJsonResponse({
        ok: true,
        record: {
          id: quoteRequest.id,
          type: "quoteRequest"
        }
      })
    );
  });

  it("shows generic errors without provider details when proof or status update fails", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(
      createJsonResponse(
        {
          ok: false,
          error: "sql supabase stack token cookie workspace-secret"
        },
        {
          status: 403
        }
      )
    );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={loadedInbox()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /update internal triage status for QR-20260603-NEWEST/i
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/internal triage status could not be saved/i)
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/sql/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cookie/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/workspace-secret/i)).not.toBeInTheDocument();
  });

  it("shows generic CRM handoff failure without SQL or provider details", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            ok: false,
            error: "sql hubspot token env stack workspace-secret"
          },
          {
            status: 503
          }
        )
      );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={loadedInbox()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /mark ready for CRM handoff for QR-20260603-NEWEST/i
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/CRM handoff readiness could not be saved/i)
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/sql/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hubspot token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/workspace-secret/i)).not.toBeInTheDocument();
  });

  it("does not render status controls for unavailable or empty inbox states", () => {
    const unavailable = render(
      <QuoteRequestInboxPanel inbox={{ status: "unavailable" }} />
    );

    expect(
      screen.queryByRole("button", { name: /save status/i })
    ).not.toBeInTheDocument();
    unavailable.unmount();

    render(
      <QuoteRequestInboxPanel
        inbox={{
          status: "loaded",
          data: {
            quoteRequests: []
          }
        }}
      />
    );

    expect(
      screen.queryByRole("button", { name: /save status/i })
    ).not.toBeInTheDocument();
  });

  it("does not imply ecommerce or customer-facing quote tracking", () => {
    const forbiddenActionPattern = new RegExp(
      ["notify", "email", "send", "check" + "out", "pay" + "ment", "book", "reserve"].join("|"),
      "i"
    );

    render(<QuoteRequestInboxPanel inbox={loadedInbox()} />);

    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|confirmed booking|online ordering|customer-facing quote status|quote tracking/i
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/hubspot sync started|n8n workflow started|email sent/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: forbiddenActionPattern
      })
    ).not.toBeInTheDocument();
  });
});
