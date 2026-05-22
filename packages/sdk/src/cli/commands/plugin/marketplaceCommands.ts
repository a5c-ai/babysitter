import {
  cloneMarketplace,
  listMarketplacePlugins,
  updateMarketplace,
} from '../../../plugins/marketplace';
import type { MarketplacePluginEntry } from '../../../plugins/types';
import {
  autoResolveMarketplace,
  getProjectDir,
  requireArg,
  requireScope,
  type PluginCommandArgs,
} from './shared';

function emitError(command: string, json: boolean, error: string, message: string): number {
  if (json) {
    console.log(JSON.stringify({ error, message }));
  } else {
    console.error(`[${command}] ${message}`);
  }
  return 1;
}

function printPluginTable(
  scope: 'global' | 'project',
  marketplaceName: string,
  plugins: MarketplacePluginEntry[],
): void {
  if (plugins.length === 0) {
    console.log(`No plugins found in marketplace "${marketplaceName}" (scope: ${scope}).`);
    return;
  }

  console.log(`Plugins in marketplace "${marketplaceName}" (scope: ${scope}):\n`);
  const nameWidth = Math.max(...plugins.map((plugin) => plugin.name.length), 4);
  const versionWidth = Math.max(...plugins.map((plugin) => plugin.latestVersion.length), 7);
  console.log(`  ${'NAME'.padEnd(nameWidth)}  ${'VERSION'.padEnd(versionWidth)}  DESCRIPTION`);
  console.log(`  ${'─'.repeat(nameWidth)}  ${'─'.repeat(versionWidth)}  ${'─'.repeat(40)}`);
  for (const plugin of plugins) {
    console.log(`  ${plugin.name.padEnd(nameWidth)}  ${plugin.latestVersion.padEnd(versionWidth)}  ${plugin.description}`);
  }
  console.log(`\n  ${plugins.length} plugin(s) available.`);
}

export async function handlePluginAddMarketplace(args: PluginCommandArgs): Promise<number> {
  const { marketplaceUrl, marketplacePath, marketplaceBranch, scope, json, force } = args;
  const url = requireArg(marketplaceUrl, '--marketplace-url', 'plugin:add-marketplace', json);
  if (!url) {
    return 1;
  }
  if (!requireScope(scope, 'plugin:add-marketplace', json)) {
    return 1;
  }

  try {
    const directory = await cloneMarketplace(
      marketplaceUrl!,
      scope,
      getProjectDir(scope),
      marketplacePath,
      marketplaceBranch,
      force,
    );
    if (json) {
      console.log(JSON.stringify({ success: true, url: marketplaceUrl, scope, directory }, null, 2));
    } else {
      console.log(`Marketplace cloned successfully.\n  URL: ${marketplaceUrl}\n  Scope: ${scope}\n  Directory: ${directory}`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:add-marketplace', json, 'clone_failed', message);
  }
}

export async function handlePluginUpdateMarketplace(args: PluginCommandArgs): Promise<number> {
  const { marketplaceName, marketplaceBranch, scope, json } = args;
  const name = requireArg(marketplaceName, '--marketplace-name', 'plugin:update-marketplace', json);
  if (!name) {
    return 1;
  }
  if (!requireScope(scope, 'plugin:update-marketplace', json)) {
    return 1;
  }

  try {
    await updateMarketplace(marketplaceName!, scope, getProjectDir(scope), marketplaceBranch);
    if (json) {
      console.log(JSON.stringify({
        success: true,
        marketplace: marketplaceName,
        scope,
        ...(marketplaceBranch ? { branch: marketplaceBranch } : {}),
      }, null, 2));
    } else {
      const branchInfo = marketplaceBranch ? ` (branch: ${marketplaceBranch})` : '';
      console.log(`Marketplace "${marketplaceName}" updated successfully${branchInfo} (scope: ${scope}).`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:update-marketplace', json, 'update_failed', message);
  }
}

export async function handlePluginListPlugins(args: PluginCommandArgs): Promise<number> {
  const { scope, json } = args;
  let { marketplaceName } = args;
  if (!requireScope(scope, 'plugin:list-plugins', json)) {
    return 1;
  }

  const projectDir = getProjectDir(scope);
  if (!marketplaceName) {
    marketplaceName = await autoResolveMarketplace(scope, projectDir) ?? undefined;
  }

  const name = requireArg(marketplaceName, '--marketplace-name', 'plugin:list-plugins', json);
  if (!name) {
    return 1;
  }

  try {
    const plugins = await listMarketplacePlugins(marketplaceName!, scope, projectDir);
    if (json) {
      console.log(JSON.stringify({ marketplace: marketplaceName, scope, count: plugins.length, plugins }, null, 2));
    } else {
      printPluginTable(scope, marketplaceName!, plugins);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:list-plugins', json, 'list_failed', message);
  }
}
