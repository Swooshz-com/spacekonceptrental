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
const ownerWalkthroughDocPath =
  "docs/content/LOCAL-OWNER-REVIEW-WALKTHROUGH-READINESS.md";
const routeMatrixDocPath =
  "docs/content/LOCAL-FULL-ROUTE-ACCEPTANCE-MATRIX.md";
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
      categories: [],
      products: [],
      images: [],
      imageSummary: {
        totalImages: 0,
        activeImages: 0,
        primaryImages: 0,
      },
    },
  },
  quoteInbox: {
    status: "loaded",
    data: {
      quoteRequests: [],
    },
  },
};

describe("Phase 5I-A/B owner-review walkthrough readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected owner-review walkthrough helper only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedState} />);

    expect(
      screen.getByRole("heading", {
        name: /owner-review walkthrough readiness helper/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(ownerWalkthroughDocPath)).toBeInTheDocument();
    expect(screen.getByText(routeMatrixDocPath)).toBeInTheDocument();
    expect(screen.getByText(/public homepage walkthrough/i)).toBeInTheDocument();
    expect(
      screen.getByText(/protected admin quote inbox\/triage walkthrough/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/contact details still missing/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/\[deployment approval: not granted\]/i),
    ).toBeInTheDocument();
  });

  it("does not render the protected walkthrough helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} />);

      expect(
        screen.queryByRole("heading", {
          name: /owner-review walkthrough readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(ownerWalkthroughDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(routeMatrixDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to the Phase 5I docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(ownerWalkthroughDocPath);
    expect(adminSource).toContain(routeMatrixDocPath);
    expect(adminSource).toMatch(/Phase 5I-A\/B admin-only walkthrough readiness/i);
  });

  it("keeps public source free of owner-review, admin route, handoff, and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /owner-review walkthrough helper|full-route acceptance matrix|admin route\/view checklist|internal notes|release-control internals|owner handoff internals|owner approval issue template|no-deploy command-center|admin urls?|public admin status|\/admin\//i,
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

  it("keeps Phase 5I docs as template-only no-evidence no-deploy materials", () => {
    const docs = `${readRepoFile(ownerWalkthroughDocPath)}\n${readRepoFile(
      routeMatrixDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /owner approved|owner sign-?off complete|actual owner decision|accepted by owner|preview evidence captured|production evidence captured|smoke evidence captured|route-walkthrough evidence captured|public launch evidence captured|sign-off evidence captured/i,
    );
  });

  it("registers the Phase 5I validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:owner-review-walkthrough-readiness"],
    ).toBe("node scripts/validate-owner-review-walkthrough-readiness.cjs");
    expect(suite).toContain(
      "args: ['run', 'validate:owner-review-walkthrough-readiness']",
    );
    expect(suite).not.toMatch(
      /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i,
    );
  });
});
