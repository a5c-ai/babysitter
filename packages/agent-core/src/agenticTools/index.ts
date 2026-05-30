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
