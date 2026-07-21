type ActiveEntry<TResult, TMetadata> = {
  fingerprint: string;
  kind: "active";
  metadata: TMetadata;
  promise: Promise<TResult>;
};

type CompletedEntry<TResult, TMetadata> = {
  expiresAt: number;
  fingerprint: string;
  kind: "completed";
  metadata: TMetadata;
  value: TResult;
};

type Entry<TResult, TMetadata> =
  | ActiveEntry<TResult, TMetadata>
  | CompletedEntry<TResult, TMetadata>;

export type IdempotentOperationStart<TResult, TMetadata, TDenied> =
  | {
      status: "operation";
      metadata: TMetadata;
      promise: Promise<TResult>;
      wasReserved: boolean;
    }
  | { status: "conflict" }
  | { status: "denied"; reason: TDenied }
  | { status: "capacity" };

type IdempotentOperationStoreOptions = {
  maxEntries: number;
  ttlMs: number;
  now?: () => number;
  beforeFailureCleanup?: () => Promise<void>;
};

export class IdempotentOperationStore<TResult, TMetadata> {
  private readonly entries = new Map<string, Entry<TResult, TMetadata>>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly now: () => number;
  private readonly beforeFailureCleanup?: () => Promise<void>;

  constructor(options: IdempotentOperationStoreOptions) {
    this.maxEntries = options.maxEntries;
    this.ttlMs = options.ttlMs;
    this.now = options.now ?? Date.now;
    this.beforeFailureCleanup = options.beforeFailureCleanup;
  }

  clear() {
    this.entries.clear();
  }

  private pruneCompleted(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.kind === "completed" && entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }

    if (this.entries.size < this.maxEntries) {
      return;
    }

    for (const [key, entry] of this.entries) {
      if (this.entries.size < this.maxEntries) {
        break;
      }

      if (entry.kind === "completed") {
        this.entries.delete(key);
      }
    }
  }

  start<TDenied>({
    createMetadata,
    execute,
    fingerprint,
    key
  }: {
    createMetadata: () =>
      | { ok: true; metadata: TMetadata }
      | { ok: false; reason: TDenied };
    execute: () => Promise<TResult>;
    fingerprint: string;
    key: string;
  }): IdempotentOperationStart<TResult, TMetadata, TDenied> {
    const now = this.now();
    this.pruneCompleted(now);
    const current = this.entries.get(key);

    if (current) {
      if (current.fingerprint !== fingerprint) {
        return { status: "conflict" };
      }

      return current.kind === "active"
        ? {
            status: "operation",
            metadata: current.metadata,
            promise: current.promise,
            wasReserved: false
          }
        : {
            status: "operation",
            metadata: current.metadata,
            promise: Promise.resolve(current.value),
            wasReserved: false
          };
    }

    if (this.entries.size >= this.maxEntries) {
      return { status: "capacity" };
    }

    const metadata = createMetadata();
    if (!metadata.ok) {
      return { status: "denied", reason: metadata.reason };
    }

    let resolveOperation!: (value: TResult) => void;
    let rejectOperation!: (reason: unknown) => void;
    const promise = new Promise<TResult>((resolve, reject) => {
      resolveOperation = resolve;
      rejectOperation = reject;
    });
    const reservation: ActiveEntry<TResult, TMetadata> = {
      fingerprint,
      kind: "active",
      metadata: metadata.metadata,
      promise
    };

    // Publish ownership synchronously before execute() can start a side effect.
    this.entries.set(key, reservation);

    void Promise.resolve()
      .then(execute)
      .then((value) => {
        if (this.entries.get(key) === reservation) {
          this.entries.set(key, {
            expiresAt: this.now() + this.ttlMs,
            fingerprint,
            kind: "completed",
            metadata: metadata.metadata,
            value
          });
        }

        resolveOperation(value);
      })
      .catch(async (error: unknown) => {
        await this.beforeFailureCleanup?.();

        if (this.entries.get(key) === reservation) {
          this.entries.delete(key);
        }

        rejectOperation(error);
      });

    return {
      status: "operation",
      metadata: metadata.metadata,
      promise,
      wasReserved: true
    };
  }
}
