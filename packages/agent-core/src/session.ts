import * as childProcess from "node:child_process";
import type {
  AgentCoreHistoryEntry,
  AgentCorePromptResult,
  AgentCoreSessionEvent,
  AgentCoreSessionOptions,
} from "./types";
import { estimateTokens } from "./context/token-estimator";

// 15 minutes — accommodates long-running model responses (e.g., gpt-5.5 thinking)
// and Azure Foundry cold-start latency. Override per-call via session.prompt(text, timeout).
const DEFAULT_TIMEOUT_MS = 900_000;
const DEFAULT_MAX_HISTORY_TURNS = 20;

export type AgentCoreEventListener = (event: AgentCoreSessionEvent) => void;

type ProviderMessage = { role: string; content: string };

type CompletionUsage = { promptTokens: number; completionTokens: number };

type CompletionStreamResult = { text: string; usage?: CompletionUsage };

function buildSystemPrompt(options: AgentCoreSessionOptions): string | undefined {
  const segments: string[] = [];
  if (options.systemPrompt?.trim()) {
    segments.push(options.systemPrompt.trim());
  }
  if (options.appendSystemPrompt?.length) {
    for (const prompt of options.appendSystemPrompt) {
      if (prompt.trim()) {
        segments.push(prompt.trim());
      }
    }
  }
  if (segments.length === 0) {
    return undefined;
  }
  return segments.join("\n\n");
}

interface ResolvedEndpoint {
  apiBase: string;
  apiKey: string;
  model: string;
  isAzure: boolean;
  isAnthropic: boolean;
}

function resolveEndpoint(options: AgentCoreSessionOptions): ResolvedEndpoint {
  const amuxProvider = process.env["AMUX_PROVIDER"];
  const amuxApiBase = process.env["AMUX_API_BASE"];
  const amuxApiKey = process.env["AMUX_API_KEY"];
  const amuxModel = process.env["AMUX_MODEL"];
  const azureApiKey = process.env["AZURE_API_KEY"] || process.env["AZURE_OPENAI_API_KEY"];
  const azureProject = process.env["AZURE_OPENAI_PROJECT_NAME"];
  const openaiApiKey = process.env["OPENAI_API_KEY"];
  const openaiModel = process.env["OPENAI_MODEL"];
  const anthropicApiKey = process.env["ANTHROPIC_API_KEY"];

  const model = options.model || amuxModel || openaiModel || "gpt-4o";
  if (!options.model && !amuxModel && !openaiModel) {
    process.stderr.write(`[agent-core] no model specified, defaulting to gpt-4o\n`);
  }

  if (amuxProvider === "foundry" || amuxProvider === "azure") {
    const apiBase = amuxApiBase || "";
    const apiKey = amuxApiKey || azureApiKey || "";
    return { apiBase: `${apiBase}/openai`, apiKey, model, isAzure: true, isAnthropic: false };
  }

  // Azure OpenAI via AZURE_OPENAI_API_KEY + AZURE_OPENAI_PROJECT_NAME
  if (azureApiKey && azureProject) {
    const apiBase = `https://${azureProject}.services.ai.azure.com/openai`;
    return { apiBase, apiKey: azureApiKey, model, isAzure: true, isAnthropic: false };
  }

  if (amuxApiBase) {
    const apiKey = amuxApiKey || openaiApiKey || "";
    return { apiBase: amuxApiBase, apiKey, model, isAzure: false, isAnthropic: false };
  }

  if (openaiApiKey) {
    return { apiBase: "https://api.openai.com/v1", apiKey: openaiApiKey, model, isAzure: false, isAnthropic: false };
  }

  if (anthropicApiKey) {
    const anthropicModel = model.startsWith("gpt") ? "claude-sonnet-4-6" : model;
    if (anthropicModel !== model) {
      process.stderr.write(`[agent-core] anthropic provider: converting model ${model} → ${anthropicModel}\n`);
    }
    return { apiBase: "https://api.anthropic.com", apiKey: anthropicApiKey, model: anthropicModel, isAzure: false, isAnthropic: true };
  }

  if (!amuxApiKey) {
    throw new Error(
      "No API credentials found. Set one of: " +
      "AMUX_PROVIDER + AMUX_API_BASE + AZURE_API_KEY (for Foundry/Azure), " +
      "OPENAI_API_KEY (for OpenAI), " +
      "ANTHROPIC_API_KEY (for Anthropic), " +
      "or AMUX_API_BASE + AMUX_API_KEY (for custom endpoint). " +
      "Alternatively, use --harness claude-code to route through an installed agent."
    );
  }

  return { apiBase: "https://api.openai.com/v1", apiKey: amuxApiKey, model, isAzure: false, isAnthropic: false };
}

async function callCompletionApi(
  endpoint: ResolvedEndpoint,
  messages: ProviderMessage[],
  timeout: number,
  onDelta: (delta: string) => void,
  onController?: (controller: AbortController | undefined) => void,
): Promise<CompletionStreamResult> {
  const controller = new AbortController();
  onController?.(controller);
  const startTime = Date.now();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${Math.round((Date.now() - startTime) / 1000)}s (limit: ${Math.round(timeout / 1000)}s)`));
  }, timeout);

  try {
    let url: string;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: string;

    if (endpoint.isAnthropic) {
      url = `${endpoint.apiBase}/v1/messages`;
      headers["x-api-key"] = endpoint.apiKey;
      headers["anthropic-version"] = "2023-06-01";
      const systemMsg = messages.find(m => m.role === "system");
      const nonSystemMsgs = messages.filter(m => m.role !== "system");
      body = JSON.stringify({
        model: endpoint.model,
        max_tokens: 16384,
        stream: true,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        messages: nonSystemMsgs.map(m => ({ role: m.role, content: m.content })),
      });
    } else if (endpoint.isAzure) {
      url = `${endpoint.apiBase}/deployments/${endpoint.model}/chat/completions?api-version=2025-04-01-preview`;
      headers["api-key"] = endpoint.apiKey;
      body = JSON.stringify({
        model: endpoint.model,
        messages,
        max_completion_tokens: 16384,
        stream: true,
      });
    } else {
      url = `${endpoint.apiBase}/chat/completions`;
      headers["Authorization"] = `Bearer ${endpoint.apiKey}`;
      body = JSON.stringify({
        model: endpoint.model,
        messages,
        max_completion_tokens: 16384,
        stream: true,
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}) at ${url}: ${errorText.slice(0, 500)}`);
    }

    return endpoint.isAnthropic
      ? readAnthropicStream(response, onDelta)
      : readOpenAiStream(response, onDelta);
  } finally {
    clearTimeout(timer);
    onController?.(undefined);
  }
}

async function readOpenAiStream(
  response: Response,
  onDelta: (delta: string) => void,
): Promise<CompletionStreamResult> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let usage: CompletionUsage | undefined;
  let buffer = "";

  const handlePayload = (payload: string): boolean => {
    if (payload === "[DONE]") return true;

    let chunk: {
      choices?: Array<{
        delta?: { content?: string | null };
        finish_reason?: string | null;
      }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    try {
      chunk = JSON.parse(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse OpenAI stream chunk: ${message}`);
    }

    const choice = chunk.choices?.[0];
    const delta = choice?.delta?.content;
    if (delta) {
      chunks.push(delta);
      onDelta(delta);
    }
    if (chunk.usage) {
      usage = {
        promptTokens: chunk.usage.prompt_tokens ?? 0,
        completionTokens: chunk.usage.completion_tokens ?? 0,
      };
    }
    return Boolean(choice?.finish_reason);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const complete = handlePayload(trimmed.slice(5).trim());
      if (complete) {
        return { text: chunks.join(""), usage };
      }
    }
  }

  buffer += decoder.decode();
  for (const line of buffer.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("data:")) continue;
    const complete = handlePayload(trimmed.slice(5).trim());
    if (complete) break;
  }

  return { text: chunks.join(""), usage };
}

async function readAnthropicStream(
  response: Response,
  onDelta: (delta: string) => void,
): Promise<CompletionStreamResult> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let usage: CompletionUsage | undefined;
  let buffer = "";
  let done = false;

  const handlePayload = (payload: string): void => {
    if (payload === "[DONE]") {
      done = true;
      return;
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(payload) as Record<string, unknown>;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse Anthropic stream chunk: ${message}`);
    }

    const type = event.type;
    if (type === "message_start") {
      const message = event.message as { usage?: { input_tokens?: number } } | undefined;
      if (message?.usage) {
        usage = {
          promptTokens: message.usage.input_tokens ?? 0,
          completionTokens: usage?.completionTokens ?? 0,
        };
      }
      return;
    }

    if (type === "content_block_delta") {
      const delta = event.delta as { type?: string; text?: string } | undefined;
      if (delta?.type === "text_delta" && delta.text) {
        chunks.push(delta.text);
        onDelta(delta.text);
      }
      return;
    }

    if (type === "message_delta") {
      const messageUsage = event.usage as { output_tokens?: number } | undefined;
      if (messageUsage) {
        usage = {
          promptTokens: usage?.promptTokens ?? 0,
          completionTokens: messageUsage.output_tokens ?? 0,
        };
      }
      done = true;
      return;
    }

    if (type === "message_stop") {
      done = true;
    }
  };

  while (!done) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      handlePayload(trimmed.slice(5).trim());
      if (done) break;
    }
  }

  buffer += decoder.decode();
  for (const line of buffer.split("\n")) {
    if (done) break;
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("data:")) continue;
    handlePayload(trimmed.slice(5).trim());
  }

  return { text: chunks.join(""), usage };
}

export class AgentCoreSessionHandle {
  private readonly options: AgentCoreSessionOptions;
  private readonly listeners = new Set<AgentCoreEventListener>();
  private history: AgentCoreHistoryEntry[] = [];
  private queuedFollowUps: string[] = [];
  private currentSessionId: string | undefined;
  private activeAbortController: AbortController | undefined;
  private isActive = false;

  constructor(options: AgentCoreSessionOptions = {}) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    return;
  }

  async prompt(text: string, timeout?: number): Promise<AgentCorePromptResult> {
    if (this.isActive) {
      throw new Error("Agent core session is already processing a prompt");
    }

    this.isActive = true;
    const effectiveTimeout = (timeout || this.options.timeout) || DEFAULT_TIMEOUT_MS;
    const start = Date.now();

    const followUps = this.queuedFollowUps;
    this.queuedFollowUps = [];
    const promptText = followUps.length > 0
      ? [text, ...followUps.map((item) => `Follow-up instruction:\n${item}`)].join("\n\n")
      : text;

    const endpoint = resolveEndpoint(this.options);
    try {
      const messages: ProviderMessage[] = [];

      const systemPrompt = buildSystemPrompt(this.options);
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push(...this.trimHistoryForPrompt());
      messages.push({ role: "user", content: promptText });

      const sessionId = this.currentSessionId ?? `agent-core-${Date.now()}`;
      this.currentSessionId = sessionId;

      this.emit({ type: "session_start", sessionId });

      const providerLabel = endpoint.isAnthropic ? "anthropic" : endpoint.isAzure ? "azure/foundry" : "openai";
      process.stderr.write(`[agent-core] ${providerLabel} → ${endpoint.apiBase} model=${endpoint.model} timeout=${Math.round(effectiveTimeout / 1000)}s\n`);

      const result = await callCompletionApi(
        endpoint,
        messages,
        effectiveTimeout,
        (delta) => {
          this.emit({ type: "text_delta", delta });
        },
        (controller) => {
          this.activeAbortController = controller;
        },
      );

      this.appendSuccessfulTurn(promptText, result.text);
      this.emit({ type: "session_end", sessionId });

      return {
        output: result.text,
        duration: Date.now() - start,
        success: true,
        exitCode: 0,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const detail = `${message} [endpoint=${endpoint.apiBase} model=${endpoint.model} provider=${endpoint.isAnthropic ? 'anthropic' : endpoint.isAzure ? 'azure' : 'openai'}]`;
      this.emit({ type: "error", message: detail });
      return {
        output: message,
        duration: Date.now() - start,
        success: false,
        exitCode: 1,
      };
    } finally {
      this.isActive = false;
    }
  }

  private emit(event: AgentCoreSessionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  async steer(text: string): Promise<void> {
    this.queuedFollowUps.push(text);
  }

  async followUp(text: string): Promise<void> {
    this.queuedFollowUps.push(text);
  }

  getHistory(): AgentCoreHistoryEntry[] {
    return this.history.map((entry) => ({ ...entry }));
  }

  clearHistory(): void {
    this.history = [];
  }

  subscribe(listener: AgentCoreEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async executeCommand(
    command: string,
    onChunk?: (chunk: string) => void,
  ): Promise<{ output: string; exitCode: number | undefined; cancelled: boolean }> {
    // HERE BE DRAGONS: Shell invocation is duplicated in 5 files. All must use the same flags.
    // See also: agent-core/tools/execution.ts, agent-platform/tools/execution.ts,
    // agent-platform/backgroundProcessRegistry.ts, agent-runtime/backgroundProcessRegistry.ts
    // Use -c (not -lc) to avoid loading login profile, consistent with all other shell invocations
    const shell = process.platform === "win32" ? "cmd.exe" : "/bin/bash";
    const args = process.platform === "win32" ? ["/c", command] : ["-c", command];

    return new Promise((resolve, reject) => {
      const child = childProcess.spawn(shell, args, {
        cwd: this.options.workspace,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const chunks: string[] = [];
      let cancelled = false;

      child.stdout?.on("data", (chunk: Buffer | string) => {
        const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
        chunks.push(text);
        onChunk?.(text);
      });
      child.stderr?.on("data", (chunk: Buffer | string) => {
        const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
        chunks.push(text);
        onChunk?.(text);
      });
      child.on("error", reject);
      child.on("close", (code, signal) => {
        if (signal) {
          cancelled = true;
        }
        resolve({
          output: chunks.join(""),
          exitCode: code ?? undefined,
          cancelled,
        });
      });
    });
  }

  async executeBash(
    command: string,
    onChunk?: (chunk: string) => void,
  ): Promise<{ output: string; exitCode: number | undefined; cancelled: boolean }> {
    return this.executeCommand(command, onChunk);
  }

  async abort(): Promise<void> {
    this.activeAbortController?.abort(new Error("Agent core session aborted"));
  }

  dispose(): void {
    this.activeAbortController?.abort(new Error("Agent core session disposed"));
    this.activeAbortController = undefined;
    this.listeners.clear();
    this.queuedFollowUps = [];
    this.history = [];
  }

  get sessionId(): string | undefined {
    return this.currentSessionId;
  }

  get isStreaming(): boolean {
    return this.isActive;
  }

  private appendSuccessfulTurn(userContent: string, assistantContent: string): void {
    this.history.push({ role: "user", content: userContent });
    this.history.push({ role: "assistant", content: assistantContent });
    this.history = this.limitHistoryByTurns(this.history);
  }

  private trimHistoryForPrompt(): ProviderMessage[] {
    let entries = this.limitHistoryByTurns(this.history);
    entries = this.limitHistoryByTokens(entries);
    return entries.map((entry) => ({ role: entry.role, content: entry.content }));
  }

  private limitHistoryByTurns(entries: AgentCoreHistoryEntry[]): AgentCoreHistoryEntry[] {
    const maxHistoryTurns = this.options.maxHistoryTurns ?? DEFAULT_MAX_HISTORY_TURNS;
    if (maxHistoryTurns <= 0) return [];
    return entries.slice(-maxHistoryTurns);
  }

  private limitHistoryByTokens(entries: AgentCoreHistoryEntry[]): AgentCoreHistoryEntry[] {
    const maxHistoryTokens = this.options.maxHistoryTokens;
    if (maxHistoryTokens === undefined) return entries;
    if (maxHistoryTokens <= 0) return [];

    const selected = entries.slice();
    while (selected.length > 0 && historyTokenCount(selected) > maxHistoryTokens) {
      selected.shift();
      if (selected[0]?.role === "assistant") {
        selected.shift();
      }
    }
    return selected;
  }
}

function historyTokenCount(entries: AgentCoreHistoryEntry[]): number {
  return entries.reduce((total, entry) => total + estimateTokens(entry.content), 0);
}

export function createAgentCoreSession(options?: AgentCoreSessionOptions): AgentCoreSessionHandle {
  return new AgentCoreSessionHandle(options);
}
