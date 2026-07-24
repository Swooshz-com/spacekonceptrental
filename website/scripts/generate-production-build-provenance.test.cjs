#!/usr/bin/env node

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const {
  assertSourceCheckoutClean,
  approvedProvenanceModes,
  calculateInventoryDigest,
  generateProductionBuildProvenance,
  inventoryClientAssets,
  isApprovedIgnoredCheckoutPath,
  normalizeRevisionCandidate,
  resolveRevision,
  tryGitCheckoutStatus,
  tryGitRevision,
} = require('./generate-production-build-provenance.cjs');

const safeRevision = 'a'.repeat(40);
const safeBuildId = 'test-build-id-123';

function createTempWebsite(suffix = '') {
  const dir = fs.mkdtempSync(
    path.join(
      require('node:os').tmpdir(),
      `skr-provenance-test-${suffix}-`,
    ),
  );
  const nextDir = path.join(dir, '.next');
  const staticDir = path.join(nextDir, 'static', 'chunks');
  const appDir = path.join(dir, 'app');
  const publicDir = path.join(dir, 'public', '.well-known');

  fs.mkdirSync(staticDir, { recursive: true });
  fs.mkdirSync(path.join(appDir, 'admin', 'login'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'categories'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'events'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'listings', '[slug]'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'privacy'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'terms'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'catalogue', '[slug]'), { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(path.join(nextDir, 'BUILD_ID'), safeBuildId);
  fs.writeFileSync(
    path.join(staticDir, 'app.js'),
    'console.log("test");',
  );

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
  execFileSync('git', ['commit', '-m', 'init', '--allow-empty'], {
    cwd: dir,
    windowsHide: true,
  });
}

function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
  } catch {
    // ignore cleanup errors
  }
}

test('normalizeRevisionCandidate accepts valid 40-char hex', () => {
  assert.equal(normalizeRevisionCandidate(safeRevision), safeRevision);
  assert.equal(normalizeRevisionCandidate('  ' + safeRevision + '  '), safeRevision);
  assert.equal(normalizeRevisionCandidate('ABCDEF1234567890abcdef1234567890ABCDEF12'), null);
  assert.equal(normalizeRevisionCandidate('abc'), null);
  assert.equal(normalizeRevisionCandidate(''), null);
  assert.equal(normalizeRevisionCandidate(null), null);
  assert.equal(normalizeRevisionCandidate(undefined), null);
});

test('approvedProvenanceModes contains expected modes', () => {
  assert.ok(approvedProvenanceModes.has('git-checkout'));
  assert.ok(approvedProvenanceModes.has('deployment-source'));
  assert.equal(approvedProvenanceModes.size, 2);
});

test('clean Git checkout, no SOURCE_COMMIT - PASS in git-checkout mode', () => {
  const dir = createTempWebsite('clean-git');
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
    assert.ok(revisionPattern().test(result.manifest.reviewedSha));
  } finally {
    cleanup(dir);
  }
});

test('valid SOURCE_COMMIT, no .git - PASS in deployment-source mode', () => {
  const dir = createTempWebsite('source-commit');

  try {
    const saved = process.env.SOURCE_COMMIT;
    process.env.SOURCE_COMMIT = safeRevision;

    try {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });

      assert.equal(result.manifest.provenanceMode, 'deployment-source');
      assert.equal(result.manifest.revisionSource, 'source-commit');
      assert.equal(result.manifest.sourceCheckoutClean, false);
      assert.equal(result.manifest.trackedCheckoutClean, false);
      assert.equal(result.manifest.reviewedSha, safeRevision);
    } finally {
      if (saved === undefined) {
        delete process.env.SOURCE_COMMIT;
      } else {
        process.env.SOURCE_COMMIT = saved;
      }
    }
  } finally {
    cleanup(dir);
  }
});

test('Git revision and SOURCE_COMMIT equal - PASS', () => {
  const dir = createTempWebsite('git-source-equal');
  createTempRepo(dir);

  try {
    const gitSha = tryGitRevision(dir);
    const saved = process.env.SOURCE_COMMIT;
    process.env.SOURCE_COMMIT = gitSha;

    try {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });

      assert.equal(result.manifest.reviewedSha, gitSha);
      assert.equal(result.manifest.provenanceMode, 'git-checkout');
    } finally {
      if (saved === undefined) {
        delete process.env.SOURCE_COMMIT;
      } else {
        process.env.SOURCE_COMMIT = saved;
      }
    }
  } finally {
    cleanup(dir);
  }
});

test('Git revision and SOURCE_COMMIT differ - FAIL', () => {
  const dir = createTempWebsite('git-source-differ');
  createTempRepo(dir);

  try {
    const saved = process.env.SOURCE_COMMIT;
    process.env.SOURCE_COMMIT = 'b'.repeat(40);

    try {
      assert.throws(
        () =>
          generateProductionBuildProvenance({
            repoRoot: dir,
            websiteRoot: dir,
          }),
        { message: 'build_provenance_revision_source_mismatch' },
      );
    } finally {
      if (saved === undefined) {
        delete process.env.SOURCE_COMMIT;
      } else {
        process.env.SOURCE_COMMIT = saved;
      }
    }
  } finally {
    cleanup(dir);
  }
});

test('malformed SOURCE_COMMIT - FAIL', () => {
  const dir = createTempWebsite('malformed-source');

  try {
    const saved = process.env.SOURCE_COMMIT;
    process.env.SOURCE_COMMIT = 'not-a-valid-sha';

    try {
      assert.throws(
        () =>
          generateProductionBuildProvenance({
            repoRoot: dir,
            websiteRoot: dir,
          }),
        { message: 'build_provenance_revision_unavailable' },
      );
    } finally {
      if (saved === undefined) {
        delete process.env.SOURCE_COMMIT;
      } else {
        process.env.SOURCE_COMMIT = saved;
      }
    }
  } finally {
    cleanup(dir);
  }
});

test('malformed explicit revision - FAIL', () => {
  const dir = createTempWebsite('malformed-explicit');

  try {
    assert.throws(
      () =>
        generateProductionBuildProvenance({
          repoRoot: dir,
          websiteRoot: dir,
          revision: 'not-valid',
        }),
      { message: 'build_provenance_revision_unavailable' },
    );
  } finally {
    cleanup(dir);
  }
});

test('no Git and no SOURCE_COMMIT - FAIL', () => {
  const dir = createTempWebsite('no-git-no-source');

  try {
    const saved = process.env.SOURCE_COMMIT;
    delete process.env.SOURCE_COMMIT;

    try {
      assert.throws(
        () =>
          generateProductionBuildProvenance({
            repoRoot: dir,
            websiteRoot: dir,
          }),
        { message: 'build_provenance_revision_unavailable' },
      );
    } finally {
      if (saved === undefined) {
        delete process.env.SOURCE_COMMIT;
      } else {
        process.env.SOURCE_COMMIT = saved;
      }
    }
  } finally {
    cleanup(dir);
  }
});

test('dirty Git checkout - FAIL', () => {
  const dir = createTempWebsite('dirty-git');
  createTempRepo(dir);

  fs.writeFileSync(path.join(dir, 'dirty.txt'), 'dirty');

  try {
    assert.throws(
      () =>
        generateProductionBuildProvenance({
          repoRoot: dir,
          websiteRoot: dir,
        }),
      { message: 'build_provenance_source_checkout_not_clean' },
    );
  } finally {
    cleanup(dir);
  }
});

test('Git command unavailable but valid SOURCE_COMMIT present - PASS in deployment-source mode', () => {
  const dir = createTempWebsite('git-unavailable');

  try {
    const saved = process.env.SOURCE_COMMIT;
    process.env.SOURCE_COMMIT = safeRevision;

    try {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });

      assert.equal(result.manifest.provenanceMode, 'deployment-source');
      assert.equal(result.manifest.revisionSource, 'source-commit');
      assert.equal(result.manifest.sourceCheckoutClean, false);
      assert.equal(result.manifest.trackedCheckoutClean, false);
      assert.equal(result.manifest.reviewedSha, safeRevision);
    } finally {
      if (saved === undefined) {
        delete process.env.SOURCE_COMMIT;
      } else {
        process.env.SOURCE_COMMIT = saved;
      }
    }
  } finally {
    cleanup(dir);
  }
});

test('manifest does not claim Git checkout cleanliness in deployment-source mode', () => {
  const dir = createTempWebsite('no-git-claim');

  try {
    const saved = process.env.SOURCE_COMMIT;
    process.env.SOURCE_COMMIT = safeRevision;

    try {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
      });

      assert.equal(result.manifest.sourceCheckoutClean, false);
      assert.equal(result.manifest.trackedCheckoutClean, false);
      assert.equal(result.manifest.provenanceMode, 'deployment-source');
    } finally {
      if (saved === undefined) {
        delete process.env.SOURCE_COMMIT;
      } else {
        process.env.SOURCE_COMMIT = saved;
      }
    }
  } finally {
    cleanup(dir);
  }
});

test('explicit revision matches SOURCE_COMMIT - PASS', () => {
  const dir = createTempWebsite('explicit-match');

  try {
    const saved = process.env.SOURCE_COMMIT;
    process.env.SOURCE_COMMIT = safeRevision;

    try {
      const result = generateProductionBuildProvenance({
        repoRoot: dir,
        websiteRoot: dir,
        revision: safeRevision,
        checkoutStatus: '',
      });

      assert.equal(result.manifest.reviewedSha, safeRevision);
      assert.equal(result.manifest.revisionSource, 'explicit');
    } finally {
      if (saved === undefined) {
        delete process.env.SOURCE_COMMIT;
      } else {
        process.env.SOURCE_COMMIT = saved;
      }
    }
  } finally {
    cleanup(dir);
  }
});

test('explicit revision mismatches SOURCE_COMMIT - FAIL', () => {
  const dir = createTempWebsite('explicit-mismatch');

  try {
    const saved = process.env.SOURCE_COMMIT;
    process.env.SOURCE_COMMIT = 'b'.repeat(40);

    try {
      assert.throws(
        () =>
          generateProductionBuildProvenance({
            repoRoot: dir,
            websiteRoot: dir,
            revision: safeRevision,
            checkoutStatus: '',
          }),
        { message: 'build_provenance_revision_source_mismatch' },
      );
    } finally {
      if (saved === undefined) {
        delete process.env.SOURCE_COMMIT;
      } else {
        process.env.SOURCE_COMMIT = saved;
      }
    }
  } finally {
    cleanup(dir);
  }
});

test('command-line entry point reports provenance mode in output', () => {
  const dir = createTempWebsite('cli-entry');

  try {
    const result = execFileSync(
      'node',
      [path.join(__dirname, 'generate-production-build-provenance.cjs')],
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
    assert.equal(outcome(output), 'passed');
    assert.equal(output.provenanceMode, 'deployment-source');
    assert.equal(output.revisionSource, 'source-commit');
    assert.equal(output.reviewedSha, safeRevision);
    assert.equal(output.sourceCheckoutClean, false);
    assert.equal(output.trackedCheckoutClean, false);
  } finally {
    cleanup(dir);
  }
});

test('command-line entry point fails closed without git or SOURCE_COMMIT', () => {
  const dir = createTempWebsite('cli-fail');

  try {
    assert.throws(
      () =>
        execFileSync(
          'node',
          [path.join(__dirname, 'generate-production-build-provenance.cjs')],
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
        assert.equal(outcome(output), 'failed');
        assert.equal(output.errorCode, 'build_provenance_revision_unavailable');
        return true;
      },
    );
  } finally {
    cleanup(dir);
  }
});

function revisionPattern() {
  return /^[0-9a-f]{40}$/;
}

function outcome(output) {
  return output.outcome;
}
