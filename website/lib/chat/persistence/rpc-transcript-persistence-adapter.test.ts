import { describe, expect, it, vi } from "vitest";
import {
  createRpcTranscriptPersistenceAdapter,
  persistTranscriptCommand,
  type TranscriptPersistenceCommandInput,
  type TranscriptPersistenceRpcPayload
} from "./index";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const conversationId = "22222222-2222-4222-8222-222222222222";
const quoteRequestId = "55555555-5555-4555-8555-555555555555";
const userMessageId = "33333333-3333-4333-8333-333333333333";
const assistantMessageId = "44444444-4444-4444-8444-444444444444";
const requestId = "request-2e-d";
const retentionExpiresAt = "2026-07-04T00:00:00.000Z";

function validInput(
  overrides: Partial<TranscriptPersistenceCommandInput> = {}
): TranscriptPersistenceCommandInput {
  return {
    trustedWorkspaceId: workspaceId,
    conversation: {
      id: conversationId,
      publicReference: "chat-2e-d",
      clientSessionHash: "c".repeat(64),
      quoteRequestId,
      retentionExpiresAt,
      metadata: {
        entryPoint: "chat-widget",
        enquiryIntent: "quote-request"
      }
    },
    messages: [
      {
        id: userMessageId,
        role: "user",
        messageType: "chat",
        content: "I need 20 chairs for a launch event.",
        clientMessageId: "client-message-2e-d",
        requestId,
        sequenceNumber: 0,
        retentionExpiresAt,
        metadata: {
          source: "public-chat"
        }
      },
      {
        id: assistantMessageId,
        role: "assistant",
        messageType: "chat",
        content: "Could you share the event date and venue?",
        provider: "n8n",
        requestId,
        sequenceNumber: 1,
        retentionExpiresAt,
        metadata: {
          handoff: "quote-enquiry"
        }
      }
    ],
    ...overrides
  };
}

describe("RPC transcript persistence adapter", () => {
  it("maps a validated command into the injected RPC executor payload", async () => {
    const executor = {
      persistTranscriptBatch: vi.fn(
        async (_payload: TranscriptPersistenceRpcPayload) => ({
          ok: true as const,
          conversationId,
          messageIds: [userMessageId, assistantMessageId]
        })
      )
    };
    const adapter = createRpcTranscriptPersistenceAdapter({ executor });

    const result = await persistTranscriptCommand(validInput(), { adapter });

    expect(result).toEqual({
      ok: true,
      status: "persisted",
      conversationId,
      messageIds: [userMessageId, assistantMessageId]
    });
    expect(executor.persistTranscriptBatch).toHaveBeenCalledTimes(1);
    expect(executor.persistTranscriptBatch).toHaveBeenCalledWith({
      p_workspace_id: workspaceId,
      p_conversation: {
        id: conversationId,
        workspace_id: workspaceId,
        public_reference: "chat-2e-d",
        client_session_hash: "c".repeat(64),
        quote_request_id: quoteRequestId,
        status: "open",
        retention_expires_at: retentionExpiresAt,
        metadata: {
          entryPoint: "chat-widget",
          enquiryIntent: "quote-request"
        }
      },
      p_messages: [
        {
          id: userMessageId,
          workspace_id: workspaceId,
          conversation_id: conversationId,
          role: "user",
          message_type: "chat",
          content: "I need 20 chairs for a launch event.",
          provider: null,
          client_message_id: "client-message-2e-d",
          request_id: requestId,
          sequence_number: 0,
          retention_expires_at: retentionExpiresAt,
          metadata: {
            source: "public-chat"
          }
        },
        {
          id: assistantMessageId,
          workspace_id: workspaceId,
          conversation_id: conversationId,
          role: "assistant",
          message_type: "chat",
          content: "Could you share the event date and venue?",
          provider: "n8n",
          client_message_id: null,
          request_id: requestId,
          sequence_number: 1,
          retention_expires_at: retentionExpiresAt,
          metadata: {
            handoff: "quote-enquiry"
          }
        }
      ]
    });
  });

  it("preserves clientMessageId only as an idempotency field in the RPC payload", async () => {
    const executor = {
      persistTranscriptBatch: vi.fn(
        async (_payload: TranscriptPersistenceRpcPayload) => ({
          ok: true as const,
          conversationId,
          messageIds: [userMessageId]
        })
      )
    };
    const adapter = createRpcTranscriptPersistenceAdapter({ executor });

    await persistTranscriptCommand(
      validInput({ messages: [validInput().messages[0]] }),
      { adapter }
    );

    const payload = executor.persistTranscriptBatch.mock.calls[0][0];

    expect(payload.p_messages[0]).toMatchObject({
      client_message_id: "client-message-2e-d"
    });
    expect(JSON.stringify(payload)).not.toContain("clientMessageIdPurpose");
    expect(JSON.stringify(payload)).not.toContain("identity");
    expect(JSON.stringify(payload)).not.toContain("authorization");
  });

  it("returns safe unavailable results when the RPC executor is missing, fails, or throws", async () => {
    await expect(
      persistTranscriptCommand(validInput(), {
        adapter: createRpcTranscriptPersistenceAdapter({})
      })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_persistence_unavailable"
    });

    await expect(
      persistTranscriptCommand(validInput(), {
        adapter: createRpcTranscriptPersistenceAdapter({
          executor: {
            persistTranscriptBatch: vi.fn(
              async (_payload: TranscriptPersistenceRpcPayload) => ({
                ok: false as const,
                reason: "rpc_rejected" as const
              })
            )
          }
        })
      })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_persistence_unavailable"
    });

    await expect(
      persistTranscriptCommand(validInput(), {
        adapter: createRpcTranscriptPersistenceAdapter({
          executor: {
            persistTranscriptBatch: vi.fn(
              async (_payload: TranscriptPersistenceRpcPayload) => {
                throw new Error(
                  "leaked provider token and raw webhook payload"
                );
              }
            )
          }
        })
      })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_persistence_unavailable"
    });
  });

  it("rejects invalid IDs and unsafe metadata before the executor can run", async () => {
    const executor = {
      persistTranscriptBatch: vi.fn(
        async (_payload: TranscriptPersistenceRpcPayload) => ({
          ok: true as const,
          conversationId,
          messageIds: [userMessageId]
        })
      )
    };
    const adapter = createRpcTranscriptPersistenceAdapter({ executor });

    await expect(
      persistTranscriptCommand(
        validInput({
          trustedWorkspaceId: "browser-workspace"
        }),
        { adapter }
      )
    ).resolves.toMatchObject({
      ok: false,
      status: "rejected",
      reason: "trusted_workspace_missing"
    });

    await expect(
      persistTranscriptCommand(
        validInput({
          conversation: {
            ...validInput().conversation,
            metadata: {
              rawHeaders: {
                authorization: "blocked"
              }
            }
          }
        }),
        { adapter }
      )
    ).resolves.toMatchObject({
      ok: false,
      status: "rejected",
      reason: "metadata_unsafe_key"
    });

    expect(executor.persistTranscriptBatch).not.toHaveBeenCalled();
  });
});
