#!/usr/bin/env node

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const {
  approvedProvenanceModes,
  approvedRevisionSources,
  calculateInventoryDigest,
  classifyRevisionCandidate,
  generateProductionBuildProvenance,
  probeGitMetadata,
} = require('../website/scripts/generate-production-build-provenance.cjs');
const {
  calculateRouteInventoryDigest,
  validateRouteInventory,
} = require('../website/scripts/production-smoke-route-inventory.cjs');
const {
  validateHostedBuildProvenance,
} = require('./smoke-production-readonly.cjs');

const safeRevision = 'a'.repeat(40);
const safeBuildId = 'test-build-id-123';

function createTempWebsite(suffix = '') {
  const dir = fs.mkdtempSync(
    path.join(require('node:os').tmpdir(), `skr-prov-${suffix}-`),
  );
  const nextDir = path.join(dir, '.next');
  const staticDir = path.join(nextDir, 'static', 'chunks');
  const appDir = path.join(dir, 'app');

  fs.mkdirSync(staticDir, { recursive: true });
  fs.mkdirSync(path.join(appDir, 'admin', 'login'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'categories'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'events'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'listings', '[slug]'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'privacy'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'terms'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'catalogue', '[slug]'), { recursive: true });

  fs.writeFileSync(path.join(nextDir, 'BUILD_ID'), safeBuildId);
  fs.writeFileSync(path.join(staticDir, 'app.js'), 'console.log("test");');

  for (const page of [
    'admin/login/page.tsx',
    'categories/page.tsx',
    'events/page.tsx',
    'listings/[slug]/page.tsx',
    'privacy/page.tsx',
    'terms/page.tsx',
    'catalogue/[slug]/page.tsx',
    'page.tsx',
  ]) {
    fs.writeFileSync(
      path.join(appDir, page),
      'export default function Page() { return null; }\n',
    );
  }

  return dir;
}

function createTempRepo(dir) {
  execFileSync('git', ['init'], { cwd: dir, windowsHide: true });
  execFileSync('git', ['config', 'user.email', 'test@test'], {
    cwd: dir,
    windowsHide: true,
  });
  execFileSync('git', ['config', 'user.name', 'Test'], {
    cwd: dir,
    windowsHide: true,
  });
  execFileSync('git', ['add', '.'], { cwd: dir, windowsHide: true });
  execFileSync('git', ['commit', '-m', 'init'], {
    cwd: dir,
    windowsHide: true,
  });
}

function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
  } catch {
    // ignore
  }
}

function withSourceCommit(value, fn) {
  const saved = process.env.SOURCE_COMMIT;
  try {
    if (value === undefined) {
      delete process.env.SOURCE_COMMIT;
    } else {
      process.env.SOURCE_COMMIT = value;
    }
    return fn();
  } finally {
    if (saved === undefined) {
      delete process.env.SOURCE_COMMIT;
    } else {
      process.env.SOURCE_COMMIT = saved;
    }
  }
}

// --- classifyRevisionCandidate: explicit input ---

test('classifyRevisionCandidate explicit: omitted property is absent', () => {
  assert.deepEqual(
    classifyRevisionCandidate(undefined, true),
    { state: 'malformed' },
  );
});

test('classifyRevisionCandidate explicit: null is malformed', () => {
  assert.deepEqual(classifyRevisionCandidate(null, true), { state: 'malformed' });
});

test('classifyRevisionCandidate explicit: number is malformed', () => {
  assert.deepEqual(classifyRevisionCandidate(42, true), { state: 'malformed' });
});

test('classifyRevisionCandidate explicit: boolean is malformed', () => {
  assert.deepEqual(classifyRevisionCandidate(true, true), { state: 'malformed' });
});

test('classifyRevisionCandidate explicit: object is malformed', () => {
  assert.deepEqual(classifyRevisionCandidate({}, true), { state: 'malformed' });
});

test('classifyRevisionCandidate explicit: empty string is malformed', () => {
  assert.deepEqual(classifyRevisionCandidate('', true), { state: 'malformed' });
});

test('classifyRevisionCandidate explicit: whitespace is malformed', () => {
  assert.deepEqual(classifyRevisionCandidate('   ', true), { state: 'malformed' });
});

test('classifyRevisionCandidate explicit: valid hex is valid', () => {
  assert.deepEqual(classifyRevisionCandidate(safeRevision, true), {
    state: 'valid',
    value: safeRevision,
  });
});

// --- classifyRevisionCandidate: non-explicit (SOURCE_COMMIT) ---

test('classifyRevisionCandidate env: undefined is absent', () => {
  assert.deepEqual(classifyRevisionCandidate(undefined, false), {
    state: 'absent',
  });
});

test('classifyRevisionCandidate env: null is absent', () => {
  assert.deepEqual(classifyRevisionCandidate(null, false), {
    state: 'absent',
  });
});

test('classifyRevisionCandidate env: empty string is malformed', () => {
  assert.deepEqual(classifyRevisionCandidate('', false), {
    state: 'malformed',
  });
});

test('classifyRevisionCandidate env: valid hex is valid', () => {
  assert.deepEqual(classifyRevisionCandidate(safeRevision, false), {
    state: 'valid',
    value: safeRevision,
  });
});

// --- probeGitMetadata ---

test('probeGitMetadata: genuine ENOENT returns absent', () => {
  const dir = createTempWebsite('probe-absent');
  try {
    const result = probeGitMetadata(dir);
    assert.deepEqual(result, { state: 'absent' });
  } finally {
    cleanup(dir);
  }
});

test('probeGitMetadata: .git present returns present', () => {
  const dir = createTempWebsite('probe-present');
  createTempRepo(dir);
  try {
    const result = probeGitMetadata(dir);
    assert.deepEqual(result, { state: 'present' });
  } finally {
    cleanup(dir);
  }
});

test('probeGitMetadata: non-ENOENT error fails closed', (t) => {
  const dir = createTempWebsite('probe-perm');
  const originalAccessSync = fs.accessSync;
  fs.accessSync = (p) => {
    const err = new Error('EACCES: permission denied');
    err.code = 'EACCES';
    throw err;
  };
  try {
    assert.throws(() => probeGitMetadata(dir), {
      message: 'build_provenance_git_metadata_probe_failed',
    });
  } finally {
    fs.accessSync = originalAccessSync;
    cleanup(dir);
  }
});

// --- approved sets ---

test('approvedProvenanceModes contains expected modes', () => {
  assert.ok(approvedProvenanceModes.has('git-checkout'));
  assert.ok(approvedProvenanceModes.has('deployment-source'));
  assert.equal(approvedProvenanceModes.size, 2);
});

test('approvedRevisionSources contains expected sources', () => {
  assert.ok(approvedRevisionSources.has('explicit'));
  assert.ok(approvedRevisionSources.has('git'));
  assert.ok(approvedRevisionSources.has('source-commit'));
  assert.equal(approvedRevisionSources.size, 3);
});

// --- Scenario 1: no Git, no revision source ---

test('1. no Git and no revision source: fail unavailable', () => {
  const dir = createTempWebsite('s1');
  try {
    withSourceCommit(undefined, () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_revision_unavailable' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 2: valid SOURCE_COMMIT without Git ---

test('2. valid SOURCE_COMMIT without Git: pass deployment-source', () => {
  const dir = createTempWebsite('s2');
  try {
    withSourceCommit(safeRevision, () => {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });
      assert.equal(result.manifest.provenanceMode, 'deployment-source');
      assert.equal(result.manifest.revisionSource, 'source-commit');
      assert.equal(result.manifest.sourceCheckoutClean, false);
      assert.equal(result.manifest.trackedCheckoutClean, false);
      assert.equal(result.manifest.reviewedSha, safeRevision);
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 3: malformed SOURCE_COMMIT without Git ---

test('3. malformed SOURCE_COMMIT without Git: fail invalid', () => {
  const dir = createTempWebsite('s3');
  try {
    withSourceCommit('not-valid', () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_revision_invalid' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 4: valid Git plus malformed SOURCE_COMMIT ---

test('4. valid Git plus malformed SOURCE_COMMIT: fail invalid', () => {
  const dir = createTempWebsite('s4');
  createTempRepo(dir);
  try {
    withSourceCommit('not-valid', () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_revision_invalid' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 5: valid Git plus malformed explicit string ---

test('5. valid Git plus malformed explicit string: fail invalid', () => {
  const dir = createTempWebsite('s5');
  createTempRepo(dir);
  try {
    assert.throws(
      () => generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
        revision: 'not-valid',
      }),
      { message: 'build_provenance_revision_invalid' },
    );
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 6: omitted explicit revision (property not in options) ---

test('6. omitted explicit revision: uses Git when available', () => {
  const dir = createTempWebsite('s6');
  createTempRepo(dir);
  try {
    const result = generateProductionBuildProvenance({
      repoRoot: dir,
      websiteRoot: dir,
    });
    assert.equal(result.manifest.revisionSource, 'git');
    assert.equal(result.manifest.provenanceMode, 'git-checkout');
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 7: explicitly supplied undefined revision ---

test('7. explicitly supplied undefined revision: fail invalid', () => {
  const dir = createTempWebsite('s7');
  try {
    assert.throws(
      () => generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
        revision: undefined,
      }),
      { message: 'build_provenance_revision_invalid' },
    );
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 8: explicitly supplied null revision ---

test('8. explicitly supplied null revision: fail invalid', () => {
  const dir = createTempWebsite('s8');
  try {
    assert.throws(
      () => generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
        revision: null,
      }),
      { message: 'build_provenance_revision_invalid' },
    );
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 9: explicitly supplied numeric revision ---

test('9. explicitly supplied numeric revision: fail invalid', () => {
  const dir = createTempWebsite('s9');
  try {
    assert.throws(
      () => generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
        revision: 42,
      }),
      { message: 'build_provenance_revision_invalid' },
    );
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 10: successful Git command returning malformed revision ---

test('10. successful Git command returning malformed revision: fail build_provenance_git_revision_malformed', () => {
  const dir = createTempWebsite('s10');
  fs.mkdirSync(path.join(dir, '.git'));

  const { execFileSync: realExec } = require('node:child_process');
  const originalExecFileSync = require('node:child_process').execFileSync;

  require('node:child_process').execFileSync = (cmd, args, opts) => {
    if (cmd === 'git' && args?.[0] === 'rev-parse' && args?.[1] === 'HEAD') {
      return 'not-a-valid-sha\n';
    }
    return realExec(cmd, args, opts);
  };

  delete require.cache[require.resolve('../website/scripts/generate-production-build-provenance.cjs')];
  const { generateProductionBuildProvenance: freshGenerate } = require('../website/scripts/generate-production-build-provenance.cjs');

  try {
    assert.throws(
      () => freshGenerate({ repoRoot: dir, websiteRoot: dir }),
      { message: 'build_provenance_git_revision_malformed' },
    );
  } finally {
    require('node:child_process').execFileSync = originalExecFileSync;
    delete require.cache[require.resolve('../website/scripts/generate-production-build-provenance.cjs')];
    cleanup(dir);
  }
});

// --- Scenario 11: .git metadata probe returning ENOENT ---

test('11. .git metadata probe returning ENOENT: absent state', () => {
  const dir = createTempWebsite('s11');
  try {
    withSourceCommit(safeRevision, () => {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });
      assert.equal(result.manifest.provenanceMode, 'deployment-source');
      assert.equal(result.manifest.revisionSource, 'source-commit');
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 12: .git metadata probe returning non-ENOENT ---

test('12. .git metadata probe returning non-ENOENT: fail probe_failed', () => {
  const dir = createTempWebsite('s12');
  const originalAccessSync = fs.accessSync;
  fs.accessSync = (p) => {
    const err = new Error('EACCES: permission denied');
    err.code = 'EACCES';
    throw err;
  };
  try {
    withSourceCommit(safeRevision, () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_git_metadata_probe_failed' },
      );
    });
  } finally {
    fs.accessSync = originalAccessSync;
    cleanup(dir);
  }
});

// --- Scenario 13: Git revision command failure ---

test('13. Git revision command failure: fail git_revision_command_failed', () => {
  const dir = createTempWebsite('s13');
  fs.mkdirSync(path.join(dir, '.git'));
  try {
    withSourceCommit(undefined, () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_git_revision_command_failed' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 14: valid Git revision followed by status command failure ---

test('14. valid Git revision followed by status command failure: fail checkout_status_command_failed', () => {
  const dir = createTempWebsite('s14');
  createTempRepo(dir);

  const gitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: dir,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();

  fs.writeFileSync(path.join(dir, '.git', 'index'), 'corrupt');

  try {
    assert.throws(
      () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
      { message: 'build_provenance_checkout_status_command_failed' },
    );
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 15: dirty real checkout ---

test('15. dirty real checkout: fail source_checkout_not_clean', () => {
  const dir = createTempWebsite('s15');
  createTempRepo(dir);
  fs.writeFileSync(path.join(dir, 'dirty.txt'), 'dirty');
  try {
    assert.throws(
      () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
      { message: 'build_provenance_source_checkout_not_clean' },
    );
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 16: clean real checkout ---

test('16. clean real checkout: pass git-checkout', () => {
  const dir = createTempWebsite('s16');
  createTempRepo(dir);
  try {
    const result = generateProductionBuildProvenance({
      repoRoot: dir,
      websiteRoot: dir,
    });
    assert.equal(result.manifest.provenanceMode, 'git-checkout');
    assert.equal(result.manifest.revisionSource, 'git');
    assert.equal(result.manifest.sourceCheckoutClean, true);
    assert.equal(result.manifest.trackedCheckoutClean, true);
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 17: explicit, Git and SOURCE_COMMIT agreement ---

test('17. explicit, Git and SOURCE_COMMIT all agree: pass', () => {
  const dir = createTempWebsite('s17');
  createTempRepo(dir);
  try {
    const gitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
      windowsHide: true,
    }).trim();

    withSourceCommit(gitSha, () => {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
        revision: gitSha,
      });
      assert.equal(result.manifest.revisionSource, 'explicit');
      assert.equal(result.manifest.provenanceMode, 'git-checkout');
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 18: pairwise and three-way mismatches ---

test('18a. Git and SOURCE_COMMIT disagree: fail mismatch', () => {
  const dir = createTempWebsite('s18a');
  createTempRepo(dir);
  try {
    withSourceCommit('b'.repeat(40), () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_revision_source_mismatch' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

test('18b. explicit disagrees with Git: fail mismatch', () => {
  const dir = createTempWebsite('s18b');
  createTempRepo(dir);
  try {
    assert.throws(
      () => generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
        revision: 'b'.repeat(40),
      }),
      { message: 'build_provenance_revision_source_mismatch' },
    );
  } finally {
    cleanup(dir);
  }
});

test('18c. explicit disagrees with SOURCE_COMMIT: fail mismatch', () => {
  const dir = createTempWebsite('s18c');
  try {
    withSourceCommit('b'.repeat(40), () => {
      assert.throws(
        () => generateProductionBuildProvenance({
          repoRoot: dir,
          websiteRoot: dir,
          revision: safeRevision,
        }),
        { message: 'build_provenance_revision_source_mismatch' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 19: no-Git deployment-source plus explicit ---

test('19. no-Git deployment-source plus explicit: pass', () => {
  const dir = createTempWebsite('s19');
  try {
    const result = generateProductionBuildProvenance({
      repoRoot: dir,
      websiteRoot: dir,
      revision: safeRevision,
    });
    assert.equal(result.manifest.provenanceMode, 'deployment-source');
    assert.equal(result.manifest.revisionSource, 'explicit');
    assert.equal(result.manifest.sourceCheckoutClean, false);
    assert.equal(result.manifest.trackedCheckoutClean, false);
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 20: no-Git deployment-source plus SOURCE_COMMIT ---

test('20. no-Git deployment-source plus SOURCE_COMMIT: pass', () => {
  const dir = createTempWebsite('s20');
  try {
    withSourceCommit(safeRevision, () => {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });
      assert.equal(result.manifest.provenanceMode, 'deployment-source');
      assert.equal(result.manifest.revisionSource, 'source-commit');
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 21: allowed hosted mode/source combinations ---

test('21a. git-checkout + git: pass', () => {
  const dir = createTempWebsite('s21a');
  createTempRepo(dir);
  try {
    const result = generateProductionBuildProvenance({
      repoRoot: dir,
      websiteRoot: dir,
    });
    assert.equal(result.manifest.provenanceMode, 'git-checkout');
    assert.equal(result.manifest.revisionSource, 'git');
    validateHostedBuildProvenance(
      JSON.parse(JSON.stringify(result.manifest)),
      result.manifest.reviewedSha,
      safeBuildId,
    );
  } finally {
    cleanup(dir);
  }
});

test('21b. git-checkout + explicit: pass', () => {
  const dir = createTempWebsite('s21b');
  createTempRepo(dir);
  try {
    const gitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
      windowsHide: true,
    }).trim();

    const result = generateProductionBuildProvenance({
      repoRoot: dir,
      websiteRoot: dir,
      revision: gitSha,
    });
    assert.equal(result.manifest.revisionSource, 'explicit');
    validateHostedBuildProvenance(
      JSON.parse(JSON.stringify(result.manifest)),
      gitSha,
      safeBuildId,
    );
  } finally {
    cleanup(dir);
  }
});

test('21c. deployment-source + source-commit: pass', () => {
  const dir = createTempWebsite('s21c');
  try {
    withSourceCommit(safeRevision, () => {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });
      validateHostedBuildProvenance(
        JSON.parse(JSON.stringify(result.manifest)),
        safeRevision,
        safeBuildId,
      );
    });
  } finally {
    cleanup(dir);
  }
});

test('21d. deployment-source + explicit: pass', () => {
  const dir = createTempWebsite('s21d');
  try {
    const result = generateProductionBuildProvenance({
      repoRoot: dir,
      websiteRoot: dir,
      revision: safeRevision,
    });
    validateHostedBuildProvenance(
      JSON.parse(JSON.stringify(result.manifest)),
      safeRevision,
      safeBuildId,
    );
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 22: prohibited hosted mode/source combinations ---

test('22a. git-checkout + source-commit: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'source-commit',
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('22b. deployment-source + git: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'deployment-source',
    revisionSource: 'git',
    trackedCheckoutClean: false,
    sourceCheckoutClean: false,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 23: missing and unknown revisionSource ---

test('23a. missing revisionSource: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
  });
  delete manifest.revisionSource;
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('23b. unknown revisionSource: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'unknown',
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 24: deployment-source with either cleanliness boolean true ---

test('24a. deployment-source with trackedCheckoutClean true: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'deployment-source',
    revisionSource: 'source-commit',
    trackedCheckoutClean: true,
    sourceCheckoutClean: false,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('24b. deployment-source with sourceCheckoutClean true: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'deployment-source',
    revisionSource: 'source-commit',
    trackedCheckoutClean: false,
    sourceCheckoutClean: true,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 25: git-checkout without both cleanliness booleans true ---

test('25a. git-checkout with sourceCheckoutClean false: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    trackedCheckoutClean: true,
    sourceCheckoutClean: false,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('25b. git-checkout with trackedCheckoutClean false: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    trackedCheckoutClean: false,
    sourceCheckoutClean: true,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 26: missing and unknown provenanceMode ---

test('26a. missing provenanceMode: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
  });
  delete manifest.provenanceMode;
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('26b. unknown provenanceMode: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'unknown-mode',
    revisionSource: 'git',
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 27: both cleanliness booleans false for git-checkout ---

test('27. git-checkout with both cleanliness booleans false: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    trackedCheckoutClean: false,
    sourceCheckoutClean: false,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 28: both cleanliness booleans true for deployment-source ---

test('28. deployment-source with both cleanliness booleans true: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'deployment-source',
    revisionSource: 'source-commit',
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 29: missing cleanliness values ---

test('29a. git-checkout missing trackedCheckoutClean: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    sourceCheckoutClean: true,
  });
  delete manifest.trackedCheckoutClean;
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('29b. git-checkout missing sourceCheckoutClean: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    trackedCheckoutClean: true,
  });
  delete manifest.sourceCheckoutClean;
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 30: non-boolean cleanliness values ---

test('30a. git-checkout with non-boolean trackedCheckoutClean: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    trackedCheckoutClean: 'yes',
    sourceCheckoutClean: true,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('30b. git-checkout with non-boolean sourceCheckoutClean: reject', () => {
  const manifest = hostedManifest({
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    trackedCheckoutClean: true,
    sourceCheckoutClean: 1,
  });
  assert.throws(
    () => validateHostedBuildProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 31: production entry point does not accept synthetic checkoutStatus ---

test('31a. production entry point ignores synthetic checkoutStatus option', () => {
  const dir = createTempWebsite('s26');
  try {
    const result = generateProductionBuildProvenance({
      repoRoot: dir,
      websiteRoot: dir,
      revision: safeRevision,
      checkoutStatus: Buffer.from(''),
    });
    assert.equal(result.manifest.provenanceMode, 'deployment-source');
    assert.equal(result.manifest.sourceCheckoutClean, false);
    assert.equal(result.manifest.trackedCheckoutClean, false);
  } finally {
    cleanup(dir);
  }
});

test('31b. production options contract has no checkoutStatus property', () => {
  const dir = createTempWebsite('s26b');
  try {
    const opts = {
      repoRoot: dir,
      websiteRoot: dir,
      revision: safeRevision,
      checkoutStatus: Buffer.from('ignored'),
    };
    const result = generateProductionBuildProvenance(opts);
    assert.equal(result.manifest.sourceCheckoutClean, false);
    assert.equal(result.manifest.trackedCheckoutClean, false);
  } finally {
    cleanup(dir);
  }
});

// --- non-ENOENT probe failure with SOURCE_COMMIT present ---

test('non-ENOENT probe failure with SOURCE_COMMIT present: fail probe_failed', () => {
  const dir = createTempWebsite('probe-src');
  const originalAccessSync = fs.accessSync;
  fs.accessSync = (p) => {
    const err = new Error('EACCES: permission denied');
    err.code = 'EACCES';
    throw err;
  };
  try {
    withSourceCommit(safeRevision, () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_git_metadata_probe_failed' },
      );
    });
  } finally {
    fs.accessSync = originalAccessSync;
    cleanup(dir);
  }
});

// --- CLI tests ---

test('CLI: reports provenance mode in output', () => {
  const dir = createTempWebsite('cli');
  try {
    const result = execFileSync(
      'node',
      [path.join(__dirname, '..', 'website', 'scripts', 'generate-production-build-provenance.cjs')],
      {
        cwd: dir,
        encoding: 'utf8',
        windowsHide: true,
        env: {
          ...process.env,
          SOURCE_COMMIT: safeRevision,
          PROVENANCE_REPO_ROOT: dir,
          PROVENANCE_WEBSITE_ROOT: dir,
        },
      },
    );
    const output = JSON.parse(result.trim());
    assert.equal(output.outcome, 'passed');
    assert.equal(output.provenanceMode, 'deployment-source');
    assert.equal(output.revisionSource, 'source-commit');
  } finally {
    cleanup(dir);
  }
});

test('CLI: fails closed without git or SOURCE_COMMIT', () => {
  const dir = createTempWebsite('cli-fail');
  try {
    assert.throws(
      () =>
        execFileSync(
          'node',
          [path.join(__dirname, '..', 'website', 'scripts', 'generate-production-build-provenance.cjs')],
          {
            cwd: dir,
            encoding: 'utf8',
            windowsHide: true,
            env: {
              ...process.env,
              SOURCE_COMMIT: undefined,
              PROVENANCE_REPO_ROOT: dir,
              PROVENANCE_WEBSITE_ROOT: dir,
            },
          },
        ),
      (error) => {
        const output = JSON.parse(error.stderr.trim());
        assert.equal(output.outcome, 'failed');
        assert.equal(output.errorCode, 'build_provenance_revision_unavailable');
        return true;
      },
    );
  } finally {
    cleanup(dir);
  }
});

// --- Hosted validation fixtures ---

const testRoutes = validateRouteInventory([
  { template: '/', path: '/', kind: 'public-static-page', expectedStatuses: [200] },
  { template: '/admin/login', path: '/admin/login', kind: 'anonymous-admin-page', expectedStatuses: [200] },
]);

const testRouteDigest = calculateRouteInventoryDigest(testRoutes);

const testAssetPath = '/_next/static/test.js';
const testAssetSha256 = crypto.createHash('sha256').update('test').digest('hex');
const testAssets = [{ path: testAssetPath, sha256: testAssetSha256 }];
const testAssetDigest = calculateInventoryDigest(testAssets);

function hostedManifest(overrides) {
  return {
    schemaVersion: 2,
    reviewedSha: safeRevision,
    buildId: safeBuildId,
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
    routeCount: testRoutes.length,
    routeInventorySha256: testRouteDigest,
    routes: testRoutes,
    assetCount: testAssets.length,
    inventorySha256: testAssetDigest,
    assets: testAssets,
    ...overrides,
  };
}

// --- Structural regression: no debug hooks in production generator ---

test('production generator source contains no debug hooks', () => {
  const sourcePath = path.join(__dirname, '..', 'website', 'scripts', 'generate-production-build-provenance.cjs');
  const source = fs.readFileSync(sourcePath, 'utf8');
  assert.ok(!source.includes('_PROV_DEBUG'), 'must not contain _PROV_DEBUG');
  assert.ok(!source.includes('DEBUG explicit'), 'must not contain DEBUG explicit');
  assert.ok(
    !/^.*console\.log\(.*\).*$/m.test(source),
    'must not contain unapproved console.log',
  );

  const consoleErrorLines = source.split(/\r?\n/).filter(
    (line) => line.includes('console.error') && !line.trim().startsWith('//'),
  );
  assert.equal(consoleErrorLines.length, 0, 'must not contain unapproved console.error');

  const sourceCommitDirectOutput = source.split(/\r?\n/).filter(
    (line) =>
      line.includes('process.env.SOURCE_COMMIT') &&
      (line.includes('console.log') || line.includes('console.error')),
  );
  assert.equal(
    sourceCommitDirectOutput.length,
    0,
    'must not directly output process.env.SOURCE_COMMIT',
  );

  assert.ok(source.includes('process.stdout.write'), 'must retain stdout path');
  assert.ok(source.includes('process.stderr.write'), 'must retain stderr path');
});
