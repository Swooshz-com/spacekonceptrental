import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const publicCatalogueSourceRoots = [
  "website/app/layout.tsx",
  "website/app/page.tsx",
  "website/app/listings",
  "website/app/categories",
  "website/app/catalogue",
  "website/app/events",
  "website/app/quote",
  "website/app/not-found.tsx",
  "website/components/QuoteRequestForm.tsx"
];
const adminCatalogueSourceRoots = [
  "website/app/admin",
  "website/components/admin/listing-management-panel.tsx",
  "website/components/admin/category-management-panel.tsx",
  "website/components/admin/listing-image-metadata-management-panel.tsx",
  "website/components/admin/listing-image-upload-panel.tsx"
];
const forbiddenPublicInternalPattern = /catalogue content-ops readiness helper|admin catalogue readiness helper|media checklist|internal notes|release-control internals|owner handoff internals|admin urls?|public admin status|\/admin\//i;
const forbiddenPublicFlowPattern = /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i;
const forbiddenRentalCompletionPattern = /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i;
const forbiddenFakeFactPattern = /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i;
const forbiddenPublicScopePattern = /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|outbound messaging|email sending|sms sending|whatsapp/i;
const forbiddenAdminRuntimePattern = /public upload|customer upload|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i;
const forbiddenMediaPromisePattern = /owner-approved media|final styling|final availability|real inventory confirmation|confirmed owner-approved media/i;
const dockerBypassPattern = /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i;

const authorisedAdminState = {
  status: "authorised_admin" as const,
  dashboard: {
    status: "loaded" as const,
    data: {
      categories: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          slug: "lounge",
          name: "Lounge seating",
          description: "Seating for event lounge layouts.",
          sortOrder: 1,
          isPublished: true,
          productCount: 1,
          publishedProductCount: 1
        }
      ],
      products: [
        {
          id: "20000000-0000-4000-8000-000000000001",
          categoryId: "10000000-0000-4000-8000-000000000001",
          slug: "modular-lounge-set",
          name: "Modular lounge set",
          shortDescription: "Flexible seating for event layouts.",
          description: "A configurable lounge set for enquiry planning.",
          rentalUnit: "set",
          status: "published" as const,
          sortOrder: 1,
          imageCount: 1,
          primaryImageAltText: "Modular lounge set arranged for an event space"
        }
      ],
      images: [
        {
          id: "30000000-0000-4000-8000-000000000001",
          productId: "20000000-0000-4000-8000-000000000001",
          storageBucket: "listing-media",
          storagePath: "local/modular-lounge-set.jpg",
          altText: "Modular lounge set arranged for an event space",
          sortOrder: 1,
          isPrimary: true,
          status: "active" as const
        }
      ],
      imageSummary: { totalImages: 1, activeImages: 1, primaryImages: 1 }
    }
  },
  quoteInbox: {
    status: "loaded" as const,
    data: { quoteRequests: [] }
  }
};

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
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

function readProductionSource(paths: string[]) {
  return readTrackedFiles(paths)
    .filter(isProductionSource)
    .map((filePath) => `${filePath}\n${readRepoFile(filePath)}`)
    .join("\n");
}

describe("Phase 5G-A/B catalogue content review", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected admin catalogue content review only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "listings" }} />);

    expect(screen.getByRole("heading", { name: /catalogue content review/i })).toBeInTheDocument();
    expect(screen.getByText(/Listings, categories, media, quote request handoff/i)).toBeInTheDocument();
    expect(screen.getByText(/Content completeness:/i)).toBeInTheDocument();
    expect(screen.getByText(/Media coverage:/i)).toBeInTheDocument();
    expect(screen.getByText(/Public-safe copy:/i)).toBeInTheDocument();
    expect(screen.getByText(/Quote\/enquiry handoff:/i)).toBeInTheDocument();
    expect(screen.getByText(/Visible MVP boundary:/i)).toBeInTheDocument();
  });

  it("does not render the helper for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const view = render(<AdminShellContent state={state} view={{ kind: "listings" }} />);

      expect(screen.queryByRole("heading", { name: /catalogue content review/i })).not.toBeInTheDocument();
      view.unmount();
    }
  });

  it("keeps admin source explicit about safe catalogue, media, and quote request wording", () => {
    const adminSource = readProductionSource(adminCatalogueSourceRoots);

    expect(adminSource).toMatch(/Catalogue content review/i);
    expect(adminSource).toMatch(/Content completeness/i);
    expect(adminSource).toMatch(/Media coverage/i);
    expect(adminSource).toMatch(/Public-safe copy/i);
    expect(adminSource).toMatch(/Quote\/enquiry handoff/i);
    expect(adminSource).toMatch(/Business input to confirm/i);
    expect(adminSource).toMatch(/Claims still blocked/i);
    expect(adminSource).toMatch(/Public visibility\/status review/i);
  });

  it("keeps public catalogue source free of admin readiness internals", () => {
    const publicSource = readProductionSource(publicCatalogueSourceRoots);

    expect(publicSource).not.toMatch(forbiddenPublicInternalPattern);
    expect(publicSource).not.toMatch(/destructive-action safeguards|recovery lanes?|status-transition matrix/i);
  });

  it("keeps public source rental/enquiry only, non-promissory, and free of fake facts or added public operations", () => {
    const publicSource = readProductionSource(publicCatalogueSourceRoots);

    expect(publicSource).toMatch(/listing|listings/i);
    expect(publicSource).toMatch(/rental|rentals/i);
    expect(publicSource).toMatch(/quote|enquiry|request/i);
    expect(publicSource).not.toMatch(forbiddenPublicFlowPattern);
    expect(publicSource).not.toMatch(forbiddenRentalCompletionPattern);
    expect(publicSource).not.toMatch(forbiddenFakeFactPattern);
    expect(publicSource).not.toMatch(forbiddenPublicScopePattern);
  });

  it("keeps media and admin runtime copy within safe local boundaries", () => {
    const adminSource = readProductionSource(adminCatalogueSourceRoots);

    expect(adminSource).not.toMatch(forbiddenMediaPromisePattern);
    expect(adminSource).not.toMatch(forbiddenAdminRuntimePattern);
  });

  it("registers the catalogue content-ops validator and keeps the release suite non-bypassing", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(packageJson.scripts["validate:catalogue-content-ops-readiness"]).toBe(
      "node scripts/validate-catalogue-content-ops-readiness.cjs"
    );
    expect(suite).toContain("args: ['run', 'validate:catalogue-content-ops-readiness']");
    expect(suite).not.toMatch(dockerBypassPattern);
  });
});
