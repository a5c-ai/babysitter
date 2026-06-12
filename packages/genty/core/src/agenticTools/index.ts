import type { AgenticToolOptions, CustomToolDefinition } from "./types";
import { disposeBackgroundRegistry } from "./background/state";
import { createBackgroundTools } from "./background/tools";
import { createBrowserTool } from "./browser/tool";
import { createConfigTool } from "./config/tool";
import { createDiscoveryTools } from "./discovery/tools";
import { wrapToolDefinition } from "./shared/results";
import { createWebTools } from "./web/tools";
import { createCodeTools } from "./tools/code";
import { createDelegationTools } from "./tools/delegation";
import { createExecutionTools } from "./tools/execution";
import { createFileSystemTools } from "./tools/fileSystem";
import {
  createProgrammaticToolCallingTool,
  shouldEnableProgrammaticToolCalling,
} from "./tools/programmaticToolCalling";

const toolDefinitionScopes = new WeakMap<CustomToolDefinition[], AgenticToolOptions>();
const toolDefinitionOwners = new WeakMap<CustomToolDefinition, AgenticToolOptions>();

export function createAgentCoreToolDefinitions(options: AgenticToolOptions): CustomToolDefinition[] {
  const baseTools = [
    ...createFileSystemTools(options),
    ...createExecutionTools(options),
    createBrowserTool(),
    ...createDelegationTools(options),
    ...createCodeTools(options),
    createConfigTool(),
    ...createBackgroundTools(options),
    ...createDiscoveryTools(options),
    ...createWebTools(),
  ].map((tool) => wrapToolDefinition(tool, options.onToolUse));

  options.toolRegistry?.registerAll?.(baseTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as unknown as Record<string, unknown>,
    source: "builtin",
    metadata: tool.metadata as Record<string, unknown> | undefined,
  })));

  const tools = shouldEnableProgrammaticToolCalling(options)
    ? [
      ...baseTools,
      wrapToolDefinition(createProgrammaticToolCallingTool(options, baseTools), options.onToolUse),
    ]
    : baseTools;

  toolDefinitionScopes.set(tools, options);
  for (const tool of tools) {
    toolDefinitionOwners.set(tool, options);
  }
  return tools;
}

/**
 * Focused coding tool surface for delegated workers: file tools
 * (read/write/edit/grep/find) plus the `bash` execution tool, and nothing
 * else. The full {@link createAgentCoreToolDefinitions} surface (browser,
 * background, delegation, web, discovery, config — ~30 tools) invites a worker
 * with a single bounded task to wander; a delegated agent that must author a
 * file only needs read + write + bash. This keeps the worker on-task and is
 * what {@link createAgentCoreSession}-based delegated harnesses should pass as
 * `customTools` when their `toolsMode` is `"coding"` or `"readonly"`.
 */
export function createCodingToolDefinitions(
  options: AgenticToolOptions,
  mode: "coding" | "readonly" = "coding",
): CustomToolDefinition[] {
  const fileTools = createFileSystemTools(options);
  const tools = mode === "readonly"
    // Read-only workers get read/grep/find but not write/edit/bash.
    ? fileTools.filter((tool) => tool.name === "read" || tool.name === "grep" || tool.name === "find")
    : [...fileTools, ...createExecutionTools(options).filter((tool) => tool.name === "bash")];
  const wrapped = tools.map((tool) => wrapToolDefinition(tool, options.onToolUse));
  toolDefinitionScopes.set(wrapped, options);
  for (const tool of wrapped) {
    toolDefinitionOwners.set(tool, options);
  }
  return wrapped;
}

/**
 * Authoring-scoped tool surface for the create-run phase-1 (PhasePlanProcess)
 * agent. The phase-1 agent's ONLY job is to AUTHOR a babysitter process
 * definition file and report it — it must NOT perform the user's requested
 * work directly. The full {@link createAgentCoreToolDefinitions} surface hands
 * it `bash`, `python`, `ssh`, browser, web-fetch, and code-execution tools,
 * which weak models use to "just do the task" (write the deliverable, run a
 * shell command, read a directory) instead of authoring the process — then the
 * phase fails with `ProcessDefinitionReportMissing` / `ProcessDefinitionFailed`
 * (#956). This surface exposes only what authoring needs: the file tools
 * (read/write/edit/grep/find — to search references and write the process
 * file) plus the delegation tools (AskUserQuestion/task/skill — wired through
 * the caller's handlers). No execution/browser/web/code/config/background/
 * discovery tools, so the model cannot sidestep authoring.
 */
export function createProcessAuthoringToolDefinitions(options: AgenticToolOptions): CustomToolDefinition[] {
  const allowedDelegationNames = new Set(["AskUserQuestion", "task", "skill"]);
  const tools = [
    ...createFileSystemTools(options),
    ...createDelegationTools(options).filter((tool) => allowedDelegationNames.has(tool.name)),
  ].map((tool) => wrapToolDefinition(tool, options.onToolUse));

  options.toolRegistry?.registerAll?.(tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as unknown as Record<string, unknown>,
    source: "builtin",
    metadata: tool.metadata as Record<string, unknown> | undefined,
  })));

  toolDefinitionScopes.set(tools, options);
  for (const tool of tools) {
    toolDefinitionOwners.set(tool, options);
  }
  return tools;
}

export function disposeAgentCoreToolDefinitions(definitions: CustomToolDefinition[]): void {
  const options = toolDefinitionScopes.get(definitions)
    ?? definitions.map((definition) => toolDefinitionOwners.get(definition)).find(Boolean);
  if (!options) {
    return;
  }
  disposeBackgroundRegistry(options);
  toolDefinitionScopes.delete(definitions);
  for (const definition of definitions) {
    toolDefinitionOwners.delete(definition);
  }
}

export const createAgenticToolDefinitions = createAgentCoreToolDefinitions;
