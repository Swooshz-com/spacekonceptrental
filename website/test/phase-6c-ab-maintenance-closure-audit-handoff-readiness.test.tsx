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
const auditHandoffReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-READINESS.md";
const auditHandoffRoutingLedgerTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-ROUTING-LEDGER-TEMPLATE.md";
const archiveReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-ARCHIVE-READINESS.md";
const archiveRetentionLedgerTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-ARCHIVE-RETENTION-LEDGER-TEMPLATE.md";
const closureDecisionReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-DECISION-READINESS.md";
const recommendationPacketLedgerTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-RECOMMENDATION-PACKET-LEDGER-TEMPLATE.md";
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

describe("Phase 6C-A/B maintenance closure audit handoff readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the protected Phase 6C helper for authorised admin on the real home view path", () => {
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
      /maintenance closure decision readiness helper/i,
      /maintenance closure archive readiness helper/i,
      /maintenance closure audit handoff readiness helper/i,
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getByText(auditHandoffReadinessDocPath)).toBeInTheDocument();
    expect(screen.getByText(auditHandoffRoutingLedgerTemplateDocPath)).toBeInTheDocument();
    expect(screen.getAllByText(closureDecisionReadinessDocPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(recommendationPacketLedgerTemplateDocPath).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /audit handoff packet routing ledger/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /audit handoff readiness checklist/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /no-handoff\/no-external-disclosure firewall/i })).toBeInTheDocument();
    expect(screen.getAllByText(/\[not evidence \/ not recorded\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[deployment approval: not granted\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No audit handoff is created here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No audit packet is sent here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No audit recipient is contacted here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No external disclosure is made here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Deployment approval granting is blocked here/i).length).toBeGreaterThan(0);
  });

  it("does not render the protected Phase 6C helper for blocked admin states", () => {
    const blockedStates: ProtectedAdminShellState[] = [
      { status: "unauthenticated" },
      { status: "authenticated_not_authorised" },
      { status: "unavailable" },
    ];

    for (const state of blockedStates) {
      const { unmount } = render(<AdminShellContent state={state} view={{ kind: "home" }} />);

      expect(screen.queryByRole("heading", { name: /maintenance closure audit handoff readiness helper/i })).not.toBeInTheDocument();
      expect(screen.queryByText(auditHandoffReadinessDocPath)).not.toBeInTheDocument();
      expect(screen.queryByText(auditHandoffRoutingLedgerTemplateDocPath)).not.toBeInTheDocument();

      unmount();
    }
  });

  it("keeps protected admin source wired to Phase 6C, Phase 6B, and Phase 6A docs", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const adminHomeSource = readRepoFile("website/app/admin/page.tsx");

    expect(adminHomeSource).toContain('view={{ kind: "home" }}');
    expect(adminSource).toContain(auditHandoffReadinessDocPath);
    expect(adminSource).toContain(auditHandoffRoutingLedgerTemplateDocPath);
    expect(adminSource).toContain(closureDecisionReadinessDocPath);
    expect(adminSource).toContain(recommendationPacketLedgerTemplateDocPath);
    expect(adminSource).toMatch(/Phase 6C-A\/B admin-only maintenance closure audit handoff readiness/i);
    expect(adminSource).toMatch(/<MaintenanceClosureArchiveReadinessHelper \/>[\s\S]*<MaintenanceClosureAuditHandoffReadinessHelper \/>/);
  });

  it("keeps public production source free of Phase 6C, Phase 6B, Phase 6A, provider, admin, handoff, and release-control internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /maintenance closure audit handoff|audit handoff packet routing ledger|maintenance closure archive|closure archive retention ledger|maintenance closure decision|closure recommendation packet|support follow-up|storage provider|scheduler\/cron|provider setup|environment\/secrets|admin route|release-control|owner handoff|\/admin\//i,
    );
  });

  it("keeps public production source rental/enquiry-only, non-promissory, and free of customer-flow creep", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).toMatch(/listing|listings/i);
    expect(publicSource).toMatch(/rental|rentals/i);
    expect(publicSource).toMatch(/quote|enquiry|request/i);
    expect(publicSource).not.toMatch(/\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i);
    expect(publicSource).not.toMatch(/\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i);
    expect(publicSource).not.toMatch(/customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i);
  });

  it("keeps Phase 6C docs template-only with no handoff, external disclosure, archive, retention, evidence, or deployment claim", () => {
    const docs = `${readRepoFile(auditHandoffReadinessDocPath)}\n${readRepoFile(auditHandoffRoutingLedgerTemplateDocPath)}`;

    expect(docs).toContain("[NOT EVIDENCE / NOT RECORDED]");
    expect(docs).toContain("[DEPLOYMENT APPROVAL: NOT GRANTED]");
    expect(docs).toContain("No audit handoff is created.");
    expect(docs).toContain("This ledger is not an audit handoff, not an audit packet, not an external disclosure");
    expect(docs).not.toMatch(
      /actual deployment|audit handoff was created|audit packet was sent|audit recipient was contacted|external disclosure was made|archive was created|archive record was written|retention policy was applied|closure decision was recorded|closure approval was recorded|maintenance was marked complete|production evidence was collected|smoke check was run|provider check was executed|runtime check was executed|customer follow-up was sent|support response was sent|public notice was published|monitoring configured|analytics configured|cron configured|job configured|maintenance was completed|live hotfix|remediation performed|correction completed|retest run|route verification|route walkthrough|preview publication|production launch|provider setup completed|env\/secrets setup completed|owner approved|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|closure evidence captured|archive evidence captured|retention evidence captured|resolution evidence captured|maintenance evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i,
    );
  });

  it("registers the Phase 6C validator and keeps the release suite free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(packageJson.scripts?.["validate:maintenance-closure-audit-handoff-readiness"]).toBe(
      "node scripts/validate-maintenance-closure-audit-handoff-readiness.cjs",
    );
    expect(suite).toContain("args: ['run', 'validate:maintenance-closure-audit-handoff-readiness']");
    expect(suite).toContain("args: ['run', 'validate:maintenance-closure-archive-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
