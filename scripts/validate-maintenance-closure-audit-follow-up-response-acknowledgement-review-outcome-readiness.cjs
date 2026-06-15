const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const docsPaths = [
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-LEDGER-TEMPLATE.md',
];

const trackerPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
];
const phase6kHeading = '## Phase 6K-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Readiness References';
const phase6kCurrentPhaseLine = 'Current phase: Phase 6K-A/B maintenance closure audit follow-up response acknowledgement review outcome readiness, audit response acknowledgement review outcome ledger, and no-outcome/no-contact/no-remediation firewall.';
const phase6kReadinessOnlyBody = 'Phase 6K-A/B keeps the repo readiness-only for owner/admin review of a future theoretical audit response acknowledgement review outcome packet after Phase 6J-A/B acknowledgement review readiness. It follows Phase 6J without recording acknowledgement review outcomes, selecting acknowledgement review outcomes, accepting acknowledgement review outcomes, completing acknowledgement reviews, recording acknowledgement review decisions, recording acknowledgement, recording delivery, contacting recipients, configuring recipients or channels, sending acknowledgement requests, recording recipient confirmation, recording recipient acknowledgement, assigning remediation, creating remediation tasks, disclosing externally, receiving or recording audit findings, creating audit follow-up records, classifying findings, assigning severity, assigning triage owners, recording triage decisions, creating archives, writing archive records, applying retention policies, recording closure decisions, accepting closure recommendations, recording closure approval, marking maintenance complete, collecting production evidence, running smoke checks, executing provider/runtime checks, deploying, changing public runtime behavior, sending support/customer follow-up, creating outbound messaging, or claiming production readiness.';
const phase6kTrackerRequired = [
  phase6kHeading,
  phase6kCurrentPhaseLine,
  phase6kReadinessOnlyBody,
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-LEDGER-TEMPLATE.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-LEDGER-TEMPLATE.md',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-readiness.cjs',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-readiness.cjs',
  'protected admin maintenance closure audit follow-up response acknowledgement review outcome readiness helper coverage',
];

const adminPath = 'website/app/admin/protected-admin-shell.tsx';
const adminPagePath = 'website/app/admin/page.tsx';

function read(file) { return fs.readFileSync(path.join(repoRoot, file), 'utf8'); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function includes(source, needle, label) { assert(source.includes(needle), `${label} missing ${needle}`); }
function noMatch(source, pattern, label) { assert(!pattern.test(source), `${label} contains forbidden pattern ${pattern}`); }
function gitLsFiles(paths) {
  const result = spawnSync('git', ['ls-files', '--', ...paths], { cwd: repoRoot, encoding: 'utf8' });
  assert(result.status === 0, result.stderr || 'git ls-files failed');
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

for (const requiredPath of docsPaths) {
  assert(fs.existsSync(path.join(repoRoot, requiredPath)), `Phase 6K doc missing ${requiredPath}`);
}

for (const trackerPath of trackerPaths) {
  assert(fs.existsSync(path.join(repoRoot, trackerPath)), `Phase 6K tracker doc missing ${trackerPath}`);
  const tracker = read(trackerPath);
  for (const required of phase6kTrackerRequired) includes(tracker, required, `${trackerPath} Phase 6K tracker section`);
  const headingIndex = tracker.indexOf(phase6kHeading);
  assert(headingIndex >= 0, `${trackerPath} missing Phase 6K heading`);
  const nextHeadingIndex = tracker.indexOf('\n## ', headingIndex + phase6kHeading.length);
  const phase6kSection = tracker.slice(headingIndex, nextHeadingIndex === -1 ? tracker.length : nextHeadingIndex);
  noMatch(phase6kSection, /Current phase: Phase 6[JIF]-A\/B|Phase 6J-A\/B keeps the repo readiness-only|Phase 6I-A\/B keeps the repo readiness-only|Phase 6F-A\/B keeps the repo readiness-only|no-review-decision\/no-contact\/no-remediation firewall|no-acknowledgement\/no-contact\/no-remediation firewall|no-response\/no-remediation firewall/i, `${trackerPath} Phase 6K section`);
}

const docs = docsPaths.map(read).join('\n');
const admin = read(adminPath);
const adminPage = read(adminPagePath);
const pkg = JSON.parse(read('package.json'));
const suite = read('scripts/validate-release-candidate-suite.cjs');

for (const required of [
  'Phase 6K-A/B adds maintenance closure audit follow-up response acknowledgement review outcome readiness, an audit response acknowledgement review outcome ledger, safe acknowledgement review outcome language, and a no-outcome/no-contact/no-remediation firewall',
  'Intended acknowledgement review packet reference',
  'Intended acknowledgement packet reference',
  'Intended dispatch checklist reference',
  'Intended response approval reference',
  'Intended response planning reference',
  'Intended audit triage/classification reference',
  'Intended audit follow-up intake reference',
  'Intended audit handoff reference',
  'Intended acknowledgement review outcome owner placeholder',
  'Intended internal reviewer placeholder',
  'Intended approver placeholder',
  'Intended response audience placeholder',
  'Intended recipient list placeholder',
  'Intended response channel placeholder',
  'Intended acknowledgement channel placeholder',
  'Intended acknowledgement timing placeholder',
  'Intended acknowledgement criteria placeholder',
  'Intended delivery confirmation placeholder',
  'Intended recipient confirmation placeholder',
  'Intended acknowledgement evidence placeholder',
  'Intended acknowledgement review evidence placeholder',
  'Intended acknowledgement review outcome category placeholder',
  'Intended acknowledgement review outcome criteria placeholder',
  'Intended acknowledgement review outcome timing placeholder',
  'Intended remediation dependency placeholder',
  'Missing evidence blocker placeholder',
  'Unresolved follow-up blocker placeholder',
  'Dispatch readiness status placeholder',
  'Dispatch decision status placeholder',
  'Delivery status placeholder',
  'Acknowledgement readiness status placeholder',
  'Acknowledgement status placeholder',
  'Acknowledgement review readiness status placeholder',
  'Acknowledgement review decision status placeholder',
  'Acknowledgement review outcome readiness status placeholder',
  'Acknowledgement review outcome status placeholder',
  'Remediation status placeholder',
  'No response option selected',
  'No response drafted',
  'No response approved',
  'No approval decision recorded',
  'No response approval request sent',
  'No dispatch decision recorded',
  'No dispatch channel configured',
  'No recipient list configured',
  'No response dispatched',
  'No response delivered',
  'No delivery confirmation recorded',
  'No acknowledgement request sent',
  'No recipient contacted',
  'No recipient acknowledgement recorded',
  'No acknowledgement review completed',
  'No acknowledgement review decision recorded',
  'No acknowledgement review outcome selected',
  'No acknowledgement review outcome recorded',
  'No response sent',
  'No remediation assigned',
  'No audit finding is received or recorded.',
  'No response dispatch checklist is completed.',
  'No audit response is delivered.',
  'No recipient confirmation is recorded.',
  'No acknowledgement review is completed.',
  'No acknowledgement review decision is recorded.',
  'No acknowledgement review outcome is selected.',
  'No acknowledgement review outcome is recorded.',
  'No customer/support follow-up is sent.',
  'No production readiness claim is made.',
]) includes(docs, required, 'Phase 6K docs');

noMatch(docs, /actual deployment|audit finding was received|audit finding was recorded|audit follow-up record was created|audit finding was classified|audit severity was assigned|triage owner was assigned|triage decision was recorded|response option was selected|audit response was drafted|audit response was approved|approval decision was recorded|response approval request was sent|dispatch decision was recorded|dispatch channel was configured|recipient list was configured|response dispatch checklist was completed|audit response was dispatched|audit response was sent|audit response was delivered|delivery confirmation was recorded|recipient confirmation was recorded|acknowledgement request was sent|recipient acknowledgement was recorded|recipient was contacted|remediation was assigned|remediation task was created|external disclosure was made|audit recipient was contacted|archive was created|archive record was written|retention policy was applied|closure decision was recorded|closure approval was recorded|maintenance was marked complete|production evidence was collected|smoke check was run|provider check was executed|runtime check was executed|customer follow-up was sent|support response was sent|public notice was published|monitoring configured|analytics configured|cron configured|job configured|maintenance was completed|deployment approval granted/i, 'Phase 6K docs');

for (const pattern of [
  /Phase 6K-A\/B admin-only maintenance closure audit follow-up response acknowledgement review outcome readiness/i,
  /MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeReadinessHelper/i,
  /Audit response acknowledgement review outcome ledger/i,
  /Audit response acknowledgement review outcome readiness checklist/i,
  /No-outcome\/no-contact\/no-remediation firewall/i,
  /Safe acknowledgement review outcome language/i,
]) assert(pattern.test(admin), `Phase 6K admin source missing ${pattern}`);
assert(/<MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewReadinessHelper \/>[\s\S]*<MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeReadinessHelper \/>/.test(admin), 'Phase 6K helper must follow Phase 6J audit follow-up response acknowledgement review helper');
includes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');

assert(pkg.scripts?.['validate:maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-readiness'] === 'node scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-readiness.cjs', 'package.json must register Phase 6K validator');
includes(suite, "args: ['run', 'validate:maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-readiness']", 'release candidate suite');
noMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release candidate suite');

const publicSourceRoots = ['website/app/layout.tsx','website/app/page.tsx','website/app/listings','website/app/categories','website/app/catalogue','website/app/events','website/app/quote','website/app/not-found.tsx','website/components/QuoteRequestForm.tsx'];
const publicSource = gitLsFiles(publicSourceRoots)
  .filter((file) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file) && !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(file) && !file.startsWith('website/test/'))
  .map((file) => `${file}\n${read(file)}`).join('\n');
noMatch(publicSource, /maintenance closure audit follow-up|audit response acknowledgement review outcome ledger|audit response dispatch packet ledger|audit response approval packet ledger|audit finding classification ledger|maintenance closure audit handoff|maintenance closure archive|closure archive retention ledger|maintenance closure decision|closure recommendation packet|support follow-up|storage provider|scheduler\/cron|provider setup|environment\/secrets|admin route|release-control|owner handoff|\/admin\//i, 'public source');
noMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering|booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'public source');
noMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i, 'public source');

console.log('Phase 6K maintenance closure audit follow-up response acknowledgement review outcome readiness checks passed. No deployment was performed. No recipient or channel was configured. No audit response was dispatched, delivered, acknowledged, reviewed, accepted, outcome-recorded, or sent. No acknowledgement review decision was recorded. No acknowledgement review outcome was selected or recorded. No acknowledgement request was sent. No remediation was assigned.');
