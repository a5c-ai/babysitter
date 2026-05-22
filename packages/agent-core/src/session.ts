import * as childProcess from "node:child_process";
import type {
  AgentCorePromptResult,
  AgentCoreSessionEvent,
  AgentCoreSessionOptions,
} from "./types";

const DEFAULT_TIMEOUT_MS = 900_000;

export type AgentCoreEventListener = (event: AgentCoreSessionEvent) => void;

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
}

function resolveEndpoint(options: AgentCoreSessionOptions): ResolvedEndpoint {
  const model = options.model ?? "gpt-4o";

  const amuxProvider = process.env["AMUX_PROVIDER"];
  const amuxApiBase = process.env["AMUX_API_BASE"];
  const amuxApiKey = process.env["AMUX_API_KEY"];
  const azureApiKey = process.env["AZURE_API_KEY"];
  const openaiApiKey = process.env["OPENAI_API_KEY"];
  const anthropicApiKey = process.env["ANTHROPIC_API_KEY"];

  if (amuxProvider === "foundry" || amuxProvider === "azure") {
    const apiBase = amuxApiBase ?? "";
    const apiKey = amuxApiKey ?? azureApiKey ?? "";
    return { apiBase: `${apiBase}/openai`, apiKey, model, isAzure: true };
  }

  if (amuxApiBase) {
    const apiKey = amuxApiKey ?? openaiApiKey ?? "";
    return { apiBase: amuxApiBase, apiKey, model, isAzure: false };
  }

  if (openaiApiKey) {
    return { apiBase: "https://api.openai.com/v1", apiKey: openaiApiKey, model, isAzure: false };
  }

  if (anthropicApiKey) {
    return { apiBase: "https://api.anthropic.com", apiKey: anthropicApiKey, model, isAzure: false };
  }

  return { apiBase: "https://api.openai.com/v1", apiKey: amuxApiKey ?? "", model, isAzure: false };
}

async function callCompletionApi(
  endpoint: ResolvedEndpoint,
  messages: Array<{ role: string; content: string }>,
  timeout: number,
): Promise<{ text: string; usage?: { promptTokens: number; completionTokens: number } }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    let url: string;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (endpoint.isAzure) {
      url = `${endpoint.apiBase}/deployments/${endpoint.model}/chat/completions?api-version=2025-04-01-preview`;
      headers["api-key"] = endpoint.apiKey;
    } else {
      url = `${endpoint.apiBase}/chat/completions`;
      headers["Authorization"] = `Bearer ${endpoint.apiKey}`;
    }

    const body = JSON.stringify({
      model: endpoint.model,
      messages,
      max_completion_tokens: 16384,
    });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const text = data.choices?.[0]?.message?.content ?? "";
    const usage = data.usage
      ? { promptTokens: data.usage.prompt_tokens ?? 0, completionTokens: data.usage.completion_tokens ?? 0 }
      : undefined;

    return { text, usage };
  } finally {
    clearTimeout(timer);
  }
}

export class AgentCoreSessionHandle {
  private readonly options: AgentCoreSessionOptions;
  private readonly listeners = new Set<AgentCoreEventListener>();
  private queuedFollowUps: string[] = [];
  private currentSessionId: string | undefined;
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
    const effectiveTimeout = timeout ?? this.options.timeout ?? DEFAULT_TIMEOUT_MS;
    const start = Date.now();

    const followUps = this.queuedFollowUps;
    this.queuedFollowUps = [];
    const promptText = followUps.length > 0
      ? [text, ...followUps.map((item) => `Follow-up instruction:\n${item}`)].join("\n\n")
      : text;

    try {
      const endpoint = resolveEndpoint(this.options);
      const messages: Array<{ role: string; content: string }> = [];

      const systemPrompt = buildSystemPrompt(this.options);
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: promptText });

      const sessionId = this.currentSessionId ?? `agent-core-${Date.now()}`;
      this.currentSessionId = sessionId;

      this.emit({ type: "session_start", sessionId });

      const result = await callCompletionApi(endpoint, messages, effectiveTimeout);

      this.emit({ type: "text_delta", delta: result.text });
      this.emit({ type: "session_end", sessionId });

      return {
        output: result.text,
        duration: Date.now() - start,
        success: true,
        exitCode: 0,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.emit({ type: "error", message });
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
    const shell = process.platform === "win32" ? "cmd.exe" : "/bin/bash";
    const args = process.platform === "win32" ? ["/c", command] : ["-lc", command];

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
    // Direct API calls don't support mid-request abort easily
  }

  dispose(): void {
    this.listeners.clear();
    this.queuedFollowUps = [];
  }

  get sessionId(): string | undefined {
    return this.currentSessionId;
  }

  get isStreaming(): boolean {
    return this.isActive;
  }
}

export function createAgentCoreSession(options?: AgentCoreSessionOptions): AgentCoreSessionHandle {
  return new AgentCoreSessionHandle(options);
}
