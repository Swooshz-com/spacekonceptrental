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
const postLaunchObservationReadinessDocPath =
  "docs/content/LOCAL-POST-LAUNCH-OBSERVATION-READINESS.md";
const incidentFollowupLedgerTemplateDocPath =
  "docs/content/LOCAL-INCIDENT-FOLLOWUP-LEDGER-TEMPLATE.md";
const launchDecisionResponseReadinessDocPath =
  "docs/content/LOCAL-LAUNCH-DECISION-RESPONSE-READINESS.md";
const releaseClosurePacketTemplateDocPath =
  "docs/content/LOCAL-RELEASE-CLOSURE-PACKET-TEMPLATE.md";
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

describe("Phase 5S-A/B post-launch observation readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5S helper and full helper chain for authorised admin home state", () => {
    render(<AdminShellContent state={authorisedState} view={{ kind: "content-readiness" }} />);

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
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getAllByText(postLaunchObservationReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(incidentFollowupLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(launchDecisionResponseReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(releaseClosurePacketTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByText(/safe future observation sections/i)).toBeInTheDocument();
    expect(screen.getByText(/post-launch observation window placeholder/i)).toBeInTheDocument();
    expect(screen.getByText(/incident\/follow-up ledger placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/incident id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getByText(/allowed future observation statuses/i)).toBeInTheDocument();
    expect(screen.getByText(/ready for future approved observation/i)).toBeInTheDocument();
    expect(screen.getByText(/no-monitoring\/no-incident boundaries/i)).toBeInTheDocument();
    expect(screen.getByText(/an observation template is not monitoring/i)).toBeInTheDocument();
    expect(screen.getByText(/no live monitoring is configured here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no incident is recorded here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no support response is sent here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no customer follow-up is sent here/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no post-launch evidence is captured here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no monitoring evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no analytics evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no rollback is executed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment approval is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5S helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "content-readiness" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /post-launch observation readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(postLaunchObservationReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(incidentFollowupLedgerTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5S and Phase 5R docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(postLaunchObservationReadinessDocPath);
    expect(adminSource).toContain(incidentFollowupLedgerTemplateDocPath);
    expect(adminSource).toContain(launchDecisionResponseReadinessDocPath);
    expect(adminSource).toContain(releaseClosurePacketTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5S-A\/B admin-only post-launch observation readiness/i);
  });

  it("keeps public production source free of internal readiness, provider, admin, handoff, monitoring, and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /post-launch observation|incident\/follow-up ledger|launch decision response|release closure packet|smoke evidence review|go\/no-go decision ledger|monitoring\/analytics internals|provider setup internals|environment\/secrets internals|admin route internals|release-control internals|owner handoff internals|admin urls?|\/admin\//i,
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

  it("keeps Phase 5S docs template-only with no evidence and no deployment approval claim", () => {
    const docs = `${readRepoFile(postLaunchObservationReadinessDocPath)}\n${readRepoFile(
      incidentFollowupLedgerTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /actual deployment|launch response sent|release closure completed|incident record completed|support response sent|customer follow-up sent|live monitoring configured|analytics captured|route verification completed|route walkthrough completed|preview publication completed|production launch completed|provider setup completed|env\/secrets setup completed|owner approved|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|correction-completed evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 5S validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:post-launch-observation-readiness"],
    ).toBe("node scripts/validate-post-launch-observation-readiness.cjs");
    expect(suite).toContain("args: ['run', 'validate:post-launch-observation-readiness']");
    expect(suite).toContain("args: ['run', 'validate:launch-decision-response-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
