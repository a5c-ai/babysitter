import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
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
