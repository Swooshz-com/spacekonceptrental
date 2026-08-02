const { TextDecoder } = require('node:util');

const RECEIPT_PREFIX = 'RUN49_JOINED_RECEIPT:';
const MAX_RECEIPT_BYTES = 1024;
const JOINED_STDOUT_LIMIT_BYTES = 8 * 1024;

const RECEIPT_KEYS = Object.freeze([
  'schema_version',
  'outcome',
  'phase',
  'category',
  'exit_code_class',
  'signal',
  'timeout',
  'stdout_overflow',
  'stderr_overflow',
]);

const ALLOWED_OUTCOMES = new Set(['passed', 'failed']);
const ALLOWED_EXIT_CODE_CLASSES = new Set(['zero', 'nonzero']);
const ALLOWED_PHASES = new Set([
  'child_bootstrap',
  'session_bound_client',
  'direct_consume_rpc',
  'malformed_and_replay',
  'oversized_and_replacement',
  'write_and_reload',
  'operation_mismatch',
  'concurrent_one_winner',
  'cross_process_replay',
  'direct_table_denial',
  'complete',
]);
const ALLOWED_CATEGORIES = new Set([
  'none',
  'bootstrap_failed',
  'client_unconfigured',
  'transport_failed',
  'unexpected_status',
  'unexpected_result_shape',
  'replay_contract_failed',
  'persistence_contract_failed',
  'concurrency_contract_failed',
  'cross_process_contract_failed',
  'direct_access_contract_failed',
  'test_runner_failed',
  'receipt_invalid',
]);

const unsafeContentPattern = /(?:https?:\/\/|postgres(?:ql)?:\/\/|\b(?:bearer|cookie|token|secret|password|api[_-]?key|connection|endpoint|proof|fingerprint)\b|\b(?:select|insert|update|delete)\b)/i;

class JoinedReceiptInvalidError extends Error {
  constructor() {
    super('joined_receipt_invalid');
    this.name = 'JoinedReceiptInvalidError';
    this.code = 'joined_receipt_invalid';
  }
}

function invalidReceipt() {
  throw new JoinedReceiptInvalidError();
}

function validateReceiptShape(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidReceipt();

  const keys = Object.keys(value);
  if (keys.length !== RECEIPT_KEYS.length || keys.some((key, index) => key !== RECEIPT_KEYS[index])) {
    invalidReceipt();
  }
  if (value.schema_version !== 1) invalidReceipt();
  if (!ALLOWED_OUTCOMES.has(value.outcome)) invalidReceipt();
  if (!ALLOWED_PHASES.has(value.phase)) invalidReceipt();
  if (!ALLOWED_CATEGORIES.has(value.category)) invalidReceipt();
  if (!ALLOWED_EXIT_CODE_CLASSES.has(value.exit_code_class)) invalidReceipt();
  for (const key of ['signal', 'timeout', 'stdout_overflow', 'stderr_overflow']) {
    if (typeof value[key] !== 'boolean') invalidReceipt();
  }

  const postureFlags = [value.signal, value.timeout, value.stdout_overflow, value.stderr_overflow];
  const activePostureFlags = postureFlags.filter(Boolean).length;
  if (activePostureFlags > 1) invalidReceipt();

  if (value.outcome === 'passed') {
    if (
      value.phase !== 'complete' ||
      value.category !== 'none' ||
      value.exit_code_class !== 'zero' ||
      activePostureFlags !== 0
    ) {
      invalidReceipt();
    }
  } else {
    if (value.category === 'none' || value.exit_code_class !== 'nonzero') invalidReceipt();
  }

  if (value.signal && value.outcome !== 'failed') invalidReceipt();
  if (value.timeout && value.outcome !== 'failed') invalidReceipt();
  if ((value.stdout_overflow || value.stderr_overflow) && value.outcome !== 'failed') {
    invalidReceipt();
  }

  return value;
}

function serializeJoinedReceipt(value) {
  validateReceiptShape(value);
  return JSON.stringify(value);
}

function decodeUtf8(value) {
  try {
    if (Buffer.isBuffer(value)) {
      return new TextDecoder('utf-8', { fatal: true }).decode(value);
    }
    if (typeof value === 'string') return value;
  } catch {
    invalidReceipt();
  }
  invalidReceipt();
}

function parseJoinedReceiptOutput(value) {
  const raw = decodeUtf8(value);
  if (Buffer.byteLength(raw, 'utf8') > MAX_RECEIPT_BYTES) invalidReceipt();
  if (raw.split(RECEIPT_PREFIX).length - 1 !== 1) invalidReceipt();

  const withoutLineTerminator = raw.endsWith('\n') ? raw.slice(0, -1) : raw;
  if (!withoutLineTerminator || withoutLineTerminator.includes('\n') || withoutLineTerminator.includes('\r')) {
    invalidReceipt();
  }
  if (!withoutLineTerminator.startsWith(RECEIPT_PREFIX)) invalidReceipt();

  const payload = withoutLineTerminator.slice(RECEIPT_PREFIX.length);
  if (!payload || unsafeContentPattern.test(payload)) invalidReceipt();

  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    invalidReceipt();
  }

  if (JSON.stringify(parsed) !== payload) invalidReceipt();
  return validateReceiptShape(parsed);
}

function validateJoinedReceiptProcess(receipt, processResult) {
  validateReceiptShape(receipt);
  if (!processResult || typeof processResult !== 'object') invalidReceipt();

  const signal = typeof processResult.signal === 'string' ? processResult.signal : null;
  const exitCode = processResult.exitCode;
  const processIsZero = exitCode === 0 && signal === null;
  if (receipt.exit_code_class === 'zero' !== processIsZero) invalidReceipt();
  if (receipt.signal !== (signal !== null)) invalidReceipt();
  if (receipt.outcome === 'passed' && !processIsZero) invalidReceipt();
  if (receipt.outcome === 'failed' && processIsZero) invalidReceipt();
  return receipt;
}

function receipt(outcome, phase, category) {
  return {
    schema_version: 1,
    outcome,
    phase,
    category,
    exit_code_class: outcome === 'passed' ? 'zero' : 'nonzero',
    signal: false,
    timeout: false,
    stdout_overflow: false,
    stderr_overflow: false,
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_EXIT_CODE_CLASSES,
  ALLOWED_OUTCOMES,
  ALLOWED_PHASES,
  JOINED_STDOUT_LIMIT_BYTES,
  MAX_RECEIPT_BYTES,
  RECEIPT_KEYS,
  RECEIPT_PREFIX,
  JoinedReceiptInvalidError,
  parseJoinedReceiptOutput,
  receipt,
  serializeJoinedReceipt,
  validateJoinedReceiptProcess,
  validateReceiptShape,
};
