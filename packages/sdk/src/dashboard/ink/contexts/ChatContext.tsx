/**
 * ChatContext — provides harness invocation capabilities to the TUI.
 *
 * Wraps the harness invoker module, manages conversation history, and
 * exposes a `sendMessage(text, callbacks)` interface. Streams harness
 * output line-by-line via callbacks so the caller can update the UI
 * in real time.
 *
 * Conversation history is accumulated and included in each harness
 * prompt so the harness sees full multi-turn context.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single turn in the conversation history. */
export interface ChatTurn {
  readonly role: "user" | "assistant";
  readonly text: string;
}

/** Callbacks for streaming harness output. */
export interface StreamCallbacks {
  /** Called with each line of output as it arrives. Source indicates stdout or stderr. */
  onLine?: (line: string, source?: "stdout" | "stderr") => void;
  /** Called when the response is complete with the full output. */
  onComplete?: (output: string) => void;
  /** Called if the invocation fails. */
  onError?: (error: string) => void;
}

export interface ChatContextValue {
  /** Send a user message to the harness with streaming callbacks. */
  sendMessage: (text: string, callbacks?: StreamCallbacks) => Promise<string>;
  /** Whether a harness invocation is currently in flight. */
  loading: boolean;
  /** The configured harness name. */
  harness: string;
  /** Switch harness at runtime. Clears conversation history. */
  setHarness: (name: string) => void;
  /** The configured model (if any). */
  model: string | undefined;
  /** Switch model at runtime. */
  setModel: (name: string | undefined) => void;
  /** Cancel the current in-flight request (if any). */
  cancel: () => void;
  /** Conversation history. */
  history: readonly ChatTurn[];
  /** Clear conversation history. */
  clearHistory: () => void;
}

export interface ChatProviderProps {
  children: ReactNode;
  /** Harness to invoke. Defaults to "internal". */
  harness?: string;
  /** Workspace directory. Defaults to cwd. */
  workspace?: string;
  /** Model override. */
  model?: string;
}

// ---------------------------------------------------------------------------
// History formatting
// ---------------------------------------------------------------------------

/**
 * Build a prompt that includes conversation history for multi-turn context.
 */
function buildPromptWithHistory(
  history: readonly ChatTurn[],
  currentMessage: string,
): string {
  if (history.length === 0) return currentMessage;

  const lines: string[] = [];
  lines.push("<conversation_history>");
  for (const turn of history) {
    const tag = turn.role === "user" ? "user" : "assistant";
    lines.push(`<${tag}>${turn.text}</${tag}>`);
  }
  lines.push("</conversation_history>");
  lines.push("");
  lines.push(currentMessage);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ChatContext = createContext<ChatContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ChatProvider({
  children,
  harness: initialHarness = "internal",
  workspace,
  model: initialModel,
}: ChatProviderProps): React.JSX.Element {
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState<ChatTurn[]>([]);
  const [harness, setHarnessState] = React.useState(initialHarness);
  const [model, setModelState] = React.useState<string | undefined>(initialModel);
  const abortRef = useRef<AbortController | null>(null);
  // Keep a ref to history so the sendMessage callback always sees current state
  const historyRef = useRef<ChatTurn[]>([]);
  historyRef.current = history;

  const setHarness = useCallback((name: string) => {
    setHarnessState(name);
    setHistory([]); // Clear history when switching harness
  }, []);

  const setModel = useCallback((name: string | undefined) => {
    setModelState(name);
  }, []);

  const sendMessage = useCallback(
    async (text: string, callbacks?: StreamCallbacks): Promise<string> => {
      setLoading(true);
      abortRef.current = new AbortController();

      try {
        // Build prompt with conversation history
        const prompt = buildPromptWithHistory(historyRef.current, text);

        // Dynamic require to avoid top-level ESM/CJS issues in the React tree
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { invokeHarnessStreaming } = require("../../../harness/streamingCapture") as {
          invokeHarnessStreaming: (
            name: string,
            options: {
              prompt: string;
              workspace?: string;
              model?: string;
              timeout?: number;
              streaming?: {
                onLine?: (line: string, stream: "stdout" | "stderr") => void;
              };
            },
          ) => Promise<{
            success: boolean;
            output: string;
            exitCode: number;
            duration: number;
            harness: string;
          }>;
        };

        const result = await invokeHarnessStreaming(harness, {
          prompt,
          workspace: workspace ?? process.cwd(),
          model,
          timeout: 600_000, // 10 minutes
          streaming: {
            onLine: (line: string, stream: "stdout" | "stderr") => {
              callbacks?.onLine?.(line, stream);
            },
          },
        });

        const output = result.output.trim();

        // Update conversation history
        setHistory((prev) => [
          ...prev,
          { role: "user" as const, text },
          { role: "assistant" as const, text: output },
        ]);

        callbacks?.onComplete?.(output);
        return output;
      } catch (err: unknown) {
        // If aborted, silently ignore
        if (abortRef.current?.signal.aborted) return "";
        const errText = err instanceof Error ? err.message : String(err);
        callbacks?.onError?.(errText);
        throw err;
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [harness, workspace, model],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const value = React.useMemo(
    () => ({ sendMessage, loading, harness, setHarness, model, setModel, cancel, history, clearHistory }),
    [sendMessage, loading, harness, setHarness, model, setModel, cancel, history, clearHistory],
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (ctx === null) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return ctx;
}
