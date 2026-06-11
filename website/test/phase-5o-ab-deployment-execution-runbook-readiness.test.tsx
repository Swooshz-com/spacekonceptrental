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
const deploymentExecutionRunbookReadinessDocPath =
  "docs/content/LOCAL-DEPLOYMENT-EXECUTION-RUNBOOK-READINESS.md";
const providerEnvDecisionMatrixTemplateDocPath =
  "docs/content/LOCAL-PROVIDER-ENV-DECISION-MATRIX-TEMPLATE.md";
const deploymentApprovalRequestReadinessDocPath =
  "docs/content/LOCAL-DEPLOYMENT-APPROVAL-REQUEST-READINESS.md";
const preLaunchBlockerLedgerTemplateDocPath =
  "docs/content/LOCAL-PRE-LAUNCH-BLOCKER-LEDGER-TEMPLATE.md";
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
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

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

describe("Phase 5O-A/B deployment execution runbook readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5O helper and full helper chain for authorised admin home state", () => {
    render(<AdminShellContent state={authorisedState} view={{ kind: "home" }} />);

    for (const heading of [
      /owner-review walkthrough readiness helper/i,
      /owner-feedback intake readiness helper/i,
      /owner correction workflow readiness helper/i,
      /owner re-review request readiness helper/i,
      /owner decision intake readiness helper/i,
      /deployment approval request readiness helper/i,
      /deployment execution runbook readiness helper/i,
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getAllByText(deploymentExecutionRunbookReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(providerEnvDecisionMatrixTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(deploymentApprovalRequestReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(preLaunchBlockerLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByText(/safe future deployment execution runbook sections/i)).toBeInTheDocument();
    expect(screen.getByText(/deployment approval source reference/i)).toBeInTheDocument();
    expect(screen.getByText(/provider\/environment decision matrix placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/decision id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getByText(/allowed future runbook statuses/i)).toBeInTheDocument();
    expect(screen.getByText(/ready for approved deployment handoff/i)).toBeInTheDocument();
    expect(screen.getByText(/no-execution boundaries/i)).toBeInTheDocument();
    expect(screen.getByText(/a runbook is not deployment/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no deployment is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no provider setup is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no environment\/secrets are created here/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no preview is published here/i)).toBeInTheDocument();
    expect(screen.getByText(/no production launch is performed here/i)).toBeInTheDocument();
    expect(screen.getByText(/no smoke evidence is captured here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no rollback is executed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment approval is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5O helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "home" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /deployment execution runbook readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(deploymentExecutionRunbookReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(providerEnvDecisionMatrixTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5O and Phase 5N docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(deploymentExecutionRunbookReadinessDocPath);
    expect(adminSource).toContain(providerEnvDecisionMatrixTemplateDocPath);
    expect(adminSource).toContain(deploymentApprovalRequestReadinessDocPath);
    expect(adminSource).toContain(preLaunchBlockerLedgerTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5O-A\/B admin-only deployment execution runbook readiness/i);
  });

  it("keeps public production source free of deployment, provider, admin, handoff, and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /deployment execution runbook|provider\/environment decision matrix|deployment approval request|pre-launch blocker ledger|provider setup internals|environment\/secrets internals|smoke\/rollback internals|admin route\/view checklist|release-control internals|owner handoff internals|admin urls?|public admin status|\/admin\//i,
    );
  });

  it("keeps public production source rental/enquiry-only, non-promissory, and free of customer-flow creep", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).toMatch(/listing|listings/i);
    expect(publicSource).toMatch(/rental|rentals/i);
    expect(publicSource).toMatch(/quote|enquiry|request/i);
    expect(publicSource).not.toMatch(/\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i);
    expect(publicSource).not.toMatch(/\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i);
    expect(publicSource).not.toMatch(
      /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i,
    );
    expect(publicSource).not.toMatch(
      /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i,
    );
  });

  it("keeps Phase 5O docs template-only with no evidence and no deployment approval claim", () => {
    const docs = `${readRepoFile(deploymentExecutionRunbookReadinessDocPath)}\n${readRepoFile(
      providerEnvDecisionMatrixTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /actual deployment|preview publication completed|production launch completed|provider setup completed|env\/secrets setup completed|owner approved|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|correction-completed evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 5O validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:deployment-execution-runbook-readiness"],
    ).toBe("node scripts/validate-deployment-execution-runbook-readiness.cjs");
    expect(suite).toContain("args: ['run', 'validate:deployment-execution-runbook-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
