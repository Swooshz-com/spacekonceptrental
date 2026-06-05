import { describe, expect, it, vi } from "vitest";
import {
  createSearchIndexDocumentCommand,
  createSearchIndexJobCommand,
  getSearchIndexAdapter,
  recordSearchIndexDocument,
  recordSearchIndexJob,
  type SearchIndexDocumentCommandInput,
  type SearchIndexJobCommandInput
} from "./index";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const listingId = "22222222-2222-4222-8222-222222222222";
const categoryId = "33333333-3333-4333-8333-333333333333";
const jobId = "44444444-4444-4444-8444-444444444444";
const documentId = "55555555-5555-4555-8555-555555555555";
const contentHash =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function validJobInput(
  overrides: Partial<SearchIndexJobCommandInput> = {}
): SearchIndexJobCommandInput {
  return {
    workspaceId,
    sourceType: "listing",
    sourceId: listingId,
    sourceVersion: "listing-v1",
    visibility: "public_chat",
    operation: "upsert",
    status: "queued",
    contentHash,
    metadata: {
      source: "contract-test"
    },
    ...overrides
  };
}

function validDocumentInput(
  overrides: Partial<SearchIndexDocumentCommandInput> = {}
): SearchIndexDocumentCommandInput {
  return {
    workspaceId,
    sourceType: "category",
    sourceId: categoryId,
    sourceVersion: "category-v1",
    visibility: "public_chat",
    status: "succeeded",
    title: "Lounge furniture",
    contentHash,
    chunkCount: 2,
    lastIndexJobId: jobId,
    indexedAt: "2026-06-05T05:30:00.000Z",
    metadata: {
      source: "contract-test"
    },
    ...overrides
  };
}

const unsafeMetadataCases = [
  ["providerDebug", { nested: { providerDebug: "blocked" } }],
  ["traceDump", { nested: { traceDump: "blocked" } }],
  ["apiKey", { apiKey: "blocked" }],
  ["serviceRole", { serviceRole: "blocked" }],
  [
    "customerVisibleInternalNotes",
    { customerVisibleInternalNotes: "blocked" }
  ],
  ["fullTranscript", { fullTranscript: "blocked" }],
  ["webhookHeaders", { webhookHeaders: "blocked" }]
] as const;

describe("Phase 2G-B search-index contract", () => {
  it("builds minimized validated job and document commands", () => {
    expect(createSearchIndexJobCommand(validJobInput())).toEqual({
      ok: true,
      command: {
        workspaceId,
        sourceType: "listing",
        sourceId: listingId,
        sourceVersion: "listing-v1",
        visibility: "public_chat",
        operation: "upsert",
        status: "queued",
        contentHash,
        metadata: {
          source: "contract-test"
        }
      }
    });

    expect(createSearchIndexDocumentCommand(validDocumentInput())).toEqual({
      ok: true,
      command: {
        workspaceId,
        sourceType: "category",
        sourceId: categoryId,
        sourceVersion: "category-v1",
        visibility: "public_chat",
        status: "succeeded",
        title: "Lounge furniture",
        contentHash,
        chunkCount: 2,
        lastIndexJobId: jobId,
        indexedAt: "2026-06-05T05:30:00.000Z",
        metadata: {
          source: "contract-test"
        }
      }
    });
  });

  it("safely rejects malformed enums, UUIDs, hashes, and counters", () => {
    const jobCases: Array<{
      name: string;
      input: unknown;
      reason: string;
    }> = [
      { name: "unknown input", input: null, reason: "input_invalid" },
      {
        name: "missing workspace",
        input: validJobInput({ workspaceId: "" }),
        reason: "workspace_id_invalid"
      },
      {
        name: "invalid source type",
        input: validJobInput({ sourceType: "quote_request" }),
        reason: "source_type_invalid"
      },
      {
        name: "invalid visibility",
        input: validJobInput({ visibility: "customer_visible" }),
        reason: "visibility_invalid"
      },
      {
        name: "invalid operation",
        input: validJobInput({ operation: "vector_upsert" }),
        reason: "operation_invalid"
      },
      {
        name: "invalid status",
        input: validJobInput({ status: "running" }),
        reason: "status_invalid"
      },
      {
        name: "invalid hash",
        input: validJobInput({ contentHash: "not a hash" }),
        reason: "content_hash_invalid"
      }
    ];

    for (const testCase of jobCases) {
      expect(() =>
        createSearchIndexJobCommand(testCase.input as SearchIndexJobCommandInput)
      ).not.toThrow();
      expect(
        createSearchIndexJobCommand(testCase.input as SearchIndexJobCommandInput),
        testCase.name
      ).toMatchObject({
        ok: false,
        status: "rejected",
        reason: testCase.reason
      });
    }

    expect(
      createSearchIndexDocumentCommand(
        validDocumentInput({ chunkCount: -1 })
      )
    ).toMatchObject({
      ok: false,
      status: "rejected",
      reason: "chunk_count_invalid"
    });
  });

  it("rejects unsafe metadata before adapter calls", async () => {
    const adapter = {
      recordJob: vi.fn(async (_command: unknown) => ({
        ok: true as const,
        searchIndexJobId: jobId
      })),
      recordDocument: vi.fn(async (_command: unknown) => ({
        ok: true as const,
        searchIndexDocumentId: documentId
      }))
    };

    for (const [label, metadata] of unsafeMetadataCases) {
      await expect(
        recordSearchIndexJob(validJobInput({ metadata }), { adapter }),
        `job ${label}`
      ).resolves.toMatchObject({
        ok: false,
        status: "rejected",
        reason: "metadata_unsafe_key"
      });
      await expect(
        recordSearchIndexDocument(validDocumentInput({ metadata }), { adapter }),
        `document ${label}`
      ).resolves.toMatchObject({
        ok: false,
        status: "rejected",
        reason: "metadata_unsafe_key"
      });
    }

    expect(adapter.recordJob).not.toHaveBeenCalled();
    expect(adapter.recordDocument).not.toHaveBeenCalled();
  });

  it("defaults to unavailable and only records through an injected adapter", async () => {
    await expect(
      recordSearchIndexJob(validJobInput(), {
        adapter: getSearchIndexAdapter()
      })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "search_index_unavailable"
    });

    const adapter = {
      recordJob: vi.fn(async (_command: unknown) => ({
        ok: true as const,
        searchIndexJobId: jobId
      })),
      recordDocument: vi.fn(async (_command: unknown) => ({
        ok: true as const,
        searchIndexDocumentId: documentId
      }))
    };

    await expect(recordSearchIndexJob(validJobInput(), { adapter })).resolves.toEqual({
      ok: true,
      status: "recorded",
      searchIndexJobId: jobId
    });
    await expect(
      recordSearchIndexDocument(validDocumentInput(), { adapter })
    ).resolves.toEqual({
      ok: true,
      status: "recorded",
      searchIndexDocumentId: documentId
    });

    expect(adapter.recordJob).toHaveBeenCalledTimes(1);
    expect(adapter.recordDocument).toHaveBeenCalledTimes(1);
  });

  it("does not leak validation or adapter exceptions", async () => {
    const circularMetadata: Record<string, unknown> = {};
    circularMetadata.self = circularMetadata;

    await expect(
      recordSearchIndexJob(validJobInput({ metadata: circularMetadata }), {})
    ).resolves.toMatchObject({
      ok: false,
      status: "rejected",
      reason: "metadata_invalid"
    });

    const throwingAdapter = {
      recordJob: vi.fn(async (_command: unknown) => {
        throw new Error("leaked secret");
      }),
      recordDocument: vi.fn(async (_command: unknown) => {
        throw new Error("leaked private key");
      })
    };

    await expect(
      recordSearchIndexJob(validJobInput(), { adapter: throwingAdapter })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "search_index_unavailable"
    });
    await expect(
      recordSearchIndexDocument(validDocumentInput(), { adapter: throwingAdapter })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "search_index_unavailable"
    });
  });
});
