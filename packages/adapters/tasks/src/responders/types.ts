import type { ResponderProfile, ResponderType } from "../types.js";

export type { ResponderProfile, ResponderType } from "../types.js";

export interface TaskRoutingHints {
  external?: boolean;
  responderType?: ResponderType;
  preferredResponderId?: string;
  capabilities?: string[];
  requiredCapabilities?: string[];
  adapter?: string;
  model?: string;
  provider?: string;
  trackerBackend?: string;
  fallbackType?: ResponderType;
}

export interface BaseResponder extends ResponderProfile {
  type: Exclude<ResponderType, "auto">;
  capabilities: string[];
}

export interface HumanResponder extends BaseResponder {
  type: "human";
}

export interface AgentResponder extends BaseResponder {
  type: "agent";
  adapter?: string;
  model?: string;
  provider?: string;
}

export interface TrackerResponder extends BaseResponder {
  type: "tracker";
  trackerBackend?: string;
  trackerConfig?: Record<string, unknown>;
}

export interface InternalResponder extends BaseResponder {
  type: "internal";
}

export type Responder =
  | HumanResponder
  | AgentResponder
  | TrackerResponder
  | InternalResponder;

export type RoutedResponder = Responder;
