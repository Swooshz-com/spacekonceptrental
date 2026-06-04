import "server-only";

export type TranscriptAuditMetadataInput = Record<string, unknown>;

export type TranscriptAuditEventType =
  | "transcript_persistence_attempt"
  | "transcript_access_read"
  | "transcript_export_request"
  | "transcript_deletion_request"
  | "retention_expiry_processing"
  | "retention_cleanup_failure"
  | "admin_override"
  | "lifecycle_disable_rollback"
  | "operator_approval"
  | "evidence_capture";

export type TranscriptAuditActorType = "system" | "admin" | "operator";

export type TranscriptAuditResultStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "succeeded"
  | "failed"
  | "blocked"
  | "skipped";

export type TranscriptEvidenceType =
  | "approval_record"
  | "dry_run_proof"
  | "local_sql_rls_proof"
  | "static_guard_proof"
  | "rollback_disable_plan"
  | "post_action_verification"
  | "operator_approval"
  | "redaction_review";

export type TranscriptAuditEventCommandInput = {
  workspaceId?: string | null;
  conversationId?: string | null;
  quoteRequestId?: string | null;
  actorAdminUserId?: string | null;
  eventType?: TranscriptAuditEventType | string | null;
  actorType?: TranscriptAuditActorType | string | null;
  requestId?: string | null;
  approvalReference?: string | null;
  reasonCode?: string | null;
  resultStatus?: TranscriptAuditResultStatus | string | null;
  affectedRecordCount?: number | null;
  metadata?: TranscriptAuditMetadataInput | null;
};

export type TranscriptEvidenceRecordCommandInput = {
  workspaceId?: string | null;
  auditEventId?: string | null;
  evidenceType?: TranscriptEvidenceType | string | null;
  environmentLabel?: string | null;
  commitSha?: string | null;
  validationSummary?: string | null;
  dryRunSummary?: string | null;
  rollbackSummary?: string | null;
  operatorNotes?: string | null;
  metadata?: TranscriptAuditMetadataInput | null;
};

export type TranscriptAuditEventCommand = {
  workspaceId: string;
  eventType: TranscriptAuditEventType;
  actorType: TranscriptAuditActorType;
  resultStatus: TranscriptAuditResultStatus;
  metadata: TranscriptAuditMetadataInput;
  conversationId?: string;
  quoteRequestId?: string;
  actorAdminUserId?: string;
  requestId?: string;
  approvalReference?: string;
  reasonCode?: string;
  affectedRecordCount?: number;
};

export type TranscriptEvidenceRecordCommand = {
  workspaceId: string;
  evidenceType: TranscriptEvidenceType;
  metadata: TranscriptAuditMetadataInput;
  auditEventId?: string;
  environmentLabel?: string;
  commitSha?: string;
  validationSummary?: string;
  dryRunSummary?: string;
  rollbackSummary?: string;
  operatorNotes?: string;
};

export type TranscriptAuditRejectReason =
  | "input_invalid"
  | "payload_unsafe"
  | "workspace_id_missing"
  | "conversation_id_invalid"
  | "quote_request_id_invalid"
  | "actor_admin_user_id_invalid"
  | "audit_event_id_invalid"
  | "event_type_invalid"
  | "actor_type_invalid"
  | "result_status_invalid"
  | "evidence_type_invalid"
  | "request_id_invalid"
  | "approval_reference_invalid"
  | "reason_code_invalid"
  | "affected_record_count_invalid"
  | "environment_label_invalid"
  | "commit_sha_invalid"
  | "evidence_text_invalid"
  | "evidence_text_unsafe"
  | "metadata_invalid"
  | "metadata_too_large"
  | "metadata_unsafe_key";

export type TranscriptAuditCommandRejectedResult = {
  ok: false;
  status: "rejected";
  reason: TranscriptAuditRejectReason;
};

export type TranscriptAuditEventCommandResult =
  | {
      ok: true;
      command: TranscriptAuditEventCommand;
    }
  | TranscriptAuditCommandRejectedResult;

export type TranscriptEvidenceRecordCommandResult =
  | {
      ok: true;
      command: TranscriptEvidenceRecordCommand;
    }
  | TranscriptAuditCommandRejectedResult;

export type TranscriptAuditAdapterFailureReason =
  | "adapter_rejected"
  | "adapter_unavailable"
  | "adapter_failed";

export type TranscriptAuditEventAdapterResult =
  | {
      ok: true;
      auditEventId: string;
    }
  | {
      ok: false;
      reason: TranscriptAuditAdapterFailureReason;
    };

export type TranscriptEvidenceRecordAdapterResult =
  | {
      ok: true;
      evidenceRecordId: string;
    }
  | {
      ok: false;
      reason: TranscriptAuditAdapterFailureReason;
    };

export type TranscriptAuditAdapter = {
  recordAuditEvent(
    command: TranscriptAuditEventCommand
  ): TranscriptAuditEventAdapterResult | Promise<TranscriptAuditEventAdapterResult>;
  recordEvidenceRecord(
    command: TranscriptEvidenceRecordCommand
  ):
    | TranscriptEvidenceRecordAdapterResult
    | Promise<TranscriptEvidenceRecordAdapterResult>;
};

export type TranscriptAuditDependencies = {
  adapter?: TranscriptAuditAdapter;
};

export type TranscriptAuditUnavailableResult = {
  ok: false;
  status: "unavailable";
  reason: "transcript_audit_unavailable";
};

export type TranscriptAuditEventRecordedResult = {
  ok: true;
  status: "recorded";
  auditEventId: string;
};

export type TranscriptEvidenceRecordRecordedResult = {
  ok: true;
  status: "recorded";
  evidenceRecordId: string;
};

export type TranscriptAuditEventRecordResult =
  | TranscriptAuditEventRecordedResult
  | TranscriptAuditUnavailableResult
  | TranscriptAuditCommandRejectedResult;

export type TranscriptEvidenceRecordResult =
  | TranscriptEvidenceRecordRecordedResult
  | TranscriptAuditUnavailableResult
  | TranscriptAuditCommandRejectedResult;
