import "server-only";

import type {
  TranscriptAuditAdapter,
  TranscriptAuditEventAdapterResult,
  TranscriptAuditEventCommand,
  TranscriptEvidenceRecordAdapterResult,
  TranscriptEvidenceRecordCommand
} from "./types";

const disabledAuditResult: TranscriptAuditEventAdapterResult = {
  ok: false,
  reason: "adapter_unavailable"
};

const disabledEvidenceResult: TranscriptEvidenceRecordAdapterResult = {
  ok: false,
  reason: "adapter_unavailable"
};

export class DisabledTranscriptAudit implements TranscriptAuditAdapter {
  async recordAuditEvent(
    _command: TranscriptAuditEventCommand
  ): Promise<TranscriptAuditEventAdapterResult> {
    return disabledAuditResult;
  }

  async recordEvidenceRecord(
    _command: TranscriptEvidenceRecordCommand
  ): Promise<TranscriptEvidenceRecordAdapterResult> {
    return disabledEvidenceResult;
  }
}

export const disabledTranscriptAudit = new DisabledTranscriptAudit();
