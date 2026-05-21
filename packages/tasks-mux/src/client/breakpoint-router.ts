import { generateBreakpointId } from "../types.js";
import type {
  Breakpoint,
  BreakpointContext,
  BreakpointRouting,
  BreakpointStrategy,
} from "../types.js";
import type { BreakpointBackend } from "../backend.js";

/**
 * Options for creating and submitting a breakpoint.
 */
export interface SubmitBreakpointOptions {
  text: string;
  context: BreakpointContext;
  routing: BreakpointRouting;
  projectId?: string;
  repoId?: string;
}

/**
 * Options for routing a breakpoint to responders.
 */
export interface RouteToRespondersOptions {
  strategy: BreakpointStrategy;
  timeoutMs: number;
  presentToUser?: boolean;
}

/**
 * Orchestrates breakpoint creation and routing through a backend.
 */
export class BreakpointRouter {
  private readonly backend: BreakpointBackend;

  constructor(backend: BreakpointBackend) {
    this.backend = backend;
  }

  /**
   * Create and submit a new breakpoint to the backend.
   * Returns the created Breakpoint with its backend-assigned ID.
   */
  async submitBreakpoint(
    text: string,
    context: BreakpointContext,
    routing: BreakpointRouting,
    projectId?: string,
    repoId?: string,
  ): Promise<Breakpoint> {
    return this.backend.submitBreakpoint({ text, context, routing, projectId, repoId });
  }

  /**
   * Set up routing for a breakpoint, targeting specific responders.
   *
   * This is a convenience method that submits a breakpoint with
   * the given responders pre-filled in the routing configuration.
   */
  async routeToResponders(
    breakpointText: string,
    context: BreakpointContext,
    responderIds: string[],
    options: RouteToRespondersOptions,
    projectId?: string,
    repoId?: string,
  ): Promise<Breakpoint> {
    const routing: BreakpointRouting = {
      strategy: options.strategy,
      targetResponders: responderIds,
      timeoutMs: options.timeoutMs,
      presentToUser: options.presentToUser ?? false,
    };

    return this.backend.submitBreakpoint({
      text: breakpointText,
      context,
      routing,
      projectId,
      repoId,
    });
  }

  /**
   * Generate a new unique breakpoint ID (client-side).
   * Useful for pre-generating IDs before submission.
   */
  generateBreakpointId(): string {
    return generateBreakpointId();
  }
}
