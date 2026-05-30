import type { BreakpointBackend } from "../backend.js";
import type {
  BreakpointContext,
  BackendConfig,
  RoutingConfig,
  GitHubIssuesBackendConfig,
  ExternalTrackerBackendConfig,
  AgentMuxBackendConfig,
} from "../types.js";
import { GitNativeBackend } from "./git-native.js";
import type { GitNativeBackendOptions } from "./git-native.js";
import { GitHubIssuesBackend } from "./github-issues.js";
import { ExternalTrackerBackend } from "./external-tracker.js";
import { ServerBreakpointBackend } from "./server.js";
import type { ServerBreakpointBackendConfig } from "./server.js";
import { AgentMuxResponderBackend } from "./agent-mux.js";
import type { AgentMuxResponderBackendConfig } from "./agent-mux.js";
export { ServerBreakpointBackend, ServerBackendError } from "./server.js";
export type { ServerBreakpointBackendConfig } from "./server.js";
export {
  ExternalTrackerBackend,
  GenericRestTrackerAdapter,
  JiraTrackerAdapter,
  LinearTrackerAdapter,
  createExternalTrackerAdapter,
  redactExternalTrackerSecrets,
} from "./external-tracker.js";
export type {
  ExternalTrackerAdapter,
  ExternalTrackerComment,
  ExternalTrackerCreateIssueInput,
  ExternalTrackerIssue,
  ExternalTrackerReference,
  ExternalTrackerWebhookEvent,
  ExternalTrackerWebhookResult,
} from "./external-tracker.js";
export {
  AgentMuxResponderBackend,
  AgentMuxResponderBackendError,
} from "./agent-mux.js";
export type {
  AgentMuxClientLike,
  AgentMuxResponderBackendConfig,
  AgentMuxRunHandleLike,
  AgentMuxRunOptions,
  AgentMuxRunResult,
} from "./agent-mux.js";

/**
 * Factory function type for creating backends from config.
 */
export type BackendFactory = (config: Record<string, unknown>) => BreakpointBackend;

/**
 * Registry of backend factories.
 */
const backendFactories = new Map<string, BackendFactory>();

// Register the built-in git-native backend
backendFactories.set("git-native", (config) => {
  return new GitNativeBackend(config as GitNativeBackendOptions);
});

// Register the GitHub Issues backend
backendFactories.set("github-issues", (config) => {
  return new GitHubIssuesBackend(config as GitHubIssuesBackendConfig);
});

// Register the provider-neutral external tracker backend
backendFactories.set("external-tracker", (config) => {
  return new ExternalTrackerBackend(config as ExternalTrackerBackendConfig);
});

// Register the agent-mux responder backend
backendFactories.set("agent-mux", (config) => {
  return new AgentMuxResponderBackend(config as unknown as AgentMuxResponderBackendConfig & AgentMuxBackendConfig);
});

// Register the breakpoints-pro server backend
backendFactories.set("server", (config) => {
  const serverUrl = (config.url as string | undefined)
    ?? (config.serverUrl as string | undefined);
  if (!serverUrl) {
    throw new Error(
      'Server backend requires a "url" or "serverUrl" property in config. ' +
      'Example: { type: "server", url: "http://localhost:3847" }',
    );
  }
  return new ServerBreakpointBackend({
    serverUrl,
    authToken: config.authToken as string | undefined,
    projectId: config.projectId as string | undefined,
    repoId: config.repoId as string | undefined,
  } satisfies ServerBreakpointBackendConfig);
});

/**
 * Required method names on the BreakpointBackend interface.
 * Used for runtime validation that factory-produced objects conform to the contract.
 */
const REQUIRED_BACKEND_METHODS: readonly string[] = [
  "submitBreakpoint",
  "getBreakpoint",
  "waitForAnswer",
  "listPendingBreakpoints",
  "answerBreakpoint",
  "cancelBreakpoint",
] as const;

/**
 * Validate that an object conforms to the BreakpointBackend interface at runtime.
 * Checks for the `name` property and all required methods.
 * Throws a descriptive error if validation fails.
 */
function validateBackendConformance(backend: unknown, type: string): asserts backend is BreakpointBackend {
  if (backend === null || backend === undefined || typeof backend !== "object") {
    throw new Error(
      `Backend factory for "${type}" returned ${backend === null ? "null" : typeof backend} ` +
      `instead of a BreakpointBackend-conforming object.`,
    );
  }

  const obj = backend as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.length === 0) {
    throw new Error(
      `Backend factory for "${type}" returned an object without a valid "name" property. ` +
      `BreakpointBackend requires a non-empty readonly name string.`,
    );
  }

  const missingMethods: string[] = [];
  for (const method of REQUIRED_BACKEND_METHODS) {
    if (typeof obj[method] !== "function") {
      missingMethods.push(method);
    }
  }

  if (missingMethods.length > 0) {
    throw new Error(
      `Backend factory for "${type}" returned an object missing required methods: ` +
      `${missingMethods.join(", ")}. ` +
      `BreakpointBackend requires: name, ${REQUIRED_BACKEND_METHODS.join(", ")}.`,
    );
  }
}

/**
 * Register a custom backend factory.
 * Called by extension packages (e.g., custom server backend, GitHub Issues backend).
 */
export function registerBackendFactory(
  name: string,
  factory: BackendFactory,
): void {
  backendFactories.set(name, factory);
}

/**
 * Create a backend from a type name and config object.
 * Validates at runtime that the factory returns a BreakpointBackend-conforming object.
 */
export function createBackend(
  type: string,
  config: Record<string, unknown>,
): BreakpointBackend {
  const factory = backendFactories.get(type);
  if (!factory) {
    throw new Error(
      `Unknown backend type: "${type}". ` +
      `Available: ${[...backendFactories.keys()].join(", ")}. ` +
      `Use registerBackendFactory() to add custom backends.`,
    );
  }
  const backend = factory(config);
  validateBackendConformance(backend, type);
  return backend;
}

/**
 * Create the default git-native backend with optional config.
 *
 * This is the recommended entry point for consumers who want the built-in
 * backend without explicit configuration.
 */
export function createDefaultBackend(
  options?: Record<string, unknown>,
): BreakpointBackend {
  return new GitNativeBackend(options as GitNativeBackendOptions | undefined);
}

/**
 * Resolve the backend for a given config, falling back to defaults.
 */
export function resolveBackend(
  config: BackendConfig,
): BreakpointBackend {
  return createBackend(config.type, config as unknown as Record<string, unknown>);
}

/**
 * Match a routing config against a breakpoint context to find the appropriate backend name.
 *
 * Uses **first-match-wins** semantics: routes are evaluated in array order and the
 * first rule whose domain or tag criteria match the context is selected. If no rule
 * matches, the `defaultBackend` is returned. This means higher-priority rules should
 * appear earlier in the routes array. There is no automatic conflict resolution --
 * if multiple rules could match, the first one in array order wins.
 *
 * Matching logic per rule (short-circuit on first hit):
 * 1. If the rule specifies `domains` and the context has a `domain`, check membership.
 * 2. If the rule specifies `tags` and the context has tags, check intersection.
 */
export function matchRoute(
  routingConfig: RoutingConfig,
  context: BreakpointContext,
): string {
  for (const rule of routingConfig.routes) {
    if (rule.domains && context.domain) {
      if (rule.domains.includes(context.domain)) return rule.backend;
    }
    if (rule.tags && context.tags.length > 0) {
      if (rule.tags.some((t) => context.tags.includes(t))) return rule.backend;
    }
  }
  return routingConfig.defaultBackend;
}

/**
 * List all registered backend types.
 */
export function listRegisteredBackends(): string[] {
  return [...backendFactories.keys()];
}
