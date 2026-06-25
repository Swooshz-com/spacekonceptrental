import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import QuotePage from "../app/quote/page";
import { AdminShellContent } from "../app/admin/protected-admin-shell";
import { QuoteRequestInboxPanel } from "../components/admin/quote-request-inbox-panel";
import QuoteRequestForm from "../components/QuoteRequestForm";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3fMergeCommit = "69665bb241b1af5c05ad34ac1464cdaeece8b7f8";
const phase3gMergeCommit = "75fd104966e3e8c69a434f2325f6f79e4742a40f";
const phase3hMergeCommit = "09f92ede4b5d9f725d0df560838a12fef27940b9";
const phase3iMergeCommit = "0d2d40898c4e716032fdec130704117494c542d6";
const phase3jMergeCommit = "1c7dc0ac7c2532fa8a837cd46b0d1f0103d5ccfa";
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;

const quoteRequestMissingTriageData = {
  id: "77777777-7777-4777-8777-777777777777",
  publicReference: "QR-20260607-MISSING",
  customerName: "Maya Tan",
  status: "new" as const,
  source: "website" as const,
  createdAt: "2026-06-07T10:30:00.000Z",
  items: [],
  activity: []
};

const quoteRequestReadyForFollowUp = {
  id: "88888888-8888-4888-8888-888888888888",
  publicReference: "QR-20260607-READY",
  customerName: "Darren Lee",
  customerEmail: "darren@example.test",
  customerPhone: "+65 8123 4567",
  customerMessage: "Need a warm lounge setup for a reception.",
  eventDate: "2026-06-20",
  venue: "Suntec Singapore",
  status: "reviewing" as const,
  source: "website" as const,
  createdAt: "2026-06-07T11:30:00.000Z",
  updatedAt: "2026-06-07T11:45:00.000Z",
  items: [
    {
      id: "99999999-9999-4999-8999-999999999999",
      quoteRequestId: "88888888-8888-4888-8888-888888888888",
      productNameSnapshot: "Modular lounge set",
      quantity: 2,
      notes: "VIP reception area",
      createdAt: "2026-06-07T11:31:00.000Z"
    }
  ],
  activity: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      quoteRequestId: "88888888-8888-4888-8888-888888888888",
      activityType: "internal_note" as const,
      note: "Review requested quantities before follow-up.",
      createdAt: "2026-06-07T11:45:00.000Z"
    }
  ]
};

const quoteRequestArchived = {
  ...quoteRequestReadyForFollowUp,
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  publicReference: "QR-20260607-ARCHIVED",
  status: "archived" as const,
  customerName: "Archived lead"
};

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function readTrackedFiles(paths: string[]) {
  return execFileSync("git", ["ls-files", "--", ...paths], {
    cwd: repoRoot,
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

function isProductionSource(filePath: string) {
  return (
    sourceExtensions.has(extname(filePath)) &&
    !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath) &&
    !filePath.startsWith("website/test/")
  );
}

function readTrackedProductionSources(paths: string[]) {
  return readTrackedFiles(paths)
    .filter(isProductionSource)
    .map((filePath) => readRepoFile(filePath))
    .join("\n");
}

function renderLoadedQuoteInbox() {
  render(
    <QuoteRequestInboxPanel
      inbox={{
        status: "loaded",
        data: {
          quoteRequests: [
            quoteRequestMissingTriageData,
            quoteRequestReadyForFollowUp,
            quoteRequestArchived
          ]
        }
      }}
    />
  );
}

describe("Phase 3G-A/B quote intake quality, admin triage depth, and enquiry workflow polish", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3G-A/B as completed after Phase 3J starts", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const validator = readRepoFile("scripts/validate-preview-handoff.cjs");

    expect(status).toContain(
      "Current phase: Phase 3K-A/B - owner content intake, content gap register, and launch-blocker governance."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3J-A/B owner review readiness package, manual QA runbook, and release-decision preparation."
    );
    expect(status).toContain("Last merged capability PR: #132");
    expect(status).toContain(`Merge commit: \`${phase3jMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3J-A/B status");
    expect(status).toContain("Previous Current Phase 3I-A/B status");
    expect(status).toContain("Previous Current Phase 3H-A/B status");
    expect(status).toContain("Previous Current Phase 3G-A/B status");
    expect(status).toContain("Previous Current Phase 3F-A/B status");
    expect(status).toContain("Previous Current Phase 3E-A/B status");
    expect(status).toContain("No deployment is performed or approved");
    expect(roadmap).toContain(
      "Phase 3G-A/B adds quote intake quality, admin triage depth, and enquiry workflow polish"
    );
    expect(readiness).toContain("Current Phase 3K-A/B status");
    expect(readiness).toContain("Previous Current Phase 3J-A/B status");
    expect(readiness).toContain("Previous Current Phase 3I-A/B status");
    expect(readiness).toContain("Previous Current Phase 3H-A/B status");
    expect(readiness).toContain("Previous Current Phase 3G-A/B status");
    expect(readiness).toContain("Previous Current Phase 3F-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3G-A/B adds quote intake quality, admin triage depth, and enquiry workflow polish."
    );
    expect(checklist).toContain(
      "## Phase 3G-A/B Quote Intake Quality Admin Triage Depth And Enquiry Workflow Polish"
    );
    expect(validator).toContain(phase3fMergeCommit);
    expect(validator).toContain(phase3gMergeCommit);
    expect(validator).toContain(phase3hMergeCommit);
    expect(validator).toContain(phase3jMergeCommit);
    expect(validator).toContain("Phase 3K-A/B");
    expect(validator).toContain("Phase 3I-A/B");
    expect(validator).toContain("Phase 3H-A/B");
    expect(validator).not.toMatch(/\bvercel\s+(?:deploy|link|env|pull|promote)\b/i);
  });

  it("improves public quote form helper copy, validation, and receipt-only success", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          status: "received",
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260607-ABC12345"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 201
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);
    render(<QuoteRequestForm initialItemsText="Modular Lounge Set" />);

    expect(
      screen.getByText(/share one reliable contact method/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/listing context is a starting point only/i).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/not a rental fit confirmation/i)).toBeInTheDocument();
    expect(
      screen.getByText(/the team uses this only for direct quote follow-up/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/event vision/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(/share an email address or phone number/i);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(/enquiry received/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /track|status/i })
    ).not.toBeInTheDocument();
  });

  it("keeps selected-listing handoff useful without implying reservations or exposing admin context", async () => {
    render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "lounge-sofa-package" })
      })
    );

    expect(
      screen.getByRole("heading", { name: /selected listing unavailable/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/listing context is a starting point only/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/does not set aside furniture or finish rental details/i)
      .length
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue(
      "Listing reference: lounge-sofa-package"
    );
    expect(
      screen.getByText("lounge-sofa-package", { selector: "dd" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/publication readiness|media readiness|internal note|admin-only/i)
    ).not.toBeInTheDocument();

    cleanup();
    render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "unpublished-draft-listing" })
      })
    );

    expect(
      screen.getByRole("heading", { name: /selected listing unavailable/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the listing link may be old or unavailable/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue(
      "Listing reference: unpublished-draft-listing"
    );
  });

  it("shows deeper admin-only quote triage summaries and next-action cues", () => {
    renderLoadedQuoteInbox();

    expect(screen.getByText(/quote triage summary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/follow-up needed/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/contact gaps/i)).toBeInTheDocument();
    expect(screen.getByText(/missing event dates/i)).toBeInTheDocument();
    expect(screen.getByText(/missing venues/i)).toBeInTheDocument();
    expect(screen.getByText(/missing requested items/i)).toBeInTheDocument();
    expect(screen.getByText(/missing customer messages/i)).toBeInTheDocument();
    expect(screen.getByText(/without internal activity/i)).toBeInTheDocument();
    expect(screen.getAllByText(/next action/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/review submitted details for a contact method before manual follow-up/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/continue manual review, contact the visitor manually if details need confirmation/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/closed enquiry is retained for admin reference/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/public quote tracking|customer-visible internal notes/i)
    ).not.toBeInTheDocument();
  });

  it("makes quote detail readable and gives safe recovery copy", () => {
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
          },
          quoteDetail: {
            status: "loaded",
            data: {
              quoteRequest: quoteRequestReadyForFollowUp
            }
          }
        }}
        view={{
          kind: "quote-detail",
          quoteRequestId: quoteRequestReadyForFollowUp.id
        }}
      />
    );

    expect(
      screen.getAllByRole("heading", { name: /contact and follow-up/i }).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("QR-20260607-READY").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Darren Lee").length).toBeGreaterThan(0);
    expect(screen.getAllByText("darren@example.test").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+65 8123 4567").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Suntec Singapore").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", { name: /requested listings and items/i })
        .length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/2 x Modular lounge set/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", { name: /admin-only status and notes/i })
        .length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/review requested quantities before follow-up/i).length
    ).toBeGreaterThan(0);

    cleanup();
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
          },
          quoteDetail: {
            status: "not_found"
          }
        }}
        view={{
          kind: "quote-detail",
          quoteRequestId: "70000000-0000-4000-8000-000000000001"
        }}
      />
    );

    expect(
      screen.getByText(/not visible in this workspace/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/sql|supabase|stack|workspace-secret/i)
    ).not.toBeInTheDocument();
  });

  it("keeps Phase 3G inside quote intake/admin triage scope", () => {
    const productionSource = readTrackedProductionSources([
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/admin",
      "website/app/api",
      "website/components",
      "website/lib/catalogue",
      "website/lib/quote"
    ]);
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");

    expect(productionSource).not.toMatch(forbiddenCommercePattern);
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toMatch(/service-role/i);
    expect(productionSource).not.toMatch(/notification|hubspot api|api\.hubapi|crm sync job|crm integration/i);
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(productionSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", "website/vercel.json", ".vercel"])).toEqual([]);
    expect(readTrackedFiles(["supabase/config.toml", "supabase/.branches"])).toEqual([]);
    expect(readTrackedFiles(["docs/evidence", "docs/production-evidence"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-accounts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-tracking"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/crm"])).toEqual([]);
  });
});
