/**
 * Plugin validation — structural checks for manifests and installed plugin
 * directories.
 *
 * `validatePlugin` performs in-memory manifest validation.
 * `diagnosePlugin` inspects the file-system layout of a plugin directory.
 * `formatDiagnostics` renders issues into a human-readable report.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PluginManifest, PluginPermission } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DiagnosticEntry {
  level: 'error' | 'warning' | 'info';
  message: string;
}

// ---------------------------------------------------------------------------
// Manifest validation
// ---------------------------------------------------------------------------

const KNOWN_PERMISSIONS: Set<string> = new Set<string>([
  'fs:read',
  'fs:write',
  'net:outbound',
  'process:spawn',
  'env:read',
  'mcp:connect',
  'shell:execute',
]);

/**
 * Validate a plugin manifest in memory.
 * Returns errors (fatal) and warnings (non-fatal observations).
 */
export function validatePlugin(manifest: PluginManifest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required string fields
  if (!manifest.id || typeof manifest.id !== 'string') {
    errors.push('Missing or invalid "id" field');
  }
  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push('Missing or invalid "name" field');
  }
  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('Missing or invalid "version" field');
  }
  if (!manifest.entrypoint || typeof manifest.entrypoint !== 'string') {
    errors.push('Missing or invalid "entrypoint" field');
  }

  // Permissions array
  if (!Array.isArray(manifest.permissions)) {
    errors.push('"permissions" must be an array');
  } else {
    for (const perm of manifest.permissions) {
      if (!KNOWN_PERMISSIONS.has(perm)) {
        warnings.push(`Unknown permission "${perm}"`);
      }
    }
  }

  // Version format (basic check)
  if (manifest.version) {
    const parts = manifest.version.replace(/^v/, '').split('.');
    if (parts.length < 3) {
      warnings.push(`Version "${manifest.version}" is not standard semver`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// Directory diagnosis
// ---------------------------------------------------------------------------

/**
 * Inspect a plugin directory on disk and return diagnostic entries.
 */
export function diagnosePlugin(pluginDir: string): DiagnosticEntry[] {
  const entries: DiagnosticEntry[] = [];

  if (!existsSync(pluginDir)) {
    entries.push({ level: 'error', message: `Plugin directory does not exist: ${pluginDir}` });
    return entries;
  }

  // Check for manifest file
  const manifestPath = join(pluginDir, 'plugin.json');
  if (!existsSync(manifestPath)) {
    entries.push({ level: 'error', message: 'Missing plugin.json manifest' });
  } else {
    entries.push({ level: 'info', message: 'plugin.json found' });
  }

  // Check for entrypoint (common patterns)
  const commonEntrypoints = ['index.js', 'index.ts', 'dist/index.js'];
  const hasEntry = commonEntrypoints.some((e) => existsSync(join(pluginDir, e)));
  if (!hasEntry) {
    entries.push({ level: 'warning', message: 'No common entrypoint found (index.js, index.ts, dist/index.js)' });
  }

  // Check for README
  if (!existsSync(join(pluginDir, 'README.md'))) {
    entries.push({ level: 'warning', message: 'No README.md found' });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const LEVEL_PREFIX: Record<DiagnosticEntry['level'], string> = {
  error: 'ERROR',
  warning: 'WARN ',
  info: 'INFO ',
};

/**
 * Render diagnostic entries into a human-readable multi-line string.
 */
export function formatDiagnostics(entries: DiagnosticEntry[]): string {
  if (entries.length === 0) return 'No diagnostics.';
  return entries
    .map((e) => `[${LEVEL_PREFIX[e.level]}] ${e.message}`)
    .join('\n');
}
