import { ResponderTypeSchema } from "./types.js";
import type { Responder, ResponderType } from "./types.js";

export interface TaskRouteHints {
  responderType?: ResponderType | string;
  adapter?: string;
  model?: string;
  provider?: string;
  trackerBackend?: string;
  fallbackType?: ResponderType | string;
}

export interface TaskRouteRequest {
  kind: string;
  title?: string;
  capabilities?: string[];
  responderType?: ResponderType | string;
  adapter?: string;
  trackerBackend?: string;
  agent?: TaskRouteHints;
  breakpoint?: TaskRouteHints;
}

export interface RoutingContext {
  responders?: Responder[];
}

export class NoResponderAvailableError extends Error {
  readonly responderType: ResponderType;

  constructor(responderType: ResponderType, message?: string) {
    super(message ?? `No ${responderType} responders available`);
    this.name = "NoResponderAvailableError";
    this.responderType = responderType;
  }
}

export class TaskRouter {
  private readonly defaultContext: RoutingContext;

  constructor(defaultContext: RoutingContext = {}) {
    this.defaultContext = defaultContext;
  }

  async routeTask(task: TaskRouteRequest, context: RoutingContext = {}): Promise<Responder> {
    return routeTask(task, {
      ...this.defaultContext,
      ...context,
      responders: context.responders ?? this.defaultContext.responders,
    });
  }
}

export async function routeTask(
  task: TaskRouteRequest,
  context: RoutingContext = {},
): Promise<Responder> {
  const responderType = getResponderType(task);

  switch (responderType) {
    case "internal":
      return internalResponder();
    case "human":
      return matchResponder("human", task, context);
    case "agent":
      return matchResponder("agent", task, context);
    case "tracker":
      return matchResponder("tracker", task, context);
    case "auto": {
      const agent = findResponder("agent", task, context);
      if (agent) return agent;
      return matchResponder("human", task, context);
    }
    default:
      return assertNever(responderType);
  }
}

function getResponderType(task: TaskRouteRequest): ResponderType {
  const rawType = task.agent?.responderType
    ?? task.breakpoint?.responderType
    ?? task.responderType
    ?? "internal";
  const result = ResponderTypeSchema.safeParse(rawType);

  if (!result.success) {
    throw new Error(`Unknown responder type: ${String(rawType)}`);
  }

  return result.data;
}

function matchResponder(
  type: Exclude<ResponderType, "internal" | "auto">,
  task: TaskRouteRequest,
  context: RoutingContext,
): Responder {
  const responder = findResponder(type, task, context);
  if (responder) return responder;

  if (type === "agent" && task.agent?.fallbackType === "internal") {
    return internalResponder("Internal (fallback)");
  }

  throw new NoResponderAvailableError(type);
}

function findResponder(
  type: Exclude<ResponderType, "internal" | "auto">,
  task: TaskRouteRequest,
  context: RoutingContext,
): Responder | undefined {
  const responders = context.responders ?? [];
  const requiredCapabilities = task.capabilities ?? [];

  return responders.find((responder) => {
    if (responder.type !== type) return false;
    if (responder.availability === false) return false;
    if (!matchesCapabilities(responder, requiredCapabilities)) return false;
    if (type === "agent" && !matchesAgentHints(responder, task)) return false;
    if (type === "tracker" && !matchesTrackerHints(responder, task)) return false;
    return true;
  });
}

function matchesCapabilities(responder: Responder, requiredCapabilities: string[]): boolean {
  if (requiredCapabilities.length === 0) return true;
  const available = new Set(responder.capabilities);
  return requiredCapabilities.every((capability) => available.has(capability));
}

function matchesAgentHints(responder: Responder, task: TaskRouteRequest): boolean {
  const adapter = task.agent?.adapter ?? task.adapter;
  const model = task.agent?.model;
  const provider = task.agent?.provider;

  if (adapter && responder.adapter !== adapter && responder.id !== adapter) return false;
  if (model && responder.model !== model) return false;
  if (provider && responder.provider !== provider) return false;
  return true;
}

function matchesTrackerHints(responder: Responder, task: TaskRouteRequest): boolean {
  const trackerBackend = task.breakpoint?.trackerBackend ?? task.trackerBackend;
  if (trackerBackend && responder.trackerBackend !== trackerBackend && responder.id !== trackerBackend) {
    return false;
  }
  return true;
}

function internalResponder(name = "Internal Agent"): Responder {
  return {
    id: "agent-core",
    type: "internal",
    name,
    capabilities: ["text"],
    availability: true,
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled responder type: ${String(value)}`);
}
