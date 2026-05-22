/**
 * Status: NOT INTEGRATED YET
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-BRK-002: Breakpoint delegation types.
 */

export interface DelegationRule {
  id: string;
  pattern: string;
  webhookUrl: string;
  method?: "POST" | "PUT";
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface DelegationRulesFile {
  schemaVersion: string;
  rules: DelegationRule[];
}

export interface DelegationPayload {
  breakpointId: string;
  title?: string;
  description?: string;
  tags?: string[];
  expert?: string | string[];
  options?: string[];
  callbackUrl?: string;
  runId?: string;
  effectId?: string;
}

export interface DelegationSendOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface DelegationResponse {
  approved: boolean;
  respondedBy?: string;
  responseData?: Record<string, unknown>;
  error?: string;
  timedOut?: boolean;
}

export const DELEGATION_RULES_SCHEMA_VERSION = "2026.01.delegation-rules-v1";
export const DEFAULT_DELEGATION_TIMEOUT_MS = 300_000; // 5 minutes
