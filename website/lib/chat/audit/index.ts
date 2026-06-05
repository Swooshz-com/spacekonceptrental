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
import { createRpcTranscriptAuditAdapter } from "./rpc-transcript-audit-adapter";
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
  TranscriptAuditEventRpcExecutorResult,
  TranscriptAuditEventRpcPayload,
  TranscriptAuditEventType,
  TranscriptAuditMetadataInput,
  TranscriptAuditRejectReason,
  TranscriptAuditRpcAdapterDependencies,
  TranscriptAuditRpcExecutor,
  TranscriptAuditResultStatus,
  TranscriptAuditUnavailableResult,
  TranscriptEvidenceRecordAdapterResult,
  TranscriptEvidenceRecordCommand,
  TranscriptEvidenceRecordCommandInput,
  TranscriptEvidenceRecordCommandResult,
  TranscriptEvidenceRecordRecordedResult,
  TranscriptEvidenceRecordRpcExecutorResult,
  TranscriptEvidenceRecordRpcPayload,
  TranscriptEvidenceRecordResult,
  TranscriptEvidenceType
} from "./types";

export {
  createTranscriptAuditEventCommand,
  createTranscriptEvidenceRecordCommand,
  createRpcTranscriptAuditAdapter,
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
  TranscriptAuditEventRpcExecutorResult,
  TranscriptAuditEventRpcPayload,
  TranscriptAuditEventType,
  TranscriptAuditMetadataInput,
  TranscriptAuditRejectReason,
  TranscriptAuditRpcAdapterDependencies,
  TranscriptAuditRpcExecutor,
  TranscriptAuditResultStatus,
  TranscriptAuditUnavailableResult,
  TranscriptEvidenceRecordAdapterResult,
  TranscriptEvidenceRecordCommand,
  TranscriptEvidenceRecordCommandInput,
  TranscriptEvidenceRecordCommandResult,
  TranscriptEvidenceRecordRecordedResult,
  TranscriptEvidenceRecordRpcExecutorResult,
  TranscriptEvidenceRecordRpcPayload,
  TranscriptEvidenceRecordResult,
  TranscriptEvidenceType
};

export function getTranscriptAuditAdapter(): TranscriptAuditAdapter {
  return disabledTranscriptAudit;
}
