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

const toolDefinitionScopes = new WeakMap<CustomToolDefinition[], AgenticToolOptions>();

export function createAgentCoreToolDefinitions(options: AgenticToolOptions): CustomToolDefinition[] {
  const tools = [
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
