/**
 * Contextual information about the execution environment
 * when a hook event fires.
 *
 * Spec section 9.1.
 */
export interface UnifiedExecutionContext {
  sessionId: string | null;
  turnId?: string | null;
  conversationId?: string | null;
  adapter: string;
  cwd?: string | null;
  worktree?: string | null;
  transcriptPath?: string | null;
  source?: string | null;
  model?: string | null;
  agentType?: string | null;
  permissionMode?: string | null;
  toolName?: string | null;
  toolCallId?: string | null;
  nativeEventName: string;
  rawEventScope?: string | null;
  persistedEnv: Record<string, string>;
  contextVars: Record<string, string>;
  metadata: Record<string, unknown>;
}

/**
 * A unified hook event emitted by an adapter, representing
 * a single lifecycle occurrence in canonical form.
 *
 * Spec section 10.
 */
export interface UnifiedHookEvent {
  version: 'a5c.hooks.v1';
  adapter: string;
  phase: string;
  rawEventName: string;
  supportLevel: 'native' | 'emulated' | 'lossy' | 'unsupported';
  execution: UnifiedExecutionContext;
  payload: Record<string, unknown>;
  env: {
    input: Record<string, string>;
    persisted: Record<string, string>;
  };
  raw: unknown;
}
