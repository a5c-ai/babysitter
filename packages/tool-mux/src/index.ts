/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type {
  ToolSource,
  ToolDescriptor,
  ToolLookupOptions,
  ToolSchema,
  ResolvedToolDescriptor,
  SchemaLoader,
  ToolServer,
  ToolDispatchRule,
  ToolDispatchPolicy,
  ToolCallContext,
  ToolCallResult,
  ToolApprovalPolicy,
  ToolCacheCapability,
  ToolCategory,
  ToolCostHint,
  ToolErrorCode,
  ToolExecutionLimits,
  ToolExecutionPolicy,
  ToolRateLimitHint,
  SerializedToolError,
  UnifiedToolEvent,
  UnifiedToolMetadata,
} from './types.js';
export { ToolExecutionError, serializeToolError } from './types.js';

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

export { ToolRegistry } from './registry.js';

/* ------------------------------------------------------------------ */
/*  Dispatch                                                           */
/* ------------------------------------------------------------------ */

export { ToolDispatcher } from './dispatch.js';
export type { ToolExecutor, ToolDispatcherOptions } from './dispatch.js';

/* ------------------------------------------------------------------ */
/*  Schema translation (re-exports from transport-mux + adapters)      */
/* ------------------------------------------------------------------ */

export {
  convertTools,
  toToolDescriptor,
  fromToolDescriptor,
  translateTools,
} from './schema-translation.js';
export type { NormalizedToolDefinition, CodecCapabilities } from './schema-translation.js';

/* ------------------------------------------------------------------ */
/*  Hooks bridge                                                       */
/* ------------------------------------------------------------------ */

export { NoopToolHookBridge, ProductionToolHookBridge } from './hooks.js';
export type {
  ProductionToolHookBridgeOptions,
  ToolHookBridge,
  ToolHookEvent,
  ToolHookProcessor,
  ToolHookResult,
} from './hooks.js';

/* ------------------------------------------------------------------ */
/*  MCP bridge                                                         */
/* ------------------------------------------------------------------ */

export { McpBridge } from './mcp-bridge.js';
export type { McpTransport, McpServerConfig, McpToolDefinition } from './mcp-bridge.js';
