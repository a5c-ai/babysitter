import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import {
  getConfig,
  invalidateConfigCache,
  writeConfig,
} from '../config-loader';

// Use vi.spyOn so both test and config-loader module share the same mock references
const mockReadFile = vi.spyOn(fs, 'readFile');
const mockWriteFile = vi.spyOn(fs, 'writeFile');
const mockMkdir = vi.spyOn(fs, 'mkdir');

describe('config-loader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
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
    delete process.env.OBSERVER_WATCH_EXCLUSIVE;
    invalidateConfigCache();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // -----------------------------------------------------------------------
  // invalidateConfigCache
  // -----------------------------------------------------------------------
  describe('invalidateConfigCache', () => {
    it('clears the cached config so next getConfig re-reads', async () => {
      mockReadFile.mockRejectedValue(new Error('no file'));
      const config1 = await getConfig();
      expect(config1).toBeDefined();

      invalidateConfigCache();

      mockReadFile.mockRejectedValue(new Error('no file'));
      const _config2 = await getConfig();
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

    it('explicit OBSERVER_WATCH_DIR MERGES with a non-empty registry (QA F3)', async () => {
      // Starting with --watch-dir must NOT drop the Settings-persisted
      // registry sources: they merge (explicit first), deduped by path.
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/registered/path', depth: 3, label: 'registry' }],
        }),
      );
      process.env.OBSERVER_WATCH_DIR = '/explicit/watch/dir';
      invalidateConfigCache();

      const config = await getConfig();

      const nonHome = config.sources.filter((s) => s.label !== 'home');
      expect(nonHome).toHaveLength(2);
      expect(nonHome[0].path).toBe('/explicit/watch/dir');
      expect(nonHome[0].label).toBe('cli');
      expect(nonHome[1].path).toBe('/registered/path');
      expect(nonHome[1].label).toBe('registry');
    });

    it('Settings-persisted sources survive a start with --watch-dir (QA F3)', async () => {
      // Live regression: ~/.a5c/observer.json held a second Settings-added
      // source; starting the CLI with --watch-dir X made it vanish.
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [
            { path: '/home/user/projects', depth: 2, label: 'settings-added' },
            { path: '/home/user/.a5c/runs', depth: 0, label: 'home' },
          ],
        }),
      );
      process.env.OBSERVER_WATCH_DIR = '/current/project';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.sources.some((s) => s.path === '/home/user/projects')).toBe(true);
      expect(config.sources.some((s) => s.path === '/current/project')).toBe(true);
    });

    it('deduplicates by path when --watch-dir repeats a registry source', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/same/path', depth: 2, label: 'registry' }],
        }),
      );
      process.env.OBSERVER_WATCH_DIR = '/same/path';
      invalidateConfigCache();

      const config = await getConfig();

      const matches = config.sources.filter(
        (s) => path.resolve(s.path) === path.resolve('/same/path'),
      );
      expect(matches).toHaveLength(1);
      // Explicit CLI intent wins the dedupe (listed first).
      expect(matches[0].label).toBe('cli');
    });

    it('depth:0 auto-added runs-dir WINS over a stale registry depth>0 entry for the same path (empty-WORKING fix)', async () => {
      // Live regression: ~/.a5c/observer.json listed /home/user/.a5c/runs at
      // depth:3 (so discovery scanned it as a projects-parent and found none of
      // its direct child run dirs). getConfig also auto-adds that SAME path at
      // depth:0. A first-wins dedup dropped the depth:0 entry, so home runs
      // were never discovered and the WORKING column stayed empty. The dedup
      // must now let the depth:0 (direct runs-dir) reading win.
      const homeRuns = path.join(os.homedir(), '.a5c', 'runs');
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: homeRuns, depth: 3, label: 'cli' }],
        }),
      );
      invalidateConfigCache();

      const config = await getConfig();

      // Exactly one entry for ~/.a5c/runs, and it must be the direct runs-dir.
      const matches = config.sources.filter(
        (s) => path.resolve(s.path) === path.resolve(homeRuns),
      );
      expect(matches).toHaveLength(1);
      expect(matches[0].depth).toBe(0);
      expect(matches[0].label).toBe('home');
    });

    it('OBSERVER_WATCH_EXCLUSIVE keeps explicit sources exclusive — registry is NOT merged', async () => {
      // The e2e isolation escape hatch: fixture-only sources, no leakage.
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          sources: [{ path: '/registered/path', depth: 3, label: 'registry' }],
        }),
      );
      process.env.OBSERVER_WATCH_DIR = '/fixtures/only';
      process.env.OBSERVER_WATCH_EXCLUSIVE = '1';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.sources).toHaveLength(1);
      expect(config.sources[0].path).toBe('/fixtures/only');
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

      expect(config.sources.filter((s) => s.label !== 'home')).toHaveLength(1);
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

    it('caches config and returns cached version within TTL', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ sources: [] }));

      const config1 = await getConfig();
      const config2 = await getConfig();

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(config1).toBe(config2);
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

    it('auto-adds the home ~/.a5c/runs dir when OBSERVER_WATCH_EXCLUSIVE is unset', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      process.env.OBSERVER_WATCH_DIR = '/custom/watch/dir';
      invalidateConfigCache();

      const config = await getConfig();

      const homeRuns = path.join(os.homedir(), '.a5c', 'runs');
      expect(config.sources.some((s) => path.resolve(s.path) === path.resolve(homeRuns))).toBe(true);
      expect(config.sources.some((s) => s.label === 'home')).toBe(true);
    });

    it('does NOT auto-add the home ~/.a5c/runs dir when OBSERVER_WATCH_EXCLUSIVE is set', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      process.env.OBSERVER_WATCH_DIR = '/custom/watch/dir';
      process.env.OBSERVER_WATCH_EXCLUSIVE = '1';
      invalidateConfigCache();

      const config = await getConfig();

      const homeRuns = path.join(os.homedir(), '.a5c', 'runs');
      expect(config.sources.some((s) => path.resolve(s.path) === path.resolve(homeRuns))).toBe(false);
      expect(config.sources.some((s) => s.label === 'home')).toBe(false);
      // Only the explicitly configured source remains.
      expect(config.sources).toHaveLength(1);
      expect(config.sources[0].path).toBe('/custom/watch/dir');
    });

    it('defaults theme to dark for invalid theme values', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ sources: [] }));
      process.env.THEME = 'invalid-theme';
      invalidateConfigCache();

      const config = await getConfig();

      expect(config.theme).toBe('dark');
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
  });
});
