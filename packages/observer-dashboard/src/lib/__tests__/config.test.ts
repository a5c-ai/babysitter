import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { promises as fs } from 'fs';
import {
  getConfig,
  invalidateConfigCache,
  invalidateDiscoveryCache,
  writeConfig,
  discoverAllRunDirs,
  findRunDir,
} from '../config';

// Use vi.spyOn so both test and config module share the same mock references
const mockReadFile = vi.spyOn(fs, 'readFile');
const mockWriteFile = vi.spyOn(fs, 'writeFile');
const mockMkdir = vi.spyOn(fs, 'mkdir');
const mockReaddir = vi.spyOn(fs, 'readdir');
const mockStat = vi.spyOn(fs, 'stat');
const mockAccess = vi.spyOn(fs, 'access');

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    // Reset env vars
    process.env = { ...originalEnv };
    delete process.env.OBSERVER_REGISTRY;
    delete process.env.OBSERVER_WATCH_DIR;
    delete process.env.WATCH_DIR;
    delete process.env.WATCH_DIRS;
    delete process.env.OBSERVER_PORT;
    delete process.env.PORT;
    delete process.env.OBSERVER_POLL_INTERVAL;
    delete process.env.POLL_INTERVAL;
    delete process.env.OBSERVER_DEFAULT_THEME;
    delete process.env.THEME;
    // Invalidate any cached config/discovery from previous test
    invalidateConfigCache();
    invalidateDiscoveryCache();
    // Default: fs.access rejects (file does not exist)
    mockAccess.mockRejectedValue(new Error('ENOENT'));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // -----------------------------------------------------------------------
  // invalidateConfigCache
  // -----------------------------------------------------------------------
  describe('invalidateConfigCache', () => {
    it('clears the cached config so next getConfig re-reads', async () => {
      // First call should read from registry
      mockReadFile.mockRejectedValue(new Error('no file'));
      const config1 = await getConfig();
      expect(config1).toBeDefined();

      // Invalidate
      invalidateConfigCache();

      // Second call should re-read
      mockReadFile.mockRejectedValue(new Error('no file'));
      const _config2 = await getConfig();
      // readFile should have been called again
      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // getConfig
  // -----------------------------------------------------------------------
  describe('getConfig', () => {
    it('returns default config when registry file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      const config = await getConfig();

      expect(config).toBeDefined();
      expect(config.port).toBe(4800);
      expect(config.pollInterval).toBe(2000);
      expect(config.theme).toBe('dark');
      expect(config.sources.length).toBeGreaterThan(0);
    });

    it('uses parent of cwd as default source when no env vars are set', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      const config = await getConfig();

      expect(config.sources[0].path).toBe(path.resolve(process.cwd(), '..'));
      expect(config.sources[0].label).toBe('parent');
      expect(config.sources[0].depth).toBe(3);
    });

    it('uses OBSERVER_WATCH_DIR env var when set', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      process.env.OBSERVER_WATCH_DIR = '/custom/watch/dir';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.sources[0].path).toBe('/custom/watch/dir');
      expect(config.sources[0].label).toBe('cli');
    });

    it('uses WATCH_DIR env var when set', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      process.env.WATCH_DIR = '/legacy/watch/dir';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.sources[0].path).toBe('/legacy/watch/dir');
      expect(config.sources[0].depth).toBe(0);
      expect(config.sources[0].label).toBe('env');
    });

    it('parses WATCH_DIRS env var (comma-separated)', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      process.env.WATCH_DIRS = '/dir/a, /dir/b, /dir/c';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.sources).toHaveLength(3);
      expect(config.sources[0].path).toBe('/dir/a');
      expect(config.sources[1].path).toBe('/dir/b');
      expect(config.sources[2].path).toBe('/dir/c');
    });

    it('skips empty entries in WATCH_DIRS', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      process.env.WATCH_DIRS = '/dir/a, , /dir/b';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.sources).toHaveLength(2);
    });

    it('reads sources from registry file', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [
            { path: '/registered/path', depth: 3, label: 'registry' },
          ],
        }),
      );

      const config = await getConfig();

      expect(config.sources).toHaveLength(1);
      expect(config.sources[0].path).toBe('/registered/path');
      expect(config.sources[0].depth).toBe(3);
      expect(config.sources[0].label).toBe('registry');
    });

    it('defaults depth to 2 when registry source has no depth', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/some/path' }],
        }),
      );

      const config = await getConfig();

      expect(config.sources[0].depth).toBe(2);
    });

    it('reads port from OBSERVER_PORT env var', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      process.env.OBSERVER_PORT = '4000';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.port).toBe(4000);
    });

    it('reads port from PORT env var as fallback', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      process.env.PORT = '5000';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.port).toBe(5000);
    });

    it('reads pollInterval from registry file', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [],
          pollInterval: 5000,
        }),
      );

      const config = await getConfig();

      expect(config.pollInterval).toBe(5000);
    });

    it('reads pollInterval from OBSERVER_POLL_INTERVAL env var', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ sources: [] }));
      process.env.OBSERVER_POLL_INTERVAL = '3000';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.pollInterval).toBe(3000);
    });

    it('reads theme from registry file', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [],
          theme: 'light',
        }),
      );

      const config = await getConfig();

      expect(config.theme).toBe('light');
    });

    it('reads theme from OBSERVER_DEFAULT_THEME env var', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ sources: [] }));
      process.env.OBSERVER_DEFAULT_THEME = 'light';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.theme).toBe('light');
    });

    it('defaults theme to dark for invalid theme values', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ sources: [] }));
      process.env.THEME = 'invalid-theme';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.theme).toBe('dark');
    });

    it('caches config and returns cached version within TTL', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ sources: [] }));

      const config1 = await getConfig();
      const config2 = await getConfig();

      // Should only read file once due to caching
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(config1).toBe(config2); // same object reference
    });

    it('registry sources take priority over env defaults', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/registry/path', depth: 1 }],
        }),
      );
      process.env.OBSERVER_WATCH_DIR = '/env/path';

      const config = await getConfig();

      expect(config.sources).toHaveLength(1);
      expect(config.sources[0].path).toBe('/registry/path');
    });

    it('falls back to defaults when registry has empty sources array', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ sources: [] }),
      );

      const config = await getConfig();

      // Should fall back to default sources (parent of cwd)
      expect(config.sources.length).toBeGreaterThan(0);
      expect(config.sources[0].path).toBe(path.resolve(process.cwd(), '..'));
    });
  });

  // -----------------------------------------------------------------------
  // writeConfig
  // -----------------------------------------------------------------------
  describe('writeConfig', () => {
    it('creates directory and writes config file', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockWriteFile.mockResolvedValue(undefined);

      await writeConfig({
        sources: [{ path: '/new/path', depth: 1 }],
      });

      expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('/new/path'),
        'utf-8',
      );
    });

    it('preserves existing fields in the registry file', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(
        JSON.stringify({ existingField: 'preserved', sources: [] }),
      );
      mockWriteFile.mockResolvedValue(undefined);

      await writeConfig({
        sources: [{ path: '/updated', depth: 2 }],
      });

      const writtenContent = JSON.parse(
        (mockWriteFile.mock.calls[0][1] as string).trim(),
      );
      expect(writtenContent.existingField).toBe('preserved');
      expect(writtenContent.sources[0].path).toBe('/updated');
    });

    it('writes pollInterval when provided', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockWriteFile.mockResolvedValue(undefined);

      await writeConfig({
        sources: [],
        pollInterval: 5000,
      });

      const writtenContent = JSON.parse(
        (mockWriteFile.mock.calls[0][1] as string).trim(),
      );
      expect(writtenContent.pollInterval).toBe(5000);
    });

    it('writes theme when provided', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockWriteFile.mockResolvedValue(undefined);

      await writeConfig({
        sources: [],
        theme: 'light',
      });

      const writtenContent = JSON.parse(
        (mockWriteFile.mock.calls[0][1] as string).trim(),
      );
      expect(writtenContent.theme).toBe('light');
    });

    it('does not write pollInterval when not provided', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockWriteFile.mockResolvedValue(undefined);

      await writeConfig({
        sources: [{ path: '/p', depth: 1 }],
      });

      const writtenContent = JSON.parse(
        (mockWriteFile.mock.calls[0][1] as string).trim(),
      );
      expect(writtenContent.pollInterval).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // discoverAllRunDirs
  // -----------------------------------------------------------------------
  describe('discoverAllRunDirs', () => {
    it('returns empty array when source directory does not exist', async () => {
      // Config with a non-existent source
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/nonexistent', depth: 2 }],
        }),
      );
      invalidateConfigCache();

      // stat fails for .a5c/runs
      mockStat.mockRejectedValue(new Error('ENOENT'));
      // readdir fails
      mockReaddir.mockRejectedValue(new Error('ENOENT'));

      const results = await discoverAllRunDirs();

      expect(results).toEqual([]);
    });

    it('discovers run directories within .a5c/runs at source root', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/projects/my-project', depth: 2 }],
        }),
      );
      invalidateConfigCache();

      // stat succeeds for .a5c/runs
      mockStat.mockImplementation(async (p: any) => {
        if (p === path.join('/projects/my-project', '.a5c', 'runs')) {
          return { isDirectory: () => true } as any;
        }
        throw new Error('ENOENT');
      });

      // readdir for scanning subdirectories and listing runs
      mockReaddir.mockImplementation(async (dir: any, _opts?: any) => {
        const dirStr = typeof dir === 'string' ? dir : dir.toString();
        if (dirStr === '/projects/my-project') {
          // No subdirs to recurse into (only .a5c)
          return [];
        }
        if (dirStr === path.join('/projects/my-project', '.a5c', 'runs')) {
          return [
            { name: 'run-001', isDirectory: () => true },
            { name: 'run-002', isDirectory: () => true },
          ] as any;
        }
        return [];
      });

      const results = await discoverAllRunDirs();

      expect(results).toHaveLength(2);
      expect(results[0].runDir).toBe(
        path.join('/projects/my-project', '.a5c', 'runs', 'run-001'),
      );
      expect(results[0].projectName).toBe('my-project');
      expect(results[1].runDir).toBe(
        path.join('/projects/my-project', '.a5c', 'runs', 'run-002'),
      );
    });

    it('handles depth=0 sources (direct runs directory)', async () => {
      const configJson = JSON.stringify({
        sources: [{ path: '/direct/runs', depth: 0, label: 'direct' }],
      });
      // Use mockImplementation so config reads get the config JSON
      // and run.json reads fail (no run.json file)
      mockReadFile.mockImplementation(async (filePath: any) => {
        const fileStr = typeof filePath === 'string' ? filePath : filePath.toString();
        if (fileStr.includes('run.json')) {
          throw new Error('ENOENT');
        }
        return configJson as any;
      });
      invalidateConfigCache();

      mockReaddir.mockImplementation(async (dir: any) => {
        const dirStr = typeof dir === 'string' ? dir : dir.toString();
        if (dirStr === '/direct/runs') {
          return [
            { name: 'run-a', isDirectory: () => true },
            { name: 'somefile.txt', isDirectory: () => false },
          ] as any;
        }
        return [];
      });

      const results = await discoverAllRunDirs();

      expect(results).toHaveLength(1);
      expect(results[0].runDir).toBe(path.join('/direct/runs', 'run-a'));
      expect(results[0].projectName).toBe('direct');
    });

    it('skips node_modules and hidden directories during scanning', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/workspace', depth: 1 }],
        }),
      );
      invalidateConfigCache();

      // No .a5c/runs at root level
      mockStat.mockRejectedValue(new Error('ENOENT'));

      mockReaddir.mockImplementation(async (dir: any) => {
        const dirStr = typeof dir === 'string' ? dir : dir.toString();
        if (dirStr === '/workspace') {
          return [
            { name: 'node_modules', isDirectory: () => true },
            { name: '.git', isDirectory: () => true },
            { name: 'project-a', isDirectory: () => true },
          ] as any;
        }
        return [];
      });

      const results = await discoverAllRunDirs();

      // Only project-a should be scanned, not node_modules or .git
      // Since no .a5c/runs found anywhere, results should be empty
      expect(results).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // findRunDir
  // -----------------------------------------------------------------------
  describe('findRunDir', () => {
    it('returns null when no matching runId is found', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/projects', depth: 1 }],
        }),
      );
      invalidateConfigCache();

      mockStat.mockRejectedValue(new Error('ENOENT'));
      mockReaddir.mockRejectedValue(new Error('ENOENT'));

      const result = await findRunDir('nonexistent-run');

      expect(result).toBeNull();
    });

    it('returns DiscoveredRun when matching runId is found', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/projects/myapp', depth: 2 }],
        }),
      );
      invalidateConfigCache();

      mockStat.mockImplementation(async (p: any) => {
        if (p === path.join('/projects/myapp', '.a5c', 'runs')) {
          return { isDirectory: () => true } as any;
        }
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        const dirStr = typeof dir === 'string' ? dir : dir.toString();
        if (dirStr === '/projects/myapp') {
          return [];
        }
        if (dirStr === path.join('/projects/myapp', '.a5c', 'runs')) {
          return [
            { name: 'target-run', isDirectory: () => true },
            { name: 'other-run', isDirectory: () => true },
          ] as any;
        }
        return [];
      });

      const result = await findRunDir('target-run');

      expect(result).not.toBeNull();
      expect(result!.runDir).toBe(
        path.join('/projects/myapp', '.a5c', 'runs', 'target-run'),
      );
      expect(result!.projectName).toBe('myapp');
    });
  });
});
