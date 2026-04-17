import type { TObject } from "@sinclair/typebox";
import type { DeferredToolRegistry } from "../deferredToolRegistry";

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

export interface AgenticToolOptions {
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

export const AGENTIC_TOOL_NAMES: string[] = [
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
