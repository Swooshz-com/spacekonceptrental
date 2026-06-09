const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function commandExists(command) {
  const result = spawnSync(command, ['--version'], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'ignore',
  });

  return !result.error && result.status === 0;
}

const dockerAvailable = commandExists('docker');


const commandPlan = [
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
    label: 'Validate Supabase migrations',
    cwd: repoRoot,
    args: ['run', 'validate:supabase-migrations'],
  },
  {
    label: 'Test Supabase seed fixtures',
    cwd: repoRoot,
    args: ['run', 'test:supabase-seed'],
    requiresDocker: true,
  },
  {
    label: 'Test Supabase RLS',
    cwd: repoRoot,
    args: ['run', 'test:supabase-rls'],
    requiresDocker: true,
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

const skippedCommands = [];

for (const command of commandPlan) {
  console.log(`\n==> ${command.label}`);

  if (command.requiresDocker && !dockerAvailable) {
    const message = `${command.label} skipped because Docker is unavailable in this environment.`;
    console.log(`WARNING: ${message}`);
    skippedCommands.push(message);
    continue;
  }

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

if (skippedCommands.length > 0) {
  console.log('\nLocal release-candidate suite completed with environment limitations:');
  for (const message of skippedCommands) {
    console.log(`- ${message}`);
  }
  console.log('Run the skipped Docker-dependent commands in an environment with Docker before treating those checks as verified.');
}

console.log('\nLocal release-candidate suite passed. No deployment was performed. This does not approve deployment.');
