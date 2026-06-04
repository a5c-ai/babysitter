/**
 * PluginSandbox — permission tracking and policy enforcement for loaded plugins.
 *
 * Each plugin is assigned a set of permissions drawn from its manifest.
 * Runtime checks gate access to resources (file paths, network, shell, etc.)
 * by combining the granted permissions with an optional PluginSandboxConfig.
 */

import type { PluginPermission, PluginSandboxConfig } from './types';

/** Map from a high-level action verb to the permission(s) it requires. */
const ACTION_PERMISSION_MAP: Record<string, PluginPermission> = {
  read: 'fs:read',
  write: 'fs:write',
  fetch: 'net:outbound',
  spawn: 'process:spawn',
  env: 'env:read',
  mcp: 'mcp:connect',
  shell: 'shell:execute',
};

export class PluginSandbox {
  private permissions = new Map<string, Set<PluginPermission>>();
  private configs = new Map<string, PluginSandboxConfig>();

  // ---------------------------------------------------------------------------
  // Permission CRUD
  // ---------------------------------------------------------------------------

  /** Grant a single permission to a plugin. */
  grantPermission(pluginId: string, permission: PluginPermission): void {
    let perms = this.permissions.get(pluginId);
    if (!perms) {
      perms = new Set();
      this.permissions.set(pluginId, perms);
    }
    perms.add(permission);
  }

  /** Revoke a single permission from a plugin. */
  revokePermission(pluginId: string, permission: PluginPermission): void {
    const perms = this.permissions.get(pluginId);
    if (perms) {
      perms.delete(permission);
    }
  }

  /** Check whether a plugin currently holds a given permission. */
  checkPermission(pluginId: string, permission: PluginPermission): boolean {
    return this.permissions.get(pluginId)?.has(permission) ?? false;
  }

  /** Return the full list of permissions granted to a plugin. */
  getPermissions(pluginId: string): PluginPermission[] {
    const perms = this.permissions.get(pluginId);
    return perms ? [...perms] : [];
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /** Attach a sandbox configuration (memory / timeout / allowed paths) for a plugin. */
  setConfig(pluginId: string, config: PluginSandboxConfig): void {
    this.configs.set(pluginId, config);
  }

  /** Retrieve the sandbox configuration for a plugin, if any. */
  getConfig(pluginId: string): PluginSandboxConfig | undefined {
    return this.configs.get(pluginId);
  }

  // ---------------------------------------------------------------------------
  // Policy check
  // ---------------------------------------------------------------------------

  /**
   * Determine whether a plugin is allowed to perform `action` on `resource`.
   *
   * The check works in two stages:
   * 1. The action is mapped to a required permission. If the plugin does not
   *    hold that permission the call is denied.
   * 2. For file-system actions the optional `allowedPaths` list in the sandbox
   *    config is consulted. If the list exists and the resource does not start
   *    with any allowed prefix the call is denied.
   */
  isAllowed(pluginId: string, action: string, resource?: string): boolean {
    // Resolve the permission required for this action
    const requiredPermission = ACTION_PERMISSION_MAP[action];
    if (!requiredPermission) {
      // Unknown action — deny by default
      return false;
    }

    if (!this.checkPermission(pluginId, requiredPermission)) {
      return false;
    }

    // For filesystem operations, enforce allowedPaths when configured
    if (
      resource &&
      (requiredPermission === 'fs:read' || requiredPermission === 'fs:write')
    ) {
      const config = this.configs.get(pluginId);
      if (config?.allowedPaths && config.allowedPaths.length > 0) {
        const normalised = resource.replace(/\\/g, '/');
        const allowed = config.allowedPaths.some((p) =>
          normalised.startsWith(p.replace(/\\/g, '/')),
        );
        if (!allowed) {
          return false;
        }
      }
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /** Remove all permission and config state for a plugin. */
  clear(pluginId: string): void {
    this.permissions.delete(pluginId);
    this.configs.delete(pluginId);
  }
}
