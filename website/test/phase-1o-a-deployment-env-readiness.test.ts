import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const deploymentDocPath = "docs/DEPLOYMENT-ENVIRONMENT-READINESS.md";
const envContractPath = "docs/contracts/server-env-contract.json";
const bootstrapExamplePath =
  "docs/examples/supabase/active-catalogue-workspace.example.sql";
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const serverOnlyEnvNames = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "CATALOGUE_WORKSPACE_ID",
  "QUOTE_WORKSPACE_ID",
  "CHAT_PROVIDER",
  "N8N_CHAT_WEBHOOK_URL",
  "N8N_CHAT_WEBHOOK_TIMEOUT_MS",
  "CHAT_TRUSTED_CLIENT_IP_HEADER",
  "QUOTE_TRUSTED_CLIENT_IP_HEADER"
];
const forbiddenEnvPatterns = [
  "NEXT_PUBLIC_SUPABASE_*",
  "NEXT_PUBLIC_N8N*",
  "SUPABASE_SERVICE_ROLE_KEY"
];

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
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

function parseEnvContract() {
  const source = readRepoFile(envContractPath);

  return JSON.parse(source) as {
    phase?: string;
    status?: string;
    variables?: Array<{
      name?: string;
      visibility?: string;
      feature?: string;
      requiredFor?: string;
      browserAllowed?: boolean;
      status?: string;
      value?: unknown;
    }>;
    forbidden?: Array<{
      namePattern?: string;
      browserAllowed?: boolean;
      status?: string;
      value?: unknown;
    }>;
  };
}

describe("Phase 1O-A deployment environment readiness", () => {
  it("documents the future deployment env contract without approving deployment", () => {
    expect(existsSync(resolve(repoRoot, deploymentDocPath))).toBe(true);

    const doc = readRepoFile(deploymentDocPath);

    expect(doc).toContain("readiness only");
    expect(doc).toContain("No deployment is performed");
    expect(doc).toContain("Vercel-hosted `website/` Next.js app");
    expect(doc).toContain("server-only Supabase");
    expect(doc).toContain("temporary server-side n8n provider");
    expect(doc).toContain("catalogue_public_workspace_config");
    expect(doc).toContain("empty recovery states instead of sample listings");
    expect(doc).toContain("Quote route fails safely");
    expect(doc).toContain("Chat route fails safely");
    expect(doc).toContain("Future deployment preflight checklist");
    expect(doc).toContain(envContractPath);

    for (const envName of serverOnlyEnvNames) {
      expect(doc).toContain(envName);
    }

    for (const forbiddenPattern of forbiddenEnvPatterns) {
      expect(doc).toContain(forbiddenPattern);
    }

    expect(doc).toContain("website/chat-config.js");
    expect(doc).toContain("Actual Vercel deployment");
    expect(doc).toContain("Supabase Cloud connection");
    expect(doc).toContain("Production seed data");
    expect(doc).toContain("Service-role runtime paths");
  });

  it("keeps the machine-readable env contract placeholder-free and server-only", () => {
    expect(existsSync(resolve(repoRoot, envContractPath))).toBe(true);

    const contract = parseEnvContract();

    expect(contract.phase).toBe("Phase 2D-A");
    expect(contract.status).toBe("readiness-only");

    const variables = contract.variables ?? [];
    const variableByName = new Map(
      variables.map((variable) => [variable.name, variable])
    );

    for (const envName of serverOnlyEnvNames) {
      expect(variableByName.has(envName)).toBe(true);
      expect(variableByName.get(envName)).toMatchObject({
        visibility: "server-only",
        browserAllowed: false
      });
      expect(variableByName.get(envName)).not.toHaveProperty("value");
    }

    const forbidden = contract.forbidden ?? [];

    for (const forbiddenPattern of forbiddenEnvPatterns) {
      expect(forbidden).toContainEqual(
        expect.objectContaining({
          namePattern: forbiddenPattern,
          browserAllowed: false,
          status: "forbidden"
        })
      );
    }

    expect(JSON.stringify(contract)).not.toMatch(/https?:\/\//i);
    expect(JSON.stringify(contract)).not.toMatch(/\bsk-[A-Za-z0-9_-]{20,}\b/);
    expect(JSON.stringify(contract)).not.toMatch(
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
    );
  });

  it("keeps browser-facing production code away from deployment env secrets", () => {
    const browserSources = readTrackedProductionSources([
      "website/app",
      "website/components"
    ]).filter(({ filePath }) => !filePath.startsWith("website/app/api/"));
    const combinedSource = browserSources.map(({ source }) => source).join("\n");

    expect(combinedSource).not.toContain("@supabase/");
    expect(combinedSource).not.toContain("lib/supabase");
    expect(combinedSource).not.toContain("SUPABASE_URL");
    expect(combinedSource).not.toContain("SUPABASE_ANON_KEY");
    expect(combinedSource).not.toContain("CATALOGUE_WORKSPACE_ID");
    expect(combinedSource).not.toContain("QUOTE_WORKSPACE_ID");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(combinedSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(combinedSource).not.toContain("N8N_CHAT_WEBHOOK_URL");
    expect(combinedSource).not.toContain("N8N_CHAT_WEBHOOK_TIMEOUT_MS");
    expect(combinedSource).not.toContain("chat-config");
  });

  it("keeps env-reading runtime files server-only", () => {
    const envNames = [
      ...serverOnlyEnvNames,
      "SUPABASE_SERVICE_ROLE",
      "NEXT_PUBLIC_SUPABASE",
      "NEXT_PUBLIC_N8N"
    ];
    const sources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const envReadingSources = sources.filter(({ source }) =>
      envNames.some((envName) => source.includes(envName))
    );

    expect(envReadingSources.map(({ filePath }) => filePath).sort()).toEqual([
      "website/lib/catalogue/catalogue-repository.ts",
      "website/lib/hero/public-homepage-hero-repository.ts",
      "website/lib/page-media/public-page-media-repository.ts",
      "website/lib/quote/quote-email-delivery-log-repository.ts",
      "website/lib/quote/quote-repository.ts",
      "website/lib/server-runtime-config.ts",
      "website/lib/supabase/env.ts"
    ]);

    for (const { source } of envReadingSources) {
      expect(source).toContain('import "server-only";');
      expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
      expect(source).not.toContain("NEXT_PUBLIC_N8N");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
      expect(source).not.toContain("chat-config");
    }
  });

  it("does not add deployment config, production seed data, or workflow changes", () => {
    const deploymentConfigFiles = readTrackedFiles([
      "vercel.json",
      ".vercel",
      "website/vercel.json",
      "netlify.toml",
      "render.yaml",
      "fly.toml"
    ]);
    const workflows = readTrackedFiles([".github/workflows"]);
    const workflowSource = workflows.map(readRepoFile).join("\n").toLowerCase();
    const seeds = readTrackedFiles(["supabase/seeds"]);
    const seedSource = seeds.map(readRepoFile).join("\n");

    expect(deploymentConfigFiles).toEqual([]);
    expect(workflowSource).not.toContain("vercel");
    expect(workflowSource).not.toContain("deploy");
    expect(workflowSource).not.toContain("supabase login");
    expect(workflowSource).not.toContain("supabase link");
    expect(workflowSource).not.toContain("supabase db push");
    expect(seedSource).not.toContain("catalogue_public_workspace_config");
  });

  it("keeps catalogue, bootstrap, quote, chat, and product boundaries unchanged", () => {
    const catalogueSource = readRepoFile(
      "website/lib/catalogue/catalogue-repository.ts"
    );
    const bootstrapExample = readRepoFile(bootstrapExamplePath);
    const quoteRouteSource = readRepoFile("website/app/api/quote/route.ts");
    const runtimeConfigSource = readRepoFile("website/lib/server-runtime-config.ts");
    const chatProviderSource = readRepoFile("website/lib/chat/n8n-provider.ts");
    const chatPersistenceSource = readRepoFile(
      "website/lib/chat/persistence/disabled-chat-persistence.ts"
    );
    const productPersistenceSource = readRepoFile(
      "website/lib/products/persistence/disabled-product-persistence.ts"
    );

    expect(catalogueSource).toContain('rpc("get_public_catalogue"');
    expect(catalogueSource).toContain("expected_workspace_id");
    expect(catalogueSource).not.toContain('from("categories")');
    expect(catalogueSource).not.toContain(".insert(");
    expect(catalogueSource).not.toContain(".update(");
    expect(catalogueSource).not.toContain(".upsert(");
    expect(catalogueSource).not.toContain(".delete(");
    expect(bootstrapExample).toContain("EXAMPLE ONLY");
    expect(bootstrapExample).toContain("rollback;");
    expect(quoteRouteSource).toContain("consumeQuoteRateLimit");
    expect(runtimeConfigSource).toContain("QUOTE_TRUSTED_CLIENT_IP_HEADER");
    expect(chatProviderSource).toContain("getN8nChatRuntimeConfig");
    expect(chatPersistenceSource).not.toContain("@supabase/");
    expect(chatPersistenceSource).not.toContain("createServerSupabaseClient");
    expect(productPersistenceSource).not.toContain("@supabase/");
    expect(productPersistenceSource).not.toContain("createServerSupabaseClient");
  });

  it("keeps deployment docs free of real secret-looking values", () => {
    const docAndContract = [
      readRepoFile(deploymentDocPath),
      readRepoFile(envContractPath)
    ].join("\n");

    expect(docAndContract).not.toMatch(/https?:\/\/[^\s"'`<>]+/i);
    expect(docAndContract).not.toMatch(/\bsk-[A-Za-z0-9_-]{20,}\b/);
    expect(docAndContract).not.toMatch(
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
    );
    expect(docAndContract).not.toMatch(/\b[A-Z0-9_]+\s*=\s*[^\s]+/);
    expect(docAndContract).not.toContain("SpaceKonceptRental@gmail.com");
    expect(docAndContract).not.toContain(".supabase.co");
    expect(docAndContract).not.toContain(".vercel.app");
  });
});
