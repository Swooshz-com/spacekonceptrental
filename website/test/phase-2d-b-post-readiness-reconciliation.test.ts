import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

describe("Phase 2D-B post-readiness reconciliation", () => {
  it("records PR #97 as completed and Phase 2D-B as current reconciliation work", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const deploymentChecklist = readRepoFile(
      "docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md"
    );
    const adminOpsChecklist = readRepoFile(
      "docs/checklists/PHASE-2-ADMIN-OPS.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2D-B - post-readiness status, remaining-work map, and evidence guard reconciliation."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2D-A - deployment readiness, environment contract, and smoke-test runbook."
    );
    expect(status).toContain("Last merged phase PR: #97");
    expect(status).toContain(
      "Merge commit: `e04444a41a8993758bb00d6be234c255abb1ff9b`"
    );
    expect(status).toContain(
      "Previous merged status snapshot: Phase 2D-A"
    );
    expect(roadmap).toContain(
      "Phase 2D-B reconciles post-Phase 2D-A status, remaining-work mapping"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2D-B reconciles post-Phase 2D-A status"
    );
    expect(safety).toContain("Phase 2D-B is documentation, checklist");
    expect(safety).toContain("static guard coverage only");
    expect(deploymentChecklist).toContain(
      "Phase 2D-B Post-readiness Reconciliation"
    );
    expect(adminOpsChecklist).toContain(
      "Phase 2D-B Post-readiness Status And Evidence Guard Reconciliation"
    );
  });

  it("keeps the remaining-work map explicit and reviewable", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const evidence = readRepoFile("docs/templates/DEPLOYMENT-EVIDENCE.md");

    for (const requiredText of [
      "Completed through PR #97",
      "Safe next phases",
      "Blocked phases requiring explicit owner approval",
      "Too broad or risky to bundle here"
    ]) {
      expect(status).toContain(requiredText);
    }

    for (const requiredText of [
      "Remaining-work map",
      "Completed phases confirmed",
      "Safe next phases not bundled into this PR",
      "Blocked phases requiring explicit owner approval",
      "Phases too broad or risky to bundle",
      "Largest safe bundle rationale",
      "unrelated runtime, privacy, CRM, notification, SaaS chatbot"
    ]) {
      expect(evidence).toContain(requiredText);
    }
  });

  it("keeps future deployment evidence scoped without approving deployment", () => {
    const environmentReadiness = readRepoFile(
      "docs/DEPLOYMENT-ENVIRONMENT-READINESS.md"
    );
    const runbook = readRepoFile("docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md");
    const evidence = readRepoFile("docs/templates/DEPLOYMENT-EVIDENCE.md");

    expect(environmentReadiness).toContain(
      "The remaining-work map is reviewed so deployment is not bundled"
    );
    expect(runbook).toContain(
      "The remaining-work map is reviewed so deployment does not bundle"
    );
    expect(runbook).toContain(
      "Remaining-work map and largest safe bundle rationale"
    );
    expect(evidence).toContain(
      "Use this template for a future approved deployment PR"
    );
    expect(evidence).toContain(
      "No deployment config is included unless this is the separately approved"
    );
  });

  it("distinguishes completed admin listing media upload from still-blocked public upload surfaces", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const deploymentChecklist = readRepoFile(
      "docs/checklists/PHASE-2A-DEPLOYMENT-READINESS.md"
    );
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");

    expect(status).toMatch(
      /the approved Phase 2C-A protected\s+server-only multipart branch/
    );
    expect(status).toMatch(
      /Customer uploads, arbitrary public upload routes, and storage usage outside/
    );
    expect(deploymentChecklist).toContain(
      "Supabase Storage usage outside the approved admin-controlled `listing-media` workflow"
    );
    expect(safety).toContain(
      "must not describe admin-controlled listing media upload as still"
    );

    expect(status).not.toContain("Listing image uploads and Supabase Storage wiring.");
    expect(status).not.toContain("binary upload and Supabase Storage remain blocked");
  });

  it("does not add real env values or weaken forbidden deployment boundaries", () => {
    const docs = [
      "docs/PHASE-STATUS.md",
      "docs/PHASE-ROADMAP.md",
      "docs/DECISION-LOG.md",
      "docs/SAFETY-BOUNDARIES.md",
      "docs/DEPLOYMENT-ENVIRONMENT-READINESS.md",
      "docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md",
      "docs/templates/DEPLOYMENT-EVIDENCE.md"
    ]
      .map(readRepoFile)
      .join("\n");

    expect(docs).not.toMatch(/https?:\/\/[^\s"'`<>]+/i);
    expect(docs).not.toMatch(/\b[A-Z0-9_]+\s*=\s*[^\s]+/);
    expect(docs).not.toContain(".supabase.co");
    expect(docs).not.toContain(".vercel.app");

    for (const forbiddenBoundary of [
      "does not add Vercel project config",
      "Supabase Cloud",
      "real secrets",
      "browser Supabase",
      "service-role runtime paths",
      "n8n/Pinecone runtime changes",
      "`website/chat-config.js` access"
    ]) {
      expect(docs).toContain(forbiddenBoundary);
    }
  });
});
