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
const EXPECTED_BASE_REVISION =
  "522ed73c81640fb2c5a626fd48bd40f317749421";
const EXPECTED_BASE_RAW_JSON_SHA256 =
  "68811200574e49daf1f4a7c7c6e286e87b84d6d012bb60595f5b1712b4b3ee5f";
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
const EVIDENCE_FILENAME = "production-dependency-audit-evidence.json";
const MAX_AUDIT_BYTES = 10 * 1024 * 1024;
const MAX_EVIDENCE_BYTES = 64 * 1024;
const AUDIT_TIMEOUT_MS = 120_000;
const NO_FOLLOW = fs.constants.O_NOFOLLOW ?? 0;

class AuditValidationError extends Error {}

function invariant(condition, message) {
  if (!condition) {
    throw new AuditValidationError(message);
  }
}

function parseArguments(argv, environment = process.env) {
  const options = {
    baseline: DEFAULT_BASELINE,
    evidenceOutput: undefined,
    expectedRevision: environment.EXPECTED_AUDIT_REVISION,
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

function validateAuditCommandResult(result) {
  invariant(!result.error, "npm audit could not execute safely");
  invariant(!result.signal, "npm audit exceeded its bounded execution");
  invariant(Number.isInteger(result.status), "npm audit returned no exit code");
  invariant(
    typeof result.stdout === "string" &&
      Buffer.byteLength(result.stdout, "utf8") <= MAX_AUDIT_BYTES,
    "npm audit output exceeded its public-safe bound",
  );

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

function runProductionAudit(execute = spawnSync) {
  const executable = process.platform === "win32" ? "cmd.exe" : "npm";
  const arguments_ =
    process.platform === "win32"
      ? ["/d", "/s", "/c", AUDIT_COMMAND]
      : ["audit", "--omit=dev", "--json"];
  const result = execute(executable, arguments_, {
    cwd: WEBSITE_ROOT,
    encoding: "utf8",
    maxBuffer: MAX_AUDIT_BYTES,
    timeout: AUDIT_TIMEOUT_MS,
    windowsHide: true,
  });
  return validateAuditCommandResult(result);
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
    before?.baseRevision === EXPECTED_BASE_REVISION,
    "The audit baseline is not bound to the required base revision",
  );
  invariant(before.command === AUDIT_COMMAND, "The audit baseline command differs");
  invariant(before.exitCode === 1, "The audit baseline exit code differs");
  invariant(
    before.rawJsonSha256 === EXPECTED_BASE_RAW_JSON_SHA256,
    "The audit baseline digest differs from the accepted source result",
  );
  invariant(
    before?.safety?.rawJsonCommitted === false &&
      before.safety.secretExposureClassification === "none" &&
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

function buildEvidence(baseline, revision, audit, resolvedVersions) {
  return {
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
}

function validateEvidenceDocument(
  evidence,
  baseline,
  revision,
  audit,
  resolvedVersions,
) {
  const expected = buildEvidence(
    baseline,
    revision,
    audit,
    resolvedVersions,
  );
  assert.deepEqual(
    evidence,
    expected,
    "The production audit evidence differs from the validated result",
  );
  invariant(
    evidence.before.rawJsonSha256 === EXPECTED_BASE_RAW_JSON_SHA256,
    "The production audit evidence contains the wrong baseline digest",
  );
  invariant(
    /^[0-9a-f]{64}$/.test(evidence.after.rawJsonSha256),
    "The production audit evidence contains an invalid after-audit digest",
  );
  invariant(
    evidence.after.revision === revision &&
      /^[0-9a-f]{40}$/.test(evidence.after.revision),
    "The production audit evidence contains the wrong exact revision",
  );
  invariant(
    evidence.after.command === AUDIT_COMMAND &&
      (evidence.after.exitCode === 0 || evidence.after.exitCode === 1),
    "The production audit evidence contains an invalid command result",
  );
  validateAuditExitCode(
    evidence.after.exitCode,
    evidence.after.vulnerabilityTotals,
  );
  invariant(
    evidence.after.safety.rawJsonCommitted === false &&
      evidence.after.safety.secretExposureClassification === "none" &&
      evidence.after.safety.containsPrivateLocalPath === false,
    "The production audit evidence is not public-safe",
  );
  assert.deepEqual(
    evidence.after.resolvedVersions,
    EXPECTED_VERSIONS,
    "The production audit evidence contains the wrong resolved versions",
  );
  return evidence;
}

function sameFileIdentity(left, right) {
  return (
    left.isFile() &&
    right.isFile() &&
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.nlink === 1 &&
    right.nlink === 1
  );
}

function validateEvidencePath(filePath, io = fs) {
  invariant(
    path.basename(filePath) === EVIDENCE_FILENAME,
    "The production audit evidence filename is not controlled",
  );
  const parentPath = path.dirname(filePath);
  let parent;
  try {
    parent = io.lstatSync(parentPath);
  } catch {
    throw new AuditValidationError(
      "The production audit evidence directory could not be inspected",
    );
  }
  invariant(
    parent.isDirectory() && !parent.isSymbolicLink(),
    "The production audit evidence directory is not a real directory",
  );
  const realParent =
    typeof io.realpathSync.native === "function"
      ? io.realpathSync.native(parentPath)
      : io.realpathSync(parentPath);
  invariant(
    path.resolve(realParent) === path.resolve(parentPath),
    "The production audit evidence directory resolves through an alternate path",
  );
  if (process.platform !== "win32") {
    invariant(
      (parent.mode & 0o077) === 0,
      "The production audit evidence directory permissions are too broad",
    );
  }
  return parentPath;
}

function readAndValidateEvidenceFile(
  filePath,
  baseline,
  revision,
  audit,
  resolvedVersions,
  io = fs,
) {
  validateEvidencePath(filePath, io);

  let before;
  let descriptor;
  try {
    before = io.lstatSync(filePath);
    invariant(
      before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
      "The production audit evidence path is not a single regular file",
    );
    if (process.platform !== "win32") {
      invariant(
        (before.mode & 0o077) === 0,
        "The production audit evidence file permissions are too broad",
      );
    }
    descriptor = io.openSync(filePath, fs.constants.O_RDONLY | NO_FOLLOW);
    const opened = io.fstatSync(descriptor);
    invariant(
      sameFileIdentity(before, opened),
      "The production audit evidence was replaced before validation",
    );
    invariant(
      opened.size > 0 && opened.size <= MAX_EVIDENCE_BYTES,
      "The production audit evidence size is invalid",
    );
    const raw = io.readFileSync(descriptor, "utf8");
    invariant(
      Buffer.byteLength(raw, "utf8") === opened.size,
      "The production audit evidence was not read completely",
    );
    let evidence;
    try {
      evidence = JSON.parse(raw);
    } catch {
      throw new AuditValidationError(
        "The production audit evidence is malformed JSON",
      );
    }
    validateEvidenceDocument(
      evidence,
      baseline,
      revision,
      audit,
      resolvedVersions,
    );
  } finally {
    if (descriptor !== undefined) {
      io.closeSync(descriptor);
    }
  }

  const after = io.lstatSync(filePath);
  invariant(
    sameFileIdentity(before, after) && before.size === after.size,
    "The production audit evidence was replaced during validation",
  );
  return after;
}

function writeAndSealEvidence(
  filePath,
  baseline,
  revision,
  audit,
  resolvedVersions,
  io = fs,
) {
  if (!filePath) {
    return;
  }

  const parentPath = validateEvidencePath(filePath, io);
  let descriptor;
  try {
    descriptor = io.openSync(
      filePath,
      fs.constants.O_WRONLY |
        fs.constants.O_CREAT |
        fs.constants.O_EXCL |
        NO_FOLLOW,
      0o600,
    );
    const serialized = `${JSON.stringify(
      buildEvidence(baseline, revision, audit, resolvedVersions),
      null,
      2,
    )}\n`;
    invariant(
      Buffer.byteLength(serialized, "utf8") <= MAX_EVIDENCE_BYTES,
      "The production audit evidence exceeded its public-safe bound",
    );
    io.writeFileSync(descriptor, serialized, "utf8");
    io.fsyncSync(descriptor);
  } catch (error) {
    if (error instanceof AuditValidationError) {
      throw error;
    }
    throw new AuditValidationError(
      "The production audit evidence could not be created exclusively",
    );
  } finally {
    if (descriptor !== undefined) {
      io.closeSync(descriptor);
    }
  }

  readAndValidateEvidenceFile(
    filePath,
    baseline,
    revision,
    audit,
    resolvedVersions,
    io,
  );
  io.chmodSync(filePath, 0o400);
  if (process.platform !== "win32") {
    io.chmodSync(parentPath, 0o500);
  }
}

function formatPassReceipt(revision, audit, resolvedVersions) {
  return (
    [
      "Production dependency audit: PASS",
      `Revision: ${revision}`,
      `Command: ${AUDIT_COMMAND}`,
      `Exit code: ${audit.exitCode}`,
      `Counts: ${SEVERITIES.map(
        (severity) => `${severity}=${audit.counts[severity]}`,
      ).join(", ")}, total=${audit.counts.total}`,
      `Raw JSON SHA-256: ${audit.rawJsonSha256}`,
      `Resolved: next=${resolvedVersions.next}, postcss=${resolvedVersions.postcss}, sharp=${resolvedVersions.sharp}`,
      "Scope: production dependencies only; development-only audit results are outside this gate.",
    ].join("\n") + "\n"
  );
}

function runValidation(options, dependencies = {}) {
  const readBaseline =
    dependencies.readBaseline ??
    (() =>
      validateBaseline(
        readJson(options.baseline, "production audit baseline"),
      ));
  const establishRevision =
    dependencies.readRevision ?? (() => readHeadRevision(options.expectedRevision));
  const establishVersions =
    dependencies.readVersions ?? (() => readResolvedVersions());
  const executeAudit = dependencies.runAudit ?? (() => runProductionAudit());
  const persistEvidence =
    dependencies.writeEvidence ??
    ((...arguments_) => writeAndSealEvidence(...arguments_));
  const writeStdout =
    dependencies.stdout ?? ((message) => process.stdout.write(message));

  const baseline = readBaseline();
  const revision = establishRevision();
  const resolvedVersions = establishVersions();
  const audit = executeAudit();
  persistEvidence(
    options.evidenceOutput,
    baseline,
    revision,
    audit,
    resolvedVersions,
  );

  invariant(
    audit.counts.total === 0,
    "Production dependency vulnerabilities remain",
  );
  invariant(
    audit.exitCode === 0,
    "The production dependency audit did not return accepted success",
  );

  writeStdout(formatPassReceipt(revision, audit, resolvedVersions));
  return { baseline, revision, resolvedVersions, audit };
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
    classifySecretExposure(JSON.stringify({ token: syntheticToken }))
      .classification,
    "possible",
  );
  process.stdout.write("Production dependency audit self-test: PASS (10 checks)\n");
}

function reportFailure(error, writeStderr = (message) => process.stderr.write(message)) {
  const message =
    error instanceof AuditValidationError || error instanceof assert.AssertionError
      ? error.message
      : "Unexpected validator failure";
  writeStderr(`Production dependency audit: FAIL\n${message}\n`);
}

function cli() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.selfTest) {
      runSelfTest();
      return;
    }
    runValidation(options);
  } catch (error) {
    reportFailure(error);
    process.exitCode = 1;
  }
}

module.exports = {
  AUDIT_COMMAND,
  AuditValidationError,
  EVIDENCE_FILENAME,
  EXPECTED_BASE_RAW_JSON_SHA256,
  EXPECTED_VERSIONS,
  buildEvidence,
  classifySecretExposure,
  formatPassReceipt,
  parseArguments,
  parseAuditDocument,
  readAndValidateEvidenceFile,
  reportFailure,
  runProductionAudit,
  runSelfTest,
  runValidation,
  validateAuditCommandResult,
  validateAuditExitCode,
  validateBaseline,
  validateEvidenceDocument,
  validateEvidencePath,
  writeAndSealEvidence,
};

if (require.main === module) {
  cli();
}
