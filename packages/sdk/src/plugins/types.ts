/**
 * Plugin Types for Babysitter SDK
 *
 * This module defines the TypeScript interfaces for plugin management,
 * including registry entries, marketplace manifests, migrations, and
 * package metadata.
 */

/**
 * Schema version for plugin registry serialization.
 * Used to detect and migrate older registry formats.
 */
export const PLUGIN_REGISTRY_SCHEMA_VERSION = "2026.01.plugin-registry-v1";

/**
 * Filename for the JSON-serialized plugin registry.
 */
export const PLUGIN_REGISTRY_FILENAME = "plugin-registry.json";

/**
 * Filename for the marketplace manifest within a cloned marketplace directory.
 */
export const MARKETPLACE_MANIFEST_FILENAME = "marketplace.json";

/**
 * Filename that stores the relative path to the marketplace manifest
 * within a cloned marketplace directory (when a custom path is specified).
 */
export const MANIFEST_PATH_FILENAME = ".babysitter-manifest-path";

/**
 * Scope determines where plugin configuration is stored.
 *
 * - `global` — User-wide configuration in the home directory
 * - `project` — Project-specific configuration in the project root
 */
export type PluginScope = "global" | "project";

/**
 * Type guard for Node.js system errors with an error code property.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

/**
 * A single plugin entry within the registry.
 */
export interface PluginRegistryEntry {
  /** Plugin identifier (e.g. "babysitter@a5c.ai") */
  name: string;
  /** Currently installed semantic version */
  version: string;
  /** Name of the marketplace this plugin was sourced from */
  marketplace: string;
  /** Whether this plugin is installed globally or per-project */
  scope: PluginScope;
  /** ISO 8601 timestamp of initial installation */
  installedAt: string;
  /** ISO 8601 timestamp of most recent update */
  updatedAt: string;
  /** Absolute or scope-relative path to the plugin package directory */
  packagePath: string;
  /** Arbitrary plugin-specific metadata */
  metadata: Record<string, unknown>;
}

/**
 * The full plugin registry, persisted as JSON.
 */
export interface PluginRegistry {
  /** Schema version for forward compatibility */
  schemaVersion: typeof PLUGIN_REGISTRY_SCHEMA_VERSION;
  /** ISO 8601 timestamp of last registry modification */
  updatedAt: string;
  /** Map of plugin name to registry entry */
  plugins: Record<string, PluginRegistryEntry>;
}

/**
 * A single plugin entry within a marketplace manifest.
 */
export interface MarketplacePluginEntry {
  /** Human-readable plugin name */
  name: string;
  /** Short description of the plugin */
  description: string;
  /** Latest available semantic version */
  latestVersion: string;
  /** List of all available versions, newest first */
  versions: string[];
  /** Relative path to the plugin package directory within the marketplace */
  packagePath: string;
  /** Searchable tags for categorization */
  tags: string[];
  /** Plugin author name or identifier */
  author: string;
}

/**
 * The marketplace manifest, read from a cloned marketplace repository.
 */
export interface MarketplaceManifest {
  /** Human-readable marketplace name */
  name: string;
  /** Short description of the marketplace */
  description: string;
  /** Git remote URL of the marketplace */
  url: string;
  /** Marketplace owner name or organization */
  owner: string;
  /** Map of plugin name to marketplace plugin entry */
  plugins: Record<string, MarketplacePluginEntry>;
}

/**
 * Describes a single migration step between two plugin versions.
 */
export interface MigrationDescriptor {
  /** Source version (semver) */
  from: string;
  /** Target version (semver) */
  to: string;
  /** Filename of the migration file */
  file: string;
  /** Type of migration instructions */
  type: "md" | "js";
}

/**
 * Aggregated information read from a plugin package directory.
 */
export interface PluginPackageInfo {
  /** Plugin identifier */
  name: string;
  /** Markdown install instructions, or undefined if not present */
  installInstructions: string | undefined;
  /** Markdown uninstall instructions, or undefined if not present */
  uninstallInstructions: string | undefined;
  /** Markdown configure instructions, or undefined if not present */
  configureInstructions: string | undefined;
  /** Available migration descriptors sorted by source version */
  migrations: MigrationDescriptor[];
  /** List of process definition file paths relative to the package */
  processFiles: string[];
}
