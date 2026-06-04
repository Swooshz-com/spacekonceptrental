import "server-only";

import type {
  BatchTranscriptPersistenceCommand,
  ConversationPersistenceCommand,
  MessagePersistenceCommand,
  TranscriptConversationStatus,
  TranscriptMetadataInput,
  TranscriptPersistenceAdapterResult,
  TranscriptPersistenceCommandInput,
  TranscriptPersistenceCommandResult,
  TranscriptPersistenceDependencies,
  TranscriptPersistenceMessageRole,
  TranscriptPersistenceMessageType,
  TranscriptPersistenceRejectReason,
  TranscriptPersistenceResult
} from "./types";

const MAX_PUBLIC_REFERENCE_LENGTH = 128;
const MAX_CLIENT_SESSION_HASH_LENGTH = 128;
const MIN_CLIENT_SESSION_HASH_LENGTH = 32;
const MAX_PROVIDER_LENGTH = 64;
const MAX_CLIENT_MESSAGE_ID_LENGTH = 128;
const MAX_REQUEST_ID_LENGTH = 128;
const MAX_MESSAGE_CONTENT_LENGTH = 8_000;
const MAX_CONVERSATION_METADATA_BYTES = 2_048;
const MAX_MESSAGE_METADATA_BYTES = 4_096;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const conversationStatuses = new Set<TranscriptConversationStatus>([
  "open",
  "closed",
  "archived"
]);

const chatRoles = new Set<TranscriptPersistenceMessageRole>([
  "user",
  "assistant",
  "system"
]);

const unsafeMetadataKeyPattern =
  /provider[_-]?debug|provider[_-]?payload|debug[_-]?payload|workflow[_-]?payload|webhook|headers?|raw[_-]?headers?|tokens?|authorization|cookie|trace[_-]?dump|credentials?|private[_-]?key|secret|password|api[_-]?key/i;

type MetadataValidationResult =
  | { ok: true; metadata: TranscriptMetadataInput }
  | { ok: false; reason: TranscriptPersistenceRejectReason };

type RequiredStringResult =
  | { ok: true; value: string }
  | { ok: false; reason: TranscriptPersistenceRejectReason };

type OptionalStringResult =
  | { ok: true; value?: string }
  | { ok: false; reason: TranscriptPersistenceRejectReason };

function reject(
  reason: TranscriptPersistenceRejectReason
): Extract<TranscriptPersistenceCommandResult, { ok: false }> {
  return {
    ok: false,
    status: "rejected",
    reason
  };
}

function unavailable(): TranscriptPersistenceResult {
  return {
    ok: false,
    status: "unavailable",
    reason: "transcript_persistence_unavailable"
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeUuid(
  value: unknown,
  reason: TranscriptPersistenceRejectReason
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
  reason: TranscriptPersistenceRejectReason
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

function normalizeRequiredText(
  value: unknown,
  maxLength: number,
  reason: TranscriptPersistenceRejectReason
): RequiredStringResult {
  if (typeof value !== "string") {
    return { ok: false, reason };
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > maxLength) {
    return { ok: false, reason };
  }

  return { ok: true, value: normalized };
}

function normalizeOptionalText(
  value: unknown,
  maxLength: number,
  reason: TranscriptPersistenceRejectReason,
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

function normalizeOptionalTimestamp(value: unknown): OptionalStringResult {
  if (value == null) {
    return { ok: true };
  }

  if (!(value instanceof Date) && typeof value !== "string") {
    return { ok: false, reason: "retention_expires_at_invalid" };
  }

  const timestamp =
    value instanceof Date ? value : new Date(value.trim());

  if (Number.isNaN(timestamp.getTime())) {
    return { ok: false, reason: "retention_expires_at_invalid" };
  }

  return { ok: true, value: timestamp.toISOString() };
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

function normalizeMetadata(
  value: unknown,
  maxBytes: number
): MetadataValidationResult {
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

    if (!serialized || getJsonByteLength(serialized) > maxBytes) {
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

function normalizeClientSessionHash(
  value: unknown
): OptionalStringResult {
  if (value == null) {
    return { ok: true };
  }

  if (typeof value !== "string") {
    return { ok: false, reason: "anonymous_session_hash_invalid" };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { ok: true };
  }

  if (
    normalized.length < MIN_CLIENT_SESSION_HASH_LENGTH ||
    normalized.length > MAX_CLIENT_SESSION_HASH_LENGTH ||
    /\s/.test(normalized)
  ) {
    return { ok: false, reason: "anonymous_session_hash_invalid" };
  }

  return { ok: true, value: normalized };
}

function normalizeConversationStatus(
  value: unknown
): TranscriptConversationStatus | null {
  if (value == null) {
    return "open";
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return "open";
  }

  return conversationStatuses.has(normalized as TranscriptConversationStatus)
    ? (normalized as TranscriptConversationStatus)
    : null;
}

function isValidMessageRoleType(
  role: string | null | undefined,
  messageType: string | null | undefined
): role is TranscriptPersistenceMessageRole {
  if (messageType === "system_notice") {
    return role === "system";
  }

  return messageType === "chat" && chatRoles.has(role as never);
}

function normalizeMessageType(
  value: unknown
): TranscriptPersistenceMessageType | null {
  if (value == null) {
    return "chat";
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return "chat";
  }

  return normalized === "chat" || normalized === "system_notice"
    ? normalized
    : null;
}

function buildConversationCommand(
  input: unknown,
  trustedWorkspaceId: string
):
  | { ok: true; conversation: ConversationPersistenceCommand }
  | { ok: false; reason: TranscriptPersistenceRejectReason } {
  if (!isRecord(input)) {
    return { ok: false, reason: "conversation_id_invalid" };
  }

  const conversationId = normalizeUuid(
    input.id,
    "conversation_id_invalid"
  );
  if (!conversationId.ok) {
    return { ok: false, reason: conversationId.reason };
  }

  const publicReference = normalizeRequiredText(
    input.publicReference,
    MAX_PUBLIC_REFERENCE_LENGTH,
    "conversation_public_reference_invalid"
  );
  if (!publicReference.ok) {
    return { ok: false, reason: publicReference.reason };
  }

  const status = normalizeConversationStatus(input.status);
  if (!status) {
    return { ok: false, reason: "conversation_status_invalid" };
  }

  const clientSessionHash = normalizeClientSessionHash(
    input.clientSessionHash
  );
  if (!clientSessionHash.ok) {
    return { ok: false, reason: clientSessionHash.reason };
  }

  const quoteRequestId = normalizeOptionalUuid(
    input.quoteRequestId,
    "quote_request_id_invalid"
  );
  if (!quoteRequestId.ok) {
    return { ok: false, reason: quoteRequestId.reason };
  }

  const retentionExpiresAt = normalizeOptionalTimestamp(
    input.retentionExpiresAt
  );
  if (!retentionExpiresAt.ok) {
    return { ok: false, reason: retentionExpiresAt.reason };
  }

  const metadata = normalizeMetadata(
    input.metadata,
    MAX_CONVERSATION_METADATA_BYTES
  );
  if (!metadata.ok) {
    return { ok: false, reason: metadata.reason };
  }

  const conversation: ConversationPersistenceCommand = {
    id: conversationId.value,
    workspaceId: trustedWorkspaceId,
    publicReference: publicReference.value,
    status,
    metadata: metadata.metadata
  };

  if (clientSessionHash.value) {
    conversation.clientSessionHash = clientSessionHash.value;
    conversation.clientSessionHashPurpose = "anonymous_correlation_only";
  }

  if (quoteRequestId.value) {
    conversation.quoteRequestId = quoteRequestId.value;
  }

  if (retentionExpiresAt.value) {
    conversation.retentionExpiresAt = retentionExpiresAt.value;
  }

  return { ok: true, conversation };
}

function buildMessageCommand(
  input: unknown,
  trustedWorkspaceId: string,
  conversationId: string
):
  | { ok: true; message: MessagePersistenceCommand }
  | { ok: false; reason: TranscriptPersistenceRejectReason } {
  if (!isRecord(input)) {
    return { ok: false, reason: "message_id_invalid" };
  }

  const messageId = normalizeUuid(input.id, "message_id_invalid");
  if (!messageId.ok) {
    return { ok: false, reason: messageId.reason };
  }

  const role = typeof input.role === "string" ? input.role.trim() : null;
  const messageType = normalizeMessageType(input.messageType);

  if (!messageType || !isValidMessageRoleType(role, messageType)) {
    return { ok: false, reason: "message_role_type_invalid" };
  }

  const content = typeof input.content === "string" ? input.content.trim() : "";
  if (!content) {
    return { ok: false, reason: "message_content_missing" };
  }

  if (content.length > MAX_MESSAGE_CONTENT_LENGTH) {
    return { ok: false, reason: "message_content_too_large" };
  }

  const provider = normalizeOptionalText(
    input.provider,
    MAX_PROVIDER_LENGTH,
    "provider_invalid",
    true
  );
  if (!provider.ok) {
    return { ok: false, reason: provider.reason };
  }

  const clientMessageId = normalizeOptionalText(
    input.clientMessageId,
    MAX_CLIENT_MESSAGE_ID_LENGTH,
    "client_message_id_invalid"
  );
  if (!clientMessageId.ok) {
    return { ok: false, reason: clientMessageId.reason };
  }

  const requestId = normalizeOptionalText(
    input.requestId,
    MAX_REQUEST_ID_LENGTH,
    "request_id_invalid"
  );
  if (!requestId.ok) {
    return { ok: false, reason: requestId.reason };
  }

  const sequenceNumber = input.sequenceNumber;
  if (
    sequenceNumber != null &&
    (typeof sequenceNumber !== "number" ||
      !Number.isInteger(sequenceNumber) ||
      sequenceNumber < 0)
  ) {
    return { ok: false, reason: "sequence_number_invalid" };
  }

  const retentionExpiresAt = normalizeOptionalTimestamp(
    input.retentionExpiresAt
  );
  if (!retentionExpiresAt.ok) {
    return { ok: false, reason: retentionExpiresAt.reason };
  }

  const metadata = normalizeMetadata(
    input.metadata,
    MAX_MESSAGE_METADATA_BYTES
  );
  if (!metadata.ok) {
    return { ok: false, reason: metadata.reason };
  }

  const message: MessagePersistenceCommand = {
    id: messageId.value,
    workspaceId: trustedWorkspaceId,
    conversationId,
    role,
    messageType,
    content,
    metadata: metadata.metadata
  };

  if (provider.value) {
    message.provider = provider.value;
  }

  if (clientMessageId.value) {
    message.clientMessageId = clientMessageId.value;
    message.clientMessageIdPurpose = "idempotency_only";
  }

  if (requestId.value) {
    message.requestId = requestId.value;
  }

  if (sequenceNumber != null) {
    message.sequenceNumber = sequenceNumber;
  }

  if (retentionExpiresAt.value) {
    message.retentionExpiresAt = retentionExpiresAt.value;
  }

  return { ok: true, message };
}

export function createTranscriptPersistenceCommand(
  input: TranscriptPersistenceCommandInput
): TranscriptPersistenceCommandResult {
  const commandInput: Record<string, unknown> = isRecord(input) ? input : {};
  const trustedWorkspaceId = normalizeUuid(
    commandInput.trustedWorkspaceId,
    "trusted_workspace_missing"
  );
  if (!trustedWorkspaceId.ok) {
    return reject(trustedWorkspaceId.reason);
  }

  if (
    !Array.isArray(commandInput.messages) ||
    commandInput.messages.length === 0
  ) {
    return reject("messages_missing");
  }

  const conversation = buildConversationCommand(
    commandInput.conversation,
    trustedWorkspaceId.value
  );
  if (!conversation.ok) {
    return reject(conversation.reason);
  }

  const messages: MessagePersistenceCommand[] = [];
  for (const messageInput of commandInput.messages) {
    const message = buildMessageCommand(
      messageInput,
      trustedWorkspaceId.value,
      conversation.conversation.id
    );

    if (!message.ok) {
      return reject(message.reason);
    }

    messages.push(message.message);
  }

  const command: BatchTranscriptPersistenceCommand = {
    trustedWorkspaceId: trustedWorkspaceId.value,
    conversation: conversation.conversation,
    messages
  };

  return {
    ok: true,
    command
  };
}

function toPersistedResult(
  result: TranscriptPersistenceAdapterResult
): TranscriptPersistenceResult {
  if (!result.ok) {
    return unavailable();
  }

  return {
    ok: true,
    status: "persisted",
    conversationId: result.conversationId,
    messageIds: result.messageIds
  };
}

export async function persistTranscriptCommand(
  input: TranscriptPersistenceCommandInput,
  dependencies: TranscriptPersistenceDependencies = {}
): Promise<TranscriptPersistenceResult> {
  let command: TranscriptPersistenceCommandResult;

  try {
    command = createTranscriptPersistenceCommand(input);
  } catch {
    return reject("trusted_workspace_missing");
  }

  if (!command.ok) {
    return command;
  }

  if (!dependencies.adapter) {
    return unavailable();
  }

  try {
    return toPersistedResult(
      await dependencies.adapter.persistTranscript(command.command)
    );
  } catch {
    return unavailable();
  }
}
