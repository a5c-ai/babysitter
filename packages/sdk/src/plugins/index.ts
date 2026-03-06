/**
 * Plugin Management Module
 *
 * Re-exports all public APIs for plugin registry management,
 * marketplace operations, package reading, and migration resolution.
 */

// Types
export {
  PLUGIN_REGISTRY_SCHEMA_VERSION,
  PLUGIN_REGISTRY_FILENAME,
  MARKETPLACE_MANIFEST_FILENAME,
} from "./types";
export type {
  PluginScope,
  PluginRegistryEntry,
  PluginRegistry,
  MarketplaceManifest,
  MarketplacePluginEntry,
  MigrationDescriptor,
  PluginPackageInfo,
} from "./types";

// Path resolution
export {
  getRegistryPath,
  getMarketplacesDir,
  getMarketplaceDir,
} from "./paths";

// Registry CRUD
export {
  readPluginRegistry,
  writePluginRegistry,
  getPluginEntry,
  upsertPluginEntry,
  removePluginEntry,
  listPluginEntries,
} from "./registry";

// Marketplace management
export {
  cloneMarketplace,
  updateMarketplace,
  readMarketplaceManifest,
  listMarketplacePlugins,
  resolvePluginPackagePath,
  deriveMarketplaceName,
  listMarketplaces,
} from "./marketplace";

// Package reading
export {
  readPluginPackage,
  readInstallInstructions,
  readUninstallInstructions,
  readConfigureInstructions,
  listMigrations,
  readMigration,
} from "./packageReader";

// Migration resolution
export {
  parseMigrationFilename,
  buildMigrationGraph,
  findMigrationPath,
  resolveMigrationChain,
} from "./migrations";
