import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../app/api/chat/route";
import { N8nChatProvider } from "./n8n-provider";
import { ChatProviderError } from "./provider";
import { getChatProvider } from "./provider-factory";

const originalChatProvider = process.env.CHAT_PROVIDER;
const originalWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;

const validPayload = {
  clientSessionId: "provider-selection-session",
  clientMessageId: "provider-selection-message",
  message: {
    role: "user",
    content: "I need 20 stools for an event"
  },
  capabilities: {
    stream: false
  },
  locale: "en-SG",
  timezone: "Asia/Singapore"
};

function restoreEnv() {
  if (originalChatProvider === undefined) {
    delete process.env.CHAT_PROVIDER;
  } else {
    process.env.CHAT_PROVIDER = originalChatProvider;
  }

  if (originalWebhookUrl === undefined) {
    delete process.env.N8N_CHAT_WEBHOOK_URL;
  } else {
    process.env.N8N_CHAT_WEBHOOK_URL = originalWebhookUrl;
  }
}

function postJson(payload: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" }
  });
}

function readProductionChatBoundarySource() {
  return [
    "app/api/chat/route.ts",
    "components/ChatWidget.tsx",
    "lib/chat/n8n-provider.ts",
    "lib/chat/provider-factory.ts",
    "next.config.mjs"
  ]
    .map((filePath) => readFileSync(resolve(process.cwd(), filePath), "utf8"))
    .join("\n");
}

function getTrackedBrowserFacingSource() {
  const sourceFiles = execFileSync("git", ["ls-files", "app", "components"], {
    cwd: process.cwd(),
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(
      (filePath) =>
        filePath.endsWith(".tsx") && !filePath.endsWith(".test.tsx")
    );

  return new Map(
    sourceFiles.map((filePath) => [
      filePath,
      readFileSync(resolve(process.cwd(), filePath), "utf8")
    ])
  );
}

describe("getChatProvider", () => {
  afterEach(() => {
    restoreEnv();
    vi.restoreAllMocks();
  });

  it("defaults unset CHAT_PROVIDER to the n8n provider path", () => {
    delete process.env.CHAT_PROVIDER;

    expect(getChatProvider()).toBeInstanceOf(N8nChatProvider);
  });

  it("uses the n8n provider path when CHAT_PROVIDER is n8n", () => {
    process.env.CHAT_PROVIDER = "n8n";

    expect(getChatProvider()).toBeInstanceOf(N8nChatProvider);
  });

  it("fails safely for unknown CHAT_PROVIDER values", () => {
    process.env.CHAT_PROVIDER = "legacy-browser-n8n";

    expect(() => getChatProvider()).toThrow(ChatProviderError);

    try {
      getChatProvider();
    } catch (error) {
      expect(error).toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
      expect(String(error)).not.toContain("legacy-browser-n8n");
    }
  });

  it("normalizes unknown provider errors through the chat route", async () => {
    process.env.CHAT_PROVIDER = "legacy-browser-n8n";

    const response = await POST(postJson(validPayload));
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body.error).toEqual({
      code: "PROVIDER_UNAVAILABLE",
      message:
        "The assistant is temporarily unavailable. Please leave your contact details and the team will follow up."
    });
    expect(serialized).not.toContain("legacy-browser-n8n");
  });

  it("does not introduce browser-public provider or n8n environment names", () => {
    const source = readProductionChatBoundarySource();
    const browserPublicPrefix = `${"NEXT"}_${"PUBLIC"}_`;

    expect(source).not.toContain(`${browserPublicPrefix}CHAT_PROVIDER`);
    expect(source).not.toContain(`${browserPublicPrefix}N8N`);
  });

  it("keeps tracked browser-facing code on the custom ChatWidget path", () => {
    const sourceByFile = getTrackedBrowserFacingSource();
    const combinedSource = [...sourceByFile.values()].join("\n");
    const apiChatCallers = [...sourceByFile.entries()]
      .filter(([, source]) => source.includes('"/api/chat"'))
      .map(([filePath]) => filePath);

    expect(combinedSource).not.toContain("@n8n/chat");
    expect(combinedSource).not.toContain("N8N_CHAT_WEBHOOK_URL");
    expect(combinedSource).not.toContain("N8N_CHAT_WEBHOOK_TIMEOUT_MS");
    expect(combinedSource).not.toMatch(
      /https?:\/\/[^\s"'`]+\/webhook(?:-test)?\//i
    );
    expect(apiChatCallers).toEqual(["components/ChatWidget.tsx"]);
    expect(sourceByFile.get("app/layout.tsx")).toContain("ChatWidget");
  });
});
