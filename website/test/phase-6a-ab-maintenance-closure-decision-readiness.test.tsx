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
const maintenanceClosureDecisionReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-DECISION-READINESS.md";
const maintenanceClosureRecommendationPacketLedgerTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-RECOMMENDATION-PACKET-LEDGER-TEMPLATE.md";
const maintenanceVerificationClosureReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-VERIFICATION-CLOSURE-READINESS.md";
const maintenanceChangeWindowOutcomeLedgerTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-OUTCOME-LEDGER-TEMPLATE.md";
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

describe("Phase 6A-A/B maintenance closure decision readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 6A helper after Phase 5Z in the full helper chain", () => {
    render(<AdminShellContent state={authorisedState} view={{ kind: "home" }} />);

    const expectedHeadings = [
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
      /maintenance closure decision readiness helper/i,
    ];

    for (const heading of expectedHeadings) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    const helperHeadings = screen.getAllByRole("heading", { level: 3 });
    const helperNames = helperHeadings.map((heading) => heading.textContent ?? "");
    expect(helperNames.indexOf("Maintenance closure decision readiness helper")).toBeGreaterThan(
      helperNames.indexOf("Maintenance verification closure readiness helper"),
    );

    expect(screen.getAllByText(maintenanceClosureDecisionReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(maintenanceClosureRecommendationPacketLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(maintenanceVerificationClosureReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(maintenanceChangeWindowOutcomeLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /closure recommendation packet ledger/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /closure decision readiness checklist/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /no-approval\/no-completion firewall/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /safe handoff language/i })).toBeInTheDocument();
    expect(screen.getByText(/intended maintenance\/change reference: \[not supplied\]/i)).toBeInTheDocument();
    expect(screen.getByText(/intended verification packet reference: \[not supplied\]/i)).toBeInTheDocument();
    expect(screen.getByText(/intended closure decision owner: \[not assigned\]/i)).toBeInTheDocument();
    expect(screen.getByText(/recommendation status placeholder: \[placeholder only \/ not a recommendation\]/i)).toBeInTheDocument();
    expect(screen.getByText(/decision status placeholder: \[placeholder only \/ not a decision\]/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no closure decision is recorded here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no closure recommendation is accepted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no closure approval is recorded here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance is marked complete here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no production evidence is collected here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no customer or support follow-up is sent here/i).length).toBeGreaterThan(0);
  });

  it("keeps protected admin source wired to Phase 6A and preserves the admin home view", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const adminHomeSource = readRepoFile("website/app/admin/page.tsx");

    expect(adminHomeSource).toContain('view={{ kind: "home" }}');
    expect(adminSource).toContain(maintenanceClosureDecisionReadinessDocPath);
    expect(adminSource).toContain(maintenanceClosureRecommendationPacketLedgerTemplateDocPath);
    expect(adminSource).toContain(maintenanceVerificationClosureReadinessDocPath);
    expect(adminSource).toContain(maintenanceChangeWindowOutcomeLedgerTemplateDocPath);
    expect(adminSource).toMatch(/Phase 6A-A\/B admin-only maintenance closure decision readiness/i);
    expect(adminSource).toMatch(
      /<MaintenanceVerificationClosureReadinessHelper \/>[\s\S]*<MaintenanceClosureDecisionReadinessHelper \/>/,
    );
  });

  it("keeps public production source free of Phase 6A and internal readiness details", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /maintenance closure decision|closure recommendation packet|closure decision readiness|maintenance verification|change-window outcome ledger|verification closure|maintenance execution|change-window execution checklist|maintenance approval|maintenance change-window planning|preventive maintenance|lessons-to-maintenance|support response|customer follow-up|public notice|maintenance internals|monitoring\/analytics internals|scheduler\/cron internals|provider setup internals|environment\/secrets internals|admin route internals|release-control internals|owner handoff internals|admin urls?|\/admin\//i,
    );
  });

  it("keeps public production source rental/enquiry-only and free of customer-flow creep", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).toMatch(/listing|listings/i);
    expect(publicSource).toMatch(/rental|rentals/i);
    expect(publicSource).toMatch(/quote|enquiry|request/i);
    expect(publicSource).not.toMatch(/\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i);
    expect(publicSource).not.toMatch(/\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i);
    expect(publicSource).not.toMatch(
      /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i,
    );
  });

  it("keeps Phase 6A docs template-only with no decision, approval, completion, or deployment claim", () => {
    const docs = `${readRepoFile(maintenanceClosureDecisionReadinessDocPath)}\n${readRepoFile(
      maintenanceClosureRecommendationPacketLedgerTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).toContain("No real closure recommendation is made. No real decision is recorded. No approval is granted. No completion is recorded.");
    expect(docs).toContain("This checklist does not approve closure and does not close maintenance.");
    expect(docs).not.toMatch(
      /actual deployment|maintenance executed|maintenance implemented|maintenance approved|owner approved|provider approved|maintenance scheduled|change window scheduled|opened change window|execution checklist completed|verification checklist completed|maintenance closure claimed|smoke check run|provider check executed|runtime check executed|production readiness claim made|closure approval recorded|maintenance marked complete|closure decision recorded|closure recommendation accepted|precheck completed|cron configured|job configured|monitoring configured|analytics configured|support response sent|customer follow-up sent|public notice published|live hotfix|remediation performed|correction completed|retest run|live monitoring|analytics capture|route verification|route walkthrough|preview publication|production launch|provider setup completed|env\/secrets setup completed|owner sign-?off complete|launch clearance granted|production evidence captured|production evidence collected|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|closure evidence captured|resolution evidence captured|maintenance evidence captured|maintenance-execution evidence captured|maintenance-schedule evidence captured|change-window evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 6A validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(packageJson.scripts?.["validate:maintenance-closure-decision-readiness"]).toBe(
      "node scripts/validate-maintenance-closure-decision-readiness.cjs",
    );
    expect(suite).toContain("args: ['run', 'validate:maintenance-closure-decision-readiness']");
    expect(suite).toContain("args: ['run', 'validate:maintenance-verification-closure-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
