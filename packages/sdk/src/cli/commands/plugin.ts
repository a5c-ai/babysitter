/**
 * plugin:* commands — Manage plugins and marketplaces.
 *
 * Marketplace commands:
 *   plugin:add-marketplace      --marketplace-url <url> [--global|--project] [--json]
 *   plugin:update-marketplace   --marketplace-name <name> [--global|--project] [--json]
 *   plugin:list-plugins         --marketplace-name <name> [--global|--project] [--json]
 *
 * Plugin commands:
 *   plugin:install, plugin:uninstall, plugin:update, plugin:configure,
 *   plugin:list-installed, plugin:update-registry, plugin:remove-from-registry
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  cloneMarketplace,
  updateMarketplace,
  listMarketplacePlugins,
  listMarketplaces,
  resolvePluginPackagePath,
  readMarketplaceManifest,
} from "../../plugins/marketplace";

import {
  readInstallInstructions,
  readUninstallInstructions,
  readConfigureInstructions,
} from "../../plugins/packageReader";

import { resolveMigrationChain } from "../../plugins/migrations";

import {
  readPluginRegistry,
  getPluginEntry,
  listPluginEntries,
  upsertPluginEntry,
  removePluginEntry,
  writePluginRegistry,
} from "../../plugins/registry";

import type {
  PluginScope,
  MarketplacePluginEntry,
  PluginRegistryEntry,
} from "../../plugins/types";

// ============================================================================
// Types
// ============================================================================

export interface PluginCommandArgs {
  pluginName?: string;
  marketplaceName?: string;
  marketplaceUrl?: string;
  marketplacePath?: string;
  marketplaceBranch?: string;
  pluginVersion?: string;
  scope?: "global" | "project";
  json: boolean;
  verbose?: boolean;
  runsDir?: string;
  force?: boolean;
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateScope(
  scope: string | undefined
): scope is PluginScope {
  return scope === "global" || scope === "project";
}

export function requireArg(
  value: string | undefined,
  name: string,
  command: string,
  json: boolean
): string | null {
  if (!value) {
    const msg = `[${command}] ${name} is required`;
    if (json) {
      console.log(JSON.stringify({ error: "missing_argument", message: msg }));
    } else {
      console.error(msg);
    }
    return null;
  }
  return value;
}

function requireScope(
  scope: string | undefined,
  command: string,
  json: boolean
): scope is PluginScope {
  if (!validateScope(scope)) {
    const msg = `[${command}] --global or --project is required`;
    if (json) {
      console.log(JSON.stringify({ error: "missing_argument", message: msg }));
    } else {
      console.error(msg);
    }
    return false;
  }
  return true;
}

/**
 * Resolves the marketplace name when not explicitly provided.
 * If only one marketplace is cloned for the given scope, returns its name.
 * Otherwise returns null (caller should require the flag).
 */
async function autoResolveMarketplace(
  scope: PluginScope,
  projectDir?: string
): Promise<string | null> {
  const marketplaces = await listMarketplaces(scope, projectDir);
  if (marketplaces.length === 1) {
    return marketplaces[0];
  }
  return null;
}

// ============================================================================
// Marketplace Handlers
// ============================================================================

/**
 * Clones a marketplace repository into the local marketplaces directory.
 *
 * Requires: marketplaceUrl, scope
 */
export async function handlePluginAddMarketplace(
  args: PluginCommandArgs
): Promise<number> {
  const { marketplaceUrl, marketplacePath, marketplaceBranch, scope, json, force } = args;

  const url = requireArg(
    marketplaceUrl,
    "--marketplace-url",
    "plugin:add-marketplace",
    json
  );
  if (!url) return 1;

  if (!requireScope(scope, "plugin:add-marketplace", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  try {
    const targetDir = await cloneMarketplace(marketplaceUrl!, scope, projectDir, marketplacePath, marketplaceBranch, force);

    if (json) {
      console.log(
        JSON.stringify(
          {
            success: true,
            url: marketplaceUrl,
            scope,
            directory: targetDir,
          },
          null,
          2
        )
      );
    } else {
      console.log(
        `Marketplace cloned successfully.\n  URL: ${marketplaceUrl}\n  Scope: ${scope}\n  Directory: ${targetDir}`
      );
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({ error: "clone_failed", message })
      );
    } else {
      console.error(`[plugin:add-marketplace] ${message}`);
    }
    return 1;
  }
}

/**
 * Updates a previously cloned marketplace by pulling latest changes.
 *
 * Requires: marketplaceName, scope
 */
export async function handlePluginUpdateMarketplace(
  args: PluginCommandArgs
): Promise<number> {
  const { marketplaceName, marketplaceBranch, scope, json } = args;

  const name = requireArg(
    marketplaceName,
    "--marketplace-name",
    "plugin:update-marketplace",
    json
  );
  if (!name) return 1;

  if (!requireScope(scope, "plugin:update-marketplace", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  try {
    await updateMarketplace(marketplaceName!, scope, projectDir, marketplaceBranch);

    if (json) {
      console.log(
        JSON.stringify(
          {
            success: true,
            marketplace: marketplaceName,
            scope,
            ...(marketplaceBranch ? { branch: marketplaceBranch } : {}),
          },
          null,
          2
        )
      );
    } else {
      const branchInfo = marketplaceBranch ? ` (branch: ${marketplaceBranch})` : "";
      console.log(
        `Marketplace "${marketplaceName}" updated successfully${branchInfo} (scope: ${scope}).`
      );
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({ error: "update_failed", message })
      );
    } else {
      console.error(`[plugin:update-marketplace] ${message}`);
    }
    return 1;
  }
}

/**
 * Lists all plugins available in a marketplace manifest.
 *
 * Requires: marketplaceName, scope
 */
export async function handlePluginListPlugins(
  args: PluginCommandArgs
): Promise<number> {
  const { scope, json } = args;
  let { marketplaceName } = args;

  if (!requireScope(scope, "plugin:list-plugins", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  // Auto-resolve marketplace when not provided and only one exists
  if (!marketplaceName) {
    marketplaceName = await autoResolveMarketplace(scope, projectDir) ?? undefined;
  }

  const name = requireArg(
    marketplaceName,
    "--marketplace-name",
    "plugin:list-plugins",
    json
  );
  if (!name) return 1;

  try {
    const plugins: MarketplacePluginEntry[] = await listMarketplacePlugins(
      marketplaceName!,
      scope,
      projectDir
    );

    if (json) {
      console.log(
        JSON.stringify(
          {
            marketplace: marketplaceName,
            scope,
            count: plugins.length,
            plugins,
          },
          null,
          2
        )
      );
    } else {
      if (plugins.length === 0) {
        console.log(
          `No plugins found in marketplace "${marketplaceName}" (scope: ${scope}).`
        );
      } else {
        console.log(
          `Plugins in marketplace "${marketplaceName}" (scope: ${scope}):\n`
        );
        const nameWidth = Math.max(
          ...plugins.map((p) => p.name.length),
          4
        );
        const versionWidth = Math.max(
          ...plugins.map((p) => p.latestVersion.length),
          7
        );
        console.log(
          `  ${"NAME".padEnd(nameWidth)}  ${"VERSION".padEnd(versionWidth)}  DESCRIPTION`
        );
        console.log(
          `  ${"─".repeat(nameWidth)}  ${"─".repeat(versionWidth)}  ${"─".repeat(40)}`
        );
        for (const plugin of plugins) {
          console.log(
            `  ${plugin.name.padEnd(nameWidth)}  ${plugin.latestVersion.padEnd(versionWidth)}  ${plugin.description}`
          );
        }
        console.log(`\n  ${plugins.length} plugin(s) available.`);
      }
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({ error: "list_failed", message })
      );
    } else {
      console.error(`[plugin:list-plugins] ${message}`);
    }
    return 1;
  }
}

// ============================================================================
// Plugin Handlers
// ============================================================================

/** Install a plugin from a marketplace. */
export async function handlePluginInstall(
  args: PluginCommandArgs
): Promise<number> {
  const { pluginName, marketplaceBranch, scope, pluginVersion, json } = args;
  let { marketplaceName } = args;

  const plugin = requireArg(pluginName, "--plugin-name", "plugin:install", json);
  if (!plugin) return 1;

  if (!requireScope(scope, "plugin:install", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  // Auto-resolve marketplace when not provided and only one exists
  if (!marketplaceName) {
    marketplaceName = await autoResolveMarketplace(scope, projectDir) ?? undefined;
  }

  const marketplace = requireArg(
    marketplaceName,
    "--marketplace-name",
    "plugin:install",
    json
  );
  if (!marketplace) return 1;

  try {
    // Update marketplace to ensure latest (and optionally switch branch)
    await updateMarketplace(marketplaceName!, scope, projectDir, marketplaceBranch);

    // Determine version: use provided or read latestVersion from manifest
    let version = pluginVersion;
    if (!version) {
      const manifest = await readMarketplaceManifest(
        marketplaceName!,
        scope,
        projectDir
      );
      const entry = manifest.plugins[pluginName!];
      if (!entry) {
        throw new Error(
          `Plugin "${pluginName}" not found in marketplace "${marketplaceName}"`
        );
      }
      version = entry.latestVersion;
    }

    // Resolve the plugin package path
    const packagePath = await resolvePluginPackagePath(
      marketplaceName!,
      pluginName!,
      scope,
      projectDir
    );

    // Read install instructions
    const instructions = await readInstallInstructions(packagePath);

    // Check for install-process.js
    const processFilePath = path.join(packagePath, "install-process.js");
    let processFile: string | null = null;
    try {
      await fs.access(processFilePath);
      processFile = processFilePath;
    } catch {
      // No install-process.js is fine
    }

    const result = {
      plugin: pluginName,
      version,
      marketplace: marketplaceName,
      scope,
      instructions: instructions ?? null,
      processFile,
    };

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Plugin: ${pluginName} v${version}`);
      console.log(`Marketplace: ${marketplaceName}`);
      console.log(`Scope: ${scope}`);
      if (instructions) {
        console.log(`\nInstall Instructions:\n${instructions}`);
      } else {
        console.log("\nNo install instructions found.");
      }
      if (processFile) {
        console.log(`\nInstall process file: ${processFile}`);
      }
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({ error: "install_failed", message })
      );
    } else {
      console.error(`[plugin:install] ${message}`);
    }
    return 1;
  }
}

/** Uninstall a previously installed plugin. */
export async function handlePluginUninstall(
  args: PluginCommandArgs
): Promise<number> {
  const { pluginName, scope, json } = args;

  const plugin = requireArg(
    pluginName,
    "--plugin-name",
    "plugin:uninstall",
    json
  );
  if (!plugin) return 1;

  if (!requireScope(scope, "plugin:uninstall", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  try {
    // Read the registry to find the installed plugin
    const registry = await readPluginRegistry(scope, projectDir);
    const entry = getPluginEntry(registry, pluginName!);
    if (!entry) {
      throw new Error(
        `Plugin "${pluginName}" is not installed in the ${scope} registry`
      );
    }

    const { marketplace, version } = entry;

    // Resolve the plugin package path from the marketplace
    const packagePath = await resolvePluginPackagePath(
      marketplace,
      pluginName!,
      scope,
      projectDir
    );

    // Read uninstall instructions
    const instructions = await readUninstallInstructions(packagePath);

    // Check for uninstall-process.js
    const processFilePath = path.join(packagePath, "uninstall-process.js");
    let processFile: string | null = null;
    try {
      await fs.access(processFilePath);
      processFile = processFilePath;
    } catch {
      // No uninstall-process.js is fine
    }

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
      if (instructions) {
        console.log(`\nUninstall Instructions:\n${instructions}`);
      } else {
        console.log("\nNo uninstall instructions found.");
      }
      if (processFile) {
        console.log(`\nUninstall process file: ${processFile}`);
      }
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({ error: "uninstall_failed", message })
      );
    } else {
      console.error(`[plugin:uninstall] ${message}`);
    }
    return 1;
  }
}

/** Update an installed plugin to a newer version. */
export async function handlePluginUpdate(
  args: PluginCommandArgs
): Promise<number> {
  const { pluginName, marketplaceBranch, scope, pluginVersion, json } = args;
  let { marketplaceName } = args;

  const plugin = requireArg(pluginName, "--plugin-name", "plugin:update", json);
  if (!plugin) return 1;

  if (!requireScope(scope, "plugin:update", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  // Auto-resolve marketplace when not provided and only one exists
  if (!marketplaceName) {
    marketplaceName = await autoResolveMarketplace(scope, projectDir) ?? undefined;
  }

  const marketplace = requireArg(
    marketplaceName,
    "--marketplace-name",
    "plugin:update",
    json
  );
  if (!marketplace) return 1;

  try {
    // Read registry to get currently installed version
    const registry = await readPluginRegistry(scope, projectDir);
    const entry = getPluginEntry(registry, pluginName!);
    if (!entry) {
      throw new Error(
        `Plugin "${pluginName}" is not installed in the ${scope} registry`
      );
    }
    const installedVersion = entry.version;

    // Update marketplace to get latest (and optionally switch branch)
    await updateMarketplace(marketplaceName!, scope, projectDir, marketplaceBranch);

    // Determine target version
    let targetVersion = pluginVersion;
    if (!targetVersion) {
      const manifest = await readMarketplaceManifest(
        marketplaceName!,
        scope,
        projectDir
      );
      const manifestEntry = manifest.plugins[pluginName!];
      if (!manifestEntry) {
        throw new Error(
          `Plugin "${pluginName}" not found in marketplace "${marketplaceName}"`
        );
      }
      targetVersion = manifestEntry.latestVersion;
    }

    if (installedVersion === targetVersion) {
      const result = {
        plugin: pluginName,
        fromVersion: installedVersion,
        toVersion: targetVersion,
        migrations: [],
        message: "Already at target version",
      };
      if (json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(
          `Plugin "${pluginName}" is already at version ${targetVersion}.`
        );
      }
      return 0;
    }

    // Resolve the plugin package path
    const packagePath = await resolvePluginPackagePath(
      marketplaceName!,
      pluginName!,
      scope,
      projectDir
    );

    // Resolve migration chain
    const chain = await resolveMigrationChain(
      packagePath,
      installedVersion,
      targetVersion
    );

    if (!chain) {
      throw new Error(
        `No migration path found from version "${installedVersion}" to "${targetVersion}" for plugin "${pluginName}"`
      );
    }

    const migrations = chain.map(({ descriptor, content }) => ({
      from: descriptor.from,
      to: descriptor.to,
      file: descriptor.file,
      type: descriptor.type,
      instructions: content,
      processFile:
        descriptor.type === "js"
          ? path.join(packagePath, "migrations", descriptor.file)
          : null,
    }));

    const result = {
      plugin: pluginName,
      fromVersion: installedVersion,
      toVersion: targetVersion,
      marketplace: marketplaceName,
      scope,
      migrations,
    };

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(
        `Plugin: ${pluginName}\nFrom: ${installedVersion} → To: ${targetVersion}`
      );
      console.log(`Migration steps: ${migrations.length}`);
      for (const m of migrations) {
        console.log(`\n--- ${m.from} → ${m.to} (${m.file}) ---`);
        console.log(m.instructions);
        if (m.processFile) {
          console.log(`Process file: ${m.processFile}`);
        }
      }
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({ error: "update_failed", message })
      );
    } else {
      console.error(`[plugin:update] ${message}`);
    }
    return 1;
  }
}

/** Configure an installed plugin. */
export async function handlePluginConfigure(
  args: PluginCommandArgs
): Promise<number> {
  const { pluginName, scope, json } = args;
  let { marketplaceName } = args;

  const plugin = requireArg(
    pluginName,
    "--plugin-name",
    "plugin:configure",
    json
  );
  if (!plugin) return 1;

  if (!requireScope(scope, "plugin:configure", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  // Auto-resolve marketplace when not provided and only one exists
  if (!marketplaceName) {
    marketplaceName = await autoResolveMarketplace(scope, projectDir) ?? undefined;
  }

  const marketplace = requireArg(
    marketplaceName,
    "--marketplace-name",
    "plugin:configure",
    json
  );
  if (!marketplace) return 1;

  try {
    // Resolve plugin package path
    const packagePath = await resolvePluginPackagePath(
      marketplaceName!,
      pluginName!,
      scope,
      projectDir
    );

    // Read configure instructions
    const instructions = await readConfigureInstructions(packagePath);

    // Check for configure-process.js
    const processFilePath = path.join(packagePath, "configure-process.js");
    let processFile: string | null = null;
    try {
      await fs.access(processFilePath);
      processFile = processFilePath;
    } catch {
      // No configure-process.js is fine
    }

    const result = {
      plugin: pluginName,
      marketplace: marketplaceName,
      scope,
      instructions: instructions ?? null,
      processFile,
    };

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Plugin: ${pluginName}`);
      console.log(`Marketplace: ${marketplaceName}`);
      console.log(`Scope: ${scope}`);
      if (instructions) {
        console.log(`\nConfigure Instructions:\n${instructions}`);
      } else {
        console.log("\nNo configure instructions found.");
      }
      if (processFile) {
        console.log(`\nConfigure process file: ${processFile}`);
      }
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({ error: "configure_failed", message })
      );
    } else {
      console.error(`[plugin:configure] ${message}`);
    }
    return 1;
  }
}

/** List all installed plugins from the registry. */
export async function handlePluginListInstalled(
  args: PluginCommandArgs
): Promise<number> {
  const { scope, json } = args;

  if (!requireScope(scope, "plugin:list-installed", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  try {
    const registry = await readPluginRegistry(scope, projectDir);
    const entries = listPluginEntries(registry);

    if (json) {
      console.log(
        JSON.stringify(
          entries.map((e) => ({
            name: e.name,
            version: e.version,
            marketplace: e.marketplace,
            installedAt: e.installedAt,
            updatedAt: e.updatedAt,
          })),
          null,
          2
        )
      );
    } else {
      if (entries.length === 0) {
        console.log(
          `No plugins installed (scope: ${scope}).`
        );
      } else {
        console.log(`Installed plugins (scope: ${scope}):\n`);
        const nameWidth = Math.max(
          ...entries.map((e) => e.name.length),
          4
        );
        const versionWidth = Math.max(
          ...entries.map((e) => e.version.length),
          7
        );
        const marketplaceWidth = Math.max(
          ...entries.map((e) => e.marketplace.length),
          11
        );
        console.log(
          `  ${"NAME".padEnd(nameWidth)}  ${"VERSION".padEnd(versionWidth)}  ${"MARKETPLACE".padEnd(marketplaceWidth)}  INSTALLED`
        );
        console.log(
          `  ${"─".repeat(nameWidth)}  ${"─".repeat(versionWidth)}  ${"─".repeat(marketplaceWidth)}  ${"─".repeat(20)}`
        );
        for (const entry of entries) {
          console.log(
            `  ${entry.name.padEnd(nameWidth)}  ${entry.version.padEnd(versionWidth)}  ${entry.marketplace.padEnd(marketplaceWidth)}  ${entry.installedAt}`
          );
        }
        console.log(`\n  ${entries.length} plugin(s) installed.`);
      }
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({ error: "list_failed", message })
      );
    } else {
      console.error(`[plugin:list-installed] ${message}`);
    }
    return 1;
  }
}

/** Update the plugin registry entry for a plugin. */
export async function handlePluginUpdateRegistry(
  args: PluginCommandArgs
): Promise<number> {
  const { pluginName, pluginVersion, marketplaceName, scope, json } = args;

  const plugin = requireArg(
    pluginName,
    "--plugin-name",
    "plugin:update-registry",
    json
  );
  if (!plugin) return 1;

  const version = requireArg(
    pluginVersion,
    "--plugin-version",
    "plugin:update-registry",
    json
  );
  if (!version) return 1;

  const marketplace = requireArg(
    marketplaceName,
    "--marketplace-name",
    "plugin:update-registry",
    json
  );
  if (!marketplace) return 1;

  if (!requireScope(scope, "plugin:update-registry", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  try {
    const registry = await readPluginRegistry(scope, projectDir);

    // Try to resolve the plugin package path, but don't fail if marketplace is unavailable
    let packagePath = "";
    try {
      packagePath = await resolvePluginPackagePath(
        marketplaceName!,
        pluginName!,
        scope,
        projectDir
      );
    } catch {
      // Marketplace may not exist or plugin may not be listed yet — that's OK
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

    const updatedRegistry = upsertPluginEntry(registry, entry);
    await writePluginRegistry(updatedRegistry, scope, projectDir);

    if (json) {
      console.log(JSON.stringify(entry, null, 2));
    } else {
      console.log(
        `Plugin ${pluginName}@${pluginVersion} registered (marketplace: ${marketplaceName})`
      );
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({
          error: "update_registry_failed",
          message,
        })
      );
    } else {
      console.error(`[plugin:update-registry] ${message}`);
    }
    return 1;
  }
}

/** Remove a plugin entry from the registry. */
export async function handlePluginRemoveFromRegistry(
  args: PluginCommandArgs
): Promise<number> {
  const { pluginName, scope, json } = args;

  const plugin = requireArg(
    pluginName,
    "--plugin-name",
    "plugin:remove-from-registry",
    json
  );
  if (!plugin) return 1;

  if (!requireScope(scope, "plugin:remove-from-registry", json)) return 1;

  const projectDir = scope === "project" ? process.cwd() : undefined;

  try {
    const registry = await readPluginRegistry(scope, projectDir);
    const updatedRegistry = removePluginEntry(registry, pluginName!);
    await writePluginRegistry(updatedRegistry, scope, projectDir);

    if (json) {
      console.log(
        JSON.stringify({ removed: true, plugin: pluginName }, null, 2)
      );
    } else {
      console.log(`Plugin ${pluginName} removed from registry`);
    }
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(
        JSON.stringify({
          error: "remove_failed",
          message,
        })
      );
    } else {
      console.error(`[plugin:remove-from-registry] ${message}`);
    }
    return 1;
  }
}
