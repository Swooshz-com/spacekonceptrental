const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const includes = (source, needle, label) => assert(source.includes(needle), `${label} missing ${needle}`);
const noMatch = (source, pattern, label) => assert(!pattern.test(source), `${label} contains forbidden ${pattern}`);

const auditReadiness = 'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-READINESS.md';
const auditLedger = 'docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-ROUTING-LEDGER-TEMPLATE.md';
for (const requiredPath of [auditReadiness, auditLedger]) {
  assert(fs.existsSync(path.join(repoRoot, requiredPath)), `Phase 6C doc missing ${requiredPath}`);
}

const docs = `${read(auditReadiness)}\n${read(auditLedger)}`;
for (const required of [
  'Phase 6C-A/B adds maintenance closure audit handoff readiness, an audit handoff packet routing ledger template, safe handoff language, and a no-handoff/no-external-disclosure firewall',
  'Intended archive/retention packet reference',
  'Intended closure decision readiness reference',
  'Intended audit handoff owner',
  'Intended internal reviewer',
  'Intended recipient placeholder',
  'Intended disclosure scope placeholder',
  'Missing evidence blocker placeholder',
  'Unresolved follow-up blocker placeholder',
  'External-disclosure status placeholder',
  'Handoff status placeholder',
  'No real handoff',
  'No external disclosure',
  'No audit packet sent',
  'No audit handoff is created.',
  'No audit packet is sent.',
  'No audit recipient is contacted.',
  'No external disclosure is made.',
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
]) includes(docs, required, 'Phase 6C docs');

noMatch(docs, /actual deployment|audit handoff was created|audit packet was sent|audit recipient was contacted|external disclosure was made|archive was created|archive record was written|retention policy was applied|closure decision was recorded|closure approval was recorded|maintenance was marked complete|production evidence was collected|smoke check was run|provider check was executed|runtime check was executed|support response was sent|customer follow-up was sent|public notice was published|monitoring configured|analytics configured|cron configured|job configured|maintenance was completed|deployment approval granted/i, 'Phase 6C docs');

const admin = read('website/app/admin/protected-admin-shell.tsx');
for (const pattern of [
  /Phase 6C-A\/B admin-only maintenance closure audit handoff readiness/i,
  /MaintenanceClosureAuditHandoffReadinessHelper/i,
  /LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-READINESS\.md/i,
  /LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-ROUTING-LEDGER-TEMPLATE\.md/i,
  /Audit handoff packet routing ledger/i,
  /Audit handoff readiness checklist/i,
  /No-handoff\/no-external-disclosure firewall/i,
  /No audit handoff is created here/i,
  /No audit packet is sent here/i,
  /No audit recipient is contacted here/i,
  /No external disclosure is made here/i,
]) assert(pattern.test(admin), `Phase 6C admin source missing ${pattern}`);
assert(/function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(admin), 'AdminOperationsHome must render shared owner readiness helper panel');
assert(/<MaintenanceClosureArchiveReadinessHelper \/>[\s\S]*<MaintenanceClosureAuditHandoffReadinessHelper \/>/.test(admin), 'Phase 6C helper must follow Phase 6B archive helper');
includes(read('website/app/admin/page.tsx'), 'view={{ kind: "home" }}', 'admin home');

const pkg = JSON.parse(read('package.json'));
assert(pkg.scripts?.['validate:maintenance-closure-audit-handoff-readiness'] === 'node scripts/validate-maintenance-closure-audit-handoff-readiness.cjs', 'package.json must register Phase 6C validator');
const suite = read('scripts/validate-release-candidate-suite.cjs');
includes(suite, "args: ['run', 'validate:maintenance-closure-audit-handoff-readiness']", 'release suite');
includes(suite, "args: ['run', 'validate:maintenance-closure-archive-readiness']", 'release suite');
noMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release suite');

const publicRoots = ['website/app/layout.tsx','website/app/page.tsx','website/app/listings','website/app/categories','website/app/catalogue','website/app/events','website/app/quote','website/app/not-found.tsx','website/components/QuoteRequestForm.tsx'];
const tracked = spawnSync('git', ['ls-files', '--', ...publicRoots], { cwd: repoRoot, encoding: 'utf8' });
assert(tracked.status === 0, tracked.stderr || 'git ls-files failed');
const publicSource = tracked.stdout.split(/\r?\n/).filter(Boolean).filter((p) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(p) && !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(p)).map((p) => `${p}\n${read(p)}`).join('\n');
noMatch(publicSource, /maintenance closure audit handoff|audit handoff packet routing ledger|maintenance closure archive|closure archive retention ledger|maintenance closure decision|closure recommendation packet|support follow-up|storage provider|scheduler\/cron|provider setup|environment\/secrets|admin route|release-control|owner handoff|\/admin\//i, 'public source');
assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
noMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'public source');
noMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'public source');
noMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'public source');
noMatch(admin, /public upload|customer upload|monitoring provider setup|analytics provider setup|alerting provider setup|scheduler setup|cron setup|process\.env|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|real audit handoff|real external disclosure/i, 'admin source');

console.log('Phase 6C maintenance closure audit handoff readiness checks passed. No deployment was performed. No audit handoff was created. No audit packet was sent. No audit recipient was contacted. No external disclosure was made.');
