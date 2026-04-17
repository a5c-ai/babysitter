/**
 * navigationContext.test.ts
 *
 * Tests for the navigationReducer inside NavigationContext.tsx.
 *
 * Same strategy as sessionContext.test.ts: re-implement the pure reducer here
 * to avoid React / Ink ESM imports.  The tests act as a behavioral contract.
 */

import { describe, it, expect } from "vitest";
import type { ViewName } from "../types.js";

// ---------------------------------------------------------------------------
// Types mirroring the source
// ---------------------------------------------------------------------------

interface NavigationState {
  readonly currentView: ViewName;
  readonly selectedRunId: string | null;
  readonly history: readonly ViewName[];
}

type NavigationAction =
  | { type: "NAVIGATE_TO_SESSION"; runId: string }
  | { type: "NAVIGATE_TO_RUN_DETAIL"; runId: string }
  | { type: "NAVIGATE_TO_DASHBOARD" }
  | { type: "GO_BACK" };

// ---------------------------------------------------------------------------
// Re-implemented reducer (mirrors NavigationContext.tsx exactly)
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

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initial: NavigationState = {
  currentView: "dashboard",
  selectedRunId: null,
  history: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("navigationReducer", () => {
  describe("NAVIGATE_TO_SESSION", () => {
    it("switches to session view and records the run ID", () => {
      const next = navigationReducer(initial, {
        type: "NAVIGATE_TO_SESSION",
        runId: "run-abc",
      });
      expect(next.currentView).toBe("session");
      expect(next.selectedRunId).toBe("run-abc");
    });

    it("pushes the previous view onto history", () => {
      const next = navigationReducer(initial, {
        type: "NAVIGATE_TO_SESSION",
        runId: "run-abc",
      });
      expect(next.history).toEqual(["dashboard"]);
    });

    it("preserves history when navigating from run-detail to session", () => {
      const fromRunDetail: NavigationState = {
        currentView: "run-detail",
        selectedRunId: "run-old",
        history: ["dashboard"],
      };
      const next = navigationReducer(fromRunDetail, {
        type: "NAVIGATE_TO_SESSION",
        runId: "run-new",
      });
      expect(next.history).toEqual(["dashboard", "run-detail"]);
      expect(next.selectedRunId).toBe("run-new");
    });
  });

  describe("NAVIGATE_TO_RUN_DETAIL", () => {
    it("switches to run-detail view and records the run ID", () => {
      const next = navigationReducer(initial, {
        type: "NAVIGATE_TO_RUN_DETAIL",
        runId: "run-xyz",
      });
      expect(next.currentView).toBe("run-detail");
      expect(next.selectedRunId).toBe("run-xyz");
    });

    it("pushes the previous view onto history", () => {
      const next = navigationReducer(initial, {
        type: "NAVIGATE_TO_RUN_DETAIL",
        runId: "run-xyz",
      });
      expect(next.history).toEqual(["dashboard"]);
    });
  });

  describe("NAVIGATE_TO_DASHBOARD", () => {
    it("resets to dashboard, clears run ID and history", () => {
      const deep: NavigationState = {
        currentView: "session",
        selectedRunId: "run-abc",
        history: ["dashboard", "run-detail"],
      };
      const next = navigationReducer(deep, { type: "NAVIGATE_TO_DASHBOARD" });
      expect(next.currentView).toBe("dashboard");
      expect(next.selectedRunId).toBeNull();
      expect(next.history).toEqual([]);
    });

    it("is a no-op from dashboard (idempotent)", () => {
      const next = navigationReducer(initial, { type: "NAVIGATE_TO_DASHBOARD" });
      expect(next).toEqual(initial);
    });
  });

  describe("GO_BACK", () => {
    it("returns to previous view from history", () => {
      const inSession: NavigationState = {
        currentView: "session",
        selectedRunId: "run-abc",
        history: ["dashboard"],
      };
      const next = navigationReducer(inSession, { type: "GO_BACK" });
      expect(next.currentView).toBe("dashboard");
      expect(next.history).toEqual([]);
    });

    it("clears selectedRunId when going back to dashboard", () => {
      const inSession: NavigationState = {
        currentView: "session",
        selectedRunId: "run-abc",
        history: ["dashboard"],
      };
      const next = navigationReducer(inSession, { type: "GO_BACK" });
      expect(next.selectedRunId).toBeNull();
    });

    it("preserves selectedRunId when going back to non-dashboard view", () => {
      const deep: NavigationState = {
        currentView: "session",
        selectedRunId: "run-abc",
        history: ["dashboard", "run-detail"],
      };
      const next = navigationReducer(deep, { type: "GO_BACK" });
      expect(next.currentView).toBe("run-detail");
      expect(next.selectedRunId).toBe("run-abc");
      expect(next.history).toEqual(["dashboard"]);
    });

    it("falls back to dashboard when history is empty", () => {
      const noHistory: NavigationState = {
        currentView: "session",
        selectedRunId: "run-abc",
        history: [],
      };
      const next = navigationReducer(noHistory, { type: "GO_BACK" });
      expect(next.currentView).toBe("dashboard");
      expect(next.selectedRunId).toBeNull();
      expect(next.history).toEqual([]);
    });

    it("pops only the last entry from multi-level history", () => {
      const deep: NavigationState = {
        currentView: "session",
        selectedRunId: "run-abc",
        history: ["dashboard", "run-detail"],
      };
      const back1 = navigationReducer(deep, { type: "GO_BACK" });
      expect(back1.currentView).toBe("run-detail");
      expect(back1.history).toEqual(["dashboard"]);

      const back2 = navigationReducer(back1, { type: "GO_BACK" });
      expect(back2.currentView).toBe("dashboard");
      expect(back2.history).toEqual([]);
    });
  });

  describe("round-trip navigation", () => {
    it("dashboard -> session -> back = dashboard", () => {
      let state = initial;
      state = navigationReducer(state, { type: "NAVIGATE_TO_SESSION", runId: "r1" });
      expect(state.currentView).toBe("session");
      state = navigationReducer(state, { type: "GO_BACK" });
      expect(state.currentView).toBe("dashboard");
      expect(state.selectedRunId).toBeNull();
      expect(state.history).toEqual([]);
    });

    it("dashboard -> run-detail -> session -> back -> back = dashboard", () => {
      let state = initial;
      state = navigationReducer(state, { type: "NAVIGATE_TO_RUN_DETAIL", runId: "r1" });
      state = navigationReducer(state, { type: "NAVIGATE_TO_SESSION", runId: "r1" });
      expect(state.history).toEqual(["dashboard", "run-detail"]);

      state = navigationReducer(state, { type: "GO_BACK" });
      expect(state.currentView).toBe("run-detail");

      state = navigationReducer(state, { type: "GO_BACK" });
      expect(state.currentView).toBe("dashboard");
      expect(state.selectedRunId).toBeNull();
    });

    it("NAVIGATE_TO_DASHBOARD from any depth resets completely", () => {
      let state = initial;
      state = navigationReducer(state, { type: "NAVIGATE_TO_RUN_DETAIL", runId: "r1" });
      state = navigationReducer(state, { type: "NAVIGATE_TO_SESSION", runId: "r1" });
      state = navigationReducer(state, { type: "NAVIGATE_TO_DASHBOARD" });
      expect(state).toEqual(initial);
    });
  });

  describe("edge cases", () => {
    it("multiple GO_BACK from dashboard stays at dashboard", () => {
      let state = initial;
      state = navigationReducer(state, { type: "GO_BACK" });
      expect(state.currentView).toBe("dashboard");
      state = navigationReducer(state, { type: "GO_BACK" });
      expect(state.currentView).toBe("dashboard");
    });

    it("switching runs updates selectedRunId", () => {
      let state = initial;
      state = navigationReducer(state, { type: "NAVIGATE_TO_SESSION", runId: "r1" });
      expect(state.selectedRunId).toBe("r1");
      // Navigate to dashboard then a different run
      state = navigationReducer(state, { type: "NAVIGATE_TO_DASHBOARD" });
      state = navigationReducer(state, { type: "NAVIGATE_TO_SESSION", runId: "r2" });
      expect(state.selectedRunId).toBe("r2");
    });
  });
});
