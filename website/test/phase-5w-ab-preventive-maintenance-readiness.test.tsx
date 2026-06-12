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
const preventiveMaintenanceReadinessDocPath =
  "docs/content/LOCAL-PREVENTIVE-MAINTENANCE-READINESS.md";
const lessonsToMaintenanceBacklogTemplateDocPath =
  "docs/content/LOCAL-LESSONS-TO-MAINTENANCE-BACKLOG-TEMPLATE.md";
const incidentResolutionResponseReadinessDocPath =
  "docs/content/LOCAL-INCIDENT-RESOLUTION-RESPONSE-READINESS.md";
const postRemediationClosureLessonsLedgerTemplateDocPath =
  "docs/content/LOCAL-POST-REMEDIATION-CLOSURE-LESSONS-LEDGER-TEMPLATE.md";
const remediationVerificationReadinessDocPath =
  "docs/content/LOCAL-REMEDIATION-VERIFICATION-READINESS.md";
const correctionRetestResolutionLedgerTemplateDocPath =
  "docs/content/LOCAL-CORRECTION-RETEST-RESOLUTION-LEDGER-TEMPLATE.md";
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

describe("Phase 5W-A/B preventive maintenance readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5W helper and full helper chain for authorised admin home state", () => {
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
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getByText(preventiveMaintenanceReadinessDocPath)).toBeInTheDocument();
    expect(screen.getByText(lessonsToMaintenanceBacklogTemplateDocPath)).toBeInTheDocument();
    expect(screen.getAllByText(incidentResolutionResponseReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(postRemediationClosureLessonsLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(remediationVerificationReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(correctionRetestResolutionLedgerTemplateDocPath).length).toBeGreaterThan(0);

    expect(screen.getAllByText(/safe future maintenance sections/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/maintenance candidate placeholder/i)).toBeInTheDocument();
    expect(screen.getByText(/lessons-to-maintenance backlog placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/maintenance id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getAllByText(/allowed future maintenance statuses/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ready for future approved maintenance planning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no-maintenance\/no-schedule boundaries/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/a maintenance template is not implemented maintenance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance task is implemented here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance schedule is created here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no cron or job scheduler is added here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no monitoring is configured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no analytics is configured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no provider setup is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no monitoring evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no analytics evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no production change is made here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/safe future response sections/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/verified correction summary placeholder/i)).toBeInTheDocument();
    expect(screen.getByText(/post-remediation closure \/ lessons ledger placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/closure id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getAllByText(/allowed future response statuses/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ready for future approved response/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no-response\/no-resolution boundaries/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/a response template is not a sent response/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no support response is sent here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no customer follow-up is sent here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no incident is closed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no incident resolution is recorded here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no public notice is published here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance task is completed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no response-sent evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no closure evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no resolution evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no remediation evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no rollback is executed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment approval is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5W helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "home" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /preventive maintenance readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(preventiveMaintenanceReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(lessonsToMaintenanceBacklogTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5W and Phase 5V docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(preventiveMaintenanceReadinessDocPath);
    expect(adminSource).toContain(lessonsToMaintenanceBacklogTemplateDocPath);
    expect(adminSource).toContain(incidentResolutionResponseReadinessDocPath);
    expect(adminSource).toContain(postRemediationClosureLessonsLedgerTemplateDocPath);
    expect(adminSource).toContain(remediationVerificationReadinessDocPath);
    expect(adminSource).toContain(correctionRetestResolutionLedgerTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5W-A\/B admin-only preventive maintenance readiness/i);
  });

  it("keeps public production source free of preventive maintenance and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /preventive maintenance|lessons-to-maintenance|incident resolution response|post-remediation closure|support response|customer follow-up|public notice|maintenance internals|monitoring\/analytics internals|scheduler\/cron internals|provider setup internals|environment\/secrets internals|admin route internals|release-control internals|owner handoff internals|admin urls?|\/admin\//i,
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

  it("keeps Phase 5W docs template-only with no evidence and no deployment approval claim", () => {
    const docs = `${readRepoFile(preventiveMaintenanceReadinessDocPath)}\n${readRepoFile(
      lessonsToMaintenanceBacklogTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /actual deployment|maintenance implemented|maintenance scheduled|cron configured|job configured|monitoring configured|analytics configured|support response sent|customer follow-up sent|incident closed|incident resolved|public notice published|maintenance completed|live hotfix applied|remediation performed|correction completed|retest run completed|live monitoring configured|analytics captured|route verification completed|route walkthrough completed|preview publication completed|production launch completed|provider setup completed|env\/secrets setup completed|owner approved|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|closure evidence captured|resolution evidence captured|maintenance evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 5W validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:preventive-maintenance-readiness"],
    ).toBe("node scripts/validate-preventive-maintenance-readiness.cjs");
    expect(suite).toContain("args: ['run', 'validate:preventive-maintenance-readiness']");
    expect(suite).toContain("args: ['run', 'validate:incident-resolution-response-readiness']");
    expect(suite).toContain("args: ['run', 'validate:remediation-verification-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
