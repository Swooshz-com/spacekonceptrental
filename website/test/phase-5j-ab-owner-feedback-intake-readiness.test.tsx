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
const ownerFeedbackIntakeDocPath =
  "docs/content/LOCAL-OWNER-FEEDBACK-INTAKE-READINESS.md";
const correctionQueueDocPath =
  "docs/content/LOCAL-OWNER-CORRECTION-QUEUE-RECONCILIATION.md";
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

describe("Phase 5J-A/B owner feedback intake readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected owner-feedback readiness helper only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedState} view={{ kind: "content-readiness" }} />);

    expect(
      screen.getByRole("heading", {
        name: /owner-feedback intake readiness helper/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(ownerFeedbackIntakeDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(correctionQueueDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(ownerWalkthroughDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(routeMatrixDocPath).length).toBeGreaterThan(0);
    expect(screen.getByText(/public copy correction/i)).toBeInTheDocument();
    expect(
      screen.getByText(/capture raw owner comment separately/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/blocked: claim unsupported/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/\[deployment approval: not granted\]/i).length,
    ).toBeGreaterThan(0);
  });

  it("does not render the protected owner-feedback helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "content-readiness" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /owner-feedback intake readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(ownerFeedbackIntakeDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(correctionQueueDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to the Phase 5J and Phase 5I docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(ownerFeedbackIntakeDocPath);
    expect(adminSource).toContain(correctionQueueDocPath);
    expect(adminSource).toContain(ownerWalkthroughDocPath);
    expect(adminSource).toContain(routeMatrixDocPath);
    expect(adminSource).toMatch(/Phase 5J-A\/B admin-only feedback intake readiness/i);
  });

  it("keeps public source free of owner-feedback, correction, admin route, handoff, and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /owner feedback intake helper|owner-feedback intake helper|correction queue reconciliation|owner-review walkthrough helper|full-route acceptance matrix|admin route\/view checklist|internal notes|release-control internals|owner handoff internals|owner approval issue template|no-deploy command-center|admin urls?|public admin status|\/admin\//i,
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

  it("keeps Phase 5J docs as template-only no-evidence no-deploy materials", () => {
    const docs = `${readRepoFile(ownerFeedbackIntakeDocPath)}\n${readRepoFile(
      correctionQueueDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /owner approved|owner sign-?off complete|actual owner decision|actual owner feedback|accepted by owner|rejected by owner|preview evidence captured|production evidence captured|smoke evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|public launch evidence captured|sign-off evidence captured/i,
    );
  });

  it("registers the Phase 5J validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:owner-feedback-intake-readiness"],
    ).toBe("node scripts/validate-owner-feedback-intake-readiness.cjs");
    expect(suite).toContain(
      "args: ['run', 'validate:owner-feedback-intake-readiness']",
    );
    expect(suite).not.toMatch(
      /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i,
    );
  });
});
