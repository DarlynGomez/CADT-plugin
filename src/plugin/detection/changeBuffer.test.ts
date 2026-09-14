import { describe, expect, it, vi } from "vitest";

import { createChangeBuffer } from "./changeBuffer";

function fakeTimer() {
  let nextHandle = 1;
  const scheduled = new Map<number, { callback: () => void; delayMs: number }>();

  return {
    scheduleTimeout: vi.fn((callback: () => void, delayMs: number) => {
      const handle = nextHandle++;
      scheduled.set(handle, { callback, delayMs });
      return handle;
    }),
    clearScheduledTimeout: vi.fn((handle: unknown) => {
      scheduled.delete(handle as number);
    }),
    fire(handle: number): void {
      scheduled.get(handle)?.callback();
    },
    pendingHandles(): number[] {
      return Array.from(scheduled.keys());
    }
  };
}

describe("createChangeBuffer", () => {
  it("does not flush until the scheduled timeout fires", () => {
    const timer = fakeTimer();
    const onFlush = vi.fn();
    const buffer = createChangeBuffer({
      onFlush,
      scheduleTimeout: timer.scheduleTimeout,
      clearScheduledTimeout: timer.clearScheduledTimeout
    });

    buffer.add("1:1");
    expect(onFlush).not.toHaveBeenCalled();

    timer.fire(1);
    expect(onFlush).toHaveBeenCalledWith(new Set(["1:1"]));
  });

  it("coalesces multiple adds into one flush, resetting the timer each time", () => {
    const timer = fakeTimer();
    const onFlush = vi.fn();
    const buffer = createChangeBuffer({
      onFlush,
      scheduleTimeout: timer.scheduleTimeout,
      clearScheduledTimeout: timer.clearScheduledTimeout
    });

    buffer.add("1:1");
    buffer.add("1:2");
    buffer.add("1:1");

    expect(timer.clearScheduledTimeout).toHaveBeenCalledTimes(2);
    expect(timer.pendingHandles()).toEqual([3]);

    timer.fire(3);
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith(new Set(["1:1", "1:2"]));
  });

  it("uses the 300ms default flush delay unless overridden", () => {
    const timer = fakeTimer();
    const buffer = createChangeBuffer({
      onFlush: vi.fn(),
      scheduleTimeout: timer.scheduleTimeout,
      clearScheduledTimeout: timer.clearScheduledTimeout
    });

    buffer.add("1:1");
    expect(timer.scheduleTimeout).toHaveBeenCalledWith(expect.any(Function), 300);
  });

  it("flushes immediately once the batch exceeds 200 ids, without waiting for the timer", () => {
    const timer = fakeTimer();
    const onFlush = vi.fn();
    const buffer = createChangeBuffer({
      onFlush,
      scheduleTimeout: timer.scheduleTimeout,
      clearScheduledTimeout: timer.clearScheduledTimeout
    });

    for (let i = 0; i < 200; i += 1) {
      buffer.add(`1:${i}`);
    }
    expect(onFlush).not.toHaveBeenCalled();

    buffer.add("1:200");
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush.mock.calls[0][0].size).toBe(201);
  });

  it("starts a fresh batch after flushing", () => {
    const timer = fakeTimer();
    const onFlush = vi.fn();
    const buffer = createChangeBuffer({
      onFlush,
      scheduleTimeout: timer.scheduleTimeout,
      clearScheduledTimeout: timer.clearScheduledTimeout
    });

    buffer.add("1:1");
    timer.fire(1);
    buffer.add("1:2");
    timer.fire(2);

    expect(onFlush).toHaveBeenNthCalledWith(1, new Set(["1:1"]));
    expect(onFlush).toHaveBeenNthCalledWith(2, new Set(["1:2"]));
  });

  it("respects a custom flush delay and batch size", () => {
    const timer = fakeTimer();
    const onFlush = vi.fn();
    const buffer = createChangeBuffer({
      onFlush,
      scheduleTimeout: timer.scheduleTimeout,
      clearScheduledTimeout: timer.clearScheduledTimeout,
      flushDelayMs: 50,
      maxBatchSize: 2
    });

    buffer.add("1:1");
    expect(timer.scheduleTimeout).toHaveBeenCalledWith(expect.any(Function), 50);

    buffer.add("1:2");
    buffer.add("1:3");
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush.mock.calls[0][0].size).toBe(3);
  });
});
