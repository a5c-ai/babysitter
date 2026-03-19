import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { promises as fs } from 'fs';

// Mock config-loader since source-discovery imports getConfig from it
vi.mock('../config-loader', () => ({
  isNotFoundError: vi.fn((err: unknown) => {
    if (!(err instanceof Error)) return false;
    const code = (err as NodeJS.ErrnoException).code;
    return code === 'ENOENT' || code === 'ENOTDIR' || err.message.includes('ENOENT');
  }),
  getConfig: vi.fn(),
}));

import { getConfig } from '../config-loader';
import {
  invalidateDiscoveryCache,
  discoverAllRunDirs,
  discoverAllRunsParentDirs,
} from '../source-discovery';

const mockGetConfig = vi.mocked(getConfig);
const mockReadFile = vi.spyOn(fs, 'readFile');
const mockReaddir = vi.spyOn(fs, 'readdir');
const mockStat = vi.spyOn(fs, 'stat');
const mockAccess = vi.spyOn(fs, 'access');

describe('source-discovery', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    invalidateDiscoveryCache();
    mockAccess.mockRejectedValue(new Error('ENOENT'));
  });

  describe('invalidateDiscoveryCache', () => {
    it('forces re-discovery on next call', async () => {
      mockGetConfig.mockResolvedValue({
        sources: [{ path: '/projects/my-app', depth: 2 }],
        port: 4800,
        pollInterval: 2000,
        theme: 'dark',
        staleThresholdMs: 3600000,
        recentCompletionWindowMs: 14400000,
        retentionDays: 30,
        hiddenProjects: [],
      });

      // Return a non-empty result so the discovery cache is populated
      mockStat.mockImplementation(async (p: unknown) => {
        if (String(p) === path.join('/projects/my-app', '.a5c', 'runs')) {
          return { isDirectory: () => true } as unknown as fs.FileHandle;
        }
        throw new Error('ENOENT');
      });
      mockReaddir.mockImplementation(async (dir: unknown) => {
        const dirStr = typeof dir === 'string' ? dir : String(dir);
        if (dirStr === '/projects/my-app') {
          return [] as unknown as ReturnType<typeof fs.readdir>;
        }
        if (dirStr === path.join('/projects/my-app', '.a5c', 'runs')) {
          return [
            { name: 'run-001', isDirectory: () => true },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        return [] as unknown as ReturnType<typeof fs.readdir>;
      });

      await discoverAllRunDirs();
      await discoverAllRunDirs();

      // With caching (non-empty results), getConfig should only be called once
      expect(mockGetConfig).toHaveBeenCalledTimes(1);

      invalidateDiscoveryCache();
      await discoverAllRunDirs();

      // After invalidation, getConfig should be called again
      expect(mockGetConfig).toHaveBeenCalledTimes(2);
    });
  });

  describe('discoverAllRunDirs', () => {
    it('returns empty array when source directory does not exist', async () => {
      mockGetConfig.mockResolvedValue({
        sources: [{ path: '/nonexistent', depth: 2 }],
        port: 4800,
        pollInterval: 2000,
        theme: 'dark',
        staleThresholdMs: 3600000,
        recentCompletionWindowMs: 14400000,
        retentionDays: 30,
        hiddenProjects: [],
      });

      mockStat.mockRejectedValue(new Error('ENOENT'));
      mockReaddir.mockRejectedValue(new Error('ENOENT'));

      const results = await discoverAllRunDirs();
      expect(results).toEqual([]);
    });

    it('discovers run directories within .a5c/runs at source root', async () => {
      mockGetConfig.mockResolvedValue({
        sources: [{ path: '/projects/my-project', depth: 2 }],
        port: 4800,
        pollInterval: 2000,
        theme: 'dark',
        staleThresholdMs: 3600000,
        recentCompletionWindowMs: 14400000,
        retentionDays: 30,
        hiddenProjects: [],
      });

      mockStat.mockImplementation(async (p: unknown) => {
        if (p === path.join('/projects/my-project', '.a5c', 'runs')) {
          return { isDirectory: () => true } as unknown as fs.FileHandle;
        }
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: unknown) => {
        const dirStr = typeof dir === 'string' ? dir : String(dir);
        if (dirStr === '/projects/my-project') {
          return [] as unknown as ReturnType<typeof fs.readdir>;
        }
        if (dirStr === path.join('/projects/my-project', '.a5c', 'runs')) {
          return [
            { name: 'run-001', isDirectory: () => true },
            { name: 'run-002', isDirectory: () => true },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        return [] as unknown as ReturnType<typeof fs.readdir>;
      });

      const results = await discoverAllRunDirs();

      expect(results).toHaveLength(2);
      expect(results[0].runDir).toBe(
        path.join('/projects/my-project', '.a5c', 'runs', 'run-001'),
      );
      expect(results[0].projectName).toBe('my-project');
    });

    it('handles depth=0 sources (direct runs directory)', async () => {
      mockGetConfig.mockResolvedValue({
        sources: [{ path: '/direct/runs', depth: 0, label: 'direct' }],
        port: 4800,
        pollInterval: 2000,
        theme: 'dark',
        staleThresholdMs: 3600000,
        recentCompletionWindowMs: 14400000,
        retentionDays: 30,
        hiddenProjects: [],
      });

      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      mockReaddir.mockImplementation(async (dir: unknown) => {
        const dirStr = typeof dir === 'string' ? dir : String(dir);
        if (dirStr === '/direct/runs') {
          return [
            { name: 'run-a', isDirectory: () => true },
            { name: 'somefile.txt', isDirectory: () => false },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        return [] as unknown as ReturnType<typeof fs.readdir>;
      });

      const results = await discoverAllRunDirs();

      expect(results).toHaveLength(1);
      expect(results[0].runDir).toBe(path.join('/direct/runs', 'run-a'));
      expect(results[0].projectName).toBe('direct');
    });

    it('skips node_modules and hidden directories during scanning', async () => {
      mockGetConfig.mockResolvedValue({
        sources: [{ path: '/workspace', depth: 1 }],
        port: 4800,
        pollInterval: 2000,
        theme: 'dark',
        staleThresholdMs: 3600000,
        recentCompletionWindowMs: 14400000,
        retentionDays: 30,
        hiddenProjects: [],
      });

      mockStat.mockRejectedValue(new Error('ENOENT'));

      mockReaddir.mockImplementation(async (dir: unknown) => {
        const dirStr = typeof dir === 'string' ? dir : String(dir);
        if (dirStr === '/workspace') {
          return [
            { name: 'node_modules', isDirectory: () => true },
            { name: '.git', isDirectory: () => true },
            { name: 'project-a', isDirectory: () => true },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        return [] as unknown as ReturnType<typeof fs.readdir>;
      });

      const results = await discoverAllRunDirs();
      expect(results).toEqual([]);
    });
  });

  describe('discoverAllRunsParentDirs', () => {
    it('returns accessible source paths for depth=0 sources', async () => {
      mockGetConfig.mockResolvedValue({
        sources: [{ path: '/direct/runs', depth: 0 }],
        port: 4800,
        pollInterval: 2000,
        theme: 'dark',
        staleThresholdMs: 3600000,
        recentCompletionWindowMs: 14400000,
        retentionDays: 30,
        hiddenProjects: [],
      });

      mockAccess.mockResolvedValue(undefined);

      const dirs = await discoverAllRunsParentDirs();
      expect(dirs).toContain('/direct/runs');
    });

    it('returns empty for inaccessible depth=0 sources', async () => {
      mockGetConfig.mockResolvedValue({
        sources: [{ path: '/nonexistent', depth: 0 }],
        port: 4800,
        pollInterval: 2000,
        theme: 'dark',
        staleThresholdMs: 3600000,
        recentCompletionWindowMs: 14400000,
        retentionDays: 30,
        hiddenProjects: [],
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const dirs = await discoverAllRunsParentDirs();
      expect(dirs).toHaveLength(0);
      consoleSpy.mockRestore();
    });
  });
});
