const DEFAULT_FLUSH_DELAY_MS = 300;
const DEFAULT_MAX_BATCH_SIZE = 200;

export interface ChangeBufferOptions {
  onFlush: (nodeIds: ReadonlySet<string>) => void;
  scheduleTimeout: (callback: () => void, delayMs: number) => unknown;
  clearScheduledTimeout: (handle: unknown) => void;
  flushDelayMs?: number;
  maxBatchSize?: number;
}

export interface ChangeBuffer {
  add(nodeId: string): void;
}

/**
 * Batches node ids into one flush after a quiet period, or at once past the size limit
 * Timer functions are passed in so this stays pure and tests can fake the clock
 */
export function createChangeBuffer(options: ChangeBufferOptions): ChangeBuffer {
  const flushDelayMs = options.flushDelayMs ?? DEFAULT_FLUSH_DELAY_MS;
  const maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;

  let pending = new Set<string>();
  let timeoutHandle: unknown = null;

  function cancelScheduledFlush(): void {
    if (timeoutHandle !== null) {
      options.clearScheduledTimeout(timeoutHandle);
      timeoutHandle = null;
    }
  }

  function flush(): void {
    cancelScheduledFlush();
    if (pending.size === 0) {
      return;
    }
    const toFlush = pending;
    pending = new Set();
    options.onFlush(toFlush);
  }

  return {
    add(nodeId: string): void {
      pending.add(nodeId);

      if (pending.size > maxBatchSize) {
        flush();
        return;
      }

      cancelScheduledFlush();
      timeoutHandle = options.scheduleTimeout(flush, flushDelayMs);
    }
  };
}
