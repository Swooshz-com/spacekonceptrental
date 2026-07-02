import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import QuotePage from "../app/quote/page";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3gMergeCommit = "75fd104966e3e8c69a434f2325f6f79e4742a40f";
const phase3hMergeCommit = "09f92ede4b5d9f725d0df560838a12fef27940b9";
const phase3iMergeCommit = "0d2d40898c4e716032fdec130704117494c542d6";
const phase3jMergeCommit = "1c7dc0ac7c2532fa8a837cd46b0d1f0103d5ccfa";
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;

const dashboardData = {
  categories: [
    {
      id: "category-lounge",
      slug: "lounge",
      name: "Lounge",
      description: "Soft seating for receptions.",
      sortOrder: 1,
      isPublished: true,
      productCount: 1,
      publishedProductCount: 1
    },
    {
      id: "category-empty",
      slug: "empty",
      name: "Empty category",
      sortOrder: 2,
      isPublished: true,
      productCount: 0,
      publishedProductCount: 0
    }
  ],
  products: [
    {
      id: "product-lounge",
      categoryId: "category-lounge",
      slug: "lounge-sofa-package",
      name: "Lounge sofa package",
      shortDescription: "Modular lounge seating.",
      description: "A warm modular lounge setup for event receptions.",
      rentalUnit: "set",
      status: "published" as const,
      sortOrder: 1,
      imageCount: 2,
      primaryImageAltText: "Modular lounge sofa package"
    },
    {
      id: "product-draft",
      slug: "draft-plinth",
      name: "Draft plinth",
      rentalUnit: "item",
      status: "draft" as const,
      sortOrder: 2,
      imageCount: 0
    }
  ],
  images: [
    {
      id: "image-primary",
      productId: "product-lounge",
      storageBucket: "listing-media",
      storagePath: "lounge/primary.webp",
      altText: "Modular lounge sofa package",
      sortOrder: 1,
      isPrimary: true,
      status: "active" as const
    },
    {
      id: "image-missing-alt",
      productId: "product-lounge",
      storageBucket: "listing-media",
      storagePath: "lounge/detail.webp",
      sortOrder: 2,
      isPrimary: false,
      status: "active" as const
    }
  ],
  imageSummary: {
    totalImages: 2,
    activeImages: 2,
    primaryImages: 1
  }
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

const authorisedState = {
  status: "authorised_admin" as const,
  dashboard: {
    status: "loaded" as const,
    data: dashboardData
  },
  quoteInbox: {
    status: "loaded" as const,
    data: {
      quoteRequests: [quoteRequestReadyForFollowUp]
    }
  },
  quoteDetail: {
    status: "loaded" as const,
    data: {
      quoteRequest: quoteRequestReadyForFollowUp
    }
  }
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

function renderAdminView(view: Parameters<typeof AdminShellContent>[0]["view"]) {
  render(<AdminShellContent state={authorisedState} view={view} />);
}

describe("Phase 3H-A/B admin operator QA readiness polish", () => {
  afterEach(() => {
    cleanup();
  });

  it("records Phase 3H-A/B as completed after Phase 3J starts", () => {
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
    expect(status).toContain("No deployment is performed or approved");
    expect(roadmap).toContain(
      "Phase 3H-A/B adds admin operator QA, dashboard consistency, and non-deployment release readiness polish"
    );
    expect(readiness).toContain("Current Phase 3K-A/B status");
    expect(readiness).toContain("Previous Current Phase 3J-A/B status");
    expect(readiness).toContain("Previous Current Phase 3I-A/B status");
    expect(readiness).toContain("Previous Current Phase 3H-A/B status");
    expect(readiness).toContain("Previous Current Phase 3G-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3H-A/B adds admin operator QA, dashboard consistency, and non-deployment release readiness polish."
    );
    expect(checklist).toContain(
      "## Phase 3H-A/B Admin Operator QA Dashboard Consistency And Non-Deployment Release Readiness Polish"
    );
    expect(validator).toContain(phase3gMergeCommit);
    expect(validator).toContain(phase3hMergeCommit);
    expect(validator).toContain(phase3jMergeCommit);
    expect(validator).toContain("Phase 3K-A/B");
    expect(validator).toContain("Phase 3I-A/B");
    expect(validator).toContain("Phase 3H-A/B");
    expect(validator).not.toMatch(/\bvercel\s+(?:deploy|link|env|pull|promote)\b/i);
  });

  it("shows the compact admin overview content-manager guidance and safe next action", () => {
    renderAdminView({ kind: "home" });

    expect(
      screen.getByRole("heading", { name: /quick status/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /quick actions/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^hero image$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^catalogue$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^setups$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /delivery log.*open/i })
    ).toHaveAttribute("href", "/admin/delivery-log");
    expect(
      screen.queryByRole("link", { name: /quote inbox/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/operator qa summary/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/quote requests for the visible rental enquiry journey/i)
    ).not.toBeInTheDocument();
  });

  it("aligns listing, category, media, quote inbox, and quote detail guidance", () => {
    renderAdminView({ kind: "listings" });

    expect(
      screen.getByLabelText(/listing operations operator guidance/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/write-enabled listing metadata/i)).toBeInTheDocument();
    expect(
      screen.getByText(/public-facing after publication/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/next safe action: fix missing category, descriptions, rental unit, and media before publishing/i)
    ).toBeInTheDocument();

    cleanup();
    renderAdminView({ kind: "categories" });

    expect(
      screen.getByLabelText(/category operations operator guidance/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/write-enabled category metadata/i)).toBeInTheDocument();
    expect(
      screen.getByText(/public-facing category grouping/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/next safe action: keep empty published categories unpublished or add published listings/i)
    ).toBeInTheDocument();

    cleanup();
    renderAdminView({ kind: "media" });

    expect(
      screen.getByLabelText(/media operations operator guidance/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/write-enabled image upload and metadata/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/public-facing active media/i)).toBeInTheDocument();
    expect(
      screen.getByText(/next safe action: add alt text and keep one active primary image per listing/i)
    ).toBeInTheDocument();

    cleanup();
    renderAdminView({ kind: "quotes" });

    expect(
      screen.getByLabelText(/quote request inbox operator guidance/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/write-enabled internal triage status only/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/admin-only triage/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/next safe action: capture contact, event, venue, and requested items before closing follow-up/i)
    ).toBeInTheDocument();

    cleanup();
    renderAdminView({
      kind: "quote-detail",
      quoteRequestId: quoteRequestReadyForFollowUp.id
    });

    expect(
      screen.getByLabelText(/quote detail operator guidance/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/read-only customer submission snapshot/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/write-enabled follow-up controls remain below via the protected quote request panel/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/next safe action: review details, then record an internal note or status change inside the protected workspace/i)
    ).toBeInTheDocument();
  });

  it("keeps admin recovery routes admin-only and public pages free of internal cues", async () => {
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: { status: "unavailable" },
          quoteInbox: { status: "unavailable" },
          quoteDetail: { status: "not_found" }
        }}
        view={{
          kind: "quote-detail",
          quoteRequestId: "70000000-0000-4000-8000-000000000001"
        }}
      />
    );

    const recovery = screen.getByLabelText(/admin recovery/i);
    expect(
      within(recovery).getByRole("link", { name: /back to quote requests/i })
    ).toHaveAttribute("href", "/admin/quotes");

    cleanup();
    render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "lounge-sofa-package" })
      })
    );

    expect(
      screen.queryByText(
        /operator qa|admin-only triage|internal activity|internal note|protected admin routes|\/admin\/quotes/i
      )
    ).not.toBeInTheDocument();
  });

  it("keeps Phase 3H inside admin operator QA and non-deployment readiness scope", () => {
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
    const publicSource = readTrackedProductionSources([
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/components/QuoteRequestForm.tsx"
    ]);
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");

    expect(productionSource).not.toMatch(forbiddenCommercePattern);
    expect(publicSource).not.toMatch(
      /operator qa|admin-only triage|internal quote notes|admin management urls|\/admin\/quotes/i
    );
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toMatch(/service-role/i);
    expect(productionSource).not.toMatch(/notification|hubspot api|api\.hubapi|crm sync job|crm integration/i);
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(productionSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", "website/vercel.json", ".vercel"])).toEqual([]);
    expect(readTrackedFiles(["supabase/config.toml", "supabase/.branches"])).toEqual([]);
    expect(readTrackedFiles([".env", ".env.local", "website/.env", "website/.env.local"])).toEqual([]);
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
