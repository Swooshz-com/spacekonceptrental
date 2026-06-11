#!/usr/bin/env node
const { assertPhase5mOwnerDecisionIntakeReadiness } = require('./public-review-polish-checks.cjs');

assertPhase5mOwnerDecisionIntakeReadiness();
console.log('Listing detail readiness validation passed. No deployment was performed.');
