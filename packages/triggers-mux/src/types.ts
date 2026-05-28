export type TriggerBackend = 'github' | 'gitlab' | 'bitbucket' | 'generic-webhook';

export interface TriggerChange {
  path: string;
  status?: string;
  additions?: number;
  deletions?: number;
  patch?: string;
}

export interface NormalizedTriggerEvent {
  backend: TriggerBackend;
  eventName: string;
  action?: string;
  actor?: string;
  repository?: string;
  ref?: string;
  sha?: string;
  title?: string;
  body?: string;
  url?: string;
  sourceBranch?: string;
  targetBranch?: string;
  labels: string[];
  text: string;
  changes: TriggerChange[];
  raw: unknown;
}

export interface EnrichmentOptions {
  backend?: TriggerBackend;
  eventName?: string;
  eventPath?: string;
  event?: unknown;
  repository?: string;
  token?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  cwd?: string;
  includeDiff?: boolean;
}

export interface TriggerQuery {
  event?: string | string[];
  action?: string | string[];
  text?: string | string[];
  diff?: string | string[];
  paths?: string | string[];
  files?: string | string[];
  branch?: string | string[];
  labels?: string | string[];
  expression?: string;
}

export interface TriggerEvaluation {
  matched: boolean;
  reasons: string[];
  event: NormalizedTriggerEvent;
}
