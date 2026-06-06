import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import {
  MarketplaceClient,
  MarketplaceInstaller,
  type FetchFn,
  type MarketplaceEntry,
} from '../marketplace';

// ---------------------------------------------------------------------------
// Mock fetch helper
// ---------------------------------------------------------------------------

function mockFetch(responseMap: Record<string, { ok: boolean; status: number; body: unknown }>): FetchFn {
  return async (url: string) => {
    const entry = Object.entries(responseMap).find(([pattern]) => url.includes(pattern));
    if (!entry) {
      return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
    }
    const [, response] = entry;
    return {
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
      text: async () => (typeof response.body === 'string' ? response.body : JSON.stringify(response.body)),
    };
  };
}

// ---------------------------------------------------------------------------
// MarketplaceClient
// ---------------------------------------------------------------------------

describe('MarketplaceClient', () => {
  it('searches the marketplace', async () => {
    const fetch = mockFetch({
      '/search': {
        ok: true,
        status: 200,
        body: { entries: [{ id: 'plug-1', name: 'Test Plugin' }], total: 1 },
      },
    });
    const client = new MarketplaceClient('https://marketplace.test', fetch);

    const result = await client.search('test');
    expect(result.total).toBe(1);
    expect(result.entries[0].id).toBe('plug-1');
  });

  it('gets a single entry', async () => {
    const entry: MarketplaceEntry = {
      id: 'plug-1',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      author: 'tester',
      downloadUrl: 'https://cdn.test/plug-1.json',
      checksumSha256: 'abc123',
    };
    const fetch = mockFetch({
      '/entries/plug-1': { ok: true, status: 200, body: entry },
    });
    const client = new MarketplaceClient('https://marketplace.test', fetch);

    const result = await client.getEntry('plug-1');
    expect(result.name).toBe('Test Plugin');
    expect(result.version).toBe('1.0.0');
  });

  it('lists categories', async () => {
    const fetch = mockFetch({
      '/categories': {
        ok: true,
        status: 200,
        body: { categories: ['observability', 'governance', 'tools'] },
      },
    });
    const client = new MarketplaceClient('https://marketplace.test', fetch);

    const cats = await client.listCategories();
    expect(cats).toEqual(['observability', 'governance', 'tools']);
  });

  it('throws on HTTP error', async () => {
    const fetch = mockFetch({
      '/search': { ok: false, status: 500, body: {} },
    });
    const client = new MarketplaceClient('https://marketplace.test', fetch);

    await expect(client.search('boom')).rejects.toThrow('HTTP 500');
  });
});

// ---------------------------------------------------------------------------
// MarketplaceInstaller
// ---------------------------------------------------------------------------

describe('MarketplaceInstaller', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'marketplace-'));
  });
  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function makeEntry(content: string): MarketplaceEntry {
    const checksum = createHash('sha256').update(content).digest('hex');
    return {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      author: 'tester',
      downloadUrl: 'https://cdn.test/test-plugin.json',
      checksumSha256: checksum,
    };
  }

  it('installs a plugin to the target directory', async () => {
    const content = JSON.stringify({ name: 'test-plugin', version: '1.0.0' });
    const entry = makeEntry(content);

    const fetch = mockFetch({
      'cdn.test': { ok: true, status: 200, body: content },
    });
    const installer = new MarketplaceInstaller(fetch);

    const installed = await installer.install(entry, tempDir);
    expect(installed).toBe(join(tempDir, 'test-plugin'));

    const manifest = readFileSync(join(installed, 'plugin.json'), 'utf8');
    expect(manifest).toBe(content);
  });

  it('verifies a correctly installed plugin', async () => {
    const content = JSON.stringify({ name: 'test-plugin' });
    const entry = makeEntry(content);

    const fetch = mockFetch({
      'cdn.test': { ok: true, status: 200, body: content },
    });
    const installer = new MarketplaceInstaller(fetch);

    const installed = await installer.install(entry, tempDir);
    expect(installer.verify(entry, installed)).toBe(true);
  });

  it('fails verification for tampered content', async () => {
    const content = JSON.stringify({ name: 'test-plugin' });
    const entry = makeEntry(content);

    // Install with different content
    const tamperedContent = JSON.stringify({ name: 'tampered' });
    const fetch = mockFetch({
      'cdn.test': { ok: true, status: 200, body: tamperedContent },
    });
    const installer = new MarketplaceInstaller(fetch);

    const installed = await installer.install(entry, tempDir);
    expect(installer.verify(entry, installed)).toBe(false);
  });

  it('fails verification for missing plugin', () => {
    const entry = makeEntry('whatever');
    const installer = new MarketplaceInstaller(async () => ({
      ok: true, status: 200, json: async () => ({}), text: async () => '',
    }));

    expect(installer.verify(entry, join(tempDir, 'nonexistent'))).toBe(false);
  });
});
