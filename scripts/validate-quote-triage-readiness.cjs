#!/usr/bin/env node
const { assertPhase5jOwnerFeedbackIntakeReadiness } = require('./public-review-polish-checks.cjs');

assertPhase5jOwnerFeedbackIntakeReadiness();
console.log('Quote triage readiness validation passed. No deployment was performed.');
