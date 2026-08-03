const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  SESSION_CLIENT_CATEGORIES,
  SESSION_CLIENT_DIAGNOSTIC_STATES,
  SESSION_CLIENT_PHASES,
  SESSION_CLIENT_PHASE_CATEGORY_MAP,
} = require('./run-54-session-client-runner.cjs');

const DIAGNOSTIC_CONTROL_ENV_KEY = 'RUN49_DIAGNOSTIC_CONTROL_FILE';
const DIAGNOSTIC_CONTROL_SCHEMA_VERSION = 1;
const DIAGNOSTIC_CONTROL_FILENAME = 'session-client-diagnostic.json';
const MAX_DIAGNOSTIC_CONTROL_BYTES = 1024;

const DIAGNOSTIC_PAIR_SET = new Set(
  SESSION_CLIENT_DIAGNOSTIC_STATES.map(
    (state) => `${state.phase}:${state.category}`,
  ),
);

class DiagnosticControlInvalidError extends Error {
  constructor() {
    super('diagnostic_control_invalid');
    this.name = 'DiagnosticControlInvalidError';
    this.code = 'diagnostic_control_invalid';
  }
}

function invalid() {
  throw new DiagnosticControlInvalidError();
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateDiagnosticPair(record) {
  if (
    !isRecord(record) ||
    typeof record.phase !== 'string' ||
    typeof record.category !== 'string' ||
    !SESSION_CLIENT_PHASES.includes(record.phase) ||
    !SESSION_CLIENT_CATEGORIES.includes(record.category) ||
    record.category === 'none' ||
    !SESSION_CLIENT_PHASE_CATEGORY_MAP.get(record.phase)?.has(record.category) ||
    !DIAGNOSTIC_PAIR_SET.has(`${record.phase}:${record.category}`)
  ) {
    return null;
  }

  return { phase: record.phase, category: record.category };
}

function validateDiagnosticRecord(record) {
  if (
    !isRecord(record) ||
    Object.keys(record).length !== 3 ||
    record.schemaVersion !== DIAGNOSTIC_CONTROL_SCHEMA_VERSION
  ) {
    return null;
  }

  return validateDiagnosticPair(record);
}

function serializeDiagnosticRecord(pair) {
  const validated = validateDiagnosticPair(pair);
  if (!validated) invalid();
  return `${JSON.stringify({
    schemaVersion: DIAGNOSTIC_CONTROL_SCHEMA_VERSION,
    phase: validated.phase,
    category: validated.category,
  })}\n`;
}

function createDiagnosticControl({ dir } = {}) {
  const parentDir =
    dir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'spacekonceptrental-run49-diagnostic-'));
  const filePath = path.join(parentDir, DIAGNOSTIC_CONTROL_FILENAME);
  fs.writeFileSync(filePath, '', { flag: 'wx' });
  if (process.platform !== 'win32') {
    fs.chmodSync(filePath, 0o600);
  }
  return { dir: parentDir, filePath };
}

function assertDiagnosticControlIdentity({ filePath }) {
  if (typeof filePath !== 'string' || filePath.trim() === '') invalid();

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    invalid();
  }
  if (!stat.isFile()) invalid();

  if (process.platform !== 'win32') {
    if ((stat.mode & 0o777) !== 0o600) invalid();
    if (stat.uid !== process.getuid()) invalid();
  }

  return { admitted: true };
}

function readDiagnosticControl({ filePath, required = false } = {}) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    if (required) invalid();
    return null;
  }

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      if (required) invalid();
      return null;
    }
    invalid();
  }

  if (Buffer.byteLength(raw, 'utf8') > MAX_DIAGNOSTIC_CONTROL_BYTES) invalid();
  if (raw.trim() === '') return null;

  const lines = raw.split('\n');
  if (raw.endsWith('\n')) lines.pop();
  if (lines.length !== 1) invalid();

  const line = lines[0];
  if (!line || line.includes('\r')) invalid();

  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch {
    invalid();
  }
  if (JSON.stringify(parsed) !== line) invalid();

  const record = validateDiagnosticRecord(parsed);
  if (!record) invalid();

  return record;
}

function writeSessionClientDiagnostic(record, { filePath }) {
  const validated = validateDiagnosticPair(record);
  if (!validated) invalid();
  if (typeof filePath !== 'string' || filePath.trim() === '') invalid();

  let existing = '';
  try {
    existing = fs.readFileSync(filePath, 'utf8');
  } catch {
    invalid();
  }
  if (existing.trim() !== '') invalid();

  fs.writeFileSync(
    filePath,
    serializeDiagnosticRecord(validated),
    { flag: 'w' },
  );
  return validated;
}

function removeDiagnosticControl({ dir }) {
  if (typeof dir !== 'string' || dir.trim() === '') return;
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = {
  DIAGNOSTIC_CONTROL_ENV_KEY,
  DIAGNOSTIC_CONTROL_FILENAME,
  DIAGNOSTIC_CONTROL_SCHEMA_VERSION,
  MAX_DIAGNOSTIC_CONTROL_BYTES,
  DiagnosticControlInvalidError,
  assertDiagnosticControlIdentity,
  createDiagnosticControl,
  readDiagnosticControl,
  removeDiagnosticControl,
  serializeDiagnosticRecord,
  validateDiagnosticPair,
  validateDiagnosticRecord,
  writeSessionClientDiagnostic,
};
