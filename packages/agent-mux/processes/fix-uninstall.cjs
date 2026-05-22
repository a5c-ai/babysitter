const fs = require('fs');

const replaceInFile = (file, search, replace) => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, content.replace(search, replace));
};

replaceInFile('packages/agent-mux/core/src/plugin-manager.ts',
  'uninstall(agent: AgentName, pluginId: string): Promise<void>;',
  'uninstall(agent: AgentName, pluginId: string, options?: { global?: boolean }): Promise<void>;');

replaceInFile('packages/agent-mux/core/src/plugin-manager-impl.ts',
  'async uninstall(agent: AgentName, pluginId: string): Promise<void> {',
  'async uninstall(agent: AgentName, pluginId: string, options?: { global?: boolean }): Promise<void> {');

replaceInFile('packages/agent-mux/core/src/plugin-manager-impl.ts',
  'await adapter.uninstallPlugin(pluginId);',
  'await adapter.uninstallPlugin(pluginId, options);');

replaceInFile('packages/agent-mux/core/src/adapter.ts',
  'uninstallPlugin?(pluginId: string): Promise<void>;',
  'uninstallPlugin?(pluginId: string, options?: { global?: boolean }): Promise<void>;');

replaceInFile('packages/agent-mux/core/src/adapter-types.ts',
  'uninstallPlugin?(pluginId: string): Promise<void>;',
  'uninstallPlugin?(pluginId: string, options?: { global?: boolean }): Promise<void>;');

const adapters = fs.readdirSync('packages/agent-mux/adapters/src').filter(f => f.endsWith('-adapter.ts'));
for (const a of adapters) {
  let code = fs.readFileSync(`packages/agent-mux/adapters/src/${a}`, 'utf8');
  
  code = code.replace(
    /async uninstallPlugin\(pluginId: string\): Promise<void> \{/,
    'async uninstallPlugin(pluginId: string, options?: { global?: boolean }): Promise<void> {'
  );
  
  code = code.replace(
    /mcpUninstallPlugin\(this\.settingsPaths\(\), pluginId\)/,
    'mcpUninstallPlugin(this.settingsPaths(), pluginId, options)'
  );

  fs.writeFileSync(`packages/agent-mux/adapters/src/${a}`, code);
}
