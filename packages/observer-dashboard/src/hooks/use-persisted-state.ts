"use client";
import { useState, useCallback, useLayoutEffect, useEffect } from "react";

const NAMESPACE = "observer:";

// useLayoutEffect on client (runs before paint → no flash),
// useEffect on server (suppresses Next.js SSR warning).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Custom hook that wraps useState with localStorage persistence.
 * Values are serialized with JSON.stringify/parse and namespaced
 * under the "observer:" prefix to avoid collisions.
 *
 * Hydration-safe: first render uses defaultValue (matching SSR),
 * then useLayoutEffect reads localStorage before the browser paints
 * so the persisted value appears with no visible flash.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const prefixedKey = key.startsWith(NAMESPACE) ? key : `${NAMESPACE}${key}`;

  // Always start with defaultValue to match SSR output (hydration-safe).
  const [state, setState] = useState<T>(defaultValue);

  // Read localStorage before paint — avoids both hydration mismatch and flash.
  useIsomorphicLayoutEffect(() => {
    try {
      const stored = window.localStorage.getItem(prefixedKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as T;
        setState(parsed);
      }
    } catch {
      // localStorage unavailable — keep default
    }
  }, [prefixedKey]);

  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(prefixedKey, JSON.stringify(next));
          }
        } catch {
          // localStorage may be full or blocked — silently ignore
        }
        return next;
      });
    },
    [prefixedKey]
  );

  return [state, setPersistedState];
}
