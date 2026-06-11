#!/usr/bin/env node
const { assertPhase5nDeploymentApprovalRequestReadiness } = require('./public-review-polish-checks.cjs');

assertPhase5nDeploymentApprovalRequestReadiness();
console.log('Quote triage readiness validation passed. No deployment was performed.');
