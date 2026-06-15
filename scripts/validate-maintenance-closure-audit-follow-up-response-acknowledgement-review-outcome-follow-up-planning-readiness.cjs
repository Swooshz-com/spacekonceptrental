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
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-LEDGER-TEMPLATE.md',
];
const trackerPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
];
const phase6lHeading = '## Phase 6L-A/B Maintenance Closure Audit Follow-Up Response Acknowledgement Review Outcome Follow-Up Planning Readiness References';
const previousPhaseLine = 'Previous current phase: Phase 6L-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning readiness, audit response acknowledgement review outcome follow-up planning ledger, and no-follow-up-action/no-contact/no-remediation firewall.';
const readinessOnlyBody = 'Phase 6L-A/B kept the repo readiness-only for owner/admin review of a future theoretical acknowledgement review outcome follow-up planning packet after Phase 6K-A/B acknowledgement review outcome readiness.';
const trackerRequired = [
  phase6lHeading,
  previousPhaseLine,
  readinessOnlyBody,
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-READINESS.md',
  'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-ACKNOWLEDGEMENT-REVIEW-OUTCOME-FOLLOW-UP-PLANNING-LEDGER-TEMPLATE.md',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-readiness.cjs',
  'protected admin maintenance closure audit follow-up response acknowledgement review outcome follow-up planning readiness helper coverage',
];

for (const requiredPath of docsPaths) assert(fs.existsSync(path.join(repoRoot, requiredPath)), `Phase 6L doc missing ${requiredPath}`);
for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  for (const required of trackerRequired) includes(tracker, required, `${trackerPath} Phase 6L tracker section`);
  const headingIndex = tracker.indexOf(phase6lHeading);
  const nextHeadingIndex = tracker.indexOf('\n## ', headingIndex + phase6lHeading.length);
  const section = tracker.slice(headingIndex, nextHeadingIndex === -1 ? tracker.length : nextHeadingIndex);
  noMatch(section, /(^|\n)Current phase: Phase 6[MLKJI]-A\/B|Phase 6L-A\/B keeps the repo readiness-only for owner\/admin review of a future theoretical acknowledgement review outcome follow-up planning packet|Phase 6K-A\/B keeps the repo readiness-only|Phase 6J-A\/B keeps the repo readiness-only|Phase 6I-A\/B keeps the repo readiness-only|no-outcome\/no-contact\/no-remediation firewall|no-review-decision\/no-contact\/no-remediation firewall|no-acknowledgement\/no-contact\/no-remediation firewall/i, `${trackerPath} Phase 6L historical tracker coverage`);
}

const docs = docsPaths.map(read).join('\n');
const admin = read('website/app/admin/protected-admin-shell.tsx');
const adminPage = read('website/app/admin/page.tsx');
const pkg = JSON.parse(read('package.json'));
const suite = read('scripts/validate-release-candidate-suite.cjs');

for (const required of [
  'Phase 6L-A/B',
  'Audit response acknowledgement review outcome follow-up planning ledger',
  'Audit response acknowledgement review outcome follow-up planning checklist',
  'No-follow-up-action/no-contact/no-remediation firewall',
  'Safe outcome follow-up planning language',
  'Intended acknowledgement review outcome packet reference',
  'Intended acknowledgement review packet reference',
  'Intended acknowledgement packet reference',
  'Intended dispatch checklist reference',
  'Intended response approval reference',
  'Intended response planning reference',
  'Intended audit triage/classification reference',
  'Intended audit follow-up intake reference',
  'Intended audit handoff reference',
  'Intended outcome follow-up planning owner placeholder',
  'Intended internal reviewer placeholder',
  'Intended approver placeholder',
  'Intended outcome category placeholder',
  'Intended outcome follow-up criteria placeholder',
  'Intended follow-up action category placeholder',
  'Intended follow-up owner placeholder',
  'Intended remediation dependency placeholder',
  'Intended evidence dependency placeholder',
  'Intended archive/retention dependency placeholder',
  'Missing evidence blocker placeholder',
  'Unresolved outcome blocker placeholder',
  'Unresolved follow-up blocker placeholder',
  'Acknowledgement review outcome readiness status placeholder',
  'Acknowledgement review outcome status placeholder',
  'Outcome follow-up planning readiness status placeholder',
  'Outcome follow-up action status placeholder',
  'Remediation status placeholder',
  'No acknowledgement review outcome selected',
  'No acknowledgement review outcome recorded',
  'No outcome follow-up action selected',
  'No outcome follow-up action recorded',
  'No follow-up owner assigned',
  'No remediation assigned',
  'No recipient contacted',
  'No response sent',
  'No closure decision recorded',
  'No archive created',
  'No retention policy applied',
]) includes(docs, required, 'Phase 6L docs');

noMatch(docs, /actual deployment|acknowledgement review outcome was selected|acknowledgement review outcome was recorded|outcome follow-up action was selected|outcome follow-up action was recorded|follow-up owner was assigned|recipient was contacted|remediation was assigned|remediation task was created|closure decision was recorded|archive was created|retention policy was applied|production evidence was recorded|customer follow-up was sent|support response was sent|outbound messaging was sent|public notice was published|monitoring configured|analytics configured|cron configured|job configured|deployment approval granted/i, 'Phase 6L docs');
for (const pattern of [
  /Phase 6L-A\/B admin-only maintenance closure audit follow-up response acknowledgement review outcome follow-up planning readiness/i,
  /MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReadinessHelper/i,
  /Audit response acknowledgement review outcome follow-up planning ledger/i,
  /Audit response acknowledgement review outcome follow-up planning checklist/i,
  /No-follow-up-action\/no-contact\/no-remediation firewall/i,
  /Safe outcome follow-up planning language/i,
]) assert(pattern.test(admin), `Phase 6L admin source missing ${pattern}`);
assert(/<MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeReadinessHelper \/>[\s\S]*<MaintenanceClosureAuditFollowUpResponseAcknowledgementReviewOutcomeFollowUpPlanningReadinessHelper \/>/.test(admin), 'Phase 6L helper must follow Phase 6K acknowledgement review outcome helper');
includes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
assert(pkg.scripts?.['validate:maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-readiness'] === 'node scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-readiness.cjs', 'package.json must register Phase 6L validator');
includes(suite, "args: ['run', 'validate:maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-readiness']", 'release candidate suite');
includes(suite, "args: ['run', 'validate:maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-readiness']", 'release candidate suite previous validator');
noMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release candidate suite');

const publicSource = gitLsFiles(['website/app/layout.tsx','website/app/page.tsx','website/app/listings','website/app/categories','website/app/catalogue','website/app/events','website/app/quote','website/app/not-found.tsx','website/components/QuoteRequestForm.tsx'])
  .filter((file) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file) && !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(file) && !file.startsWith('website/test/'))
  .map((file) => `${file}\n${read(file)}`).join('\n');
noMatch(publicSource, /maintenance closure audit follow-up|audit response acknowledgement review outcome follow-up planning|audit response acknowledgement review outcome ledger|maintenance closure audit handoff|support follow-up|storage provider|scheduler\/cron|provider setup|environment\/secrets|admin route|release-control|owner handoff|\/admin\//i, 'public source');
noMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering|booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'public source');
noMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i, 'public source');
console.log('Phase 6L maintenance closure audit follow-up response acknowledgement review outcome follow-up planning readiness checks passed. No acknowledgement review outcome was selected or recorded. No outcome follow-up action was selected or recorded. No follow-up owner, recipient contact, remediation, closure, archive, retention, runtime, provider, env, scheduler, chat, RAG, support/customer follow-up, outbound messaging, or public behavior change was added.');
