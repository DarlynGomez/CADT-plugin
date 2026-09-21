import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRafThrottledCallback } from "./useRafThrottledCallback";

describe("useRafThrottledCallback", () => {
  let frameCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    frameCallbacks = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function flushFrame() {
    const pending = frameCallbacks;
    frameCallbacks = [];
    pending.forEach((callback) => callback(0));
  }

  it("collapses many rapid calls into a single invocation, with the latest value", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRafThrottledCallback(callback));

    act(() => {
      result.current(1);
      result.current(2);
      result.current(3);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      flushFrame();
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(3);
  });

  it("schedules a fresh frame for the next value after one flushes", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRafThrottledCallback(callback));

    act(() => {
      result.current("a");
      flushFrame();
    });
    act(() => {
      result.current("b");
      flushFrame();
    });

    expect(callback).toHaveBeenNthCalledWith(1, "a");
    expect(callback).toHaveBeenNthCalledWith(2, "b");
  });
});
