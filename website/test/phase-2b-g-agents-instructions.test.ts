import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const agentsPath = "AGENTS.md";
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

const expectedN8nWorkflowHashes = new Map([
  [
    "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
    "96fe4b6832b6c4680f6d6dcbdd311b901e6c73610afd2747de7c0c06a84c1a2c"
  ],
  [
    "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
    "0f869a547cc9bde78335a16c9516e565b1e1097d9b3c5b95bc8448e00c01b9b2"
  ],
  [
    "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json",
    "913928a75068562eeb23eaa3ac6a69e2bee01a6a9eaf8e5c41e58eb153c54c6f"
  ]
]);

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function readTrackedFiles(paths: string[]) {
  return execFileSync("git", ["ls-files", "--", ...paths], {
    cwd: repoRoot,
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

function isProductionSource(filePath: string) {
  return (
    sourceExtensions.has(extname(filePath)) &&
    !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath) &&
    !filePath.startsWith("website/test/")
  );
}

function readTrackedProductionSources(paths: string[]) {
  return readTrackedFiles(paths)
    .filter(isProductionSource)
    .map((filePath) => ({
      filePath,
      source: readRepoFile(filePath)
    }));
}

function expectNoTrackedFiles(paths: string[]) {
  expect(readTrackedFiles(paths)).toEqual([]);
}

function hashRepoFile(relativePath: string) {
  return createHash("sha256")
    .update(readRepoFile(relativePath).replace(/\r\n/g, "\n"))
    .digest("hex");
}

describe("Phase 2B-G repo agent instructions refresh", () => {
  it("refreshes AGENTS.md with current status, docs, checklist, and agent-behaviour rules", () => {
    expect(existsSync(resolve(repoRoot, agentsPath))).toBe(true);

    const agents = readRepoFile(agentsPath);
    const normalizedAgents = normalizeWhitespace(agents);

    expect(agents).toContain("docs/PHASE-STATUS.md");
    expect(agents).toContain("docs/PHASE-ROADMAP.md");
    expect(agents).toContain("docs/checklists/README.md");
    expect(agents).toContain("docs/SAFETY-BOUNDARIES.md");
    expect(agents).toContain("docs/DECISION-LOG.md");
    expect(normalizedAgents).toContain(
      "Every phase/status PR must update exactly the relevant checklist(s)."
    );
    expect(normalizedAgents).toContain(
      "Do not mark planned, scaffolded, design, or policy work as runtime complete."
    );
    expect(normalizedAgents).toContain(
      "Runtime blockers stay unchecked until runtime code exists and tests prove it."
    );
    expect(normalizedAgents).toContain(
      "Completed design/scaffold/policy work must be named as design/scaffold/policy."
    );
    expect(normalizedAgents).toContain(
      "Cross-link instead of duplicating checklist items."
    );
    expect(normalizedAgents).toContain(
      "Start by confirming current branch, head, and dirty state."
    );
    expect(normalizedAgents).toContain(
      "If on an old branch, update from current main before creating a new branch."
    );
    expect(normalizedAgents).toContain("Keep PRs narrow.");
    expect(normalizedAgents).toContain(
      "Avoid unrelated cleanup unless owner explicitly approves it."
    );
    expect(normalizedAgents).toContain(
      "When the owner explicitly approves a deletion/move, document it in the PR body."
    );
    expect(normalizedAgents).toContain(
      "Do not stop after setup; continue implementation unless blocked by a real error."
    );
  });

  it("keeps AGENTS.md aligned with the current n8n/Pinecone and future SaaS boundary", () => {
    const normalizedAgents = normalizeWhitespace(readRepoFile(agentsPath));

    expect(normalizedAgents).toContain(
      "The current SKR website may keep using the existing n8n/Pinecone chatbot workflow as a temporary production bridge."
    );
    expect(normalizedAgents).toContain(
      "n8n remains temporary server-side integration only."
    );
    expect(normalizedAgents).toContain("Browser must never call n8n directly.");
    expect(normalizedAgents).toContain(
      "The future SaaS chatbot should be a separate project/app."
    );
    expect(normalizedAgents).toContain(
      "SKR can later become the first client/tenant of that SaaS chatbot."
    );
    expect(normalizedAgents).toContain(
      "Do not implement SaaS chatbot app work in this repo yet."
    );
    expect(normalizedAgents).toContain(
      "Do not migrate Pinecone in this repo yet."
    );
    expect(normalizedAgents).toContain(
      "Do not add Pinecone runtime code or credentials without separate approval."
    );
  });

  it("keeps AGENTS.md explicit about current runtime blockers", () => {
    const normalizedAgents = normalizeWhitespace(readRepoFile(agentsPath));

    for (const blockedItem of [
      "Real auth runtime wiring remains blocked.",
      "Supabase Auth runtime wiring remains blocked.",
      "Cookie reads remain blocked.",
      "Header reads remain blocked.",
      "Login/logout routes remain blocked.",
      "Protected admin pages remain blocked.",
      "Admin UI remains blocked.",
      "Resolver/adapter runtime wiring remains blocked.",
      "Product/category/product image writes remain blocked.",
      "Conversation/message writes remain blocked.",
      "Supabase Cloud connection remains blocked.",
      "Deployment and Vercel config remain blocked.",
      "Browser Supabase remains blocked.",
      "Service-role runtime paths remain blocked unless separately approved."
    ]) {
      expect(normalizedAgents).toContain(blockedItem);
    }
  });

  it("does not add admin, auth, login/logout, product mutation, SaaS, Pinecone, deployment, or env paths", () => {
    expectNoTrackedFiles([
      "website/app/admin",
      "website/app/login",
      "website/app/logout",
      "website/app/api/auth",
      "website/app/api/login",
      "website/app/api/logout",
      "website/app/api/products",
      "website/app/api/categories",
      "website/app/api/product-images",
      "website/app/api/catalogue",
      "website/app/saas",
      "website/app/api/saas",
      "website/lib/saas",
      "website/lib/pinecone",
      "website/app/api/pinecone",
      "vercel.json",
      ".vercel",
      "website/vercel.json",
      ".env",
      ".env.local",
      ".env.production",
      ".env.test",
      "website/.env",
      "website/.env.local",
      "website/.env.production",
      "website/.env.test"
    ]);
  });

  it("does not add product/category/image writes, conversation/message writes, Supabase Auth wiring, cookie/header reads, or browser Supabase", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const combinedSource = productionSources
      .map(({ source }) => source)
      .join("\n");
    const browserSource = productionSources
      .filter(
        ({ filePath }) =>
          !filePath.startsWith("website/app/api/") &&
          !filePath.startsWith("website/lib/supabase/")
      )
      .map(({ source }) => source)
      .join("\n");

    expect(combinedSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(combinedSource).not.toMatch(
      /from\(["'](?:conversations|messages)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(combinedSource).not.toMatch(
      /\.auth\.(?:getUser|getSession|signIn|signOut|setSession|exchangeCodeForSession)/m
    );
    expect(combinedSource).not.toContain("createServerClient");
    expect(combinedSource).not.toContain("cookies()");
    expect(combinedSource).not.toContain("headers()");
    expect(combinedSource).not.toContain("next/headers");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(combinedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(browserSource).not.toContain("@supabase/");
    expect(browserSource).not.toContain("lib/supabase");
    expect(browserSource).not.toContain("SUPABASE_URL");
    expect(browserSource).not.toContain("SUPABASE_ANON_KEY");
  });

  it("does not add Pinecone runtime code, Pinecone credentials, SaaS chatbot code, or n8n workflow changes", () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");
    const workflowFiles = readTrackedFiles(["n8n-workflows"]).sort();

    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("InternalSaasChatProvider");
    expect(workflowFiles).toEqual([...expectedN8nWorkflowHashes.keys()].sort());

    for (const [filePath, expectedHash] of expectedN8nWorkflowHashes) {
      expect(hashRepoFile(filePath)).toBe(expectedHash);
    }
  });

  it("keeps website/chat-config.js untracked and unused without reading it", () => {
    expectNoTrackedFiles(["website/chat-config.js"]);

    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");

    expect(productionSource).not.toContain("chat-config");
  });
});
