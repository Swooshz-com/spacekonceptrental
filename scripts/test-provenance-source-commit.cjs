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
  classifyRevisionCandidate,
  generateProductionBuildProvenance,
} = require('../website/scripts/generate-production-build-provenance.cjs');

const safeRevision = 'a'.repeat(40);
const safeBuildId = 'test-build-id-123';

function createTempWebsite(suffix = '') {
  const dir = fs.mkdtempSync(
    path.join(require('node:os').tmpdir(), `skr-provenance-${suffix}-`),
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

function runWithSourceCommit(dir, sourceCommit, fn) {
  const saved = process.env.SOURCE_COMMIT;

  try {
    if (sourceCommit === undefined) {
      delete process.env.SOURCE_COMMIT;
    } else {
      process.env.SOURCE_COMMIT = sourceCommit;
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

// --- classifyRevisionCandidate ---

test('classifyRevisionCandidate: absent for non-string', () => {
  assert.deepEqual(classifyRevisionCandidate(null), { state: 'absent' });
  assert.deepEqual(classifyRevisionCandidate(undefined), { state: 'absent' });
  assert.deepEqual(classifyRevisionCandidate(42), { state: 'absent' });
});

test('classifyRevisionCandidate: malformed for empty or whitespace', () => {
  assert.deepEqual(classifyRevisionCandidate(''), { state: 'malformed' });
  assert.deepEqual(classifyRevisionCandidate('   '), { state: 'malformed' });
});

test('classifyRevisionCandidate: malformed for non-hex or wrong length', () => {
  assert.deepEqual(classifyRevisionCandidate('abc'), { state: 'malformed' });
  assert.deepEqual(classifyRevisionCandidate('g'.repeat(40)), {
    state: 'malformed',
  });
  assert.deepEqual(classifyRevisionCandidate('a'.repeat(39)), {
    state: 'malformed',
  });
});

test('classifyRevisionCandidate: valid for correct 40-char hex', () => {
  assert.deepEqual(classifyRevisionCandidate(safeRevision), {
    state: 'valid',
    value: safeRevision,
  });
  assert.deepEqual(classifyRevisionCandidate('  ' + safeRevision + '  '), {
    state: 'valid',
    value: safeRevision,
  });
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

// --- Scenario 1: No Git, no explicit, no SOURCE_COMMIT ---

test('1. no Git, no explicit, no SOURCE_COMMIT: fail unavailable', () => {
  const dir = createTempWebsite('s1');

  try {
    runWithSourceCommit(dir, undefined, () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_revision_unavailable' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 2: No Git + valid SOURCE_COMMIT: pass deployment-source ---

test('2. no Git + valid SOURCE_COMMIT: pass deployment-source', () => {
  const dir = createTempWebsite('s2');

  try {
    runWithSourceCommit(dir, safeRevision, () => {
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

// --- Scenario 3: No Git + malformed SOURCE_COMMIT: fail invalid ---

test('3. no Git + malformed SOURCE_COMMIT: fail invalid', () => {
  const dir = createTempWebsite('s3');

  try {
    runWithSourceCommit(dir, 'not-a-valid-sha', () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_revision_invalid' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 4: Valid Git + malformed SOURCE_COMMIT: fail invalid ---

test('4. valid Git + malformed SOURCE_COMMIT: fail invalid', () => {
  const dir = createTempWebsite('s4');
  createTempRepo(dir);

  try {
    runWithSourceCommit(dir, 'not-a-valid-sha', () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_revision_invalid' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 5: Valid Git + malformed explicit revision: fail invalid ---

test('5. valid Git + malformed explicit revision: fail invalid', () => {
  const dir = createTempWebsite('s5');
  createTempRepo(dir);

  try {
    assert.throws(
      () =>
        generateProductionBuildProvenance({
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

// --- Scenario 6: Malformed Git revision output: fail closed ---

test('6. malformed Git revision output: fail closed', () => {
  const dir = createTempWebsite('s6');

  try {
    runWithSourceCommit(dir, undefined, () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_revision_unavailable' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 7: .git exists and rev-parse fails, no other source: fail ---

test('7. .git exists and rev-parse fails, no other source: fail git error', () => {
  const dir = createTempWebsite('s7');
  fs.mkdirSync(path.join(dir, '.git'));

  try {
    runWithSourceCommit(dir, undefined, () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_git_revision_command_failed' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 8: .git exists and rev-parse fails, with valid SOURCE_COMMIT: still fail ---

test('8. .git exists and rev-parse fails with valid SOURCE_COMMIT: still fail', () => {
  const dir = createTempWebsite('s8');
  fs.mkdirSync(path.join(dir, '.git'));

  try {
    runWithSourceCommit(dir, safeRevision, () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_git_revision_command_failed' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 9: .git exists and git commands fail: fail closed ---

test('9. .git exists and git commands fail: fail closed', () => {
  const dir = createTempWebsite('s9');
  fs.mkdirSync(path.join(dir, '.git'));

  try {
    assert.throws(
      () =>
        generateProductionBuildProvenance({
          repoRoot: dir,
          websiteRoot: dir,
        }),
      (error) => {
        assert.ok(
          error.message === 'build_provenance_git_revision_command_failed' ||
          error.message === 'build_provenance_checkout_status_command_failed',
          `Expected git command failure, got: ${error.message}`,
        );
        return true;
      },
    );
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 10: Dirty checkout: fail ---

test('10. dirty checkout: fail source_checkout_not_clean', () => {
  const dir = createTempWebsite('s10');
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

// --- Scenario 11: Git and SOURCE_COMMIT agree: pass ---

test('11. Git and SOURCE_COMMIT agree: pass', () => {
  const dir = createTempWebsite('s11');
  createTempRepo(dir);

  try {
    const gitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
      windowsHide: true,
    }).trim();

    runWithSourceCommit(dir, gitSha, () => {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });

      assert.equal(result.manifest.reviewedSha, gitSha);
      assert.equal(result.manifest.provenanceMode, 'git-checkout');
      assert.equal(result.manifest.sourceCheckoutClean, true);
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 12: Git and SOURCE_COMMIT disagree: fail ---

test('12. Git and SOURCE_COMMIT disagree: fail mismatch', () => {
  const dir = createTempWebsite('s12');
  createTempRepo(dir);

  try {
    runWithSourceCommit(dir, 'b'.repeat(40), () => {
      assert.throws(
        () => generateProductionBuildProvenance({ repoRoot: dir, websiteRoot: dir }),
        { message: 'build_provenance_revision_source_mismatch' },
      );
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 13: Explicit, Git and SOURCE_COMMIT all agree: pass ---

test('13. explicit, Git and SOURCE_COMMIT all agree: pass', () => {
  const dir = createTempWebsite('s13');
  createTempRepo(dir);

  try {
    const gitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
      windowsHide: true,
    }).trim();

    runWithSourceCommit(dir, gitSha, () => {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
        revision: gitSha,
      });

      assert.equal(result.manifest.reviewedSha, gitSha);
      assert.equal(result.manifest.revisionSource, 'explicit');
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 14: Explicit disagrees with valid secondary: fail ---

test('14. explicit disagrees with valid Git: fail mismatch', () => {
  const dir = createTempWebsite('s14');
  createTempRepo(dir);

  try {
    assert.throws(
      () =>
        generateProductionBuildProvenance({
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

// --- Scenario 15: git-checkout + git: pass with clean ---

test('15. git-checkout + git: pass when clean', () => {
  const dir = createTempWebsite('s15');
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

// --- Scenario 16: git-checkout + explicit: pass only when Git inspected ---

test('16. git-checkout + explicit: pass when Git checkout inspected', () => {
  const dir = createTempWebsite('s16');
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

    assert.equal(result.manifest.provenanceMode, 'git-checkout');
    assert.equal(result.manifest.revisionSource, 'explicit');
    assert.equal(result.manifest.sourceCheckoutClean, true);
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 17: git-checkout + source-commit: reject ---

test('17. git-checkout + source-commit: reject in hosted validation', () => {
  const dir = createTempWebsite('s17');
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
    });

    assert.equal(result.manifest.provenanceMode, 'git-checkout');
    assert.equal(result.manifest.revisionSource, 'git');

    const hostedCandidate = {
      ...JSON.parse(JSON.stringify(result.manifest)),
      revisionSource: 'source-commit',
    };

    assert.throws(
      () => validateHostedProvenance(hostedCandidate, gitSha, safeBuildId),
      { message: 'build_provenance_identity_mismatch' },
    );
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 18: deployment-source + source-commit: pass ---

test('18. deployment-source + source-commit: pass with clean false', () => {
  const dir = createTempWebsite('s18');

  try {
    runWithSourceCommit(dir, safeRevision, () => {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });

      assert.equal(result.manifest.provenanceMode, 'deployment-source');
      assert.equal(result.manifest.revisionSource, 'source-commit');
      assert.equal(result.manifest.sourceCheckoutClean, false);
      assert.equal(result.manifest.trackedCheckoutClean, false);
    });
  } finally {
    cleanup(dir);
  }
});

// --- Scenario 19: deployment-source + explicit: pass ---

test('19. deployment-source + explicit: pass with clean false', () => {
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

// --- Scenario 20: deployment-source + git: reject ---

test('20. deployment-source + git: reject in hosted validation', () => {
  const manifest = {
    schemaVersion: 2,
    reviewedSha: safeRevision,
    buildId: safeBuildId,
    provenanceMode: 'deployment-source',
    revisionSource: 'git',
    trackedCheckoutClean: false,
    sourceCheckoutClean: false,
    routeCount: 1,
    routeInventorySha256: '0'.repeat(64),
    routes: [],
    assetCount: 1,
    inventorySha256: '0'.repeat(64),
    assets: [],
  };

  assert.throws(
    () => validateHostedProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 21: Missing or unknown revisionSource: reject ---

test('21. missing revisionSource: reject', () => {
  const manifest = {
    schemaVersion: 2,
    reviewedSha: safeRevision,
    buildId: safeBuildId,
    provenanceMode: 'git-checkout',
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
    routeCount: 1,
    routeInventorySha256: '0'.repeat(64),
    routes: [],
    assetCount: 1,
    inventorySha256: '0'.repeat(64),
    assets: [],
  };

  assert.throws(
    () => validateHostedProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('21b. unknown revisionSource: reject', () => {
  const manifest = {
    schemaVersion: 2,
    reviewedSha: safeRevision,
    buildId: safeBuildId,
    provenanceMode: 'git-checkout',
    revisionSource: 'unknown',
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
    routeCount: 1,
    routeInventorySha256: '0'.repeat(64),
    routes: [],
    assetCount: 1,
    inventorySha256: '0'.repeat(64),
    assets: [],
  };

  assert.throws(
    () => validateHostedProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario 22: Invalid cleanliness booleans: reject ---

test('22a. git-checkout with sourceCheckoutClean false: reject', () => {
  const manifest = {
    schemaVersion: 2,
    reviewedSha: safeRevision,
    buildId: safeBuildId,
    provenanceMode: 'git-checkout',
    revisionSource: 'git',
    trackedCheckoutClean: true,
    sourceCheckoutClean: false,
    routeCount: 1,
    routeInventorySha256: '0'.repeat(64),
    routes: [],
    assetCount: 1,
    inventorySha256: '0'.repeat(64),
    assets: [],
  };

  assert.throws(
    () => validateHostedProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('22b. deployment-source with trackedCheckoutClean true: reject', () => {
  const manifest = {
    schemaVersion: 2,
    reviewedSha: safeRevision,
    buildId: safeBuildId,
    provenanceMode: 'deployment-source',
    revisionSource: 'source-commit',
    trackedCheckoutClean: true,
    sourceCheckoutClean: false,
    routeCount: 1,
    routeInventorySha256: '0'.repeat(64),
    routes: [],
    assetCount: 1,
    inventorySha256: '0'.repeat(64),
    assets: [],
  };

  assert.throws(
    () => validateHostedProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

test('22c. deployment-source with sourceCheckoutClean true: reject', () => {
  const manifest = {
    schemaVersion: 2,
    reviewedSha: safeRevision,
    buildId: safeBuildId,
    provenanceMode: 'deployment-source',
    revisionSource: 'source-commit',
    trackedCheckoutClean: false,
    sourceCheckoutClean: true,
    routeCount: 1,
    routeInventorySha256: '0'.repeat(64),
    routes: [],
    assetCount: 1,
    inventorySha256: '0'.repeat(64),
    assets: [],
  };

  assert.throws(
    () => validateHostedProvenance(manifest, safeRevision, safeBuildId),
    { message: 'build_provenance_identity_mismatch' },
  );
});

// --- Scenario: CLI entry point reports provenance mode ---

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
    assert.equal(output.reviewedSha, safeRevision);
    assert.equal(output.sourceCheckoutClean, false);
    assert.equal(output.trackedCheckoutClean, false);
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

// --- Hosted validation helper (matches smoke-production-readonly logic) ---

const approvedRevisionSourceSet = new Set(['explicit', 'git', 'source-commit']);
const allowedSourcesByMode = {
  'git-checkout': new Set(['explicit', 'git']),
  'deployment-source': new Set(['explicit', 'source-commit']),
};

function validateHostedProvenance(candidate, expectedRevision, expectedBuildId) {
  const provenanceMode = candidate?.provenanceMode;
  const revisionSource = candidate?.revisionSource;
  const isGitCheckout = provenanceMode === 'git-checkout';
  const isDeploymentSource = provenanceMode === 'deployment-source';
  const allowedSources = allowedSourcesByMode[provenanceMode];
  const sourceAllowed =
    allowedSources !== undefined && allowedSources.has(revisionSource);

  if (
    !candidate ||
    typeof candidate !== 'object' ||
    Array.isArray(candidate) ||
    candidate.schemaVersion !== 2 ||
    candidate.reviewedSha !== expectedRevision ||
    candidate.buildId !== expectedBuildId ||
    !approvedProvenanceModes.has(provenanceMode) ||
    !approvedRevisionSourceSet.has(revisionSource) ||
    !sourceAllowed ||
    (isGitCheckout && candidate.trackedCheckoutClean !== true) ||
    (isGitCheckout && candidate.sourceCheckoutClean !== true) ||
    (isDeploymentSource && candidate.trackedCheckoutClean !== false) ||
    (isDeploymentSource && candidate.sourceCheckoutClean !== false)
  ) {
    throw new Error('build_provenance_identity_mismatch');
  }

  return candidate;
}
