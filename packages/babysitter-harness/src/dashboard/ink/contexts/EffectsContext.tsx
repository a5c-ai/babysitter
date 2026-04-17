/**
 * EffectsContext — provides effect data and orchestration status to TUI components.
 *
 * Bridges EffectSummary[] from the run scanner or journal into the component tree,
 * computing derived OrchestrationStatus via aggregateOrchestrationStatus + derivePhase.
 */

import React, {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type {
  EffectSummary,
  OrchestrationPhase,
  OrchestrationStatus,
} from "../types.js";
import {
  aggregateOrchestrationStatus,
  derivePhase,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EffectsContextValue {
  /** Raw effect summaries from the run. */
  readonly effects: readonly EffectSummary[];
  /** Computed orchestration status (phase, counts, timing). */
  readonly status: OrchestrationStatus;
  /** Current orchestration phase (convenience — derived via derivePhase). */
  readonly phase: OrchestrationPhase;
}

export interface EffectsProviderProps {
  children: ReactNode;
  /** Effect summaries to provide to the tree. */
  effects: readonly EffectSummary[];
  /** Run ID for status aggregation. */
  runId: string;
  /** Current iteration number. */
  iteration?: number;
  /** Run start timestamp (ms epoch). */
  startedAt?: number;
}

// ---------------------------------------------------------------------------
// Default value (graceful degradation without provider)
// ---------------------------------------------------------------------------

const DEFAULT_STATUS: OrchestrationStatus = {
  runId: "",
  iteration: 0,
  phase: "waiting",
  totalEffects: 0,
  pendingEffects: 0,
  resolvedEffects: 0,
  elapsedMs: 0,
};

const DEFAULT_VALUE: EffectsContextValue = {
  effects: [],
  status: DEFAULT_STATUS,
  phase: "waiting",
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const EffectsContext = createContext<EffectsContextValue>(DEFAULT_VALUE);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function EffectsProvider({
  children,
  effects,
  runId,
  iteration = 0,
  startedAt,
}: EffectsProviderProps): React.JSX.Element {
  const mutableEffects = effects as EffectSummary[];
  const status = React.useMemo(
    () =>
      aggregateOrchestrationStatus({
        runId,
        effects: mutableEffects,
        iteration,
        startedAt,
      }),
    [runId, mutableEffects, iteration, startedAt],
  );

  const phase = derivePhase(mutableEffects);

  const value = React.useMemo(
    () => ({ effects, status, phase }),
    [effects, status, phase],
  );

  return (
    <EffectsContext.Provider value={value}>
      {children}
    </EffectsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEffects(): EffectsContextValue {
  return useContext(EffectsContext);
}
