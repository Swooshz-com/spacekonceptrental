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
const ownerDecisionIntakeReadinessDocPath =
  "docs/content/LOCAL-OWNER-DECISION-INTAKE-READINESS.md";
const signoffCriteriaLedgerTemplateDocPath =
  "docs/content/LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE.md";
const ownerReReviewRequestReadinessDocPath =
  "docs/content/LOCAL-OWNER-RE-REVIEW-REQUEST-READINESS.md";
const correctionDeltaPacketTemplateDocPath =
  "docs/content/LOCAL-CORRECTION-DELTA-PACKET-TEMPLATE.md";
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

describe("Phase 5M-A/B owner decision intake readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5M owner decision intake readiness helper only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedState} />);

    expect(
      screen.getByRole("heading", {
        name: /owner decision intake readiness helper/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(ownerDecisionIntakeReadinessDocPath)).toBeInTheDocument();
    expect(screen.getByText(signoffCriteriaLedgerTemplateDocPath)).toBeInTheDocument();
    expect(screen.getAllByText(ownerReReviewRequestReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(correctionDeltaPacketTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByText(/safe future decision intake sections/i)).toBeInTheDocument();
    expect(screen.getByText(/owner decision source reference/i)).toBeInTheDocument();
    expect(screen.getByText(/sign-off criteria ledger placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/criterion id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getByText(/allowed future decision statuses/i)).toBeInTheDocument();
    expect(screen.getAllByText(/blocked: deployment approval missing/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no-launch\/no-deploy boundaries/i)).toBeInTheDocument();
    expect(screen.getAllByText(/a future owner decision is not deployment approval unless explicitly separate/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no owner decision is recorded here/i)).toBeInTheDocument();
    expect(screen.getByText(/no owner approval is recorded here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no owner sign-off is claimed here/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no launch clearance is granted here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no deployment approval is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5M helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} />);

      expect(
        screen.queryByRole("heading", {
          name: /owner decision intake readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(ownerDecisionIntakeReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(signoffCriteriaLedgerTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5M and Phase 5L docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(ownerDecisionIntakeReadinessDocPath);
    expect(adminSource).toContain(signoffCriteriaLedgerTemplateDocPath);
    expect(adminSource).toContain(ownerReReviewRequestReadinessDocPath);
    expect(adminSource).toContain(correctionDeltaPacketTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5M-A\/B admin-only owner decision intake readiness/i);
  });

  it("keeps public production source free of Phase 5M, Phase 5L, admin, handoff, and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /owner decision intake|decision intake readiness|sign-off criteria ledger|owner re-review request|re-review request readiness|correction delta packet|admin route\/view checklist|internal notes|release-control internals|owner handoff internals|owner approval issue template|no-deploy command-center|admin urls?|public admin status|\/admin\//i,
    );
  });

  it("keeps public production source rental/enquiry-only, non-promissory, and free of customer-flow creep", () => {
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

  it("keeps Phase 5M docs template-only with no evidence and no deployment approval", () => {
    const docs = `${readRepoFile(ownerDecisionIntakeReadinessDocPath)}\n${readRepoFile(
      signoffCriteriaLedgerTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner sign-off recorded|preview evidence captured|production evidence captured|response-sent evidence captured|correction-completed evidence captured|deployment approval granted|launch approval granted|launch clearance granted/i,
    );
  });

  it("registers the Phase 5M validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:owner-decision-intake-readiness"],
    ).toBe("node scripts/validate-owner-decision-intake-readiness.cjs");
    expect(suite).toContain(
      "args: ['run', 'validate:owner-decision-intake-readiness']",
    );
    expect(suite).not.toMatch(
      /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i,
    );
  });
});
