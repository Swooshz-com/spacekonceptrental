const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const maxPublicRouteCount = 64;
const pageFilePattern = /^page\.(?:js|jsx|ts|tsx)$/;
const staticRouteSegmentPattern = /^[a-z0-9][a-z0-9-]*$/;
const approvedRouteKinds = new Set([
  'anonymous-admin-page',
  'public-dynamic-page',
  'public-static-page',
]);
const approvedRouteStatuses = new Set([200, 404]);
const anonymousAdminPageRoutes = new Set(['/admin/login']);
const protectedAdminPageRoutes = new Set([
  '/admin',
  '/admin/catalogue',
  '/admin/delivery-log',
  '/admin/enquiry-email',
  '/admin/hero',
  '/admin/setups',
]);
const dynamicRouteProbeContracts = new Map([
  [
    '/catalogue/[slug]',
    Object.freeze({
      path: '/catalogue/skr-smoke-probe-reserved',
      expectedStatuses: Object.freeze([200]),
    }),
  ],
  [
    '/listings/[slug]',
    Object.freeze({
      path: '/listings/skr-smoke-probe-reserved',
      expectedStatuses: Object.freeze([200]),
    }),
  ],
]);

class RouteInventoryContractError extends Error {
  constructor(code) {
    super(code);
    this.name = 'RouteInventoryContractError';
    this.code = code;
  }
}

function fail(code) {
  throw new RouteInventoryContractError(code);
}

function listPageFiles(directory) {
  let entries;

  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    fail('public_route_inventory_unavailable');
  }

  return entries.flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listPageFiles(absolutePath);
    }

    return pageFilePattern.test(entry.name) ? [absolutePath] : [];
  });
}

function classifyPageRoute(appDirectory, pageFile) {
  const relativePath = path.relative(appDirectory, pageFile);
  const rawSegments = relativePath.split(path.sep).slice(0, -1);
  const routeSegments = [];

  for (const segment of rawSegments) {
    if (/^\([^.)][^)]*\)$/.test(segment)) {
      continue;
    }

    if (
      segment.startsWith('@') ||
      /^\(\.{1,3}\)/.test(segment) ||
      segment.includes('(') ||
      segment.includes(')')
    ) {
      fail('public_route_inventory_unclassified');
    }

    routeSegments.push(segment);
  }

  const routeTemplate =
    routeSegments.length === 0 ? '/' : `/${routeSegments.join('/')}`;

  if (anonymousAdminPageRoutes.has(routeTemplate)) {
    return Object.freeze({
      routeTemplate,
      reason: 'anonymous-admin-page',
      route: Object.freeze({
        template: routeTemplate,
        path: routeTemplate,
        kind: 'anonymous-admin-page',
        expectedStatuses: Object.freeze([200]),
      }),
    });
  }

  if (protectedAdminPageRoutes.has(routeTemplate)) {
    return Object.freeze({ routeTemplate, reason: 'protected-admin' });
  }

  if (routeSegments[0] === 'admin') {
    fail('public_route_inventory_unclassified_admin_page');
  }

  if (routeSegments[0] === 'api') {
    return Object.freeze({ routeTemplate, reason: 'api-route' });
  }

  if (routeSegments.some((segment) => segment.startsWith('_'))) {
    return Object.freeze({ routeTemplate, reason: 'next-private-segment' });
  }

  const parameterized = routeSegments.some((segment) =>
    /^\[(?:\[)?\.{0,3}[^\]]+\](?:\])?$/.test(segment),
  );

  if (parameterized) {
    const probe = dynamicRouteProbeContracts.get(routeTemplate);

    if (!probe) {
      fail('public_dynamic_route_probe_missing');
    }

    return Object.freeze({
      routeTemplate,
      reason: 'public-dynamic-page',
      route: Object.freeze({
        template: routeTemplate,
        path: probe.path,
        kind: 'public-dynamic-page',
        expectedStatuses: probe.expectedStatuses,
      }),
    });
  }

  if (routeSegments.some((segment) => !staticRouteSegmentPattern.test(segment))) {
    fail('public_route_inventory_unclassified');
  }

  return Object.freeze({
    routeTemplate,
    reason: 'public-static-page',
    route: Object.freeze({
      template: routeTemplate,
      path: routeTemplate,
      kind: 'public-static-page',
      expectedStatuses: Object.freeze([200]),
    }),
  });
}

function assertApprovedRouteEntry(entry) {
  if (
    !entry ||
    typeof entry !== 'object' ||
    Array.isArray(entry) ||
    typeof entry.template !== 'string' ||
    typeof entry.path !== 'string' ||
    !approvedRouteKinds.has(entry.kind) ||
    !Array.isArray(entry.expectedStatuses) ||
    entry.expectedStatuses.length === 0 ||
    entry.expectedStatuses.some(
      (status) =>
        !Number.isSafeInteger(status) || !approvedRouteStatuses.has(status),
    ) ||
    new Set(entry.expectedStatuses).size !== entry.expectedStatuses.length ||
    entry.template.includes('\\') ||
    entry.path.includes('\\') ||
    entry.path.includes('%')
  ) {
    fail('build_provenance_route_entry_not_approved');
  }

  let target;

  try {
    target = new URL(entry.path, 'https://route-inventory.invalid');
  } catch {
    fail('build_provenance_route_entry_not_approved');
  }

  if (
    entry.path !== target.pathname ||
    target.origin !== 'https://route-inventory.invalid' ||
    target.username ||
    target.password ||
    target.port ||
    target.search ||
    target.hash ||
    !entry.template.startsWith('/') ||
    entry.template.includes('?') ||
    entry.template.includes('#')
  ) {
    fail('build_provenance_route_entry_not_approved');
  }

  const parameterized = entry.template.includes('[');
  if (
    (entry.kind === 'public-dynamic-page') !== parameterized ||
    (!parameterized && entry.path !== entry.template) ||
    (!parameterized &&
      (entry.expectedStatuses.length !== 1 ||
        entry.expectedStatuses[0] !== 200)) ||
    (entry.kind === 'anonymous-admin-page') !==
      (entry.template === '/admin/login') ||
    (entry.template.startsWith('/admin') &&
      entry.template !== '/admin/login') ||
    entry.template.startsWith('/api')
  ) {
    fail('build_provenance_route_entry_not_approved');
  }

  const approvedDynamicProbe = dynamicRouteProbeContracts.get(entry.template);
  if (
    parameterized &&
    (!approvedDynamicProbe ||
      entry.path !== approvedDynamicProbe.path ||
      entry.expectedStatuses.length !==
        approvedDynamicProbe.expectedStatuses.length ||
      entry.expectedStatuses.some(
        (status, index) =>
          status !== approvedDynamicProbe.expectedStatuses[index],
      ))
  ) {
    fail('build_provenance_route_entry_not_approved');
  }

  return Object.freeze({
    template: entry.template,
    path: entry.path,
    kind: entry.kind,
    expectedStatuses: Object.freeze([...entry.expectedStatuses]),
  });
}

function calculateRouteInventoryDigest(routes) {
  const canonicalInventory = routes
    .map(
      (route) =>
        `${route.template}\0${route.path}\0${route.kind}\0` +
        `${route.expectedStatuses.join(',')}\n`,
    )
    .join('');

  return crypto
    .createHash('sha256')
    .update(canonicalInventory, 'utf8')
    .digest('hex');
}

function validateRouteInventory(routes) {
  if (
    !Array.isArray(routes) ||
    routes.length === 0 ||
    routes.length > maxPublicRouteCount
  ) {
    fail('build_provenance_route_inventory_invalid');
  }

  const validated = routes.map(assertApprovedRouteEntry);
  const sorted = [...validated].sort((left, right) =>
    left.template.localeCompare(right.template),
  );
  const templates = new Set();
  const paths = new Set();

  for (const route of validated) {
    if (templates.has(route.template) || paths.has(route.path)) {
      fail('build_provenance_route_inventory_duplicate');
    }
    templates.add(route.template);
    paths.add(route.path);
  }

  if (
    sorted.some(
      (route, index) => route.template !== validated[index].template,
    )
  ) {
    fail('build_provenance_route_inventory_incomplete');
  }

  if (!templates.has('/') || !templates.has('/admin/login')) {
    fail('build_provenance_route_inventory_incomplete');
  }

  return Object.freeze(sorted);
}

function discoverPublicPageRouteInventory(options = {}) {
  const appDirectory = path.resolve(options.appDirectory);
  const classifications = listPageFiles(appDirectory).map((pageFile) =>
    classifyPageRoute(appDirectory, pageFile),
  );
  const routes = [];
  const exclusions = [];

  for (const classification of classifications) {
    if (classification.route) {
      routes.push(classification.route);
    } else {
      exclusions.push(classification);
    }
  }

  const validatedRoutes = validateRouteInventory(
    routes.sort((left, right) => left.template.localeCompare(right.template)),
  );
  exclusions.sort((left, right) =>
    left.routeTemplate.localeCompare(right.routeTemplate),
  );

  return Object.freeze({
    routes: validatedRoutes,
    publicRoutes: Object.freeze(validatedRoutes.map((route) => route.path)),
    exclusions: Object.freeze(exclusions),
    digest: calculateRouteInventoryDigest(validatedRoutes),
  });
}

module.exports = {
  RouteInventoryContractError,
  calculateRouteInventoryDigest,
  discoverPublicPageRouteInventory,
  dynamicRouteProbeContracts,
  maxPublicRouteCount,
  validateRouteInventory,
};
