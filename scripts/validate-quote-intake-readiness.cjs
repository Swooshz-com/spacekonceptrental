#!/usr/bin/env node
const { assertPhase5fQuoteTriageReadiness } = require('./public-review-polish-checks.cjs');

assertPhase5fQuoteTriageReadiness();
console.log('Quote intake readiness validation passed. No deployment was performed.');
