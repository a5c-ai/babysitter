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

import React, { useCallback, useRef } from "react";
import { useInk } from "../contexts/InkContext.js";
import type { InkKey } from "../contexts/InkContext.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useSession } from "../hooks/useSession.js";
import { useChatContext } from "../contexts/ChatContext.js";
import { StatusBar } from "../components/StatusBar.js";
import { MessagePane } from "../components/MessagePane.js";
import { PromptBar } from "../components/PromptBar.js";
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

  // Escape goes back to dashboard (only when prompt input is not active)
  useInput(
    (_input: string, key: InkKey) => {
      if (key.escape) {
        navDispatch({ type: "GO_BACK" });
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
        if (result.handled) return;
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

      // 4. Invoke the harness with streaming callbacks
      if (pendingRef.current) return; // prevent double-fire
      pendingRef.current = true;

      // Accumulate streamed lines for the assistant message
      const lines: string[] = [];

      chat
        .sendMessage(text, {
          onLine: (line: string) => {
            lines.push(line);
            // Update assistant message with accumulated output
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
          },
          onError: (errText: string) => {
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
        })
        .finally(() => {
          pendingRef.current = false;
          // Re-focus prompt after response
          sessionDispatch({ type: "SET_INPUT_ACTIVE", active: true });
        });
    },
    [sessionDispatch, navDispatch, sessionState, chat],
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
    React.createElement(StatusBar, null),
    React.createElement(MessagePane, null),
    loadingIndicator,
    React.createElement(PromptBar, {
      onSubmit: handleSubmit,
      placeholder: chat.loading
        ? "Waiting for response..."
        : "Type a message... (Enter=submit, Esc=clear, /help for commands)",
    }),
  );
}
