#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
  calculateRouteInventoryDigest,
  discoverPublicPageRouteInventory,
} = require('./production-smoke-route-inventory.cjs');

const maxClientAssetCount = 96;
const maxClientAssetBytes = 512 * 1024;
const revisionPattern = /^[0-9a-f]{40}$/;
const buildIdPattern = /^[A-Za-z0-9._-]{8,128}$/;
const approvedIgnoredCheckoutPaths = Object.freeze([
  'node_modules/',
  'website/.next/',
  'website/node_modules/',
]);
const approvedIgnoredCheckoutFiles = new Set([
  'website/public/.well-known/skr-build-provenance.json',
  'website/tsconfig.tsbuildinfo',
]);

function fail(code) {
  throw new Error(code);
}

function calculateInventoryDigest(assets) {
  const canonicalInventory = assets
    .map((asset) => `${asset.path}\0${asset.sha256}\n`)
    .join('');

  return crypto
    .createHash('sha256')
    .update(canonicalInventory, 'utf8')
    .digest('hex');
}

function isApprovedIgnoredCheckoutPath(candidate) {
  const normalized = candidate.replaceAll('\\', '/');

  if (approvedIgnoredCheckoutFiles.has(normalized)) {
    return true;
  }

  return approvedIgnoredCheckoutPaths.some(
    (approvedPath) =>
      normalized === approvedPath.slice(0, -1) ||
      normalized.startsWith(approvedPath),
  );
}

function assertSourceCheckoutClean(rawStatus) {
  const statusText = Buffer.isBuffer(rawStatus)
    ? rawStatus.toString('utf8')
    : String(rawStatus ?? '');
  const records = statusText.includes('\0')
    ? statusText.split('\0')
    : statusText.split(/\r?\n/);

  for (const record of records) {
    if (!record) {
      continue;
    }

    if (record.length < 4 || record[2] !== ' ') {
      fail('build_provenance_source_checkout_status_invalid');
    }

    const status = record.slice(0, 2);
    const candidatePath = record.slice(3);

    if (
      status === '!!' &&
      candidatePath &&
      isApprovedIgnoredCheckoutPath(candidatePath)
    ) {
      continue;
    }

    fail('build_provenance_source_checkout_not_clean');
  }

  return true;
}

function inventoryClientAssets(assetDirectory) {
  const resolvedAssetDirectory = path.resolve(assetDirectory);
  const assets = [];

  function walk(directory) {
    let entries;

    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      fail('build_provenance_asset_inventory_unavailable');
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        fail('build_provenance_asset_entry_not_approved');
      }

      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith('.js')) {
        continue;
      }

      const relativePath = path
        .relative(resolvedAssetDirectory, absolutePath)
        .split(path.sep)
        .join('/');
      const assetPath = `/_next/static/${relativePath}`;
      let assetBody;

      try {
        if (fs.statSync(absolutePath).size > maxClientAssetBytes) {
          fail('build_provenance_asset_body_too_large');
        }
        assetBody = fs.readFileSync(absolutePath);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'build_provenance_asset_body_too_large'
        ) {
          throw error;
        }
        fail('build_provenance_asset_inventory_unavailable');
      }

      const sha256 = crypto
        .createHash('sha256')
        .update(assetBody)
        .digest('hex');

      assets.push(Object.freeze({ path: assetPath, sha256 }));
      if (assets.length > maxClientAssetCount) {
        fail('build_provenance_asset_count_exceeded');
      }
    }
  }

  walk(resolvedAssetDirectory);
  assets.sort((left, right) => left.path.localeCompare(right.path));

  if (assets.length === 0) {
    fail('build_provenance_asset_inventory_empty');
  }

  return Object.freeze(assets);
}

function generateProductionBuildProvenance(options = {}) {
  const repoRoot = path.resolve(
    options.repoRoot ?? path.join(__dirname, '..', '..'),
  );
  const websiteRoot = path.resolve(
    options.websiteRoot ?? path.join(__dirname, '..'),
  );
  const nextDirectory = path.join(websiteRoot, '.next');
  let revision = options.revision;
  let checkoutStatus = options.checkoutStatus;

  if (revision === undefined) {
    try {
      revision = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: repoRoot,
        encoding: 'utf8',
      }).trim();
    } catch {
      fail('build_provenance_revision_unavailable');
    }
  }

  if (checkoutStatus === undefined) {
    try {
      checkoutStatus = execFileSync(
        'git',
        [
          'status',
          '--porcelain=v1',
          '-z',
          '--untracked-files=all',
          '--ignored=matching',
        ],
        {
          cwd: repoRoot,
          encoding: 'buffer',
          maxBuffer: 2 * 1024 * 1024,
        },
      );
    } catch {
      fail('build_provenance_source_checkout_status_unavailable');
    }
  }

  if (!revisionPattern.test(revision)) {
    fail('build_provenance_revision_invalid');
  }

  assertSourceCheckoutClean(checkoutStatus);

  let buildId;

  try {
    buildId = fs.readFileSync(path.join(nextDirectory, 'BUILD_ID'), 'utf8').trim();
  } catch {
    fail('build_provenance_build_id_unavailable');
  }

  if (!buildIdPattern.test(buildId)) {
    fail('build_provenance_build_id_invalid');
  }

  const assets = inventoryClientAssets(path.join(nextDirectory, 'static'));
  const routeInventory = discoverPublicPageRouteInventory({
    appDirectory: options.appDirectory ?? path.join(websiteRoot, 'app'),
  });
  const manifest = {
    schemaVersion: 2,
    reviewedSha: revision,
    buildId,
    trackedCheckoutClean: true,
    sourceCheckoutClean: true,
    routeCount: routeInventory.routes.length,
    routeInventorySha256: calculateRouteInventoryDigest(
      routeInventory.routes,
    ),
    routes: routeInventory.routes,
    assetCount: assets.length,
    inventorySha256: calculateInventoryDigest(assets),
    assets,
  };
  const outputPath = path.join(
    websiteRoot,
    'public',
    '.well-known',
    'skr-build-provenance.json',
  );

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(manifest)}\n`, {
      encoding: 'utf8',
      flag: 'w',
    });
  } catch {
    fail('build_provenance_output_unavailable');
  }

  return Object.freeze({
    outputPath,
    manifest: Object.freeze(manifest),
  });
}

if (require.main === module) {
  try {
    const result = generateProductionBuildProvenance();
    process.stdout.write(
      `${JSON.stringify({
        schemaVersion: 2,
        outcome: 'passed',
        reviewedSha: result.manifest.reviewedSha,
        buildId: result.manifest.buildId,
        trackedCheckoutClean: result.manifest.trackedCheckoutClean,
        sourceCheckoutClean: result.manifest.sourceCheckoutClean,
        routeCount: result.manifest.routeCount,
        assetCount: result.manifest.assetCount,
      })}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        schemaVersion: 2,
        outcome: 'failed',
        errorCode:
          error instanceof Error ? error.message : 'build_provenance_failed',
      })}\n`,
    );
    process.exitCode = 1;
  }
}

module.exports = {
  assertSourceCheckoutClean,
  calculateInventoryDigest,
  generateProductionBuildProvenance,
  inventoryClientAssets,
  isApprovedIgnoredCheckoutPath,
};
