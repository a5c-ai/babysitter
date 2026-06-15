import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const BABYSITTER_PLUGIN_NAME = 'babysitter';

export const BABYSITTER_MARKETPLACE_MANIFEST_PATHS = [
  '.claude-plugin/marketplace.json',
  '.cursor-plugin/marketplace.json',
  '.agents/plugins/marketplace.json',
  '.github/plugin/marketplace.json',
];

export function syncBabysitterMarketplaceManifestVersions(version, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const pluginName = options.pluginName ?? BABYSITTER_PLUGIN_NAME;
  const manifestPaths = options.manifestPaths ?? BABYSITTER_MARKETPLACE_MANIFEST_PATHS;
  const changedPaths = [];

  for (const relativePath of manifestPaths) {
    const fullPath = join(root, relativePath);
    if (!existsSync(fullPath)) {
      continue;
    }

    const manifest = JSON.parse(readFileSync(fullPath, 'utf8'));
    if (syncMarketplacePluginEntryVersion(manifest, pluginName, version)) {
      writeFileSync(fullPath, `${JSON.stringify(manifest, null, 2)}\n`);
      changedPaths.push(relativePath);
    }
  }

  return changedPaths;
}

export function syncMarketplacePluginEntryVersion(manifest, pluginName, version) {
  let changed = false;

  for (const entry of findMarketplacePluginEntries(manifest, pluginName)) {
    if (entry.version !== version) {
      entry.version = version;
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(entry, 'latestVersion') && entry.latestVersion !== version) {
      entry.latestVersion = version;
      changed = true;
    }
    if (Array.isArray(entry.versions) && !entry.versions.includes(version)) {
      entry.versions = [version, ...entry.versions.filter((existingVersion) => existingVersion !== version)];
      changed = true;
    }
  }

  return changed;
}

export function findMarketplacePluginEntries(manifest, pluginName) {
  const plugins = manifest?.plugins;
  if (Array.isArray(plugins)) {
    return plugins.filter((entry) => entry && typeof entry === 'object' && entry.name === pluginName);
  }
  if (plugins && typeof plugins === 'object') {
    const entry = plugins[pluginName];
    return entry && typeof entry === 'object' ? [entry] : [];
  }
  return [];
}
