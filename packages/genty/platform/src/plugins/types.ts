/**
 * Plugin sandboxing types for L6 Agent-Platform.
 * Defines the permission model, manifest schema, instance lifecycle,
 * and sandbox configuration for loaded plugins.
 */

export type PluginPermission =
  | 'fs:read'
  | 'fs:write'
  | 'net:outbound'
  | 'process:spawn'
  | 'env:read'
  | 'mcp:connect'
  | 'shell:execute';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  permissions: PluginPermission[];
  entrypoint: string;
  minPlatformVersion?: string;
}

export type PluginStatus = 'loaded' | 'unloaded' | 'error' | 'loading';

export interface PluginInstance {
  manifest: PluginManifest;
  status: PluginStatus;
  loadedAt?: number;
  error?: string;
}

export interface PluginSandboxConfig {
  maxMemoryMb?: number;
  timeoutMs?: number;
  allowedPaths?: string[];
}
