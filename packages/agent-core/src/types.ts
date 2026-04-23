import type { TObject } from "@sinclair/typebox";
import type { DeferredToolRegistry } from "./deferredToolRegistry";

export interface AgentCorePromptResult {
  output: string;
  duration: number;
  success: boolean;
  exitCode: number;
}

export interface AgentCoreSessionEvent {
  type: string;
  [key: string]: unknown;
}

export interface AgentCoreSessionOptions {
  workspace?: string;
  model?: string;
  timeout?: number;
  thinkingLevel?: "minimal" | "low" | "medium" | "high" | "xhigh";
  toolsMode?: "default" | "coding" | "readonly";
  customTools?: unknown[];
  uiContext?: unknown;
  systemPrompt?: string;
  appendSystemPrompt?: string[];
  isolated?: boolean;
  ephemeral?: boolean;
  bashSandbox?: "auto" | "secure" | "local";
  enableCompaction?: boolean;
  agentDir?: string;
  backend?: string;
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
}

export interface CustomToolDefinition {
  name: string;
  label: string;
  description: string;
  promptSnippet?: string;
  parameters: TObject;
  execute: (
    toolCallId: string,
    params: Record<string, unknown>,
    signal?: AbortSignal,
    onUpdate?: unknown,
    toolContext?: unknown,
  ) => Promise<ToolResult> | ToolResult;
}

export interface AgentCoreToolOptions {
  workspace: string;
  interactive: boolean;
  askUserQuestionHandler?: (...args: unknown[]) => Promise<unknown>;
  taskHandler?: (...args: unknown[]) => Promise<unknown>;
  skillHandler?: (...args: unknown[]) => Promise<unknown>;
  onToolUse?: (toolName: string, params: unknown) => void;
  onBackgroundComplete?: (event: unknown) => void;
  maxBackgroundProcesses?: number;
  deferredToolRegistry?: DeferredToolRegistry;
}

export const AGENT_CORE_TOOL_NAMES: string[] = [
  "read",
  "write",
  "edit",
  "grep",
  "find",
  "bash",
  "python",
  "ssh",
  "browser",
  "fetch",
  "AskUserQuestion",
  "task",
  "skill",
  "calc",
  "ast_grep",
  "ast_edit",
  "render_mermaid",
  "notebook",
  "config",
  "background_status",
  "background_list",
  "tool_search",
  "tool_fetch",
  "web_search",
  "fetch_process",
];
