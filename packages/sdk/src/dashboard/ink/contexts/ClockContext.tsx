/**
 * Clock context for the Babysitter TUI.
 *
 * Provides a simple setInterval-based ticker so animation-dependent
 * components (spinners, elapsed timers) can subscribe to a single shared
 * clock rather than each creating their own interval.
 *
 * The interval is 100 ms by default (10 fps — sufficient for smooth spinner
 * animation without excessive re-renders).
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

interface ClockContextValue {
  /** Current wall-clock time in milliseconds (Date.now()). */
  now: number;
  /** Monotonically-increasing tick counter (starts at 0). */
  tick: number;
}

const ClockContext = createContext<ClockContextValue>({
  now: Date.now(),
  tick: 0,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ClockProviderProps {
  children: ReactNode;
  /** Interval in milliseconds. Defaults to 100. */
  intervalMs?: number;
}

export function ClockProvider({
  children,
  intervalMs = 100,
}: ClockProviderProps): React.JSX.Element {
  const [value, setValue] = useState<ClockContextValue>({
    now: Date.now(),
    tick: 0,
  });

  const tickRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1;
      setValue({ now: Date.now(), tick: tickRef.current });
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  }, [intervalMs]);

  return (
    <ClockContext.Provider value={value}>{children}</ClockContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Raw context accessor (used by useClock hook)
// ---------------------------------------------------------------------------

export function useClockContext(): ClockContextValue {
  return useContext(ClockContext);
}
