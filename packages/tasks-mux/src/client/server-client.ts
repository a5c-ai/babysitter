import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointBrowserSession,
  BreakpointSessionView,
  ResponderProfile,
} from "../types.js";

/**
 * Error thrown when the server returns a non-OK response.
 */
export class ServerError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: string,
  ) {
    super(`Server responded with ${status} ${statusText}`);
    this.name = "ServerError";
  }
}

/**
 * Lightweight wrapper around an SSE connection using fetch + ReadableStream.
 * Provides an EventSource-like interface without requiring the EventSource API.
 */
export interface SSEStream {
  /** Register a handler for a named event type. */
  on(event: string, handler: (data: string) => void): void;
  /** Register a handler for errors. */
  onError(handler: (error: Error) => void): void;
  /** Close the underlying connection. */
  close(): void;
}

export interface ServerClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

export const DEFAULT_BMUX_SERVER_URL = "https://tasks-mux.a5c.ai/api/v1";

/**
 * API path helpers for the tasks-mux server.
 */
const API_PATHS = {
  BREAKPOINTS: "/breakpoints",
  BREAKPOINT_BY_ID: (id: string) => `/breakpoints/${id}`,
  BREAKPOINT_EVENTS: (id: string) => `/breakpoints/${id}/events`,
  BREAKPOINT_ANSWERS: (id: string) => `/breakpoints/${id}/answers`,
  BREAKPOINT_BROWSER_SESSION: (id: string) => `/breakpoints/${id}/browser-session`,
  BREAKPOINT_SESSION: (authToken: string) => `/breakpoints/session/${authToken}`,
  BREAKPOINT_SESSION_ANSWER: (authToken: string) => `/breakpoints/session/${authToken}/answer`,
  RESPONDERS: "/responders",
  RESPONDER_BY_ID: (id: string) => `/responders/${id}`,
  HEALTH: "/health",
} as const;

/**
 * HTTP client for communicating with the Breakpoints Mux server.
 */
export class ServerClient {
  public readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: string | ServerClientOptions = DEFAULT_BMUX_SERVER_URL) {
    const baseUrl = typeof options === "string"
      ? options
      : options.baseUrl ?? DEFAULT_BMUX_SERVER_URL;
    // Strip trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.defaultHeaders = typeof options === "string" ? {} : { ...(options.defaultHeaders ?? {}) };
  }

  // -- Breakpoints ------------------------------------------------------------

  /**
   * Submit a new breakpoint to the server.
   */
  async submitBreakpoint(breakpoint: {
    text: string;
    context: Breakpoint["context"];
    routing: Breakpoint["routing"];
    projectId: string;
    repoId: string;
  }): Promise<Breakpoint> {
    return this.post<Breakpoint>(API_PATHS.BREAKPOINTS, breakpoint);
  }

  /**
   * Retrieve a breakpoint by its ID.
   */
  async getBreakpoint(breakpointId: string): Promise<Breakpoint> {
    return this.get<Breakpoint>(API_PATHS.BREAKPOINT_BY_ID(breakpointId));
  }

  async createBrowserSession(
    breakpointId: string,
    options?: {
      mode?: "same-user" | "responder";
      responderId?: string;
      responderName?: string;
    },
  ): Promise<BreakpointBrowserSession> {
    return this.post<BreakpointBrowserSession>(API_PATHS.BREAKPOINT_BROWSER_SESSION(breakpointId), {
      mode: options?.mode ?? "same-user",
      responderId: options?.responderId,
      responderName: options?.responderName,
    });
  }

  async getBreakpointSession(authToken: string): Promise<BreakpointSessionView> {
    return this.get<BreakpointSessionView>(API_PATHS.BREAKPOINT_SESSION(authToken));
  }

  async submitSessionAnswer(
    authToken: string,
    answer: {
      text: string;
      confidence?: number;
      references?: string[];
      followUpQuestions?: string[];
      decisionMemory?: { applicabilityContext: string; reasoning: string };
    },
  ): Promise<BreakpointAnswer> {
    return this.post<BreakpointAnswer>(API_PATHS.BREAKPOINT_SESSION_ANSWER(authToken), answer);
  }

  /**
   * Open an SSE stream for real-time updates on a breakpoint.
   */
  getBreakpointStream(breakpointId: string, signal?: AbortSignal): SSEStream {
    const url = this.resolveUrl(API_PATHS.BREAKPOINT_EVENTS(breakpointId));
    const handlers = new Map<string, Array<(data: string) => void>>();
    let errorHandler: ((error: Error) => void) | undefined;
    let aborted = false;

    const controller = new AbortController();
    // If a parent signal is provided, forward its abort.
    if (signal) {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    // Start reading in background
    void (async () => {
      try {
        const response = await fetch(url, {
          headers: { ...this.defaultHeaders, Accept: "text/event-stream" },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new ServerError(response.status, response.statusText);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "message";
        let currentData = "";

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value as Uint8Array, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              currentData += (currentData ? "\n" : "") + line.slice(5).trim();
            } else if (line === "") {
              // Empty line = dispatch event
              if (currentData) {
                const eventHandlers = handlers.get(currentEvent);
                if (eventHandlers) {
                  for (const h of eventHandlers) {
                    h(currentData);
                  }
                }
              }
              currentEvent = "message";
              currentData = "";
            }
          }
        }
      } catch (err: unknown) {
        if (aborted) return;
        if (err instanceof Error && err.name === "AbortError") return;
        if (errorHandler && err instanceof Error) {
          errorHandler(err);
        }
      }
    })();

    return {
      on(event: string, handler: (data: string) => void) {
        const list = handlers.get(event) ?? [];
        list.push(handler);
        handlers.set(event, list);
      },
      onError(handler: (error: Error) => void) {
        errorHandler = handler;
      },
      close() {
        aborted = true;
        controller.abort();
      },
    };
  }

  // -- Responders -------------------------------------------------------------

  /**
   * List responder profiles, optionally scoped to a project or repo.
   */
  async listResponders(filters?: { projectId?: string; repoId?: string }): Promise<ResponderProfile[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set("projectId", filters.projectId);
    if (filters?.repoId) params.set("repoId", filters.repoId);
    const qs = params.toString();
    return this.get<ResponderProfile[]>(`${API_PATHS.RESPONDERS}${qs ? `?${qs}` : ""}`);
  }

  /**
   * List pending breakpoints for a specific responder.
   */
  async listPendingBreakpoints(
    responderId: string,
    filters?: { projectId?: string; repoId?: string; status?: string },
  ): Promise<Breakpoint[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set("projectId", filters.projectId);
    if (filters?.repoId) params.set("repoId", filters.repoId);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    const path = `${API_PATHS.RESPONDER_BY_ID(responderId)}/breakpoints${qs ? `?${qs}` : ""}`;
    return this.get<Breakpoint[]>(path);
  }

  /**
   * Claim a breakpoint as a responder.
   */
  async claimBreakpoint(breakpointId: string, responderId: string): Promise<Breakpoint> {
    const path = `${API_PATHS.BREAKPOINT_BY_ID(breakpointId)}/claim`;
    return this.post<Breakpoint>(path, { responderId });
  }

  /**
   * Submit an answer for a breakpoint.
   */
  async submitAnswer(
    breakpointId: string,
    answer: {
      responderId: string;
      responderName: string;
      text: string;
      confidence?: number;
      references?: string[];
      followUpQuestions?: string[];
      decisionMemory?: { applicabilityContext: string; reasoning: string };
    },
  ): Promise<BreakpointAnswer> {
    return this.post<BreakpointAnswer>(API_PATHS.BREAKPOINT_ANSWERS(breakpointId), answer);
  }

  /**
   * Cancel (delete) a breakpoint.
   */
  async cancelBreakpoint(breakpointId: string): Promise<void> {
    const path = API_PATHS.BREAKPOINT_BY_ID(breakpointId);
    await this.delete(path);
  }

  // -- Health -----------------------------------------------------------------

  /**
   * Check server health.
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.get<{ status: string }>(API_PATHS.HEALTH);
  }

  // -- HTTP helpers -----------------------------------------------------------

  /** @internal Exposed for composition by AuthClient. */
  async get<T>(path: string, extraHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: "GET" }, extraHeaders);
  }

  /** @internal Exposed for composition by AuthClient. */
  async post<T>(path: string, body: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, extraHeaders);
  }

  /** @internal Exposed for composition by AuthClient. */
  async put<T>(path: string, body: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, extraHeaders);
  }

  /** @internal Exposed for composition by AuthClient. */
  async delete<T>(path: string, extraHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: "DELETE" }, extraHeaders);
  }

  private async request<T>(path: string, init: RequestInit, extraHeaders?: Record<string, string>): Promise<T> {
    const url = this.resolveUrl(path);
    const mergedHeaders = {
      ...this.defaultHeaders,
      ...(init.headers as Record<string, string> | undefined),
      ...extraHeaders,
    };

    const response = await fetch(url, {
      ...init,
      headers: mergedHeaders,
    });
    if (!response.ok) {
      const body = await response.text().catch(() => undefined);
      throw new ServerError(response.status, response.statusText, body);
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  protected resolveUrl(path: string): string {
    // path already includes /api/v1 prefix from API_PATHS,
    // and baseUrl already includes /api/v1. Strip the prefix from path
    // to avoid duplication.
    const apiPrefix = "/api/v1";
    const relativePath = path.startsWith(apiPrefix)
      ? path.slice(apiPrefix.length)
      : path;
    return `${this.baseUrl}${relativePath}`;
  }
}
