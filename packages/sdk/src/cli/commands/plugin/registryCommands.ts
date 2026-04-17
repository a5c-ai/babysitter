import { resolvePluginPackagePath } from '../../../plugins/marketplace';
import {
  getPluginEntry,
  listPluginEntries,
  readPluginRegistry,
  removePluginEntry,
  upsertPluginEntry,
  writePluginRegistry,
} from '../../../plugins/registry';
import type { PluginRegistryEntry } from '../../../plugins/types';
import {
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

export async function handlePluginListInstalled(args: PluginCommandArgs): Promise<number> {
  const { scope, json } = args;
  if (!requireScope(scope, 'plugin:list-installed', json)) {
    return 1;
  }

  try {
    const entries = listPluginEntries(await readPluginRegistry(scope, getProjectDir(scope)));
    if (json) {
      console.log(JSON.stringify(entries.map((entry) => ({
        name: entry.name,
        version: entry.version,
        marketplace: entry.marketplace,
        installedAt: entry.installedAt,
        updatedAt: entry.updatedAt,
      })), null, 2));
    } else if (entries.length === 0) {
      console.log(`No plugins installed (scope: ${scope}).`);
    } else {
      console.log(`Installed plugins (scope: ${scope}):\n`);
      const nameWidth = Math.max(...entries.map((entry) => entry.name.length), 4);
      const versionWidth = Math.max(...entries.map((entry) => entry.version.length), 7);
      const marketplaceWidth = Math.max(...entries.map((entry) => entry.marketplace.length), 11);
      console.log(`  ${'NAME'.padEnd(nameWidth)}  ${'VERSION'.padEnd(versionWidth)}  ${'MARKETPLACE'.padEnd(marketplaceWidth)}  INSTALLED`);
      console.log(`  ${'─'.repeat(nameWidth)}  ${'─'.repeat(versionWidth)}  ${'─'.repeat(marketplaceWidth)}  ${'─'.repeat(20)}`);
      for (const entry of entries) {
        console.log(`  ${entry.name.padEnd(nameWidth)}  ${entry.version.padEnd(versionWidth)}  ${entry.marketplace.padEnd(marketplaceWidth)}  ${entry.installedAt}`);
      }
      console.log(`\n  ${entries.length} plugin(s) installed.`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:list-installed', json, 'list_failed', message);
  }
}

export async function handlePluginUpdateRegistry(args: PluginCommandArgs): Promise<number> {
  const { pluginName, pluginVersion, marketplaceName, scope, json } = args;
  const plugin = requireArg(pluginName, '--plugin-name', 'plugin:update-registry', json);
  const version = requireArg(pluginVersion, '--plugin-version', 'plugin:update-registry', json);
  const marketplace = requireArg(marketplaceName, '--marketplace-name', 'plugin:update-registry', json);
  if (!plugin || !version || !marketplace) {
    return 1;
  }
  if (!requireScope(scope, 'plugin:update-registry', json)) {
    return 1;
  }

  const projectDir = getProjectDir(scope);
  try {
    const registry = await readPluginRegistry(scope, projectDir);
    let packagePath = '';
    try {
      packagePath = await resolvePluginPackagePath(marketplaceName!, pluginName!, scope, projectDir);
    } catch {
      // Registry updates can precede marketplace availability.
    }

    const now = new Date().toISOString();
    const existingEntry = getPluginEntry(registry, pluginName!);
    const entry: PluginRegistryEntry = {
      name: pluginName!,
      version: pluginVersion!,
      marketplace: marketplaceName!,
      scope,
      installedAt: existingEntry?.installedAt ?? now,
      updatedAt: now,
      packagePath,
      metadata: existingEntry?.metadata ?? {},
    };

    await writePluginRegistry(upsertPluginEntry(registry, entry), scope, projectDir);
    if (json) {
      console.log(JSON.stringify(entry, null, 2));
    } else {
      console.log(`Plugin ${pluginName}@${pluginVersion} registered (marketplace: ${marketplaceName})`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:update-registry', json, 'update_registry_failed', message);
  }
}

export async function handlePluginRemoveFromRegistry(args: PluginCommandArgs): Promise<number> {
  const { pluginName, scope, json } = args;
  const plugin = requireArg(pluginName, '--plugin-name', 'plugin:remove-from-registry', json);
  if (!plugin) {
    return 1;
  }
  if (!requireScope(scope, 'plugin:remove-from-registry', json)) {
    return 1;
  }

  try {
    const projectDir = getProjectDir(scope);
    const registry = await readPluginRegistry(scope, projectDir);
    await writePluginRegistry(removePluginEntry(registry, pluginName!), scope, projectDir);
    if (json) {
      console.log(JSON.stringify({ removed: true, plugin: pluginName }, null, 2));
    } else {
      console.log(`Plugin ${pluginName} removed from registry`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:remove-from-registry', json, 'remove_failed', message);
  }
}
