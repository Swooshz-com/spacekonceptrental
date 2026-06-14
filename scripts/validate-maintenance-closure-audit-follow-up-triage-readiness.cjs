const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const includes = (source, needle, label) => assert(source.includes(needle), `${label} missing ${needle}`);
const noMatch = (source, pattern, label) => assert(!pattern.test(source), `${label} contains forbidden ${pattern}`);

const triageReadiness = 'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-TRIAGE-READINESS.md';
const classificationLedger = 'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FINDING-CLASSIFICATION-LEDGER-TEMPLATE.md';
for (const requiredPath of [triageReadiness, classificationLedger]) {
  assert(fs.existsSync(path.join(repoRoot, requiredPath)), `Phase 6E doc missing ${requiredPath}`);
}

const docs = `${read(triageReadiness)}\n${read(classificationLedger)}`;
for (const required of [
  'Phase 6E-A/B adds maintenance closure audit follow-up triage readiness, an audit finding classification ledger template, safe triage language, and a no-triage/no-remediation firewall',
  'Intended audit follow-up intake reference',
  'Intended audit handoff reference',
  'Intended archive/retention packet reference',
  'Intended triage owner placeholder',
  'Intended internal reviewer',
  'Intended finding category placeholder',
  'Intended severity placeholder',
  'Intended response path placeholder',
  'Missing evidence blocker placeholder',
  'Unresolved follow-up blocker placeholder',
  'Triage status placeholder',
  'Remediation status placeholder',
  'No real finding classified',
  'No severity assigned',
  'No triage owner assigned',
  'No remediation assigned',
  'No audit finding is received or recorded.',
  'No audit follow-up record is created.',
  'No audit finding is classified.',
  'No audit severity is assigned.',
  'No triage owner is assigned.',
  'No triage decision is recorded.',
  'No audit response is sent.',
  'No remediation is assigned.',
  'No external disclosure is made.',
  'No audit recipient is contacted.',
  'No archive is created.',
  'No archive record is written.',
  'No retention policy is applied.',
  'No closure decision is recorded.',
  'No closure approval is recorded.',
  'No maintenance is marked complete.',
  'No production evidence is collected.',
  'No smoke check is run.',
  'No provider/runtime check is executed.',
  'No customer/support follow-up is sent.',
  'No production readiness claim is made.',
  '[NOT EVIDENCE / NOT RECORDED]',
  '[DEPLOYMENT APPROVAL: NOT GRANTED]',
]) includes(docs, required, 'Phase 6E docs');

noMatch(docs, /actual deployment|audit finding was received|audit finding was recorded|audit follow-up record was created|audit response was sent|remediation was assigned|audit handoff was created|audit packet was sent|audit recipient was contacted|external disclosure was made|archive was created|archive record was written|retention policy was applied|closure decision was recorded|closure approval was recorded|maintenance was marked complete|production evidence was collected|smoke check was run|provider check was executed|runtime check was executed|support response was sent|customer follow-up was sent|public notice was published|monitoring configured|analytics configured|cron configured|job configured|maintenance was completed|deployment approval granted/i, 'Phase 6E docs');

const admin = read('website/app/admin/protected-admin-shell.tsx');
for (const pattern of [
  /Phase 6E-A\/B admin-only maintenance closure audit follow-up triage readiness/i,
  /MaintenanceClosureAuditFollowUpTriageReadinessHelper/i,
  /LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-TRIAGE-READINESS\.md/i,
  /LOCAL-MAINTENANCE-CLOSURE-AUDIT-FINDING-CLASSIFICATION-LEDGER-TEMPLATE\.md/i,
  /Audit finding classification ledger/i,
  /Audit follow-up triage readiness checklist/i,
  /No-triage\/no-remediation firewall/i,
  /No audit finding is received or recorded here/i,
  /No audit follow-up record is created here/i,
  /No audit finding is classified here/i,
  /No audit severity is assigned here/i,
  /No triage owner is assigned here/i,
  /No triage decision is recorded here/i,
  /No audit response is sent here/i,
  /No remediation is assigned here/i,
]) assert(pattern.test(admin), `Phase 6E admin source missing ${pattern}`);
assert(/function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(admin), 'AdminOperationsHome must render shared owner readiness helper panel');
assert(/<MaintenanceClosureAuditFollowUpIntakeReadinessHelper \/>[\s\S]*<MaintenanceClosureAuditFollowUpTriageReadinessHelper \/>/.test(admin), 'Phase 6E helper must follow Phase 6D audit follow-up intake helper');
includes(read('website/app/admin/page.tsx'), 'view={{ kind: "home" }}', 'admin home');

const pkg = JSON.parse(read('package.json'));
assert(pkg.scripts?.['validate:maintenance-closure-audit-follow-up-triage-readiness'] === 'node scripts/validate-maintenance-closure-audit-follow-up-triage-readiness.cjs', 'package.json must register Phase 6E validator');
const suite = read('scripts/validate-release-candidate-suite.cjs');
includes(suite, "args: ['run', 'validate:maintenance-closure-audit-follow-up-triage-readiness']", 'release suite');
includes(suite, "args: ['run', 'validate:maintenance-closure-audit-follow-up-intake-readiness']", 'release suite');
noMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release suite');

const publicRoots = ['website/app/layout.tsx','website/app/page.tsx','website/app/listings','website/app/categories','website/app/catalogue','website/app/events','website/app/quote','website/app/not-found.tsx','website/components/QuoteRequestForm.tsx'];
const tracked = spawnSync('git', ['ls-files', '--', ...publicRoots], { cwd: repoRoot, encoding: 'utf8' });
assert(tracked.status === 0, tracked.stderr || 'git ls-files failed');
const publicSource = tracked.stdout.split(/\r?\n/).filter(Boolean).filter((p) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(p) && !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(p)).map((p) => `${p}\n${read(p)}`).join('\n');
noMatch(publicSource, /maintenance closure audit follow-up triage|audit finding classification ledger|maintenance closure audit follow-up|maintenance closure audit handoff|audit handoff packet routing ledger|maintenance closure archive|closure archive retention ledger|maintenance closure decision|closure recommendation packet|support follow-up|storage provider|scheduler\/cron|provider setup|environment\/secrets|admin route|release-control|owner handoff|\/admin\//i, 'public source');
assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
noMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'public source');
noMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'public source');
noMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'public source');
noMatch(admin, /public upload|customer upload|monitoring provider setup|analytics provider setup|alerting provider setup|scheduler setup|cron setup|process\.env|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|real audit finding|real audit response|real remediation assignment/i, 'admin source');

console.log('Phase 6E maintenance closure audit follow-up triage readiness checks passed. No deployment was performed. No audit finding was received or recorded. No audit finding was classified. No severity was assigned. No triage owner was assigned. No audit response was sent. No remediation was assigned.');
