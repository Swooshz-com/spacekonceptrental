"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const REPOSITORY_ROOT = path.resolve(__dirname, "..", "..");
const WORKFLOW_PATH = path.join(REPOSITORY_ROOT, ".github", "workflows", "ci.yml");
const PACKAGE_PATH = path.join(REPOSITORY_ROOT, "website", "package.json");

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

test("pull-request product validation uses the default merge-result checkout", () => {
  const job = extractJob(readWorkflow(), "website-validation");
  const checkoutStep = job.slice(
    job.indexOf("- name: Check out repository"),
    job.indexOf("- name: Set up Node.js"),
  );
  assert.match(checkoutStep, /uses: actions\/checkout@v4/);
  assert.doesNotMatch(checkoutStep, /\n\s+ref:/);
  assert.match(job, /npm run test/);
  assert.match(job, /npm run typecheck/);
  assert.match(job, /npm run build/);
  assert.match(job, /npm run test:sharp-native/);
  assert.doesNotMatch(job, /validate-production-audit\.cjs/);
});

test("exact-head audit uses only the candidate head on pull requests", () => {
  const job = extractJob(readWorkflow(), "exact-head-production-audit");
  const exactAuthority =
    "${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha }}";
  assert.match(job, new RegExp(`ref: ${escapeRegExp(exactAuthority)}`));
  assert.match(
    job,
    new RegExp(`EXPECTED_AUDIT_REVISION: ${escapeRegExp(exactAuthority)}`),
  );
  assert.match(job, /working-directory: website\n\s+run: npm ci/);
  assert.match(job, /validate-production-audit\.cjs/);
  assert.doesNotMatch(job, /npm run test\n/);
  assert.doesNotMatch(job, /npm run typecheck/);
  assert.doesNotMatch(job, /npm run build/);
});

test("push validation binds both authorities to github.sha", () => {
  const workflow = readWorkflow();
  const product = extractJob(workflow, "website-validation");
  const audit = extractJob(workflow, "exact-head-production-audit");
  assert.doesNotMatch(
    product.slice(
      product.indexOf("- name: Check out repository"),
      product.indexOf("- name: Set up Node.js"),
    ),
    /\n\s+ref:/,
  );
  assert.match(audit, /\|\| github\.sha/);
  assert.equal((audit.match(/\|\| github\.sha/g) ?? []).length >= 2, true);
});

test("merge-result and exact-head authorities cannot silently substitute", () => {
  const workflow = readWorkflow();
  const product = extractJob(workflow, "website-validation");
  const audit = extractJob(workflow, "exact-head-production-audit");
  assert.match(product, /name: Website validation/);
  assert.match(audit, /name: Exact-head production audit/);
  assert.doesNotMatch(product, /pull_request\.head\.sha/);
  assert.doesNotMatch(audit, /Run website tests|Run website typecheck|Build website/);
  assert.match(product, /Run website tests/);
  assert.match(audit, /Enforce zero production dependency vulnerabilities/);
});

test("audit evidence is uploaded immediately with a controlled sealed path", () => {
  const audit = extractJob(readWorkflow(), "exact-head-production-audit");
  const enforceIndex = audit.indexOf(
    "- name: Enforce zero production dependency vulnerabilities",
  );
  const uploadIndex = audit.indexOf(
    "- name: Upload production dependency audit evidence",
  );
  assert.notEqual(enforceIndex, -1);
  assert.notEqual(uploadIndex, -1);
  assert.ok(enforceIndex < uploadIndex);
  const between = audit.slice(enforceIndex, uploadIndex);
  assert.equal((between.match(/^\s*- name: /gm) ?? []).length, 1);
  assert.match(audit, /mktemp -d/);
  assert.match(audit, /chmod 700/);
  assert.match(
    audit,
    /production-dependency-audit-evidence\.json/,
  );
  assert.match(
    audit,
    /path: \$\{\{ steps\.audit-path\.outputs\.evidence \}\}/,
  );
  assert.match(audit, /if: always\(\)/);
});

test("both bounded jobs have workflow-level timeout defence", () => {
  const workflow = readWorkflow();
  for (const jobName of [
    "website-validation",
    "exact-head-production-audit",
  ]) {
    assert.match(extractJob(workflow, jobName), /timeout-minutes: [1-9][0-9]*/);
  }
});

test("accepted dependency resolution remains exact", () => {
  const manifest = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8"));
  assert.equal(manifest.dependencies.next, "16.2.12");
  assert.equal(manifest.overrides.postcss, "8.5.23");
  assert.equal(manifest.overrides.sharp, "0.35.3");
  assert.equal(manifest.engines.node, ">=24 <25");
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
