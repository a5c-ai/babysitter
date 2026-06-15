declare module '@anthropic-ai/claude-agent-sdk' {
  export type PermissionResult = {
    behavior: 'allow' | 'deny';
    message?: string;
  };

  export type ElicitationResult = {
    action: 'accept' | 'decline';
    content?: {
      response: string;
    };
  };

  export type SDKUserMessage = string | Record<string, any>;

  export type SDKMessage = Record<string, any>;

  export type Options = {
    model?: string;
    cwd?: string;
    env?: Record<string, string | undefined>;
    resume?: string;
    forkSession?: boolean;
    persistSession?: boolean;
    permissionMode?: 'bypassPermissions' | 'dontAsk' | 'default';
    allowDangerouslySkipPermissions?: boolean;
    canUseTool?: (toolName: string, input: unknown, ctx: {
      toolUseID?: string;
      title?: string;
      description?: string;
    }) => Promise<PermissionResult>;
    onElicitation?: (request: {
      elicitationId?: string;
      title?: string;
      message: string;
      description?: string;
      url?: string;
    }) => Promise<ElicitationResult>;
    includePartialMessages?: boolean;
    includeHookEvents?: boolean;
    settingSources?: string[];
    mcpServers?: Record<string, Record<string, unknown>>;
    maxTurns?: number;
    systemPrompt?: string | {
      type: 'preset';
      preset: string;
      append: string;
    };
    stderr?: (data: string) => void;
    thinking?: {
      type: 'enabled';
      budgetTokens?: number;
    };
    effort?: 'low' | 'medium' | 'high' | 'max';
  };

  export type Query = AsyncIterable<SDKMessage> & {
    close(): void;
    interrupt(): Promise<void>;
  };

  export function query(params: {
    prompt: string | AsyncIterable<SDKUserMessage>;
    options?: Options;
  }): Query;
}
