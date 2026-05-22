import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collectCapabilities, mergeCapabilities } from '../capabilityCollector';
import { createRuntimePromptContext } from '../runtimeContext';

// Mock the plugin registry module
vi.mock('../../plugins/registry', () => ({
  readPluginRegistry: vi.fn(),
}));

// Mock the process library active module
vi.mock('../../processLibrary/active', () => ({
  resolveActiveProcessLibrary: vi.fn(),
}));

import { readPluginRegistry } from '../../plugins/registry';
import { resolveActiveProcessLibrary } from '../../processLibrary/active';

const mockReadPluginRegistry = vi.mocked(readPluginRegistry);
const mockResolveActiveProcessLibrary = vi.mocked(resolveActiveProcessLibrary);

beforeEach(() => {
  vi.resetAllMocks();
  // Default: empty registry and no binding
  mockReadPluginRegistry.mockResolvedValue({
    schemaVersion: '2026.01.plugins-v1',
    updatedAt: new Date().toISOString(),
    plugins: {},
  });
  mockResolveActiveProcessLibrary.mockResolvedValue({
    stateFile: '',
    bindingScope: null,
    binding: null,
  });
});

describe('GAP-PROMPT-002: Deterministic Capability Projection', () => {
  describe('collectCapabilities', () => {
    it('returns empty pluginCapabilities with empty registry', async () => {
      const result = await collectCapabilities({});
      expect(result.pluginCapabilities).toEqual([]);
    });

    it('returns sorted plugin:* entries for installed plugins', async () => {
      mockReadPluginRegistry.mockResolvedValue({
        schemaVersion: '2026.01.plugins-v1',
        updatedAt: new Date().toISOString(),
        plugins: {
          'zeta-plugin': { name: 'zeta-plugin', version: '1.0.0', installedAt: '', scope: 'global' },
          'alpha-plugin': { name: 'alpha-plugin', version: '1.0.0', installedAt: '', scope: 'global' },
        },
      } as ReturnType<typeof readPluginRegistry> extends Promise<infer R> ? R : never);
      const result = await collectCapabilities({});
      expect(result.pluginCapabilities).toContain('plugin:alpha-plugin');
      expect(result.pluginCapabilities).toContain('plugin:zeta-plugin');
      // Sorted
      expect(result.pluginCapabilities.indexOf('plugin:alpha-plugin'))
        .toBeLessThan(result.pluginCapabilities.indexOf('plugin:zeta-plugin'));
    });

    it('includes process-library when binding is active', async () => {
      mockResolveActiveProcessLibrary.mockResolvedValue({
        stateFile: '/some/path',
        bindingScope: 'default',
        binding: { dir: '/lib', boundAt: new Date().toISOString() },
      });
      const result = await collectCapabilities({});
      expect(result.libraryCapabilities).toContain('process-library');
    });

    it('omits process-library when no binding exists', async () => {
      const result = await collectCapabilities({});
      expect(result.libraryCapabilities).not.toContain('process-library');
    });

    it('filters feature flags: only truthy values produce flag:* entries', async () => {
      const result = await collectCapabilities({
        featureFlags: { betaX: true, betaY: false, betaZ: true },
      });
      expect(result.flagCapabilities).toContain('flag:betaX');
      expect(result.flagCapabilities).toContain('flag:betaZ');
      expect(result.flagCapabilities).not.toContain('flag:betaY');
    });

    it('returns adapter capabilities for known harness', async () => {
      const result = await collectCapabilities({ harness: 'claude-code' });
      expect(result.adapterCapabilities).toContain('hooks');
      expect(result.adapterCapabilities).toContain('stop-hook');
    });

    it('returns empty adapter capabilities for unknown harness', async () => {
      const result = await collectCapabilities({ harness: 'unknown-harness' });
      expect(result.adapterCapabilities).toEqual([]);
    });

    it('all[] is a sorted union of all capability arrays', async () => {
      mockResolveActiveProcessLibrary.mockResolvedValue({
        stateFile: '/some/path',
        bindingScope: 'default',
        binding: { dir: '/lib', boundAt: new Date().toISOString() },
      });
      const result = await collectCapabilities({
        harness: 'claude-code',
        featureFlags: { beta: true },
      });
      expect(result.all).toEqual([...result.all].sort());
      expect(result.all).toContain('process-library');
      expect(result.all).toContain('flag:beta');
      expect(result.all).toContain('hooks');
    });

    it('same options called twice yields identical all[] (determinism)', async () => {
      const opts = { harness: 'claude-code', featureFlags: { x: true } };
      const r1 = await collectCapabilities(opts);
      const r2 = await collectCapabilities(opts);
      expect(r1.all).toEqual(r2.all);
    });

    it('handles plugin registry read failure gracefully', async () => {
      mockReadPluginRegistry.mockRejectedValue(new Error('disk error'));
      const result = await collectCapabilities({});
      expect(result.pluginCapabilities).toEqual([]);
    });

    it('handles process library resolution failure gracefully', async () => {
      mockResolveActiveProcessLibrary.mockRejectedValue(new Error('not found'));
      const result = await collectCapabilities({});
      expect(result.libraryCapabilities).toEqual([]);
    });
  });

  describe('mergeCapabilities', () => {
    it('deduplicates entries present in both base and collected', async () => {
      const base = ['hooks', 'stop-hook', 'task-tool'];
      const collected = await collectCapabilities({ harness: 'claude-code' });
      const merged = mergeCapabilities(base, collected);
      const hooksCount = merged.filter(c => c === 'hooks').length;
      expect(hooksCount).toBe(1);
    });

    it('returns sorted result', async () => {
      const base = ['z-cap', 'a-cap'];
      const collected = await collectCapabilities({});
      const merged = mergeCapabilities(base, collected);
      expect(merged).toEqual([...merged].sort());
    });
  });

  describe('createRuntimePromptContext', () => {
    it('returns PromptContext with correct harness', async () => {
      const ctx = await createRuntimePromptContext({ harness: 'claude-code' });
      expect(ctx.harness).toBe('claude-code');
    });

    it('includes baseline capabilities from context factory', async () => {
      const ctx = await createRuntimePromptContext({ harness: 'claude-code' });
      expect(ctx.capabilities).toContain('task-tool');
    });

    it('returns sorted capabilities', async () => {
      const ctx = await createRuntimePromptContext({ harness: 'claude-code' });
      expect(ctx.capabilities).toEqual([...ctx.capabilities].sort());
    });

    it('respects baseContext overrides', async () => {
      const ctx = await createRuntimePromptContext({
        harness: 'claude-code',
        baseContext: { interactive: false },
      });
      expect(ctx.interactive).toBe(false);
    });

    it('falls back gracefully for unknown harness, preserving harness name', async () => {
      const ctx = await createRuntimePromptContext({ harness: 'unknown-harness-xyz' });
      // Should not throw — falls back to claude-code factory but preserves requested harness name
      expect(ctx.harness).toBe('unknown-harness-xyz');
    });
  });
});
