import "server-only";

import type {
  TranscriptAuditActorType,
  TranscriptAuditDependencies,
  TranscriptAuditEventAdapterResult,
  TranscriptAuditEventCommand,
  TranscriptAuditEventCommandInput,
  TranscriptAuditEventCommandResult,
  TranscriptAuditEventRecordResult,
  TranscriptAuditEventType,
  TranscriptAuditMetadataInput,
  TranscriptAuditRejectReason,
  TranscriptAuditResultStatus,
  TranscriptEvidenceRecordAdapterResult,
  TranscriptEvidenceRecordCommand,
  TranscriptEvidenceRecordCommandInput,
  TranscriptEvidenceRecordCommandResult,
  TranscriptEvidenceRecordResult,
  TranscriptEvidenceType
} from "./types";

const MAX_METADATA_BYTES = 4_096;
const MAX_SHORT_TEXT_LENGTH = 128;
const MAX_ENVIRONMENT_LABEL_LENGTH = 64;
const MAX_EVIDENCE_TEXT_LENGTH = 2_000;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const commitShaPattern = /^[0-9a-f]{7,64}$/;

const auditEventTypes = new Set<TranscriptAuditEventType>([
  "transcript_persistence_attempt",
  "transcript_access_read",
  "transcript_export_request",
  "transcript_deletion_request",
  "retention_expiry_processing",
  "retention_cleanup_failure",
  "admin_override",
  "lifecycle_disable_rollback",
  "operator_approval",
  "evidence_capture"
]);

const actorTypes = new Set<TranscriptAuditActorType>([
  "system",
  "admin",
  "operator"
]);

const resultStatuses = new Set<TranscriptAuditResultStatus>([
  "requested",
  "approved",
  "rejected",
  "succeeded",
  "failed",
  "blocked",
  "skipped"
]);

const evidenceTypes = new Set<TranscriptEvidenceType>([
  "approval_record",
  "dry_run_proof",
  "local_sql_rls_proof",
  "static_guard_proof",
  "rollback_disable_plan",
  "post_action_verification",
  "operator_approval",
  "redaction_review"
]);

const unsafePayloadKeyPattern =
  /full[_-]?transcript|transcript[_-]?content|raw[_-]?provider[_-]?payload|provider[_-]?payload|debug[_-]?payload|workflow[_-]?payload|webhook|headers?|raw[_-]?headers?|tokens?|authorization|cookie|credentials?|private[_-]?key|secret|password|api[_-]?key|service[_-]?role|customer[_-]?visible[_-]?internal[_-]?notes/i;

const unsafeEvidenceTextPattern =
  /full[_ -]?transcript|raw[_ -]?provider|provider[_ -]?payload|workflow[_ -]?payload|webhook|headers?|cookies?|tokens?|authorization|credentials?|private[_ -]?key|secret|password|api[_ -]?key|service[_ -]?role/i;

type RequiredStringResult =
  | { ok: true; value: string }
  | { ok: false; reason: TranscriptAuditRejectReason };

type OptionalStringResult =
  | { ok: true; value?: string }
  | { ok: false; reason: TranscriptAuditRejectReason };

type MetadataValidationResult =
  | { ok: true; metadata: TranscriptAuditMetadataInput }
  | { ok: false; reason: TranscriptAuditRejectReason };

type OptionalNumberResult =
  | { ok: true; value?: number }
  | { ok: false; reason: TranscriptAuditRejectReason };

function reject(
  reason: TranscriptAuditRejectReason
): Extract<TranscriptAuditEventCommandResult, { ok: false }> {
  return {
    ok: false,
    status: "rejected",
    reason
  };
}

function unavailable() {
  return {
    ok: false,
    status: "unavailable",
    reason: "transcript_audit_unavailable"
  } as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getJsonByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function hasUnsafeMetadataKey(
  value: unknown,
  seen = new WeakSet<object>()
): boolean {
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return false;
    }

    seen.add(value);
    return value.some((item) => hasUnsafeMetadataKey(item, seen));
  }

  if (!isRecord(value)) {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  seen.add(value);
  return Object.entries(value).some(
    ([key, nestedValue]) =>
      unsafePayloadKeyPattern.test(key) ||
      hasUnsafeMetadataKey(nestedValue, seen)
  );
}

function hasUnsafePayloadKey(
  value: unknown,
  seen = new WeakSet<object>()
): boolean {
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return false;
    }

    seen.add(value);
    return value.some((item) => hasUnsafePayloadKey(item, seen));
  }

  if (!isRecord(value)) {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  seen.add(value);
  return Object.entries(value).some(([key, nestedValue]) => {
    if (key === "metadata") {
      return false;
    }

    return (
      unsafePayloadKeyPattern.test(key) ||
      hasUnsafePayloadKey(nestedValue, seen)
    );
  });
}

function normalizeUuid(
  value: unknown,
  reason: TranscriptAuditRejectReason
): RequiredStringResult {
  if (typeof value !== "string") {
    return { ok: false, reason };
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized || !uuidPattern.test(normalized)) {
    return { ok: false, reason };
  }

  return { ok: true, value: normalized };
}

function normalizeOptionalUuid(
  value: unknown,
  reason: TranscriptAuditRejectReason
): OptionalStringResult {
  if (value == null) {
    return { ok: true };
  }

  if (typeof value !== "string") {
    return { ok: false, reason };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { ok: true };
  }

  return normalizeUuid(normalized, reason);
}

function normalizeOptionalText(
  value: unknown,
  maxLength: number,
  reason: TranscriptAuditRejectReason,
  rejectWhitespace = false
): OptionalStringResult {
  if (value == null) {
    return { ok: true };
  }

  if (typeof value !== "string") {
    return { ok: false, reason };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { ok: true };
  }

  if (
    normalized.length > maxLength ||
    (rejectWhitespace && /\s/.test(normalized))
  ) {
    return { ok: false, reason };
  }

  return { ok: true, value: normalized };
}

function normalizeOptionalCommitSha(value: unknown): OptionalStringResult {
  const normalized = normalizeOptionalText(
    value,
    64,
    "commit_sha_invalid",
    true
  );

  if (!normalized.ok || !normalized.value) {
    return normalized;
  }

  const lower = normalized.value.toLowerCase();

  if (!commitShaPattern.test(lower)) {
    return { ok: false, reason: "commit_sha_invalid" };
  }

  return { ok: true, value: lower };
}

function normalizeOptionalEvidenceText(
  value: unknown
): OptionalStringResult {
  const normalized = normalizeOptionalText(
    value,
    MAX_EVIDENCE_TEXT_LENGTH,
    "evidence_text_invalid"
  );

  if (!normalized.ok || !normalized.value) {
    return normalized;
  }

  if (unsafeEvidenceTextPattern.test(normalized.value)) {
    return { ok: false, reason: "evidence_text_unsafe" };
  }

  return normalized;
}

function normalizeMetadata(value: unknown): MetadataValidationResult {
  if (value == null) {
    return { ok: true, metadata: {} };
  }

  if (!isRecord(value)) {
    return { ok: false, reason: "metadata_invalid" };
  }

  if (hasUnsafeMetadataKey(value)) {
    return { ok: false, reason: "metadata_unsafe_key" };
  }

  try {
    const serialized = JSON.stringify(value);

    if (!serialized || getJsonByteLength(serialized) > MAX_METADATA_BYTES) {
      return { ok: false, reason: "metadata_too_large" };
    }

    const parsed = JSON.parse(serialized) as unknown;

    if (!isRecord(parsed)) {
      return { ok: false, reason: "metadata_invalid" };
    }

    return { ok: true, metadata: parsed };
  } catch {
    return { ok: false, reason: "metadata_invalid" };
  }
}

function normalizeAffectedRecordCount(value: unknown): OptionalNumberResult {
  if (value == null) {
    return { ok: true };
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    return { ok: false, reason: "affected_record_count_invalid" };
  }

  return { ok: true, value };
}

function normalizeAuditEventType(
  value: unknown
):
  | { ok: true; value: TranscriptAuditEventType }
  | { ok: false; reason: "event_type_invalid" } {
  if (typeof value !== "string") {
    return { ok: false, reason: "event_type_invalid" };
  }

  const normalized = value.trim();

  if (!auditEventTypes.has(normalized as TranscriptAuditEventType)) {
    return { ok: false, reason: "event_type_invalid" };
  }

  return { ok: true, value: normalized as TranscriptAuditEventType };
}

function normalizeActorType(
  value: unknown
):
  | { ok: true; value: TranscriptAuditActorType }
  | { ok: false; reason: "actor_type_invalid" } {
  if (typeof value !== "string") {
    return { ok: false, reason: "actor_type_invalid" };
  }

  const normalized = value.trim();

  if (!actorTypes.has(normalized as TranscriptAuditActorType)) {
    return { ok: false, reason: "actor_type_invalid" };
  }

  return { ok: true, value: normalized as TranscriptAuditActorType };
}

function normalizeResultStatus(
  value: unknown
):
  | { ok: true; value: TranscriptAuditResultStatus }
  | { ok: false; reason: "result_status_invalid" } {
  if (typeof value !== "string") {
    return { ok: false, reason: "result_status_invalid" };
  }

  const normalized = value.trim();

  if (!resultStatuses.has(normalized as TranscriptAuditResultStatus)) {
    return { ok: false, reason: "result_status_invalid" };
  }

  return { ok: true, value: normalized as TranscriptAuditResultStatus };
}

function normalizeEvidenceType(
  value: unknown
):
  | { ok: true; value: TranscriptEvidenceType }
  | { ok: false; reason: "evidence_type_invalid" } {
  if (typeof value !== "string") {
    return { ok: false, reason: "evidence_type_invalid" };
  }

  const normalized = value.trim();

  if (!evidenceTypes.has(normalized as TranscriptEvidenceType)) {
    return { ok: false, reason: "evidence_type_invalid" };
  }

  return { ok: true, value: normalized as TranscriptEvidenceType };
}

export function createTranscriptAuditEventCommand(
  input: TranscriptAuditEventCommandInput
): TranscriptAuditEventCommandResult {
  if (!isRecord(input)) {
    return reject("input_invalid");
  }

  if (hasUnsafePayloadKey(input)) {
    return reject("payload_unsafe");
  }

  const workspaceId = normalizeUuid(input.workspaceId, "workspace_id_missing");
  if (!workspaceId.ok) {
    return reject(workspaceId.reason);
  }

  const conversationId = normalizeOptionalUuid(
    input.conversationId,
    "conversation_id_invalid"
  );
  if (!conversationId.ok) {
    return reject(conversationId.reason);
  }

  const quoteRequestId = normalizeOptionalUuid(
    input.quoteRequestId,
    "quote_request_id_invalid"
  );
  if (!quoteRequestId.ok) {
    return reject(quoteRequestId.reason);
  }

  const actorAdminUserId = normalizeOptionalUuid(
    input.actorAdminUserId,
    "actor_admin_user_id_invalid"
  );
  if (!actorAdminUserId.ok) {
    return reject(actorAdminUserId.reason);
  }

  const eventType = normalizeAuditEventType(input.eventType);
  if (!eventType.ok) {
    return reject(eventType.reason);
  }

  const actorType = normalizeActorType(input.actorType);
  if (!actorType.ok) {
    return reject(actorType.reason);
  }

  const resultStatus = normalizeResultStatus(input.resultStatus);
  if (!resultStatus.ok) {
    return reject(resultStatus.reason);
  }

  const requestId = normalizeOptionalText(
    input.requestId,
    MAX_SHORT_TEXT_LENGTH,
    "request_id_invalid"
  );
  if (!requestId.ok) {
    return reject(requestId.reason);
  }

  const approvalReference = normalizeOptionalText(
    input.approvalReference,
    MAX_SHORT_TEXT_LENGTH,
    "approval_reference_invalid"
  );
  if (!approvalReference.ok) {
    return reject(approvalReference.reason);
  }

  const reasonCode = normalizeOptionalText(
    input.reasonCode,
    MAX_SHORT_TEXT_LENGTH,
    "reason_code_invalid",
    true
  );
  if (!reasonCode.ok) {
    return reject(reasonCode.reason);
  }

  const affectedRecordCount = normalizeAffectedRecordCount(
    input.affectedRecordCount
  );
  if (!affectedRecordCount.ok) {
    return reject(affectedRecordCount.reason);
  }

  const metadata = normalizeMetadata(input.metadata);
  if (!metadata.ok) {
    return reject(metadata.reason);
  }

  const command: TranscriptAuditEventCommand = {
    workspaceId: workspaceId.value,
    eventType: eventType.value,
    actorType: actorType.value,
    resultStatus: resultStatus.value,
    metadata: metadata.metadata
  };

  if (conversationId.value) {
    command.conversationId = conversationId.value;
  }

  if (quoteRequestId.value) {
    command.quoteRequestId = quoteRequestId.value;
  }

  if (actorAdminUserId.value) {
    command.actorAdminUserId = actorAdminUserId.value;
  }

  if (requestId.value) {
    command.requestId = requestId.value;
  }

  if (approvalReference.value) {
    command.approvalReference = approvalReference.value;
  }

  if (reasonCode.value) {
    command.reasonCode = reasonCode.value;
  }

  if (affectedRecordCount.value != null) {
    command.affectedRecordCount = affectedRecordCount.value;
  }

  return { ok: true, command };
}

export function createTranscriptEvidenceRecordCommand(
  input: TranscriptEvidenceRecordCommandInput
): TranscriptEvidenceRecordCommandResult {
  if (!isRecord(input)) {
    return reject("input_invalid");
  }

  if (hasUnsafePayloadKey(input)) {
    return reject("payload_unsafe");
  }

  const workspaceId = normalizeUuid(input.workspaceId, "workspace_id_missing");
  if (!workspaceId.ok) {
    return reject(workspaceId.reason);
  }

  const auditEventId = normalizeOptionalUuid(
    input.auditEventId,
    "audit_event_id_invalid"
  );
  if (!auditEventId.ok) {
    return reject(auditEventId.reason);
  }

  const evidenceType = normalizeEvidenceType(input.evidenceType);
  if (!evidenceType.ok) {
    return reject(evidenceType.reason);
  }

  const environmentLabel = normalizeOptionalText(
    input.environmentLabel,
    MAX_ENVIRONMENT_LABEL_LENGTH,
    "environment_label_invalid",
    true
  );
  if (!environmentLabel.ok) {
    return reject(environmentLabel.reason);
  }

  const commitSha = normalizeOptionalCommitSha(input.commitSha);
  if (!commitSha.ok) {
    return reject(commitSha.reason);
  }

  const validationSummary = normalizeOptionalEvidenceText(
    input.validationSummary
  );
  if (!validationSummary.ok) {
    return reject(validationSummary.reason);
  }

  const dryRunSummary = normalizeOptionalEvidenceText(input.dryRunSummary);
  if (!dryRunSummary.ok) {
    return reject(dryRunSummary.reason);
  }

  const rollbackSummary = normalizeOptionalEvidenceText(input.rollbackSummary);
  if (!rollbackSummary.ok) {
    return reject(rollbackSummary.reason);
  }

  const operatorNotes = normalizeOptionalEvidenceText(input.operatorNotes);
  if (!operatorNotes.ok) {
    return reject(operatorNotes.reason);
  }

  const metadata = normalizeMetadata(input.metadata);
  if (!metadata.ok) {
    return reject(metadata.reason);
  }

  const command: TranscriptEvidenceRecordCommand = {
    workspaceId: workspaceId.value,
    evidenceType: evidenceType.value,
    metadata: metadata.metadata
  };

  if (auditEventId.value) {
    command.auditEventId = auditEventId.value;
  }

  if (environmentLabel.value) {
    command.environmentLabel = environmentLabel.value;
  }

  if (commitSha.value) {
    command.commitSha = commitSha.value;
  }

  if (validationSummary.value) {
    command.validationSummary = validationSummary.value;
  }

  if (dryRunSummary.value) {
    command.dryRunSummary = dryRunSummary.value;
  }

  if (rollbackSummary.value) {
    command.rollbackSummary = rollbackSummary.value;
  }

  if (operatorNotes.value) {
    command.operatorNotes = operatorNotes.value;
  }

  return { ok: true, command };
}

function toRecordedAuditEventResult(
  result: TranscriptAuditEventAdapterResult
): TranscriptAuditEventRecordResult {
  if (!result.ok) {
    return unavailable();
  }

  return {
    ok: true,
    status: "recorded",
    auditEventId: result.auditEventId
  };
}

function toRecordedEvidenceResult(
  result: TranscriptEvidenceRecordAdapterResult
): TranscriptEvidenceRecordResult {
  if (!result.ok) {
    return unavailable();
  }

  return {
    ok: true,
    status: "recorded",
    evidenceRecordId: result.evidenceRecordId
  };
}

export async function recordTranscriptAuditEvent(
  input: TranscriptAuditEventCommandInput,
  dependencies: TranscriptAuditDependencies = {}
): Promise<TranscriptAuditEventRecordResult> {
  let command: TranscriptAuditEventCommandResult;

  try {
    command = createTranscriptAuditEventCommand(input);
  } catch {
    return reject("input_invalid");
  }

  if (!command.ok) {
    return command;
  }

  if (!dependencies.adapter) {
    return unavailable();
  }

  try {
    return toRecordedAuditEventResult(
      await dependencies.adapter.recordAuditEvent(command.command)
    );
  } catch {
    return unavailable();
  }
}

export async function recordTranscriptEvidenceRecord(
  input: TranscriptEvidenceRecordCommandInput,
  dependencies: TranscriptAuditDependencies = {}
): Promise<TranscriptEvidenceRecordResult> {
  let command: TranscriptEvidenceRecordCommandResult;

  try {
    command = createTranscriptEvidenceRecordCommand(input);
  } catch {
    return reject("input_invalid");
  }

  if (!command.ok) {
    return command;
  }

  if (!dependencies.adapter) {
    return unavailable();
  }

  try {
    return toRecordedEvidenceResult(
      await dependencies.adapter.recordEvidenceRecord(command.command)
    );
  } catch {
    return unavailable();
  }
}
