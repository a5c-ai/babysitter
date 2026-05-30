import type { BreakpointBackend } from "./backend.js";
import type { ResponderProfile, ResponderType } from "./types.js";
import type { TaskRoutingHints } from "./responders/types.js";

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
      responder: ResponderProfile;
      route: "agent-core";
      reason: string;
    }
  | {
      responderType: "human";
      responder: ResponderProfile;
      route: "breakpoint";
      backend?: BreakpointBackend;
      reason: string;
    }
  | {
      responderType: "agent";
      responder: ResponderProfile;
      route: "agent-mux";
      backend?: BreakpointBackend;
      reason: string;
    }
  | {
      responderType: "tracker";
      responder?: ResponderProfile;
      route: "external-tracker";
      backend?: BreakpointBackend;
      unavailable?: boolean;
      reason: string;
    };

export function routeTask(task: RoutableTaskDef, context: TaskRouteContext = {}): TaskRouteDecision {
  const hints = routingHints(task);
  const requested = hints.responderType ?? defaultResponderType(task);

  if (requested === "auto") {
    const agent = selectResponder(context.responders, "agent", hints.adapter);
    if (agent || context.agentBackend) {
      return agentDecision(hints, context, agent, "auto selected available agent responder");
    }
    return humanDecision(context, "auto fell back to human responder");
  }

  if (requested === "agent") {
    const responder = selectResponder(context.responders, "agent", hints.adapter);
    return agentDecision(hints, context, responder, "agent responder requested");
  }

  if (requested === "human") {
    return humanDecision(context, "human responder requested");
  }

  if (requested === "tracker") {
    const responder = selectResponder(context.responders, "tracker", hints.trackerBackend);
    return {
      responderType: "tracker",
      responder,
      route: "external-tracker",
      backend: context.trackerBackend,
      unavailable: !context.trackerBackend,
      reason: context.trackerBackend
        ? "tracker responder requested"
        : `ExternalTrackerBackend unavailable for ${hints.trackerBackend ?? "default tracker"}`,
    };
  }

  return internalDecision("internal responder requested");
}

export function routingHints(task: RoutableTaskDef): TaskRoutingHints {
  const source = task.agent ?? task.breakpoint ?? {};
  return {
    responderType: source.responderType ?? task.metadata?.responderType,
    adapter: source.adapter ?? task.metadata?.adapter,
    model: source.model ?? task.metadata?.model,
    provider: source.provider ?? task.metadata?.provider,
    trackerBackend: source.trackerBackend ?? task.metadata?.trackerBackend,
    fallbackType: source.fallbackType ?? task.metadata?.fallbackType,
  };
}

export function isHostDelegableRoute(decision: TaskRouteDecision): boolean {
  return decision.responderType === "internal" || decision.responderType === "agent";
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
      domains: [],
      tags: ["internal"],
      availability: true,
      responseTimeSla: 1,
    },
  };
}

function humanDecision(context: TaskRouteContext, reason: string): TaskRouteDecision {
  const responder = selectResponder(context.responders, "human") ?? {
    id: "human",
    type: "human" as const,
    name: "Human Responder",
    title: "Human Responder",
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
  responder: ResponderProfile | undefined,
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
  type: ResponderType,
  preferred?: string,
): ResponderProfile | undefined {
  const available = responders?.filter((responder) =>
    (responder.type ?? "human") === type && responder.availability
  ) ?? [];
  if (preferred) {
    return available.find((responder) =>
      responder.id === preferred ||
      responder.adapter === preferred ||
      responder.trackerBackend === preferred
    );
  }
  return available[0];
}
