import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  McpResourceBrowser,
  type ResourceFetcher,
  type McpResource,
  type McpResourceContent,
} from '../resourceBrowser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResource(name: string, description?: string): McpResource {
  return { uri: `res://${name}`, name, description };
}

function makeContent(uri: string, text = 'content'): McpResourceContent {
  return { uri, text };
}

function createMockFetcher(resources: McpResource[]): ResourceFetcher {
  return {
    listResources: vi.fn().mockResolvedValue(resources),
    readResource: vi.fn().mockImplementation((uri: string) =>
      Promise.resolve(makeContent(uri)),
    ),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('McpResourceBrowser', () => {
  const NOW = 1_000_000;
  let fetcher: ResourceFetcher;
  let browser: McpResourceBrowser;

  beforeEach(() => {
    fetcher = createMockFetcher([
      makeResource('config', 'Application configuration'),
      makeResource('schema', 'Database schema'),
      makeResource('readme'),
    ]);
    browser = new McpResourceBrowser(fetcher, { cacheTtlMs: 5_000 });
  });

  // -----------------------------------------------------------------------
  // listResources
  // -----------------------------------------------------------------------

  describe('listResources', () => {
    it('returns resources from the fetcher', async () => {
      const resources = await browser.listResources(NOW);
      expect(resources).toHaveLength(3);
      expect(fetcher.listResources).toHaveBeenCalledTimes(1);
    });

    it('caches results within TTL', async () => {
      await browser.listResources(NOW);
      await browser.listResources(NOW + 4_999);
      expect(fetcher.listResources).toHaveBeenCalledTimes(1);
    });

    it('refetches after TTL expires', async () => {
      await browser.listResources(NOW);
      await browser.listResources(NOW + 5_001);
      expect(fetcher.listResources).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // readResource
  // -----------------------------------------------------------------------

  describe('readResource', () => {
    it('reads a resource by URI', async () => {
      const content = await browser.readResource('res://config', NOW);
      expect(content.uri).toBe('res://config');
      expect(content.text).toBe('content');
    });

    it('caches per-URI within TTL', async () => {
      await browser.readResource('res://config', NOW);
      await browser.readResource('res://config', NOW + 2_000);
      expect(fetcher.readResource).toHaveBeenCalledTimes(1);
    });

    it('refetches per-URI after TTL', async () => {
      await browser.readResource('res://config', NOW);
      await browser.readResource('res://config', NOW + 5_001);
      expect(fetcher.readResource).toHaveBeenCalledTimes(2);
    });

    it('caches different URIs independently', async () => {
      await browser.readResource('res://config', NOW);
      await browser.readResource('res://schema', NOW);
      expect(fetcher.readResource).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // searchResources
  // -----------------------------------------------------------------------

  describe('searchResources', () => {
    it('searches by name (case-insensitive)', async () => {
      const results = await browser.searchResources('CONFIG', NOW);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('config');
    });

    it('searches by description', async () => {
      const results = await browser.searchResources('database', NOW);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('schema');
    });

    it('returns empty array when nothing matches', async () => {
      const results = await browser.searchResources('nonexistent', NOW);
      expect(results).toHaveLength(0);
    });

    it('uses cached list for search', async () => {
      await browser.searchResources('config', NOW);
      await browser.searchResources('schema', NOW + 1_000);
      // listResources should only have been called once
      expect(fetcher.listResources).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // clearCache
  // -----------------------------------------------------------------------

  describe('clearCache', () => {
    it('invalidates all cached data', async () => {
      await browser.listResources(NOW);
      await browser.readResource('res://config', NOW);
      browser.clearCache();
      await browser.listResources(NOW + 1);
      await browser.readResource('res://config', NOW + 1);
      expect(fetcher.listResources).toHaveBeenCalledTimes(2);
      expect(fetcher.readResource).toHaveBeenCalledTimes(2);
    });
  });
});
