import type { BreakpointBackend } from "../backend.js";
import type {
  BreakpointContext,
  BreakpointRouting,
  InteractionKind,
} from "../types.js";
import type { RoutingConfig, RoutingRule } from "../types.js";

/**
 * Options for configuring the interaction provider.
 */
export interface BreakpointMuxProviderOptions {
  /** The default backend to use when no routing rule matches. */
  defaultBackend: BreakpointBackend;
  /** Additional backends available for routing. Keyed by backend name. */
  backends?: Record<string, BreakpointBackend>;
  /** Routing configuration for domain/tag-based backend selection. */
  routingConfig?: RoutingConfig;
  /** Default timeout in ms. */
  defaultTimeoutMs?: number;
}

/**
 * Maps a babysitter ProcessContext.breakpoint() call to a breakpoints-mux
 * backend call, handling routing, context assembly, and result mapping.
 */
export class BreakpointMuxInteractionProvider {
  private defaultBackend: BreakpointBackend;
  private backends: Record<string, BreakpointBackend>;
  private routingConfig?: RoutingConfig;
  private defaultTimeoutMs: number;

  constructor(options: BreakpointMuxProviderOptions) {
    this.defaultBackend = options.defaultBackend;
    this.backends = {
      [options.defaultBackend.name]: options.defaultBackend,
      ...(options.backends ?? {}),
    };
    this.routingConfig = options.routingConfig;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 30 * 60 * 1000;
  }

  /**
   * Route a breakpoint through the appropriate backend.
   *
   * This method is called from the babysitter harness when a process
   * invokes `ctx.breakpoint(payload, options)`.
   *
   * @param payload - The breakpoint payload from the process context.
   * @param options - Breakpoint routing options from the process context.
   * @returns A BreakpointResult compatible with babysitter's ProcessContext.
   */
  async handleBreakpoint(
    payload: unknown,
    options: {
      label?: string;
      expert?: string | string[];
      tags?: string[];
      strategy?: string;
      breakpointId?: string;
      autoApproveAfterN?: number;
      presentAlwaysApprove?: boolean;
      interactionKind?: InteractionKind;
      domain?: string;
      timeoutMs?: number;
    },
  ): Promise<{
    approved: boolean;
    response?: string;
    feedback?: string;
    respondedBy?: string;
  }> {
    // 1. Resolve backend via routing rules
    const backend = this.resolveBackend(options.domain, options.tags);

    // 2. Build BreakpointContext from payload and options
    const context = this.buildContext(payload, options);

    // 3. Build BreakpointRouting
    const responders = Array.isArray(options.expert)
      ? options.expert
      : options.expert
        ? [options.expert]
        : [];

    const routing: BreakpointRouting = {
      strategy: (options.strategy as BreakpointRouting["strategy"]) ?? "first-response-wins",
      targetResponders: responders,
      timeoutMs: options.timeoutMs ?? this.defaultTimeoutMs,
      presentToUser: options.presentAlwaysApprove ?? true,
      breakpointId: options.breakpointId,
      autoApproveAfterN: options.autoApproveAfterN,
    };

    // 4. Submit and wait
    const breakpoint = await backend.submitBreakpoint({
      text: options.label ?? this.extractTextFromPayload(payload),
      context,
      routing,
    });

    const result = await backend.waitForAnswer(breakpoint.id, {
      timeoutMs: routing.timeoutMs,
    });

    // 5. Map to babysitter BreakpointResult shape
    return {
      approved: result.answer?.approved ?? result.answered,
      response: result.answer?.text,
      feedback: result.answer?.text,
      respondedBy: result.answer?.responderName,
    };
  }

  /**
   * Resolve the backend using routing configuration.
   */
  private resolveBackend(domain?: string, tags?: string[]): BreakpointBackend {
    if (!this.routingConfig) return this.defaultBackend;

    for (const rule of this.routingConfig.routes) {
      if (this.matchesRule(rule, domain, tags)) {
        const backend = this.backends[rule.backend];
        if (backend) return backend;
      }
    }

    return this.defaultBackend;
  }

  /**
   * Check if a routing rule matches the given domain and tags.
   */
  private matchesRule(
    rule: RoutingRule,
    domain?: string,
    tags?: string[],
  ): boolean {
    if (rule.domains && domain) {
      if (rule.domains.includes(domain)) return true;
    }
    if (rule.tags && tags && tags.length > 0) {
      if (rule.tags.some((t) => tags.includes(t))) return true;
    }
    return false;
  }

  /**
   * Build a BreakpointContext from the process payload and options.
   */
  private buildContext(
    payload: unknown,
    options: { label?: string; tags?: string[]; domain?: string; interactionKind?: InteractionKind },
  ): BreakpointContext {
    const description = typeof payload === "string"
      ? payload
      : JSON.stringify(payload, null, 2);

    return {
      description,
      codeSnippets: [],
      fileReferences: [],
      tags: options.tags ?? [],
      domain: options.domain,
      interactionKind: options.interactionKind,
    };
  }

  /**
   * Extract a text summary from an arbitrary payload.
   */
  private extractTextFromPayload(payload: unknown): string {
    if (typeof payload === "string") return payload;
    if (payload && typeof payload === "object" && "question" in payload) {
      return String((payload as Record<string, unknown>).question);
    }
    if (payload && typeof payload === "object" && "text" in payload) {
      return String((payload as Record<string, unknown>).text);
    }
    return "Breakpoint requires human input";
  }
}
