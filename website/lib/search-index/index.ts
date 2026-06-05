import "server-only";

import {
  disabledSearchIndex,
  DisabledSearchIndex
} from "./disabled-search-index";
import {
  buildCategorySearchIndexJob,
  buildListingImageAltTextSearchIndexJob,
  buildListingSearchIndexJob
} from "./search-index-builder";
import { SupabaseSearchIndexAdapter } from "./supabase-search-index-adapter";
import {
  createSearchIndexDocumentCommand,
  createSearchIndexJobCommand,
  recordSearchIndexDocument,
  recordSearchIndexJob
} from "./contract";
import type {
  SearchIndexAdapter,
  SearchIndexAdapterFailureReason,
  SearchIndexCommandRejectedResult,
  SearchIndexDependencies,
  SearchIndexDocumentAdapterResult,
  SearchIndexDocumentCommand,
  SearchIndexDocumentCommandInput,
  SearchIndexDocumentCommandResult,
  SearchIndexDocumentRecordedResult,
  SearchIndexDocumentRecordResult,
  SearchIndexJobAdapterResult,
  SearchIndexJobCommand,
  SearchIndexJobCommandInput,
  SearchIndexJobCommandResult,
  SearchIndexJobRecordedResult,
  SearchIndexJobRecordResult,
  SearchIndexJobStatus,
  SearchIndexMetadataInput,
  SearchIndexOperation,
  SearchIndexRejectReason,
  SearchIndexSourceType,
  SearchIndexUnavailableResult,
  SearchIndexVisibility
} from "./types";

export {
  createSearchIndexDocumentCommand,
  createSearchIndexJobCommand,
  disabledSearchIndex,
  DisabledSearchIndex,
  buildCategorySearchIndexJob,
  buildListingImageAltTextSearchIndexJob,
  buildListingSearchIndexJob,
  recordSearchIndexDocument,
  recordSearchIndexJob,
  SupabaseSearchIndexAdapter
};

export type {
  SearchIndexAdapter,
  SearchIndexAdapterFailureReason,
  SearchIndexCommandRejectedResult,
  SearchIndexDependencies,
  SearchIndexDocumentAdapterResult,
  SearchIndexDocumentCommand,
  SearchIndexDocumentCommandInput,
  SearchIndexDocumentCommandResult,
  SearchIndexDocumentRecordedResult,
  SearchIndexDocumentRecordResult,
  SearchIndexJobAdapterResult,
  SearchIndexJobCommand,
  SearchIndexJobCommandInput,
  SearchIndexJobCommandResult,
  SearchIndexJobRecordedResult,
  SearchIndexJobRecordResult,
  SearchIndexJobStatus,
  SearchIndexMetadataInput,
  SearchIndexOperation,
  SearchIndexRejectReason,
  SearchIndexSourceType,
  SearchIndexUnavailableResult,
  SearchIndexVisibility
};

export function getSearchIndexAdapter(): SearchIndexAdapter {
  return disabledSearchIndex;
}
