import type {
  BreakpointBackend,
  SubmitAnswerParams,
  SubmitBreakpointParams,
  WaitForAnswerOptions,
} from "../backend.js";
import type {
  Breakpoint,
  BreakpointPublicAnswer,
  DecisionMemory,
  ResponderProfile,
} from "../types.js";
import { generateBreakpointId } from "../types.js";

export interface AgentMuxRunOptions {
  agent: string;
  prompt: string | string[];
  model?: string;
  cwd?: string;
  timeout?: number;
  collectEvents?: boolean;
  tags?: string[];
  approvalMode?: "yolo" | "prompt" | "deny";
  nonInteractive?: boolean;
}

export interface AgentMuxRunError {
  readonly code: string;
  readonly message: string;
  readonly stderr: string;
  readonly recoverable: boolean;
}

export interface AgentMuxRunResult {
  readonly runId: string;
  readonly agent: string;
  readonly model: string | undefined;
  readonly sessionId: string | undefined;
  readonly text: string;
  readonly cost: unknown;
  readonly durationMs: number;
  readonly exitCode: number | null;
  readonly signal: string | null;
  readonly exitReason:
    | "completed"
    | "aborted"
    | "interrupted"
    | "timeout"
    | "inactivity"
    | "turn_limit"
    | "crashed"
    | "killed";
  readonly tokenUsage: unknown;
  readonly turnCount: number;
  readonly error: AgentMuxRunError | null;
  readonly events: Array<Record<string, unknown>>;
  readonly tags: string[];
}

export interface AgentMuxRunHandleLike extends PromiseLike<AgentMuxRunResult> {
  readonly runId: string;
  readonly agent: string;
  readonly model: string | undefined;
  catch: Promise<AgentMuxRunResult>["catch"];
  finally: Promise<AgentMuxRunResult>["finally"];
  result(): Promise<AgentMuxRunResult>;
  abort(): Promise<void> | void;
}

export interface AgentMuxClientLike {
  run(options: AgentMuxRunOptions): AgentMuxRunHandleLike;
}

export interface AgentMuxResponderBackendConfig {
  type?: "agent-mux";
  agent: string;
  model?: string;
  cwd?: string;
  timeoutMs?: number;
  collectEvents?: boolean;
  tags?: string[];
  approvalMode?: "yolo" | "prompt" | "deny";
  nonInteractive?: boolean;
  client?: AgentMuxClientLike;
  clientFactory?: () => AgentMuxClientLike | Promise<AgentMuxClientLike>;
}

export class AgentMuxResponderBackendError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(code: string, message: string, cause?: unknown) {
    super(message);
    this.name = "AgentMuxResponderBackendError";
    this.code = code;
    this.cause = cause;
  }
}

export class AgentMuxResponderBackend implements BreakpointBackend {
  readonly name = "agent-mux";

  private readonly breakpoints = new Map<string, Breakpoint>();
  private readonly client?: AgentMuxClientLike;
  private readonly clientFactory?: () => AgentMuxClientLike | Promise<AgentMuxClientLike>;

  constructor(private readonly config: AgentMuxResponderBackendConfig) {
    if (!config.agent) {
      throw new AgentMuxResponderBackendError(
        "CONFIG_ERROR",
        'AgentMuxResponderBackend requires an "agent" config value.',
      );
    }
    this.client = config.client;
    this.clientFactory = config.clientFactory;
  }

  async submitBreakpoint(params: SubmitBreakpointParams): Promise<Breakpoint> {
    const breakpointId = params.routing.breakpointId ?? generateBreakpointId();
    const createdAt = new Date().toISOString();
    const timeoutMs = params.routing.timeoutMs ?? this.config.timeoutMs ?? 30_000;
    const expiresAt = new Date(Date.now() + timeoutMs).toISOString();
    const agent = params.routing.targetResponders[0] ?? this.config.agent;

    const runOptions: AgentMuxRunOptions = {
      agent,
      prompt: this.buildPrompt(params),
      model: this.config.model,
      cwd: this.config.cwd,
      timeout: timeoutMs,
      collectEvents: this.config.collectEvents ?? true,
      tags: [...new Set([...(this.config.tags ?? []), "tasks-mux", "breakpoint", breakpointId])],
      approvalMode: this.config.approvalMode,
      nonInteractive: this.config.nonInteractive ?? true,
    };

    let handle: AgentMuxRunHandleLike;
    try {
      handle = (await this.getClient()).run(runOptions);
    } catch (err) {
      throw this.mapRunStartError(err, agent);
    }

    const result = await this.awaitRunResult(handle, timeoutMs);
    this.assertSuccessfulRun(result);

    const answer = this.createAnswer({
      breakpointId,
      responderId: result.agent || agent,
      responderName: result.agent || agent,
      text: result.text,
      confidence: 100,
      references: this.extractReferences(result),
      now: new Date().toISOString(),
    });

    const breakpoint: Breakpoint = {
      id: breakpointId,
      text: params.text,
      context: {
        ...params.context,
        metadata: {
          ...(params.context.metadata ?? {}),
          agentMux: this.createRunMetadata(result),
        },
      },
      status: "answered",
      routing: params.routing,
      answers: [answer],
      selectedAnswer: answer.id,
      projectId: params.projectId,
      repoId: params.repoId,
      createdAt,
      updatedAt: answer.answeredAt,
      expiresAt,
    };

    this.breakpoints.set(breakpoint.id, breakpoint);
    return breakpoint;
  }

  async getBreakpoint(id: string): Promise<Breakpoint> {
    const breakpoint = this.breakpoints.get(id);
    if (!breakpoint) {
      throw new AgentMuxResponderBackendError("NOT_FOUND", `Breakpoint "${id}" was not found.`);
    }
    return breakpoint;
  }

  async waitForAnswer(id: string, options: WaitForAnswerOptions = {}): Promise<{
    answered: boolean;
    breakpoint: Breakpoint;
    answer?: BreakpointPublicAnswer;
    allAnswers: BreakpointPublicAnswer[];
    resolution?: string;
    elapsedMs: number;
  }> {
    const started = Date.now();
    if (options.signal?.aborted) {
      throw new AgentMuxResponderBackendError("ABORTED", "Waiting for agent-mux answer was aborted.");
    }

    const breakpoint = await this.getBreakpoint(id);
    const answer = breakpoint.selectedAnswer
      ? breakpoint.answers.find((candidate) => candidate.id === breakpoint.selectedAnswer)
      : breakpoint.answers[0];

    return {
      answered: Boolean(answer),
      breakpoint,
      answer,
      allAnswers: breakpoint.answers,
      resolution: answer ? "answered" : breakpoint.status,
      elapsedMs: Date.now() - started,
    };
  }

  async listPendingBreakpoints(responderId?: string): Promise<Breakpoint[]> {
    return [...this.breakpoints.values()].filter((breakpoint) => {
      const pending = breakpoint.status === "pending" || breakpoint.status === "routed" || breakpoint.status === "claimed";
      if (!pending) return false;
      if (!responderId) return true;
      return breakpoint.routing.targetResponders.includes(responderId);
    });
  }

  async answerBreakpoint(id: string, answerParams: SubmitAnswerParams): Promise<BreakpointPublicAnswer> {
    const breakpoint = await this.getBreakpoint(id);
    const answer = this.createAnswer({
      breakpointId: id,
      responderId: answerParams.responderId,
      responderName: answerParams.responderName,
      text: answerParams.text,
      approved: answerParams.approved,
      confidence: answerParams.confidence ?? 100,
      references: answerParams.references ?? [],
      followUpQuestions: answerParams.followUpQuestions ?? [],
      decisionMemory: answerParams.decisionMemory
        ? {
            ...answerParams.decisionMemory,
            savedAt: new Date().toISOString(),
          }
        : undefined,
      now: new Date().toISOString(),
    });

    breakpoint.answers.push(answer);
    breakpoint.selectedAnswer = answer.id;
    breakpoint.status = "answered";
    breakpoint.updatedAt = answer.answeredAt;
    return answer;
  }

  async cancelBreakpoint(id: string): Promise<void> {
    const breakpoint = this.breakpoints.get(id);
    if (!breakpoint) {
      throw new AgentMuxResponderBackendError("NOT_FOUND", `Breakpoint "${id}" was not found.`);
    }
    if (breakpoint.status === "answered" || breakpoint.status === "completed") {
      throw new AgentMuxResponderBackendError(
        "INVALID_STATE",
        `Breakpoint "${id}" has already been answered and cannot be cancelled.`,
      );
    }
    breakpoint.status = "cancelled";
    breakpoint.updatedAt = new Date().toISOString();
  }

  async listResponders(): Promise<ResponderProfile[]> {
    return [
      {
        id: this.config.agent,
        name: this.config.agent,
        title: "Agent mux responder",
        domains: [],
        tags: ["agent-mux", this.config.agent],
        availability: true,
        responseTimeSla: (this.config.timeoutMs ?? 30_000) / 1000,
      },
    ];
  }

  private async getClient(): Promise<AgentMuxClientLike> {
    if (this.client) {
      return this.client;
    }
    if (this.clientFactory) {
      return await this.clientFactory();
    }

    const importModule = new Function("specifier", "return import(specifier)") as (
      specifier: string,
    ) => Promise<{ createClient: (options: Record<string, unknown>) => unknown }>;
    const mod = await importModule("@a5c-ai/agent-mux");
    return mod.createClient({
      defaultAgent: this.config.agent,
      defaultModel: this.config.model,
      approvalMode: this.config.approvalMode,
      timeout: this.config.timeoutMs,
    }) as AgentMuxClientLike;
  }

  private async awaitRunResult(
    handle: AgentMuxRunHandleLike,
    timeoutMs: number,
  ): Promise<AgentMuxRunResult> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        handle.result(),
        new Promise<AgentMuxRunResult>((_, reject) => {
          timer = setTimeout(() => {
            void handle.abort();
            reject(new AgentMuxResponderBackendError(
              "TIMEOUT",
              `Agent-mux run timed out after ${timeoutMs}ms.`,
            ));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private assertSuccessfulRun(result: AgentMuxRunResult): void {
    if (result.exitReason === "completed" && !result.error) {
      return;
    }
    if (result.exitReason === "timeout" || result.exitReason === "inactivity") {
      throw new AgentMuxResponderBackendError(
        "TIMEOUT",
        `Agent-mux run timed out for agent "${result.agent}".`,
      );
    }
    if (result.exitReason === "aborted") {
      throw new AgentMuxResponderBackendError(
        "ABORTED",
        `Agent-mux run was aborted for agent "${result.agent}".`,
      );
    }

    const reason = result.error?.message ?? result.exitReason;
    throw new AgentMuxResponderBackendError(
      result.error?.code ?? "RUN_FAILED",
      `Agent-mux run failed for agent "${result.agent}": ${reason}`,
      result.error,
    );
  }

  private mapRunStartError(err: unknown, agent: string): AgentMuxResponderBackendError {
    const code = typeof err === "object" && err && "code" in err
      ? String((err as { code: unknown }).code)
      : "RUN_START_FAILED";
    const message = err instanceof Error ? err.message : String(err);

    if (code === "UNKNOWN_AGENT" || code === "AGENT_NOT_FOUND" || code === "AGENT_NOT_INSTALLED") {
      return new AgentMuxResponderBackendError(
        code,
        `Agent-mux adapter is not installed or unknown for agent "${agent}": ${message}`,
        err,
      );
    }
    if (code === "AUTH_ERROR") {
      return new AgentMuxResponderBackendError(
        code,
        `Agent-mux authentication failed for agent "${agent}": ${message}`,
        err,
      );
    }
    if (code === "TIMEOUT" || code === "INACTIVITY_TIMEOUT") {
      return new AgentMuxResponderBackendError(
        "TIMEOUT",
        `Agent-mux run timed out for agent "${agent}": ${message}`,
        err,
      );
    }

    return new AgentMuxResponderBackendError(
      code,
      `Agent-mux run could not start for agent "${agent}": ${message}`,
      err,
    );
  }

  private createAnswer(args: {
    breakpointId: string;
    responderId: string;
    responderName: string;
    text: string;
    approved?: boolean;
    confidence: number;
    references: string[];
    followUpQuestions?: string[];
    decisionMemory?: DecisionMemory;
    now: string;
  }): BreakpointPublicAnswer {
    return {
      id: `${args.breakpointId}-answer-${generateBreakpointId()}`,
      breakpointId: args.breakpointId,
      responderId: args.responderId,
      responderName: args.responderName,
      text: args.text,
      approved: args.approved,
      confidence: args.confidence,
      references: args.references,
      followUpQuestions: args.followUpQuestions ?? [],
      decisionMemory: args.decisionMemory,
      answeredAt: args.now,
    };
  }

  private buildPrompt(params: SubmitBreakpointParams): string {
    const sections = [
      params.text,
      "",
      "Context:",
      params.context.markdown ?? params.context.description,
    ];
    if (params.context.fileReferences.length > 0) {
      sections.push("", "Files:", ...params.context.fileReferences.map((file) => `- ${file}`));
    }
    if (params.context.codeSnippets.length > 0) {
      sections.push("", "Code snippets:", JSON.stringify(params.context.codeSnippets, null, 2));
    }
    return sections.join("\n");
  }

  private extractReferences(result: AgentMuxRunResult): string[] {
    const references = new Set<string>();
    for (const event of result.events ?? []) {
      const value = event.reference ?? event.url ?? event.file;
      if (typeof value === "string" && value.length > 0) {
        references.add(value);
      }
    }
    return [...references];
  }

  private createRunMetadata(result: AgentMuxRunResult): Record<string, unknown> {
    return {
      runId: result.runId,
      agent: result.agent,
      model: result.model,
      sessionId: result.sessionId,
      exitReason: result.exitReason,
      durationMs: result.durationMs,
      exitCode: result.exitCode,
      signal: result.signal,
      cost: result.cost,
      tokenUsage: result.tokenUsage,
      turnCount: result.turnCount,
      tags: result.tags,
      costEvents: (result.events ?? [])
        .filter((event) => event.type === "cost" && "cost" in event)
        .map((event) => event.cost),
    };
  }
}
