import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const responseAcknowledgementReadinessDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-READINESS.md";
const responseAcknowledgementPacketLedgerTemplateDocPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-PACKET-LEDGER-TEMPLATE.md";
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

describe("Phase 6I-A/B maintenance closure audit follow-up response acknowledgement readiness", () => {
  it("keeps protected admin source wired to the Phase 6I helper after Phase 6H on the real home view path", () => {
    const adminSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const adminHomeSource = readRepoFile("website/app/admin/page.tsx");

    expect(adminHomeSource).toContain('view={{ kind: "home" }}');
    expect(adminSource).toContain("function MaintenanceClosureAuditFollowUpResponseAcknowledgementReadinessHelper()");
    expect(adminSource).toContain(responseAcknowledgementReadinessDocPath);
    expect(adminSource).toContain(responseAcknowledgementPacketLedgerTemplateDocPath);
    expect(adminSource).toMatch(/Phase 6I-A\/B admin-only maintenance closure audit follow-up response acknowledgement readiness/i);
    expect(adminSource).toMatch(/Maintenance closure audit follow-up response acknowledgement readiness helper/i);
    expect(adminSource).toMatch(/Audit response acknowledgement packet ledger/i);
    expect(adminSource).toMatch(/Audit response acknowledgement packet ledger/i);
    expect(adminSource).toMatch(/Audit response acknowledgement readiness checklist/i);
    expect(adminSource).toMatch(/No-acknowledgement\/no-contact\/no-remediation firewall/i);
    expect(adminSource).toMatch(/Safe response acknowledgement language/i);
    expect(adminSource).toMatch(/<MaintenanceClosureAuditFollowUpResponseDispatchReadinessHelper \/>[\s\S]*<MaintenanceClosureAuditFollowUpResponseAcknowledgementReadinessHelper \/>/);
  });

  it("keeps Phase 6I docs readiness-only with no response, remediation, evidence, or deployment claim", () => {
    const docs = `${readRepoFile(responseAcknowledgementReadinessDocPath)}\n${readRepoFile(responseAcknowledgementPacketLedgerTemplateDocPath)}`;

    for (const required of [
      "No dispatch channel configured",
      "No delivery confirmation recorded",
      "Intended acknowledgement channel placeholder",
      "No recipient list configured",
      "No response option selected",
      "No response drafted",
      "No response approved",
      "No approval decision recorded",
      "No response approval request sent",
      "No dispatch decision recorded",
      "No response delivered",
      "No recipient contacted",
      "No recipient acknowledgement recorded",
      "No response sent",
      "No remediation assigned",
      "No remediation task is created.",
      "No external disclosure is made.",
      "No audit recipient is contacted.",
      "No recipient is contacted.",
      "No production evidence is collected.",
      "No smoke check is run.",
      "No provider/runtime check is executed.",
      "Intended approver placeholder",
      "Intended recipient list placeholder",
      "Intended acknowledgement timing placeholder",
      "Intended acknowledgement criteria placeholder",
      "Acknowledgement readiness status placeholder",
      "No customer/support follow-up is sent.",
      "No production readiness claim is made.",
      "[BLOCKING / NOT EVIDENCE]",
      "Acknowledgement status placeholder",
    ]) {
      expect(docs).toContain(required);
    }

    expect(docs).not.toMatch(
      /actual deployment|audit finding was received|audit finding was recorded|audit follow-up record was created|audit finding was classified|audit severity was assigned|triage owner was assigned|triage decision was recorded|response option was selected|audit response was drafted|audit response was approved|approval decision was recorded|response approval request was sent|dispatch decision was recorded|response dispatch checklist was completed|recipient was contacted|audit response was delivered|delivery confirmation was recorded|recipient confirmation was recorded|acknowledgement request was sent|recipient acknowledgement was recorded|audit response was sent|remediation was assigned|remediation task was created|audit recipient was contacted|external disclosure was made|archive was created|archive record was written|retention policy was applied|closure decision was recorded|closure approval was recorded|maintenance was marked complete|production evidence was collected|smoke check was run|provider check was executed|runtime check was executed|customer follow-up was sent|support response was sent|public notice was published|monitoring configured|analytics configured|cron configured|job configured|maintenance was completed|deployment approval granted/i,
    );
  });

  it("keeps public production source free of Phase 6I, admin, response-acknowledgement, provider, and customer-flow internals", () => {
    const publicSource = readTrackedProductionSources(publicSourceRoots);

    expect(publicSource).not.toMatch(
      /maintenance closure audit follow-up|audit response acknowledgement packet ledger|audit response approval packet ledger|audit finding classification ledger|maintenance closure audit handoff|maintenance closure archive|closure archive retention ledger|maintenance closure decision|closure recommendation packet|support follow-up|storage provider|scheduler\/cron|provider setup|environment\/secrets|admin route|release-control|owner handoff|\/admin\//i,
    );
    expect(publicSource).toMatch(/listing|listings/i);
    expect(publicSource).toMatch(/rental|rentals/i);
    expect(publicSource).toMatch(/quote|enquiry|request/i);
    expect(publicSource).not.toMatch(/\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i);
    expect(publicSource).not.toMatch(/\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i);
    expect(publicSource).not.toMatch(/customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i);
  });

  it("registers the Phase 6I validator and keeps release validation free of Docker bypass logic", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(packageJson.scripts?.["validate:maintenance-closure-audit-follow-up-response-acknowledgement-readiness"]).toBe(
      "node scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-readiness.cjs",
    );
    expect(suite).toContain("args: ['run', 'validate:maintenance-closure-audit-follow-up-response-acknowledgement-readiness']");
    expect(suite).toContain("args: ['run', 'validate:maintenance-closure-audit-follow-up-response-dispatch-readiness']");
    expect(suite).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
