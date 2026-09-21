import { useCallback, useEffect, useRef } from "react";

/**
 * Wraps callback so it fires at most once per animation frame, with the latest
 * argument, rather than once per raw input event
 *
 * A drag, whether on the wheel or the lightness slider, fires dozens of events a
 * second. Without this, each one becomes a real cross-boundary write to the node's
 * fill, which floods the plugin boundary and can race the accountability loop's own
 * documentchange-triggered rescan of the same node
 */
export function useRafThrottledCallback<T>(callback: (value: T) => void): (value: T) => void {
  const pendingRef = useRef<T | null>(null);
  const frameRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return useCallback((value: T) => {
    pendingRef.current = value;
    if (frameRef.current !== null) {
      return;
    }
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      if (pendingRef.current !== null) {
        callbackRef.current(pendingRef.current);
        pendingRef.current = null;
      }
    });
  }, []);
}
