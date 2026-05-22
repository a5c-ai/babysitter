const fs = require('fs');
const path = require('path');

let mcpPlugins = fs.readFileSync('packages/agent-mux/adapters/src/mcp-plugins.ts', 'utf8');

const mcpListFunc = `export async function mcpListPlugins(configPaths: string | Record<string, string>): Promise<InstalledPlugin[]> {
  const paths = typeof configPaths === 'string' ? { global: configPaths } : configPaths;
  const plugins: Record<string, InstalledPlugin & { scope?: string }> = {};
  
  // Read in order so project can override global (or vice versa, but usually project wins)
  for (const [scope, configPath] of Object.entries(paths)) {
    const doc = await readConfig(configPath);
    const servers = doc['mcpServers'] && typeof doc['mcpServers'] === 'object'
      ? doc['mcpServers']
      : {};
    for (const [id, def] of Object.entries(servers)) {
      plugins[id] = {
        pluginId: id,
        name: id,
        version: '0.0.0',
        enabled: true,
        scope, // Adding non-standard scope property to help TUI/CLI differentiate
      } as any;
    }
  }
  return Object.values(plugins);
}`;

const mcpInstallFunc = `export async function mcpInstallPlugin(
  configPaths: string | Record<string, string>,
  pluginId: string,
  options?: PluginInstallOptions,
): Promise<InstalledPlugin> {
  if (!pluginId) throw new Error('pluginId is required');
  
  const paths = typeof configPaths === 'string' ? { global: configPaths } : configPaths;
  const scope = options?.global === false ? 'project' : 'global';
  const configPath = paths[scope] || paths['global'];
  if (!configPath) throw new Error('No config path available for scope: ' + scope);

  const doc = await readConfig(configPath);
  const servers = doc['mcpServers'] && typeof doc['mcpServers'] === 'object'
    ? { ...(doc['mcpServers']) }
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
}`;

const mcpUninstallFunc = `export async function mcpUninstallPlugin(
  configPaths: string | Record<string, string>,
  pluginId: string,
  options?: { global?: boolean },
): Promise<void> {
  const paths = typeof configPaths === 'string' ? { global: configPaths } : configPaths;
  
  // If no scope specified, check both, starting with project
  const scopes = options && options.global !== undefined 
    ? [options.global ? 'global' : 'project'] 
    : ['project', 'global'];

  for (const scope of scopes) {
    const configPath = paths[scope];
    if (!configPath) continue;
    
    const doc = await readConfig(configPath);
    const servers = doc['mcpServers'] && typeof doc['mcpServers'] === 'object'
      ? { ...(doc['mcpServers']) }
      : {};
    if (pluginId in servers) {
      delete servers[pluginId];
      doc['mcpServers'] = servers;
      await writeConfig(configPath, doc);
      // Remove from first matching scope only unless we want to clean all
      return;
    }
  }
}`;

// Replace the functions
mcpPlugins = mcpPlugins.replace(/export async function mcpListPlugins[\s\S]*?(?=export async function mcpInstallPlugin)/, mcpListFunc + '\n\n');
mcpPlugins = mcpPlugins.replace(/export async function mcpInstallPlugin[\s\S]*?(?=export async function mcpUninstallPlugin)/, mcpInstallFunc + '\n\n');
mcpPlugins = mcpPlugins.replace(/export async function mcpUninstallPlugin[\s\S]*?(?=$)/, mcpUninstallFunc + '\n');

fs.writeFileSync('packages/agent-mux/adapters/src/mcp-plugins.ts', mcpPlugins);

const adapters = ['claude', 'cursor', 'gemini', 'opencode', 'openclaw'];
for (const a of adapters) {
  const p = `packages/agent-mux/adapters/src/${a}-adapter.ts`;
  if (!fs.existsSync(p)) continue;
  let code = fs.readFileSync(p, 'utf8');

  // Inject findProjectRootSync if missing
  if (!code.includes('findProjectRootSync')) {
    code = code.replace(
      /(import\s*\{[\s\S]*?)(\}\s*from\s*'(?:\.\/)?session-fs\.js';)/,
      "$1  findProjectRootSync,\n$2"
    );
  }

  // Find agent name for the folder
  const agentNameMatch = code.match(/readonly agent = '([^']+)'/);
  const agentName = agentNameMatch ? agentNameMatch[1] : a;
  
  // Replace settingsPath logic
  code = code.replace(
    /private settingsPath\(\): string \{[\s\S]*?\n  \}/m,
    `private settingsPaths(): Record<string, string> {
    const HOME = os.homedir() || '.';
    return {
      global: path.join(HOME, '.${agentName}', 'settings.json'),
      project: path.join(findProjectRootSync(), '.${agentName}', 'settings.json'),
    };
  }`
  );
  code = code.replace(/private projectSettingsPath\(\): string \{[\s\S]*?\n  \}/m, '');

  code = code.replace(/this\.settingsPath\(\)/g, 'this.settingsPaths()');
  code = code.replace(/mcpListPlugins\(\[.*?\]\)/g, 'mcpListPlugins(this.settingsPaths())');

  fs.writeFileSync(p, code);
}
