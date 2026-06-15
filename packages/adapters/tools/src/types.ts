export type ToolSource = 'builtin' | 'mcp' | 'plugin' | 'custom';

export type ToolCategory =
  | 'shell'
  | 'filesystem'
  | 'web'
  | 'search'
  | 'code'
  | 'mcp'
  | 'ssh'
  | 'governance'
  | 'utility'
  | 'unknown';

export type ToolApprovalPolicy =
  | 'never'
  | 'on-risk'
  | 'always'
  | {
    mode: 'never' | 'on-risk' | 'always';
    reason?: string;
    riskTags?: string[];
  };

export interface ToolCostHint {
  unit: 'free' | 'low' | 'medium' | 'high' | 'metered';
  estimatedUsd?: number;
  meter?: 'tokens' | 'requests' | 'seconds' | 'bytes';
}

export interface ToolRateLimitHint {
  scope: 'tool' | 'provider' | 'host' | 'user';
  limit: number;
  windowMs: number;
  burst?: number;
}

export interface ToolCacheCapability {
  read: boolean;
  write: false;
  keyFields?: string[];
  ttlMs?: number;
}

export interface UnifiedToolMetadata {
  category: ToolCategory;
  tags?: string[];
  displayName?: string;
  version?: string;
  source?: ToolSource | 'deferred' | 'host' | 'code-executor';
  cost?: ToolCostHint;
  rateLimit?: ToolRateLimitHint;
  requiresApproval?: ToolApprovalPolicy;
  posture?: string;
  cache?: ToolCacheCapability;
  transport?: Record<string, unknown>;
}

export type ToolErrorCode =
  | 'ABORTED'
  | 'TIMEOUT'
  | 'VALIDATION_FAILED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_DENIED'
  | 'RATE_LIMITED'
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'NOT_FOUND'
  | 'TRANSPORT_ERROR'
  | 'REMOTE_EXECUTION_FAILED'
  | 'OUTPUT_LIMIT_EXCEEDED'
  | 'SCHEMA_FETCH_FAILED'
  | 'CACHE_UNAVAILABLE'
  | 'INTERNAL';

export interface SerializedToolError {
  name: 'ToolExecutionError';
  message: string;
  code: ToolErrorCode;
  retryable: boolean;
  toolName?: string;
  callId?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export class ToolExecutionError extends Error {
  readonly code: ToolErrorCode;
  readonly retryable: boolean;
  readonly toolName: string | undefined;
  readonly callId: string | undefined;
  readonly status: number | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    options: {
      code: ToolErrorCode;
      retryable?: boolean;
      toolName?: string;
      callId?: string;
      status?: number;
      details?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = 'ToolExecutionError';
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.toolName = options.toolName;
    this.callId = options.callId;
    this.status = options.status;
    this.details = options.details;
  }
}

export function serializeToolError(error: unknown): SerializedToolError {
  if (error instanceof ToolExecutionError) {
    return {
      name: 'ToolExecutionError',
      message: error.message,
      code: error.code,
      retryable: error.retryable,
      ...(error.toolName ? { toolName: error.toolName } : {}),
      ...(error.callId ? { callId: error.callId } : {}),
      ...(error.status !== undefined ? { status: error.status } : {}),
      ...(error.details ? { details: error.details } : {}),
    };
  }
  return {
    name: 'ToolExecutionError',
    message: error instanceof Error ? error.message : String(error),
    code: 'INTERNAL',
    retryable: false,
  };
}

export type UnifiedToolEvent =
  | { type: 'tool.started'; callId: string; toolName: string; timestamp: string }
  | { type: 'tool.stdout'; callId: string; chunk: string; sequence: number }
  | { type: 'tool.stderr'; callId: string; chunk: string; sequence: number }
  | { type: 'tool.progress'; callId: string; message?: string; current?: number; total?: number }
  | { type: 'tool.partial'; callId: string; value: unknown; sequence: number }
  | { type: 'tool.completed'; callId: string; result: unknown }
  | { type: 'tool.failed'; callId: string; error: SerializedToolError }
  | { type: 'tool.cancelled'; callId: string; reason?: string };

export interface ToolExecutionLimits {
  timeoutMs: number;
  maxOutputBytes: number;
  maxEvents?: number;
}

export interface ToolExecutionPolicy {
  defaultTimeoutMs: number;
  defaultMaxOutputBytes: number;
  perTool?: Record<string, Partial<ToolExecutionLimits>>;
  allowStreaming?: boolean;
  enableReadOnlyCache?: boolean;
}

export interface ToolDescriptor {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>; // JSON Schema
  source: ToolSource;
  sourceQualifier?: string;
  server?: string;
  permissions?: string[];
  outputSchema?: Record<string, unknown>;
  metadata?: UnifiedToolMetadata | Record<string, unknown>;
}

export interface ToolServer {
  id: string;
  name: string;
  type: 'mcp' | 'native' | 'remote';
  tools: ToolDescriptor[];
}

export interface ToolDispatchRule {
  match: string; // glob pattern on tool name
  server: string;
  priority?: number;
  conditions?: Record<string, unknown>;
}

export interface ToolDispatchPolicy {
  rules: ToolDispatchRule[];
  defaultServer?: string;
}

export interface ToolCallContext {
  toolName: string;
  input: unknown;
  caller?: string;
  runId?: string;
  sessionId?: string;
  signal?: AbortSignal;
  onUpdate?: (event: UnifiedToolEvent) => void | Promise<void>;
}

export interface ToolCallResult {
  output: unknown;
  durationMs: number;
  error?: string | SerializedToolError;
}
