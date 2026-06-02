/**
 * PluginLoader — lifecycle manager for plugin instances.
 *
 * Tracks loaded plugins, validates manifests on load, and manages
 * status transitions (loading -> loaded | error, unloading, reloading).
 */

import type { PluginManifest, PluginInstance, PluginPermission } from './types';

/** Set of all valid permission strings used for manifest validation. */
const VALID_PERMISSIONS: Set<PluginPermission> = new Set([
  'fs:read',
  'fs:write',
  'net:outbound',
  'process:spawn',
  'env:read',
  'mcp:connect',
  'shell:execute',
]);

export class PluginLoader {
  private plugins = new Map<string, PluginInstance>();

  // ---------------------------------------------------------------------------
  // Load / Unload / Reload
  // ---------------------------------------------------------------------------

  /**
   * Load a plugin from its manifest.
   *
   * Validates required fields and permissions before transitioning the
   * instance to `loaded`. If validation fails the instance is stored with
   * status `error` and the error message is attached.
   */
  load(manifest: PluginManifest): PluginInstance {
    // Validate required fields
    const issues: string[] = [];
    if (!manifest.id) issues.push('missing id');
    if (!manifest.name) issues.push('missing name');
    if (!manifest.version) issues.push('missing version');
    if (!manifest.entrypoint) issues.push('missing entrypoint');

    if (!Array.isArray(manifest.permissions)) {
      issues.push('permissions must be an array');
    } else {
      for (const perm of manifest.permissions) {
        if (!VALID_PERMISSIONS.has(perm)) {
          issues.push(`unknown permission: ${perm}`);
        }
      }
    }

    if (issues.length > 0) {
      const instance: PluginInstance = {
        manifest,
        status: 'error',
        error: `Manifest validation failed: ${issues.join('; ')}`,
      };
      this.plugins.set(manifest.id, instance);
      return instance;
    }

    const instance: PluginInstance = {
      manifest,
      status: 'loaded',
      loadedAt: Date.now(),
    };
    this.plugins.set(manifest.id, instance);
    return instance;
  }

  /**
   * Unload a plugin by id.
   *
   * Sets status to `unloaded`. Returns `true` if the plugin existed,
   * `false` otherwise.
   */
  unload(pluginId: string): boolean {
    const instance = this.plugins.get(pluginId);
    if (!instance) return false;

    instance.status = 'unloaded';
    instance.loadedAt = undefined;
    instance.error = undefined;
    return true;
  }

  /**
   * Reload a plugin by re-loading from the existing manifest.
   * Returns the new instance, or `undefined` if the plugin was not found.
   */
  reload(pluginId: string): PluginInstance | undefined {
    const existing = this.plugins.get(pluginId);
    if (!existing) return undefined;

    this.unload(pluginId);
    return this.load(existing.manifest);
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /** Return all tracked plugin instances. */
  list(): PluginInstance[] {
    return [...this.plugins.values()];
  }

  /** Get a single plugin instance by id. */
  get(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /** Check whether a plugin is currently loaded (status === 'loaded'). */
  isLoaded(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.status === 'loaded';
  }
}
