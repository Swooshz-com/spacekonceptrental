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
): TranscriptPersistenceCommandResult {
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
  value: string | null | undefined,
  reason: TranscriptPersistenceRejectReason
): RequiredStringResult {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || !uuidPattern.test(normalized)) {
    return { ok: false, reason };
  }

  return { ok: true, value: normalized };
}

function normalizeOptionalUuid(
  value: string | null | undefined,
  reason: TranscriptPersistenceRejectReason
): OptionalStringResult {
  const normalized = value?.trim();

  if (!normalized) {
    return { ok: true };
  }

  return normalizeUuid(normalized, reason);
}

function normalizeRequiredText(
  value: string | null | undefined,
  maxLength: number,
  reason: TranscriptPersistenceRejectReason
): RequiredStringResult {
  const normalized = value?.trim();

  if (!normalized || normalized.length > maxLength) {
    return { ok: false, reason };
  }

  return { ok: true, value: normalized };
}

function normalizeOptionalText(
  value: string | null | undefined,
  maxLength: number,
  reason: TranscriptPersistenceRejectReason,
  rejectWhitespace = false
): OptionalStringResult {
  const normalized = value?.trim();

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

function normalizeOptionalTimestamp(
  value: Date | string | null | undefined
): OptionalStringResult {
  if (value == null) {
    return { ok: true };
  }

  const timestamp = value instanceof Date ? value : new Date(value.trim());

  if (Number.isNaN(timestamp.getTime())) {
    return { ok: false, reason: "retention_expires_at_invalid" };
  }

  return { ok: true, value: timestamp.toISOString() };
}

function getJsonByteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function hasUnsafeMetadataKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasUnsafeMetadataKey(item));
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(
    ([key, nestedValue]) =>
      unsafeMetadataKeyPattern.test(key) ||
      hasUnsafeMetadataKey(nestedValue)
  );
}

function normalizeMetadata(
  value: TranscriptMetadataInput | null | undefined,
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

    if (!serialized || getJsonByteLength(value) > maxBytes) {
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
  value: string | null | undefined
): OptionalStringResult {
  const normalized = value?.trim();

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
  value: string | null | undefined
): TranscriptConversationStatus | null {
  if (value == null || value === "") {
    return "open";
  }

  return conversationStatuses.has(value as TranscriptConversationStatus)
    ? (value as TranscriptConversationStatus)
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
  value: string | null | undefined
): TranscriptPersistenceMessageType | null {
  if (value == null || value === "") {
    return "chat";
  }

  return value === "chat" || value === "system_notice" ? value : null;
}

function buildConversationCommand(
  input: TranscriptPersistenceCommandInput,
  trustedWorkspaceId: string
):
  | { ok: true; conversation: ConversationPersistenceCommand }
  | { ok: false; reason: TranscriptPersistenceRejectReason } {
  const conversationId = normalizeUuid(
    input.conversation?.id,
    "conversation_id_invalid"
  );
  if (!conversationId.ok) {
    return { ok: false, reason: conversationId.reason };
  }

  const publicReference = normalizeRequiredText(
    input.conversation.publicReference,
    MAX_PUBLIC_REFERENCE_LENGTH,
    "conversation_public_reference_invalid"
  );
  if (!publicReference.ok) {
    return { ok: false, reason: publicReference.reason };
  }

  const status = normalizeConversationStatus(input.conversation.status);
  if (!status) {
    return { ok: false, reason: "conversation_status_invalid" };
  }

  const clientSessionHash = normalizeClientSessionHash(
    input.conversation.clientSessionHash
  );
  if (!clientSessionHash.ok) {
    return { ok: false, reason: clientSessionHash.reason };
  }

  const quoteRequestId = normalizeOptionalUuid(
    input.conversation.quoteRequestId,
    "quote_request_id_invalid"
  );
  if (!quoteRequestId.ok) {
    return { ok: false, reason: quoteRequestId.reason };
  }

  const retentionExpiresAt = normalizeOptionalTimestamp(
    input.conversation.retentionExpiresAt
  );
  if (!retentionExpiresAt.ok) {
    return { ok: false, reason: retentionExpiresAt.reason };
  }

  const metadata = normalizeMetadata(
    input.conversation.metadata,
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
  input: TranscriptPersistenceCommandInput["messages"][number],
  trustedWorkspaceId: string,
  conversationId: string
):
  | { ok: true; message: MessagePersistenceCommand }
  | { ok: false; reason: TranscriptPersistenceRejectReason } {
  const messageId = normalizeUuid(input.id, "message_id_invalid");
  if (!messageId.ok) {
    return { ok: false, reason: messageId.reason };
  }

  const role = input.role?.trim();
  const messageType = normalizeMessageType(input.messageType);

  if (!messageType || !isValidMessageRoleType(role, messageType)) {
    return { ok: false, reason: "message_role_type_invalid" };
  }

  const content = input.content?.trim();
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

  if (
    input.sequenceNumber != null &&
    (!Number.isInteger(input.sequenceNumber) || input.sequenceNumber < 0)
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

  if (input.sequenceNumber != null) {
    message.sequenceNumber = input.sequenceNumber;
  }

  if (retentionExpiresAt.value) {
    message.retentionExpiresAt = retentionExpiresAt.value;
  }

  return { ok: true, message };
}

export function createTranscriptPersistenceCommand(
  input: TranscriptPersistenceCommandInput
): TranscriptPersistenceCommandResult {
  const trustedWorkspaceId = normalizeUuid(
    input.trustedWorkspaceId,
    "trusted_workspace_missing"
  );
  if (!trustedWorkspaceId.ok) {
    return reject(trustedWorkspaceId.reason);
  }

  if (!Array.isArray(input.messages) || input.messages.length === 0) {
    return reject("messages_missing");
  }

  const conversation = buildConversationCommand(
    input,
    trustedWorkspaceId.value
  );
  if (!conversation.ok) {
    return reject(conversation.reason);
  }

  const messages: MessagePersistenceCommand[] = [];
  for (const messageInput of input.messages) {
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
  const command = createTranscriptPersistenceCommand(input);

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
