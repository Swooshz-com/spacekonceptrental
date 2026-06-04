import { describe, expect, it, vi } from "vitest";
import {
  createTranscriptPersistenceCommand,
  persistTranscriptCommand,
  type TranscriptPersistenceCommandInput
} from "./index";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const conversationId = "22222222-2222-4222-8222-222222222222";
const userMessageId = "33333333-3333-4333-8333-333333333333";
const assistantMessageId = "44444444-4444-4444-8444-444444444444";
const requestId = "request-2e-c";
const clientSessionHash = "a".repeat(64);

function validInput(
  overrides: Partial<TranscriptPersistenceCommandInput> = {}
): TranscriptPersistenceCommandInput {
  return {
    trustedWorkspaceId: workspaceId,
    conversation: {
      id: conversationId,
      publicReference: "chat-2e-c",
      clientSessionHash,
      metadata: {
        entryPoint: "chat-widget"
      }
    },
    messages: [
      {
        id: userMessageId,
        role: "user",
        messageType: "chat",
        content: "I need 20 chairs for a launch event.",
        clientMessageId: "client-message-2e-c",
        requestId,
        sequenceNumber: 0,
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
        metadata: {
          handoff: "quote-enquiry"
        }
      }
    ],
    ...overrides
  };
}

describe("Phase 2E-C transcript persistence contract", () => {
  it("builds minimized command objects without treating anonymous or client IDs as identity", () => {
    const result = createTranscriptPersistenceCommand(validInput());

    expect(result).toEqual({
      ok: true,
      command: {
        trustedWorkspaceId: workspaceId,
        conversation: {
          id: conversationId,
          workspaceId,
          publicReference: "chat-2e-c",
          status: "open",
          clientSessionHash,
          clientSessionHashPurpose: "anonymous_correlation_only",
          metadata: {
            entryPoint: "chat-widget"
          }
        },
        messages: [
          {
            id: userMessageId,
            workspaceId,
            conversationId,
            role: "user",
            messageType: "chat",
            content: "I need 20 chairs for a launch event.",
            clientMessageId: "client-message-2e-c",
            clientMessageIdPurpose: "idempotency_only",
            requestId,
            sequenceNumber: 0,
            metadata: {
              source: "public-chat"
            }
          },
          {
            id: assistantMessageId,
            workspaceId,
            conversationId,
            role: "assistant",
            messageType: "chat",
            content: "Could you share the event date and venue?",
            provider: "n8n",
            requestId,
            sequenceNumber: 1,
            metadata: {
              handoff: "quote-enquiry"
            }
          }
        ]
      }
    });
  });

  it("fails closed for missing workspace, invalid ids, invalid role/type pairs, oversized content, and unsafe metadata", () => {
    const cases: Array<{
      name: string;
      input: TranscriptPersistenceCommandInput;
      reason: string;
    }> = [
      {
        name: "trusted workspace missing",
        input: validInput({ trustedWorkspaceId: " " }),
        reason: "trusted_workspace_missing"
      },
      {
        name: "conversation id invalid",
        input: validInput({
          conversation: {
            ...validInput().conversation,
            id: "browser-conversation"
          }
        }),
        reason: "conversation_id_invalid"
      },
      {
        name: "message id invalid",
        input: validInput({
          messages: [
            {
              ...validInput().messages[0],
              id: "browser-message"
            }
          ]
        }),
        reason: "message_id_invalid"
      },
      {
        name: "role and message type mismatch",
        input: validInput({
          messages: [
            {
              ...validInput().messages[0],
              role: "assistant",
              messageType: "system_notice"
            }
          ]
        }),
        reason: "message_role_type_invalid"
      },
      {
        name: "content too large",
        input: validInput({
          messages: [
            {
              ...validInput().messages[0],
              content: "x".repeat(8_001)
            }
          ]
        }),
        reason: "message_content_too_large"
      },
      {
        name: "unsafe metadata key",
        input: validInput({
          conversation: {
            ...validInput().conversation,
            metadata: {
              webhookUrl: "https://example.invalid/private"
            }
          }
        }),
        reason: "metadata_unsafe_key"
      },
      {
        name: "metadata too large",
        input: validInput({
          messages: [
            {
              ...validInput().messages[0],
              metadata: {
                safe: "x".repeat(4_200)
              }
            }
          ]
        }),
        reason: "metadata_too_large"
      },
      {
        name: "anonymous session hash invalid",
        input: validInput({
          conversation: {
            ...validInput().conversation,
            clientSessionHash: "raw-browser-session"
          }
        }),
        reason: "anonymous_session_hash_invalid"
      },
      {
        name: "client message id invalid",
        input: validInput({
          messages: [
            {
              ...validInput().messages[0],
              clientMessageId: "x".repeat(129)
            }
          ]
        }),
        reason: "client_message_id_invalid"
      }
    ];

    for (const testCase of cases) {
      const result = createTranscriptPersistenceCommand(testCase.input);

      expect(result, testCase.name).toMatchObject({
        ok: false,
        status: "rejected",
        reason: testCase.reason
      });
    }
  });

  it("persists only through an injected adapter and returns safe results", async () => {
    const adapter = {
      persistTranscript: vi.fn(async (_command: unknown) => ({
        ok: true as const,
        conversationId,
        messageIds: [userMessageId, assistantMessageId]
      }))
    };

    const result = await persistTranscriptCommand(validInput(), { adapter });

    expect(result).toEqual({
      ok: true,
      status: "persisted",
      conversationId,
      messageIds: [userMessageId, assistantMessageId]
    });
    expect(adapter.persistTranscript).toHaveBeenCalledTimes(1);
    expect(adapter.persistTranscript.mock.calls[0][0]).toMatchObject({
      trustedWorkspaceId: workspaceId,
      conversation: {
        id: conversationId,
        workspaceId
      }
    });
  });

  it("returns generic safe failure shapes when validation or adapter dependencies fail", async () => {
    await expect(
      persistTranscriptCommand(validInput({ trustedWorkspaceId: "" }), {})
    ).resolves.toMatchObject({
      ok: false,
      status: "rejected",
      reason: "trusted_workspace_missing"
    });

    await expect(persistTranscriptCommand(validInput(), {})).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_persistence_unavailable"
    });

    const throwingAdapter = {
      persistTranscript: vi.fn(async (_command: unknown) => {
        throw new Error("upstream leaked token sk-secret and webhook URL");
      })
    };
    const result = await persistTranscriptCommand(validInput(), {
      adapter: throwingAdapter
    });

    expect(result).toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_persistence_unavailable"
    });
    expect(JSON.stringify(result)).not.toContain("sk-secret");
    expect(JSON.stringify(result)).not.toContain("webhook");
  });
});
