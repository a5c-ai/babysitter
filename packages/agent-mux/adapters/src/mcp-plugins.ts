/**
 * Shared MCP-server plugin helpers.
 *
 * Adapters whose native config stores MCP servers under `mcpServers`
 * (claude, cursor, gemini, opencode, openclaw) delegate list/install/
 * uninstall to these helpers instead of reimplementing JSON read-modify-
 * write per adapter.
 */

import * as fsp from 'node:fs/promises';
import * as pathMod from 'node:path';

import type {
  InstalledPlugin,
  PluginInstallOptions,
} from '@a5c-ai/agent-mux-core';

type McpConfigPaths = Partial<Record<'global' | 'project', string>>;
type McpServerMap = Record<string, unknown>;

async function readConfig(configPath: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fsp.readFile(configPath, 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writeConfig(configPath: string, doc: Record<string, unknown>): Promise<void> {
  await fsp.mkdir(pathMod.dirname(configPath), { recursive: true });
  await fsp.writeFile(configPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
}

export async function mcpListPlugins(configPaths: string | Record<string, string>): Promise<InstalledPlugin[]> {
  const paths: McpConfigPaths = typeof configPaths === 'string'
    ? { global: configPaths }
    : configPaths;
  const plugins: Record<string, InstalledPlugin & { scope?: string }> = {};
  
  // Read in order so project can override global (or vice versa, but usually project wins)
  for (const [scope, configPath] of Object.entries(paths)) {
    const doc = await readConfig(configPath);
    const servers: McpServerMap = doc['mcpServers'] && typeof doc['mcpServers'] === 'object'
      ? doc['mcpServers'] as McpServerMap
      : {};
    for (const [id, def] of Object.entries(servers)) {
      plugins[id] = {
        ...(typeof def === 'object' && def !== null ? def : {}),
        pluginId: id,
        name: id,
        version: '0.0.0',
        enabled: true,
        scope, // Adding non-standard scope property to help TUI/CLI differentiate
      } as any;
    }
  }
  return Object.values(plugins);
}

export async function mcpInstallPlugin(
  configPaths: string | Record<string, string>,
  pluginId: string,
  options?: PluginInstallOptions,
): Promise<InstalledPlugin> {
  if (!pluginId) throw new Error('pluginId is required');
  
  const paths: McpConfigPaths = typeof configPaths === 'string'
    ? { global: configPaths }
    : configPaths;
  const scope = options?.global === false ? 'project' : 'global';
  const configPath = paths[scope] || paths['global'];
  if (!configPath) throw new Error('No config path available for scope: ' + scope);

  const doc = await readConfig(configPath);
  const servers: McpServerMap = doc['mcpServers'] && typeof doc['mcpServers'] === 'object'
    ? { ...(doc['mcpServers'] as McpServerMap) }
    : {};
  servers[pluginId] = { command: pluginId };
  doc['mcpServers'] = servers;
  await writeConfig(configPath, doc);
  return {
    pluginId,
    name: pluginId,
    version: options?.version ?? '0.0.0',
    enabled: true,
    scope,
  } as any;
}

export async function mcpUninstallPlugin(
  configPaths: string | Record<string, string>,
  pluginId: string,
  options?: { global?: boolean },
): Promise<void> {
  const paths: McpConfigPaths = typeof configPaths === 'string'
    ? { global: configPaths }
    : configPaths;
  
  // If no scope specified, check both, starting with project
  const scopes: Array<'global' | 'project'> = options && options.global !== undefined 
    ? [options.global ? 'global' : 'project'] 
    : ['project', 'global'];

  for (const scope of scopes) {
    const configPath = paths[scope];
    if (!configPath) continue;
    
    const doc = await readConfig(configPath);
    const servers: McpServerMap = doc['mcpServers'] && typeof doc['mcpServers'] === 'object'
      ? { ...(doc['mcpServers'] as McpServerMap) }
      : {};
    if (pluginId in servers) {
      delete servers[pluginId];
      doc['mcpServers'] = servers;
      await writeConfig(configPath, doc);
      // Remove from first matching scope only unless we want to clean all
      return;
    }
  }
}
