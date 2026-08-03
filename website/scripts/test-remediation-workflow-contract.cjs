"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const REPOSITORY_ROOT = path.resolve(__dirname, "..", "..");
const WORKFLOW_PATH = path.join(REPOSITORY_ROOT, ".github", "workflows", "ci.yml");
const PACKAGE_PATH = path.join(REPOSITORY_ROOT, "website", "package.json");
const REVIEW_SEQUENCE_PATH = path.join(
  REPOSITORY_ROOT,
  "website",
  "security",
  "dependency-remediation-review-sequencing.json",
);

const REQUIRED_JOBS = [
  "repo-validation",
  "exact-head-production-audit",
  "website-validation",
  "tracked-file-safety",
];

const PR_HEAD_EXPRESSION =
  "github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.event_name == 'push' && github.sha || ''";

const EXPECTED_REVISION_EXPRESSION = "${{ " + PR_HEAD_EXPRESSION + " }}";

function readWorkflow() {
  return fs.readFileSync(WORKFLOW_PATH, "utf8").replace(/\r\n/g, "\n");
}

function extractJob(workflow, jobName) {
  const startMarker = `  ${jobName}:\n`;
  const start = workflow.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing ${jobName} job`);
  const remainder = workflow.slice(start + startMarker.length);
  const nextJob = remainder.search(/^  [a-z0-9-]+:\n/m);
  return nextJob === -1 ? remainder : remainder.slice(0, nextJob);
}

function extractStep(job, stepName) {
  const startMarker = `- name: ${stepName}\n`;
  const start = job.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing ${stepName} step in job`);
  const remainder = job.slice(start + startMarker.length);
  const nextStep = remainder.search(/^\s+- name: /m);
  return nextStep === -1 ? remainder : remainder.slice(0, nextStep);
}

function extractExpectedRevisionExpression(job) {
  const marker = "EXPECTED_REVISION: ";
  const start = job.indexOf(marker);
  assert.notEqual(start, -1, "Missing EXPECTED_REVISION job env");
  const lineEnd = job.indexOf("\n", start);
  const line = job.slice(start, lineEnd === -1 ? undefined : lineEnd);
  return line.slice(marker.length).trim();
}

function hasGithubShaFallbackOnPullRequest(job) {
  const revision = extractExpectedRevisionExpression(job);
  return revision.includes("pull_request.head.sha || github.sha");
}

test("every required job binds checkout to one literal event-derived revision", () => {
  const workflow = readWorkflow();
  const revisions = new Set();

  for (const jobName of REQUIRED_JOBS) {
    const job = extractJob(workflow, jobName);
    const checkout = extractStep(job, "Check out literal source revision");

    assert.match(checkout, /uses: actions\/checkout@v4/);
    assert.match(checkout, /\n\s+ref: \$\{\{ env\.EXPECTED_REVISION \}\}\n/);
    assert.doesNotMatch(checkout, /ref: \$\{\{ github\.sha \}\}/);
    assert.doesNotMatch(checkout, /ref: main/);
    assert.doesNotMatch(checkout, /\n\s+ref: $/);

    const revision = extractExpectedRevisionExpression(job);
    assert.equal(revision, EXPECTED_REVISION_EXPRESSION);
    revisions.add(revision);
  }

  assert.equal(revisions.size, 1, "required jobs must share one identical revision");
});

test("every required job asserts the literal exact head immediately after checkout", () => {
  const workflow = readWorkflow();

  for (const jobName of REQUIRED_JOBS) {
    const job = extractJob(workflow, jobName);
    const assertion = extractStep(job, "Assert literal exact-head checkout");

    const checkout = extractStep(job, "Check out literal source revision");
    assert.ok(
      job.indexOf(checkout) < job.indexOf(assertion),
      `${jobName} must assert after checkout`,
    );

    assert.match(assertion, /git rev-parse HEAD/);
    assert.match(assertion, /\$EXPECTED_REVISION/);
    assert.match(assertion, /test -n "\$EXPECTED_REVISION"/);
    assert.doesNotMatch(assertion, /continue-on-error/);
    assert.doesNotMatch(assertion, /\n\s+if: /);
  }
});

test("PR events prove the checkout is not the synthetic merge commit", () => {
  const workflow = readWorkflow();

  for (const jobName of REQUIRED_JOBS) {
    const job = extractJob(workflow, jobName);
    const assertion = extractStep(job, "Assert literal exact-head checkout");

    assert.match(assertion, /GITHUB_BASE_REF/);
    assert.match(assertion, /!= "\$\{\{ github\.sha \}\}"/);
  }
});

test("no required job uses synthetic github.sha as the pull-request authority", () => {
  const workflow = readWorkflow();

  for (const jobName of REQUIRED_JOBS) {
    const job = extractJob(workflow, jobName);
    assert.equal(hasGithubShaFallbackOnPullRequest(job), false);
    assert.doesNotMatch(
      job,
      /EXPECTED_REVISION: \$\{\{ github\.sha \}\}/,
    );
  }
});

test("unsupported events receive an explicit empty revision that must fail the assertion", () => {
  const workflow = readWorkflow();

  for (const jobName of REQUIRED_JOBS) {
    const job = extractJob(workflow, jobName);
    const revision = extractExpectedRevisionExpression(job);
    assert.ok(revision.endsWith("|| '' }}"), `${jobName} must reject unsupported events`);
    assert.ok(revision.includes("github.event_name == 'pull_request'"));
    assert.ok(revision.includes("github.event_name == 'push'"));
  }
});

test("required jobs are not permissive or conditionally bypassable", () => {
  const workflow = readWorkflow();

  for (const jobName of REQUIRED_JOBS) {
    const job = extractJob(workflow, jobName);
    assert.doesNotMatch(job, /continue-on-error: true/);
    assert.doesNotMatch(job, /\n    if: /);
    assert.doesNotMatch(job, /\n  if: /);
    assert.doesNotMatch(job, /needs:/);
  }

  const assertion = extractStep(
    extractJob(workflow, "repo-validation"),
    "Assert literal exact-head checkout",
  );
  assert.doesNotMatch(assertion, /\n\s+if: /);
});

test("no required job validates another commit through a different checkout", () => {
  const workflow = readWorkflow();

  for (const jobName of REQUIRED_JOBS) {
    const job = extractJob(workflow, jobName);
    const checkoutCount = (job.match(/actions\/checkout@v4/g) ?? []).length;
    assert.equal(checkoutCount, 1, `${jobName} must use exactly one checkout`);
    assert.doesNotMatch(job, /ref: \$\{\{ github\.sha \}\}/);
  }
});

test("all required jobs stay in the required dependency graph without cross-job substitution", () => {
  const workflow = readWorkflow();

  for (const jobName of REQUIRED_JOBS) {
    const job = extractJob(workflow, jobName);
    assert.doesNotMatch(job, /needs:/);
    assert.match(job, /name: .+/);
  }

  for (const jobName of [
    "website-validation",
    "exact-head-production-audit",
  ]) {
    assert.match(extractJob(workflow, jobName), /timeout-minutes: [1-9][0-9]*/);
  }
});

test("exact-head audit preserves its validator-owned evidence and admission gates", () => {
  const audit = extractJob(readWorkflow(), "exact-head-production-audit");
  const enforceIndex = audit.indexOf(
    "- name: Enforce zero production dependency vulnerabilities",
  );
  const verifyIndex = audit.indexOf(
    "- name: Verify production audit upload admission",
  );
  const uploadIndex = audit.indexOf(
    "- name: Upload production dependency audit evidence",
  );
  const outcomeIndex = audit.indexOf(
    "- name: Enforce production audit and admission outcomes",
  );
  assert.notEqual(enforceIndex, -1);
  assert.notEqual(verifyIndex, -1);
  assert.notEqual(uploadIndex, -1);
  assert.notEqual(outcomeIndex, -1);
  assert.ok(enforceIndex < verifyIndex);
  assert.ok(verifyIndex < uploadIndex);
  assert.ok(uploadIndex < outcomeIndex);
  const betweenVerificationAndUpload = audit.slice(verifyIndex, uploadIndex);
  assert.equal(
    (betweenVerificationAndUpload.match(/^\s*- name: /gm) ?? []).length,
    1,
  );
  assert.match(audit, /mktemp -d/);
  assert.match(audit, /chmod 700/);
  assert.match(audit, /randomBytes\(32\)/);
  assert.match(
    audit,
    /production-dependency-audit-evidence\.json/,
  );
  assert.match(
    audit,
    /production-dependency-audit-upload-admission\.json/,
  );
  assert.match(audit, /--verify-upload-admission/);
  assert.match(
    audit,
    /path: \$\{\{ steps\.audit-path\.outputs\.evidence \}\}/,
  );
  assert.match(
    audit,
    /if: steps\.audit-admission\.outcome == 'success'/,
  );
  const uploadStep = audit.slice(uploadIndex, outcomeIndex);
  assert.doesNotMatch(uploadStep, /if: always\(\)/);
  assert.match(
    audit,
    /EXPECTED_AUDIT_REVISION: \$\{\{ env\.EXPECTED_REVISION \}\}/,
  );
  assert.match(
    audit,
    /AUDIT_STATUS: \$\{\{ steps\.production-audit\.outputs\.status \}\}/,
  );
  assert.match(
    audit,
    /ADMISSION_OUTCOME: \$\{\{ steps\.audit-admission\.outcome \}\}/,
  );
  assert.doesNotMatch(audit, /continue-on-error: true/);
});

test("audit evidence artifact name binds to the same literal revision", () => {
  const audit = extractJob(readWorkflow(), "exact-head-production-audit");
  assert.match(
    audit,
    /name: production-dependency-audit-\$\{\{ env\.EXPECTED_REVISION \}\}/,
  );
});

test("the joined integration step names no longer claim a seven-case contract", () => {
  const workflow = readWorkflow();
  assert.doesNotMatch(workflow, /seven-case PostgreSQL/);
});

test("accepted dependency resolution remains exact", () => {
  const manifest = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8"));
  assert.equal(manifest.dependencies.next, "16.2.12");
  assert.equal(manifest.overrides.postcss, "8.5.23");
  assert.equal(manifest.overrides.sharp, "0.35.3");
  assert.equal(manifest.engines.node, ">=24 <25");
});

test("dependency remediation review sequencing is explicit and forbids auto-merge", () => {
  const contract = JSON.parse(fs.readFileSync(REVIEW_SEQUENCE_PATH, "utf8"));
  assert.equal(contract.schemaVersion, 1);
  assert.equal(contract.scope, "dependency-remediation-final-review");
  assert.deepEqual(contract.requiredOrder, [
    "Keep the pull request draft while implementation changes.",
    "Freeze the exact candidate head.",
    "Trigger the final automated review.",
    "Wait for that review to complete.",
    "Repair findings and retrigger as needed.",
    "Require a completed clean review on the unchanged head.",
    "Perform controller acceptance afterward.",
    "Merge without triggering another review event.",
  ]);
  assert.equal(contract.automaticMergeAllowed, false);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
