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
const deploymentApprovalRequestReadinessDocPath =
  "docs/content/LOCAL-DEPLOYMENT-APPROVAL-REQUEST-READINESS.md";
const preLaunchBlockerLedgerTemplateDocPath =
  "docs/content/LOCAL-PRE-LAUNCH-BLOCKER-LEDGER-TEMPLATE.md";
const ownerDecisionIntakeReadinessDocPath =
  "docs/content/LOCAL-OWNER-DECISION-INTAKE-READINESS.md";
const signoffCriteriaLedgerTemplateDocPath =
  "docs/content/LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE.md";
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

describe("Phase 5N-A/B deployment approval request readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5N helper and full helper chain for authorised admin home state", () => {
    render(<AdminShellContent state={authorisedState} view={{ kind: "home" }} />);

    for (const heading of [
      /owner-review walkthrough readiness helper/i,
      /owner-feedback intake readiness helper/i,
      /owner correction workflow readiness helper/i,
      /owner re-review request readiness helper/i,
      /owner decision intake readiness helper/i,
      /deployment approval request readiness helper/i,
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getByText(deploymentApprovalRequestReadinessDocPath)).toBeInTheDocument();
    expect(screen.getByText(preLaunchBlockerLedgerTemplateDocPath)).toBeInTheDocument();
    expect(screen.getAllByText(ownerDecisionIntakeReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(signoffCriteriaLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByText(/safe future deployment approval request sections/i)).toBeInTheDocument();
    expect(screen.getByText(/deployment approval request purpose/i)).toBeInTheDocument();
    expect(screen.getByText(/pre-launch blocker ledger placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/blocker id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getByText(/allowed future approval request statuses/i)).toBeInTheDocument();
    expect(screen.getAllByText(/blocked: deployment approval missing/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no-provider\/no-deploy boundaries/i)).toBeInTheDocument();
    expect(screen.getAllByText(/a deployment approval request is not deployment approval/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no deployment approval is recorded here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no launch clearance is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no provider setup is performed here/i)).toBeInTheDocument();
    expect(screen.getByText(/no environment\/secrets are created here/i)).toBeInTheDocument();
    expect(screen.getByText(/no production evidence is captured here/i)).toBeInTheDocument();
    expect(screen.getByText(/no deployment is performed here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5N helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "home" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /deployment approval request readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(deploymentApprovalRequestReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(preLaunchBlockerLedgerTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5N and Phase 5M docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(deploymentApprovalRequestReadinessDocPath);
    expect(adminSource).toContain(preLaunchBlockerLedgerTemplateDocPath);
    expect(adminSource).toContain(ownerDecisionIntakeReadinessDocPath);
    expect(adminSource).toContain(signoffCriteriaLedgerTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5N-A\/B admin-only deployment approval request readiness/i);
  });

  it("keeps public production source free of deployment, owner-decision, provider, admin, handoff, and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /deployment approval request|pre-launch blocker ledger|owner decision intake|sign-off criteria ledger|provider setup internals|environment\/secrets internals|admin route\/view checklist|internal notes|release-control internals|owner handoff internals|owner approval issue template|no-deploy command-center|admin urls?|public admin status|\/admin\//i,
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

  it("keeps Phase 5N docs template-only with no evidence and no deployment approval claim", () => {
    const docs = `${readRepoFile(deploymentApprovalRequestReadinessDocPath)}\n${readRepoFile(
      preLaunchBlockerLedgerTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner sign-off recorded|preview evidence captured|production evidence captured|response-sent evidence captured|correction-completed evidence captured|provider setup completed|secrets created|deployment performed|deployment approval granted|launch approval granted|launch clearance granted/i,
    );
  });

  it("registers the Phase 5N validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:deployment-approval-request-readiness"],
    ).toBe("node scripts/validate-deployment-approval-request-readiness.cjs");
    expect(suite).toContain("args: ['run', 'validate:deployment-approval-request-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
