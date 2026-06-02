export type HandlerType = 'command' | 'shell' | 'http' | 'mcp_tool' | 'prompt' | 'agent';

interface BaseHandlerRef {
  /** Optional priority (lower = earlier execution). */
  priority?: number;
  /** Optional shell executable used for command handlers. */
  shell?: string;
}

/**
 * Reference to a hook handler shell command.
 *
 * `type` is optional for backwards compatibility. Omitted type means `command`.
 */
export interface CommandHandlerRef extends BaseHandlerRef {
  type?: 'command' | 'shell';
  /** Shell command to execute as a child process. */
  source: string;
  /** Handler identifier (informational label for diagnostics). */
  handler?: string;
}

export interface HttpHandlerRef extends BaseHandlerRef {
  type: 'http';
  url: string;
  method?: 'POST';
  headers?: Record<string, string>;
  allowedEnvVars?: string[];
  body?: Record<string, unknown>;
  /** Test/dev escape hatch for explicitly configured loopback/private endpoints. */
  allowPrivateNetwork?: boolean;
}

export interface McpToolHandlerRef extends BaseHandlerRef {
  type: 'mcp_tool';
  server: string;
  tool: string;
  args?: Record<string, unknown>;
}

export interface PromptHandlerRef extends BaseHandlerRef {
  type: 'prompt';
  prompt: string;
  model?: string;
  systemPrompt?: string;
  maxOutputBytes?: number;
  maxDepth?: number;
}

export interface AgentHandlerRef extends BaseHandlerRef {
  type: 'agent';
  prompt: string;
  agent?: string;
  model?: string;
  maxTurns?: number;
  maxDepth?: number;
}

export type HandlerRef =
  | CommandHandlerRef
  | HttpHandlerRef
  | McpToolHandlerRef
  | PromptHandlerRef
  | AgentHandlerRef;

/**
 * An entry in the hook execution plan.
 *
 * Spec section 12.3.
 */
export interface HookPlanEntry {
  id: string;
  pluginId: string;
  phase: string;
  priority: number;
  when?: Record<string, unknown>;
  /** Additional matcher conditions evaluated with AND semantics after `when`. */
  if?: Record<string, unknown>;
  handler: HandlerRef;
  timeoutMs?: number;
  /** Optional shell executable for this hook entry. */
  shell?: string;
  /** Diagnostic status message surfaced in handler metadata. */
  statusMessage?: string;
  /** Run the command without awaiting process exit. */
  async?: boolean;
  /** Request a rewake/reminder after async completion when supported. */
  asyncRewake?: boolean;
  /** Suppress duplicate execution for this entry within a session. */
  once?: boolean;
}
