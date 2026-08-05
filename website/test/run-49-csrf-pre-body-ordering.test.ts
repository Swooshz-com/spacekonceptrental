import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const websiteRoot = process.cwd();

const bodyProcessingRoutes = [
  "app/api/admin/admin-access/route.ts",
  "lib/catalogue/admin-setup-recipe-write-route.ts",
  "lib/page-media/admin-public-page-media-write-route.ts",
  "lib/products/persistence/admin-product-write-route.ts",
  "lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-route.ts",
  "lib/quote/admin-write/admin-quote-request-crm-handoff-route.ts",
  "lib/quote/admin-write/admin-quote-request-status-route.ts"
] as const;

const uploadRoutes = [
  "lib/hero/admin-homepage-hero-write-route.ts",
  "lib/products/media/admin-product-image-upload-route.ts"
] as const;

const routeCallOrder: Record<string, { gate: RegExp; body: RegExp }> = {
  "lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-route.ts": {
    gate: /if \(!routeGate\.allowed\)/,
    body: /const body = await parseBody\(request\)/
  },
  "lib/hero/admin-homepage-hero-write-route.ts": {
    gate: /const gate = await verifyAdminWriteBoundary\(/,
    body: /const parsed = await parseHeroImagePayload\(request\)/
  },
  "lib/products/media/admin-product-image-upload-route.ts": {
    gate: /const authorization = await authorizeUpload\(/,
    body: /const parsed = await parseUploadPayload\(request\)/
  }
};

const bodylessRoutes = [
  "lib/quote/admin-read/admin-quote-request-crm-handoff-lifecycle-reconciliation-route.ts",
  "lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route.ts",
  "lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight-route.ts",
  "lib/quote/admin-read/admin-quote-request-hubspot-import-csv-route.ts",
  "lib/quote/admin-read/admin-quote-request-hubspot-sync-dry-run-contract-route.ts"
] as const;

const bodyReaderPattern =
  /request\.(?:json|text|formData|arrayBuffer|blob|clone)|await\s+readBounded(?:JsonBody|UrlEncodedFormBody)|\.getReader\(/;

function source(path: string) {
  return readFileSync(resolve(websiteRoot, path), "utf8");
}

function firstMatchIndex(value: string, pattern: RegExp) {
  const match = pattern.exec(value);
  return match?.index ?? -1;
}

describe("Run-49 protected caller ordering inventory", () => {
  it("keeps all 14 callers classified", () => {
    expect([
      ...bodyProcessingRoutes,
      ...uploadRoutes,
      ...bodylessRoutes
    ].sort()).toEqual([
      "app/api/admin/admin-access/route.ts",
      "lib/catalogue/admin-setup-recipe-write-route.ts",
      "lib/hero/admin-homepage-hero-write-route.ts",
      "lib/page-media/admin-public-page-media-write-route.ts",
      "lib/products/media/admin-product-image-upload-route.ts",
      "lib/products/persistence/admin-product-write-route.ts",
      "lib/quote/admin-read/admin-quote-request-crm-handoff-lifecycle-reconciliation-route.ts",
      "lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route.ts",
      "lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight-route.ts",
      "lib/quote/admin-read/admin-quote-request-hubspot-import-csv-route.ts",
      "lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-route.ts",
      "lib/quote/admin-read/admin-quote-request-hubspot-sync-dry-run-contract-route.ts",
      "lib/quote/admin-write/admin-quote-request-crm-handoff-route.ts",
      "lib/quote/admin-write/admin-quote-request-status-route.ts"
    ].sort());
  });

  it.each(bodyProcessingRoutes)(
    "consumes replay before body processing in %s",
    (path) => {
      const value = source(path);
      if (routeCallOrder[path]) {
        expect(
          firstMatchIndex(value, routeCallOrder[path].body)
        ).toBeGreaterThan(firstMatchIndex(value, routeCallOrder[path].gate));
        return;
      }
      const readerIndex = firstMatchIndex(value, bodyReaderPattern);

      expect(readerIndex).toBeGreaterThan(-1);
      expect(
        readerIndex >
          firstMatchIndex(
            value,
            /resolveRouteGate\(|verifyAdminWriteBoundary\(|adminAuthCheck\(/
          )
      ).toBe(true);
    }
  );

  it.each(uploadRoutes)(
    "consumes replay before upload stream processing in %s",
    (path) => {
      const value = source(path);
      expect(
        firstMatchIndex(value, routeCallOrder[path].body) >
          firstMatchIndex(value, routeCallOrder[path].gate)
      ).toBe(true);
    }
  );

  it.each(bodylessRoutes)("has no hidden body reader in %s", (path) => {
    expect(bodyReaderPattern.test(source(path))).toBe(false);
  });

  it("binds setup operation from the signed header before body parsing", () => {
    const value = source("lib/catalogue/admin-setup-recipe-write-route.ts");

    expect(value.indexOf("readServerAdminCsrfProofOperation(")).toBeGreaterThan(-1);
    expect(value.indexOf("readServerAdminCsrfProofOperation(")).toBeLessThan(
      value.indexOf("readBoundedJsonBody(request, 65536)")
    );
    expect(value).toContain('bodyOperation !== requestedOperation');
  });
});
