import { describe, expect, it, vi } from "vitest";
import {
  createTranscriptAuditEventCommand,
  createTranscriptEvidenceRecordCommand,
  getTranscriptAuditAdapter,
  recordTranscriptAuditEvent,
  recordTranscriptEvidenceRecord,
  type TranscriptAuditEventCommandInput,
  type TranscriptEvidenceRecordCommandInput
} from "./index";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const conversationId = "22222222-2222-4222-8222-222222222222";
const quoteRequestId = "33333333-3333-4333-8333-333333333333";
const adminUserId = "44444444-4444-4444-8444-444444444444";
const auditEventId = "55555555-5555-4555-8555-555555555555";
const evidenceRecordId = "66666666-6666-4666-8666-666666666666";

function validAuditInput(
  overrides: Partial<TranscriptAuditEventCommandInput> = {}
): TranscriptAuditEventCommandInput {
  return {
    workspaceId,
    conversationId,
    quoteRequestId,
    actorAdminUserId: adminUserId,
    eventType: "transcript_persistence_attempt",
    actorType: "system",
    requestId: "request-2e-h",
    approvalReference: "approval-2e-h",
    reasonCode: "local_contract_test",
    resultStatus: "succeeded",
    affectedRecordCount: 1,
    metadata: {
      source: "contract-test"
    },
    ...overrides
  };
}

function validEvidenceInput(
  overrides: Partial<TranscriptEvidenceRecordCommandInput> = {}
): TranscriptEvidenceRecordCommandInput {
  return {
    workspaceId,
    auditEventId,
    evidenceType: "local_sql_rls_proof",
    environmentLabel: "local",
    commitSha: "a59547130c33ec56e275dfdee48ceac9a1f8587f",
    validationSummary: "Local SQL and RLS proof placeholder.",
    dryRunSummary: "Dry-run placeholder.",
    rollbackSummary: "Rollback placeholder.",
    operatorNotes: "Operator note placeholder.",
    metadata: {
      source: "contract-test"
    },
    ...overrides
  };
}

const unsafeDiagnosticMetadataCases = [
  {
    name: "nested providerDebug",
    metadata: { nested: { providerDebug: "blocked" } }
  },
  {
    name: "nested provider_debug",
    metadata: { nested: { provider_debug: "blocked" } }
  },
  {
    name: "nested traceDump",
    metadata: { nested: { traceDump: "blocked" } }
  },
  {
    name: "nested trace_dump",
    metadata: { nested: { trace_dump: "blocked" } }
  }
];

describe("Phase 2E-H transcript audit/evidence contract", () => {
  it("builds minimized audit event and evidence commands", () => {
    expect(createTranscriptAuditEventCommand(validAuditInput())).toEqual({
      ok: true,
      command: {
        workspaceId,
        conversationId,
        quoteRequestId,
        actorAdminUserId: adminUserId,
        eventType: "transcript_persistence_attempt",
        actorType: "system",
        requestId: "request-2e-h",
        approvalReference: "approval-2e-h",
        reasonCode: "local_contract_test",
        resultStatus: "succeeded",
        affectedRecordCount: 1,
        metadata: {
          source: "contract-test"
        }
      }
    });

    expect(createTranscriptEvidenceRecordCommand(validEvidenceInput())).toEqual(
      {
        ok: true,
        command: {
          workspaceId,
          auditEventId,
          evidenceType: "local_sql_rls_proof",
          environmentLabel: "local",
          commitSha: "a59547130c33ec56e275dfdee48ceac9a1f8587f",
          validationSummary: "Local SQL and RLS proof placeholder.",
          dryRunSummary: "Dry-run placeholder.",
          rollbackSummary: "Rollback placeholder.",
          operatorNotes: "Operator note placeholder.",
          metadata: {
            source: "contract-test"
          }
        }
      }
    );
  });

  it("safely rejects malformed audit event commands", () => {
    const cases: Array<{
      name: string;
      input: unknown;
      reason: string;
    }> = [
      {
        name: "unknown input",
        input: 42,
        reason: "input_invalid"
      },
      {
        name: "missing workspace",
        input: validAuditInput({ workspaceId: "" }),
        reason: "workspace_id_missing"
      },
      {
        name: "invalid event",
        input: validAuditInput({ eventType: "write_everything" }),
        reason: "event_type_invalid"
      },
      {
        name: "invalid actor",
        input: validAuditInput({ actorType: "customer" }),
        reason: "actor_type_invalid"
      },
      {
        name: "invalid result",
        input: validAuditInput({ resultStatus: "visible_to_customer" }),
        reason: "result_status_invalid"
      },
      {
        name: "negative count",
        input: validAuditInput({ affectedRecordCount: -1 }),
        reason: "affected_record_count_invalid"
      },
      {
        name: "unsafe top-level payload",
        input: {
          ...validAuditInput(),
          rawProviderPayload: {
            token: "sk-secret"
          }
        },
        reason: "payload_unsafe"
      },
      {
        name: "unsafe top-level transcript",
        input: {
          ...validAuditInput(),
          fullTranscript: "copying the transcript is blocked"
        },
        reason: "payload_unsafe"
      },
      {
        name: "unsafe metadata key",
        input: validAuditInput({
          metadata: {
            nested: {
              apiKey: "blocked"
            }
          }
        }),
        reason: "metadata_unsafe_key"
      },
      {
        name: "unsafe customer-visible internal notes metadata key",
        input: validAuditInput({
          metadata: {
            customerVisibleInternalNotes: "blocked"
          }
        }),
        reason: "metadata_unsafe_key"
      }
    ];

    for (const testCase of cases) {
      expect(() =>
        createTranscriptAuditEventCommand(
          testCase.input as TranscriptAuditEventCommandInput
        )
      ).not.toThrow();

      expect(
        createTranscriptAuditEventCommand(
          testCase.input as TranscriptAuditEventCommandInput
        ),
        testCase.name
      ).toMatchObject({
        ok: false,
        status: "rejected",
        reason: testCase.reason
      });
    }
  });

  it("safely rejects malformed evidence commands", () => {
    const cases: Array<{
      name: string;
      input: unknown;
      reason: string;
    }> = [
      {
        name: "unknown input",
        input: null,
        reason: "input_invalid"
      },
      {
        name: "missing workspace",
        input: validEvidenceInput({ workspaceId: "" }),
        reason: "workspace_id_missing"
      },
      {
        name: "invalid audit event id",
        input: validEvidenceInput({ auditEventId: "audit-event" }),
        reason: "audit_event_id_invalid"
      },
      {
        name: "invalid evidence type",
        input: validEvidenceInput({ evidenceType: "production_evidence" }),
        reason: "evidence_type_invalid"
      },
      {
        name: "unsafe summary text",
        input: validEvidenceInput({
          validationSummary: "raw provider payload and service-role token"
        }),
        reason: "evidence_text_unsafe"
      },
      {
        name: "unsafe top-level transcript",
        input: {
          ...validEvidenceInput(),
          fullTranscript: "copying the transcript is blocked"
        },
        reason: "payload_unsafe"
      },
      {
        name: "unsafe metadata key",
        input: validEvidenceInput({
          metadata: {
            privateKey: "blocked"
          }
        }),
        reason: "metadata_unsafe_key"
      },
      {
        name: "unsafe service-role metadata key",
        input: validEvidenceInput({
          metadata: {
            serviceRole: "blocked"
          }
        }),
        reason: "metadata_unsafe_key"
      },
      {
        name: "unsafe customer-visible internal notes metadata key",
        input: validEvidenceInput({
          metadata: {
            customerVisibleInternalNotes: "blocked"
          }
        }),
        reason: "metadata_unsafe_key"
      }
    ];

    for (const testCase of cases) {
      expect(() =>
        createTranscriptEvidenceRecordCommand(
          testCase.input as TranscriptEvidenceRecordCommandInput
        )
      ).not.toThrow();

      expect(
        createTranscriptEvidenceRecordCommand(
          testCase.input as TranscriptEvidenceRecordCommandInput
        ),
        testCase.name
      ).toMatchObject({
        ok: false,
        status: "rejected",
        reason: testCase.reason
      });
    }
  });

  it("rejects diagnostic metadata keys before adapter calls", async () => {
    const adapter = {
      recordAuditEvent: vi.fn(async (_command: unknown) => ({
        ok: true as const,
        auditEventId
      })),
      recordEvidenceRecord: vi.fn(async (_command: unknown) => ({
        ok: true as const,
        evidenceRecordId
      }))
    };

    for (const testCase of unsafeDiagnosticMetadataCases) {
      expect(
        createTranscriptAuditEventCommand(
          validAuditInput({ metadata: testCase.metadata })
        ),
        `audit command ${testCase.name}`
      ).toMatchObject({
        ok: false,
        status: "rejected",
        reason: "metadata_unsafe_key"
      });
      await expect(
        recordTranscriptAuditEvent(
          validAuditInput({ metadata: testCase.metadata }),
          { adapter }
        ),
        `audit record ${testCase.name}`
      ).resolves.toMatchObject({
        ok: false,
        status: "rejected",
        reason: "metadata_unsafe_key"
      });

      expect(
        createTranscriptEvidenceRecordCommand(
          validEvidenceInput({ metadata: testCase.metadata })
        ),
        `evidence command ${testCase.name}`
      ).toMatchObject({
        ok: false,
        status: "rejected",
        reason: "metadata_unsafe_key"
      });
      await expect(
        recordTranscriptEvidenceRecord(
          validEvidenceInput({ metadata: testCase.metadata }),
          { adapter }
        ),
        `evidence record ${testCase.name}`
      ).resolves.toMatchObject({
        ok: false,
        status: "rejected",
        reason: "metadata_unsafe_key"
      });
    }

    expect(adapter.recordAuditEvent).not.toHaveBeenCalled();
    expect(adapter.recordEvidenceRecord).not.toHaveBeenCalled();
  });

  it("defaults to unavailable and only records through an injected adapter", async () => {
    await expect(
      recordTranscriptAuditEvent(validAuditInput(), {
        adapter: getTranscriptAuditAdapter()
      })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_audit_unavailable"
    });

    const adapter = {
      recordAuditEvent: vi.fn(async (_command: unknown) => ({
        ok: true as const,
        auditEventId
      })),
      recordEvidenceRecord: vi.fn(async (_command: unknown) => ({
        ok: true as const,
        evidenceRecordId
      }))
    };

    await expect(
      recordTranscriptAuditEvent(validAuditInput(), { adapter })
    ).resolves.toEqual({
      ok: true,
      status: "recorded",
      auditEventId
    });
    await expect(
      recordTranscriptEvidenceRecord(validEvidenceInput(), { adapter })
    ).resolves.toEqual({
      ok: true,
      status: "recorded",
      evidenceRecordId
    });

    expect(adapter.recordAuditEvent).toHaveBeenCalledTimes(1);
    expect(adapter.recordEvidenceRecord).toHaveBeenCalledTimes(1);
  });

  it("does not leak validation or adapter exceptions", async () => {
    const circularMetadata: Record<string, unknown> = {};
    circularMetadata.self = circularMetadata;

    await expect(
      recordTranscriptAuditEvent(
        validAuditInput({ metadata: circularMetadata }),
        {}
      )
    ).resolves.toMatchObject({
      ok: false,
      status: "rejected",
      reason: "metadata_invalid"
    });

    const throwingAdapter = {
      recordAuditEvent: vi.fn(async (_command: unknown) => {
        throw new Error("leaked sk-secret service-role webhook URL");
      }),
      recordEvidenceRecord: vi.fn(async (_command: unknown) => {
        throw new Error("leaked private key");
      })
    };

    const auditResult = await recordTranscriptAuditEvent(validAuditInput(), {
      adapter: throwingAdapter
    });
    const evidenceResult = await recordTranscriptEvidenceRecord(
      validEvidenceInput(),
      { adapter: throwingAdapter }
    );

    expect(auditResult).toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_audit_unavailable"
    });
    expect(evidenceResult).toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_audit_unavailable"
    });
    expect(JSON.stringify({ auditResult, evidenceResult })).not.toContain(
      "sk-secret"
    );
    expect(JSON.stringify({ auditResult, evidenceResult })).not.toContain(
      "private key"
    );
  });
});
