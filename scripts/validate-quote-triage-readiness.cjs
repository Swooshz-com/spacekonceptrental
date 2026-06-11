#!/usr/bin/env node
const { assertPhase5mOwnerDecisionIntakeReadiness } = require('./public-review-polish-checks.cjs');

assertPhase5mOwnerDecisionIntakeReadiness();
console.log('Quote triage readiness validation passed. No deployment was performed.');
