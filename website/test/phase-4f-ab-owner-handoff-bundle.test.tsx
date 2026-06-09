import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const phase4fDocs = [
  "docs/content/OWNER-FACING-REVIEW-BRIEF.md",
  ".github/ISSUE_TEMPLATE/owner-approval-request.md",
  "docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md",
  "docs/OWNER-HANDOFF-BUNDLE.md"
];
const publicSourceFiles = [
  "website/app/layout.tsx",
  "website/app/page.tsx",
  "website/app/listings/page.tsx",
  "website/app/categories/page.tsx",
  "website/app/catalogue/page.tsx",
  "website/app/events/page.tsx",
  "website/app/quote/page.tsx",
  "website/app/not-found.tsx",
  "website/components/QuoteRequestForm.tsx"
];

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function normalise(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

const authorisedState = {
  status: "authorised_admin" as const,
  dashboard: {
    status: "loaded" as const,
    data: {
      categories: [],
      products: [],
      images: [],
      imageSummary: {
        totalImages: 0,
        activeImages: 0,
        primaryImages: 0
      }
    }
  },
  quoteInbox: {
    status: "loaded" as const,
    data: {
      quoteRequests: []
    }
  }
};

describe("Phase 4F-A/B owner handoff bundle", () => {
  afterEach(() => cleanup());

  it("keeps all Phase 4F docs and templates present with required placeholders and statuses", () => {
    const docs = normalise(phase4fDocs.map(readRepoFile).join("\n"));

    for (const required of [
      "repo-local",
      "template-only",
      "non-live",
      "[NOT EVIDENCE / NOT RECORDED]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]",
      "Owner review question placeholder",
      "Current safe state",
      "Blocked action",
      "Required explicit owner response placeholder",
      "Owner content review approval",
      "Owner public wording approval",
      "Owner listing/category/media fact approval",
      "Owner quote/enquiry expectation approval",
      "Owner contact/business/service-area fact approval",
      "Owner legal/policy/guarantee wording approval",
      "Protected admin workflow review approval",
      "Preview planning approval",
      "Provider/environment setup approval",
      "Deployment approval",
      "Requested decision",
      "Scope of approval",
      "Target environment placeholder",
      "Provider/environment owner placeholder",
      "Rollback owner placeholder",
      "Evidence capture location placeholder",
      "Stop/rollback condition placeholder",
      "Explicit owner response placeholder",
      "Passing all commands does not equal owner approval",
      "Passing all commands does not equal provider approval",
      "Passing all commands does not equal deployment approval",
      "No preview smoke command is allowed in this phase",
      "It records no owner approval",
      "It performs no deployment"
    ]) {
      expect(docs).toContain(required);
    }
  });

  it("renders the protected Phase 4F handoff-bundle snapshot for authorised admins only", () => {
    render(
      <AdminShellContent
        state={authorisedState}
        view={{ kind: "release-control" }}
      />
    );

    expect(
      screen.getByRole("heading", { name: /phase 4f handoff-bundle snapshot/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Owner-facing review brief")).toBeInTheDocument();
    expect(screen.getByText("Owner approval issue template")).toBeInTheDocument();
    expect(screen.getByText("No-deploy preflight command center")).toBeInTheDocument();
    expect(screen.getByText("Owner handoff bundle index")).toBeInTheDocument();
  });

  it("blocks the Phase 4F snapshot for unauthenticated, not-authorised, and unavailable states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      cleanup();
      render(<AdminShellContent state={state} view={{ kind: "release-control" }} />);
      expect(
        screen.queryByRole("heading", { name: /phase 4f handoff-bundle snapshot/i })
      ).not.toBeInTheDocument();
    }
  });

  it("references the new docs and templates from the protected admin shell", () => {
    const shell = readRepoFile("website/app/admin/protected-admin-shell.tsx");

    for (const docPath of phase4fDocs) {
      expect(shell).toContain(docPath);
    }
    expect(shell).toContain("phase4fOwnerHandoffBundleSnapshot");
  });

  it("does not expose owner handoff or protected internals through public source", () => {
    const publicSource = publicSourceFiles.map(readRepoFile).join("\n");

    expect(publicSource).not.toMatch(
      /owner-facing review brief|owner approval issue template|no-deploy preflight command center|owner handoff bundle|owner approval request packet|preview-planning handoff template|final no-deploy decision gate|local release-candidate freeze|full-suite reliability gate|deployment-planning firewall closure|local owner-review rehearsal pack|local blocker ledger|local acceptance drill|release-control internals|owner-review templates|protected admin urls|admin urls|internal notes|recovery lane statuses|destructive-action safeguards|status-transition matrix details|\/admin\//i
    );
  });

  it("keeps public source rental/enquiry-only without fake facts or forbidden flows", () => {
    const publicSource = publicSourceFiles.map(readRepoFile).join("\n");

    expect(publicSource).toMatch(/listing/i);
    expect(publicSource).toMatch(/enquiry/i);
    expect(publicSource).toMatch(/quote/i);
    expect(publicSource).toMatch(/rental/i);
    expect(publicSource).toMatch(/event furniture/i);
    expect(publicSource).not.toMatch(/\b(ecommerce|cart|checkout|order|payment|purchase)\b/i);
    expect(publicSource).not.toMatch(/\b(booking|reservation|fulfilment|stock-reservation)\b/i);
    expect(publicSource).not.toMatch(/public quote tracking|customer account|customer upload|CRM|notification/i);
    expect(publicSource).not.toMatch(/award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i);
  });

  it("does not add forbidden runtime/provider/deployment env reads", () => {
    const source = [
      "package.json",
      "website/package.json",
      "website/lib/server-runtime-config.ts",
      "website/app/admin/protected-admin-shell.tsx"
    ].map(readRepoFile).join("\n");

    expect(source).not.toMatch(/NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N|SUPABASE_SERVICE_ROLE|PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX|@pinecone-database/i);
  });

  it("keeps the release-candidate suite free of Docker skip bypass logic", () => {
    expect(readRepoFile("scripts/validate-release-candidate-suite.cjs")).not.toMatch(
      /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i
    );
  });

  it("registers validate:owner-handoff-bundle in root package.json", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));

    expect(packageJson.scripts["validate:owner-handoff-bundle"]).toBe(
      "node scripts/validate-owner-handoff-bundle.cjs"
    );
  });
});
