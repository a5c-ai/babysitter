import * as childProcess from "node:child_process";
import type {
  AgentCorePromptResult,
  AgentCoreSessionEvent,
  AgentCoreSessionOptions,
} from "./types";

const DEFAULT_TIMEOUT_MS = 900_000;
const DEFAULT_BACKEND = "codex-sdk";

type AgentMuxModule = typeof import("@a5c-ai/agent-mux");
type RunHandle = import("@a5c-ai/agent-mux").RunHandle;

export type AgentCoreEventListener = (event: AgentCoreSessionEvent) => void;

let agentMuxPromise: Promise<AgentMuxModule> | null = null;
let agentMuxClientPromise: Promise<import("@a5c-ai/agent-mux").AgentMuxClient> | null = null;

async function loadAgentMux(): Promise<AgentMuxModule> {
  if (!agentMuxPromise) {
    agentMuxPromise = import("@a5c-ai/agent-mux");
  }
  return agentMuxPromise;
}

async function getAgentMuxClient(): Promise<import("@a5c-ai/agent-mux").AgentMuxClient> {
  if (!agentMuxClientPromise) {
    agentMuxClientPromise = (async () => {
      const agentMux = await loadAgentMux();
      const client = agentMux.createClient({
        approvalMode: "prompt",
        stream: true,
      });
      agentMux.registerBuiltInAdapters(client);
      return client;
    })();
  }
  return agentMuxClientPromise;
}

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

function mapEventPayload(event: unknown): AgentCoreSessionEvent {
  if (!event || typeof event !== "object") {
    return { type: "unknown", value: event };
  }
  const typed = event as Record<string, unknown>;
  return {
    type: typeof typed.type === "string" ? typed.type : "unknown",
    ...typed,
  };
}

export class AgentCoreSessionHandle {
  private readonly options: AgentCoreSessionOptions;
  private readonly listeners = new Set<AgentCoreEventListener>();
  private activeHandle: RunHandle | null = null;
  private queuedFollowUps: string[] = [];
  private currentSessionId: string | undefined;

  constructor(options: AgentCoreSessionOptions = {}) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    return;
  }

  async prompt(text: string, timeout?: number): Promise<AgentCorePromptResult> {
    if (this.activeHandle) {
      throw new Error("Agent core session is already processing a prompt");
    }

    const agentMux = await loadAgentMux();
    const client = await getAgentMuxClient();
    const effectiveTimeout = timeout ?? this.options.timeout ?? DEFAULT_TIMEOUT_MS;
    const backend = this.options.backend ?? process.env.AGENT_CORE_BACKEND ?? DEFAULT_BACKEND;
    const start = Date.now();

    const followUps = this.queuedFollowUps;
    this.queuedFollowUps = [];
    const promptText = followUps.length > 0
      ? [text, ...followUps.map((item) => `Follow-up instruction:\n${item}`)].join("\n\n")
      : text;

    const handle = client.run({
      agent: backend as import("@a5c-ai/agent-mux").AgentName,
      prompt: promptText,
      cwd: this.options.workspace,
      model: this.options.model,
      timeout: effectiveTimeout,
      sessionId: this.currentSessionId,
      systemPrompt: buildSystemPrompt(this.options),
      systemPromptMode: this.options.systemPrompt ? "replace" : "append",
      approvalMode: this.options.uiContext ? "prompt" : "yolo",
      collectEvents: true,
    });

    this.activeHandle = handle;
    const pump = (async () => {
      for await (const event of handle) {
        const mapped = mapEventPayload(event);
        if (mapped.type === "session_start" && typeof mapped.sessionId === "string") {
          this.currentSessionId = mapped.sessionId;
        }
        for (const listener of this.listeners) {
          listener(mapped);
        }
      }
    })();

    const result = await handle;
    await pump;
    this.activeHandle = null;

    if (result.sessionId) {
      this.currentSessionId = result.sessionId;
    }

    const output = result.text || result.error?.message || "";
    return {
      output,
      duration: Date.now() - start,
      success: result.exitReason === "completed" && !result.error,
      exitCode: result.exitCode ?? (result.error ? 1 : 0),
    };
  }

  async steer(text: string): Promise<void> {
    if (!this.activeHandle) {
      this.queuedFollowUps.push(text);
      return;
    }
    await this.activeHandle.send(text);
  }

  async followUp(text: string): Promise<void> {
    if (!this.activeHandle) {
      this.queuedFollowUps.push(text);
      return;
    }
    await this.activeHandle.queue(text, { when: "after-response" });
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
    if (this.activeHandle) {
      await this.activeHandle.abort();
    }
  }

  dispose(): void {
    if (this.activeHandle) {
      void this.activeHandle.abort().catch(() => undefined);
      this.activeHandle = null;
    }
    this.listeners.clear();
    this.queuedFollowUps = [];
  }

  get sessionId(): string | undefined {
    return this.currentSessionId;
  }

  get isStreaming(): boolean {
    return this.activeHandle !== null;
  }
}

export function createAgentCoreSession(options?: AgentCoreSessionOptions): AgentCoreSessionHandle {
  return new AgentCoreSessionHandle(options);
}
