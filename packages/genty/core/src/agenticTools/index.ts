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
