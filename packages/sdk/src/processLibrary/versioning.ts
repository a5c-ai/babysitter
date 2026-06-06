/**
 * Process Versioning and Migration (GAP-PROC-003).
 *
 * Semver-based versioning for process definitions. Provides parsing,
 * compatibility checking, diffing, and migration stubs for evolving
 * process schemas over time.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProcessVersion {
  major: number;
  minor: number;
  patch: number;
  hash?: string;
}

export interface VersionChange {
  field: string;
  type: 'added' | 'removed' | 'changed';
  description: string;
}

export interface MigrationResult {
  definition: Record<string, unknown>;
  fromVersion: ProcessVersion;
  toVersion: ProcessVersion;
  appliedMigrations: string[];
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a "major.minor.patch" version string into a ProcessVersion.
 * Returns undefined if the string is malformed.
 */
export function parseProcessVersion(versionStr: string): ProcessVersion | undefined {
  if (!versionStr) return undefined;

  const cleaned = versionStr.replace(/^v/, '');
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) return undefined;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    hash: match[4],
  };
}

/**
 * Serialize a ProcessVersion back to a string.
 */
export function formatProcessVersion(version: ProcessVersion): string {
  const base = `${version.major}.${version.minor}.${version.patch}`;
  return version.hash ? `${base}-${version.hash}` : base;
}

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

/**
 * Check if `current` is compatible with `required` using semver rules:
 * - Same major version
 * - Current minor >= required minor (when same major)
 * - Current patch >= required patch (when same major and minor)
 */
export function isCompatible(current: ProcessVersion, required: ProcessVersion): boolean {
  if (current.major !== required.major) return false;
  if (current.minor < required.minor) return false;
  if (current.minor === required.minor && current.patch < required.patch) return false;
  return true;
}

/**
 * Compare two versions. Returns -1, 0, or 1.
 */
export function compareVersions(a: ProcessVersion, b: ProcessVersion): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

/**
 * Migrate a process definition from one version to another.
 * This is a stub implementation that copies the definition and stamps
 * the new version. Real migrations would be registered per version range.
 */
export function migrateProcess(
  oldDef: Record<string, unknown>,
  fromVersion: ProcessVersion,
  toVersion: ProcessVersion,
): MigrationResult {
  const appliedMigrations: string[] = [];
  const definition = { ...oldDef };

  // Stamp the target version
  definition['version'] = formatProcessVersion(toVersion);

  // Track the migration path
  appliedMigrations.push(
    `${formatProcessVersion(fromVersion)} -> ${formatProcessVersion(toVersion)}`,
  );

  return {
    definition,
    fromVersion,
    toVersion,
    appliedMigrations,
  };
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

/**
 * Diff two process versions and return a list of semantic changes.
 * Categorizes changes based on semver level differences.
 */
export function diffProcessVersions(
  v1: ProcessVersion,
  v2: ProcessVersion,
): VersionChange[] {
  const changes: VersionChange[] = [];

  if (v1.major !== v2.major) {
    changes.push({
      field: 'major',
      type: 'changed',
      description: `Major version changed from ${v1.major} to ${v2.major} (breaking change)`,
    });
  }

  if (v1.minor !== v2.minor) {
    changes.push({
      field: 'minor',
      type: 'changed',
      description: `Minor version changed from ${v1.minor} to ${v2.minor} (new features)`,
    });
  }

  if (v1.patch !== v2.patch) {
    changes.push({
      field: 'patch',
      type: 'changed',
      description: `Patch version changed from ${v1.patch} to ${v2.patch} (bug fixes)`,
    });
  }

  if (v1.hash !== v2.hash) {
    if (!v1.hash && v2.hash) {
      changes.push({ field: 'hash', type: 'added', description: `Hash added: ${v2.hash}` });
    } else if (v1.hash && !v2.hash) {
      changes.push({ field: 'hash', type: 'removed', description: `Hash removed: ${v1.hash}` });
    } else {
      changes.push({
        field: 'hash',
        type: 'changed',
        description: `Hash changed from ${v1.hash} to ${v2.hash}`,
      });
    }
  }

  return changes;
}
