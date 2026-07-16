import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock source-discovery since path-resolver imports from it
vi.mock('../source-discovery', () => ({
  discoverAllRunDirs: vi.fn(),
  invalidateDiscoveryCache: vi.fn(),
}));

import { discoverAllRunDirs } from '../source-discovery';
import { findRunDir } from '../path-resolver';

const mockDiscoverAllRunDirs = vi.mocked(discoverAllRunDirs);

const defaultSource = { path: '/projects', depth: 2, label: 'test' };

describe('path-resolver', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('findRunDir', () => {
    it('returns null when no matching runId is found', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([]);

      const result = await findRunDir('nonexistent-run');
      expect(result).toBeNull();
    });

    it('returns null when runs exist but none match the runId', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([
        {
          runDir: '/projects/app/.a5c/runs/run-001',
          source: defaultSource,
          projectName: 'app',
          projectPath: '/projects/app',
        },
        {
          runDir: '/projects/app/.a5c/runs/run-002',
          source: defaultSource,
          projectName: 'app',
          projectPath: '/projects/app',
        },
      ]);

      const result = await findRunDir('run-999');
      expect(result).toBeNull();
    });

    it('returns DiscoveredRun when matching runId is found', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([
        {
          runDir: '/projects/myapp/.a5c/runs/target-run',
          source: defaultSource,
          projectName: 'myapp',
          projectPath: '/projects/myapp',
        },
        {
          runDir: '/projects/myapp/.a5c/runs/other-run',
          source: defaultSource,
          projectName: 'myapp',
          projectPath: '/projects/myapp',
        },
      ]);

      const result = await findRunDir('target-run');

      expect(result).not.toBeNull();
      expect(result!.runDir).toBe('/projects/myapp/.a5c/runs/target-run');
      expect(result!.projectName).toBe('myapp');
    });

    it('matches by basename of runDir, not full path', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([
        {
          runDir: '/deeply/nested/path/.a5c/runs/my-run-id',
          source: defaultSource,
          projectName: 'path',
          projectPath: '/deeply/nested/path',
        },
      ]);

      const result = await findRunDir('my-run-id');

      expect(result).not.toBeNull();
      expect(result!.runDir).toContain('my-run-id');
    });

    it('returns the first match when multiple runs have the same basename', async () => {
      const firstMatch = {
        runDir: '/projects/app-a/.a5c/runs/shared-id',
        source: defaultSource,
        projectName: 'app-a',
        projectPath: '/projects/app-a',
      };

      mockDiscoverAllRunDirs.mockResolvedValue([
        firstMatch,
        {
          runDir: '/projects/app-b/.a5c/runs/shared-id',
          source: defaultSource,
          projectName: 'app-b',
          projectPath: '/projects/app-b',
        },
      ]);

      const result = await findRunDir('shared-id');

      expect(result).not.toBeNull();
      expect(result!.projectName).toBe('app-a');
    });
  });
});
