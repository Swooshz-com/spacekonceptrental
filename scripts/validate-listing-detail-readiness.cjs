#!/usr/bin/env node
const { assertPhase5dListingDetailReadiness } = require('./public-review-polish-checks.cjs');

assertPhase5dListingDetailReadiness();
console.log('Listing detail readiness validation passed. No deployment was performed.');
