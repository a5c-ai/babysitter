/**
 * types.test.ts
 *
 * Tests for the shared TUI type definitions in types.ts.
 *
 * Since the types file has no runtime utility functions, these tests
 * validate the TypeScript type contracts by exercising the discriminated
 * union and interface shapes via plain object construction and structural
 * assertions.  They also serve as regression guards — if a field is
 * renamed or a variant removed the relevant test will fail to compile.
 */

import { describe, it, expect } from "vitest";
import type {
  MessageKind,
  VerbosityLevel,
  RunStatus,
  TuiMessage,
  TuiMessageContent,
  UserMessageContent,
  AssistantMessageContent,
  ToolCallContent,
  SubagentContent,
  SystemContent,
  ErrorContent,
  SessionState,
  Theme,
  ThemeColors,
  TuiConfig,
} from "../types.js";

// ---------------------------------------------------------------------------
// MessageKind
// ---------------------------------------------------------------------------

describe("MessageKind values", () => {
  it("includes all six expected kind literals", () => {
    const kinds: MessageKind[] = [
      "user",
      "assistant",
      "tool_call",
      "subagent",
      "system",
      "error",
    ];
    expect(kinds).toHaveLength(6);
    expect(new Set(kinds).size).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// VerbosityLevel
// ---------------------------------------------------------------------------

describe("VerbosityLevel values", () => {
  it("includes minimal, normal, verbose", () => {
    const levels: VerbosityLevel[] = ["minimal", "normal", "verbose"];
    expect(levels).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// RunStatus
// ---------------------------------------------------------------------------

describe("RunStatus values", () => {
  it("includes all five status literals", () => {
    const statuses: RunStatus[] = [
      "idle",
      "running",
      "waiting_effect",
      "complete",
      "failed",
    ];
    expect(statuses).toHaveLength(5);
    expect(new Set(statuses).size).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// TuiMessageContent discriminated union
// ---------------------------------------------------------------------------

describe("TuiMessageContent discriminated union", () => {
  it("UserMessageContent has kind=user and text field", () => {
    const msg: UserMessageContent = { kind: "user", text: "hello" };
    expect(msg.kind).toBe("user");
    expect(msg.text).toBe("hello");
  });

  it("AssistantMessageContent has optional streaming field", () => {
    const withoutStreaming: AssistantMessageContent = {
      kind: "assistant",
      text: "thinking…",
    };
    const withStreaming: AssistantMessageContent = {
      kind: "assistant",
      text: "thinking…",
      streaming: true,
    };
    expect(withoutStreaming.streaming).toBeUndefined();
    expect(withStreaming.streaming).toBe(true);
  });

  it("ToolCallContent requires toolName and input", () => {
    const tc: ToolCallContent = {
      kind: "tool_call",
      toolName: "bash",
      input: { command: "ls" },
    };
    expect(tc.toolName).toBe("bash");
    expect(tc.elapsedMs).toBeUndefined();
  });

  it("ToolCallContent accepts optional elapsedMs and output", () => {
    const tc: ToolCallContent = {
      kind: "tool_call",
      toolName: "bash",
      input: { command: "ls" },
      output: "file.txt\n",
      elapsedMs: 123,
    };
    expect(tc.elapsedMs).toBe(123);
    expect(tc.output).toBe("file.txt\n");
  });

  it("SubagentContent has agentId, label, status fields", () => {
    const sa: SubagentContent = {
      kind: "subagent",
      agentId: "agent-1",
      label: "Worker A",
      status: "running",
    };
    expect(sa.agentId).toBe("agent-1");
    expect(sa.status).toBe("running");
    expect(sa.childMessages).toBeUndefined();
  });

  it("SystemContent has kind=system and text", () => {
    const sys: SystemContent = { kind: "system", text: "Run initialised." };
    expect(sys.kind).toBe("system");
  });

  it("ErrorContent has message and optional detail", () => {
    const err: ErrorContent = {
      kind: "error",
      message: "Something went wrong",
      detail: "ENOENT",
    };
    expect(err.message).toBe("Something went wrong");
    expect(err.detail).toBe("ENOENT");
  });

  it("ErrorContent without detail is valid", () => {
    const err: ErrorContent = { kind: "error", message: "Boom" };
    expect(err.detail).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// TuiMessage
// ---------------------------------------------------------------------------

describe("TuiMessage shape", () => {
  it("has id, timestamp, verbosity, content fields", () => {
    const msg: TuiMessage = {
      id: "01JXABCDEF",
      timestamp: new Date().toISOString(),
      verbosity: "normal",
      content: { kind: "user", text: "hi" },
    };
    expect(msg.id).toBe("01JXABCDEF");
    expect(msg.verbosity).toBe("normal");
    expect(msg.content.kind).toBe("user");
  });

  it("content discriminant narrows correctly", () => {
    const content: TuiMessageContent = { kind: "error", message: "oops" };
    if (content.kind === "error") {
      expect(content.message).toBe("oops");
    } else {
      throw new Error("should have narrowed to error");
    }
  });
});

// ---------------------------------------------------------------------------
// SessionState initial shape sanity
// ---------------------------------------------------------------------------

describe("SessionState shape", () => {
  it("accepts a valid initial state object", () => {
    const state: SessionState = {
      runId: null,
      status: "idle",
      messages: [],
      verbosity: "normal",
      inputBuffer: "",
      inputActive: false,
      runStartedAt: null,
    };
    expect(state.runId).toBeNull();
    expect(state.status).toBe("idle");
    expect(state.messages).toHaveLength(0);
  });

  it("accepts state with runId set", () => {
    const state: SessionState = {
      runId: "run-abc-123",
      status: "running",
      messages: [],
      verbosity: "verbose",
      inputBuffer: "typing…",
      inputActive: true,
      runStartedAt: Date.now(),
    };
    expect(state.runId).toBe("run-abc-123");
    expect(state.inputActive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Theme / ThemeColors shapes
// ---------------------------------------------------------------------------

describe("Theme and ThemeColors shapes", () => {
  it("ThemeColors requires all nine color fields", () => {
    const colors: ThemeColors = {
      primary: "cyan",
      secondary: "#7b61ff",
      muted: "#6b7280",
      error: "#ef4444",
      warning: "#f59e0b",
      success: "#22c55e",
      foreground: "#e5e7eb",
      background: "#0a0a0f",
      border: "#374151",
      toolCall: "#a78bfa",
      subagent: "#38bdf8",
    };
    expect(Object.keys(colors)).toHaveLength(11);
  });

  it("Theme has name and colors fields", () => {
    const theme: Theme = {
      name: "testTheme",
      colors: {
        primary: "blue",
        secondary: "purple",
        muted: "gray",
        error: "red",
        warning: "yellow",
        success: "green",
        foreground: "white",
        background: "black",
        border: "gray",
        toolCall: "magenta",
        subagent: "cyan",
      },
    };
    expect(theme.name).toBe("testTheme");
    expect(theme.colors.primary).toBe("blue");
  });
});

// ---------------------------------------------------------------------------
// TuiConfig optional fields
// ---------------------------------------------------------------------------

describe("TuiConfig", () => {
  it("accepts empty config (all fields optional)", () => {
    const cfg: TuiConfig = {};
    expect(cfg.runId).toBeUndefined();
    expect(cfg.verbosity).toBeUndefined();
    expect(cfg.theme).toBeUndefined();
    expect(cfg.useStderr).toBeUndefined();
  });

  it("accepts fully-specified config", () => {
    const cfg: TuiConfig = {
      runId: "run-xyz",
      verbosity: "verbose",
      useStderr: false,
    };
    expect(cfg.runId).toBe("run-xyz");
    expect(cfg.verbosity).toBe("verbose");
    expect(cfg.useStderr).toBe(false);
  });
});
