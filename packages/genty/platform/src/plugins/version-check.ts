/**
 * PluginVersionChecker — simple semver compatibility checks for plugins.
 *
 * Compares a plugin manifest's `minPlatformVersion` against the current
 * platform version to determine whether the plugin is compatible.
 */

import type { PluginManifest } from './types';

export interface VersionCheckResult {
  compatible: boolean;
  issues: string[];
}

interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Parse a version string in `major.minor.patch` format.
 * Returns `undefined` if the string is not a valid semver triple.
 */
function parseSemVer(version: string): SemVer | undefined {
  const cleaned = version.replace(/^v/, '');
  const parts = cleaned.split('.');
  if (parts.length < 3) return undefined;

  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  // Strip pre-release / build metadata for comparison
  const patch = parseInt(parts[2].split('-')[0], 10);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) return undefined;
  return { major, minor, patch };
}

/**
 * Return `true` if `actual >= required` using standard semver ordering.
 */
function semverGte(actual: SemVer, required: SemVer): boolean {
  if (actual.major !== required.major) return actual.major > required.major;
  if (actual.minor !== required.minor) return actual.minor > required.minor;
  return actual.patch >= required.patch;
}

export class PluginVersionChecker {
  /**
   * Check whether a plugin manifest is compatible with the given platform
   * version.
   *
   * When `minPlatformVersion` is not specified in the manifest the plugin
   * is assumed compatible. Invalid version strings produce an issue but
   * are treated as incompatible.
   */
  checkCompatibility(
    manifest: PluginManifest,
    platformVersion: string,
  ): VersionCheckResult {
    const issues: string[] = [];

    // If the manifest does not specify a minimum, it is compatible with any version
    if (!manifest.minPlatformVersion) {
      return { compatible: true, issues };
    }

    const required = parseSemVer(manifest.minPlatformVersion);
    if (!required) {
      issues.push(
        `Invalid minPlatformVersion "${manifest.minPlatformVersion}" in manifest for plugin "${manifest.id}"`,
      );
      return { compatible: false, issues };
    }

    const actual = parseSemVer(platformVersion);
    if (!actual) {
      issues.push(
        `Invalid platform version "${platformVersion}" — cannot verify compatibility`,
      );
      return { compatible: false, issues };
    }

    if (!semverGte(actual, required)) {
      issues.push(
        `Plugin "${manifest.id}" requires platform >= ${manifest.minPlatformVersion}, ` +
          `but current platform is ${platformVersion}`,
      );
      return { compatible: false, issues };
    }

    return { compatible: true, issues };
  }
}
