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
const maintenanceExecutionRunbookReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-EXECUTION-RUNBOOK-READINESS.md";
const maintenanceChangeWindowExecutionChecklistTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-EXECUTION-CHECKLIST-TEMPLATE.md";
const maintenanceApprovalReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-APPROVAL-READINESS.md";
const maintenanceChangeWindowPlanningLedgerTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-PLANNING-LEDGER-TEMPLATE.md";
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

describe("Phase 5Y-A/B maintenance execution runbook readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5Y helper and full helper chain for authorised admin home state", () => {
    render(<AdminShellContent state={authorisedState} view={{ kind: "home" }} />);

    for (const heading of [
      /owner-review walkthrough readiness helper/i,
      /owner-feedback intake readiness helper/i,
      /owner correction workflow readiness helper/i,
      /owner re-review request readiness helper/i,
      /owner decision intake readiness helper/i,
      /deployment approval request readiness helper/i,
      /deployment execution runbook readiness helper/i,
      /smoke evidence intake readiness helper/i,
      /smoke evidence review readiness helper/i,
      /launch decision response readiness helper/i,
      /post-launch observation readiness helper/i,
      /post-launch remediation readiness helper/i,
      /remediation verification readiness helper/i,
      /incident resolution response readiness helper/i,
      /preventive maintenance readiness helper/i,
      /maintenance approval readiness helper/i,
      /maintenance execution runbook readiness helper/i,
      /maintenance verification closure readiness helper/i,
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getAllByText(maintenanceExecutionRunbookReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(maintenanceChangeWindowExecutionChecklistTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(maintenanceApprovalReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(maintenanceChangeWindowPlanningLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByText(/safe future execution sections/i)).toBeInTheDocument();
    expect(screen.getByText(/maintenance change-window execution checklist placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/allowed future execution statuses/i)).toBeInTheDocument();
    expect(screen.getByText(/no-execution\/no-runtime boundaries/i)).toBeInTheDocument();
    expect(screen.getByText(/execution id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getByText(/ready for future approved execution review/i)).toBeInTheDocument();
    expect(screen.getByText(/an execution runbook is not executed maintenance/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no maintenance task is executed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance task is implemented here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no change window is opened here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance schedule is created here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no cron or job scheduler is added here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no monitoring is configured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no analytics is configured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no provider setup is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no execution precheck is completed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance execution evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no schedule evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no change-window evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no production change is made here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no rollback is executed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment approval is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5Y helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "home" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /maintenance execution runbook readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(maintenanceExecutionRunbookReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(maintenanceChangeWindowExecutionChecklistTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5Y and Phase 5X docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(maintenanceExecutionRunbookReadinessDocPath);
    expect(adminSource).toContain(maintenanceChangeWindowExecutionChecklistTemplateDocPath);
    expect(adminSource).toContain(maintenanceApprovalReadinessDocPath);
    expect(adminSource).toContain(maintenanceChangeWindowPlanningLedgerTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5Y-A\/B admin-only maintenance execution runbook readiness/i);
  });

  it("keeps public production source free of maintenance execution and internal readiness details", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /maintenance execution|change-window execution checklist|maintenance approval|maintenance change-window planning|preventive maintenance|lessons-to-maintenance|support response|customer follow-up|public notice|maintenance internals|monitoring\/analytics internals|scheduler\/cron internals|provider setup internals|environment\/secrets internals|admin route internals|release-control internals|owner handoff internals|admin urls?|\/admin\//i,
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

  it("keeps Phase 5Y docs template-only with no evidence and no deployment approval claim", () => {
    const docs = `${readRepoFile(maintenanceExecutionRunbookReadinessDocPath)}\n${readRepoFile(
      maintenanceChangeWindowExecutionChecklistTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /actual deployment|maintenance executed|maintenance implemented|change window opened|maintenance scheduled|change window scheduled|precheck completed|cron configured|job configured|monitoring configured|analytics configured|support response sent|customer follow-up sent|public notice published|maintenance completed|live hotfix|remediation performed|correction completed|retest run|live monitoring|analytics capture|route verification|route walkthrough|preview publication|production launch|provider setup completed|env\/secrets setup completed|owner approved|provider approved|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|closure evidence captured|resolution evidence captured|maintenance evidence captured|maintenance-execution evidence captured|maintenance-schedule evidence captured|change-window evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 5Y validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:maintenance-execution-runbook-readiness"],
    ).toBe("node scripts/validate-maintenance-execution-runbook-readiness.cjs");
    expect(suite).toContain("args: ['run', 'validate:maintenance-execution-runbook-readiness']");
    expect(suite).toContain("args: ['run', 'validate:maintenance-approval-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
