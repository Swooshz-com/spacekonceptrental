"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const WEBSITE_ROOT = path.resolve(__dirname, "..");
const AUDIT_COMMAND = "npm audit --omit=dev --json";
const SEVERITIES = ["info", "low", "moderate", "high", "critical"];
const EXPECTED_VERSIONS = Object.freeze({
  next: "16.2.12",
  postcss: "8.5.23",
  sharp: "0.35.3",
});
const EXPECTED_BASE_VULNERABILITY_TOTALS = Object.freeze({
  info: 0,
  low: 0,
  moderate: 0,
  high: 3,
  critical: 0,
  total: 3,
});
const EXPECTED_BASE_PACKAGE_NODES = Object.freeze([
  "next",
  "postcss",
  "sharp",
]);
const EXPECTED_BASE_ADVISORIES = Object.freeze([
  "GHSA-4633-3j49-mh5q",
  "GHSA-4c39-4ccg-62r3",
  "GHSA-68g3-v927-f742",
  "GHSA-6g55-p6wh-862q",
  "GHSA-6gpp-xcg3-4w24",
  "GHSA-89xv-2m56-2m9x",
  "GHSA-955p-x3mx-jcvp",
  "GHSA-f88m-g3jw-g9cj",
  "GHSA-m99w-x7hq-7vfj",
  "GHSA-p9j2-gv94-2wf4",
  "GHSA-q8wf-6r8g-63ch",
  "GHSA-qx2v-qp2m-jg93",
  "GHSA-r28c-9q8g-f849",
]);
const DEFAULT_BASELINE = path.join(
  WEBSITE_ROOT,
  "security",
  "production-dependency-audit-baseline.json",
);
const MAX_AUDIT_BYTES = 10 * 1024 * 1024;
const AUDIT_TIMEOUT_MS = 120_000;

class AuditValidationError extends Error {}

function invariant(condition, message) {
  if (!condition) {
    throw new AuditValidationError(message);
  }
}

function parseArguments(argv) {
  const options = {
    baseline: DEFAULT_BASELINE,
    evidenceOutput: undefined,
    expectedRevision: process.env.EXPECTED_AUDIT_REVISION,
    selfTest: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--self-test") {
      options.selfTest = true;
      continue;
    }

    const value = argv[index + 1];
    invariant(value && !value.startsWith("--"), `Missing value for ${argument}`);
    if (argument === "--baseline") {
      options.baseline = path.resolve(WEBSITE_ROOT, value);
    } else if (argument === "--evidence-output") {
      options.evidenceOutput = path.resolve(WEBSITE_ROOT, value);
    } else if (argument === "--expected-revision") {
      options.expectedRevision = value;
    } else {
      throw new AuditValidationError(`Unknown argument: ${argument}`);
    }
    index += 1;
  }

  return options;
}

function parseAuditDocument(rawJson) {
  invariant(
    typeof rawJson === "string" && rawJson.length > 0,
    "npm audit produced no JSON output",
  );

  let document;
  try {
    document = JSON.parse(rawJson);
  } catch {
    throw new AuditValidationError("npm audit output was malformed JSON");
  }

  const counts = document?.metadata?.vulnerabilities;
  invariant(
    counts && typeof counts === "object" && !Array.isArray(counts),
    "npm audit JSON omitted metadata.vulnerabilities",
  );

  const normalizedCounts = {};
  for (const severity of SEVERITIES) {
    invariant(
      Number.isSafeInteger(counts[severity]) && counts[severity] >= 0,
      `npm audit JSON has an invalid ${severity} count`,
    );
    normalizedCounts[severity] = counts[severity];
  }

  invariant(
    Number.isSafeInteger(counts.total) && counts.total >= 0,
    "npm audit JSON has an invalid total count",
  );
  normalizedCounts.total = counts.total;

  const severityTotal = SEVERITIES.reduce(
    (total, severity) => total + normalizedCounts[severity],
    0,
  );
  invariant(
    severityTotal === normalizedCounts.total,
    "npm audit severity counts do not equal the reported total",
  );

  const vulnerabilities = document.vulnerabilities;
  invariant(
    vulnerabilities &&
      typeof vulnerabilities === "object" &&
      !Array.isArray(vulnerabilities),
    "npm audit JSON omitted the vulnerability-node map",
  );

  const vulnerablePackageNodes = Object.keys(vulnerabilities).sort();
  invariant(
    normalizedCounts.total === 0 || vulnerablePackageNodes.length > 0,
    "npm audit reported vulnerabilities without package nodes",
  );
  invariant(
    normalizedCounts.total > 0 || vulnerablePackageNodes.length === 0,
    "npm audit reported package nodes with a zero total",
  );

  const advisoryIdentifiers = new Set();
  for (const vulnerability of Object.values(vulnerabilities)) {
    invariant(
      vulnerability &&
        typeof vulnerability === "object" &&
        Array.isArray(vulnerability.via),
      "npm audit returned a malformed vulnerability node",
    );
    for (const cause of vulnerability.via) {
      if (cause && typeof cause === "object" && typeof cause.url === "string") {
        const match = cause.url.match(/\/advisories\/(GHSA-[A-Za-z0-9-]+)$/);
        if (match) {
          advisoryIdentifiers.add(match[1]);
        }
      }
    }
  }

  return {
    counts: normalizedCounts,
    vulnerablePackageNodes,
    advisoryIdentifiers: [...advisoryIdentifiers].sort(),
  };
}

function validateAuditExitCode(exitCode, counts) {
  invariant(
    exitCode === 0 || exitCode === 1,
    "npm audit failed for a reason other than reported vulnerabilities",
  );
  invariant(
    !(exitCode === 0 && counts.total !== 0),
    "npm audit returned success while reporting production vulnerabilities",
  );
  invariant(
    !(exitCode === 1 && counts.total === 0),
    "npm audit returned a failure code without production vulnerabilities",
  );
}

function classifySecretExposure(rawJson) {
  const possibleSecretPatterns = [
    /gh[pousr]_[A-Za-z0-9]{20,}/i,
    /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/i,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  ];
  const privateLocalPathPatterns = [
    /[A-Z]:[\\/]Users[\\/][^\\/"\s]+[\\/]/i,
    /\/home\/[^/"\s]+\//i,
    /\/Users\/[^/"\s]+\//,
  ];

  return {
    classification:
      possibleSecretPatterns.some((pattern) => pattern.test(rawJson)) ||
      privateLocalPathPatterns.some((pattern) => pattern.test(rawJson))
        ? "possible"
        : "none",
    containsPrivateLocalPath: privateLocalPathPatterns.some((pattern) =>
      pattern.test(rawJson),
    ),
  };
}

function runProductionAudit() {
  const executable = process.platform === "win32" ? "cmd.exe" : "npm";
  const arguments_ =
    process.platform === "win32"
      ? ["/d", "/s", "/c", AUDIT_COMMAND]
      : ["audit", "--omit=dev", "--json"];
  const result = spawnSync(
    executable,
    arguments_,
    {
      cwd: WEBSITE_ROOT,
      encoding: "utf8",
      maxBuffer: MAX_AUDIT_BYTES,
      timeout: AUDIT_TIMEOUT_MS,
      windowsHide: true,
    },
  );

  invariant(!result.error, "npm audit could not execute safely");
  invariant(!result.signal, "npm audit exceeded its bounded execution");
  invariant(Number.isInteger(result.status), "npm audit returned no exit code");

  const parsed = parseAuditDocument(result.stdout);
  validateAuditExitCode(result.status, parsed.counts);

  const safety = classifySecretExposure(result.stdout);
  invariant(
    safety.classification === "none",
    "npm audit output may contain a secret or private local path",
  );

  return {
    ...parsed,
    exitCode: result.status,
    rawJsonSha256: crypto
      .createHash("sha256")
      .update(result.stdout, "utf8")
      .digest("hex"),
    safety,
  };
}

function readJson(filePath, description) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    throw new AuditValidationError(`${description} could not be read`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new AuditValidationError(`${description} is malformed JSON`);
  }
}

function validateBaseline(baseline) {
  invariant(
    baseline?.schemaVersion === 1 &&
      baseline.scope === "production-dependencies-only",
    "The audit baseline has an unsupported schema",
  );
  const before = baseline.before;
  invariant(
    before?.baseRevision ===
      "522ed73c81640fb2c5a626fd48bd40f317749421",
    "The audit baseline is not bound to the required base revision",
  );
  invariant(before.command === AUDIT_COMMAND, "The audit baseline command differs");
  invariant(before.exitCode === 1, "The audit baseline exit code differs");
  invariant(
    /^[0-9a-f]{64}$/.test(before.rawJsonSha256),
    "The audit baseline digest is invalid",
  );
  invariant(
    before?.safety?.secretExposureClassification === "none" &&
      before.safety.containsPrivateLocalPath === false,
    "The audit baseline is not public-safe",
  );
  assert.deepEqual(
    before.vulnerabilityTotals,
    EXPECTED_BASE_VULNERABILITY_TOTALS,
    "The audit baseline vulnerability totals differ",
  );
  assert.deepEqual(
    before.vulnerablePackageNodes,
    EXPECTED_BASE_PACKAGE_NODES,
    "The audit baseline package nodes differ",
  );
  assert.deepEqual(
    before.advisoryIdentifiers,
    EXPECTED_BASE_ADVISORIES,
    "The audit baseline advisory identifiers differ",
  );
  parseAuditDocument(
    JSON.stringify({
      vulnerabilities: Object.fromEntries(
        before.vulnerablePackageNodes.map((name) => [name, { via: [] }]),
      ),
      metadata: { vulnerabilities: before.vulnerabilityTotals },
    }),
  );
  return before;
}

function readResolvedVersions() {
  const manifest = readJson(
    path.join(WEBSITE_ROOT, "package.json"),
    "website package manifest",
  );
  invariant(
    manifest.dependencies?.next === EXPECTED_VERSIONS.next,
    "Next is not exactly pinned to the accepted target",
  );
  invariant(
    manifest.overrides?.postcss === EXPECTED_VERSIONS.postcss,
    "The PostCSS root override differs from the accepted target",
  );
  invariant(
    manifest.overrides?.sharp === EXPECTED_VERSIONS.sharp,
    "The sharp root override differs from the accepted target",
  );
  invariant(
    manifest.engines?.node === ">=24 <25",
    "The Node 24 engine boundary changed",
  );

  const resolvedVersions = {};
  for (const [packageName, expectedVersion] of Object.entries(
    EXPECTED_VERSIONS,
  )) {
    const installedManifest = readJson(
      path.join(WEBSITE_ROOT, "node_modules", packageName, "package.json"),
      `${packageName} installed package manifest`,
    );
    invariant(
      installedManifest.name === packageName &&
        installedManifest.version === expectedVersion,
      `${packageName} did not resolve to ${expectedVersion}`,
    );
    resolvedVersions[packageName] = installedManifest.version;
  }
  return resolvedVersions;
}

function readHeadRevision(expectedRevision) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: WEBSITE_ROOT,
    encoding: "utf8",
    timeout: 10_000,
    windowsHide: true,
  });
  invariant(
    result.status === 0 && /^[0-9a-f]{40}\s*$/.test(result.stdout),
    "The exact Git revision could not be established",
  );
  const revision = result.stdout.trim();
  if (expectedRevision) {
    invariant(
      /^[0-9a-f]{40}$/.test(expectedRevision),
      "The expected audit revision is invalid",
    );
    invariant(
      revision === expectedRevision,
      "The checked-out revision differs from the expected exact head",
    );
  }
  return revision;
}

function writeEvidence(filePath, baseline, revision, audit, resolvedVersions) {
  if (!filePath) {
    return;
  }

  const evidence = {
    schemaVersion: 1,
    scope: "production-dependencies-only",
    before: baseline,
    after: {
      revision,
      command: AUDIT_COMMAND,
      exitCode: audit.exitCode,
      vulnerabilityTotals: audit.counts,
      vulnerablePackageNodes: audit.vulnerablePackageNodes,
      advisoryIdentifiers: audit.advisoryIdentifiers,
      rawJsonSha256: audit.rawJsonSha256,
      resolvedVersions,
      safety: {
        rawJsonCommitted: false,
        secretExposureClassification: audit.safety.classification,
        containsPrivateLocalPath: audit.safety.containsPrivateLocalPath,
      },
    },
    developmentDependencyAudit: {
      includedInGate: false,
      reason:
        "Development-only findings are explicitly outside this production-only gate and are not represented as production results.",
    },
  };

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

function runSelfTest() {
  const zeroCounts = {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: 0,
  };
  const findingCounts = { ...zeroCounts, high: 1, total: 1 };
  const zeroDocument = JSON.stringify({
    vulnerabilities: {},
    metadata: { vulnerabilities: zeroCounts },
  });
  const findingDocument = JSON.stringify({
    vulnerabilities: {
      example: {
        via: [
          {
            url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
          },
        ],
      },
    },
    metadata: { vulnerabilities: findingCounts },
  });

  assert.deepEqual(parseAuditDocument(zeroDocument).counts, zeroCounts);
  assert.deepEqual(parseAuditDocument(findingDocument).counts, findingCounts);
  assert.doesNotThrow(() => validateAuditExitCode(0, zeroCounts));
  assert.doesNotThrow(() => validateAuditExitCode(1, findingCounts));
  assert.throws(() => parseAuditDocument("not-json"), AuditValidationError);
  assert.throws(
    () => validateAuditExitCode(2, zeroCounts),
    AuditValidationError,
  );
  assert.throws(
    () => validateAuditExitCode(1, zeroCounts),
    AuditValidationError,
  );
  assert.throws(
    () => validateAuditExitCode(0, findingCounts),
    AuditValidationError,
  );
  assert.equal(classifySecretExposure(zeroDocument).classification, "none");
  const syntheticToken = ["ghp", "_", "1".repeat(20)].join("");
  assert.equal(
    classifySecretExposure(JSON.stringify({ token: syntheticToken })).classification,
    "possible",
  );

  process.stdout.write("Production dependency audit self-test: PASS\n");
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.selfTest) {
    runSelfTest();
    return;
  }

  const baseline = validateBaseline(
    readJson(options.baseline, "production audit baseline"),
  );
  const revision = readHeadRevision(options.expectedRevision);
  const resolvedVersions = readResolvedVersions();
  const audit = runProductionAudit();
  writeEvidence(
    options.evidenceOutput,
    baseline,
    revision,
    audit,
    resolvedVersions,
  );

  process.stdout.write(
    [
      "Production dependency audit: PASS",
      `Revision: ${revision}`,
      `Command: ${AUDIT_COMMAND}`,
      `Exit code: ${audit.exitCode}`,
      `Counts: ${SEVERITIES.map((severity) => `${severity}=${audit.counts[severity]}`).join(", ")}, total=${audit.counts.total}`,
      `Raw JSON SHA-256: ${audit.rawJsonSha256}`,
      `Resolved: next=${resolvedVersions.next}, postcss=${resolvedVersions.postcss}, sharp=${resolvedVersions.sharp}`,
      "Scope: production dependencies only; development-only audit results are outside this gate.",
    ].join("\n") + "\n",
  );

  invariant(
    audit.counts.total === 0,
    "Production dependency vulnerabilities remain",
  );
}

try {
  main();
} catch (error) {
  const message =
    error instanceof AuditValidationError || error instanceof assert.AssertionError
      ? error.message
      : "Unexpected validator failure";
  process.stderr.write(`Production dependency audit: FAIL\n${message}\n`);
  process.exitCode = 1;
}
