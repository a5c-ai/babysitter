import { promises as fs } from 'node:fs';
import path from 'node:path';
import { resolveMigrationChain } from '../../../plugins/migrations';
import {
  readConfigureInstructions,
  readInstallInstructions,
  readUninstallInstructions,
} from '../../../plugins/packageReader';
import {
  readMarketplaceManifest,
  resolvePluginPackagePath,
  updateMarketplace,
} from '../../../plugins/marketplace';
import { getPluginEntry, readPluginRegistry } from '../../../plugins/registry';
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

async function findOptionalProcessFile(packagePath: string, filename: string): Promise<string | null> {
  const processFilePath = path.join(packagePath, filename);
  try {
    await fs.access(processFilePath);
    return processFilePath;
  } catch {
    return null;
  }
}

async function resolveMarketplaceName(args: PluginCommandArgs, command: string): Promise<string | null> {
  const { scope, json } = args;
  let { marketplaceName } = args;
  if (!requireScope(scope, command, json)) {
    return null;
  }
  if (!marketplaceName) {
    marketplaceName = await autoResolveMarketplace(scope, getProjectDir(scope)) ?? undefined;
  }
  return requireArg(marketplaceName, '--marketplace-name', command, json);
}

export async function handlePluginInstall(args: PluginCommandArgs): Promise<number> {
  const { pluginName, marketplaceBranch, scope, pluginVersion, json } = args;
  const plugin = requireArg(pluginName, '--plugin-name', 'plugin:install', json);
  if (!plugin) {
    return 1;
  }

  const marketplace = await resolveMarketplaceName(args, 'plugin:install');
  if (!marketplace || !scope) {
    return 1;
  }

  const projectDir = getProjectDir(scope);
  try {
    await updateMarketplace(marketplace, scope, projectDir, marketplaceBranch);
    let version = pluginVersion;
    if (!version) {
      const manifest = await readMarketplaceManifest(marketplace, scope, projectDir);
      const entry = manifest.plugins[pluginName!];
      if (!entry) {
        throw new Error(`Plugin "${pluginName}" not found in marketplace "${marketplace}"`);
      }
      version = entry.latestVersion;
    }

    const packagePath = await resolvePluginPackagePath(marketplace, pluginName!, scope, projectDir);
    const instructions = await readInstallInstructions(packagePath);
    const processFile = await findOptionalProcessFile(packagePath, 'install-process.js');
    const result = {
      plugin: pluginName,
      version,
      marketplace,
      scope,
      instructions: instructions ?? null,
      processFile,
    };

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Plugin: ${pluginName} v${version}`);
      console.log(`Marketplace: ${marketplace}`);
      console.log(`Scope: ${scope}`);
      console.log(instructions ? `\nInstall Instructions:\n${instructions}` : '\nNo install instructions found.');
      if (processFile) {
        console.log(`\nInstall process file: ${processFile}`);
      }
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:install', json, 'install_failed', message);
  }
}

export async function handlePluginUninstall(args: PluginCommandArgs): Promise<number> {
  const { pluginName, scope, json } = args;
  const plugin = requireArg(pluginName, '--plugin-name', 'plugin:uninstall', json);
  if (!plugin) {
    return 1;
  }
  if (!requireScope(scope, 'plugin:uninstall', json)) {
    return 1;
  }

  const projectDir = getProjectDir(scope);
  try {
    const registry = await readPluginRegistry(scope, projectDir);
    const entry = getPluginEntry(registry, pluginName!);
    if (!entry) {
      throw new Error(`Plugin "${pluginName}" is not installed in the ${scope} registry`);
    }

    const packagePath = await resolvePluginPackagePath(entry.marketplace, pluginName!, scope, projectDir);
    const instructions = await readUninstallInstructions(packagePath);
    const processFile = await findOptionalProcessFile(packagePath, 'uninstall-process.js');
    const result = {
      plugin: pluginName,
      version: entry.version,
      marketplace: entry.marketplace,
      scope,
      instructions: instructions ?? null,
      processFile,
    };

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Plugin: ${pluginName} v${entry.version}`);
      console.log(`Marketplace: ${entry.marketplace}`);
      console.log(`Scope: ${scope}`);
      console.log(instructions ? `\nUninstall Instructions:\n${instructions}` : '\nNo uninstall instructions found.');
      if (processFile) {
        console.log(`\nUninstall process file: ${processFile}`);
      }
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:uninstall', json, 'uninstall_failed', message);
  }
}

export async function handlePluginUpdate(args: PluginCommandArgs): Promise<number> {
  const { pluginName, marketplaceBranch, scope, pluginVersion, json } = args;
  const plugin = requireArg(pluginName, '--plugin-name', 'plugin:update', json);
  if (!plugin) {
    return 1;
  }

  const marketplace = await resolveMarketplaceName(args, 'plugin:update');
  if (!marketplace || !scope) {
    return 1;
  }

  const projectDir = getProjectDir(scope);
  try {
    const registry = await readPluginRegistry(scope, projectDir);
    const entry = getPluginEntry(registry, pluginName!);
    if (!entry) {
      throw new Error(`Plugin "${pluginName}" is not installed in the ${scope} registry`);
    }

    await updateMarketplace(marketplace, scope, projectDir, marketplaceBranch);
    let targetVersion = pluginVersion;
    if (!targetVersion) {
      const manifest = await readMarketplaceManifest(marketplace, scope, projectDir);
      const manifestEntry = manifest.plugins[pluginName!];
      if (!manifestEntry) {
        throw new Error(`Plugin "${pluginName}" not found in marketplace "${marketplace}"`);
      }
      targetVersion = manifestEntry.latestVersion;
    }

    if (entry.version === targetVersion) {
      const result = {
        plugin: pluginName,
        fromVersion: entry.version,
        toVersion: targetVersion,
        migrations: [],
        message: 'Already at target version',
      };
      if (json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Plugin "${pluginName}" is already at version ${targetVersion}.`);
      }
      return 0;
    }

    const packagePath = await resolvePluginPackagePath(marketplace, pluginName!, scope, projectDir);
    const chain = await resolveMigrationChain(packagePath, entry.version, targetVersion);
    if (!chain) {
      throw new Error(`No migration path found from version "${entry.version}" to "${targetVersion}" for plugin "${pluginName}"`);
    }

    const migrations = chain.map(({ descriptor, content }) => ({
      from: descriptor.from,
      to: descriptor.to,
      file: descriptor.file,
      type: descriptor.type,
      instructions: content,
      processFile: descriptor.type === 'js' ? path.join(packagePath, 'migrations', descriptor.file) : null,
    }));

    const result = {
      plugin: pluginName,
      fromVersion: entry.version,
      toVersion: targetVersion,
      marketplace,
      scope,
      migrations,
    };

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Plugin: ${pluginName}\nFrom: ${entry.version} → To: ${targetVersion}`);
      console.log(`Migration steps: ${migrations.length}`);
      for (const migration of migrations) {
        console.log(`\n--- ${migration.from} → ${migration.to} (${migration.file}) ---`);
        console.log(migration.instructions);
        if (migration.processFile) {
          console.log(`Process file: ${migration.processFile}`);
        }
      }
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:update', json, 'update_failed', message);
  }
}

export async function handlePluginConfigure(args: PluginCommandArgs): Promise<number> {
  const { pluginName, scope, json } = args;
  const plugin = requireArg(pluginName, '--plugin-name', 'plugin:configure', json);
  if (!plugin) {
    return 1;
  }

  const marketplace = await resolveMarketplaceName(args, 'plugin:configure');
  if (!marketplace || !scope) {
    return 1;
  }

  const projectDir = getProjectDir(scope);
  try {
    const packagePath = await resolvePluginPackagePath(marketplace, pluginName!, scope, projectDir);
    const instructions = await readConfigureInstructions(packagePath);
    const processFile = await findOptionalProcessFile(packagePath, 'configure-process.js');
    const result = {
      plugin: pluginName,
      marketplace,
      scope,
      instructions: instructions ?? null,
      processFile,
    };

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Plugin: ${pluginName}`);
      console.log(`Marketplace: ${marketplace}`);
      console.log(`Scope: ${scope}`);
      console.log(instructions ? `\nConfigure Instructions:\n${instructions}` : '\nNo configure instructions found.');
      if (processFile) {
        console.log(`\nConfigure process file: ${processFile}`);
      }
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return emitError('plugin:configure', json, 'configure_failed', message);
  }
}
