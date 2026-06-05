import { describe, expect, it, vi } from "vitest";
import {
  createRpcTranscriptAuditAdapter,
  recordTranscriptAuditEvent,
  recordTranscriptEvidenceRecord,
  type TranscriptAuditEventCommandInput,
  type TranscriptAuditEventRpcPayload,
  type TranscriptEvidenceRecordCommandInput,
  type TranscriptEvidenceRecordRpcPayload
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
    eventType: "evidence_capture",
    actorType: "operator",
    requestId: "request-2e-i",
    approvalReference: "approval-2e-i",
    reasonCode: "local_insert_boundary",
    resultStatus: "succeeded",
    affectedRecordCount: 1,
    metadata: {
      source: "rpc-adapter-test"
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
    commitSha: "8607e16d3c405df0797ec08536cce79f1b4f68d2",
    validationSummary: "Local SQL and RLS proof placeholder.",
    dryRunSummary: "Dry-run placeholder.",
    rollbackSummary: "Rollback placeholder.",
    operatorNotes: "Operator note placeholder.",
    metadata: {
      source: "rpc-adapter-test"
    },
    ...overrides
  };
}

describe("Phase 2E-I RPC transcript audit/evidence adapter", () => {
  it("maps validated audit and evidence commands into injected RPC executor payloads", async () => {
    const executor = {
      insertTranscriptAuditEvent: vi.fn(
        async (_payload: TranscriptAuditEventRpcPayload) => ({
          ok: true as const,
          auditEventId
        })
      ),
      insertTranscriptEvidenceRecord: vi.fn(
        async (_payload: TranscriptEvidenceRecordRpcPayload) => ({
          ok: true as const,
          evidenceRecordId
        })
      )
    };
    const adapter = createRpcTranscriptAuditAdapter({ executor });

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

    expect(executor.insertTranscriptAuditEvent).toHaveBeenCalledWith({
      p_workspace_id: workspaceId,
      p_event: {
        workspace_id: workspaceId,
        conversation_id: conversationId,
        quote_request_id: quoteRequestId,
        actor_admin_user_id: adminUserId,
        event_type: "evidence_capture",
        actor_type: "operator",
        request_id: "request-2e-i",
        approval_reference: "approval-2e-i",
        reason_code: "local_insert_boundary",
        result_status: "succeeded",
        affected_record_count: 1,
        metadata: {
          source: "rpc-adapter-test"
        }
      }
    });
    expect(executor.insertTranscriptEvidenceRecord).toHaveBeenCalledWith({
      p_workspace_id: workspaceId,
      p_evidence: {
        workspace_id: workspaceId,
        audit_event_id: auditEventId,
        evidence_type: "local_sql_rls_proof",
        environment_label: "local",
        commit_sha: "8607e16d3c405df0797ec08536cce79f1b4f68d2",
        validation_summary: "Local SQL and RLS proof placeholder.",
        dry_run_summary: "Dry-run placeholder.",
        rollback_summary: "Rollback placeholder.",
        operator_notes: "Operator note placeholder.",
        metadata: {
          source: "rpc-adapter-test"
        }
      }
    });
  });

  it("stays unavailable without an executor and maps executor failures safely", async () => {
    await expect(
      recordTranscriptAuditEvent(validAuditInput(), {
        adapter: createRpcTranscriptAuditAdapter()
      })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_audit_unavailable"
    });

    const failingExecutor = {
      insertTranscriptAuditEvent: vi.fn(
        async (_payload: TranscriptAuditEventRpcPayload) => ({
          ok: false as const,
          reason: "rpc_failed" as const
        })
      ),
      insertTranscriptEvidenceRecord: vi.fn(
        async (_payload: TranscriptEvidenceRecordRpcPayload) => {
          throw new Error("leaked service-role token and webhook headers");
        }
      )
    };
    const adapter = createRpcTranscriptAuditAdapter({
      executor: failingExecutor
    });

    const auditResult = await recordTranscriptAuditEvent(validAuditInput(), {
      adapter
    });
    const evidenceResult = await recordTranscriptEvidenceRecord(
      validEvidenceInput(),
      { adapter }
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
      "service-role"
    );
    expect(JSON.stringify({ auditResult, evidenceResult })).not.toContain(
      "webhook headers"
    );
  });

  it("rejects malformed input, unsafe metadata, and unsafe evidence text before executor calls", async () => {
    const executor = {
      insertTranscriptAuditEvent: vi.fn(
        async (_payload: TranscriptAuditEventRpcPayload) => ({
          ok: true as const,
          auditEventId
        })
      ),
      insertTranscriptEvidenceRecord: vi.fn(
        async (_payload: TranscriptEvidenceRecordRpcPayload) => ({
          ok: true as const,
          evidenceRecordId
        })
      )
    };
    const adapter = createRpcTranscriptAuditAdapter({ executor });

    await expect(
      recordTranscriptAuditEvent(42 as TranscriptAuditEventCommandInput, {
        adapter
      })
    ).resolves.toMatchObject({
      ok: false,
      status: "rejected",
      reason: "input_invalid"
    });

    for (const unsafeKey of [
      "fullTranscript",
      "transcriptContent",
      "providerPayload",
      "webhookHeaders",
      "cookie",
      "token",
      "credential",
      "serviceRole",
      "customerVisibleInternalNotes"
    ]) {
      await expect(
        recordTranscriptAuditEvent(
          validAuditInput({
            metadata: {
              nested: {
                [unsafeKey]: "blocked"
              }
            }
          }),
          { adapter }
        ),
        unsafeKey
      ).resolves.toMatchObject({
        ok: false,
        status: "rejected",
        reason: "metadata_unsafe_key"
      });
      await expect(
        recordTranscriptEvidenceRecord(
          validEvidenceInput({
            metadata: {
              nested: {
                [unsafeKey]: "blocked"
              }
            }
          }),
          { adapter }
        ),
        unsafeKey
      ).resolves.toMatchObject({
        ok: false,
        status: "rejected",
        reason: "metadata_unsafe_key"
      });
    }

    await expect(
      recordTranscriptEvidenceRecord(
        validEvidenceInput({
          validationSummary: "provider payload and service-role token"
        }),
        { adapter }
      )
    ).resolves.toMatchObject({
      ok: false,
      status: "rejected",
      reason: "evidence_text_unsafe"
    });
    await expect(
      recordTranscriptEvidenceRecord(
        validEvidenceInput({
          validationSummary: "x".repeat(2_001)
        }),
        { adapter }
      )
    ).resolves.toMatchObject({
      ok: false,
      status: "rejected",
      reason: "evidence_text_invalid"
    });

    expect(executor.insertTranscriptAuditEvent).not.toHaveBeenCalled();
    expect(executor.insertTranscriptEvidenceRecord).not.toHaveBeenCalled();
  });
});
