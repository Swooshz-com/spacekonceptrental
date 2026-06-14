const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const includes = (source, needle, label) => assert(source.includes(needle), `${label} missing ${needle}`);
const noMatch = (source, pattern, label) => assert(!pattern.test(source), `${label} contains forbidden ${pattern}`);

const responseDispatchReadiness = 'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-DISPATCH-READINESS.md';
const responseDispatchPacketLedger = 'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-DISPATCH-PACKET-LEDGER-TEMPLATE.md';
for (const requiredPath of [responseDispatchReadiness, responseDispatchPacketLedger]) {
  assert(fs.existsSync(path.join(repoRoot, requiredPath)), `Phase 6H doc missing ${requiredPath}`);
}

const docs = `${read(responseDispatchReadiness)}\n${read(responseDispatchPacketLedger)}`;
for (const required of [
  'Phase 6H-A/B adds maintenance closure audit follow-up response dispatch readiness, an audit response dispatch checklist ledger, an audit response dispatch packet ledger template, safe response dispatch language, and a no-dispatch/no-send/no-remediation firewall',
  'Intended response approval reference',
  'Intended response planning reference',
  'Intended audit triage/classification reference',
  'Intended audit follow-up intake reference',
  'Intended audit handoff reference',
  'Intended response dispatch owner placeholder',
  'Intended internal reviewer placeholder',
  'Intended dispatch reviewer placeholder',
  'Intended approver placeholder',
  'Intended response audience placeholder',
  'Intended recipient list placeholder',
  'Intended response channel placeholder',
  'Intended response option placeholder',
  'Intended dispatch timing placeholder',
  'Intended dispatch criteria placeholder',
  'Intended approval dependency placeholder',
  'Intended remediation dependency placeholder',
  'Missing evidence blocker placeholder',
  'Unresolved follow-up blocker placeholder',
  'Response approval status placeholder',
  'Dispatch decision status placeholder',
  'Dispatch readiness status placeholder',
  'Dispatch status placeholder',
  'Remediation status placeholder',
  'No recipient configured',
  'No channel configured',
  'No dispatch channel configured',
  'No recipient list configured',
  'No response option selected',
  'No response drafted',
  'No response approved',
  'No approval decision recorded',
  'No response approval request sent',
  'No dispatch decision recorded',
  'No response dispatch checklist completed',
  'No recipient contacted',
  'No response dispatched',
  'No response sent',
  'No remediation assigned',
  'No audit finding is received or recorded.',
  'No audit follow-up record is created.',
  'No audit finding is classified.',
  'No audit severity is assigned.',
  'No triage owner is assigned.',
  'No triage decision is recorded.',
  'No recipient is configured.',
  'No channel is configured.',
  'No dispatch channel is configured.',
  'No recipient list is configured.',
  'No response option is selected.',
  'No audit response is drafted.',
  'No audit response is approved.',
  'No approval decision is recorded.',
  'No response approval request is sent.',
  'No dispatch decision is recorded.',
  'No response dispatch checklist is completed.',
  'No audit response is dispatched.',
  'No audit response is sent.',
  'No remediation task is created.',
  'No external disclosure is made.',
  'No audit recipient is contacted.',
  'No recipient is contacted.',
  'No production evidence is collected.',
  'No smoke check is run.',
  'No provider/runtime check is executed.',
  'No customer/support follow-up is sent.',
  'No production readiness claim is made.',
  '[NOT EVIDENCE / NOT RECORDED]',
  '[DEPLOYMENT APPROVAL: NOT GRANTED]',
]) includes(docs, required, 'Phase 6H docs');

noMatch(docs, /actual deployment|audit finding was received|audit finding was recorded|audit follow-up record was created|audit finding was classified|audit severity was assigned|triage owner was assigned|triage decision was recorded|recipient was configured|recipient list was configured|channel was configured|dispatch channel was configured|response option was selected|audit response was drafted|audit response was approved|approval decision was recorded|response approval request was sent|dispatch decision was recorded|response dispatch checklist was completed|recipient was contacted|audit response was dispatched|audit response was sent|remediation was assigned|remediation task was created|external disclosure was made|audit recipient was contacted|archive was created|archive record was written|retention policy was applied|closure decision was recorded|closure approval was recorded|maintenance was marked complete|production evidence was collected|smoke check was run|provider check was executed|runtime check was executed|customer follow-up was sent|support response was sent|public notice was published|monitoring configured|analytics configured|cron configured|job configured|maintenance was completed|deployment approval granted/i, 'Phase 6H docs');

const admin = read('website/app/admin/protected-admin-shell.tsx');
for (const pattern of [
  /Phase 6H-A\/B admin-only maintenance closure audit follow-up response dispatch readiness/i,
  /MaintenanceClosureAuditFollowUpResponseDispatchReadinessHelper/i,
  /LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-RESPONSE-DISPATCH-READINESS\.md/i,
  /LOCAL-MAINTENANCE-CLOSURE-AUDIT-RESPONSE-DISPATCH-PACKET-LEDGER-TEMPLATE\.md/i,
  /Audit response dispatch checklist ledger/i,
  /Audit response dispatch packet ledger/i,
  /Audit response dispatch readiness checklist/i,
  /No-dispatch\/no-send\/no-remediation firewall/i,
  /Safe response dispatch language/i,
]) assert(pattern.test(admin), `Phase 6H admin source missing ${pattern}`);
assert(/<MaintenanceClosureAuditFollowUpResponseApprovalReadinessHelper \/>[\s\S]*<MaintenanceClosureAuditFollowUpResponseDispatchReadinessHelper \/>/.test(admin), 'Phase 6H helper must follow Phase 6G audit follow-up response approval helper');
includes(read('website/app/admin/page.tsx'), 'view={{ kind: "home" }}', 'admin page');

const pkg = JSON.parse(read('package.json'));
assert(pkg.scripts?.['validate:maintenance-closure-audit-follow-up-response-dispatch-readiness'] === 'node scripts/validate-maintenance-closure-audit-follow-up-response-dispatch-readiness.cjs', 'package.json must register Phase 6H validator');
const suite = read('scripts/validate-release-candidate-suite.cjs');
includes(suite, "args: ['run', 'validate:maintenance-closure-audit-follow-up-response-dispatch-readiness']", 'release suite');
includes(suite, "args: ['run', 'validate:maintenance-closure-audit-follow-up-response-approval-readiness']", 'release suite');
noMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release suite');

const publicRoots = ['website/app/layout.tsx','website/app/page.tsx','website/app/listings','website/app/categories','website/app/catalogue','website/app/events','website/app/quote','website/app/not-found.tsx','website/components/QuoteRequestForm.tsx'];
const tracked = spawnSync('git', ['ls-files', '--', ...publicRoots], { cwd: repoRoot, encoding: 'utf8' });
assert(tracked.status === 0, tracked.stderr || 'git ls-files failed');
const publicSource = tracked.stdout.split(/\r?\n/).filter(Boolean).filter((p) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(p) && !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(p)).map((p) => `${p}\n${read(p)}`).join('\n');
noMatch(publicSource, /maintenance closure audit follow-up|audit response dispatch packet ledger|audit response approval packet ledger|audit finding classification ledger|maintenance closure audit handoff|maintenance closure archive|closure archive retention ledger|maintenance closure decision|closure recommendation packet|support follow-up|storage provider|scheduler\/cron|provider setup|environment\/secrets|admin route|release-control|owner handoff|\/admin\//i, 'public source');
assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
noMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'public source');
noMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'public source');
noMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'public source');
noMatch(admin, /public upload|customer upload|monitoring provider setup|analytics provider setup|alerting provider setup|scheduler setup|cron setup|process\.env|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|real audit finding|real audit response|real remediation assignment/i, 'admin source');

console.log('Phase 6H maintenance closure audit follow-up response dispatch readiness checks passed. No deployment was performed. No recipient or channel was configured. No response option was selected. No audit response was drafted, approved, dispatched, or sent. No dispatch decision was recorded. No remediation was assigned.');
