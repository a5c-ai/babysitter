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

// Versioning (ECO-004)
export {
  checkForUpdate,
  shouldAutoUpdate,
  parseVersion,
  type PluginVersion,
  type UpdateAction,
  type UpdateCheckResult,
} from './versioning';

// Validation (ECO-005)
export {
  validatePlugin,
  diagnosePlugin,
  formatDiagnostics,
  type ValidationResult,
  type DiagnosticEntry,
} from './validation';

// Management (GAP-USER-017)
export {
  PluginManager,
  type PluginInfo,
  type TrustLevel,
} from './management';

// Marketplace protocol (GAP-ECO-002)
export {
  MarketplaceClient,
  MarketplaceInstaller,
  type MarketplaceEntry,
  type MarketplaceSearchResult,
  type MarketplaceCategoryList,
  type FetchFn,
} from './marketplace';

// CC Plugin Compatibility (GAP-ECO-001)
export {
  CcCompatibilityLayer,
  type CcPluginManifest,
  type CcSkill,
  type CcHook,
  type CcCommand,
  type CcMcpServer,
  type GentyExtension,
  type GentyExtensionCommand,
  type GentyExtensionEvent,
  type GentyMcpConfig,
  type CompatibilityReport,
} from './ccCompatibility';
