const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const defaultMigrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const migrationFileNamePattern = /^(\d{14})_[a-z0-9][a-z0-9_]*\.sql$/;

// Phase 1F-A approves no destructive migration statements. Future allowlist
// entries must be exact, reviewed, and paired with tests before merge.
const destructiveStatementAllowlist = [
  // The setup-recipe admin RPC performs these two bounded transactional row
  // removals. They are runtime function bodies, not migration-time data
  // deletion, and are covered by the local RPC atomicity tests.
  {
    fileName: '20260730100000_setup_recipe_database_authority.sql',
    label: 'destructive SQL statement',
    statementClass: 'DELETE',
    statement: 'delete from public.setup_recipes',
  },
  {
    fileName: '20260730100000_setup_recipe_database_authority.sql',
    label: 'destructive SQL statement',
    statementClass: 'DELETE',
    statement: 'delete from public.setup_recipe_items',
  },
];

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
];

const destructiveStatementRules = [
  {
    statementClass: 'DROP SCHEMA',
    regex: /\bdrop\s+schema\s+public\s+cascade\b/gi,
  },
  {
    statementClass: 'DROP TABLE',
    regex: /\bdrop\s+table\b/gi,
  },
  {
    statementClass: 'TRUNCATE',
    regex: /\btruncate(?:\s+table)?\b/gi,
  },
  {
    statementClass: 'DELETE',
    regex: /\bdelete\s+from\s+[a-z0-9_.]+/gi,
  },
  {
    statementClass: 'ALTER TABLE DROP COLUMN',
    regex: /\balter\s+table\b[^;]*?\bdrop\s+column\b/gi,
  },
  {
    statementClass: 'DROP POLICY',
    regex: /\bdrop\s+policy\b/gi,
  },
  {
    statementClass: 'ALTER TABLE DISABLE RLS',
    regex: /\balter\s+table\b[^;]*?\bdisable\s+row\s+level\s+security\b/gi,
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

function normalizeSqlFragment(fragment) {
  return fragment.replace(/\s+/g, ' ').trim().toLowerCase();
}

function blankSqlRange(characters, start, end) {
  for (let index = start; index < end; index += 1) {
    if (characters[index] !== '\r' && characters[index] !== '\n') {
      characters[index] = ' ';
    }
  }
}

function maskSqlCommentsAndStringLiterals(content) {
  const characters = content.split('');
  let index = 0;
  let executableDollarTag = null;

  while (index < content.length) {
    if (executableDollarTag && content.startsWith(executableDollarTag, index)) {
      blankSqlRange(characters, index, index + executableDollarTag.length);
      index += executableDollarTag.length;
      executableDollarTag = null;
      continue;
    }

    if (content.startsWith('--', index)) {
      const lineEnd = content.indexOf('\n', index + 2);
      const end = lineEnd === -1 ? content.length : lineEnd;
      blankSqlRange(characters, index, end);
      index = end;
      continue;
    }

    if (content.startsWith('/*', index)) {
      let depth = 1;
      let cursor = index + 2;

      while (cursor < content.length && depth > 0) {
        if (content.startsWith('/*', cursor)) {
          depth += 1;
          cursor += 2;
        } else if (content.startsWith('*/', cursor)) {
          depth -= 1;
          cursor += 2;
        } else {
          cursor += 1;
        }
      }

      blankSqlRange(characters, index, cursor);
      index = cursor;
      continue;
    }

    if (content[index] === "'") {
      let cursor = index + 1;

      while (cursor < content.length) {
        if (content[cursor] === '\\') {
          cursor += 2;
          continue;
        }
        if (content[cursor] === "'" && content[cursor + 1] === "'") {
          cursor += 2;
          continue;
        }
        if (content[cursor] === "'") {
          cursor += 1;
          break;
        }
        cursor += 1;
      }

      blankSqlRange(characters, index, cursor);
      index = cursor;
      continue;
    }

    if (content[index] === '"') {
      let cursor = index + 1;

      while (cursor < content.length) {
        if (content[cursor] === '"' && content[cursor + 1] === '"') {
          cursor += 2;
          continue;
        }
        if (content[cursor] === '"') {
          cursor += 1;
          break;
        }
        cursor += 1;
      }

      blankSqlRange(characters, index, cursor);
      index = cursor;
      continue;
    }

    const dollarTagMatch = content.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
    if (dollarTagMatch) {
      const dollarTag = dollarTagMatch[0];
      const precedingSql = content.slice(Math.max(0, index - 200), index);
      const isExecutableDollarBody = /\b(?:as|do)\s*$/i.test(precedingSql);

      if (isExecutableDollarBody) {
        blankSqlRange(characters, index, index + dollarTag.length);
        executableDollarTag = dollarTag;
        index += dollarTag.length;
        continue;
      }

      const closingTag = content.indexOf(dollarTag, index + dollarTag.length);
      const end = closingTag === -1
        ? content.length
        : closingTag + dollarTag.length;
      blankSqlRange(characters, index, end);
      index = end;
      continue;
    }

    index += 1;
  }

  return characters.join('');
}

function isAllowlistedDestructiveStatement(fileName, statementClass, matchText) {
  const normalizedMatchText = normalizeSqlFragment(matchText);
  return destructiveStatementAllowlist.some(
    (entry) =>
      entry.fileName === fileName &&
      entry.label === 'destructive SQL statement' &&
      entry.statementClass === statementClass &&
      entry.statement === normalizedMatchText,
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

    const line = lineNumberForOffset(content, match.index);
    violations.push(`${fileName}:${line}: ${rule.label} is not allowed in Supabase migrations.`);
  }

  const executableSql = maskSqlCommentsAndStringLiterals(content);

  for (const rule of destructiveStatementRules) {
    rule.regex.lastIndex = 0;

    for (const match of executableSql.matchAll(rule.regex)) {
      const matchText = normalizeSqlFragment(match[0]);

      if (isAllowlistedDestructiveStatement(fileName, rule.statementClass, matchText)) {
        continue;
      }

      const line = lineNumberForOffset(content, match.index);
      violations.push(
        `${fileName}:${line}: ${rule.statementClass} destructive SQL statement is not allowed in Supabase migrations.`,
      );
    }
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
