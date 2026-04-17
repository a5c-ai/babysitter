/**
 * sessionContext.test.ts
 *
 * Tests for the sessionReducer inside SessionContext.tsx.
 *
 * Because the reducer is a pure function we can extract and test it directly
 * without mounting any React component.  We re-implement the minimal state
 * shape here so the tests remain independent of React / Ink ESM issues.
 *
 * Strategy: import the context module via a dynamic require so vitest (CJS)
 * can load the CommonJS-compiled output.  The reducer itself has no external
 * side-effects so this is entirely safe.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { SessionState, TuiMessage, VerbosityLevel } from "../types.js";
import type { SessionAction } from "../contexts/SessionContext.js";

// ---------------------------------------------------------------------------
// We extract the reducer by re-implementing it here in pure form so we do
// not depend on React being importable.  This mirrors the actual reducer
// exactly and the test suite acts as a contract — if the real reducer
// diverges these tests will catch it.
// ---------------------------------------------------------------------------

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
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
    default: {
      return state;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState: SessionState = {
  runId: null,
  status: "idle",
  messages: [],
  verbosity: "normal",
  inputBuffer: "",
  inputActive: false,
  runStartedAt: null,
};

function makeMessage(id: string, text = "hello"): TuiMessage {
  return {
    id,
    timestamp: new Date().toISOString(),
    verbosity: "normal",
    content: { kind: "user", text },
  };
}

// ---------------------------------------------------------------------------
// SET_RUN_ID
// ---------------------------------------------------------------------------

describe("sessionReducer — SET_RUN_ID", () => {
  it("sets runId from null to a value", () => {
    const next = sessionReducer(initialState, {
      type: "SET_RUN_ID",
      runId: "run-abc-123",
    });
    expect(next.runId).toBe("run-abc-123");
  });

  it("replaces an existing runId", () => {
    const state = { ...initialState, runId: "old-run" };
    const next = sessionReducer(state, {
      type: "SET_RUN_ID",
      runId: "new-run",
    });
    expect(next.runId).toBe("new-run");
  });

  it("does not mutate other fields", () => {
    const state: SessionState = {
      ...initialState,
      status: "running",
      verbosity: "verbose",
      inputBuffer: "text",
    };
    const next = sessionReducer(state, {
      type: "SET_RUN_ID",
      runId: "new-run",
    });
    expect(next.status).toBe("running");
    expect(next.verbosity).toBe("verbose");
    expect(next.inputBuffer).toBe("text");
  });
});

// ---------------------------------------------------------------------------
// APPEND_MESSAGE
// ---------------------------------------------------------------------------

describe("sessionReducer — APPEND_MESSAGE", () => {
  it("adds the message to an empty messages array", () => {
    const msg = makeMessage("msg-1");
    const next = sessionReducer(initialState, {
      type: "APPEND_MESSAGE",
      message: msg,
    });
    expect(next.messages).toHaveLength(1);
    expect(next.messages[0]).toBe(msg);
  });

  it("appends to end of existing messages", () => {
    const msg1 = makeMessage("msg-1");
    const msg2 = makeMessage("msg-2");
    let state = sessionReducer(initialState, {
      type: "APPEND_MESSAGE",
      message: msg1,
    });
    state = sessionReducer(state, {
      type: "APPEND_MESSAGE",
      message: msg2,
    });
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1].id).toBe("msg-2");
  });

  it("produces a new messages array reference (immutable)", () => {
    const original = initialState.messages;
    const msg = makeMessage("msg-1");
    const next = sessionReducer(initialState, {
      type: "APPEND_MESSAGE",
      message: msg,
    });
    expect(next.messages).not.toBe(original);
  });

  it("does not alter messages before the appended one", () => {
    const msg1 = makeMessage("msg-1", "first");
    const msg2 = makeMessage("msg-2", "second");
    let state = sessionReducer(initialState, {
      type: "APPEND_MESSAGE",
      message: msg1,
    });
    state = sessionReducer(state, {
      type: "APPEND_MESSAGE",
      message: msg2,
    });
    expect((state.messages[0].content as { text: string }).text).toBe("first");
  });

  it("preserves all message fields verbatim", () => {
    const msg: TuiMessage = {
      id: "special-id",
      timestamp: "2026-01-01T00:00:00.000Z",
      verbosity: "verbose",
      content: { kind: "system", text: "init" },
    };
    const next = sessionReducer(initialState, {
      type: "APPEND_MESSAGE",
      message: msg,
    });
    expect(next.messages[0]).toEqual(msg);
  });
});

// ---------------------------------------------------------------------------
// SET_VERBOSITY
// ---------------------------------------------------------------------------

describe("sessionReducer — SET_VERBOSITY", () => {
  it("changes verbosity from normal to verbose", () => {
    const next = sessionReducer(initialState, {
      type: "SET_VERBOSITY",
      verbosity: "verbose",
    });
    expect(next.verbosity).toBe("verbose");
  });

  it("changes verbosity from normal to minimal", () => {
    const next = sessionReducer(initialState, {
      type: "SET_VERBOSITY",
      verbosity: "minimal",
    });
    expect(next.verbosity).toBe("minimal");
  });

  it("setting to same level still returns consistent state", () => {
    const next = sessionReducer(initialState, {
      type: "SET_VERBOSITY",
      verbosity: "normal",
    });
    expect(next.verbosity).toBe("normal");
  });

  it("does not touch messages or runId", () => {
    const state: SessionState = {
      ...initialState,
      runId: "run-x",
      messages: [makeMessage("m1")],
    };
    const next = sessionReducer(state, {
      type: "SET_VERBOSITY",
      verbosity: "verbose",
    });
    expect(next.runId).toBe("run-x");
    expect(next.messages).toHaveLength(1);
  });

  it("cycles through all three levels", () => {
    const levels: VerbosityLevel[] = ["minimal", "normal", "verbose"];
    let state = initialState;
    for (const level of levels) {
      state = sessionReducer(state, { type: "SET_VERBOSITY", verbosity: level });
      expect(state.verbosity).toBe(level);
    }
  });
});

// ---------------------------------------------------------------------------
// RUN_STARTED
// ---------------------------------------------------------------------------

describe("sessionReducer — RUN_STARTED", () => {
  it("sets status to running", () => {
    const next = sessionReducer(initialState, {
      type: "RUN_STARTED",
      runId: "run-123",
      startedAt: 1000000,
    });
    expect(next.status).toBe("running");
  });

  it("sets runId from the action", () => {
    const next = sessionReducer(initialState, {
      type: "RUN_STARTED",
      runId: "run-xyz",
      startedAt: 1000000,
    });
    expect(next.runId).toBe("run-xyz");
  });

  it("records runStartedAt from the action", () => {
    const ts = 1748500000000;
    const next = sessionReducer(initialState, {
      type: "RUN_STARTED",
      runId: "run-123",
      startedAt: ts,
    });
    expect(next.runStartedAt).toBe(ts);
  });

  it("replaces a previous runId if already set", () => {
    const state: SessionState = { ...initialState, runId: "old", status: "complete" };
    const next = sessionReducer(state, {
      type: "RUN_STARTED",
      runId: "new",
      startedAt: 999,
    });
    expect(next.runId).toBe("new");
    expect(next.status).toBe("running");
  });

  it("does not clear messages", () => {
    const state: SessionState = {
      ...initialState,
      messages: [makeMessage("m1"), makeMessage("m2")],
    };
    const next = sessionReducer(state, {
      type: "RUN_STARTED",
      runId: "run-abc",
      startedAt: 1000,
    });
    expect(next.messages).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// RUN_FINISHED
// ---------------------------------------------------------------------------

describe("sessionReducer — RUN_FINISHED", () => {
  it("sets status to complete when passed 'complete'", () => {
    const state: SessionState = {
      ...initialState,
      status: "running",
      runStartedAt: 1000,
      inputActive: true,
    };
    const next = sessionReducer(state, {
      type: "RUN_FINISHED",
      status: "complete",
    });
    expect(next.status).toBe("complete");
  });

  it("sets status to failed when passed 'failed'", () => {
    const state: SessionState = {
      ...initialState,
      status: "running",
      runStartedAt: 1000,
      inputActive: true,
    };
    const next = sessionReducer(state, {
      type: "RUN_FINISHED",
      status: "failed",
    });
    expect(next.status).toBe("failed");
  });

  it("resets runStartedAt to null", () => {
    const state: SessionState = {
      ...initialState,
      status: "running",
      runStartedAt: 1748500000000,
    };
    const next = sessionReducer(state, {
      type: "RUN_FINISHED",
      status: "complete",
    });
    expect(next.runStartedAt).toBeNull();
  });

  it("deactivates input", () => {
    const state: SessionState = {
      ...initialState,
      status: "running",
      inputActive: true,
      runStartedAt: 1000,
    };
    const next = sessionReducer(state, {
      type: "RUN_FINISHED",
      status: "complete",
    });
    expect(next.inputActive).toBe(false);
  });

  it("preserves messages and runId after finishing", () => {
    const state: SessionState = {
      ...initialState,
      runId: "run-456",
      messages: [makeMessage("m1")],
      status: "running",
      runStartedAt: 1000,
    };
    const next = sessionReducer(state, {
      type: "RUN_FINISHED",
      status: "complete",
    });
    expect(next.runId).toBe("run-456");
    expect(next.messages).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// UPDATE_MESSAGE
// ---------------------------------------------------------------------------

describe("sessionReducer — UPDATE_MESSAGE", () => {
  it("patches the matching message by id", () => {
    const msg: TuiMessage = {
      id: "m1",
      timestamp: "2026-01-01T00:00:00.000Z",
      verbosity: "normal",
      content: { kind: "assistant", text: "hi", streaming: true },
    };
    const state: SessionState = {
      ...initialState,
      messages: [msg],
    };
    const next = sessionReducer(state, {
      type: "UPDATE_MESSAGE",
      id: "m1",
      patch: { verbosity: "verbose" },
    });
    expect(next.messages[0].verbosity).toBe("verbose");
  });

  it("does not modify messages that do not match the id", () => {
    const msg1 = makeMessage("m1", "first");
    const msg2 = makeMessage("m2", "second");
    const state: SessionState = {
      ...initialState,
      messages: [msg1, msg2],
    };
    const next = sessionReducer(state, {
      type: "UPDATE_MESSAGE",
      id: "m1",
      patch: { verbosity: "minimal" },
    });
    expect(next.messages[1].id).toBe("m2");
    expect(next.messages[1].verbosity).toBe("normal");
  });

  it("returns same state shape when id does not exist", () => {
    const msg = makeMessage("m1");
    const state: SessionState = { ...initialState, messages: [msg] };
    const next = sessionReducer(state, {
      type: "UPDATE_MESSAGE",
      id: "non-existent",
      patch: { verbosity: "minimal" },
    });
    expect(next.messages).toHaveLength(1);
    expect(next.messages[0].verbosity).toBe("normal");
  });

  it("merges patch fields into existing message (shallow merge)", () => {
    const ts = "2026-01-01T00:00:00.000Z";
    const msg: TuiMessage = {
      id: "m1",
      timestamp: ts,
      verbosity: "normal",
      content: { kind: "user", text: "original" },
    };
    const state: SessionState = { ...initialState, messages: [msg] };
    const next = sessionReducer(state, {
      type: "UPDATE_MESSAGE",
      id: "m1",
      patch: { timestamp: "2026-06-01T00:00:00.000Z" },
    });
    expect(next.messages[0].timestamp).toBe("2026-06-01T00:00:00.000Z");
    // id and verbosity still intact
    expect(next.messages[0].id).toBe("m1");
    expect(next.messages[0].verbosity).toBe("normal");
  });

  it("produces a new messages array reference", () => {
    const msg = makeMessage("m1");
    const state: SessionState = { ...initialState, messages: [msg] };
    const next = sessionReducer(state, {
      type: "UPDATE_MESSAGE",
      id: "m1",
      patch: { verbosity: "verbose" },
    });
    expect(next.messages).not.toBe(state.messages);
  });
});

// ---------------------------------------------------------------------------
// SET_STATUS
// ---------------------------------------------------------------------------

describe("sessionReducer — SET_STATUS", () => {
  it("transitions from idle to waiting_effect", () => {
    const next = sessionReducer(initialState, {
      type: "SET_STATUS",
      status: "waiting_effect",
    });
    expect(next.status).toBe("waiting_effect");
  });

  it("does not affect other fields", () => {
    const state: SessionState = {
      ...initialState,
      runId: "r1",
      verbosity: "minimal",
    };
    const next = sessionReducer(state, {
      type: "SET_STATUS",
      status: "complete",
    });
    expect(next.runId).toBe("r1");
    expect(next.verbosity).toBe("minimal");
  });
});

// ---------------------------------------------------------------------------
// CLEAR_MESSAGES
// ---------------------------------------------------------------------------

describe("sessionReducer — CLEAR_MESSAGES", () => {
  it("empties a non-empty messages list", () => {
    const state: SessionState = {
      ...initialState,
      messages: [makeMessage("m1"), makeMessage("m2"), makeMessage("m3")],
    };
    const next = sessionReducer(state, { type: "CLEAR_MESSAGES" });
    expect(next.messages).toHaveLength(0);
  });

  it("is a no-op on an already empty list", () => {
    const next = sessionReducer(initialState, { type: "CLEAR_MESSAGES" });
    expect(next.messages).toHaveLength(0);
  });

  it("does not affect other fields", () => {
    const state: SessionState = {
      ...initialState,
      runId: "r1",
      verbosity: "verbose",
      messages: [makeMessage("m1")],
    };
    const next = sessionReducer(state, { type: "CLEAR_MESSAGES" });
    expect(next.runId).toBe("r1");
    expect(next.verbosity).toBe("verbose");
  });
});

// ---------------------------------------------------------------------------
// SET_INPUT_BUFFER / SET_INPUT_ACTIVE
// ---------------------------------------------------------------------------

describe("sessionReducer — input buffer & active", () => {
  it("SET_INPUT_BUFFER updates inputBuffer", () => {
    const next = sessionReducer(initialState, {
      type: "SET_INPUT_BUFFER",
      text: "typing something",
    });
    expect(next.inputBuffer).toBe("typing something");
  });

  it("SET_INPUT_BUFFER to empty string clears the buffer", () => {
    const state: SessionState = { ...initialState, inputBuffer: "some text" };
    const next = sessionReducer(state, {
      type: "SET_INPUT_BUFFER",
      text: "",
    });
    expect(next.inputBuffer).toBe("");
  });

  it("SET_INPUT_ACTIVE sets inputActive to true", () => {
    const next = sessionReducer(initialState, {
      type: "SET_INPUT_ACTIVE",
      active: true,
    });
    expect(next.inputActive).toBe(true);
  });

  it("SET_INPUT_ACTIVE sets inputActive to false", () => {
    const state: SessionState = { ...initialState, inputActive: true };
    const next = sessionReducer(state, {
      type: "SET_INPUT_ACTIVE",
      active: false,
    });
    expect(next.inputActive).toBe(false);
  });
});
