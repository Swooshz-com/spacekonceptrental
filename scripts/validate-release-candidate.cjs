const { spawnSync } = require('node:child_process');

const dockerCommand = process.platform === 'win32' ? 'docker.exe' : 'docker';

const releaseGateCommands = [
  {
    label: 'website tests',
    shellCommand: 'npm --prefix website test',
  },
  {
    label: 'website typecheck',
    shellCommand: 'npm --prefix website run typecheck',
  },
  {
    label: 'website build',
    shellCommand: 'npm --prefix website run build',
  },
  {
    label: 'Supabase migration validation',
    shellCommand: 'npm run validate:supabase-migrations',
  },
  {
    label: 'Supabase migration tests',
    shellCommand: 'npm run test:supabase-migrations',
  },
  {
    label: 'Supabase RLS/schema tests',
    shellCommand: 'npm run test:supabase-rls',
    requiresDocker: true,
  },
  {
    label: 'diff hygiene',
    shellCommand: 'git diff --check',
  },
];

function assertDockerAvailable() {
  const result = spawnSync(`${dockerCommand} --version`, [], {
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error || result.status !== 0) {
    const details = result.error?.message || result.stderr.trim();
    console.error(
      [
        'Docker is required for npm run test:supabase-rls.',
        'Start Docker Desktop or provide a working Docker daemon before running the release-candidate gate.',
        details,
      ]
        .filter(Boolean)
        .join('\n'),
    );
    process.exit(1);
  }
}

function run(commandSpec) {
  if (commandSpec.requiresDocker) {
    assertDockerAvailable();
  }

  console.log(`\n> ${commandSpec.shellCommand}`);
  const result = spawnSync(commandSpec.shellCommand, [], {
    shell: true,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Failed to start ${commandSpec.label}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${commandSpec.label} failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

for (const commandSpec of releaseGateCommands) {
  run(commandSpec);
}

console.log('\nRelease-candidate validation passed.');
