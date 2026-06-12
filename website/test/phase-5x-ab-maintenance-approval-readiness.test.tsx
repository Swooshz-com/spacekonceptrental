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
const maintenanceApprovalReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-APPROVAL-READINESS.md";
const maintenanceChangeWindowPlanningLedgerTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-PLANNING-LEDGER-TEMPLATE.md";
const preventiveMaintenanceReadinessDocPath =
  "docs/content/LOCAL-PREVENTIVE-MAINTENANCE-READINESS.md";
const lessonsToMaintenanceBacklogTemplateDocPath =
  "docs/content/LOCAL-LESSONS-TO-MAINTENANCE-BACKLOG-TEMPLATE.md";
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

describe("Phase 5X-A/B maintenance approval readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5X helper and full helper chain for authorised admin home state", () => {
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
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getByText(maintenanceApprovalReadinessDocPath)).toBeInTheDocument();
    expect(screen.getByText(maintenanceChangeWindowPlanningLedgerTemplateDocPath)).toBeInTheDocument();
    expect(screen.getAllByText(preventiveMaintenanceReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(lessonsToMaintenanceBacklogTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByText(/safe future approval sections/i)).toBeInTheDocument();
    expect(screen.getByText(/maintenance approval\/change-window ledger placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/allowed future approval statuses/i)).toBeInTheDocument();
    expect(screen.getByText(/no-approval\/no-schedule boundaries/i)).toBeInTheDocument();
    expect(screen.getByText(/approval id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getByText(/ready for future approved scheduling review/i)).toBeInTheDocument();
    expect(screen.getByText(/an approval template is not owner approval/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no owner approval is recorded here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no provider approval is recorded here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance approval is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance schedule is created here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no change window is scheduled here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no cron or job scheduler is added here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no monitoring is configured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no analytics is configured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no provider setup is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance task is implemented here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance approval evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no schedule evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no change-window evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no production change is made here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no rollback is executed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment approval is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5X helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "home" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /maintenance approval readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(maintenanceApprovalReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(maintenanceChangeWindowPlanningLedgerTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5X and Phase 5W docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(maintenanceApprovalReadinessDocPath);
    expect(adminSource).toContain(maintenanceChangeWindowPlanningLedgerTemplateDocPath);
    expect(adminSource).toContain(preventiveMaintenanceReadinessDocPath);
    expect(adminSource).toContain(lessonsToMaintenanceBacklogTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5X-A\/B admin-only maintenance approval readiness/i);
  });

  it("keeps public production source free of maintenance approval and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /maintenance approval|maintenance change-window|preventive maintenance|lessons-to-maintenance|incident resolution response|support response|customer follow-up|public notice|maintenance internals|monitoring\/analytics internals|scheduler\/cron internals|provider setup internals|environment\/secrets internals|admin route internals|release-control internals|owner handoff internals|admin urls?|\/admin\//i,
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

  it("keeps Phase 5X docs template-only with no evidence and no deployment approval claim", () => {
    const docs = `${readRepoFile(maintenanceApprovalReadinessDocPath)}\n${readRepoFile(
      maintenanceChangeWindowPlanningLedgerTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /actual deployment|maintenance approved|owner approved|provider approved|maintenance scheduled|change window scheduled|cron configured|job configured|monitoring configured|analytics configured|support response sent|customer follow-up sent|public notice published|maintenance completed|live hotfix applied|remediation performed|correction completed|retest run completed|live monitoring configured|analytics captured|route verification completed|route walkthrough completed|preview publication completed|production launch completed|provider setup completed|env\/secrets setup completed|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|closure evidence captured|resolution evidence captured|maintenance evidence captured|maintenance-approval evidence captured|maintenance-schedule evidence captured|change-window evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 5X validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:maintenance-approval-readiness"],
    ).toBe("node scripts/validate-maintenance-approval-readiness.cjs");
    expect(suite).toContain("args: ['run', 'validate:maintenance-approval-readiness']");
    expect(suite).toContain("args: ['run', 'validate:preventive-maintenance-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
