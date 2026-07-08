import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  AdminShellContent,
  type ProtectedAdminShellState,
} from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const publicSourceRoots = [
  "website/app/layout.tsx",
  "website/app/page.tsx",
  "website/app/listings",
  "website/app/categories",
  "website/app/catalogue",
  "website/app/events",
  "website/app/quote",
  "website/app/not-found.tsx",
  "website/components/QuoteRequestForm.tsx",
];
const adminSourcePaths = [
  "website/components/admin/listing-management-panel.tsx",
  "website/components/admin/category-management-panel.tsx",
  "website/components/admin/listing-image-metadata-management-panel.tsx",
  "website/components/admin/listing-image-upload-panel.tsx",
];
const sourceExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function gitLsFiles(paths: string[]) {
  const result = spawnSync("git", ["ls-files", "--", ...paths], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "git ls-files failed");
  }

  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function isProductionSource(path: string) {
  return (
    sourceExtensions.has(extname(path)) &&
    !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(path) &&
    !path.startsWith("website/test/")
  );
}

function readTrackedProductionSources(paths: string[]) {
  return gitLsFiles(paths)
    .filter(isProductionSource)
    .map((path) => `${path}\n${readRepoFile(path)}`)
    .join("\n");
}

const authorisedState: ProtectedAdminShellState = {
  status: "authorised_admin",
  dashboard: {
    status: "loaded",
    data: {
      categories: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          slug: "lounge",
          name: "Lounge",
          description: "Flexible seating grouping.",
          sortOrder: 10,
          isPublished: true,
          productCount: 1,
          publishedProductCount: 1,
        },
      ],
      products: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          categoryId: "11111111-1111-4111-8111-111111111111",
          slug: "modular-lounge",
          name: "Modular Lounge",
          shortDescription: "Soft modular seating.",
          description: "Flexible modular lounge setup for event enquiries.",
          rentalUnit: "set",
          status: "draft",
          sortOrder: 20,
          imageCount: 1,
          primaryImageAltText: "Modular lounge setup",
        },
      ],
      images: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          productId: "22222222-2222-4222-8222-222222222222",
          storageBucket: "local-review-media",
          storagePath: "modular-lounge.webp",
          altText: "Modular lounge setup",
          sortOrder: 1,
          isPrimary: true,
          status: "active",
        },
      ],
      imageSummary: {
        totalImages: 1,
        activeImages: 1,
        primaryImages: 1,
      },
    },
  },
};

describe("Phase 5H-A/B catalogue write workflow readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders protected admin listing, category, and media write helper copy only for authorised admin state", () => {
    render(
      <AdminShellContent state={authorisedState} view={{ kind: "catalogue" }} />,
    );

    expect(screen.getAllByText(/protected admin save/i).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("heading", { name: /create listing/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /existing listings/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create listing/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /select files/i }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /save listing metadata/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save category metadata/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save image metadata/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /upload listing image for review/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/save the listing first/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/uploaded images/i).length,
    ).toBeGreaterThan(0);
  });

  it("does not render protected write workflow helper copy for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} />);

      expect(
        screen.queryByText(/protected admin save/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/public-safe copy review/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /create listing/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /save listing metadata/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /save category metadata/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /save image metadata/i }),
      ).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source focused on safe write controls, validation, save, and visible MVP wording", () => {
    const adminSource = readTrackedProductionSources(adminSourcePaths);

    for (const required of [
      /Protected admin save/i,
      /Save listing metadata/i,
      /Save category metadata/i,
      /Save image metadata/i,
      /public-safe copy review/i,
      /Public-ready listing helper/i,
      /Category visibility review/i,
      /Media coverage/i,
      /validation errors/i,
      /only updates listing metadata/i,
    ]) {
      expect(adminSource).toMatch(required);
    }
  });

  it("keeps admin success and error copy away from deployment, launch, owner-approval, and evidence claims", () => {
    const adminSource = readTrackedProductionSources(adminSourcePaths);

    expect(adminSource).toMatch(/metadata saved for protected admin review/i);
    expect(adminSource).toMatch(/Protected admin save could not be completed/i);
    expect(adminSource).not.toMatch(
      /deployed successfully|launch complete|production published|owner approved|owner-approved|evidence created|write-success evidence captured|publish live/i,
    );
  });

  it("keeps public source free of admin write helpers, validation details, internal notes, and admin URLs", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /admin listing write helper|admin category write helper|admin media write helper|protected admin save|admin validation details|internal notes|release-control internals|owner handoff internals|admin urls?|public admin status|\/admin\//i,
    );
  });

  it("keeps public source rental/enquiry-only, non-promissory, and free of fake facts or customer-flow creep", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).toMatch(/listing|listings/i);
    expect(publicSource).toMatch(/rental|rentals/i);
    expect(publicSource).toMatch(/quote|enquiry|request/i);
    expect(publicSource).not.toMatch(
      /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i,
    );
    expect(publicSource).not.toMatch(
      /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i,
    );
    expect(publicSource).not.toMatch(
      /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i,
    );
    expect(publicSource).not.toMatch(
      /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i,
    );
  });

  it("keeps media and admin source non-promissory and provider/runtime safe", () => {
    const adminSource = readTrackedProductionSources(adminSourcePaths);

    expect(adminSource).toMatch(/Media metadata is review context only/i);
    expect(adminSource).not.toMatch(
      /owner-approved media|confirmed owner-approved media|final styling|final availability|real inventory confirmation|production media/i,
    );
    expect(adminSource).not.toMatch(
      /public upload|customer upload|new storage provider|external image service|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    );
  });

  it("registers the Phase 5H validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:catalogue-write-workflow-readiness"],
    ).toBe("node scripts/validate-catalogue-write-workflow-readiness.cjs");
    expect(suite).toContain(
      "args: ['run', 'validate:catalogue-write-workflow-readiness']",
    );
    expect(suite).not.toMatch(
      /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i,
    );
  });
});
