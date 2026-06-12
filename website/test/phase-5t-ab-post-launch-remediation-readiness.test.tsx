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
const postLaunchRemediationReadinessDocPath =
  "docs/content/LOCAL-POST-LAUNCH-REMEDIATION-READINESS.md";
const incidentTriageCorrectionBacklogTemplateDocPath =
  "docs/content/LOCAL-INCIDENT-TRIAGE-CORRECTION-BACKLOG-TEMPLATE.md";
const postLaunchObservationReadinessDocPath =
  "docs/content/LOCAL-POST-LAUNCH-OBSERVATION-READINESS.md";
const incidentFollowupLedgerTemplateDocPath =
  "docs/content/LOCAL-INCIDENT-FOLLOWUP-LEDGER-TEMPLATE.md";
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

describe("Phase 5T-A/B post-launch remediation readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5T helper and full helper chain for authorised admin home state", () => {
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
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getByText(postLaunchRemediationReadinessDocPath)).toBeInTheDocument();
    expect(screen.getByText(incidentTriageCorrectionBacklogTemplateDocPath)).toBeInTheDocument();
    expect(screen.getAllByText(postLaunchObservationReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(incidentFollowupLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByText(/safe future remediation sections/i)).toBeInTheDocument();
    expect(screen.getByText(/incident triage source placeholder/i)).toBeInTheDocument();
    expect(screen.getByText(/incident triage\/correction backlog placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/triage id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getByText(/allowed future remediation statuses/i)).toBeInTheDocument();
    expect(screen.getByText(/ready for future approved correction planning/i)).toBeInTheDocument();
    expect(screen.getByText(/no-hotfix\/no-remediation boundaries/i)).toBeInTheDocument();
    expect(screen.getByText(/a remediation template is not a hotfix/i)).toBeInTheDocument();
    expect(screen.getByText(/no live hotfix is applied here/i)).toBeInTheDocument();
    expect(screen.getByText(/no production change is made here/i)).toBeInTheDocument();
    expect(screen.getByText(/no remediation is performed here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no incident is recorded here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no support response is sent here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no customer follow-up is sent here/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no remediation evidence is captured here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no monitoring evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no analytics evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no rollback is executed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment approval is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5T helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "home" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /post-launch remediation readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(postLaunchRemediationReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(incidentTriageCorrectionBacklogTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5T and Phase 5S docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(postLaunchRemediationReadinessDocPath);
    expect(adminSource).toContain(incidentTriageCorrectionBacklogTemplateDocPath);
    expect(adminSource).toContain(postLaunchObservationReadinessDocPath);
    expect(adminSource).toContain(incidentFollowupLedgerTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5T-A\/B admin-only post-launch remediation readiness/i);
  });

  it("keeps public production source free of internal remediation, observation, provider, admin, handoff, and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /post-launch remediation|incident triage correction backlog|post-launch observation|incident\/follow-up ledger|monitoring\/analytics internals|hotfix internals|provider setup internals|environment\/secrets internals|admin route internals|release-control internals|owner handoff internals|admin urls?|\/admin\//i,
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

  it("keeps Phase 5T docs template-only with no evidence and no deployment approval claim", () => {
    const docs = `${readRepoFile(postLaunchRemediationReadinessDocPath)}\n${readRepoFile(
      incidentTriageCorrectionBacklogTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /actual deployment|live hotfix applied|remediation performed|correction completed|incident record completed|support response sent|customer follow-up sent|live monitoring configured|analytics captured|route verification completed|route walkthrough completed|preview publication completed|production launch completed|provider setup completed|env\/secrets setup completed|owner approved|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 5T validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:post-launch-remediation-readiness"],
    ).toBe("node scripts/validate-post-launch-remediation-readiness.cjs");
    expect(suite).toContain("args: ['run', 'validate:post-launch-remediation-readiness']");
    expect(suite).toContain("args: ['run', 'validate:post-launch-observation-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
