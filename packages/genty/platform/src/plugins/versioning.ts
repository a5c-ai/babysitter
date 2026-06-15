/**
 * Plugin versioning — semver-aware update policy for installed plugins.
 *
 * Determines whether a plugin update should be applied automatically (patch),
 * require user confirmation (minor), or be blocked until explicitly approved
 * (major).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PluginVersion {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
}

export type UpdateAction = 'auto' | 'prompt' | 'block';

export interface UpdateCheckResult {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  action: UpdateAction;
  reason: string;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a semver string into a PluginVersion.
 * Returns `undefined` for malformed strings.
 */
export function parseVersion(version: string): PluginVersion | undefined {
  const cleaned = version.replace(/^v/, '');
  const [core, preRelease] = cleaned.split('-', 2);
  const parts = core.split('.');
  if (parts.length < 3) return undefined;

  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  const patch = parseInt(parts[2], 10);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) return undefined;
  return { major, minor, patch, preRelease };
}

// ---------------------------------------------------------------------------
// Comparison helpers
// ---------------------------------------------------------------------------

/**
 * Return true if `a` is strictly less than `b` in semver ordering.
 */
function isOlderThan(a: PluginVersion, b: PluginVersion): boolean {
  if (a.major !== b.major) return a.major < b.major;
  if (a.minor !== b.minor) return a.minor < b.minor;
  return a.patch < b.patch;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether an update is available and what action policy applies.
 */
export function checkForUpdate(
  currentVersionStr: string,
  latestVersionStr: string,
): UpdateCheckResult {
  const current = parseVersion(currentVersionStr);
  const latest = parseVersion(latestVersionStr);

  if (!current || !latest) {
    return {
      available: false,
      currentVersion: currentVersionStr,
      latestVersion: latestVersionStr,
      action: 'block',
      reason: 'Unable to parse version string',
    };
  }

  if (!isOlderThan(current, latest)) {
    return {
      available: false,
      currentVersion: currentVersionStr,
      latestVersion: latestVersionStr,
      action: 'auto',
      reason: 'Already up to date',
    };
  }

  const action = shouldAutoUpdate(current, latest);
  const reason = action === 'auto'
    ? 'Patch update — applied automatically'
    : action === 'prompt'
      ? 'Minor update — user confirmation required'
      : 'Major update — blocked until explicitly approved';

  return {
    available: true,
    currentVersion: currentVersionStr,
    latestVersion: latestVersionStr,
    action,
    reason,
  };
}

/**
 * Determine the update action for a version transition.
 *
 * Policy:
 *  - patch change → auto
 *  - minor change (same major) → prompt
 *  - major change → block
 */
export function shouldAutoUpdate(
  current: PluginVersion,
  latest: PluginVersion,
): UpdateAction {
  if (latest.major > current.major) return 'block';
  if (latest.minor > current.minor) return 'prompt';
  return 'auto';
}
