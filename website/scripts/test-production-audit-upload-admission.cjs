"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  ADMISSION_FILENAME,
  AuditValidationError,
  EVIDENCE_FILENAME,
  EXPECTED_VERSIONS,
  runValidation,
  validateBaseline,
  verifyUploadAdmission,
  writeAndSealEvidence,
  writeAndSealUploadAdmission,
} = require("./validate-production-audit.cjs");

const BASELINE_PATH = path.resolve(
  __dirname,
  "..",
  "security",
  "production-dependency-audit-baseline.json",
);
const REVISION = "a".repeat(40);
const CHALLENGE = "b".repeat(64);
const STALE_CHALLENGE = "c".repeat(64);
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

function acceptedBaseline() {
  return validateBaseline(
    JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")),
  );
}

function auditResult(counts = ZERO_COUNTS) {
  const hasFindings = counts.total > 0;
  return {
    counts,
    vulnerablePackageNodes: hasFindings ? ["example"] : [],
    advisoryIdentifiers: hasFindings ? ["GHSA-aaaa-bbbb-cccc"] : [],
    exitCode: hasFindings ? 1 : 0,
    rawJsonSha256: "d".repeat(64),
    safety: {
      classification: "none",
      containsPrivateLocalPath: false,
    },
  };
}

function withAdmissionDirectory(callback) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "skr-audit-admission-"),
  );
  fs.chmodSync(directory, 0o700);
  const evidencePath = path.join(directory, EVIDENCE_FILENAME);
  const admissionPath = path.join(directory, ADMISSION_FILENAME);
  try {
    return callback({ directory, evidencePath, admissionPath });
  } finally {
    fs.chmodSync(directory, 0o700);
    for (const filePath of [evidencePath, admissionPath]) {
      if (fs.existsSync(filePath)) {
        fs.chmodSync(filePath, 0o600);
      }
    }
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function sealEvidenceAndAdmission(
  evidencePath,
  admissionPath,
  audit = auditResult(),
  challenge = CHALLENGE,
) {
  const evidenceDigest = writeAndSealEvidence(
    evidencePath,
    acceptedBaseline(),
    REVISION,
    audit,
    EXPECTED_VERSIONS,
  );
  return writeAndSealUploadAdmission(
    admissionPath,
    evidencePath,
    evidenceDigest,
    challenge,
    REVISION,
    audit,
  );
}

function rewriteJson(filePath, mutate) {
  fs.chmodSync(path.dirname(filePath), 0o700);
  fs.chmodSync(filePath, 0o600);
  const document = JSON.parse(fs.readFileSync(filePath, "utf8"));
  mutate(document);
  fs.writeFileSync(filePath, `${JSON.stringify(document, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  fs.chmodSync(filePath, 0o400);
  fs.chmodSync(path.dirname(filePath), 0o500);
}

test("valid sealed zero-vulnerability evidence is upload-admitted", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    sealEvidenceAndAdmission(evidencePath, admissionPath);
    const receipt = verifyUploadAdmission(
      evidencePath,
      admissionPath,
      CHALLENGE,
      REVISION,
    );
    assert.equal(receipt.auditExitCode, 0);
    assert.equal(receipt.vulnerabilityTotal, 0);
  });
});

test("valid sealed vulnerability evidence is upload-admitted for a failing audit", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    const audit = auditResult(FINDING_COUNTS);
    assert.throws(
      () =>
        runValidation(
          {
            evidenceOutput: evidencePath,
            admissionOutput: admissionPath,
            admissionChallenge: CHALLENGE,
          },
          {
            readBaseline: acceptedBaseline,
            readRevision: () => REVISION,
            readVersions: () => EXPECTED_VERSIONS,
            runAudit: () => audit,
            stdout: () => {
              throw new Error("PASS must not be printed for findings");
            },
          },
        ),
      /Production dependency vulnerabilities remain/,
    );
    const receipt = verifyUploadAdmission(
      evidencePath,
      admissionPath,
      CHALLENGE,
      REVISION,
    );
    assert.equal(receipt.auditExitCode, 1);
    assert.equal(receipt.vulnerabilityTotal, 1);
  });
});

test("exclusive evidence creation failure cannot create upload admission", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    fs.writeFileSync(evidencePath, "{}\n", { mode: 0o600 });
    assert.throws(
      () =>
        writeAndSealEvidence(
          evidencePath,
          acceptedBaseline(),
          REVISION,
          auditResult(),
          EXPECTED_VERSIONS,
        ),
      /could not be created exclusively/,
    );
    assert.equal(fs.existsSync(admissionPath), false);
  });
});

test("pre-existing attacker evidence and admission do not self-admit", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    fs.writeFileSync(evidencePath, "{}\n", { mode: 0o600 });
    fs.writeFileSync(admissionPath, "{}\n", { mode: 0o600 });
    assert.throws(
      () =>
        verifyUploadAdmission(
          evidencePath,
          admissionPath,
          CHALLENGE,
          REVISION,
        ),
      AuditValidationError,
    );
  });
});

test("evidence read-back replacement invalidates upload admission", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    sealEvidenceAndAdmission(evidencePath, admissionPath);
    rewriteJson(evidencePath, (evidence) => {
      evidence.after.rawJsonSha256 = "e".repeat(64);
    });
    assert.throws(
      () =>
        verifyUploadAdmission(
          evidencePath,
          admissionPath,
          CHALLENGE,
          REVISION,
        ),
      /does not match the sealed evidence/,
    );
  });
});

test("admission seal digest mismatch is rejected", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    sealEvidenceAndAdmission(evidencePath, admissionPath);
    rewriteJson(admissionPath, (admission) => {
      admission.evidenceSha256 = "f".repeat(64);
    });
    assert.throws(
      () =>
        verifyUploadAdmission(
          evidencePath,
          admissionPath,
          CHALLENGE,
          REVISION,
        ),
      /does not match the sealed evidence/,
    );
  });
});

test("malformed evidence is rejected even when an admission file exists", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    sealEvidenceAndAdmission(evidencePath, admissionPath);
    fs.chmodSync(path.dirname(evidencePath), 0o700);
    fs.chmodSync(evidencePath, 0o600);
    fs.writeFileSync(evidencePath, "{malformed", "utf8");
    fs.chmodSync(evidencePath, 0o400);
    fs.chmodSync(path.dirname(evidencePath), 0o500);
    assert.throws(
      () =>
        verifyUploadAdmission(
          evidencePath,
          admissionPath,
          CHALLENGE,
          REVISION,
        ),
      /malformed JSON/,
    );
  });
});

test("admission marker without matching evidence is rejected", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    fs.writeFileSync(admissionPath, "{}\n", { mode: 0o600 });
    assert.throws(
      () =>
        verifyUploadAdmission(
          evidencePath,
          admissionPath,
          CHALLENGE,
          REVISION,
        ),
      AuditValidationError,
    );
  });
});

test("sealed evidence without an admission marker is rejected", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    writeAndSealEvidence(
      evidencePath,
      acceptedBaseline(),
      REVISION,
      auditResult(),
      EXPECTED_VERSIONS,
    );
    assert.throws(
      () =>
        verifyUploadAdmission(
          evidencePath,
          admissionPath,
          CHALLENGE,
          REVISION,
        ),
      AuditValidationError,
    );
  });
});

test("stale admission from a prior invocation is rejected", () => {
  withAdmissionDirectory(({ evidencePath, admissionPath }) => {
    sealEvidenceAndAdmission(
      evidencePath,
      admissionPath,
      auditResult(),
      STALE_CHALLENGE,
    );
    assert.throws(
      () =>
        verifyUploadAdmission(
          evidencePath,
          admissionPath,
          CHALLENGE,
          REVISION,
        ),
      /does not match the sealed evidence/,
    );
  });
});
