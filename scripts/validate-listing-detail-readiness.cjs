#!/usr/bin/env node
const { assertPhase5pSmokeEvidenceIntakeReadiness } = require('./public-review-polish-checks.cjs');

assertPhase5pSmokeEvidenceIntakeReadiness();
console.log('Listing detail readiness validation passed. No deployment was performed.');
