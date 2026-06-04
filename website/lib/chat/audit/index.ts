import "server-only";

import {
  disabledTranscriptAudit,
  DisabledTranscriptAudit
} from "./disabled-transcript-audit";
import {
  createTranscriptAuditEventCommand,
  createTranscriptEvidenceRecordCommand,
  recordTranscriptAuditEvent,
  recordTranscriptEvidenceRecord
} from "./contract";
import type {
  TranscriptAuditActorType,
  TranscriptAuditAdapter,
  TranscriptAuditAdapterFailureReason,
  TranscriptAuditCommandRejectedResult,
  TranscriptAuditDependencies,
  TranscriptAuditEventAdapterResult,
  TranscriptAuditEventCommand,
  TranscriptAuditEventCommandInput,
  TranscriptAuditEventCommandResult,
  TranscriptAuditEventRecordedResult,
  TranscriptAuditEventRecordResult,
  TranscriptAuditEventType,
  TranscriptAuditMetadataInput,
  TranscriptAuditRejectReason,
  TranscriptAuditResultStatus,
  TranscriptAuditUnavailableResult,
  TranscriptEvidenceRecordAdapterResult,
  TranscriptEvidenceRecordCommand,
  TranscriptEvidenceRecordCommandInput,
  TranscriptEvidenceRecordCommandResult,
  TranscriptEvidenceRecordRecordedResult,
  TranscriptEvidenceRecordResult,
  TranscriptEvidenceType
} from "./types";

export {
  createTranscriptAuditEventCommand,
  createTranscriptEvidenceRecordCommand,
  disabledTranscriptAudit,
  DisabledTranscriptAudit,
  recordTranscriptAuditEvent,
  recordTranscriptEvidenceRecord
};
export type {
  TranscriptAuditActorType,
  TranscriptAuditAdapter,
  TranscriptAuditAdapterFailureReason,
  TranscriptAuditCommandRejectedResult,
  TranscriptAuditDependencies,
  TranscriptAuditEventAdapterResult,
  TranscriptAuditEventCommand,
  TranscriptAuditEventCommandInput,
  TranscriptAuditEventCommandResult,
  TranscriptAuditEventRecordedResult,
  TranscriptAuditEventRecordResult,
  TranscriptAuditEventType,
  TranscriptAuditMetadataInput,
  TranscriptAuditRejectReason,
  TranscriptAuditResultStatus,
  TranscriptAuditUnavailableResult,
  TranscriptEvidenceRecordAdapterResult,
  TranscriptEvidenceRecordCommand,
  TranscriptEvidenceRecordCommandInput,
  TranscriptEvidenceRecordCommandResult,
  TranscriptEvidenceRecordRecordedResult,
  TranscriptEvidenceRecordResult,
  TranscriptEvidenceType
};

export function getTranscriptAuditAdapter(): TranscriptAuditAdapter {
  return disabledTranscriptAudit;
}
