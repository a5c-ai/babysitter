import { describe, it, expect } from 'vitest';
import type {
  PluginInfo,
  PluginListing,
  PluginDetail,
  PluginBrowseOptions,
} from '../src/index.js';

/**
 * Type-shape tests for plugin types from 09-plugin-manager.md §3–§8.
 *
 * These tests verify that the type interfaces conform to the expected
 * shape by constructing values and checking field presence.
 */
describe('plugin-types', () => {
  describe('PluginInfo (InstalledPlugin)', () => {
    it('has all required fields', () => {
      const plugin: PluginInfo = {
        pluginId: '@openclaw/browser-skill',
        name: 'Browser Skill',
        version: '1.2.0',
        agent: 'openclaw',
        format: 'npm-package',
        installedAt: new Date(),
        enabled: true,
      };

      expect(plugin.pluginId).toBe('@openclaw/browser-skill');
      expect(plugin.name).toBe('Browser Skill');
      expect(plugin.version).toBe('1.2.0');
      expect(plugin.agent).toBe('openclaw');
      expect(plugin.format).toBe('npm-package');
      expect(plugin.installedAt).toBeInstanceOf(Date);
      expect(plugin.enabled).toBe(true);
    });

    it('supports optional description', () => {
      const plugin: PluginInfo = {
        pluginId: 'test-plugin',
        name: 'Test',
        version: '0.1.0',
        agent: 'opencode',
        format: 'skill-file',
        description: 'A test plugin',
        installedAt: new Date(),
        enabled: false,
      };

      expect(plugin.description).toBe('A test plugin');
    });
  });

  describe('PluginListing', () => {
    it('has all required fields', () => {
      const listing: PluginListing = {
        pluginId: 'opencode-tokenscope',
        name: 'tokenscope',
        latestVersion: '2.0.0',
        description: 'Token scope management',
        author: 'OpenCode Team',
        agents: ['opencode'],
        formats: ['npm-package'],
        registry: 'npm',
        tags: ['tokens', 'scope'],
        url: 'https://www.npmjs.com/package/opencode-tokenscope',
      };

      expect(listing.pluginId).toBe('opencode-tokenscope');
      expect(listing.agents).toEqual(['opencode']);
      expect(listing.formats).toEqual(['npm-package']);
      expect(listing.registry).toBe('npm');
    });

    it('supports optional weeklyDownloads', () => {
      const listing: PluginListing = {
        pluginId: 'test',
        name: 'Test',
        latestVersion: '1.0.0',
        description: 'Test',
        author: 'Author',
        weeklyDownloads: 1500,
        agents: ['opencode'],
        formats: ['npm-package'],
        registry: 'npm',
        tags: [],
        url: 'https://example.com',
      };

      expect(listing.weeklyDownloads).toBe(1500);
    });
  });

  describe('PluginDetail', () => {
    it('extends PluginListing with additional fields', () => {
      const detail: PluginDetail = {
        pluginId: '@openclaw/browser-skill',
        name: 'Browser Skill',
        latestVersion: '2.1.0',
        description: 'Browser automation',
        author: 'OpenClaw Team',
        agents: ['openclaw', 'opencode'],
        formats: ['npm-package', 'skill-file'],
        registry: 'npm',
        tags: ['web', 'browser'],
        url: 'https://example.com',
        versions: ['2.1.0', '2.0.0', '1.0.0'],
        readme: '# Browser Skill\n\nAutomation...',
        changelog: '## 2.1.0\n\n- Fixed bug',
        dependencies: ['puppeteer'],
        agentMinVersions: { opencode: '0.5.0' },
      };

      expect(detail.versions).toEqual(['2.1.0', '2.0.0', '1.0.0']);
      expect(detail.readme).toContain('Browser Skill');
      expect(detail.dependencies).toEqual(['puppeteer']);
      expect(detail.agentMinVersions).toEqual({ opencode: '0.5.0' });
    });

    it('has optional extended fields', () => {
      const detail: PluginDetail = {
        pluginId: 'minimal',
        name: 'Minimal',
        latestVersion: '1.0.0',
        description: 'Minimal plugin',
        author: 'Test',
        agents: ['pi'],
        formats: ['npm-package'],
        registry: 'npm',
        tags: [],
        url: 'https://example.com',
        versions: ['1.0.0'],
      };

      expect(detail.readme).toBeUndefined();
      expect(detail.changelog).toBeUndefined();
      expect(detail.dependencies).toBeUndefined();
      expect(detail.agentMinVersions).toBeUndefined();
    });
  });

  describe('PluginBrowseOptions', () => {
    it('extends PluginSearchOptions with category and sortBy', () => {
      const opts: PluginBrowseOptions = {
        agents: ['openclaw'],
        format: 'npm-package',
        registry: 'npm',
        limit: 50,
        category: 'coding',
        sortBy: 'downloads',
      };

      expect(opts.category).toBe('coding');
      expect(opts.sortBy).toBe('downloads');
      expect(opts.agents).toEqual(['openclaw']);
      expect(opts.limit).toBe(50);
    });
  });
});
