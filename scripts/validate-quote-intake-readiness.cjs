#!/usr/bin/env node
const { assertPhase5eQuoteIntakeReadiness } = require('./public-review-polish-checks.cjs');

assertPhase5eQuoteIntakeReadiness();
console.log('Quote intake readiness validation passed. No deployment was performed.');
