/**
 * SessionView — chat interface for the Babysitter TUI.
 *
 * Handles user message submission by:
 * 1. Processing slash commands locally (/clear, /back, /status, etc.)
 * 2. Sending user messages to the configured harness via ChatContext
 * 3. Displaying assistant responses and loading indicators
 *
 * Escape key dispatches GO_BACK (but only when input is not active in the
 * PromptBar, to avoid conflict with Escape-to-clear-input).
 *
 * Box/Text are obtained from InkContext via useInk() — no prop drilling.
 */

import React, { useCallback, useRef, useState } from "react";
import { useInk } from "../contexts/InkContext.js";
import type { InkKey } from "../contexts/InkContext.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useSession } from "../hooks/useSession.js";
import { useChatContext } from "../contexts/ChatContext.js";
import { StatusBar } from "../components/StatusBar.js";
import { MessagePane } from "../components/MessagePane.js";
import { PromptBar } from "../components/PromptBar.js";
import { SearchBar } from "../components/SearchBar.js";
import type { SearchBarState } from "../components/SearchBar.js";
import { BreakpointPanel } from "../components/BreakpointPanel.js";
import { EffectsPanel } from "../components/EffectsPanel.js";
import {
  createStreamingParser,
  getHarnessStreamingFormat,
  formatStreamLine,
  findMatches,
  formatKeyboardHelp,
  TERMINAL_BELL,
  buildTabStatusSequence,
  mapRunStatusToTabPreset,
} from "../helpers.js";
import type { StreamingParser } from "../helpers.js";
import { filterMessages } from "../components/MessagePane.js";
import type { TuiMessage, VerbosityLevel } from "../types.js";

// ---------------------------------------------------------------------------
// Slash command processing
// ---------------------------------------------------------------------------

const VERBOSITY_CYCLE: VerbosityLevel[] = ["minimal", "normal", "verbose"];

/** Available harnesses for the /harness picker menu. */
const HARNESS_OPTIONS = [
  "internal",
  "claude-code",
  "codex",
  "pi",
  "oh-my-pi",
  "gemini-cli",
  "github-copilot",
  "cursor",
  "opencode",
] as const;

/** Models available per harness. */
const HARNESS_MODELS: Record<string, readonly string[]> = {
  "internal": [
    "claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5-20251001",
    "gpt-5.4", "gpt-5.4-mini", "gpt-5.3-codex",
    "gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash",
  ],
  "claude-code": ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5-20251001"],
  "codex": ["o4-mini", "o3", "gpt-4.1", "gpt-5.3-codex", "gpt-5.4", "gpt-5.4-mini"],
  "pi": [
    "claude-sonnet-4-6", "claude-opus-4-6",
    "gpt-5.4", "gpt-5.4-mini", "gpt-5.3-codex", "gpt-4.1", "o4-mini",
    "gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro",
  ],
  "oh-my-pi": [
    "claude-sonnet-4-6", "claude-opus-4-6",
    "gpt-5.4", "gpt-5.4-mini", "gpt-5.3-codex", "gpt-4.1", "o4-mini",
    "gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro",
  ],
  "gemini-cli": ["gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"],
  "github-copilot": ["gpt-5.4", "gpt-4.1", "claude-sonnet-4-6"],
  "cursor": ["claude-sonnet-4-6", "gpt-5.4", "gpt-4.1"],
  "opencode": ["claude-sonnet-4-6", "claude-opus-4-6", "gemini-2.5-pro"],
};

interface SlashResult {
  handled: boolean;
  /** When /search is handled, this carries the query to activate search. */
  searchQuery?: string;
  /** When /effects is handled, signals to toggle the effects panel. */
  toggleEffects?: boolean;
}

interface SlashCommandContext {
  chatHarness: string;
  chatModel: string | undefined;
  setHarness: (name: string) => void;
  setModel: (name: string | undefined) => void;
}

function processSlashCommand(
  text: string,
  sessionDispatch: (action: {
    type: string;
    [key: string]: unknown;
  }) => void,
  navDispatch: (action: { type: string; [key: string]: unknown }) => void,
  sessionState: { verbosity: VerbosityLevel; runId: string | null; status: string },
  chatCtx?: SlashCommandContext,
): SlashResult {
  const lower = text.toLowerCase().trim();

  if (lower === "/clear") {
    sessionDispatch({ type: "CLEAR_MESSAGES" });
    return { handled: true };
  }

  if (lower === "/back") {
    navDispatch({ type: "GO_BACK" });
    return { handled: true };
  }

  if (lower === "/verbosity") {
    const idx = VERBOSITY_CYCLE.indexOf(sessionState.verbosity);
    const next = VERBOSITY_CYCLE[(idx + 1) % VERBOSITY_CYCLE.length];
    sessionDispatch({ type: "SET_VERBOSITY", verbosity: next });
    // Add a system message indicating the change
    const msg: TuiMessage = {
      id: `sys-${Date.now()}`,
      timestamp: new Date().toISOString(),
      verbosity: "minimal",
      content: { kind: "system", text: `Verbosity set to: ${next}` },
    };
    sessionDispatch({ type: "APPEND_MESSAGE", message: msg });
    return { handled: true };
  }

  if (lower === "/status") {
    const msg: TuiMessage = {
      id: `sys-${Date.now()}`,
      timestamp: new Date().toISOString(),
      verbosity: "minimal",
      content: {
        kind: "system",
        text: `Run: ${sessionState.runId ?? "none"} | Status: ${sessionState.status} | Verbosity: ${sessionState.verbosity}`,
      },
    };
    sessionDispatch({ type: "APPEND_MESSAGE", message: msg });
    return { handled: true };
  }

  if (lower === "/help") {
    const helpText = [
      "/clear     — Clear all messages",
      "/back      — Go back to dashboard",
      "/verbosity — Cycle verbosity level",
      "/status    — Show current session status",
      "/refresh   — Refresh run data",
      "/harness   — Switch harness (e.g. /harness claude-code)",
      "/model     — Switch model (e.g. /model claude-opus-4-6)",
      "/search    — Search messages (also Ctrl+F)",
      "/help      — Show this help",
    ].join("\n");
    const msg: TuiMessage = {
      id: `sys-${Date.now()}`,
      timestamp: new Date().toISOString(),
      verbosity: "minimal",
      content: { kind: "system", text: helpText },
    };
    sessionDispatch({ type: "APPEND_MESSAGE", message: msg });
    return { handled: true };
  }

  if (lower === "/refresh") {
    const msg: TuiMessage = {
      id: `sys-${Date.now()}`,
      timestamp: new Date().toISOString(),
      verbosity: "minimal",
      content: { kind: "system", text: "Refreshing..." },
    };
    sessionDispatch({ type: "APPEND_MESSAGE", message: msg });
    return { handled: true };
  }

  // /effects — toggle effects panel visibility
  if (lower === "/effects") {
    return { handled: true, toggleEffects: true };
  }

  // /search [query] — activate search bar, optionally with initial query
  if (lower.startsWith("/search")) {
    const parts = text.trim().split(/\s+/);
    const query = parts.slice(1).join(" ");
    return { handled: true, searchQuery: query };
  }

  // /harness [name] — switch harness or show menu
  if (lower.startsWith("/harness") && chatCtx) {
    const parts = text.trim().split(/\s+/);
    const name = parts[1];
    if (name && HARNESS_OPTIONS.includes(name as typeof HARNESS_OPTIONS[number])) {
      chatCtx.setHarness(name);
      const models = HARNESS_MODELS[name] ?? [];
      const modelList = models.length > 0 ? `\nAvailable models: ${models.join(", ")}` : "";
      const msg: TuiMessage = {
        id: `sys-${Date.now()}`,
        timestamp: new Date().toISOString(),
        verbosity: "minimal",
        content: { kind: "system", text: `Harness switched to: ${name}${modelList}` },
      };
      sessionDispatch({ type: "APPEND_MESSAGE", message: msg });
    } else {
      const current = chatCtx.chatHarness;
      const list = HARNESS_OPTIONS.map(
        (h) => `  ${h === current ? "* " : "  "}${h}`,
      ).join("\n");
      const msg: TuiMessage = {
        id: `sys-${Date.now()}`,
        timestamp: new Date().toISOString(),
        verbosity: "minimal",
        content: {
          kind: "system",
          text: `Current harness: ${current}\n\nAvailable harnesses:\n${list}\n\nUsage: /harness <name>`,
        },
      };
      sessionDispatch({ type: "APPEND_MESSAGE", message: msg });
    }
    return { handled: true };
  }

  // /model [name] — switch model or show menu
  if (lower.startsWith("/model") && chatCtx) {
    const parts = text.trim().split(/\s+/);
    const name = parts[1];
    if (name) {
      chatCtx.setModel(name);
      const msg: TuiMessage = {
        id: `sys-${Date.now()}`,
        timestamp: new Date().toISOString(),
        verbosity: "minimal",
        content: { kind: "system", text: `Model switched to: ${name} (harness: ${chatCtx.chatHarness})` },
      };
      sessionDispatch({ type: "APPEND_MESSAGE", message: msg });
    } else {
      const models = HARNESS_MODELS[chatCtx.chatHarness] ?? [];
      const currentModel = chatCtx.chatModel ?? "(default)";
      const list = models.length > 0
        ? models.map((m) => `  ${m === chatCtx.chatModel ? "* " : "  "}${m}`).join("\n")
        : "  (no model list for this harness)";
      const msg: TuiMessage = {
        id: `sys-${Date.now()}`,
        timestamp: new Date().toISOString(),
        verbosity: "minimal",
        content: {
          kind: "system",
          text: `Current model: ${currentModel} (harness: ${chatCtx.chatHarness})\n\nAvailable models:\n${list}\n\nUsage: /model <name>`,
        },
      };
      sessionDispatch({ type: "APPEND_MESSAGE", message: msg });
    }
    return { handled: true };
  }

  return { handled: false };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionView(): React.JSX.Element {
  const { Box, Text, useInput } = useInk();
  const { state: navState, dispatch: navDispatch } = useNavigation();
  const { state: sessionState, dispatch: sessionDispatch } = useSession();
  const chat = useChatContext();
  const pendingRef = useRef(false);
  const parserRef = useRef<StreamingParser | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [_searchState, setSearchState] = useState<SearchBarState>({
    query: "",
    matches: [],
    currentIndex: 0,
  });

  // Bind the navigation runId to session state if they differ
  React.useEffect(() => {
    if (navState.selectedRunId && navState.selectedRunId !== sessionState.runId) {
      sessionDispatch({ type: "SET_RUN_ID", runId: navState.selectedRunId });
    }
  }, [navState.selectedRunId, sessionState.runId, sessionDispatch]);

  // Auto-focus the prompt when entering session view
  React.useEffect(() => {
    sessionDispatch({ type: "SET_INPUT_ACTIVE", active: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update terminal tab color on status changes
  React.useEffect(() => {
    try {
      const preset = mapRunStatusToTabPreset(sessionState.status);
      process.stderr.write(buildTabStatusSequence(preset));
    } catch (_e) { /* ignore — stderr may not be writable */ }
  }, [sessionState.status]);

  // Escape goes back to dashboard (only when prompt input is not active)
  // Ctrl+F toggles search bar
  useInput(
    (input: string, key: InkKey) => {
      if (key.escape) {
        if (showHelp) {
          setShowHelp(false);
        } else if (searchActive) {
          setSearchActive(false);
          setSearchState({ query: "", matches: [], currentIndex: 0 });
        } else {
          navDispatch({ type: "GO_BACK" });
        }
        return;
      }
      if (input === "f" && key.ctrl) {
        setSearchActive((prev) => !prev);
        return;
      }
      if (input === "?") {
        setShowHelp((prev) => !prev);
        return;
      }
    },
    { isActive: !sessionState.inputActive },
  );

  // Handle message submission from the PromptBar
  const handleSubmit = useCallback(
    (text: string) => {
      // 1. Check for slash commands first
      if (text.startsWith("/")) {
        // Special: /clear also clears chat history
        if (text.toLowerCase().trim() === "/clear") {
          chat.clearHistory();
        }
        const result = processSlashCommand(
          text,
          sessionDispatch as (action: { type: string; [key: string]: unknown }) => void,
          navDispatch as (action: { type: string; [key: string]: unknown }) => void,
          sessionState,
          {
            chatHarness: chat.harness,
            chatModel: chat.model,
            setHarness: chat.setHarness,
            setModel: chat.setModel,
          },
        );
        if (result.handled) {
          if (result.toggleEffects) {
            setShowEffects((prev) => !prev);
          }
          if (result.searchQuery !== undefined) {
            setSearchActive(true);
            if (result.searchQuery) {
              // Pre-populate search with query from /search <query>
              const visible = filterMessages(sessionState.messages, sessionState.verbosity);
              const corpus = visible.map((m) => {
                const c = m.content;
                if ("text" in c) return c.text;
                if ("message" in c) return c.message;
                if ("toolName" in c) return c.toolName ?? "";
                if ("name" in c) return (c as { name?: string }).name ?? "";
                return "";
              }).join("\n");
              const matches = findMatches(
                corpus,
                result.searchQuery,
                { ignoreCase: true },
              );
              setSearchState({
                query: result.searchQuery,
                matches,
                currentIndex: 0,
              });
            }
          }
          return;
        }
      }

      // 2. Append user message to the conversation
      const userMessage: TuiMessage = {
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        verbosity: "minimal",
        content: { kind: "user", text },
      };
      sessionDispatch({ type: "APPEND_MESSAGE", message: userMessage });

      // 3. Create assistant message that will be updated with streaming output
      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: TuiMessage = {
        id: assistantId,
        timestamp: new Date().toISOString(),
        verbosity: "minimal",
        content: { kind: "assistant", text: "", streaming: true },
      };
      sessionDispatch({ type: "APPEND_MESSAGE", message: assistantMessage });
      sessionDispatch({ type: "SET_STATUS", status: "running" });
      sessionDispatch({ type: "TURN_STARTED", startedAt: Date.now() });

      // 4. Invoke the harness with streaming callbacks
      if (pendingRef.current) return; // prevent double-fire
      pendingRef.current = true;

      // Accumulate streamed lines for the assistant message
      const lines: string[] = [];
      // Track active tool calls: toolId → { msgId, startedAt }
      let toolCallCounter = 0;
      const activeTools = new Map<string, { msgId: string; startedAt: number }>();

      // Create a harness-aware stateful parser for this message
      const format = getHarnessStreamingFormat(chat.harness);
      const parser = createStreamingParser(format);
      parserRef.current = parser;

      chat
        .sendMessage(text, {
          onLine: (line: string, source?: "stdout" | "stderr") => {
            // Try to parse structured events from the streaming line
            const event = parser.parse(line);
            if (event) {
              if (event.kind === "tool_start") {
                toolCallCounter++;
                const msgId = `tool-${Date.now()}-${toolCallCounter}`;
                activeTools.set(event.toolId, { msgId, startedAt: Date.now() });
                const toolMsg: TuiMessage = {
                  id: msgId,
                  timestamp: new Date().toISOString(),
                  verbosity: "normal",
                  content: {
                    kind: "tool_call",
                    toolName: event.toolName,
                    input: undefined,
                  },
                };
                sessionDispatch({ type: "APPEND_MESSAGE", message: toolMsg });
              } else if (event.kind === "tool_end") {
                const tracked = activeTools.get(event.toolId);
                if (tracked) {
                  const elapsedMs = Date.now() - tracked.startedAt;
                  sessionDispatch({
                    type: "UPDATE_MESSAGE",
                    id: tracked.msgId,
                    patch: {
                      content: {
                        kind: "tool_call",
                        toolName: event.toolName,
                        input: undefined,
                        elapsedMs,
                      },
                    },
                  });
                  activeTools.delete(event.toolId);
                }
              } else if (event.kind === "token_update") {
                sessionDispatch({
                  type: "UPDATE_TOKEN_USAGE",
                  tokenUsage: {
                    input: event.inputTokens,
                    output: event.outputTokens,
                    total: event.inputTokens + event.outputTokens,
                    cacheRead: event.cacheReadTokens,
                    cacheWrite: event.cacheWriteTokens,
                  },
                });
              } else if (event.kind === "cost_update") {
                sessionDispatch({ type: "UPDATE_COST", cost: event.cost });
              } else if (event.kind === "text") {
                lines.push(event.text);
                sessionDispatch({
                  type: "UPDATE_MESSAGE",
                  id: assistantId,
                  patch: {
                    content: {
                      kind: "assistant",
                      text: lines.join(""),
                      streaming: true,
                    },
                  },
                });
              }
              return;
            }

            // Plain text line — accumulate in assistant message (stderr prefixed)
            lines.push(formatStreamLine(line, source));
            sessionDispatch({
              type: "UPDATE_MESSAGE",
              id: assistantId,
              patch: {
                content: {
                  kind: "assistant",
                  text: lines.join("\n"),
                  streaming: true,
                },
              },
            });
          },
          onComplete: (output: string) => {
            // Reset parser state between messages
            parserRef.current?.reset();
            // Final update with complete output, mark streaming done
            sessionDispatch({
              type: "UPDATE_MESSAGE",
              id: assistantId,
              patch: {
                content: {
                  kind: "assistant",
                  text: output || lines.join("\n"),
                  streaming: false,
                },
              },
            });
            sessionDispatch({ type: "SET_STATUS", status: "idle" });
            sessionDispatch({ type: "TURN_FINISHED" });
            // Terminal bell to notify user response is ready
            try { process.stderr.write(TERMINAL_BELL); } catch (_e) { /* ignore */ }
          },
          onError: (errText: string) => {
            parserRef.current?.reset();
            sessionDispatch({
              type: "UPDATE_MESSAGE",
              id: assistantId,
              patch: {
                content: {
                  kind: "error",
                  message: `Harness error: ${errText}`,
                },
              },
            });
            sessionDispatch({ type: "SET_STATUS", status: "idle" });
            sessionDispatch({ type: "TURN_FINISHED" });
          },
        })
        .catch((err: unknown) => {
          const errText = err instanceof Error ? err.message : String(err);
          sessionDispatch({
            type: "UPDATE_MESSAGE",
            id: assistantId,
            patch: {
              content: { kind: "error", message: `Harness error: ${errText}` },
            },
          });
          sessionDispatch({ type: "SET_STATUS", status: "idle" });
          sessionDispatch({ type: "TURN_FINISHED" });
        })
        .finally(() => {
          pendingRef.current = false;
          // Re-focus prompt after response
          sessionDispatch({ type: "SET_INPUT_ACTIVE", active: true });
        });
    },
    [sessionDispatch, navDispatch, sessionState, chat],
  );

  // Build searchable corpus from visible messages
  const searchCorpus = React.useMemo(() => {
    const visible = filterMessages(sessionState.messages, sessionState.verbosity);
    return visible
      .map((m) => {
        const c = m.content;
        if ("text" in c) return c.text;
        if ("message" in c) return c.message;
        if ("toolName" in c) return c.toolName ?? "";
        return "";
      })
      .join("\n");
  }, [sessionState.messages, sessionState.verbosity]);

  // Search change handler
  const handleSearchChange = useCallback(
    (state: SearchBarState) => {
      setSearchState(state);
    },
    [],
  );

  // Breakpoint handling
  const activeBreakpoint = sessionState.breakpoint;
  const hasActiveBreakpoint = activeBreakpoint !== null && activeBreakpoint.approved === null;

  const handleBreakpointSelect = useCallback(
    (option: string) => {
      if (!activeBreakpoint) return;
      const isApproved = option.toLowerCase().includes("approve");
      // Append a system message noting the breakpoint decision
      const msg: TuiMessage = {
        id: `bp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        verbosity: "minimal",
        content: {
          kind: "system",
          text: `Breakpoint "${activeBreakpoint.title}": ${isApproved ? "Approved" : "Rejected"} (${option})`,
        },
      };
      sessionDispatch({ type: "APPEND_MESSAGE", message: msg });
      sessionDispatch({ type: "CLEAR_BREAKPOINT" });
    },
    [activeBreakpoint, sessionDispatch],
  );

  // Loading indicator element
  const loadingIndicator = chat.loading
    ? React.createElement(
        Box as React.ComponentType<Record<string, unknown>>,
        { paddingX: 1 },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: "yellow", dimColor: true },
          "Waiting for response...",
        ),
      )
    : null;

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    {
      flexDirection: "column",
      height: "100%",
    },
    React.createElement(StatusBar, {
      harness: chat.harness,
      model: chat.model,
      iteration: sessionState.iteration,
    }),
    showHelp
      ? React.createElement(
          Box as React.ComponentType<Record<string, unknown>>,
          { flexDirection: "column", paddingX: 2, paddingY: 1, borderStyle: "round", borderColor: "cyan" },
          React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { color: "cyan", bold: true },
            "Keyboard Shortcuts",
          ),
          ...formatKeyboardHelp("session").map((line, idx) =>
            React.createElement(
              Text as React.ComponentType<Record<string, unknown>>,
              { key: `help-${idx}` },
              line,
            ),
          ),
          React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { color: "gray", dimColor: true },
            "\n  Press ? or Esc to close",
          ),
        )
      : null,
    React.createElement(MessagePane, null),
    showEffects
      ? React.createElement(EffectsPanel as React.ComponentType<Record<string, unknown>>, { showPendingSummary: true, maxTreeItems: 10 })
      : null,
    React.createElement(SearchBar, {
      text: searchCorpus,
      isActive: searchActive,
      onSearchChange: handleSearchChange,
    }),
    loadingIndicator,
    hasActiveBreakpoint
      ? React.createElement(BreakpointPanel, {
          breakpoint: activeBreakpoint,
          onSelect: handleBreakpointSelect,
          isActive: true,
        })
      : React.createElement(PromptBar, {
          onSubmit: handleSubmit,
          placeholder: chat.loading
            ? "Waiting for response..."
            : "Type a message... (Enter=submit, Esc=clear, /help for commands)",
        }),
  );
}
