import "server-only";

import type {
  SearchIndexAdapter,
  SearchIndexDependencies,
  SearchIndexDocumentAdapterResult,
  SearchIndexDocumentCommand,
  SearchIndexDocumentCommandInput,
  SearchIndexDocumentCommandResult,
  SearchIndexDocumentRecordResult,
  SearchIndexJobAdapterResult,
  SearchIndexJobCommand,
  SearchIndexJobCommandInput,
  SearchIndexJobCommandResult,
  SearchIndexJobRecordResult,
  SearchIndexJobStatus,
  SearchIndexMetadataInput,
  SearchIndexOperation,
  SearchIndexRejectReason,
  SearchIndexSourceType,
  SearchIndexVisibility
} from "./types";

const MAX_METADATA_BYTES = 4_096;
const MAX_SHORT_TEXT_LENGTH = 128;
const MAX_TITLE_LENGTH = 200;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const compactTextPattern = /^[^\s]{1,128}$/;

const sourceTypes = new Set<SearchIndexSourceType>([
  "listing",
  "category",
  "policy",
  "faq",
  "document",
  "listing_image_alt_text"
]);

const visibilities = new Set<SearchIndexVisibility>([
  "public_chat",
  "admin_only",
  "blocked"
]);

const operations = new Set<SearchIndexOperation>([
  "upsert",
  "delete",
  "hide",
  "rebuild"
]);

const statuses = new Set<SearchIndexJobStatus>([
  "queued",
  "processing",
  "succeeded",
  "failed",
  "skipped",
  "cancelled"
]);

const unsafeMetadataKeyPattern = new RegExp(
  [
    "provider[_-]?debug",
    "trace[_-]?dump",
    "full[_-]?transcript",
    "transcript[_-]?content",
    "raw[_-]?provider[_-]?payload",
    "provider[_-]?payload",
    "debug[_-]?payload",
    "workflow[_-]?payload",
    "webhooks?",
    "webhook[_-]?headers?",
    "headers?",
    "raw[_-]?headers?",
    "tokens?",
    "authorization",
    "cookie",
    "credentials?",
    "private[_-]?key",
    "secret",
    "password",
    "api[_-]?key",
    "service[_-]?role",
    "customer[_-]?visible[_-]?internal[_-]?notes",
    "internal[_-]?notes",
    "pay" + "ment",
    "customer[_-]?" + "contact",
    "contact[_-]?" + "email",
    "contact[_-]?" + "phone",
    "email",
    "phone"
  ].join("|"),
  "i"
);

type RequiredStringResult =
  | { ok: true; value: string }
  | { ok: false; reason: SearchIndexRejectReason };

type OptionalStringResult =
  | { ok: true; value?: string }
  | { ok: false; reason: SearchIndexRejectReason };

type MetadataValidationResult =
  | { ok: true; metadata: SearchIndexMetadataInput }
  | { ok: false; reason: SearchIndexRejectReason };

type NumberValidationResult =
  | { ok: true; value: number }
  | { ok: false; reason: SearchIndexRejectReason };

type EnumValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: SearchIndexRejectReason };

function reject(reason: SearchIndexRejectReason) {
  return {
    ok: false,
    status: "rejected",
    reason
  } as const;
}

function unavailable() {
  return {
    ok: false,
    status: "unavailable",
    reason: "search_index_unavailable"
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
      unsafeMetadataKeyPattern.test(key) ||
      hasUnsafeMetadataKey(nestedValue, seen)
  );
}

function normalizeUuid(
  value: unknown,
  reason: SearchIndexRejectReason
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
  reason: SearchIndexRejectReason
): OptionalStringResult {
  if (value == null) {
    return { ok: true };
  }

  return normalizeUuid(value, reason);
}

function normalizeOptionalCompactText(
  value: unknown,
  reason: SearchIndexRejectReason
): OptionalStringResult {
  if (value == null) {
    return { ok: true };
  }

  if (typeof value !== "string") {
    return { ok: false, reason };
  }

  const normalized = value.trim();

  if (!compactTextPattern.test(normalized)) {
    return { ok: false, reason };
  }

  return { ok: true, value: normalized };
}

function normalizeOptionalTitle(value: unknown): OptionalStringResult {
  if (value == null) {
    return { ok: true };
  }

  if (typeof value !== "string") {
    return { ok: false, reason: "title_invalid" };
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > MAX_TITLE_LENGTH) {
    return { ok: false, reason: "title_invalid" };
  }

  return { ok: true, value: normalized };
}

function normalizeContentHash(
  value: unknown,
  required: boolean
): OptionalStringResult {
  if (value == null) {
    return required
      ? { ok: false, reason: "content_hash_invalid" }
      : { ok: true };
  }

  return normalizeOptionalCompactText(value, "content_hash_invalid");
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

function normalizeSourceType(
  value: unknown
): EnumValidationResult<SearchIndexSourceType> {
  if (typeof value !== "string") {
    return { ok: false, reason: "source_type_invalid" } as const;
  }

  const normalized = value.trim();

  return sourceTypes.has(normalized as SearchIndexSourceType)
    ? { ok: true, value: normalized as SearchIndexSourceType }
    : ({ ok: false, reason: "source_type_invalid" } as const);
}

function normalizeVisibility(
  value: unknown
): EnumValidationResult<SearchIndexVisibility> {
  if (typeof value !== "string") {
    return { ok: false, reason: "visibility_invalid" } as const;
  }

  const normalized = value.trim();

  return visibilities.has(normalized as SearchIndexVisibility)
    ? { ok: true, value: normalized as SearchIndexVisibility }
    : ({ ok: false, reason: "visibility_invalid" } as const);
}

function normalizeOperation(
  value: unknown
): EnumValidationResult<SearchIndexOperation> {
  if (typeof value !== "string") {
    return { ok: false, reason: "operation_invalid" } as const;
  }

  const normalized = value.trim();

  return operations.has(normalized as SearchIndexOperation)
    ? { ok: true, value: normalized as SearchIndexOperation }
    : ({ ok: false, reason: "operation_invalid" } as const);
}

function normalizeStatus(
  value: unknown
): EnumValidationResult<SearchIndexJobStatus> {
  if (typeof value !== "string") {
    return { ok: false, reason: "status_invalid" } as const;
  }

  const normalized = value.trim();

  return statuses.has(normalized as SearchIndexJobStatus)
    ? { ok: true, value: normalized as SearchIndexJobStatus }
    : ({ ok: false, reason: "status_invalid" } as const);
}

function normalizeChunkCount(value: unknown): NumberValidationResult {
  if (value == null) {
    return { ok: true, value: 0 };
  }

  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? { ok: true, value }
    : { ok: false, reason: "chunk_count_invalid" };
}

function normalizeOptionalIsoTimestamp(value: unknown): OptionalStringResult {
  if (value == null) {
    return { ok: true };
  }

  if (typeof value !== "string") {
    return { ok: false, reason: "indexed_at_invalid" };
  }

  const normalized = value.trim();
  const parsed = Date.parse(normalized);

  if (!normalized || Number.isNaN(parsed)) {
    return { ok: false, reason: "indexed_at_invalid" };
  }

  return { ok: true, value: normalized };
}

export function createSearchIndexJobCommand(
  input: SearchIndexJobCommandInput
): SearchIndexJobCommandResult {
  if (!isRecord(input)) {
    return reject("input_invalid");
  }

  const workspaceId = normalizeUuid(input.workspaceId, "workspace_id_invalid");
  if (!workspaceId.ok) {
    return reject(workspaceId.reason);
  }

  const sourceId = normalizeUuid(input.sourceId, "source_id_invalid");
  if (!sourceId.ok) {
    return reject(sourceId.reason);
  }

  const sourceType = normalizeSourceType(input.sourceType);
  if (!sourceType.ok) {
    return reject(sourceType.reason);
  }

  const sourceVersion = normalizeOptionalCompactText(
    input.sourceVersion,
    "source_version_invalid"
  );
  if (!sourceVersion.ok) {
    return reject(sourceVersion.reason);
  }

  const visibility = normalizeVisibility(input.visibility);
  if (!visibility.ok) {
    return reject(visibility.reason);
  }

  const operation = normalizeOperation(input.operation);
  if (!operation.ok) {
    return reject(operation.reason);
  }

  const status = normalizeStatus(input.status ?? "queued");
  if (!status.ok) {
    return reject(status.reason);
  }

  const contentHash = normalizeContentHash(input.contentHash, false);
  if (!contentHash.ok) {
    return reject(contentHash.reason);
  }

  const metadata = normalizeMetadata(input.metadata);
  if (!metadata.ok) {
    return reject(metadata.reason);
  }

  const command: SearchIndexJobCommand = {
    workspaceId: workspaceId.value,
    sourceType: sourceType.value,
    sourceId: sourceId.value,
    visibility: visibility.value,
    operation: operation.value,
    status: status.value,
    metadata: metadata.metadata
  };

  if (sourceVersion.value) {
    command.sourceVersion = sourceVersion.value;
  }

  if (contentHash.value) {
    command.contentHash = contentHash.value;
  }

  return { ok: true, command };
}

export function createSearchIndexDocumentCommand(
  input: SearchIndexDocumentCommandInput
): SearchIndexDocumentCommandResult {
  if (!isRecord(input)) {
    return reject("input_invalid");
  }

  const workspaceId = normalizeUuid(input.workspaceId, "workspace_id_invalid");
  if (!workspaceId.ok) {
    return reject(workspaceId.reason);
  }

  const sourceId = normalizeUuid(input.sourceId, "source_id_invalid");
  if (!sourceId.ok) {
    return reject(sourceId.reason);
  }

  const sourceType = normalizeSourceType(input.sourceType);
  if (!sourceType.ok) {
    return reject(sourceType.reason);
  }

  const sourceVersion = normalizeOptionalCompactText(
    input.sourceVersion,
    "source_version_invalid"
  );
  if (!sourceVersion.ok) {
    return reject(sourceVersion.reason);
  }

  const visibility = normalizeVisibility(input.visibility);
  if (!visibility.ok) {
    return reject(visibility.reason);
  }

  const status = normalizeStatus(input.status);
  if (!status.ok) {
    return reject(status.reason);
  }

  const title = normalizeOptionalTitle(input.title);
  if (!title.ok) {
    return reject(title.reason);
  }

  const contentHash = normalizeContentHash(input.contentHash, true);
  if (!contentHash.ok || !contentHash.value) {
    return reject("content_hash_invalid");
  }

  const chunkCount = normalizeChunkCount(input.chunkCount);
  if (!chunkCount.ok) {
    return reject(chunkCount.reason);
  }

  const lastIndexJobId = normalizeOptionalUuid(
    input.lastIndexJobId,
    "last_index_job_id_invalid"
  );
  if (!lastIndexJobId.ok) {
    return reject(lastIndexJobId.reason);
  }

  const indexedAt = normalizeOptionalIsoTimestamp(input.indexedAt);
  if (!indexedAt.ok) {
    return reject(indexedAt.reason);
  }

  const metadata = normalizeMetadata(input.metadata);
  if (!metadata.ok) {
    return reject(metadata.reason);
  }

  const command: SearchIndexDocumentCommand = {
    workspaceId: workspaceId.value,
    sourceType: sourceType.value,
    sourceId: sourceId.value,
    visibility: visibility.value,
    status: status.value,
    contentHash: contentHash.value,
    chunkCount: chunkCount.value,
    metadata: metadata.metadata
  };

  if (sourceVersion.value) {
    command.sourceVersion = sourceVersion.value;
  }

  if (title.value) {
    command.title = title.value;
  }

  if (lastIndexJobId.value) {
    command.lastIndexJobId = lastIndexJobId.value;
  }

  if (indexedAt.value) {
    command.indexedAt = indexedAt.value;
  }

  return { ok: true, command };
}

function toJobRecordResult(
  result: SearchIndexJobAdapterResult
): SearchIndexJobRecordResult {
  if (!result.ok) {
    return unavailable();
  }

  return {
    ok: true,
    status: "recorded",
    searchIndexJobId: result.searchIndexJobId
  };
}

function toDocumentRecordResult(
  result: SearchIndexDocumentAdapterResult
): SearchIndexDocumentRecordResult {
  if (!result.ok) {
    return unavailable();
  }

  return {
    ok: true,
    status: "recorded",
    searchIndexDocumentId: result.searchIndexDocumentId
  };
}

function getAdapter(dependencies: SearchIndexDependencies): SearchIndexAdapter | null {
  return dependencies.adapter ?? null;
}

export async function recordSearchIndexJob(
  input: SearchIndexJobCommandInput,
  dependencies: SearchIndexDependencies = {}
): Promise<SearchIndexJobRecordResult> {
  let command: SearchIndexJobCommandResult;

  try {
    command = createSearchIndexJobCommand(input);
  } catch {
    return reject("input_invalid");
  }

  if (!command.ok) {
    return command;
  }

  const adapter = getAdapter(dependencies);

  if (!adapter) {
    return unavailable();
  }

  try {
    return toJobRecordResult(await adapter.recordJob(command.command));
  } catch {
    return unavailable();
  }
}

export async function recordSearchIndexDocument(
  input: SearchIndexDocumentCommandInput,
  dependencies: SearchIndexDependencies = {}
): Promise<SearchIndexDocumentRecordResult> {
  let command: SearchIndexDocumentCommandResult;

  try {
    command = createSearchIndexDocumentCommand(input);
  } catch {
    return reject("input_invalid");
  }

  if (!command.ok) {
    return command;
  }

  const adapter = getAdapter(dependencies);

  if (!adapter) {
    return unavailable();
  }

  try {
    return toDocumentRecordResult(
      await adapter.recordDocument(command.command)
    );
  } catch {
    return unavailable();
  }
}
