"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  AuditValidationError,
  EVIDENCE_FILENAME,
  EXPECTED_BASE_RAW_JSON_SHA256,
  EXPECTED_VERSIONS,
  buildEvidence,
  readAndValidateEvidenceFile,
  runValidation,
  validateAuditCommandResult,
  validateBaseline,
  writeAndSealEvidence,
} = require("./validate-production-audit.cjs");

const BASELINE_PATH = path.resolve(
  __dirname,
  "..",
  "security",
  "production-dependency-audit-baseline.json",
);
const REVISION = "a".repeat(40);
const ZERO_COUNTS = Object.freeze({
  info: 0,
  low: 0,
  moderate: 0,
  high: 0,
  critical: 0,
  total: 0,
});
const FINDING_COUNTS = Object.freeze({
  ...ZERO_COUNTS,
  high: 1,
  total: 1,
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadBaselineDocument() {
  return JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
}

function acceptedBaseline() {
  return validateBaseline(loadBaselineDocument());
}

function auditResult(counts = ZERO_COUNTS) {
  const hasFindings = counts.total > 0;
  return {
    counts,
    vulnerablePackageNodes: hasFindings ? ["example"] : [],
    advisoryIdentifiers: hasFindings ? ["GHSA-aaaa-bbbb-cccc"] : [],
    exitCode: hasFindings ? 1 : 0,
    rawJsonSha256: "b".repeat(64),
    safety: {
      classification: "none",
      containsPrivateLocalPath: false,
    },
  };
}

function auditJson(counts = ZERO_COUNTS) {
  return JSON.stringify({
    vulnerabilities:
      counts.total === 0
        ? {}
        : {
            example: {
              via: [
                {
                  url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
                },
              ],
            },
          },
    metadata: { vulnerabilities: counts },
  });
}

function validationDependencies(audit, stdout, writeEvidence = () => {}) {
  return {
    readBaseline: acceptedBaseline,
    readRevision: () => REVISION,
    readVersions: () => EXPECTED_VERSIONS,
    runAudit: () => audit,
    writeEvidence,
    stdout: (message) => stdout.push(message),
  };
}

function withEvidenceDirectory(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "skr-audit-evidence-"));
  fs.chmodSync(directory, 0o700);
  const filePath = path.join(directory, EVIDENCE_FILENAME);
  try {
    return callback({ directory, filePath });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.chmodSync(filePath, 0o600);
    }
    fs.chmodSync(directory, 0o700);
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function writeEvidenceDocument(filePath, evidence) {
  fs.writeFileSync(filePath, `${JSON.stringify(evidence, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}

test("zero production findings print PASS exactly once", () => {
  const stdout = [];
  runValidation(
    { evidenceOutput: undefined },
    validationDependencies(auditResult(), stdout),
  );
  const output = stdout.join("");
  assert.equal((output.match(/Production dependency audit: PASS/g) ?? []).length, 1);
  assert.doesNotMatch(output, /FAIL/);
});

test("production findings write safe evidence but print no PASS", () => {
  const stdout = [];
  let writes = 0;
  assert.throws(
    () =>
      runValidation(
        { evidenceOutput: "controlled" },
        validationDependencies(auditResult(FINDING_COUNTS), stdout, () => {
          writes += 1;
        }),
      ),
    /Production dependency vulnerabilities remain/,
  );
  assert.equal(writes, 1);
  assert.equal(stdout.join(""), "");
});

test("success exit with production findings fails closed", () => {
  assert.throws(
    () =>
      validateAuditCommandResult({
        status: 0,
        signal: null,
        error: undefined,
        stdout: auditJson(FINDING_COUNTS),
      }),
    /returned success while reporting production vulnerabilities/,
  );
});

test("finding exit with zero production findings fails closed", () => {
  assert.throws(
    () =>
      validateAuditCommandResult({
        status: 1,
        signal: null,
        error: undefined,
        stdout: auditJson(),
      }),
    /failure code without production vulnerabilities/,
  );
});

test("unrelated npm audit command failures fail closed", () => {
  assert.throws(
    () =>
      validateAuditCommandResult({
        status: 2,
        signal: null,
        error: undefined,
        stdout: auditJson(),
      }),
    /failed for a reason other than reported vulnerabilities/,
  );
});

test("malformed npm audit output fails closed", () => {
  assert.throws(
    () =>
      validateAuditCommandResult({
        status: 1,
        signal: null,
        error: undefined,
        stdout: "{malformed",
      }),
    /malformed JSON/,
  );
});

test("accepted baseline digest is accepted exactly", () => {
  assert.equal(
    validateBaseline(loadBaselineDocument()).rawJsonSha256,
    EXPECTED_BASE_RAW_JSON_SHA256,
  );
});

for (const [name, replacement] of [
  ["one-character mutation", `7${EXPECTED_BASE_RAW_JSON_SHA256.slice(1)}`],
  ["different valid-looking digest", "f".repeat(64)],
  ["missing digest", undefined],
  ["uppercase digest", EXPECTED_BASE_RAW_JSON_SHA256.toUpperCase()],
  ["short digest", EXPECTED_BASE_RAW_JSON_SHA256.slice(0, 63)],
  ["malformed digest", "z".repeat(64)],
]) {
  test(`baseline ${name} is rejected`, () => {
    const baseline = loadBaselineDocument();
    if (replacement === undefined) {
      delete baseline.before.rawJsonSha256;
    } else {
      baseline.before.rawJsonSha256 = replacement;
    }
    assert.throws(
      () => validateBaseline(baseline),
      /baseline digest differs from the accepted source result/,
    );
  });
}

test("evidence is exclusively written, re-read, validated, and sealed", () => {
  withEvidenceDirectory(({ filePath }) => {
    const audit = auditResult();
    const baseline = acceptedBaseline();
    writeAndSealEvidence(
      filePath,
      baseline,
      REVISION,
      audit,
      EXPECTED_VERSIONS,
    );
    assert.doesNotThrow(() =>
      readAndValidateEvidenceFile(
        filePath,
        baseline,
        REVISION,
        audit,
        EXPECTED_VERSIONS,
      ),
    );
  });
});

test("pre-existing evidence replacement path is rejected", () => {
  withEvidenceDirectory(({ filePath }) => {
    fs.writeFileSync(filePath, "{}\n", "utf8");
    assert.throws(
      () =>
        writeAndSealEvidence(
          filePath,
          acceptedBaseline(),
          REVISION,
          auditResult(),
          EXPECTED_VERSIONS,
        ),
      /could not be created exclusively/,
    );
  });
});

test("symlink evidence substitution is rejected deterministically", () => {
  withEvidenceDirectory(({ directory, filePath }) => {
    const realLstat = fs.lstatSync.bind(fs);
    const fakeIo = {
      ...fs,
      lstatSync(candidate) {
        if (candidate === directory) {
          return realLstat(candidate);
        }
        return {
          isFile: () => true,
          isSymbolicLink: () => true,
          nlink: 1,
        };
      },
    };
    assert.throws(
      () =>
        readAndValidateEvidenceFile(
          filePath,
          acceptedBaseline(),
          REVISION,
          auditResult(),
          EXPECTED_VERSIONS,
          fakeIo,
        ),
      /not a single regular file/,
    );
  });
});

test("alternate evidence file types are rejected deterministically", () => {
  withEvidenceDirectory(({ directory, filePath }) => {
    const realLstat = fs.lstatSync.bind(fs);
    const fakeIo = {
      ...fs,
      lstatSync(candidate) {
        if (candidate === directory) {
          return realLstat(candidate);
        }
        return {
          isFile: () => false,
          isSymbolicLink: () => false,
          nlink: 1,
        };
      },
    };
    assert.throws(
      () =>
        readAndValidateEvidenceFile(
          filePath,
          acceptedBaseline(),
          REVISION,
          auditResult(),
          EXPECTED_VERSIONS,
          fakeIo,
        ),
      /not a single regular file/,
    );
  });
});

test("alternate evidence directory resolution is rejected", () => {
  withEvidenceDirectory(({ directory, filePath }) => {
    const fakeIo = {
      ...fs,
      realpathSync: () => `${directory}-alternate`,
    };
    assert.throws(
      () =>
        writeAndSealEvidence(
          filePath,
          acceptedBaseline(),
          REVISION,
          auditResult(),
          EXPECTED_VERSIONS,
          fakeIo,
        ),
      /resolves through an alternate path/,
    );
  });
});

test("malformed evidence JSON is rejected", () => {
  withEvidenceDirectory(({ filePath }) => {
    fs.writeFileSync(filePath, "{malformed", { encoding: "utf8", mode: 0o600 });
    assert.throws(
      () =>
        readAndValidateEvidenceFile(
          filePath,
          acceptedBaseline(),
          REVISION,
          auditResult(),
          EXPECTED_VERSIONS,
        ),
      /malformed JSON/,
    );
  });
});

for (const [name, mutate, pattern] of [
  [
    "wrong exact revision",
    (evidence) => {
      evidence.after.revision = "c".repeat(40);
    },
    /differs from the validated result/,
  ],
  [
    "wrong accepted baseline digest",
    (evidence) => {
      evidence.before.rawJsonSha256 = "f".repeat(64);
    },
    /differs from the validated result/,
  ],
  [
    "wrong after-audit digest",
    (evidence) => {
      evidence.after.rawJsonSha256 = "d".repeat(64);
    },
    /differs from the validated result/,
  ],
  [
    "wrong resolved versions",
    (evidence) => {
      evidence.after.resolvedVersions.sharp = "0.35.2";
    },
    /differs from the validated result/,
  ],
]) {
  test(`evidence with ${name} is rejected`, () => {
    withEvidenceDirectory(({ filePath }) => {
      const baseline = acceptedBaseline();
      const audit = auditResult();
      const evidence = clone(
        buildEvidence(baseline, REVISION, audit, EXPECTED_VERSIONS),
      );
      mutate(evidence);
      writeEvidenceDocument(filePath, evidence);
      assert.throws(
        () =>
          readAndValidateEvidenceFile(
            filePath,
            baseline,
            REVISION,
            audit,
            EXPECTED_VERSIONS,
          ),
        pattern,
      );
    });
  });
}

test("evidence content replacement after generation is rejected", () => {
  withEvidenceDirectory(({ filePath }) => {
    const baseline = acceptedBaseline();
    const audit = auditResult();
    const evidence = clone(
      buildEvidence(baseline, REVISION, audit, EXPECTED_VERSIONS),
    );
    evidence.after.vulnerabilityTotals.high = 1;
    evidence.after.vulnerabilityTotals.total = 1;
    writeEvidenceDocument(filePath, evidence);
    assert.throws(
      () =>
        readAndValidateEvidenceFile(
          filePath,
          baseline,
          REVISION,
          audit,
          EXPECTED_VERSIONS,
        ),
      /differs from the validated result/,
    );
  });
});

test("uncontrolled evidence filenames are rejected", () => {
  withEvidenceDirectory(({ directory }) => {
    assert.throws(
      () =>
        writeAndSealEvidence(
          path.join(directory, "attacker-controlled.json"),
          acceptedBaseline(),
          REVISION,
          auditResult(),
          EXPECTED_VERSIONS,
        ),
      AuditValidationError,
    );
  });
});
