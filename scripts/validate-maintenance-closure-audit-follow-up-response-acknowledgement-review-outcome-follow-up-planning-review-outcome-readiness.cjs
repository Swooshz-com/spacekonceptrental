const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const includes = (source, needle, label) => assert(source.includes(needle), `${label} missing ${needle}`);
const noMatch = (source, pattern, label) => assert(!pattern.test(source), `${label} contains forbidden pattern ${pattern}`);

const docsPaths = [
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-LEDGER-TEMPLATE.md',
];
const trackerPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
];
const phase6nHeading = '## Phase 6N-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Follow-Up Planning Review Outcome Readiness References';
const currentPhaseLine = 'Current phase: Phase 6N-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome readiness, audit response acknowledgement review outcome follow-up planning review outcome ledger, and no-planning-review-outcome/no-planning-review-decision/no-follow-up-action/no-contact/no-remediation firewall.';
const readinessOnlyBody = 'Phase 6N-A/B keeps the repo readiness-only for owner/admin review readiness of future theoretical follow-up planning review outcome materials after Phase 6M-A/B follow-up planning review readiness.';
const trackerRequired = [
  phase6nHeading,
  currentPhaseLine,
  readinessOnlyBody,
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-OUTCOME-LEDGER-TEMPLATE.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-LEDGER-TEMPLATE.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-LEDGER-TEMPLATE.md',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-readiness.cjs',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-readiness.cjs',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-readiness.cjs',
  'protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome readiness helper coverage',
  'protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review readiness helper coverage',
  'protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning readiness helper coverage',
  'Phase 6M-A/B remains the prior follow-up planning review readiness phase',
  'Phase 6L-A/B remains the earlier follow-up planning readiness phase',
];

for (const requiredPath of docsPaths) assert(fs.existsSync(path.join(repoRoot, requiredPath)), `Phase 6N doc missing ${requiredPath}`);
for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  for (const required of trackerRequired) includes(tracker, required, `${trackerPath} Phase 6N tracker section`);
  const headingIndex = tracker.indexOf(phase6nHeading);
  const nextHeadingIndex = tracker.indexOf('\n## ', headingIndex + phase6nHeading.length);
  const section = tracker.slice(headingIndex, nextHeadingIndex === -1 ? tracker.length : nextHeadingIndex);
  noMatch(section, /Current phase: Phase 6[MLKJI]-A\/B|Phase 6M-A\/B keeps the repo readiness-only for owner\/admin review readiness of future theoretical follow-up planning review materials/i, `${trackerPath} Phase 6N section`);
}

const docs = docsPaths.map(read).join('\n');
const admin = read('website/app/admin/protected-admin-shell.tsx');
const adminPage = read('website/app/admin/page.tsx');
const pkg = JSON.parse(read('package.json'));
const suite = read('scripts/validate-release-candidate-suite.cjs');

for (const required of [
  'Phase 6N-A/B',
  'Follow-up planning review outcome readiness status placeholder',
  'Follow-up planning review outcome status placeholder',
  'Follow-up planning review decision status placeholder',
  'Follow-up planning decision status placeholder',
  'Follow-up action status placeholder',
  'Follow-up owner status placeholder',
  'Remediation status placeholder',
  'Recipient contact status placeholder',
  'Customer/support/outbound/admin contact status placeholder',
  'Closure decision status placeholder',
  'Archive status placeholder',
  'Retention status placeholder',
  'Production evidence status placeholder',
  'No follow-up planning review outcome is selected',
  'No follow-up planning review outcome is recorded',
  'No follow-up planning review decision is selected',
  'No follow-up planning review decision is recorded',
  'No follow-up planning decision is selected',
  'No follow-up planning decision is recorded',
  'No follow-up action is selected',
  'No follow-up action is recorded',
  'No follow-up owner is assigned',
  'No remediation is assigned',
  'No recipient is contacted',
  'No customer/support/outbound/admin contact is sent',
  'No closure decision is recorded',
  'No archive is created',
  'No retention policy is applied',
  'No production evidence is recorded',
  'No deployment/runtime/provider/env/scheduler/chat/RAG/public behaviour changes are introduced',
]) includes(docs, required, 'Phase 6N docs');

noMatch(docs, /follow-up planning review outcome was selected|follow-up planning review outcome was recorded|follow-up planning review decision was selected|follow-up planning review decision was recorded|follow-up planning decision was selected|follow-up planning decision was recorded|follow-up action was selected|follow-up action was recorded|follow-up owner was assigned|remediation was assigned|recipient was contacted|customer contact was sent|support contact was sent|outbound contact was sent|admin contact was sent|closure decision was recorded|archive was created|retention policy was applied|production evidence was recorded|actual deployment|monitoring configured|analytics configured|cron configured|job configured|deployment approval granted/i, 'Phase 6N docs');
for (const pattern of [
  /Phase 6N-A\/B admin-only maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome readiness/i,
  /MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReviewOutcomeReadinessHelper/i,
  /Audit response acknowledgement review outcome follow-up planning review outcome ledger/i,
  /Audit response acknowledgement review outcome follow-up planning review outcome checklist/i,
  /No-planning-review-outcome\/no-planning-review-decision\/no-follow-up-action\/no-contact\/no-remediation firewall/i,
  /Safe follow-up planning review outcome language/i,
]) assert(pattern.test(admin), `Phase 6N admin source missing ${pattern}`);

const phase6mFunctionStart = admin.indexOf('function MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReviewReadinessHelper()');
const phase6nFunctionStart = admin.indexOf('function MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReviewOutcomeReadinessHelper()');
const ownerPanelStart = admin.indexOf('function OwnerReadinessHelpersPanel()');
assert(phase6mFunctionStart !== -1, 'Phase 6M admin helper missing');
assert(phase6nFunctionStart !== -1, 'Phase 6N admin helper missing');
assert(ownerPanelStart !== -1, 'Owner readiness helpers panel missing');
assert(phase6mFunctionStart < phase6nFunctionStart && phase6nFunctionStart < ownerPanelStart, 'Phase 6N helper must be placed after the Phase 6M helper and before the owner readiness panel');
assert(/<MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReviewReadinessHelper \/>[\s\S]*<MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReviewOutcomeReadinessHelper \/>/.test(admin), 'Phase 6N helper must render immediately after Phase 6M in the protected admin helper panel');
includes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
assert(pkg.scripts?.['validate:maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-readiness'] === 'node scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-readiness.cjs', 'package.json must register Phase 6N validator');
includes(suite, "validate:maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-readiness", 'release-candidate suite');
noMatch(suite, /docker.*(skip|bypass)|SKIP_DOCKER|BYPASS_DOCKER|supabase.*(skip|bypass)/i, 'release-candidate suite');

const phase6nAdminEnd = admin.indexOf('function OwnerReadinessHelpersPanel()', phase6nFunctionStart);
assert(phase6nAdminEnd !== -1, 'Phase 6N admin helper boundary missing');
const phase6nAdmin = admin.slice(phase6nFunctionStart, phase6nAdminEnd);
const phaseSources = docs + '\n' + phase6nAdmin;
noMatch(phaseSources, /\b(cart|checkout|payment|purchase)\b/i, 'Phase 6N materials');
noMatch(phaseSources, /\b(booking|reservation|fulfilment|stock-reservation)\b/i, 'Phase 6N materials');
noMatch(phaseSources, /\borders?\b/i, 'Phase 6N materials');
noMatch(phaseSources, /create(Server)?Client|fetch\(|axios|POST \/api|runtime handler|provider call|scheduler job|cron job|RAG retrieval|public route|public UI|webhook URL|NEXT_PUBLIC_|SUPABASE_SERVICE_ROLE_KEY/i, 'Phase 6N materials');

const changedResult = spawnSync('git', ['diff', '--name-only', '--', 'website/app', 'website/components', 'website/lib'], { cwd: repoRoot, encoding: 'utf8' });
assert(changedResult.status === 0, changedResult.stderr || 'git diff --name-only failed');
const changedPublicFiles = changedResult.stdout.split(/\r?\n/).filter(Boolean).filter((file) => !file.includes('/admin/'));
assert(changedPublicFiles.length === 0, `Phase 6N must not change public source files: ${changedPublicFiles.join(', ')}`);

console.log('Phase 6N maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome readiness checks passed. No follow-up planning review outcome, review decision, planning decision, follow-up action, owner assignment, remediation, contact, closure, archive, retention, production evidence, runtime, API, provider, env, scheduler, chat, RAG, public behavior, ecommerce flow, customer flow, or Docker bypass was added.');
