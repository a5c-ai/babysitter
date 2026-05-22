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

  const tools = shouldEnableProgrammaticToolCalling(options)
    ? [
      ...baseTools,
      wrapToolDefinition(createProgrammaticToolCallingTool(options, baseTools), options.onToolUse),
    ]
    : baseTools;

  toolDefinitionScopes.set(tools, options);
  return tools;
}

export function disposeAgentCoreToolDefinitions(definitions: CustomToolDefinition[]): void {
  const options = toolDefinitionScopes.get(definitions);
  if (!options) {
    return;
  }
  disposeBackgroundRegistry(options);
  toolDefinitionScopes.delete(definitions);
}

export const createAgenticToolDefinitions = createAgentCoreToolDefinitions;
