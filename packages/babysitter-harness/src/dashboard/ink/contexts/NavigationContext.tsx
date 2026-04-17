/**
 * NavigationContext — view routing state for the Babysitter TUI shell.
 *
 * Uses React.useReducer to manage the current view, selected run, and
 * navigation history.  All view transitions go through dispatch so
 * components never mutate navigation state directly.
 *
 * Follows the exact pattern of SessionContext.tsx.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import type { ViewName } from "../types.js";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface NavigationState {
  readonly currentView: ViewName;
  readonly selectedRunId: string | null;
  readonly history: readonly ViewName[];
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type NavigationAction =
  | { type: "NAVIGATE_TO_SESSION"; runId: string }
  | { type: "NAVIGATE_TO_RUN_DETAIL"; runId: string }
  | { type: "NAVIGATE_TO_DASHBOARD" }
  | { type: "GO_BACK" };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function navigationReducer(
  state: NavigationState,
  action: NavigationAction,
): NavigationState {
  switch (action.type) {
    case "NAVIGATE_TO_SESSION":
      return {
        currentView: "session",
        selectedRunId: action.runId,
        history: [...state.history, state.currentView],
      };

    case "NAVIGATE_TO_RUN_DETAIL":
      return {
        currentView: "run-detail",
        selectedRunId: action.runId,
        history: [...state.history, state.currentView],
      };

    case "NAVIGATE_TO_DASHBOARD":
      return {
        currentView: "dashboard",
        selectedRunId: null,
        history: [],
      };

    case "GO_BACK": {
      if (state.history.length === 0) {
        return {
          currentView: "dashboard",
          selectedRunId: null,
          history: [],
        };
      }
      const previous = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        currentView: previous,
        selectedRunId: previous === "dashboard" ? null : state.selectedRunId,
        history: newHistory,
      };
    }

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialNavigationState: NavigationState = {
  currentView: "dashboard",
  selectedRunId: null,
  history: [],
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface NavigationContextValue {
  state: NavigationState;
  dispatch: Dispatch<NavigationAction>;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface NavigationProviderProps {
  children: ReactNode;
  initialView?: ViewName;
  initialRunId?: string;
}

export function NavigationProvider({
  children,
  initialView,
  initialRunId,
}: NavigationProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(navigationReducer, {
    ...initialNavigationState,
    currentView: initialView ?? "dashboard",
    selectedRunId: initialRunId ?? null,
  });

  return (
    <NavigationContext.Provider value={{ state, dispatch }}>
      {children}
    </NavigationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns navigation state and dispatch.
 * Must be called from within a NavigationProvider subtree.
 */
export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (ctx === null) {
    throw new Error("useNavigation() must be called within a <NavigationProvider> tree");
  }
  return ctx;
}
