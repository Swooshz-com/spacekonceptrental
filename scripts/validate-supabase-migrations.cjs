const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const defaultMigrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const migrationFileNamePattern = /^(\d{14})_[a-z0-9][a-z0-9_]*\.sql$/;

// Phase 1F-A approves no destructive migration statements. Future allowlist
// entries must be exact, reviewed, and paired with tests before merge.
const destructiveStatementAllowlist = [];

const contentRules = [
  {
    label: '.env reference',
    regex: /(^|[^A-Za-z0-9_])\.env(?:\.[A-Za-z0-9_-]+)?([^A-Za-z0-9_]|$)/i,
  },
  {
    label: 'NEXT_PUBLIC variable',
    regex: /\bNEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|KEY|N8N|SERVICE_ROLE)[A-Z0-9_]*\b/i,
  },
  {
    label: 'service-role key reference',
    regex: /\b(?:SUPABASE_SERVICE_ROLE_KEY|service_role_key|service-role key|service role key)\b/i,
  },
  {
    label: 'private key',
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  },
  {
    label: 'sk-prefixed secret',
    regex: /\bsk-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    label: 'Google API key',
    regex: /\bAIza[0-9A-Za-z_-]{20,}\b/,
  },
  {
    label: 'Pinecone-looking API key',
    regex: /\bpcsk_[A-Za-z0-9_-]{20,}\b/i,
  },
  {
    label: 'Bearer token',
    regex: /\bBearer\s+[A-Za-z0-9._-]{20,}\b/i,
  },
  {
    label: 'JWT-looking token',
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    label: 'hardcoded webhook URL',
    regex: /https?:\/\/[^\s"'`<>]+\/webhook(?:-test)?\//i,
  },
  {
    label: 'credential-looking assignment',
    regex: /\b(?:password|passwd|secret|token|api[_-]?key|private[_-]?key)\b\s*(?:=|:=|:)\s*['"][^'"]{8,}['"]/i,
  },
  {
    label: 'destructive SQL statement',
    regex: /\bdrop\s+schema\s+public\s+cascade\b/i,
  },
  {
    label: 'destructive SQL statement',
    regex: /\bdrop\s+table\b/i,
  },
  {
    label: 'destructive SQL statement',
    regex: /\btruncate(?:\s+table)?\b/i,
  },
  {
    label: 'destructive SQL statement',
    regex: /\bdelete\s+from\b/i,
  },
  {
    label: 'destructive SQL statement',
    regex: /\balter\s+table\b[\s\S]*?\bdrop\s+column\b/i,
  },
  {
    label: 'destructive SQL statement',
    regex: /\bdrop\s+policy\b/i,
  },
  {
    label: 'destructive SQL statement',
    regex: /\balter\s+table\b[\s\S]*?\bdisable\s+row\s+level\s+security\b/i,
  },
];

function parseArgs(argv) {
  const migrationsDirArg = argv.find((arg) => !arg.startsWith('--'));
  return {
    migrationsDir: migrationsDirArg
      ? path.resolve(migrationsDirArg)
      : defaultMigrationsDir,
  };
}

function isValidTimestamp(timestamp) {
  const year = Number(timestamp.slice(0, 4));
  const month = Number(timestamp.slice(4, 6));
  const day = Number(timestamp.slice(6, 8));
  const hour = Number(timestamp.slice(8, 10));
  const minute = Number(timestamp.slice(10, 12));
  const second = Number(timestamp.slice(12, 14));
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  );
}

function listSqlFiles(migrationsDir) {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();
}

function lineNumberForOffset(content, offset) {
  return content.slice(0, offset).split(/\r?\n/).length;
}

function isAllowlistedDestructiveStatement(fileName, label, matchText) {
  return destructiveStatementAllowlist.some(
    (entry) =>
      entry.fileName === fileName &&
      entry.label === label &&
      entry.statement === matchText,
  );
}

function validateFileName(fileName, violations) {
  const match = fileName.match(migrationFileNamePattern);

  if (!match) {
    violations.push(
      `${fileName}: migration SQL files must use a timestamped filename like YYYYMMDDHHMMSS_description.sql.`,
    );
    return;
  }

  if (!isValidTimestamp(match[1])) {
    violations.push(`${fileName}: migration timestamp is not a valid UTC date/time.`);
  }
}

function validateFileContent(migrationsDir, fileName, violations) {
  const filePath = path.join(migrationsDir, fileName);
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

  for (const rule of contentRules) {
    rule.regex.lastIndex = 0;
    const match = rule.regex.exec(content);

    if (!match) {
      continue;
    }

    const matchText = match[0];

    if (
      rule.label === 'destructive SQL statement' &&
      isAllowlistedDestructiveStatement(fileName, rule.label, matchText)
    ) {
      continue;
    }

    const line = lineNumberForOffset(content, match.index);
    violations.push(`${fileName}:${line}: ${rule.label} is not allowed in Supabase migrations.`);
  }
}

function validateMigrations(migrationsDir) {
  const violations = [];

  if (!fs.existsSync(migrationsDir)) {
    violations.push(`Supabase migrations directory does not exist: ${migrationsDir}`);
    return { files: [], violations };
  }

  if (!fs.statSync(migrationsDir).isDirectory()) {
    violations.push(`Supabase migrations path is not a directory: ${migrationsDir}`);
    return { files: [], violations };
  }

  const files = listSqlFiles(migrationsDir);

  for (const fileName of files) {
    validateFileName(fileName, violations);
    validateFileContent(migrationsDir, fileName, violations);
  }

  return { files, violations };
}

function main() {
  const { migrationsDir } = parseArgs(process.argv.slice(2));
  const { files, violations } = validateMigrations(migrationsDir);

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`ERROR: ${violation}`);
    }
    console.error(
      `Summary: checked ${files.length} migration SQL file(s), errors ${violations.length}, result FAIL.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Summary: checked ${files.length} migration SQL file(s), errors 0, result PASS.`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  validateMigrations,
};
