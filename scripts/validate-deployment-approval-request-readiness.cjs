#!/usr/bin/env node
const {
  assertPhase5pSmokeEvidenceIntakeReadiness,
} = require('./public-review-polish-checks.cjs');

assertPhase5pSmokeEvidenceIntakeReadiness();
console.log(
  'Deployment approval request readiness validation passed. No deployment was performed and no deployment approval was granted.',
);
