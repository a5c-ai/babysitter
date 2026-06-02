/**
 * ServerBreakpointBackend -- BreakpointBackend implementation backed by the
 * breakpoints-pro HTTP server.
 *
 * Bridges tasks-mux naming (Breakpoint / Responder) to the server's
 * internal naming (Question / Expert) by translating HTTP payloads.
 * Communicates exclusively via fetch(), so it can run in any environment.
 */

import type {
  BreakpointBackend,
  BreakpointBackendCapabilities,
  SubmitBreakpointParams,
  WaitForAnswerOptions,
  SubmitAnswerParams,
  ListRespondersParams,
} from "../backend.js";
import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointContext,
  BreakpointWaitResult,
  ResponderProfile,
} from "../types.js";
import { BreakpointSchema, DEFAULT_POLL_INTERVAL_MS, DEFAULT_TIMEOUT_MS } from "../types.js";
import {
  unsupportedBackendFeatureMessage as unsupportedFeatureMessage,
  unsupportedBreakpointBackendCapabilities,
} from "../backend.js";

const API_BASE_PATH = "/api/v1";

// ── Config ──────────────────────────────────────────────────────────────

export interface ServerBreakpointBackendConfig {
  serverUrl: string;
  authToken?: string;
  projectId?: string;
  repoId?: string;
}

// ── Error ───────────────────────────────────────────────────────────────

export class ServerBackendError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "ServerBackendError";
  }
}

// ── Server-side shape types (Question / Expert naming) ──────────────────

interface ServerQuestion {
  id: string;
  slug?: string;
  text: string;
  context: Record<string, unknown>;
  status: string;
  routing: {
    strategy: string;
    targetExperts: string[];
    timeoutMs: number;
    presentToUser: boolean;
  };
  answers: ServerAnswer[];
  selectedAnswer?: string;
  projectId?: string;
  repoId?: string;
  createdBy?: {
    sub: string;
    login: string;
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  claimedByExpertId?: string;
  claimedByExpertName?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface ServerAnswer {
  id: string;
  questionId: string;
  expertId: string;
  expertName: string;
  text: string;
  confidence: number;
  references: string[];
  followUpQuestions: string[];
  answeredAt: string;
  approved?: boolean;
  rating?: {
    helpful: boolean;
    comment?: string;
    ratedAt: string;
  };
  decisionMemory?: {
    applicabilityContext: string;
    reasoning: string;
    enrichedContext?: string;
    savedAt: string;
  };
}

interface ServerExpertProfile {
  id: string;
  name: string;
  title: string;
  expertiseAreas: Array<{
    domain: string;
    topics: string[];
    keywords: string[];
    proficiency: number;
  }>;
  availability: boolean;
  sessionConfig?: Record<string, unknown>;
  responseTimeSla: number;
}

// ── Mapping helpers ─────────────────────────────────────────────────────

function mapServerAnswerToBreakpointAnswer(answer: ServerAnswer): BreakpointAnswer {
  return {
    id: answer.id,
    breakpointId: answer.questionId,
    responderId: answer.expertId,
    responderName: answer.expertName,
    text: answer.text,
    confidence: answer.confidence,
    references: answer.references,
    followUpQuestions: answer.followUpQuestions,
    answeredAt: answer.answeredAt,
    approved: answer.approved,
    rating: answer.rating,
    decisionMemory: answer.decisionMemory,
  };
}

function mapServerQuestionToBreakpoint(question: ServerQuestion): Breakpoint {
  const context = question.context as unknown as BreakpointContext;

  return BreakpointSchema.parse({
    id: question.id,
    text: question.text,
    context,
    status: question.status as Breakpoint["status"],
    routing: {
      strategy: question.routing.strategy as Breakpoint["routing"]["strategy"],
      targetResponders: question.routing.targetExperts,
      timeoutMs: question.routing.timeoutMs,
      presentToUser: question.routing.presentToUser,
    },
    answers: question.answers.map(mapServerAnswerToBreakpointAnswer),
    selectedAnswer: question.selectedAnswer,
    projectId: question.projectId,
    repoId: question.repoId,
    createdBy: question.createdBy,
    claimedByResponderId: question.claimedByExpertId,
    claimedByResponderName: question.claimedByExpertName,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    expiresAt: question.expiresAt,
  });
}

function mapExpertProfileToResponderProfile(expert: ServerExpertProfile): ResponderProfile {
  const allDomains = expert.expertiseAreas.map((area) => area.domain);
  const allTags = expert.expertiseAreas.flatMap((area) => [...area.topics, ...area.keywords]);

  return {
    id: expert.id,
    name: expert.name,
    title: expert.title,
    domains: allDomains,
    tags: allTags,
    availability: expert.availability,
    responseTimeSla: expert.responseTimeSla,
  };
}

// ── Backend implementation ──────────────────────────────────────────────

export class ServerBreakpointBackend implements BreakpointBackend {
  readonly name = "server";

  private serverUrl: string;
  private authToken: string | undefined;
  private projectId: string | undefined;
  private repoId: string | undefined;

  constructor(config: ServerBreakpointBackendConfig) {
    this.serverUrl = config.serverUrl.replace(/\/+$/, "");
    this.authToken = config.authToken;
    this.projectId = config.projectId;
    this.repoId = config.repoId;
  }

  capabilities(): BreakpointBackendCapabilities {
    return {
      ...unsupportedBreakpointBackendCapabilities,
      assignment: true,
    };
  }

  private buildUrl(path: string, params?: Record<string, string | undefined>): string {
    const url = new URL(`${this.serverUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | undefined>;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const response = await fetch(url, {
      method,
      headers: this.buildHeaders(),
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    });

    if (!response.ok) {
      let responseBody: unknown;
      try {
        responseBody = await response.json();
      } catch (e) {
        process.stderr.write(`[tasks-mux] response body read failed: ${e instanceof Error ? e.message : String(e)}\n`);
        responseBody = await response.text().catch(() => undefined);
      }
      throw new ServerBackendError(
        `Server responded with ${response.status}: ${(responseBody as { error?: string })?.error ?? response.statusText}`,
        response.status,
        responseBody,
      );
    }

    return await response.json() as T;
  }

  async submitBreakpoint(params: SubmitBreakpointParams): Promise<Breakpoint> {
    if (params.proven) {
      throw new ServerBackendError(
        unsupportedFeatureMessage(this.name, "ask_breakpoint.proven"),
        400,
      );
    }

    const projectId = params.projectId ?? this.projectId;
    const repoId = params.repoId ?? this.repoId;

    if (!projectId) {
      throw new ServerBackendError("projectId is required for server backend", 400);
    }
    if (!repoId) {
      throw new ServerBackendError("repoId is required for server backend", 400);
    }

    const body = {
      text: params.text,
      context: params.context,
      routing: {
        strategy: params.routing.strategy,
        targetExperts: params.routing.targetResponders,
        timeoutMs: params.routing.timeoutMs,
        presentToUser: params.routing.presentToUser,
      },
      projectId,
      repoId,
    };

    const question = await this.request<ServerQuestion>(
      "POST",
      `${API_BASE_PATH}/questions`,
      { body },
    );

    return mapServerQuestionToBreakpoint(question);
  }

  async getBreakpoint(id: string): Promise<Breakpoint> {
    const question = await this.request<ServerQuestion>(
      "GET",
      `${API_BASE_PATH}/questions/${encodeURIComponent(id)}`,
    );

    return mapServerQuestionToBreakpoint(question);
  }

  async waitForAnswer(id: string, options?: WaitForAnswerOptions): Promise<BreakpointWaitResult> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const startTime = Date.now();

    const TIMEOUT_SENTINEL = Symbol("timeout");

    const abortController = new AbortController();
    const externalSignal = options?.signal;

    if (externalSignal) {
      if (externalSignal.aborted) {
        abortController.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener("abort", () => {
          abortController.abort(externalSignal.reason);
        }, { once: true });
      }
    }

    const timeoutId = setTimeout(() => {
      abortController.abort(TIMEOUT_SENTINEL);
    }, timeoutMs);

    try {
      while (!abortController.signal.aborted) {
        const breakpoint = await this.getBreakpoint(id);
        const elapsedMs = Date.now() - startTime;

        if (breakpoint.answers.length > 0) {
          const selectedAnswer = breakpoint.selectedAnswer
            ? breakpoint.answers.find((a) => a.id === breakpoint.selectedAnswer)
            : breakpoint.answers[0];

          return {
            answered: true,
            breakpoint,
            answer: selectedAnswer,
            allAnswers: breakpoint.answers,
            resolution: "answered",
            elapsedMs,
          };
        }

        if (breakpoint.status === "cancelled" || breakpoint.status === "expired") {
          return {
            answered: false,
            breakpoint,
            allAnswers: [],
            resolution: breakpoint.status,
            elapsedMs,
          };
        }

        const aborted = await new Promise<boolean>((resolve) => {
          const pollTimeout = setTimeout(() => resolve(false), pollIntervalMs);
          if (abortController.signal.aborted) {
            clearTimeout(pollTimeout);
            resolve(true);
            return;
          }
          abortController.signal.addEventListener("abort", () => {
            clearTimeout(pollTimeout);
            resolve(true);
          }, { once: true });
        });

        if (aborted) break;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const breakpoint = await this.getBreakpoint(id);
    const isTimeout = abortController.signal.reason === TIMEOUT_SENTINEL;

    return {
      answered: false,
      breakpoint,
      allAnswers: breakpoint.answers,
      resolution: isTimeout ? "timeout" : "aborted",
      elapsedMs: Date.now() - startTime,
    };
  }

  async listPendingBreakpoints(responderId?: string): Promise<Breakpoint[]> {
    if (!this.projectId) {
      throw new ServerBackendError("projectId is required to list pending breakpoints", 400);
    }

    if (responderId) {
      const questions = await this.request<ServerQuestion[]>(
        "GET",
        `${API_BASE_PATH}/experts/${encodeURIComponent(responderId)}/questions`,
        {
          params: {
            status: "routed",
            projectId: this.projectId,
            repoId: this.repoId,
          },
        },
      );
      return questions.map(mapServerQuestionToBreakpoint);
    }

    const questions = await this.request<ServerQuestion[]>(
      "GET",
      `${API_BASE_PATH}/questions`,
      {
        params: {
          status: "pending",
          projectId: this.projectId,
          repoId: this.repoId,
        },
      },
    );
    return questions.map(mapServerQuestionToBreakpoint);
  }

  async answerBreakpoint(id: string, answer: SubmitAnswerParams): Promise<BreakpointAnswer> {
    if (answer.sign || answer.keyFingerprint) {
      throw new ServerBackendError(
        unsupportedFeatureMessage(this.name, "answer signing"),
        400,
      );
    }

    const body = {
      expertId: answer.responderId,
      expertName: answer.responderName,
      text: answer.text,
      approved: answer.approved,
      confidence: answer.confidence ?? 80,
      references: answer.references ?? [],
      followUpQuestions: answer.followUpQuestions ?? [],
      decisionMemory: answer.decisionMemory,
    };

    const serverAnswer = await this.request<ServerAnswer>(
      "POST",
      `${API_BASE_PATH}/questions/${encodeURIComponent(id)}/answers`,
      { body },
    );

    return mapServerAnswerToBreakpointAnswer(serverAnswer);
  }

  async cancelBreakpoint(id: string): Promise<void> {
    await this.request<ServerQuestion>(
      "DELETE",
      `${API_BASE_PATH}/questions/${encodeURIComponent(id)}`,
    );
  }

  async listResponders(params?: ListRespondersParams): Promise<ResponderProfile[]> {
    const projectId = params?.projectId ?? this.projectId;
    const repoId = params?.repoId ?? this.repoId;

    const experts = await this.request<ServerExpertProfile[]>(
      "GET",
      `${API_BASE_PATH}/experts`,
      {
        params: {
          projectId,
          repoId,
        },
      },
    );

    return experts.map(mapExpertProfileToResponderProfile);
  }

  async claimBreakpoint(id: string, responderId: string): Promise<Breakpoint> {
    const body = {
      expertId: responderId,
    };

    const question = await this.request<ServerQuestion>(
      "POST",
      `${API_BASE_PATH}/questions/${encodeURIComponent(id)}/claim`,
      { body },
    );

    return mapServerQuestionToBreakpoint(question);
  }
}
