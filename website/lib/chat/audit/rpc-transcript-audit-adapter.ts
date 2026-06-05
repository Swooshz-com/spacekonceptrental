import "server-only";

import type {
  TranscriptAuditAdapter,
  TranscriptAuditEventAdapterResult,
  TranscriptAuditEventCommand,
  TranscriptAuditEventRpcPayload,
  TranscriptAuditRpcAdapterDependencies,
  TranscriptEvidenceRecordAdapterResult,
  TranscriptEvidenceRecordCommand,
  TranscriptEvidenceRecordRpcPayload
} from "./types";

const unavailableAuditResult: TranscriptAuditEventAdapterResult = {
  ok: false,
  reason: "adapter_unavailable"
};

const failedAuditResult: TranscriptAuditEventAdapterResult = {
  ok: false,
  reason: "adapter_failed"
};

const unavailableEvidenceResult: TranscriptEvidenceRecordAdapterResult = {
  ok: false,
  reason: "adapter_unavailable"
};

const failedEvidenceResult: TranscriptEvidenceRecordAdapterResult = {
  ok: false,
  reason: "adapter_failed"
};

function toAuditEventRpcPayload(
  command: TranscriptAuditEventCommand
): TranscriptAuditEventRpcPayload {
  return {
    p_workspace_id: command.workspaceId,
    p_event: {
      workspace_id: command.workspaceId,
      conversation_id: command.conversationId ?? null,
      quote_request_id: command.quoteRequestId ?? null,
      actor_admin_user_id: command.actorAdminUserId ?? null,
      event_type: command.eventType,
      actor_type: command.actorType,
      request_id: command.requestId ?? null,
      approval_reference: command.approvalReference ?? null,
      reason_code: command.reasonCode ?? null,
      result_status: command.resultStatus,
      affected_record_count: command.affectedRecordCount ?? null,
      metadata: command.metadata
    }
  };
}

function toEvidenceRecordRpcPayload(
  command: TranscriptEvidenceRecordCommand
): TranscriptEvidenceRecordRpcPayload {
  return {
    p_workspace_id: command.workspaceId,
    p_evidence: {
      workspace_id: command.workspaceId,
      audit_event_id: command.auditEventId ?? null,
      evidence_type: command.evidenceType,
      environment_label: command.environmentLabel ?? null,
      commit_sha: command.commitSha ?? null,
      validation_summary: command.validationSummary ?? null,
      dry_run_summary: command.dryRunSummary ?? null,
      rollback_summary: command.rollbackSummary ?? null,
      operator_notes: command.operatorNotes ?? null,
      metadata: command.metadata
    }
  };
}

export function createRpcTranscriptAuditAdapter(
  dependencies: TranscriptAuditRpcAdapterDependencies = {}
): TranscriptAuditAdapter {
  return {
    async recordAuditEvent(command) {
      if (!dependencies.executor) {
        return unavailableAuditResult;
      }

      try {
        const result = await dependencies.executor.insertTranscriptAuditEvent(
          toAuditEventRpcPayload(command)
        );

        if (!result.ok) {
          return result.reason === "rpc_unavailable"
            ? unavailableAuditResult
            : failedAuditResult;
        }

        return {
          ok: true,
          auditEventId: result.auditEventId
        };
      } catch {
        return failedAuditResult;
      }
    },

    async recordEvidenceRecord(command) {
      if (!dependencies.executor) {
        return unavailableEvidenceResult;
      }

      try {
        const result =
          await dependencies.executor.insertTranscriptEvidenceRecord(
            toEvidenceRecordRpcPayload(command)
          );

        if (!result.ok) {
          return result.reason === "rpc_unavailable"
            ? unavailableEvidenceResult
            : failedEvidenceResult;
        }

        return {
          ok: true,
          evidenceRecordId: result.evidenceRecordId
        };
      } catch {
        return failedEvidenceResult;
      }
    }
  };
}
