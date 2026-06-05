import "server-only";

import type {
  SearchIndexAdapter,
  SearchIndexDocumentAdapterResult,
  SearchIndexDocumentCommand,
  SearchIndexJobAdapterResult,
  SearchIndexJobCommand
} from "./types";

const disabledJobResult: SearchIndexJobAdapterResult = {
  ok: false,
  reason: "adapter_unavailable"
};

const disabledDocumentResult: SearchIndexDocumentAdapterResult = {
  ok: false,
  reason: "adapter_unavailable"
};

export class DisabledSearchIndex implements SearchIndexAdapter {
  async recordJob(
    _command: SearchIndexJobCommand
  ): Promise<SearchIndexJobAdapterResult> {
    return disabledJobResult;
  }

  async recordDocument(
    _command: SearchIndexDocumentCommand
  ): Promise<SearchIndexDocumentAdapterResult> {
    return disabledDocumentResult;
  }
}

export const disabledSearchIndex = new DisabledSearchIndex();
