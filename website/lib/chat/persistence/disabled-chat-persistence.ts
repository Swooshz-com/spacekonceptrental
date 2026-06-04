import "server-only";

import type {
  BatchTranscriptPersistenceCommand,
  TranscriptPersistenceAdapter,
  TranscriptPersistenceAdapterResult
} from "./types";

const disabledResult: TranscriptPersistenceAdapterResult = {
  ok: false,
  reason: "adapter_unavailable"
};

export class DisabledChatPersistence implements TranscriptPersistenceAdapter {
  async persistTranscript(
    _command: BatchTranscriptPersistenceCommand
  ): Promise<TranscriptPersistenceAdapterResult> {
    return disabledResult;
  }
}

export const disabledChatPersistence = new DisabledChatPersistence();
