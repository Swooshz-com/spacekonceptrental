const fs = require('node:fs');
const crypto = require('node:crypto');
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
    target: 'public.setup_recipes',
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
    target: 'public.setup_recipe_items',
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
    regex: /\bdrop\s+schema\b/gi,
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
    regex: /\bdelete\s+from\b/gi,
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

const triviaTokenTypes = new Set([
  'whitespace',
  'line_comment',
  'block_comment',
]);
const stringTokenTypes = new Set([
  'standard_string',
  'escape_string',
  'unicode_string',
  'dollar_string',
]);
const quotedIdentifierTokenTypes = new Set([
  'quoted_identifier',
  'unicode_quoted_identifier',
]);
const wordTokenTypes = new Set(['keyword', 'identifier']);
const proceduralDynamicSqlPolicy =
  'Procedural dynamic SQL is not permitted in reviewed migrations.';
const historicalProceduralDynamicSqlException = Object.freeze({
  repositoryPath:
    'supabase/migrations/' +
    '20260721190000_platform_rls_auto_enable_privilege_hardening.sql',
  fileName:
    '20260721190000_platform_rls_auto_enable_privilege_hardening.sql',
  gitBlobSha1: '5729e7a81fbb39ee04f6e5cb37450a261e55468f',
  canonicalLfSha256:
    '939DA4DDB6ABB1D884317E56835CAA7027B51CCD7B40BE1AB4FCB3362C73A35A',
  proceduralStatementClass: 'EXECUTE',
  decodedCommand:
    'revoke execute on function public.rls_auto_enable() ' +
    'from public, anon, authenticated, service_role',
});
const sqlKeywords = new Set([
  'as',
  'create',
  'do',
  'function',
  'language',
  'or',
  'procedure',
  'replace',
  'uescape',
]);

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

function blankSqlRange(characters, start, end) {
  for (let index = start; index < end; index += 1) {
    if (characters[index] !== '\r' && characters[index] !== '\n') {
      characters[index] = ' ';
    }
  }
}

function readPostgresQuotedToken(
  content,
  start,
  { prefixLength = 0, quote = "'", backslashEscapes = false } = {},
) {
  let index = start + prefixLength + 1;

  while (index < content.length) {
    if (backslashEscapes && content[index] === '\\') {
      index += content[index + 1] === '\r' && content[index + 2] === '\n'
        ? 3
        : Math.min(2, content.length - index);
      continue;
    }
    if (content[index] === quote && content[index + 1] === quote) {
      index += 2;
      continue;
    }
    if (content[index] === quote) {
      return { end: index + 1, closed: true };
    }
    index += 1;
  }

  return { end: content.length, closed: false };
}

function readPostgresBlockComment(content, start) {
  let depth = 1;
  let index = start + 2;
  while (index < content.length) {
    if (content.startsWith('/*', index)) {
      depth += 1;
      index += 2;
    } else if (content.startsWith('*/', index)) {
      depth -= 1;
      index += 2;
      if (depth === 0) {
        return { end: index, closed: true };
      }
    } else {
      index += 1;
    }
  }
  return { end: content.length, closed: false };
}

function lexPostgresSql(content) {
  const tokens = [];
  const errors = [];
  let index = 0;

  const push = (type, start, end, extra = {}) => {
    const token = {
      type,
      start,
      end,
      raw: content.slice(start, end),
      ...extra,
    };
    tokens.push(token);
    return token;
  };
  const error = (token, message, offset = token.start) => {
    errors.push({ offset, message, token });
  };

  while (index < content.length) {
    const start = index;

    if (/\s/.test(content[index])) {
      while (index < content.length && /\s/.test(content[index])) {
        index += 1;
      }
      push('whitespace', start, index);
      continue;
    }
    if (content.startsWith('--', index)) {
      const lineEnd = content.indexOf('\n', index + 2);
      index = lineEnd === -1 ? content.length : lineEnd;
      push('line_comment', start, index);
      continue;
    }
    if (content.startsWith('/*', index)) {
      const range = readPostgresBlockComment(content, index);
      index = range.end;
      const token = push('block_comment', start, index);
      if (!range.closed) {
        error(token, 'unterminated nested block comment');
      }
      continue;
    }
    if (
      (content[index] === 'E' || content[index] === 'e') &&
      content[index + 1] === "'"
    ) {
      const range = readPostgresQuotedToken(content, index, {
        prefixLength: 1,
        backslashEscapes: true,
      });
      index = range.end;
      const token = push('escape_string', start, index, {
        closed: range.closed,
        prefixLength: 1,
        quote: "'",
      });
      if (!range.closed) {
        error(token, 'unterminated escape string constant');
      }
      continue;
    }
    if (
      (content[index] === 'U' || content[index] === 'u') &&
      content[index + 1] === '&' &&
      (content[index + 2] === "'" || content[index + 2] === '"')
    ) {
      const quote = content[index + 2];
      const range = readPostgresQuotedToken(content, index, {
        prefixLength: 2,
        quote,
      });
      index = range.end;
      const token = push(
        quote === "'" ? 'unicode_string' : 'unicode_quoted_identifier',
        start,
        index,
        { closed: range.closed, prefixLength: 2, quote },
      );
      if (!range.closed) {
        error(
          token,
          quote === "'"
            ? 'unterminated Unicode string constant'
            : 'unterminated Unicode quoted identifier',
        );
      }
      continue;
    }
    if (content[index] === "'") {
      const range = readPostgresQuotedToken(content, index);
      index = range.end;
      const token = push('standard_string', start, index, {
        closed: range.closed,
        prefixLength: 0,
        quote: "'",
      });
      if (!range.closed) {
        error(token, 'unterminated standard string constant');
      }
      continue;
    }
    if (content[index] === '"') {
      const range = readPostgresQuotedToken(content, index, { quote: '"' });
      index = range.end;
      const token = push('quoted_identifier', start, index, {
        closed: range.closed,
        prefixLength: 0,
        quote: '"',
      });
      if (!range.closed) {
        error(token, 'unterminated quoted identifier');
      } else if (token.raw === '""') {
        error(token, 'zero-length quoted identifier');
      }
      continue;
    }

    const dollarTag = dollarTagAt(content, index);
    if (dollarTag) {
      const bodyStart = index + dollarTag.length;
      const bodyEnd = content.indexOf(dollarTag, bodyStart);
      const closed = bodyEnd !== -1;
      index = closed ? bodyEnd + dollarTag.length : content.length;
      const token = push('dollar_string', start, index, {
        closed,
        dollarTag,
        bodyStart,
        bodyEnd: closed ? bodyEnd : content.length,
      });
      if (!closed) {
        error(token, 'unterminated dollar-quoted string');
      }
      continue;
    }

    const word = content
      .slice(index)
      .match(/^[A-Za-z_\u0080-\uFFFF][A-Za-z0-9_$\u0080-\uFFFF]*/);
    if (word) {
      index += word[0].length;
      const value = word[0].toLowerCase();
      push(sqlKeywords.has(value) ? 'keyword' : 'identifier', start, index, {
        value,
      });
      continue;
    }
    const number = content
      .slice(index)
      .match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) {
      index += number[0].length;
      push('number', start, index);
      continue;
    }
    if (content[index] === ';') {
      index += 1;
      push('statement_terminator', start, index, { value: ';' });
      continue;
    }
    if ('(),.[]'.includes(content[index])) {
      index += 1;
      push('punctuation', start, index, { value: content[start] });
      continue;
    }
    const operator = content
      .slice(index)
      .match(/^(?:<>|<=|>=|!=|:=|::|=>|\|\||&&|\*\*|[-+*/%<>=~!@#^&|`?:$]+)/);
    if (operator) {
      index += operator[0].length;
      push('operator', start, index, { value: operator[0] });
      continue;
    }
    index += 1;
    push('punctuation', start, index, { value: content[start] });
  }

  return { tokens, errors };
}

function isPostgresWord(token, expected) {
  return Boolean(
    token &&
    wordTokenTypes.has(token.type) &&
    token.value === expected.toLowerCase(),
  );
}

function significantPostgresTokenIndices(tokens, start = 0, end = tokens.length) {
  const indices = [];
  for (let index = start; index < end; index += 1) {
    if (!triviaTokenTypes.has(tokens[index].type)) {
      indices.push(index);
    }
  }
  return indices;
}

function appendDecodedValue(output, sourceOffsets, value, sourceOffset) {
  output.push(value);
  for (let index = 0; index < value.length; index += 1) {
    sourceOffsets.push(sourceOffset);
  }
}

function decodeSimpleQuotedToken(token) {
  const output = [];
  const sourceOffsets = [];
  const contentStart = token.start + token.prefixLength + 1;
  const contentEnd = token.closed ? token.end - 1 : token.end;
  let sourceIndex = contentStart;
  let rawIndex = token.prefixLength + 1;

  while (sourceIndex < contentEnd) {
    if (
      token.raw[rawIndex] === token.quote &&
      token.raw[rawIndex + 1] === token.quote
    ) {
      appendDecodedValue(output, sourceOffsets, token.quote, sourceIndex);
      sourceIndex += 2;
      rawIndex += 2;
      continue;
    }
    const codePoint = token.raw.codePointAt(rawIndex);
    const value = String.fromCodePoint(codePoint);
    appendDecodedValue(output, sourceOffsets, value, sourceIndex);
    sourceIndex += value.length;
    rawIndex += value.length;
  }

  return { value: output.join(''), sourceOffsets, error: null };
}

function parsePostgresByteEscape(raw, index) {
  if (raw[index] !== '\\') {
    return null;
  }
  const octal = raw.slice(index + 1).match(/^[0-7]{1,3}/);
  if (octal) {
    return {
      byte: Number.parseInt(octal[0], 8),
      next: index + 1 + octal[0].length,
    };
  }
  if (raw[index + 1] === 'x') {
    const hexadecimal = raw.slice(index + 2).match(/^[0-9A-Fa-f]{1,2}/);
    return hexadecimal
      ? {
        byte: Number.parseInt(hexadecimal[0], 16),
        next: index + 2 + hexadecimal[0].length,
      }
      : { error: true, next: index + 2 };
  }
  return null;
}

function isUnicodeSurrogate(codePoint) {
  return codePoint >= 0xD800 && codePoint <= 0xDFFF;
}

function combineUnicodeSurrogates(high, low) {
  return 0x10000 + ((high - 0xD800) << 10) + (low - 0xDC00);
}

function decodeEscapeStringToken(token) {
  const raw = token.raw;
  const output = [];
  const sourceOffsets = [];
  const contentEnd = token.closed ? raw.length - 1 : raw.length;
  let index = token.prefixLength + 1;
  const fail = (localOffset) => ({
    value: '',
    sourceOffsets: [],
    error: {
      offset: token.start + localOffset,
      message: 'invalid or unsupported escape string sequence',
    },
  });

  while (index < contentEnd) {
    if (raw[index] === "'" && raw[index + 1] === "'") {
      appendDecodedValue(output, sourceOffsets, "'", token.start + index);
      index += 2;
      continue;
    }
    if (raw[index] !== '\\') {
      const codePoint = raw.codePointAt(index);
      const value = String.fromCodePoint(codePoint);
      if (codePoint === 0) {
        return fail(index);
      }
      appendDecodedValue(output, sourceOffsets, value, token.start + index);
      index += value.length;
      continue;
    }
    if (index + 1 >= contentEnd) {
      return fail(index);
    }
    if (raw[index + 1] === '\n') {
      index += 2;
      continue;
    }
    if (raw[index + 1] === '\r' && raw[index + 2] === '\n') {
      index += 3;
      continue;
    }

    const byteEscape = parsePostgresByteEscape(raw, index);
    if (byteEscape) {
      if (byteEscape.error) {
        return fail(index);
      }
      const bytes = [];
      const sourceOffset = token.start + index;
      let next = index;
      while (next < contentEnd) {
        const parsed = parsePostgresByteEscape(raw, next);
        if (!parsed || parsed.error) {
          break;
        }
        bytes.push(parsed.byte);
        next = parsed.next;
      }
      if (bytes.includes(0)) {
        return fail(index);
      }
      try {
        appendDecodedValue(
          output,
          sourceOffsets,
          new TextDecoder('utf-8', { fatal: true })
            .decode(Uint8Array.from(bytes)),
          sourceOffset,
        );
      } catch {
        return fail(index);
      }
      index = next;
      continue;
    }

    const escape = raw[index + 1];
    const simpleEscapes = {
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
    };
    if (Object.prototype.hasOwnProperty.call(simpleEscapes, escape)) {
      appendDecodedValue(
        output,
        sourceOffsets,
        simpleEscapes[escape],
        token.start + index,
      );
      index += 2;
      continue;
    }
    if (escape === 'u' || escape === 'U') {
      const length = escape === 'u' ? 4 : 8;
      const hexadecimal = raw.slice(index + 2, index + 2 + length);
      if (
        hexadecimal.length !== length ||
        !/^[0-9A-Fa-f]+$/.test(hexadecimal)
      ) {
        return fail(index);
      }
      let codePoint = Number.parseInt(hexadecimal, 16);
      let next = index + 2 + length;
      if (codePoint >= 0xD800 && codePoint <= 0xDBFF) {
        const lowHex = raw.slice(next + 2, next + 6);
        const low = Number.parseInt(lowHex, 16);
        if (
          raw.slice(next, next + 2) !== '\\u' ||
          !/^[0-9A-Fa-f]{4}$/.test(lowHex) ||
          low < 0xDC00 ||
          low > 0xDFFF
        ) {
          return fail(index);
        }
        codePoint = combineUnicodeSurrogates(codePoint, low);
        next += 6;
      } else if (
        isUnicodeSurrogate(codePoint) ||
        codePoint > 0x10FFFF ||
        codePoint === 0
      ) {
        return fail(index);
      }
      appendDecodedValue(
        output,
        sourceOffsets,
        String.fromCodePoint(codePoint),
        token.start + index,
      );
      index = next;
      continue;
    }

    // PostgreSQL takes an otherwise unknown backslash escape literally.
    appendDecodedValue(output, sourceOffsets, escape, token.start + index);
    index += 2;
  }

  return { value: output.join(''), sourceOffsets, error: null };
}

function unicodeEscapeAt(raw, index, escapeCharacter) {
  if (raw[index] !== escapeCharacter) {
    return null;
  }
  if (raw[index + 1] === escapeCharacter) {
    return { literalEscape: true, next: index + 2 };
  }
  const hasPlus = raw[index + 1] === '+';
  const length = hasPlus ? 6 : 4;
  const digitsStart = index + (hasPlus ? 2 : 1);
  const hexadecimal = raw.slice(digitsStart, digitsStart + length);
  return (
    hexadecimal.length === length &&
    /^[0-9A-Fa-f]+$/.test(hexadecimal)
  )
    ? {
      codePoint: Number.parseInt(hexadecimal, 16),
      next: digitsStart + length,
    }
    : { error: true, next: digitsStart + hexadecimal.length };
}

function decodeUnicodeToken(token) {
  const raw = token.raw;
  const output = [];
  const sourceOffsets = [];
  const contentEnd = token.closed ? raw.length - 1 : raw.length;
  const escapeCharacter = token.unicodeEscapeCharacter ?? '\\';
  let index = token.prefixLength + 1;
  const fail = (localOffset) => ({
    value: '',
    sourceOffsets: [],
    error: {
      offset: token.start + localOffset,
      message: 'invalid or unsupported Unicode escape sequence',
    },
  });

  while (index < contentEnd) {
    if (raw[index] === token.quote && raw[index + 1] === token.quote) {
      appendDecodedValue(
        output,
        sourceOffsets,
        token.quote,
        token.start + index,
      );
      index += 2;
      continue;
    }
    const parsed = unicodeEscapeAt(raw, index, escapeCharacter);
    if (parsed) {
      if (parsed.error) {
        return fail(index);
      }
      if (parsed.literalEscape) {
        appendDecodedValue(
          output,
          sourceOffsets,
          escapeCharacter,
          token.start + index,
        );
        index = parsed.next;
        continue;
      }
      let codePoint = parsed.codePoint;
      let next = parsed.next;
      if (codePoint >= 0xD800 && codePoint <= 0xDBFF) {
        const low = unicodeEscapeAt(raw, next, escapeCharacter);
        if (
          !low ||
          low.error ||
          low.literalEscape ||
          low.codePoint < 0xDC00 ||
          low.codePoint > 0xDFFF
        ) {
          return fail(index);
        }
        codePoint = combineUnicodeSurrogates(codePoint, low.codePoint);
        next = low.next;
      } else if (
        isUnicodeSurrogate(codePoint) ||
        codePoint > 0x10FFFF ||
        codePoint === 0
      ) {
        return fail(index);
      }
      appendDecodedValue(
        output,
        sourceOffsets,
        String.fromCodePoint(codePoint),
        token.start + index,
      );
      index = next;
      continue;
    }
    const codePoint = raw.codePointAt(index);
    const value = String.fromCodePoint(codePoint);
    if (codePoint === 0) {
      return fail(index);
    }
    appendDecodedValue(output, sourceOffsets, value, token.start + index);
    index += value.length;
  }

  return { value: output.join(''), sourceOffsets, error: null };
}

function decodePostgresStringToken(token) {
  if (token.decoded) {
    return token.decoded;
  }
  if (!token.closed) {
    return null;
  }
  if (
    token.type === 'standard_string' ||
    token.type === 'quoted_identifier'
  ) {
    token.decoded = decodeSimpleQuotedToken(token);
  } else if (token.type === 'escape_string') {
    token.decoded = decodeEscapeStringToken(token);
  } else if (
    token.type === 'unicode_string' ||
    token.type === 'unicode_quoted_identifier'
  ) {
    token.decoded = decodeUnicodeToken(token);
  } else if (token.type === 'dollar_string') {
    const value = token.raw.slice(
      token.dollarTag.length,
      -token.dollarTag.length,
    );
    token.decoded = {
      value,
      sourceOffsets: Array.from(
        { length: value.length },
        (_, index) => token.bodyStart + index,
      ),
      error: null,
    };
  }
  return token.decoded ?? null;
}

function preparePostgresLiteralTokens(tokens, errors) {
  const significant = significantPostgresTokenIndices(tokens);
  const positions = new Map(
    significant.map((tokenIndex, position) => [tokenIndex, position]),
  );

  for (const [tokenIndex, token] of tokens.entries()) {
    if (
      token.type === 'unicode_string' ||
      token.type === 'unicode_quoted_identifier'
    ) {
      token.unicodeEscapeCharacter = '\\';
      const position = positions.get(tokenIndex);
      const uescapeIndex = significant[position + 1];
      if (isPostgresWord(tokens[uescapeIndex], 'uescape')) {
        const escapeTokenIndex = significant[position + 2];
        const escapeToken = tokens[escapeTokenIndex];
        token.unicodeClauseEndTokenIndex = escapeTokenIndex ?? uescapeIndex;
        const decodedEscape = escapeToken?.type === 'standard_string'
          ? decodePostgresStringToken(escapeToken)
          : null;
        const escapeCharacter = decodedEscape?.value;
        if (
          decodedEscape?.error ||
          [...(escapeCharacter ?? '')].length !== 1 ||
          /[0-9A-Fa-f+'"\s]/.test(escapeCharacter)
        ) {
          errors.push({
            offset: tokens[uescapeIndex].start,
            message: 'invalid Unicode UESCAPE clause',
            token,
          });
        } else {
          token.unicodeEscapeCharacter = escapeCharacter;
        }
      }

      const decoded = decodePostgresStringToken(token);
      if (decoded?.error) {
        errors.push({ ...decoded.error, token });
      }
      if (
        token.type === 'unicode_quoted_identifier' &&
        decoded &&
        decoded.value.length === 0
      ) {
        errors.push({
          offset: token.start,
          message: 'zero-length quoted identifier',
          token,
        });
      }
    } else if (token.type === 'escape_string' && token.closed) {
      const decoded = decodePostgresStringToken(token);
      if (decoded?.error) {
        errors.push({ ...decoded.error, token });
      }
    }
  }
}

function parsePostgresStringGroup(tokens, significant, position) {
  const tokenIndex = significant[position];
  const token = tokens[tokenIndex];
  if (!token || !stringTokenTypes.has(token.type)) {
    return null;
  }

  let nextPosition = position + 1;
  if (token.unicodeClauseEndTokenIndex !== undefined) {
    while (
      nextPosition < significant.length &&
      significant[nextPosition] <= token.unicodeClauseEndTokenIndex
    ) {
      nextPosition += 1;
    }
  }
  return { token, tokenIndex, nextPosition };
}

function parsePostgresLanguageName(tokens, significant, position) {
  const tokenIndex = significant[position];
  const token = tokens[tokenIndex];
  if (!token) {
    return null;
  }

  if (
    wordTokenTypes.has(token.type) ||
    quotedIdentifierTokenTypes.has(token.type)
  ) {
    let nextPosition = position + 1;
    if (token.unicodeClauseEndTokenIndex !== undefined) {
      while (
        nextPosition < significant.length &&
        significant[nextPosition] <= token.unicodeClauseEndTokenIndex
      ) {
        nextPosition += 1;
      }
    }
    const decoded = quotedIdentifierTokenTypes.has(token.type)
      ? decodePostgresStringToken(token)
      : { value: token.value };
    return {
      token,
      tokenIndex,
      nextPosition,
      value: decoded?.value,
    };
  }

  const stringGroup = parsePostgresStringGroup(
    tokens,
    significant,
    position,
  );
  return stringGroup
    ? {
      ...stringGroup,
      value: decodePostgresStringToken(stringGroup.token)?.value,
    }
    : null;
}

function postgresStatementTokenRanges(tokens) {
  const ranges = [];
  let start = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].type === 'statement_terminator') {
      ranges.push({ start, end: index });
      start = index + 1;
    }
  }
  if (start < tokens.length) {
    ranges.push({ start, end: tokens.length });
  }
  return ranges;
}

function declaredPostgresLanguage(tokens, significant, startPosition) {
  let depth = 0;
  for (
    let position = startPosition;
    position < significant.length;
    position += 1
  ) {
    const token = tokens[significant[position]];
    if (token.type === 'punctuation' && token.value === '(') {
      depth += 1;
    } else if (token.type === 'punctuation' && token.value === ')') {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && isPostgresWord(token, 'language')) {
      return parsePostgresLanguageName(tokens, significant, position + 1);
    }
  }
  return null;
}

function analyzePostgresExecutableContexts(tokens) {
  const executableBodies = [];
  const errors = [];
  const fail = (token) => {
    errors.push({
      offset: token?.start ?? 0,
      message: 'invalid or unsupported executable SQL body context',
    });
  };

  for (const range of postgresStatementTokenRanges(tokens)) {
    const significant = significantPostgresTokenIndices(
      tokens,
      range.start,
      range.end,
    );
    if (significant.length === 0) {
      continue;
    }

    const first = tokens[significant[0]];
    if (isPostgresWord(first, 'do')) {
      let body;
      let normalizedLanguage = 'plpgsql';
      let position = 1;
      if (isPostgresWord(tokens[significant[position]], 'language')) {
        const language = parsePostgresLanguageName(
          tokens,
          significant,
          position + 1,
        );
        if (!language) {
          fail(tokens[significant[position]]);
          continue;
        }
        normalizedLanguage = language.value?.toLowerCase();
        body = parsePostgresStringGroup(
          tokens,
          significant,
          language.nextPosition,
        );
        if (!body || body.nextPosition !== significant.length) {
          fail(
            tokens[significant[language.nextPosition]] ??
            language.token,
          );
          continue;
        }
      } else {
        body = parsePostgresStringGroup(tokens, significant, position);
        if (!body) {
          fail(tokens[significant[position]] ?? first);
          continue;
        }
        position = body.nextPosition;
        if (isPostgresWord(tokens[significant[position]], 'language')) {
          const language = parsePostgresLanguageName(
            tokens,
            significant,
            position + 1,
          );
          if (!language || language.nextPosition !== significant.length) {
            fail(tokens[significant[position]]);
            continue;
          }
          normalizedLanguage = language.value?.toLowerCase();
          position = language.nextPosition;
        }
        if (position !== significant.length) {
          fail(tokens[significant[position]]);
          continue;
        }
      }
      executableBodies.push({
        token: body.token,
        tokenIndex: body.tokenIndex,
        context: 'DO',
        language: normalizedLanguage,
      });
      continue;
    }

    if (!isPostgresWord(first, 'create')) {
      continue;
    }
    let declarationPosition = 1;
    if (
      isPostgresWord(tokens[significant[declarationPosition]], 'or') &&
      isPostgresWord(
        tokens[significant[declarationPosition + 1]],
        'replace',
      )
    ) {
      declarationPosition += 2;
    }
    const declaration = tokens[significant[declarationPosition]];
    if (
      !isPostgresWord(declaration, 'function') &&
      !isPostgresWord(declaration, 'procedure')
    ) {
      continue;
    }
    const language = declaredPostgresLanguage(
      tokens,
      significant,
      declarationPosition + 1,
    );
    const normalizedLanguage = language?.value?.toLowerCase();

    let depth = 0;
    let asPosition = -1;
    for (
      let position = declarationPosition + 1;
      position < significant.length;
      position += 1
    ) {
      const token = tokens[significant[position]];
      if (token.type === 'punctuation' && token.value === '(') {
        depth += 1;
      } else if (token.type === 'punctuation' && token.value === ')') {
        depth = Math.max(0, depth - 1);
      } else if (depth === 0 && isPostgresWord(token, 'as')) {
        asPosition = position;
        break;
      }
    }
    if (asPosition === -1) {
      continue;
    }

    const firstBody = parsePostgresStringGroup(
      tokens,
      significant,
      asPosition + 1,
    );
    if (!firstBody) {
      fail(tokens[significant[asPosition]]);
      continue;
    }
    const afterFirst = tokens[significant[firstBody.nextPosition]];
    if (
      afterFirst?.type === 'punctuation' &&
      afterFirst.value === ','
    ) {
      const linkSymbol = parsePostgresStringGroup(
        tokens,
        significant,
        firstBody.nextPosition + 1,
      );
      if (
        !linkSymbol ||
        normalizedLanguage !== 'c' ||
        (
          tokens[significant[linkSymbol.nextPosition]]?.type ===
            'punctuation' &&
          tokens[significant[linkSymbol.nextPosition]].value === ','
        )
      ) {
        fail(afterFirst);
      }
      continue;
    }
    if (afterFirst && stringTokenTypes.has(afterFirst.type)) {
      errors.push({
        offset: afterFirst.start,
        message: 'unsupported concatenated executable string constant',
      });
      continue;
    }
    if (
      normalizedLanguage === 'c' ||
      normalizedLanguage === 'internal'
    ) {
      continue;
    }

    executableBodies.push({
      token: firstBody.token,
      tokenIndex: firstBody.tokenIndex,
      context: isPostgresWord(declaration, 'function')
        ? 'CREATE FUNCTION'
        : 'CREATE PROCEDURE',
      language: normalizedLanguage,
    });
  }

  return { executableBodies, errors };
}

function isPostgresOperator(token, expected) {
  return Boolean(
    token &&
    token.type === 'operator' &&
    token.value === expected,
  );
}

function isPlpgsqlStatementStart(
  tokens,
  significant,
  position,
  enteredBodyAtRangeStart,
) {
  if (position === 0) {
    return enteredBodyAtRangeStart;
  }

  const previous = tokens[significant[position - 1]];
  if (
    isPostgresWord(previous, 'begin') ||
    isPostgresWord(previous, 'loop')
  ) {
    return true;
  }

  if (
    isPostgresWord(previous, 'then') ||
    isPostgresWord(previous, 'else')
  ) {
    let closedCaseDepth = 0;
    for (let candidate = position - 2; candidate >= 0; candidate -= 1) {
      const candidateToken = tokens[significant[candidate]];
      if (isPostgresWord(candidateToken, 'end')) {
        closedCaseDepth += 1;
        continue;
      }
      if (!isPostgresWord(candidateToken, 'case')) {
        continue;
      }
      if (closedCaseDepth > 0) {
        closedCaseDepth -= 1;
        continue;
      }
      return isPlpgsqlStatementStart(
        tokens,
        significant,
        candidate,
        enteredBodyAtRangeStart,
      );
    }
    return true;
  }

  if (
    isPostgresOperator(previous, '>>') &&
    wordTokenTypes.has(tokens[significant[position - 2]]?.type) &&
    isPostgresOperator(tokens[significant[position - 3]], '<<')
  ) {
    const labelStart = position - 3;
    return labelStart === 0
      ? enteredBodyAtRangeStart
      : isPlpgsqlStatementStart(
        tokens,
        significant,
        labelStart,
        enteredBodyAtRangeStart,
      );
  }

  return false;
}

function findPlpgsqlWordSequence(
  tokens,
  significant,
  startPosition,
  firstWord,
  secondWord,
) {
  let depth = 0;
  for (
    let position = startPosition;
    position < significant.length;
    position += 1
  ) {
    const token = tokens[significant[position]];
    if (token.type === 'punctuation' && token.value === '(') {
      depth += 1;
      continue;
    }
    if (token.type === 'punctuation' && token.value === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (
      depth === 0 &&
      isPostgresWord(token, firstWord) &&
      isPostgresWord(
        tokens[significant[position + 1]],
        secondWord,
      )
    ) {
      return position;
    }
  }
  return -1;
}

function enumeratePlpgsqlDynamicExecutionStatements(tokens) {
  const occurrences = [];
  let enteredBody = false;

  for (const range of postgresStatementTokenRanges(tokens)) {
    const significant = significantPostgresTokenIndices(
      tokens,
      range.start,
      range.end,
    );
    const enteredBodyAtRangeStart = enteredBody;

    for (let position = 0; position < significant.length; position += 1) {
      const token = tokens[significant[position]];
      if (isPostgresWord(token, 'begin')) {
        enteredBody = true;
      }
      if (
        !enteredBody ||
        !isPlpgsqlStatementStart(
          tokens,
          significant,
          position,
          enteredBodyAtRangeStart,
        )
      ) {
        continue;
      }

      if (isPostgresWord(token, 'execute')) {
        const next = tokens[significant[position + 1]];
        if (
          !isPostgresOperator(next, ':=') &&
          !isPostgresOperator(next, '=')
        ) {
          occurrences.push({
            offset: token.start,
            proceduralStatementClass: 'EXECUTE',
            matchesHistoricalConstantCommand: Boolean(
              next?.type === 'standard_string' &&
              position + 2 === significant.length &&
              decodePostgresStringToken(next)?.value ===
                historicalProceduralDynamicSqlException.decodedCommand,
            ),
          });
        }
        continue;
      }

      if (
        isPostgresWord(token, 'return') &&
        isPostgresWord(tokens[significant[position + 1]], 'query') &&
        isPostgresWord(tokens[significant[position + 2]], 'execute')
      ) {
        occurrences.push({
          offset: tokens[significant[position + 2]].start,
          proceduralStatementClass: 'RETURN QUERY EXECUTE',
        });
        continue;
      }

      if (isPostgresWord(token, 'for')) {
        const dynamicPosition = findPlpgsqlWordSequence(
          tokens,
          significant,
          position + 1,
          'in',
          'execute',
        );
        if (dynamicPosition !== -1) {
          occurrences.push({
            offset: tokens[significant[dynamicPosition + 1]].start,
            proceduralStatementClass: 'FOR IN EXECUTE',
          });
        }
        continue;
      }

      if (isPostgresWord(token, 'open')) {
        const dynamicPosition = findPlpgsqlWordSequence(
          tokens,
          significant,
          position + 1,
          'for',
          'execute',
        );
        if (dynamicPosition !== -1) {
          occurrences.push({
            offset: tokens[significant[dynamicPosition + 1]].start,
            proceduralStatementClass: 'OPEN FOR EXECUTE',
          });
        }
      }
    }
  }

  return occurrences.sort((left, right) => left.offset - right.offset);
}

function buildPostgresClassificationSql(content, tokens) {
  const characters = content.split('');
  for (const token of tokens) {
    if (
      triviaTokenTypes.has(token.type) ||
      stringTokenTypes.has(token.type) ||
      quotedIdentifierTokenTypes.has(token.type)
    ) {
      blankSqlRange(characters, token.start, token.end);
    }
  }
  return characters.join('');
}

function maskPostgresSqlForDestructiveScan(content) {
  const lexed = lexPostgresSql(content);
  preparePostgresLiteralTokens(lexed.tokens, lexed.errors);
  const contexts = analyzePostgresExecutableContexts(lexed.tokens);
  const errors = [...lexed.errors, ...contexts.errors];
  const outerSql = buildPostgresClassificationSql(content, lexed.tokens);
  const scanRegions = [{
    text: content,
    sql: outerSql,
    sourceOffsets: Array.from({ length: content.length }, (_, index) => index),
    executableBody: false,
  }];
  const executableDollarBodies = [];

  for (const body of contexts.executableBodies) {
    const decoded = decodePostgresStringToken(body.token);
    if (!decoded || decoded.error || !body.token.closed) {
      if (body.token.type === 'dollar_string' && !body.token.closed) {
        const lexicalError = errors.find(
          (error) => error.token === body.token,
        );
        if (lexicalError) {
          lexicalError.message = 'unterminated executable dollar-quoted body';
        }
      }
      continue;
    }

    const nested = lexPostgresSql(decoded.value);
    preparePostgresLiteralTokens(nested.tokens, nested.errors);
    for (const error of nested.errors) {
      errors.push({
        offset: decoded.sourceOffsets[error.offset] ?? body.token.start,
        message: error.message,
      });
    }
    if (nested.errors.length > 0) {
      continue;
    }

    if (body.language === 'plpgsql') {
      const dynamicExecutions =
        enumeratePlpgsqlDynamicExecutionStatements(nested.tokens);
      if (dynamicExecutions.length > 0) {
        const executableBodyIdentity =
          `${body.context}@${body.token.start}`;
        for (const occurrence of dynamicExecutions) {
          const sourceOffset =
            decoded.sourceOffsets[occurrence.offset] ?? body.token.start;
          errors.push({
            offset: sourceOffset,
            sourceOffset,
            executableBodyIdentity,
            proceduralStatementClass:
              occurrence.proceduralStatementClass,
            matchesHistoricalConstantCommand:
              occurrence.matchesHistoricalConstantCommand === true,
            message:
              `${proceduralDynamicSqlPolicy} ` +
              `Procedural statement class: ` +
              `${occurrence.proceduralStatementClass}.`,
          });
        }
        continue;
      }
    }

    scanRegions.push({
      text: decoded.value,
      sql: buildPostgresClassificationSql(decoded.value, nested.tokens),
      sourceOffsets: decoded.sourceOffsets,
      executableBody: true,
    });
    if (body.token.type === 'dollar_string') {
      executableDollarBodies.push({
        start: body.token.bodyStart,
        end: body.token.bodyEnd,
        delimiter: body.token.dollarTag,
      });
    }
  }

  return {
    sql: outerSql,
    errors: errors.map(({ token: _token, ...error }) => error),
    executableDollarBodies,
    scanRegions,
  };
}

function canonicalLfContent(content) {
  if (/\r(?!\n)/.test(content)) {
    return null;
  }
  return content.replace(/\r\n/g, '\n');
}

function gitBlobSha1(content) {
  const contentBuffer = Buffer.from(content, 'utf8');
  const header = Buffer.from(`blob ${contentBuffer.length}\0`, 'utf8');
  return crypto
    .createHash('sha1')
    .update(Buffer.concat([header, contentBuffer]))
    .digest('hex');
}

function historicalProceduralExceptionPathMatches(migrationPath) {
  if (!migrationPath) {
    return false;
  }
  const repositoryPath = path
    .relative(repoRoot, path.resolve(migrationPath))
    .split(path.sep)
    .join('/');
  return (
    repositoryPath ===
    historicalProceduralDynamicSqlException.repositoryPath
  );
}

function historicalProceduralExceptionFileMatches(
  migrationPath,
  rawContent,
) {
  if (
    !historicalProceduralExceptionPathMatches(migrationPath) ||
    rawContent === undefined
  ) {
    return false;
  }

  const canonicalContent = canonicalLfContent(rawContent);
  if (canonicalContent === null) {
    return false;
  }
  const sha256 = crypto
    .createHash('sha256')
    .update(canonicalContent, 'utf8')
    .digest('hex')
    .toUpperCase();
  return (
    sha256 ===
      historicalProceduralDynamicSqlException.canonicalLfSha256 &&
    gitBlobSha1(canonicalContent) ===
      historicalProceduralDynamicSqlException.gitBlobSha1
  );
}

function postgresNormalizedTokenKind(token) {
  return (
    wordTokenTypes.has(token.type) ||
    token.type === 'number' ||
    stringTokenTypes.has(token.type) ||
    quotedIdentifierTokenTypes.has(token.type)
  )
    ? 'material'
    : 'symbol';
}

function postgresNormalizedTokenValue(token) {
  if (wordTokenTypes.has(token.type)) {
    return token.value;
  }
  if (token.type === 'unicode_quoted_identifier') {
    return `U&${token.raw.slice(2)}`;
  }
  if (token.type === 'escape_string') {
    return `E${token.raw.slice(1)}`;
  }
  if (token.type === 'unicode_string') {
    return `U&${token.raw.slice(2)}`;
  }
  return token.raw;
}

function normalizePostgresSqlStatement(statement) {
  const tokens = lexPostgresSql(statement).tokens.filter(
    (token) => !triviaTokenTypes.has(token.type),
  );
  return tokens.reduce((normalized, token, index) => {
    const previous = tokens[index - 1];
    const needsSpace =
      previous &&
      postgresNormalizedTokenKind(previous) === 'material' &&
      postgresNormalizedTokenKind(token) === 'material';
    return (
      normalized +
      (needsSpace ? ' ' : '') +
      postgresNormalizedTokenValue(token)
    );
  }, '');
}

function postgresIdentifierTargetAt(tokens, significant, position) {
  const parts = [];
  let current = position;

  const consumeIdentifier = () => {
    const token = tokens[significant[current]];
    if (
      !token ||
      (
        !wordTokenTypes.has(token.type) &&
        !quotedIdentifierTokenTypes.has(token.type)
      )
    ) {
      return false;
    }
    parts.push(postgresNormalizedTokenValue(token));
    current += 1;
    if (token.unicodeClauseEndTokenIndex !== undefined) {
      while (
        current < significant.length &&
        significant[current] <= token.unicodeClauseEndTokenIndex
      ) {
        parts.push(
          ` ${postgresNormalizedTokenValue(tokens[significant[current]])}`,
        );
        current += 1;
      }
    }
    return true;
  };

  if (!consumeIdentifier()) {
    return null;
  }
  while (
    tokens[significant[current]]?.type === 'punctuation' &&
    tokens[significant[current]].value === '.'
  ) {
    parts.push('.');
    current += 1;
    if (!consumeIdentifier()) {
      return null;
    }
  }
  return parts.join('');
}

function destructiveTargetForStatement(statement, statementClass) {
  const lexed = lexPostgresSql(statement);
  preparePostgresLiteralTokens(lexed.tokens, lexed.errors);
  const significant = significantPostgresTokenIndices(lexed.tokens);
  const tokens = lexed.tokens;

  for (let position = 0; position < significant.length; position += 1) {
    const token = tokens[significant[position]];
    let targetPosition = -1;

    if (
      statementClass === 'DELETE' &&
      isPostgresWord(token, 'delete') &&
      isPostgresWord(tokens[significant[position + 1]], 'from')
    ) {
      targetPosition = position + 2;
      if (isPostgresWord(tokens[significant[targetPosition]], 'only')) {
        targetPosition += 1;
      }
    } else if (
      statementClass === 'TRUNCATE' &&
      isPostgresWord(token, 'truncate')
    ) {
      targetPosition = position + 1;
      if (isPostgresWord(tokens[significant[targetPosition]], 'table')) {
        targetPosition += 1;
      }
      if (isPostgresWord(tokens[significant[targetPosition]], 'only')) {
        targetPosition += 1;
      }
    } else if (
      (statementClass === 'DROP TABLE' ||
        statementClass === 'DROP SCHEMA' ||
        statementClass === 'DROP POLICY') &&
      isPostgresWord(token, 'drop') &&
      isPostgresWord(
        tokens[significant[position + 1]],
        statementClass.slice(5).toLowerCase(),
      )
    ) {
      targetPosition = position + 2;
      if (
        isPostgresWord(tokens[significant[targetPosition]], 'if') &&
        isPostgresWord(tokens[significant[targetPosition + 1]], 'exists')
      ) {
        targetPosition += 2;
      }
    } else if (
      statementClass.startsWith('ALTER TABLE') &&
      isPostgresWord(token, 'alter') &&
      isPostgresWord(tokens[significant[position + 1]], 'table')
    ) {
      targetPosition = position + 2;
      if (isPostgresWord(tokens[significant[targetPosition]], 'only')) {
        targetPosition += 1;
      }
    }

    if (targetPosition !== -1) {
      return postgresIdentifierTargetAt(tokens, significant, targetPosition);
    }
  }
  return null;
}

function postgresStatementStart(sql, offset, executableBody) {
  let start = sql.lastIndexOf(';', offset - 1) + 1;
  while (/\s/.test(sql[start] ?? '')) {
    start += 1;
  }
  if (executableBody) {
    const begin = sql.slice(start, offset).match(
      /^\s*(?:(?:<<[A-Za-z_][A-Za-z0-9_]*>>)|[A-Za-z_][A-Za-z0-9_]*)?\s*begin\b/i,
    );
    if (begin) {
      start += begin[0].length;
      while (/\s/.test(sql[start] ?? '')) {
        start += 1;
      }
    }
  }
  return start;
}

function enumeratePostgresDestructiveStatements(content, masked) {
  const occurrences = [];
  for (const region of masked.scanRegions) {
    for (const rule of destructiveStatementRules) {
      rule.regex.lastIndex = 0;
      for (const match of region.sql.matchAll(rule.regex)) {
        const start = postgresStatementStart(
          region.sql,
          match.index,
          region.executableBody,
        );
        const nextSemicolon = region.sql.indexOf(';', match.index);
        const end = nextSemicolon === -1
          ? region.sql.length
          : nextSemicolon + 1;
        const statement = region.text.slice(start, end);
        occurrences.push({
          offset: region.sourceOffsets[match.index] ?? 0,
          statementClass: rule.statementClass,
          target: destructiveTargetForStatement(
            statement,
            rule.statementClass,
          ),
          statement,
          normalizedStatement: normalizePostgresSqlStatement(statement),
        });
      }
    }
  }
  return occurrences.sort((left, right) => left.offset - right.offset);
}

function validateDestructiveStatements(
  fileName,
  content,
  allowlist = destructiveStatementAllowlist,
  options = {},
) {
  const violations = [];
  const masked = maskPostgresSqlForDestructiveScan(content);
  const proceduralDynamicSqlState =
    options.proceduralDynamicSqlState ?? {
      historicalExceptionCount: 0,
      unapprovedOccurrenceCount: 0,
    };
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
    const derivedTarget = destructiveTargetForStatement(
      entry.statement,
      entry.statementClass,
    );
    if (entry.target && entry.target !== derivedTarget) {
      violations.push(
        `${fileName}: destructive SQL allowlist occurrence ${entry.occurrenceId} has a target that does not match its complete statement.`,
      );
    }
  }

  const dynamicExecutionErrors = masked.errors.filter(
    (error) => error.proceduralStatementClass,
  );
  const historicalPathMatches =
    historicalProceduralExceptionPathMatches(options.migrationPath);
  const historicalFileMatches =
    historicalProceduralExceptionFileMatches(
      options.migrationPath,
      options.rawContent,
    );
  if (historicalPathMatches && !historicalFileMatches) {
    violations.push(
      `${fileName}: immutable historical migration fingerprint mismatch.`,
    );
  }

  for (const error of masked.errors) {
    if (error.proceduralStatementClass) {
      const isHistoricalException = Boolean(
        historicalFileMatches &&
        fileName === historicalProceduralDynamicSqlException.fileName &&
        dynamicExecutionErrors.length === 1 &&
        proceduralDynamicSqlState.historicalExceptionCount === 0 &&
        error.proceduralStatementClass ===
          historicalProceduralDynamicSqlException.proceduralStatementClass &&
        error.matchesHistoricalConstantCommand === true,
      );
      if (isHistoricalException) {
        proceduralDynamicSqlState.historicalExceptionCount += 1;
        continue;
      }
      proceduralDynamicSqlState.unapprovedOccurrenceCount += 1;
    }
    const line = lineNumberForOffset(content, error.offset);
    violations.push(`${fileName}:${line}: ${error.message}; lexical scan failed closed.`);
  }

  for (const occurrence of enumeratePostgresDestructiveStatements(
    content,
    masked,
  )) {
    if (!occurrence.target) {
      const line = lineNumberForOffset(content, occurrence.offset);
      violations.push(
        `${fileName}:${line}: destructive SQL target could not be resolved; lexical scan failed closed.`,
      );
      continue;
    }
    const entry = entries.find(
      (candidate) => {
        const candidateTarget = candidate.target ??
          destructiveTargetForStatement(
            candidate.statement,
            candidate.statementClass,
          );
        return (
          !usedOccurrenceIds.has(candidate.occurrenceId) &&
          candidate.statementClass === occurrence.statementClass &&
          candidateTarget === occurrence.target &&
          normalizePostgresSqlStatement(candidate.statement) ===
            occurrence.normalizedStatement
        );
      },
    );

    if (entry) {
      usedOccurrenceIds.add(entry.occurrenceId);
      continue;
    }

    const line = lineNumberForOffset(content, occurrence.offset);
    violations.push(
      `${fileName}:${line}: ${occurrence.statementClass} destructive SQL statement is not exactly allowlisted (target ${occurrence.target}).`,
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

function validateFileContent(
  migrationsDir,
  fileName,
  violations,
  proceduralDynamicSqlState,
) {
  const filePath = path.join(migrationsDir, fileName);
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const content = rawContent.replace(/^\uFEFF/, '');

  for (const rule of contentRules) {
    rule.regex.lastIndex = 0;
    const match = rule.regex.exec(content);

    if (!match) {
      continue;
    }

    const line = lineNumberForOffset(content, match.index);
    violations.push(`${fileName}:${line}: ${rule.label} is not allowed in Supabase migrations.`);
  }

  violations.push(...validateDestructiveStatements(
    fileName,
    content,
    destructiveStatementAllowlist,
    {
      migrationPath: filePath,
      rawContent,
      proceduralDynamicSqlState,
    },
  ));
}

function validateMigrations(migrationsDir) {
  const violations = [];
  const proceduralDynamicSqlState = {
    historicalExceptionCount: 0,
    unapprovedOccurrenceCount: 0,
  };

  if (!fs.existsSync(migrationsDir)) {
    violations.push(`Supabase migrations directory does not exist: ${migrationsDir}`);
    return {
      files: [],
      violations,
      proceduralDynamicSqlSummary: proceduralDynamicSqlState,
    };
  }

  if (!fs.statSync(migrationsDir).isDirectory()) {
    violations.push(`Supabase migrations path is not a directory: ${migrationsDir}`);
    return {
      files: [],
      violations,
      proceduralDynamicSqlSummary: proceduralDynamicSqlState,
    };
  }

  const files = listSqlFiles(migrationsDir);

  for (const fileName of files) {
    validateFileName(fileName, violations);
    validateFileContent(
      migrationsDir,
      fileName,
      violations,
      proceduralDynamicSqlState,
    );
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
    if (proceduralDynamicSqlState.historicalExceptionCount !== 1) {
      violations.push(
        `${historicalProceduralDynamicSqlException.fileName}: ` +
        'the immutable historical procedural dynamic SQL exception ' +
        'must be present exactly once.',
      );
    }
  }

  return {
    files,
    violations,
    proceduralDynamicSqlSummary: proceduralDynamicSqlState,
  };
}

function main() {
  const { migrationsDir } = parseArgs(process.argv.slice(2));
  const {
    files,
    violations,
    proceduralDynamicSqlSummary,
  } = validateMigrations(migrationsDir);

  const proceduralSummary =
    'Procedural dynamic SQL summary: ' +
    `historical_dynamic_sql_exceptions=${proceduralDynamicSqlSummary.historicalExceptionCount}, ` +
    `unapproved_procedural_dynamic_sql_occurrences=${proceduralDynamicSqlSummary.unapprovedOccurrenceCount}.`;

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`ERROR: ${violation}`);
    }
    console.error(
      `Summary: checked ${files.length} migration SQL file(s), errors ${violations.length}, result FAIL.`,
    );
    console.error(proceduralSummary);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Summary: checked ${files.length} migration SQL file(s), errors 0, result PASS.`,
  );
  console.log(proceduralSummary);
}

if (require.main === module) {
  main();
}

module.exports = {
  enumerateDestructiveStatements: enumeratePostgresDestructiveStatements,
  lexPostgresSql,
  maskSqlCommentsAndStringLiterals: maskPostgresSqlForDestructiveScan,
  normalizeSqlStatement: normalizePostgresSqlStatement,
  validateDestructiveStatements,
  validateMigrations,
};
