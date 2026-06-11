const {
  assertPhase5rLaunchDecisionResponseReadiness,
} = require('./public-review-polish-checks.cjs');

assertPhase5rLaunchDecisionResponseReadiness();
console.log('Smoke evidence intake readiness validation passed. No deployment was performed. This does not approve deployment.');
