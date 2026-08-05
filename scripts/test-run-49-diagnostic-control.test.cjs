const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  DIAGNOSTIC_CONTROL_ENV_KEY,
  MAX_DIAGNOSTIC_CONTROL_BYTES,
  assertDiagnosticControlIdentity,
  createDiagnosticControl,
  readDiagnosticControl,
  removeDiagnosticControl,
  writeSessionClientDiagnostic,
} = require('./run-49-diagnostic-control.cjs');
const {
  SESSION_CLIENT_DIAGNOSTIC_STATES,
} = require('./run-54-session-client-runner.cjs');

function createFixture() {
  const control = createDiagnosticControl();
  return {
    control,
    filePath: control.filePath,
    cleanup: () => removeDiagnosticControl({ dir: control.dir }),
  };
}

function assertInvalid(callback) {
  assert.throws(callback, (error) =>
    error.code === 'diagnostic_control_invalid' &&
    error.message === 'diagnostic_control_invalid',
  );
}

function rawWrite(filePath, content) {
  fs.writeFileSync(filePath, content, { flag: 'w' });
}

test('diagnostic control accepts a closed valid record and enforces identity', () => {
  const fixture = createFixture();
  try {
    const written = writeSessionClientDiagnostic(
      SESSION_CLIENT_DIAGNOSTIC_STATES[0],
      { filePath: fixture.filePath },
    );
    assert.deepEqual(written, {
      phase: SESSION_CLIENT_DIAGNOSTIC_STATES[0].phase,
      category: SESSION_CLIENT_DIAGNOSTIC_STATES[0].category,
    });
    assert.deepEqual(
      readDiagnosticControl({ filePath: fixture.filePath }),
      {
        phase: SESSION_CLIENT_DIAGNOSTIC_STATES[0].phase,
        category: SESSION_CLIENT_DIAGNOSTIC_STATES[0].category,
      },
    );
    assert.doesNotThrow(() =>
      assertDiagnosticControlIdentity({ filePath: fixture.filePath }),
    );
    assert.equal(fs.statSync(fixture.filePath).isFile(), true);
  } finally {
    fixture.cleanup();
  }
});

test('missing and empty control files report no diagnostic', () => {
  const fixture = createFixture();
  try {
    assert.equal(
      readDiagnosticControl({ filePath: fixture.filePath, required: false }),
      null,
    );
    assert.equal(
      readDiagnosticControl({ filePath: path.join(fixture.control.dir, 'missing.json'), required: false }),
      null,
    );
    assertInvalid(() =>
      readDiagnosticControl({ filePath: path.join(fixture.control.dir, 'missing.json'), required: true }),
    );
    assertInvalid(() => readDiagnosticControl({ filePath: '', required: true }));
  } finally {
    fixture.cleanup();
  }
});

test('unknown phases, unknown categories and invalid pairs are rejected', () => {
  for (const bad of [
    { schemaVersion: 1, phase: 'unknown_phase', category: 'rpc_execution_denied' },
    { schemaVersion: 1, phase: 'rpc_execution', category: 'unknown_category' },
    { schemaVersion: 1, phase: 'rpc_execution', category: 'case_execution_failed' },
    { schemaVersion: 1, phase: 'case_execution', category: 'none' },
    { schemaVersion: 1, phase: 'final_receipt', category: 'final_receipt_invalid' },
  ]) {
    const fixture = createFixture();
    try {
      assertInvalid(() =>
        writeSessionClientDiagnostic(bad, { filePath: fixture.filePath }),
      );
    } finally {
      fixture.cleanup();
    }
  }
});

test('duplicate, conflicting and malformed control records are rejected', () => {
  const fixture = createFixture();
  try {
    writeSessionClientDiagnostic(SESSION_CLIENT_DIAGNOSTIC_STATES[0], {
      filePath: fixture.filePath,
    });
    assertInvalid(() =>
      writeSessionClientDiagnostic(SESSION_CLIENT_DIAGNOSTIC_STATES[0], {
        filePath: fixture.filePath,
      }),
    );
    assertInvalid(() =>
      writeSessionClientDiagnostic(SESSION_CLIENT_DIAGNOSTIC_STATES[1], {
        filePath: fixture.filePath,
      }),
    );
  } finally {
    fixture.cleanup();
  }

  const conflicting = createFixture();
  try {
    rawWrite(
      conflicting.filePath,
      `${JSON.stringify({ schemaVersion: 1, phase: 'rpc_execution', category: 'rpc_execution_denied' })}\n` +
        `${JSON.stringify({ schemaVersion: 1, phase: 'rpc_result', category: 'rpc_result_invalid' })}\n`,
    );
    assertInvalid(() =>
      readDiagnosticControl({ filePath: conflicting.filePath }),
    );
  } finally {
    conflicting.cleanup();
  }

  const duplicate = createFixture();
  try {
    rawWrite(
      duplicate.filePath,
      `${JSON.stringify({ schemaVersion: 1, phase: 'rpc_execution', category: 'rpc_execution_denied' })}\n` +
        `${JSON.stringify({ schemaVersion: 1, phase: 'rpc_execution', category: 'rpc_execution_denied' })}\n`,
    );
    assertInvalid(() => readDiagnosticControl({ filePath: duplicate.filePath }));
  } finally {
    duplicate.cleanup();
  }

  for (const malformed of [
    '{not json}\n',
    'null\n',
    '[1,2,3]\n',
    '"text"\n',
    JSON.stringify({ schemaVersion: 1, phase: 'rpc_execution', category: 'rpc_execution_denied', extra: true }) + '\n',
    JSON.stringify({ schemaVersion: 2, phase: 'rpc_execution', category: 'rpc_execution_denied' }) + '\n',
    '{"schemaVersion":1,"phase":"rpc_execution","category":"rpc_execution_denied"}\nline2\n',
  ]) {
    const bad = createFixture();
    try {
      rawWrite(bad.filePath, malformed);
      assertInvalid(() => readDiagnosticControl({ filePath: bad.filePath }));
    } finally {
      bad.cleanup();
    }
  }

  const whitespace = createFixture();
  try {
    rawWrite(whitespace.filePath, '\n  \n');
    assert.equal(readDiagnosticControl({ filePath: whitespace.filePath }), null);
  } finally {
    whitespace.cleanup();
  }
});

test('oversized and non-file control targets are rejected', () => {
  const fixture = createFixture();
  try {
    rawWrite(fixture.filePath, `${'x'.repeat(MAX_DIAGNOSTIC_CONTROL_BYTES + 1)}\n`);
    assertInvalid(() => readDiagnosticControl({ filePath: fixture.filePath }));
  } finally {
    fixture.cleanup();
  }

  const dir = createFixture();
  try {
    assertInvalid(() =>
      readDiagnosticControl({ filePath: dir.control.dir }),
    );
    assertInvalid(() =>
      assertDiagnosticControlIdentity({ filePath: dir.control.dir }),
    );
  } finally {
    dir.cleanup();
  }
});

test('marker strings written to ordinary output files are never admitted', () => {
  const fixture = createFixture();
  try {
    const marker = `run49_session_client_diagnostic:${SESSION_CLIENT_DIAGNOSTIC_STATES[0].phase}:${SESSION_CLIENT_DIAGNOSTIC_STATES[0].category}`;
    const stderrLog = path.join(fixture.control.dir, 'stderr.log');
    const stdoutLog = path.join(fixture.control.dir, 'stdout.log');
    rawWrite(stderrLog, `${marker}\n`);
    rawWrite(stdoutLog, marker);
    assert.equal(readDiagnosticControl({ filePath: fixture.filePath }), null);
    assertInvalid(() => readDiagnosticControl({ filePath: stderrLog }));
    assertInvalid(() => readDiagnosticControl({ filePath: stdoutLog }));
  } finally {
    fixture.cleanup();
  }
});

test('every genuine harness failure state maps to its closed pair', () => {
  const fixture = createFixture();
  try {
    for (const state of SESSION_CLIENT_DIAGNOSTIC_STATES) {
      rawWrite(fixture.filePath, '');
      writeSessionClientDiagnostic(state, { filePath: fixture.filePath });
      assert.deepEqual(
        readDiagnosticControl({ filePath: fixture.filePath }),
        { phase: state.phase, category: state.category },
      );
    }
  } finally {
    fixture.cleanup();
  }
});

test('diagnostic control fixtures never persist', () => {
  const fixture = createFixture();
  const dir = fixture.control.dir;
  assert.equal(fs.existsSync(dir), true);
  fixture.cleanup();
  assert.equal(fs.existsSync(dir), false);
});

test('the control channel environment key is fixed', () => {
  assert.equal(DIAGNOSTIC_CONTROL_ENV_KEY, 'RUN49_DIAGNOSTIC_CONTROL_FILE');
  assert.equal(typeof os.tmpdir(), 'string');
});
