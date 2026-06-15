import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validatePlugin, diagnosePlugin, formatDiagnostics, type DiagnosticEntry } from '../validation';
import type { PluginManifest } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    permissions: ['fs:read'],
    entrypoint: './index.js',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validatePlugin
// ---------------------------------------------------------------------------

describe('validatePlugin', () => {
  it('passes for a valid manifest', () => {
    const result = validatePlugin(makeManifest());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('errors on missing id', () => {
    const result = validatePlugin(makeManifest({ id: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('id');
  });

  it('errors on missing name', () => {
    const result = validatePlugin(makeManifest({ name: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('name'))).toBe(true);
  });

  it('errors on missing version', () => {
    const result = validatePlugin(makeManifest({ version: '' }));
    expect(result.valid).toBe(false);
  });

  it('errors on missing entrypoint', () => {
    const result = validatePlugin(makeManifest({ entrypoint: '' }));
    expect(result.valid).toBe(false);
  });

  it('warns on unknown permissions', () => {
    const result = validatePlugin(
      makeManifest({ permissions: ['fs:read', 'custom:perm' as never] }),
    );
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('custom:perm'))).toBe(true);
  });

  it('warns on non-standard version format', () => {
    const result = validatePlugin(makeManifest({ version: '1.0' }));
    expect(result.warnings.some(w => w.includes('semver'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// diagnosePlugin
// ---------------------------------------------------------------------------

describe('diagnosePlugin', () => {
  let tempDir: string;
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'plugin-diag-'));
  });
  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports error for missing directory', () => {
    const entries = diagnosePlugin(join(tempDir, 'nonexistent'));
    expect(entries.some(e => e.level === 'error' && e.message.includes('does not exist'))).toBe(true);
  });

  it('reports error for missing plugin.json', () => {
    const entries = diagnosePlugin(tempDir);
    expect(entries.some(e => e.level === 'error' && e.message.includes('plugin.json'))).toBe(true);
  });

  it('reports info when plugin.json exists', () => {
    writeFileSync(join(tempDir, 'plugin.json'), '{}');
    const entries = diagnosePlugin(tempDir);
    expect(entries.some(e => e.level === 'info' && e.message.includes('plugin.json found'))).toBe(true);
  });

  it('warns when no entrypoint found', () => {
    writeFileSync(join(tempDir, 'plugin.json'), '{}');
    const entries = diagnosePlugin(tempDir);
    expect(entries.some(e => e.level === 'warning' && e.message.includes('entrypoint'))).toBe(true);
  });

  it('does not warn when index.js exists', () => {
    writeFileSync(join(tempDir, 'plugin.json'), '{}');
    writeFileSync(join(tempDir, 'index.js'), '');
    const entries = diagnosePlugin(tempDir);
    expect(entries.some(e => e.level === 'warning' && e.message.includes('entrypoint'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatDiagnostics
// ---------------------------------------------------------------------------

describe('formatDiagnostics', () => {
  it('returns "No diagnostics." for empty array', () => {
    expect(formatDiagnostics([])).toBe('No diagnostics.');
  });

  it('formats entries with level prefixes', () => {
    const entries: DiagnosticEntry[] = [
      { level: 'error', message: 'Something broke' },
      { level: 'warning', message: 'Heads up' },
      { level: 'info', message: 'All good' },
    ];
    const output = formatDiagnostics(entries);
    expect(output).toContain('[ERROR]');
    expect(output).toContain('[WARN ]');
    expect(output).toContain('[INFO ]');
    expect(output).toContain('Something broke');
  });
});
