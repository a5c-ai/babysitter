/**
 * Session state provider for the Babysitter TUI.
 *
 * Uses React.useReducer to manage the full SessionState tree.  All mutations
 * go through the dispatch function exposed via context so components never
 * mutate state directly.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import type {
  SessionState,
  TuiMessage,
  RunStatus,
  VerbosityLevel,
  TokenUsage,
  BreakpointState,
} from "../types.js";

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type SessionAction =
  | { type: "SET_RUN_ID"; runId: string }
  | { type: "SET_STATUS"; status: RunStatus }
  | { type: "APPEND_MESSAGE"; message: TuiMessage }
  | { type: "UPDATE_MESSAGE"; id: string; patch: Partial<TuiMessage> }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_VERBOSITY"; verbosity: VerbosityLevel }
  | { type: "SET_INPUT_BUFFER"; text: string }
  | { type: "SET_INPUT_ACTIVE"; active: boolean }
  | { type: "RUN_STARTED"; runId: string; startedAt: number }
  | { type: "RUN_FINISHED"; status: Extract<RunStatus, "complete" | "failed"> }
  | { type: "TURN_STARTED"; startedAt: number }
  | { type: "TURN_FINISHED" }
  | { type: "UPDATE_TOKEN_USAGE"; tokenUsage: TokenUsage }
  | { type: "UPDATE_COST"; cost: number }
  | { type: "SET_BREAKPOINT"; breakpoint: BreakpointState }
  | { type: "CLEAR_BREAKPOINT" }
  | { type: "SET_ITERATION"; iteration: number };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "SET_RUN_ID":
      return { ...state, runId: action.runId };

    case "SET_STATUS":
      return { ...state, status: action.status };

    case "APPEND_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };

    case "UPDATE_MESSAGE": {
      const messages = state.messages.map((m) =>
        m.id === action.id ? { ...m, ...action.patch } : m,
      );
      return { ...state, messages };
    }

    case "CLEAR_MESSAGES":
      return { ...state, messages: [] };

    case "SET_VERBOSITY":
      return { ...state, verbosity: action.verbosity };

    case "SET_INPUT_BUFFER":
      return { ...state, inputBuffer: action.text };

    case "SET_INPUT_ACTIVE":
      return { ...state, inputActive: action.active };

    case "RUN_STARTED":
      return {
        ...state,
        runId: action.runId,
        status: "running",
        runStartedAt: action.startedAt,
      };

    case "RUN_FINISHED":
      return {
        ...state,
        status: action.status,
        runStartedAt: null,
        inputActive: false,
      };

    case "TURN_STARTED":
      return { ...state, turnStartedAt: action.startedAt, iteration: state.iteration + 1 };

    case "TURN_FINISHED":
      return { ...state, turnStartedAt: null };

    case "UPDATE_TOKEN_USAGE":
      return { ...state, tokenUsage: action.tokenUsage };

    case "UPDATE_COST":
      return { ...state, cost: action.cost };

    case "SET_BREAKPOINT":
      return { ...state, breakpoint: action.breakpoint, inputActive: false };

    case "CLEAR_BREAKPOINT":
      return { ...state, breakpoint: null, inputActive: true };

    case "SET_ITERATION":
      return { ...state, iteration: action.iteration };

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: SessionState = {
  runId: null,
  status: "idle",
  messages: [],
  verbosity: "normal",
  inputBuffer: "",
  inputActive: false,
  runStartedAt: null,
  turnStartedAt: null,
  tokenUsage: null,
  cost: null,
  breakpoint: null,
  iteration: 0,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SessionContextValue {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SessionProviderProps {
  children: ReactNode;
  initialRunId?: string;
  initialVerbosity?: VerbosityLevel;
}

export function SessionProvider({
  children,
  initialRunId,
  initialVerbosity,
}: SessionProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(sessionReducer, {
    ...initialState,
    runId: initialRunId ?? null,
    verbosity: initialVerbosity ?? "normal",
  });

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Raw context accessor (used by useSession hook)
// ---------------------------------------------------------------------------

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (ctx === null) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return ctx;
}
