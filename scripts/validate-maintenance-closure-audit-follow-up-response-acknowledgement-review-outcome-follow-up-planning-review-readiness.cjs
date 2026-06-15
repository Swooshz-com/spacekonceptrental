const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const includes = (source, needle, label) => assert(source.includes(needle), `${label} missing ${needle}`);
const noMatch = (source, pattern, label) => assert(!pattern.test(source), `${label} contains forbidden pattern ${pattern}`);
const gitLsFiles = (paths) => {
  const result = spawnSync('git', ['ls-files', '--', ...paths], { cwd: repoRoot, encoding: 'utf8' });
  assert(result.status === 0, result.stderr || 'git ls-files failed');
  return result.stdout.split(/\r?\n/).filter(Boolean);
};

const docsPaths = [
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-LEDGER-TEMPLATE.md',
];
const trackerPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
];
const phase6mHeading = '## Phase 6M-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Follow-Up Planning Review Readiness References';
const previousPhaseLine = 'Previous current phase: Phase 6M-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review readiness, audit response acknowledgement review outcome follow-up planning review ledger, and no-planning-review-decision/no-follow-up-action/no-contact/no-remediation firewall.';
const readinessOnlyBody = 'Phase 6M-A/B kept the repo readiness-only for owner/admin review readiness of future theoretical follow-up planning review materials after Phase 6L-A/B follow-up planning readiness.';
const trackerRequired = [
  phase6mHeading,
  previousPhaseLine,
  readinessOnlyBody,
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-REVIEW-LEDGER-TEMPLATE.md',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-readiness.cjs',
  'protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review readiness helper coverage',
];

for (const requiredPath of docsPaths) assert(fs.existsSync(path.join(repoRoot, requiredPath)), `Phase 6M doc missing ${requiredPath}`);
for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  for (const required of trackerRequired) includes(tracker, required, `${trackerPath} Phase 6M tracker section`);
  const headingIndex = tracker.indexOf(phase6mHeading);
  const nextHeadingIndex = tracker.indexOf('\n## ', headingIndex + phase6mHeading.length);
  const section = tracker.slice(headingIndex, nextHeadingIndex === -1 ? tracker.length : nextHeadingIndex);
  noMatch(section, /(^|\n)Current phase: Phase 6[MLKIJ]-A\/B|Phase 6M-A\/B keeps the repo readiness-only for owner\/admin review readiness of future theoretical follow-up planning review materials|Phase 6L-A\/B keeps the repo readiness-only for owner\/admin review of a future theoretical acknowledgement review outcome follow-up planning packet/i, `${trackerPath} Phase 6M historical tracker coverage`);
}

const docs = docsPaths.map(read).join('\n');
const admin = read('website/app/admin/protected-admin-shell.tsx');
const adminPage = read('website/app/admin/page.tsx');
const pkg = JSON.parse(read('package.json'));
const suite = read('scripts/validate-release-candidate-suite.cjs');

for (const required of [
  'Phase 6M-A/B',
  'Follow-up planning review readiness status placeholder',
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
  'No follow-up planning review selected',
  'No follow-up planning review recorded',
  'No follow-up planning decision selected',
  'No follow-up planning decision recorded',
  'No follow-up action selected',
  'No follow-up action recorded',
  'No follow-up owner assigned',
  'No remediation assigned',
  'No recipient contacted',
  'No customer/support/outbound/admin contact sent',
  'No closure decision recorded',
  'No archive created',
  'No retention policy applied',
  'No production evidence recorded',
  'No deployment/runtime/provider/env/scheduler/chat/RAG/public behaviour changes introduced',
]) includes(docs, required, 'Phase 6M docs');

noMatch(docs, /follow-up planning review was selected|follow-up planning review was recorded|follow-up planning decision was selected|follow-up planning decision was recorded|follow-up action was selected|follow-up action was recorded|follow-up owner was assigned|remediation was assigned|recipient was contacted|customer contact was sent|support contact was sent|outbound contact was sent|admin contact was sent|closure decision was recorded|archive was created|retention policy was applied|production evidence was recorded|actual deployment|monitoring configured|analytics configured|cron configured|job configured|deployment approval granted/i, 'Phase 6M docs');
for (const pattern of [
  /Phase 6M-A\/B admin-only maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review readiness/i,
  /MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReviewReadinessHelper/i,
  /Audit response acknowledgement review outcome follow-up planning review ledger/i,
  /Audit response acknowledgement review outcome follow-up planning review checklist/i,
  /No-planning-review-decision\/no-follow-up-action\/no-contact\/no-remediation firewall/i,
  /Safe follow-up planning review language/i,
]) assert(pattern.test(admin), `Phase 6M admin source missing ${pattern}`);
assert(/<MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReadinessHelper \/>[\s\S]*<MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReviewReadinessHelper \/>/.test(admin), 'Phase 6M helper must follow Phase 6L follow-up planning helper');
includes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
assert(pkg.scripts?.['validate:maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-readiness'] === 'node scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-readiness.cjs', 'package.json must register Phase 6M validator');
includes(suite, "validate:maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-readiness", 'release-candidate suite');
noMatch(suite, /docker.*(skip|bypass)|SKIP_DOCKER|BYPASS_DOCKER|supabase.*(skip|bypass)/i, 'release-candidate suite');

const phase6mAdminStart = admin.indexOf('function MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReviewReadinessHelper()');
const phase6mAdminEnd = admin.indexOf('function OwnerReadinessHelpersPanel()', phase6mAdminStart);
assert(phase6mAdminStart !== -1 && phase6mAdminEnd !== -1, 'Phase 6M admin helper boundaries missing');
const phase6mAdmin = admin.slice(phase6mAdminStart, phase6mAdminEnd);
const phaseSources = docs + '\n' + phase6mAdmin;
noMatch(phaseSources, /\b(cart|checkout|payment|purchase)\b/i, 'Phase 6M materials');
noMatch(phaseSources, /\b(booking|reservation|fulfilment|stock-reservation)\b/i, 'Phase 6M materials');
noMatch(phaseSources, /\borders?\b/i, 'Phase 6M materials');
noMatch(phaseSources, /create(Server)?Client|fetch\(|axios|POST \/api|runtime handler|provider call|scheduler job|cron job|RAG retrieval|public route|public UI|webhook URL|NEXT_PUBLIC_|SUPABASE_SERVICE_ROLE_KEY/i, 'Phase 6M materials');

noMatch(suite, /SKIP_DOCKER|BYPASS_DOCKER|docker.*(skip|bypass)|supabase.*(skip|bypass)/i, 'release-candidate suite');

const changedResult = spawnSync('git', ['diff', '--name-only', '--', 'website/app', 'website/components', 'website/lib'], { cwd: repoRoot, encoding: 'utf8' });
assert(changedResult.status === 0, changedResult.stderr || 'git diff --name-only failed');
const changedPublicFiles = changedResult.stdout.split(/\r?\n/).filter(Boolean).filter((file) => !file.includes('/admin/'));
assert(changedPublicFiles.length === 0, `Phase 6M must not change public source files: ${changedPublicFiles.join(', ')}`);

console.log('Phase 6M maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review readiness checks passed. No follow-up planning review or decision was selected or recorded. No follow-up action, owner assignment, remediation, contact, closure, archive, retention, production evidence, runtime, API, provider, env, scheduler, chat, RAG, public behavior, ecommerce flow, customer flow, or Docker bypass was added.');
