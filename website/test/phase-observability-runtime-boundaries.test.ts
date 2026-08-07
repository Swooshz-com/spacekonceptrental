import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  APP_OPERATION_EVENT_PROOF_TTL_SECONDS
} from "../lib/application-events/app-operation-event-signer";
import {
  APP_OPERATION_EVENT_BACKOFF_MS,
  APP_OPERATION_EVENT_CIRCUIT_OPEN_MS,
  APP_OPERATION_EVENT_EMIT_BUDGET_MS,
  APP_OPERATION_EVENT_MAX_RPC_ATTEMPTS,
  appOperationEventSinkConsolePrefix
} from "../lib/application-events/app-operation-event-sink";

const websiteRoot = process.cwd();
const repoRoot = resolve(websiteRoot, "..");

function read(sourcePath: string) {
  return readFileSync(resolve(websiteRoot, sourcePath), "utf8");
}

function readRepo(sourcePath: string) {
  return readFileSync(resolve(repoRoot, sourcePath), "utf8");
}

const applicationEventFiles = [
  "lib/application-events/app-operation-event-types.ts",
  "lib/application-events/app-operation-event-signer.ts",
  "lib/application-events/app-operation-event-sink.ts",
  "lib/application-events/app-operation-event-call-sites.ts",
  "lib/application-events/app-operation-event-operations-query.ts",
  "lib/application-events/app-operation-event-operations-mapper.ts",
  "lib/application-events/app-operation-event-operations-repository.ts",
  "lib/application-events/app-operation-event-operations-summary.ts",
  "lib/application-events/app-operation-event-operations-read.ts",
  "lib/application-events/app-operation-event-sink-display.ts"
];

describe("M2A observability runtime boundaries", () => {
  it("locks the signing, deadline, retry and circuit constants", () => {
    expect(APP_OPERATION_EVENT_PROOF_TTL_SECONDS).toBe(60);
    expect(APP_OPERATION_EVENT_EMIT_BUDGET_MS).toBe(750);
    expect(APP_OPERATION_EVENT_MAX_RPC_ATTEMPTS).toBe(2);
    expect(APP_OPERATION_EVENT_BACKOFF_MS).toBe(100);
    expect(APP_OPERATION_EVENT_CIRCUIT_OPEN_MS).toBe(60_000);
  });

  it("keeps every application-events module server-only", () => {
    for (const sourcePath of applicationEventFiles) {
      expect(read(sourcePath), sourcePath).toContain('import "server-only";');
    }
  });

  it("keeps the sink free of recursion and free of gateway coupling", () => {
    const sinkSource = read("lib/application-events/app-operation-event-sink.ts");
    const callSitesSource = read(
      "lib/application-events/app-operation-event-call-sites.ts"
    );

    expect(sinkSource).not.toContain("application-error-logging");
    expect(sinkSource).not.toContain("logApplicationError");
    expect(sinkSource).not.toContain("admin-authorization");
    expect(sinkSource).not.toContain("server-admin-runtime-gate");
    expect(sinkSource).not.toContain("SINK_UNAVAILABLE");
    expect(callSitesSource).not.toContain("admin-authorization");
    expect(callSitesSource).not.toContain("application-error-logging");
  });

  it("keeps the legacy console logger byte-identical in behaviour and uncoupled", () => {
    const loggerSource = read("lib/application-error-logging.ts");

    expect(loggerSource).toContain('console.error("application_error"');
    expect(loggerSource).not.toContain("application-events");
    expect(loggerSource).not.toContain("record_app_operation_event");
    expect(loggerSource).not.toContain("APP_OPERATION");
  });

  it("keeps the console fallback prefix fixed and bounded", () => {
    expect(appOperationEventSinkConsolePrefix).toBe(
      "app_operation_event_sink"
    );
    expect(appOperationEventSinkConsolePrefix).toMatch(/^[a-z_]+$/);
  });

  it("excludes forbidden call sites from M2A wiring", () => {
    const chatRouteSource = read("app/api/chat/route.ts");
    const setupRecipeWriteSource = read(
      "lib/catalogue/admin-setup-recipe-write-route.ts"
    );

    expect(chatRouteSource).not.toContain("application-events");
    expect(setupRecipeWriteSource).not.toContain("application-events");
  });

  it("never emits generic success events or excluded categories", () => {
    const callSitesSource = read(
      "lib/application-events/app-operation-event-call-sites.ts"
    );
    const typesSource = read(
      "lib/application-events/app-operation-event-types.ts"
    );

    expect(callSitesSource).not.toContain("succeeded");
    expect(callSitesSource).not.toContain("quote.submission.created");
    expect(callSitesSource).not.toContain("chat");
    expect(typesSource).not.toContain("quote.submission.created");
  });

  it("contains no service-role or browser secret access", () => {
    for (const sourcePath of applicationEventFiles) {
      const source = read(sourcePath);

      expect(source, sourcePath).not.toContain("service_role");
      expect(source, sourcePath).not.toContain("SERVICE_ROLE");
      expect(source, sourcePath).not.toContain("NEXT_PUBLIC");
    }
    expect(read("lib/server-runtime-config.ts")).not.toContain(
      "NEXT_PUBLIC_APP_OPERATION"
    );
  });

  it("keeps the protected M2B admin read surface bounded and free of public sink routes or read flags", () => {
    const apiRoutes = readdirSync(resolve(websiteRoot, "app/api"), {
      recursive: true
    })
      .filter((entry) => typeof entry === "string" && entry.endsWith("route.ts"))
      .map(String);

    expect(
      apiRoutes.some((entry) => entry.includes("sink-status"))
    ).toBe(false);
    expect(
      apiRoutes.some((entry) => entry.includes("operations"))
    ).toBe(false);
    expect(existsSync(resolve(websiteRoot, "app/admin/operations"))).toBe(
      true
    );
    expect(
      existsSync(resolve(websiteRoot, "app/admin/operations/page.tsx"))
    ).toBe(true);
    expect(read("lib/server-runtime-config.ts")).not.toContain(
      "APP_OPERATION_EVENTS_READ_ENABLED"
    );
  });

  it("reads sink state without emitting events or probing through an RPC", () => {
    const readSource = read(
      "lib/application-events/app-operation-event-operations-read.ts"
    );
    const displaySource = read(
      "lib/application-events/app-operation-event-sink-display.ts"
    );
    const pageSource = read("app/admin/operations/page.tsx");

    expect(readSource).not.toContain("emitAppOperationEvent");
    expect(readSource).not.toContain(".rpc(");
    expect(displaySource).not.toContain("emitAppOperationEvent");
    expect(displaySource).not.toContain(".rpc(");
    expect(pageSource).not.toContain("emitAppOperationEvent");
    expect(pageSource).not.toContain("record_app_operation_event");
  });

  it("keeps every M1 migration and its exact count unchanged", () => {
    const migrations = readdirSync(resolve(repoRoot, "supabase/migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    expect(migrations).toHaveLength(38);
    expect(migrations.at(-1)).toBe(
      "20260805141500_app_operation_events_foundation.sql"
    );
    const migration = readRepo(
      "supabase/migrations/20260805141500_app_operation_events_foundation.sql"
    );

    expect(migration).toContain("create table public.app_operation_events (");
    expect(migration).not.toContain("grant insert");
    expect(migration).not.toContain("grant update");
    expect(migration).not.toContain("grant delete");
  });

  it("keeps the M1 write RPC signature, grants and policy contract unchanged", () => {
    const contract = readRepo(
      "scripts/security-definer-privilege-contract.cjs"
    );

    expect(contract).toContain(
      "public.record_app_operation_event(uuid,uuid,text,text,text,text,text,text,integer,bigint,text,bigint,text)"
    );
    expect(contract).toContain(
      "private.app_operation_event_payload_digest(uuid,uuid,text,text,text,text,text,text,integer,bigint)"
    );
    const migration = readRepo(
      "supabase/migrations/20260805141500_app_operation_events_foundation.sql"
    );

    expect(migration).toContain(
      "create policy app_operation_events_admin_read"
    );
    expect(migration).toContain(
      "grant execute on function public.record_app_operation_event("
    );
  });

  it("keeps the admission secret out of tracked environment and template files", () => {
    const tracked = readRepo("scripts/validate-app-operation-event-runtime-readiness.cjs");

    expect(tracked).toContain("APP_OPERATION_EVENT_ADMISSION_SECRET");
    const chatConfigExample = readRepo("website/chat-config.example.js");

    expect(chatConfigExample).not.toContain("APP_OPERATION_EVENT");
  });

  it("wires the readiness validator into the root package manifest and CI", () => {
    const packageJson = readRepo("package.json");

    expect(packageJson).toContain(
      '"validate:app-operation-event-runtime-readiness"'
    );
    expect(packageJson).toContain(
      '"test:app-operation-event-runtime-readiness"'
    );
    const ci = readRepo(".github/workflows/ci.yml");

    expect(ci).toContain("npm run validate:app-operation-event-runtime-readiness");
    expect(ci).toContain("npm run test:app-operation-event-runtime-readiness");
  });
});
