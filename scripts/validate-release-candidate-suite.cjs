const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

const commandPlan = [
  {
    label: 'Validate deployment execution runbook readiness',
    cwd: repoRoot,
    args: ['run', 'validate:deployment-execution-runbook-readiness'],
  },
  {
    label: 'Validate deployment approval request readiness',
    cwd: repoRoot,
    args: ['run', 'validate:deployment-approval-request-readiness'],
  },
  {
    label: 'Validate owner decision intake readiness',
    cwd: repoRoot,
    args: ['run', 'validate:owner-decision-intake-readiness'],
  },
  {
    label: 'Validate owner re-review request readiness',
    cwd: repoRoot,
    args: ['run', 'validate:owner-re-review-request-readiness'],
  },
  {
    label: 'Validate owner correction workflow readiness',
    cwd: repoRoot,
    args: ['run', 'validate:owner-correction-workflow-readiness'],
  },
  {
    label: 'Validate owner feedback intake readiness',
    cwd: repoRoot,
    args: ['run', 'validate:owner-feedback-intake-readiness'],
  },
  {
    label: 'Validate owner-review walkthrough readiness',
    cwd: repoRoot,
    args: ['run', 'validate:owner-review-walkthrough-readiness'],
  },
  {
    label: 'Validate preview approval package',
    cwd: repoRoot,
    args: ['run', 'validate:preview-approval-package'],
  },
  {
    label: 'Validate preview smoke harness',
    cwd: repoRoot,
    args: ['run', 'validate:preview-smoke-harness'],
  },
  {
    label: 'Validate preview handoff',
    cwd: repoRoot,
    args: ['run', 'validate:preview-handoff'],
  },
  {
    label: 'Validate local release candidate',
    cwd: repoRoot,
    args: ['run', 'validate:local-release-candidate'],
  },
  {
    label: 'Validate public review polish',
    cwd: repoRoot,
    args: ['run', 'validate:public-review-polish'],
  },
  {
    label: 'Validate public journey acceptance',
    cwd: repoRoot,
    args: ['run', 'validate:public-journey-acceptance'],
  },
  {
    label: 'Validate public discovery acceptance',
    cwd: repoRoot,
    args: ['run', 'validate:public-discovery-acceptance'],
  },
  {
    label: 'Validate listing detail readiness',
    cwd: repoRoot,
    args: ['run', 'validate:listing-detail-readiness'],
  },
  {
    label: 'Validate quote intake readiness',
    cwd: repoRoot,
    args: ['run', 'validate:quote-intake-readiness'],
  },
  {
    label: 'Validate quote triage readiness',
    cwd: repoRoot,
    args: ['run', 'validate:quote-triage-readiness'],
  },
  {
    label: 'Validate catalogue content ops readiness',
    cwd: repoRoot,
    args: ['run', 'validate:catalogue-content-ops-readiness'],
  },
  {
    label: 'Validate catalogue write workflow readiness',
    cwd: repoRoot,
    args: ['run', 'validate:catalogue-write-workflow-readiness'],
  },
  {
    label: 'Validate local freeze',
    cwd: repoRoot,
    args: ['run', 'validate:local-freeze'],
  },
  {
    label: 'Validate owner handoff bundle',
    cwd: repoRoot,
    args: ['run', 'validate:owner-handoff-bundle'],
  },
  {
    label: 'Validate owner approval request',
    cwd: repoRoot,
    args: ['run', 'validate:owner-approval-request'],
  },
  {
    label: 'Validate Supabase migrations',
    cwd: repoRoot,
    args: ['run', 'validate:supabase-migrations'],
  },
  {
    label: 'Test Supabase seed fixtures',
    cwd: repoRoot,
    args: ['run', 'test:supabase-seed'],
  },
  {
    label: 'Test Supabase RLS',
    cwd: repoRoot,
    args: ['run', 'test:supabase-rls'],
  },
  {
    label: 'Validate n8n workflow exports',
    cwd: repoRoot,
    args: ['run', 'validate:n8n'],
  },
  {
    label: 'Test n8n validation rules',
    cwd: repoRoot,
    args: ['run', 'test:n8n-validation'],
  },
  {
    label: 'website:test',
    cwd: path.join(repoRoot, 'website'),
    args: ['run', 'test'],
  },
  {
    label: 'website:typecheck',
    cwd: path.join(repoRoot, 'website'),
    args: ['run', 'typecheck'],
  },
  {
    label: 'website:build',
    cwd: path.join(repoRoot, 'website'),
    args: ['run', 'build'],
  },
];

for (const command of commandPlan) {
  console.log(`\n==> ${command.label}`);
  const result = spawnSync('npm', command.args, {
    cwd: command.cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Command failed to start: ${command.label}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Command failed: ${command.label}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\nLocal release-candidate suite passed. No deployment was performed. This does not approve deployment.');
