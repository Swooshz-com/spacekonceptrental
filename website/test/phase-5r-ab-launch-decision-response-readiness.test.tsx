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
const launchDecisionResponseReadinessDocPath =
  "docs/content/LOCAL-LAUNCH-DECISION-RESPONSE-READINESS.md";
const releaseClosurePacketTemplateDocPath =
  "docs/content/LOCAL-RELEASE-CLOSURE-PACKET-TEMPLATE.md";
const smokeEvidenceReviewReadinessDocPath =
  "docs/content/LOCAL-SMOKE-EVIDENCE-REVIEW-READINESS.md";
const goNogoDecisionLedgerTemplateDocPath =
  "docs/content/LOCAL-GO-NOGO-DECISION-LEDGER-TEMPLATE.md";
const smokeEvidenceIntakeReadinessDocPath =
  "docs/content/LOCAL-SMOKE-EVIDENCE-INTAKE-READINESS.md";
const routeVerificationRollbackLedgerTemplateDocPath =
  "docs/content/LOCAL-ROUTE-VERIFICATION-ROLLBACK-LEDGER-TEMPLATE.md";
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

describe("Phase 5R-A/B launch decision response readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5R helper and full helper chain for authorised admin home state", () => {
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
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getByText(launchDecisionResponseReadinessDocPath)).toBeInTheDocument();
    expect(screen.getByText(releaseClosurePacketTemplateDocPath)).toBeInTheDocument();
    expect(screen.getAllByText(smokeEvidenceReviewReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(goNogoDecisionLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByText(/safe future response sections/i)).toBeInTheDocument();
    expect(screen.getByText(/launch decision summary placeholder/i)).toBeInTheDocument();
    expect(screen.getByText(/release closure \/ continuation packet placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/packet id: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getByText(/allowed future response statuses/i)).toBeInTheDocument();
    expect(screen.getByText(/ready for future approved response/i)).toBeInTheDocument();
    expect(screen.getByText(/no-response\/no-launch boundaries/i)).toBeInTheDocument();
    expect(screen.getByText(/a response template is not a sent response/i)).toBeInTheDocument();
    expect(screen.getByText(/no launch decision response is sent here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no go\/no-go decision is recorded here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no launch clearance is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no release closure is claimed here/i)).toBeInTheDocument();
    expect(screen.getByText(/no response-sent evidence is captured here/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no preview evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no production evidence is captured here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment approval is granted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5R helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "home" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /launch decision response readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(launchDecisionResponseReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(releaseClosurePacketTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5R and Phase 5Q docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    expect(adminSource).toContain(launchDecisionResponseReadinessDocPath);
    expect(adminSource).toContain(releaseClosurePacketTemplateDocPath);
    expect(adminSource).toContain(smokeEvidenceReviewReadinessDocPath);
    expect(adminSource).toContain(goNogoDecisionLedgerTemplateDocPath);
    expect(adminSource).toContain(smokeEvidenceIntakeReadinessDocPath);
    expect(adminSource).toContain(routeVerificationRollbackLedgerTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5R-A\/B admin-only launch decision response readiness/i);
  });

  it("keeps public production source free of internal readiness, provider, admin, handoff, and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /launch decision response|release closure packet|smoke evidence review|go\/no-go decision ledger|smoke evidence intake|route verification ledger|rollback observation|deployment execution runbook|provider\/environment decision matrix|provider env decision matrix|provider setup internals|environment\/secrets internals|admin route internals|release-control internals|owner handoff internals|admin urls?|\/admin\//i,
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

  it("keeps Phase 5R docs template-only with no evidence and no deployment approval claim", () => {
    const docs = `${readRepoFile(launchDecisionResponseReadinessDocPath)}\n${readRepoFile(
      releaseClosurePacketTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).not.toMatch(
      /actual deployment|launch response sent|evidence review completed|go\/no-go decision recorded|release closure completed|route verification completed|route walkthrough completed|preview publication completed|production launch completed|provider setup completed|env\/secrets setup completed|owner approved|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|correction-completed evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 5R validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:launch-decision-response-readiness"],
    ).toBe("node scripts/validate-launch-decision-response-readiness.cjs");
    expect(suite).toContain("args: ['run', 'validate:launch-decision-response-readiness']");
    expect(suite).toContain("args: ['run', 'validate:smoke-evidence-review-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
