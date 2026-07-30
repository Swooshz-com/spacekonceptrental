const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const defaultMigrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const migrationFileNamePattern = /^(\d{14})_[a-z0-9][a-z0-9_]*\.sql$/;

// Phase 1F-A approves no destructive migration statements. Future allowlist
// entries must be exact, reviewed, uniquely identified, and paired with tests
// before merge.
const destructiveStatementAllowlist = [
  // The setup-recipe admin RPC performs these two bounded transactional row
  // removals. They are runtime function bodies, not migration-time data
  // deletion, and are covered by the local RPC atomicity tests. Each entry is
  // a complete statement fingerprint so a second statement on the same table
  // cannot reuse this approval.
  {
    occurrenceId: 'setup-recipe-remove-header-delete',
    fileName: '20260730100000_setup_recipe_database_authority.sql',
    label: 'destructive SQL statement',
    statementClass: 'DELETE',
    statement: `
      delete from public.setup_recipes r
      where r.workspace_id = p_expected_workspace_id
        and r.setup_product_id = p_setup_product_id;
    `,
  },
  {
    occurrenceId: 'setup-recipe-replace-items-delete',
    fileName: '20260730100000_setup_recipe_database_authority.sql',
    label: 'destructive SQL statement',
    statementClass: 'DELETE',
    statement: `
      delete from public.setup_recipe_items i
      where i.workspace_id = p_expected_workspace_id
        and i.setup_product_id = p_setup_product_id;
    `,
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

function dollarTagAt(content, index) {
  const match = content.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
  return match ? match[0] : null;
}

function readQuotedRange(content, start, quote) {
  let index = start + 1;

  while (index < content.length) {
    if (quote === "'" && content[index] === '\\') {
      index += 2;
      continue;
    }

    if (content[index] === quote && content[index + 1] === quote) {
      index += 2;
      continue;
    }

    if (content[index] === quote) {
      return index + 1;
    }

    index += 1;
  }

  return content.length;
}

function readBlockCommentRange(content, start) {
  let depth = 1;
  let index = start + 2;

  while (index < content.length && depth > 0) {
    if (content.startsWith('/*', index)) {
      depth += 1;
      index += 2;
    } else if (content.startsWith('*/', index)) {
      depth -= 1;
      index += 2;
    } else {
      index += 1;
    }
  }

  return index;
}

function findDollarClosingTag(content, start, dollarTag) {
  let index = start;

  while (index < content.length) {
    if (content.startsWith('--', index)) {
      const lineEnd = content.indexOf('\n', index + 2);
      index = lineEnd === -1 ? content.length : lineEnd;
      continue;
    }

    if (content.startsWith('/*', index)) {
      index = readBlockCommentRange(content, index);
      continue;
    }

    if (content[index] === "'" || content[index] === '"') {
      index = readQuotedRange(content, index, content[index]);
      continue;
    }

    if (content.startsWith(dollarTag, index)) {
      return index;
    }

    index += 1;
  }

  return -1;
}

function normalizeSqlStatement(statement) {
  const tokens = [];
  let index = 0;

  while (index < statement.length) {
    if (/\s/.test(statement[index])) {
      index += 1;
      continue;
    }

    if (statement.startsWith('--', index)) {
      const lineEnd = statement.indexOf('\n', index + 2);
      index = lineEnd === -1 ? statement.length : lineEnd;
      continue;
    }

    if (statement.startsWith('/*', index)) {
      index = readBlockCommentRange(statement, index);
      continue;
    }

    if (statement[index] === "'" || statement[index] === '"') {
      const end = readQuotedRange(statement, index, statement[index]);
      tokens.push({
        kind: 'literal',
        value: statement.slice(index, end),
      });
      index = end;
      continue;
    }

    const dollarTag = dollarTagAt(statement, index);
    if (dollarTag) {
      const closingTag = statement.indexOf(dollarTag, index + dollarTag.length);
      const end = closingTag === -1
        ? statement.length
        : closingTag + dollarTag.length;
      tokens.push({
        kind: 'literal',
        value: statement.slice(index, end),
      });
      index = end;
      continue;
    }

    const wordMatch = statement.slice(index).match(/^[A-Za-z_][A-Za-z0-9_$]*|^\d+(?:\.\d+)?/);
    if (wordMatch) {
      tokens.push({
        kind: 'word',
        value: wordMatch[0].toLowerCase(),
      });
      index += wordMatch[0].length;
      continue;
    }

    const operatorMatch = statement.slice(index).match(/^(?:<>|<=|>=|!=|:=|::|=>|\|\||&&|\*\*|[-+*/%<>=])/);
    if (operatorMatch) {
      tokens.push({ kind: 'symbol', value: operatorMatch[0] });
      index += operatorMatch[0].length;
      continue;
    }

    tokens.push({ kind: 'symbol', value: statement[index] });
    index += 1;
  }

  return tokens.reduce((normalized, token, tokenIndex) => {
    const previous = tokens[tokenIndex - 1];
    const previousNeedsSpace = previous &&
      (previous.kind === 'word' || previous.kind === 'literal') &&
      (token.kind === 'word' || token.kind === 'literal');

    return `${normalized}${previousNeedsSpace ? ' ' : ''}${token.value}`;
  }, '');
}

function blankSqlRange(characters, start, end) {
  for (let index = start; index < end; index += 1) {
    if (characters[index] !== '\r' && characters[index] !== '\n') {
      characters[index] = ' ';
    }
  }
}

function maskExecutableDollarBody(content, characters, bodyStart, dollarTag) {
  let index = bodyStart;

  while (index < content.length) {
    if (content.startsWith(dollarTag, index)) {
      blankSqlRange(characters, index, index + dollarTag.length);
      return {
        end: index + dollarTag.length,
        contentEnd: index,
        error: null,
      };
    }

    if (content.startsWith('--', index)) {
      const lineEnd = content.indexOf('\n', index + 2);
      const end = lineEnd === -1 ? content.length : lineEnd;
      blankSqlRange(characters, index, end);
      index = end;
      continue;
    }

    if (content.startsWith('/*', index)) {
      const end = readBlockCommentRange(content, index);
      blankSqlRange(characters, index, end);
      index = end;
      continue;
    }

    if (content[index] === "'" || content[index] === '"') {
      const end = readQuotedRange(content, index, content[index]);
      blankSqlRange(characters, index, end);
      index = end;
      continue;
    }

    const nestedDollarTag = dollarTagAt(content, index);
    if (nestedDollarTag) {
      const nestedClosingTag = findDollarClosingTag(
        content,
        index + nestedDollarTag.length,
        nestedDollarTag,
      );

      if (nestedClosingTag === -1) {
        blankSqlRange(characters, index, content.length);
        return {
          end: content.length,
          contentEnd: content.length,
          error: {
            offset: index,
            message: `unterminated nested dollar-quoted string ${nestedDollarTag}`,
          },
        };
      }

      const end = nestedClosingTag + nestedDollarTag.length;
      blankSqlRange(characters, index, end);
      index = end;
      continue;
    }

    index += 1;
  }

  blankSqlRange(characters, bodyStart, content.length);
  return {
    end: content.length,
    contentEnd: content.length,
    error: {
      offset: bodyStart,
      message: `unterminated executable dollar-quoted body ${dollarTag}`,
    },
  };
}

function maskSqlCommentsAndStringLiterals(content) {
  const characters = content.split('');
  const errors = [];
  const executableDollarBodies = [];
  let index = 0;

  while (index < content.length) {
    if (content.startsWith('--', index)) {
      const lineEnd = content.indexOf('\n', index + 2);
      const end = lineEnd === -1 ? content.length : lineEnd;
      blankSqlRange(characters, index, end);
      index = end;
      continue;
    }

    if (content.startsWith('/*', index)) {
      const end = readBlockCommentRange(content, index);
      blankSqlRange(characters, index, end);
      index = end;
      continue;
    }

    if (content[index] === "'" || content[index] === '"') {
      const end = readQuotedRange(content, index, content[index]);
      blankSqlRange(characters, index, end);
      index = end;
      continue;
    }

    const dollarTag = dollarTagAt(content, index);
    if (dollarTag) {
      const maskedPrefix = characters.slice(0, index).join('');
      const isExecutableDollarBody = /\b(?:as|do)\s*$/i.test(maskedPrefix);

      if (isExecutableDollarBody) {
        blankSqlRange(characters, index, index + dollarTag.length);
        const body = maskExecutableDollarBody(
          content,
          characters,
          index + dollarTag.length,
          dollarTag,
        );

        executableDollarBodies.push({
          start: index + dollarTag.length,
          end: body.contentEnd,
          delimiter: dollarTag,
        });

        if (body.error) {
          errors.push(body.error);
        }

        index = body.end;
        continue;
      }

      const closingTag = findDollarClosingTag(
        content,
        index + dollarTag.length,
        dollarTag,
      );

      if (closingTag === -1) {
        blankSqlRange(characters, index, content.length);
        errors.push({
          offset: index,
          message: `unterminated dollar-quoted string ${dollarTag}`,
        });
        break;
      }

      blankSqlRange(characters, index, closingTag + dollarTag.length);
      index = closingTag + dollarTag.length;
      continue;
    }

    index += 1;
  }

  return {
    sql: characters.join(''),
    errors,
    executableDollarBodies,
  };
}

function statementStartForOffset(executableSql, offset, executableDollarBodies) {
  const body = executableDollarBodies.find(
    (range) => offset >= range.start && offset < range.end,
  );
  const previousSemicolon = executableSql.lastIndexOf(';', offset - 1);
  let start = Math.max(body?.start ?? 0, previousSemicolon + 1);

  while (/\s/.test(executableSql[start] ?? '')) {
    start += 1;
  }

  if (body) {
    const prefix = executableSql.slice(start, offset);
    const beginMatch = prefix.match(
      /^\s*(?:(?:<<[A-Za-z_][A-Za-z0-9_]*>>)|[A-Za-z_][A-Za-z0-9_]*)?\s*begin\b/i,
    );
    if (beginMatch) {
      start += beginMatch[0].length;
      while (/\s/.test(executableSql[start] ?? '')) {
        start += 1;
      }
    }
  }

  return start;
}

function statementEndForOffset(executableSql, offset, executableDollarBodies) {
  const body = executableDollarBodies.find(
    (range) => offset >= range.start && offset < range.end,
  );
  const nextSemicolon = executableSql.indexOf(';', offset);

  if (body && (nextSemicolon === -1 || nextSemicolon >= body.end)) {
    return body.end;
  }

  return nextSemicolon === -1 ? executableSql.length : nextSemicolon + 1;
}

function enumerateDestructiveStatements(content, executableSql, executableDollarBodies) {
  const occurrences = [];

  for (const rule of destructiveStatementRules) {
    rule.regex.lastIndex = 0;

    for (const match of executableSql.matchAll(rule.regex)) {
      const start = statementStartForOffset(
        executableSql,
        match.index,
        executableDollarBodies,
      );
      const end = statementEndForOffset(
        executableSql,
        match.index,
        executableDollarBodies,
      );

      occurrences.push({
        offset: match.index,
        statementClass: rule.statementClass,
        statement: content.slice(start, end),
        normalizedStatement: normalizeSqlStatement(content.slice(start, end)),
      });
    }
  }

  return occurrences.sort((left, right) => left.offset - right.offset);
}

function validateDestructiveStatements(
  fileName,
  content,
  allowlist = destructiveStatementAllowlist,
) {
  const violations = [];
  const masked = maskSqlCommentsAndStringLiterals(content);
  const entries = allowlist.filter(
    (entry) => entry.fileName === fileName && entry.label === 'destructive SQL statement',
  );
  const usedOccurrenceIds = new Set();
  const occurrenceIds = new Set();

  for (const entry of entries) {
    if (!entry.occurrenceId || occurrenceIds.has(entry.occurrenceId)) {
      violations.push(
        `${fileName}: destructive SQL allowlist occurrence IDs must be present and unique.`,
      );
      continue;
    }
    occurrenceIds.add(entry.occurrenceId);
  }

  for (const error of masked.errors) {
    const line = lineNumberForOffset(content, error.offset);
    violations.push(`${fileName}:${line}: ${error.message}; lexical scan failed closed.`);
  }

  for (const occurrence of enumerateDestructiveStatements(
    content,
    masked.sql,
    masked.executableDollarBodies,
  )) {
    const entry = entries.find(
      (candidate) =>
        !usedOccurrenceIds.has(candidate.occurrenceId) &&
        candidate.statementClass === occurrence.statementClass &&
        normalizeSqlStatement(candidate.statement) === occurrence.normalizedStatement,
    );

    if (entry) {
      usedOccurrenceIds.add(entry.occurrenceId);
      continue;
    }

    const line = lineNumberForOffset(content, occurrence.offset);
    violations.push(
      `${fileName}:${line}: ${occurrence.statementClass} destructive SQL statement is not exactly allowlisted.`,
    );
  }

  for (const entry of entries) {
    if (usedOccurrenceIds.has(entry.occurrenceId)) {
      continue;
    }

    violations.push(
      `${fileName}: allowlisted destructive SQL occurrence ${entry.occurrenceId} was not found exactly once.`,
    );
  }

  return violations;
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

  violations.push(...validateDestructiveStatements(fileName, content));
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

  if (path.resolve(migrationsDir) === defaultMigrationsDir) {
    const fileSet = new Set(files);
    for (const entry of destructiveStatementAllowlist) {
      if (!fileSet.has(entry.fileName)) {
        violations.push(
          `${entry.fileName}: allowlisted destructive SQL occurrence ${entry.occurrenceId} has no migration file.`,
        );
      }
    }
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
  enumerateDestructiveStatements,
  maskSqlCommentsAndStringLiterals,
  normalizeSqlStatement,
  validateDestructiveStatements,
  validateMigrations,
};
