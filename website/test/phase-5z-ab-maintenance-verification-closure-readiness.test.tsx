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
const maintenanceVerificationClosureReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-VERIFICATION-CLOSURE-READINESS.md";
const maintenanceChangeWindowOutcomeLedgerTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-OUTCOME-LEDGER-TEMPLATE.md";
const maintenanceExecutionRunbookReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-EXECUTION-RUNBOOK-READINESS.md";
const maintenanceChangeWindowExecutionChecklistTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-EXECUTION-CHECKLIST-TEMPLATE.md";
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

describe("Phase 5Z-A/B maintenance verification closure readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 5Z helper after Phase 5Y in the full helper chain", () => {
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
    ];

    for (const heading of expectedHeadings) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    const helperHeadings = screen.getAllByRole("heading", { level: 3 });
    const helperNames = helperHeadings.map((heading) => heading.textContent ?? "");
    expect(helperNames.indexOf("Maintenance verification closure readiness helper")).toBeGreaterThan(
      helperNames.indexOf("Maintenance execution runbook readiness helper"),
    );

    expect(screen.getByText(maintenanceVerificationClosureReadinessDocPath)).toBeInTheDocument();
    expect(screen.getByText(maintenanceChangeWindowOutcomeLedgerTemplateDocPath)).toBeInTheDocument();
    expect(screen.getAllByText(maintenanceExecutionRunbookReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(maintenanceChangeWindowExecutionChecklistTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /change-window outcome ledger/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /verification closure packet checklist/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /no-completion\/no-production-evidence firewall/i })).toBeInTheDocument();
    expect(screen.getByText(/safe handoff language must stay draft, readiness, and placeholder only/i)).toBeInTheDocument();
    expect(screen.getByText(/planned maintenance\/change reference: \[not supplied\]/i)).toBeInTheDocument();
    expect(screen.getByText(/intended owner\/reviewer: \[owner input required\]/i)).toBeInTheDocument();
    expect(screen.getByText(/outcome status placeholder: \[placeholder only \/ not a result\]/i)).toBeInTheDocument();
    expect(screen.getByText(/production evidence status: \[not evidence \/ not recorded\]/i)).toBeInTheDocument();
    expect(screen.getByText(/maintenance status: \[not marked complete\]/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no production evidence is collected here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no smoke check is run here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no provider or runtime check is executed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no production readiness claim is made here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no closure approval is recorded here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no maintenance is marked complete here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment is performed here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no deployment approval is granted here/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 5Z helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "home" }} />);

      expect(
        screen.queryByRole("heading", {
          name: /maintenance verification closure readiness helper/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(maintenanceVerificationClosureReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(maintenanceChangeWindowOutcomeLedgerTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 5Z and preserves the admin home view", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const adminHomeSource = readRepoFile("website/app/admin/page.tsx");

    expect(adminHomeSource).toContain('view={{ kind: "home" }}');
    expect(adminSource).toContain(maintenanceVerificationClosureReadinessDocPath);
    expect(adminSource).toContain(maintenanceChangeWindowOutcomeLedgerTemplateDocPath);
    expect(adminSource).toContain(maintenanceExecutionRunbookReadinessDocPath);
    expect(adminSource).toContain(maintenanceChangeWindowExecutionChecklistTemplateDocPath);
    expect(adminSource).toMatch(/Phase 5Z-A\/B admin-only maintenance verification closure readiness/i);
    expect(adminSource).toMatch(
      /<MaintenanceExecutionRunbookReadinessHelper \/>[\s\S]*<MaintenanceVerificationClosureReadinessHelper \/>/,
    );
  });

  it("keeps public production source free of Phase 5Z and internal readiness details", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /maintenance verification|change-window outcome ledger|verification closure|maintenance execution|change-window execution checklist|maintenance approval|maintenance change-window planning|preventive maintenance|lessons-to-maintenance|support response|customer follow-up|public notice|maintenance internals|monitoring\/analytics internals|scheduler\/cron internals|provider setup internals|environment\/secrets internals|admin route internals|release-control internals|owner handoff internals|admin urls?|\/admin\//i,
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

  it("keeps Phase 5Z docs template-only with no evidence, completion, or deployment claim", () => {
    const docs = `${readRepoFile(maintenanceVerificationClosureReadinessDocPath)}\n${readRepoFile(
      maintenanceChangeWindowOutcomeLedgerTemplateDocPath,
    )}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).toContain("This checklist does not complete verification, does not close maintenance, does not approve closure, and does not record evidence.");
    expect(docs).not.toMatch(
      /actual deployment|maintenance executed|maintenance implemented|maintenance approved|owner approved|provider approved|maintenance scheduled|change window scheduled|opened change window|execution checklist completed|verification checklist completed|maintenance closure claimed|smoke check run|provider check executed|runtime check executed|production readiness claim made|closure approval recorded|maintenance marked complete|precheck completed|cron configured|job configured|monitoring configured|analytics configured|support response sent|customer follow-up sent|public notice published|maintenance completed|live hotfix|remediation performed|correction completed|retest run|live monitoring|analytics capture|route verification|route walkthrough|preview publication|production launch|provider setup completed|env\/secrets setup completed|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|closure evidence captured|resolution evidence captured|maintenance evidence captured|maintenance-execution evidence captured|maintenance-schedule evidence captured|change-window evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 5Z validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(
      packageJson.scripts?.["validate:maintenance-verification-closure-readiness"],
    ).toBe("node scripts/validate-maintenance-verification-closure-readiness.cjs");
    expect(suite).toContain("args: ['run', 'validate:maintenance-verification-closure-readiness']");
    expect(suite).toContain("args: ['run', 'validate:maintenance-execution-runbook-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
