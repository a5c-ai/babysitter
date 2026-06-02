import type { BreakpointBackend } from "./backend.js";
import type { ResponderProfile, ResponderType } from "./types.js";
import type { RoutedResponder, TaskRoutingHints } from "./responders/types.js";

export interface RoutableTaskDef {
  kind: string;
  title?: string;
  agent?: TaskRoutingHints & Record<string, unknown>;
  breakpoint?: TaskRoutingHints & Record<string, unknown>;
  metadata?: TaskRoutingHints & Record<string, unknown>;
}

export interface TaskRouteContext {
  agentBackend?: BreakpointBackend;
  humanBackend?: BreakpointBackend;
  trackerBackend?: BreakpointBackend;
  responders?: ResponderProfile[];
}

export type TaskRouteDecision =
  | {
      responderType: "internal";
      responder: RoutedResponder;
      route: "agent-core";
      reason: string;
    }
  | {
      responderType: "human";
      responder: RoutedResponder;
      route: "breakpoint";
      backend?: BreakpointBackend;
      reason: string;
    }
  | {
      responderType: "agent";
      responder: RoutedResponder;
      route: "agent-mux";
      backend?: BreakpointBackend;
      reason: string;
    }
  | {
      responderType: "tracker";
      responder?: RoutedResponder;
      route: "external-tracker";
      backend?: BreakpointBackend;
      unavailable?: boolean;
      reason: string;
    };

export function routeTask(task: RoutableTaskDef, context: TaskRouteContext = {}): TaskRouteDecision {
  return new TaskRouter(context).routeTask(task);
}

export class TaskRouter {
  private readonly context: TaskRouteContext;

  constructor(context: TaskRouteContext = {}) {
    this.context = context;
  }

  routeTask(task: RoutableTaskDef, context: TaskRouteContext = {}): TaskRouteDecision {
    const mergedContext = { ...this.context, ...context };
    const hints = routingHints(task);
    const requested = hints.responderType ?? (hints.external ? "agent" : defaultResponderType(task));

    if (requested === "auto") {
      const agent = selectResponder(mergedContext.responders, "agent", preferredResponder(hints), requiredCapabilities(hints));
      if (agent || (mergedContext.agentBackend && !hasResponderInventory(mergedContext))) {
        return agentDecision(hints, mergedContext, agent, "auto selected available agent responder");
      }
      return humanDecision(mergedContext, "auto fell back to human responder", hints);
    }

    if (requested === "agent") {
      const responder = selectResponder(mergedContext.responders, "agent", preferredResponder(hints), requiredCapabilities(hints));
      if (!responder && !mergedContext.agentBackend && hints.fallbackType && hints.fallbackType !== "agent") {
        return fallbackDecision(hints.fallbackType, task, mergedContext, `agent responder unavailable; fell back to ${hints.fallbackType}`);
      }
      return agentDecision(hints, mergedContext, responder, "agent responder requested");
    }

    if (requested === "human") {
      return humanDecision(mergedContext, "human responder requested", hints);
    }

    if (requested === "tracker") {
      const responder = selectResponder(mergedContext.responders, "tracker", hints.trackerBackend, requiredCapabilities(hints));
      return {
        responderType: "tracker",
        responder,
        route: "external-tracker",
        backend: mergedContext.trackerBackend,
        unavailable: !mergedContext.trackerBackend,
        reason: mergedContext.trackerBackend
          ? "tracker responder requested"
          : `ExternalTrackerBackend unavailable for ${hints.trackerBackend ?? "default tracker"}`,
      };
    }

    return internalDecision("internal responder requested");
  }

  matchResponder(type: Exclude<ResponderType, "auto">, hints: TaskRoutingHints = {}): RoutedResponder | undefined {
    return selectResponder(this.context.responders, type, preferredResponder(hints), requiredCapabilities(hints));
  }
}

function fallbackDecision(
  fallbackType: Exclude<ResponderType, "agent">,
  task: RoutableTaskDef,
  context: TaskRouteContext,
  reason: string,
): TaskRouteDecision {
  if (fallbackType === "human") {
    return humanDecision(context, reason, routingHints(task));
  }
  if (fallbackType === "tracker") {
    const hints = routingHints(task);
    const responder = selectResponder(context.responders, "tracker", hints.trackerBackend, requiredCapabilities(hints));
    return {
      responderType: "tracker",
      responder,
      route: "external-tracker",
      backend: context.trackerBackend,
      unavailable: !context.trackerBackend,
      reason,
    };
  }
  if (fallbackType === "auto") {
    return humanDecision(context, reason);
  }
  return internalDecision(reason);
}

export function routingHints(task: RoutableTaskDef): TaskRoutingHints {
  const source = task.agent ?? task.breakpoint ?? {};
  return {
    responderType: source.responderType ?? task.metadata?.responderType,
    external: source.external ?? task.metadata?.external,
    preferredResponderId: source.preferredResponderId ?? task.metadata?.preferredResponderId,
    capabilities: source.capabilities ?? task.metadata?.capabilities,
    requiredCapabilities: source.requiredCapabilities ?? task.metadata?.requiredCapabilities,
    adapter: source.adapter ?? task.metadata?.adapter,
    model: source.model ?? task.metadata?.model,
    provider: source.provider ?? task.metadata?.provider,
    trackerBackend: source.trackerBackend ?? task.metadata?.trackerBackend,
    fallbackType: source.fallbackType ?? task.metadata?.fallbackType,
  };
}

export function isHostDelegableRoute(decision: TaskRouteDecision): boolean {
  return decision.route === "agent-core";
}

function defaultResponderType(task: RoutableTaskDef): ResponderType {
  if (task.kind === "breakpoint") return "human";
  return "internal";
}

function internalDecision(reason: string): TaskRouteDecision {
  return {
    responderType: "internal",
    route: "agent-core",
    reason,
    responder: {
      id: "agent-core",
      type: "internal",
      name: "Internal Agent",
      title: "Internal Agent",
      capabilities: ["text", "agent-core", "internal"],
      domains: [],
      tags: ["internal"],
      availability: true,
      responseTimeSla: 1,
    },
  };
}

function humanDecision(context: TaskRouteContext, reason: string, hints: TaskRoutingHints = {}): TaskRouteDecision {
  const responder = selectResponder(context.responders, "human", preferredResponder(hints), requiredCapabilities(hints)) ?? {
    id: "human",
    type: "human" as const,
    name: "Human Responder",
    title: "Human Responder",
    capabilities: ["text", "review", "approval"],
    domains: [],
    tags: ["human"],
    availability: true,
    responseTimeSla: 300_000,
  };
  return { responderType: "human", route: "breakpoint", backend: context.humanBackend, responder, reason };
}

function agentDecision(
  hints: TaskRoutingHints,
  context: TaskRouteContext,
  responder: RoutedResponder | undefined,
  reason: string,
): TaskRouteDecision {
  return {
    responderType: "agent",
    route: "agent-mux",
    backend: context.agentBackend,
    reason,
    responder: responder ?? {
      id: hints.adapter ?? "agent-mux",
      type: "agent",
      name: hints.adapter ?? "AgentMux Responder",
      title: "AgentMux Responder",
      capabilities: requiredCapabilities(hints),
      domains: [],
      tags: ["agent"],
      availability: true,
      responseTimeSla: 300_000,
      adapter: hints.adapter,
      model: hints.model,
      provider: hints.provider,
    },
  };
}

function selectResponder(
  responders: ResponderProfile[] | undefined,
  type: Exclude<ResponderType, "auto">,
  preferred?: string,
  capabilities: string[] = [],
): RoutedResponder | undefined {
  const available = responders
    ?.map((responder) => normalizeResponder(responder))
    .filter((responder) =>
      responder.type === type &&
      responder.availability &&
      hasCapabilities(responder, capabilities)
    ) ?? [];
  if (preferred) {
    const preferredMatch = available.find((responder) =>
      responder.id === preferred ||
      responder.adapter === preferred ||
      responder.trackerBackend === preferred
    );
    if (preferredMatch) return preferredMatch;
  }
  return available.sort(compareResponderPriority)[0];
}

function normalizeResponder(responder: ResponderProfile): RoutedResponder {
  const type = responder.type ?? "human";
  return {
    ...responder,
    type,
    capabilities: normalizedCapabilities(responder),
  } as RoutedResponder;
}

function normalizedCapabilities(responder: ResponderProfile): string[] {
  return uniqueLowercase([
    ...(responder.capabilities ?? []),
    ...responder.domains,
    ...responder.tags,
  ]);
}

function hasCapabilities(responder: RoutedResponder, capabilities: string[]): boolean {
  if (capabilities.length === 0) return true;
  const available = new Set(responder.capabilities.map((capability) => capability.toLowerCase()));
  return capabilities.every((capability) => available.has(capability.toLowerCase()));
}

function requiredCapabilities(hints: TaskRoutingHints): string[] {
  return uniqueLowercase(hints.requiredCapabilities ?? hints.capabilities ?? []);
}

function preferredResponder(hints: TaskRoutingHints): string | undefined {
  return hints.preferredResponderId ?? hints.adapter ?? hints.trackerBackend;
}

function hasResponderInventory(context: TaskRouteContext): boolean {
  return Array.isArray(context.responders);
}

function compareResponderPriority(a: RoutedResponder, b: RoutedResponder): number {
  const sla = a.responseTimeSla - b.responseTimeSla;
  if (sla !== 0) return sla;
  return a.id.localeCompare(b.id);
}

function uniqueLowercase(values: string[]): string[] {
  return [...new Set(values.filter(Boolean).map((value) => value.toLowerCase()))];
}
