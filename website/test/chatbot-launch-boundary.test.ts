import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string) {
  return readFileSync(resolve(process.cwd(), "..", path), "utf8");
}

function readWebsiteFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("public chatbot launch boundary", () => {
  it("documents chatbot as public guidance only without hosted readiness claims", () => {
    const boundary = readRepoFile("docs/CHATBOT-LAUNCH-BOUNDARY.md");
    const roadmap = readRepoFile("docs/LAUNCH-ROADMAP.md");

    expect(boundary).toContain("public chatbot boundary");
    expect(boundary).toContain("Help visitors navigate Home, Catalogue, Setups, About, and Request Quote");
    expect(boundary).toContain("Suggest using the Request Quote form");
    expect(boundary).toContain("Confirm booking or reservation");
    expect(boundary).toContain("Promise stock/item availability");
    expect(boundary).toContain("Quote final price");
    expect(boundary).toContain("Take payment");
    expect(boundary).toContain("Claim email or n8n delivery succeeded");
    expect(boundary).toContain("Call n8n directly from browser code");
    expect(boundary).toContain("Hostinger VPS, Coolify, the hosted n8n app");
    expect(boundary).toContain("No hosted staging readiness or UAT pass is claimed");
    expect(roadmap).toContain("Status: implemented in this PR as a public chatbot launch boundary slice");
    expect(roadmap).toMatch(/Real\s+n8n workflow implementation\/mapping remains deferred/);
    expect(roadmap).toContain("docs/CHATBOT-LAUNCH-BOUNDARY.md");
  });

  it("keeps browser chat on first-party API and out of protected admin routes", () => {
    const routeShell = readWebsiteFile("app/route-shell.tsx");
    const chatWidget = readWebsiteFile("components/ChatWidget.tsx");
    const combinedBrowserSource = `${routeShell}\n${chatWidget}`;

    expect(routeShell).toContain("function isAdminRoute");
    expect(routeShell).toContain('pathname === "/admin"');
    expect(routeShell).toContain('pathname?.startsWith("/admin/")');
    expect(routeShell.indexOf("<ChatWidget />")).toBeGreaterThan(
      routeShell.indexOf("function PublicSiteShell")
    );
    expect(chatWidget).toContain('fetch("/api/chat"');
    expect(chatWidget).toContain("Request Quote");
    expect(combinedBrowserSource).not.toContain("N8N_CHAT_WEBHOOK_URL");
    expect(combinedBrowserSource).not.toContain("N8N_ENQUIRY_HANDOFF_WEBHOOK_URL");
    expect(combinedBrowserSource).not.toContain("N8N_ENQUIRY_HANDOFF_SHARED_SECRET");
    expect(combinedBrowserSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(combinedBrowserSource).not.toMatch(/https?:\/\/[^\s"'`]+\/webhook/i);
    expect(combinedBrowserSource).not.toMatch(
      /\b(?:cart|checkout|payment|order|booking|reservation|stock|inventory|customer account|crm pipeline)\b/i
    );
  });

  it("keeps launch guardrails in the server chat boundary", () => {
    const boundarySource = readWebsiteFile("lib/chat/launch-boundary.ts");
    const routeSource = readWebsiteFile("app/api/chat/route.ts");
    const providerSource = readWebsiteFile("lib/chat/n8n-provider.ts");

    expect(boundarySource).toContain("public visitor guidance only");
    expect(boundarySource).toContain("Request Quote");
    expect(boundarySource).toContain("Never instruct the browser to call n8n directly");
    expect(routeSource).toContain("applyChatbotLaunchBoundary");
    expect(providerSource).toContain("launchBoundary");
    expect(providerSource).toContain("chatbotLaunchBoundaryInstructions");
  });
});
