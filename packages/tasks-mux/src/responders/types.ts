import type { ResponderProfile, ResponderType } from "../types.js";

export type { ResponderProfile, ResponderType } from "../types.js";

export interface TaskRoutingHints {
  responderType?: ResponderType;
  adapter?: string;
  model?: string;
  provider?: string;
  trackerBackend?: string;
  fallbackType?: ResponderType;
}

export interface RoutedResponder extends ResponderProfile {
  type: ResponderType;
}

