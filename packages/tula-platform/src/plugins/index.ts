/**
 * Plugin sandboxing module for L6 Agent-Platform.
 *
 * Provides permission-gated plugin loading, runtime sandbox enforcement,
 * and semver compatibility checking.
 */

// Types
export type {
  PluginPermission,
  PluginManifest,
  PluginStatus,
  PluginInstance,
  PluginSandboxConfig,
} from './types';

// Sandbox
export { PluginSandbox } from './sandbox';

// Loader
export { PluginLoader } from './loader';

// Version checker
export { PluginVersionChecker, type VersionCheckResult } from './version-check';
