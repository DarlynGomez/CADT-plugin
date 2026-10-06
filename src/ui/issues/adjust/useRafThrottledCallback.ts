import { useCallback, useEffect, useRef } from "react";

/**
 * Fires at most once per animation frame with the latest argument
 * A drag sends dozens of events a second and each would write to the node and race the rescan
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
