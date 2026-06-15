export type ExtensionPermission =
  | 'tools:register'
  | 'commands:register'
  | 'keybindings:register'
  | 'events:listen'
  | 'statusbar:register'
  | 'context:inject'
  | 'filesystem:read'
  | 'filesystem:write'
  | 'network:outbound'
  | 'subprocess:spawn';

export interface GentyExtension {
  name: string;
  version?: string;
  description?: string;
  permissions?: ExtensionPermission[];
  activate(ctx: ExtensionContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}

export interface ExtensionContext {
  registerTool(tool: ExtensionToolDefinition): void;
  registerCommand(name: string, handler: CommandHandler): void;
  registerKeyBinding(key: string, handler: KeyHandler): void;
  onEvent(event: ExtensionEventType, handler: EventHandler): void;
  registerStatusBarItem(item: StatusBarItem): void;
  injectContext(provider: ContextProvider): void;
  getConfig<T = unknown>(key: string, defaultValue?: T): T;
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void;
}

export interface ExtensionToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

export type CommandHandler = (args: string[]) => void | Promise<void>;
export type KeyHandler = () => void | Promise<void>;
export type EventHandler = (event: ExtensionEvent) => void | Promise<void>;

export type ExtensionEventType =
  | 'sessionStart'
  | 'sessionEnd'
  | 'turnStart'
  | 'turnEnd'
  | 'toolCallStart'
  | 'toolCallEnd'
  | 'modelRequestStart'
  | 'modelResponseEnd'
  | 'breakpointHit'
  | 'error';

export interface ExtensionEvent {
  type: ExtensionEventType;
  timestamp: string;
  data: unknown;
}

export interface StatusBarItem {
  id: string;
  text: string | (() => string);
  priority?: number;
  tooltip?: string;
  onClick?: () => void;
}

export interface ContextProvider {
  id: string;
  provide(turnContext: TurnContext): ContextInjection | Promise<ContextInjection>;
}

export interface TurnContext {
  sessionId: string;
  turnNumber: number;
  messageHistory: unknown[];
  pendingTools: string[];
}

export interface ContextInjection {
  messages?: Array<{ role: string; content: string }>;
  systemPromptAppend?: string;
}

export interface ExtensionManifest {
  name: string;
  version: string;
  description?: string;
  main: string;
  engines?: { genty?: string };
  permissions?: string[];
}

export type ExtensionSource =
  | { type: 'local'; path: string }
  | { type: 'npm'; packageName: string; version?: string }
  | { type: 'git'; url: string; ref?: string };
