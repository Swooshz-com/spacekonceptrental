import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTranscriptPersistenceCommand,
  getChatPersistence,
  persistTranscriptCommand,
  type TranscriptPersistenceCommandInput
} from "./index";

const transcriptInput: TranscriptPersistenceCommandInput = {
  trustedWorkspaceId: "11111111-1111-4111-8111-111111111111",
  conversation: {
    id: "22222222-2222-4222-8222-222222222222",
    publicReference: "chat-disabled-default",
    clientSessionHash: "b".repeat(64)
  },
  messages: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      role: "user",
      messageType: "chat",
      content: "I need 20 stools for an event",
      clientMessageId: "client-message-disabled-default",
      requestId: "request-disabled-default",
      sequenceNumber: 0
    }
  ]
};

function readPersistenceSource() {
  return [
    "lib/chat/persistence/types.ts",
    "lib/chat/persistence/contract.ts",
    "lib/chat/persistence/disabled-chat-persistence.ts",
    "lib/chat/persistence/index.ts"
  ]
    .map((filePath) => readFileSync(resolve(process.cwd(), filePath), "utf8"))
    .join("\n");
}

describe("disabled chat persistence scaffold", () => {
  it("keeps the default persistence adapter unavailable for transcript writes", async () => {
    const command = createTranscriptPersistenceCommand(transcriptInput);

    expect(command.ok).toBe(true);
    await expect(
      persistTranscriptCommand(transcriptInput, {
        adapter: getChatPersistence()
      })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "transcript_persistence_unavailable"
    });
  });

  it("keeps the scaffold server-only and unable to write chat data", () => {
    const source = readPersistenceSource();

    expect(source.match(/import "server-only";/g)).toHaveLength(4);
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain('from("conversations")');
    expect(source).not.toContain('from("messages")');
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("NEXT_PUBLIC_N8N");
    expect(source).not.toContain("chat-config");
  });
});
