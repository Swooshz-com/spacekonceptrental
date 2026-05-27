import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getSupabaseServerConfig,
  isSupabaseServerConfigured
} from "./env";
import { createServerSupabaseClient } from "./server";

const envKeys = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;
const originalEnv = new Map(
  envKeys.map((key) => [key, process.env[key]])
);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const skippedDirectories = new Set([".next", "node_modules"]);

function restoreEnv() {
  for (const key of envKeys) {
    const originalValue = originalEnv.get(key);

    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
}

function relativeSourcePath(absolutePath: string) {
  return absolutePath
    .slice(process.cwd().length + 1)
    .replace(/\\/g, "/");
}

function collectSourceFiles(relativeDirectory: string): string[] {
  const absoluteDirectory = resolve(process.cwd(), relativeDirectory);
  const entries = readdirSync(absoluteDirectory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (skippedDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = resolve(absoluteDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(relativeSourcePath(absolutePath)));
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(extname(entry.name))) {
      files.push(relativeSourcePath(absolutePath));
    }
  }

  return files;
}

function isProductionSource(filePath: string) {
  return !filePath.endsWith(".test.ts") && !filePath.endsWith(".test.tsx");
}

function readSources(filePaths: string[]) {
  return new Map(
    filePaths.map((filePath) => [
      filePath,
      readFileSync(resolve(process.cwd(), filePath), "utf8")
    ])
  );
}

function getBrowserFacingSources() {
  return readSources(
    [...collectSourceFiles("app"), ...collectSourceFiles("components")]
      .filter(isProductionSource)
      .filter((filePath) => !filePath.startsWith("app/api/"))
  );
}

describe("server Supabase runtime wiring", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("stays disabled when server env is missing and ignores public env", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.example.invalid";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    expect(isSupabaseServerConfigured()).toBe(false);
    expect(getSupabaseServerConfig()).toEqual({
      configured: false,
      missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
    });
    expect(createServerSupabaseClient()).toEqual({
      configured: false,
      client: null,
      missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
    });
  });

  it("creates a server client only from server-side env", () => {
    process.env.SUPABASE_URL = "https://project-ref.supabase.co";
    process.env.SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signature";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.example.invalid";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    const config = getSupabaseServerConfig();
    const result = createServerSupabaseClient();

    expect(config).toMatchObject({
      configured: true,
      supabaseUrl: "https://project-ref.supabase.co"
    });
    expect(config.configured && config.supabaseAnonKey).toBe(
      process.env.SUPABASE_ANON_KEY
    );
    expect(result.configured).toBe(true);
    expect(result.configured && typeof result.client.from).toBe("function");
  });

  it("marks the Supabase runtime modules server-only and private-env-only", () => {
    const source = [
      "lib/supabase/env.ts",
      "lib/supabase/server.ts"
    ]
      .map((filePath) => readFileSync(resolve(process.cwd(), filePath), "utf8"))
      .join("\n");
    const browserPublicSupabasePrefix = `${"NEXT"}_${"PUBLIC"}_${"SUPABASE"}_`;

    expect(source).toContain('import "server-only";');
    expect(source).toContain("SUPABASE_URL");
    expect(source).toContain("SUPABASE_ANON_KEY");
    expect(source).not.toContain(`${browserPublicSupabasePrefix}URL`);
    expect(source).not.toContain(`${browserPublicSupabasePrefix}ANON_KEY`);
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("keeps client components and browser-facing app code off Supabase", () => {
    const sourceByFile = getBrowserFacingSources();
    const combinedSource = [...sourceByFile.values()].join("\n");
    const clientComponentSources = [...sourceByFile.entries()].filter(
      ([, source]) =>
        source.startsWith('"use client";') || source.startsWith("'use client';")
    );
    const browserPublicSupabasePrefix = `${"NEXT"}_${"PUBLIC"}_${"SUPABASE"}_`;

    expect(clientComponentSources.map(([filePath]) => filePath)).toContain(
      "components/ChatWidget.tsx"
    );
    expect(combinedSource).not.toContain("@supabase/");
    expect(combinedSource).not.toContain("lib/supabase");
    expect(combinedSource).not.toContain("SUPABASE_URL");
    expect(combinedSource).not.toContain("SUPABASE_ANON_KEY");
    expect(combinedSource).not.toContain(browserPublicSupabasePrefix);

    for (const [, source] of clientComponentSources) {
      expect(source).not.toContain("@supabase/");
      expect(source).not.toContain("lib/supabase");
    }
  });

  it("leaves the existing chat API boundary independent of Supabase", () => {
    const source = [
      "app/api/chat/route.ts",
      "lib/chat/persistence/disabled-chat-persistence.ts",
      "lib/chat/persistence/index.ts",
      "lib/chat/persistence/types.ts",
      "lib/chat/n8n-provider.ts",
      "lib/chat/placeholder-provider.ts",
      "lib/chat/provider.ts",
      "lib/chat/provider-factory.ts"
    ]
      .map((filePath) => readFileSync(resolve(process.cwd(), filePath), "utf8"))
      .join("\n");

    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("lib/supabase");
    expect(source).not.toContain('from("conversations")');
    expect(source).not.toContain('from("messages")');
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain("SUPABASE_URL");
    expect(source).not.toContain("SUPABASE_ANON_KEY");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
  });
});
