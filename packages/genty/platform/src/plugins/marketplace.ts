/**
 * CC Marketplace Protocol Support (GAP-ECO-002).
 *
 * Client and installer for the babysitter plugin marketplace.
 * Uses injectable fetch for testability — no actual HTTP calls
 * are hard-wired.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketplaceEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  downloadUrl: string;
  checksumSha256: string;
  category?: string;
}

export interface MarketplaceSearchResult {
  entries: MarketplaceEntry[];
  total: number;
}

export interface MarketplaceCategoryList {
  categories: string[];
}

/** Minimal fetch interface for dependency injection. */
export type FetchFn = (url: string, init?: { method?: string }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

// ---------------------------------------------------------------------------
// MarketplaceClient
// ---------------------------------------------------------------------------

export class MarketplaceClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetch: FetchFn,
  ) {}

  /**
   * Search the marketplace by query string.
   */
  async search(query: string): Promise<MarketplaceSearchResult> {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
    const res = await this.fetch(url);
    if (!res.ok) {
      throw new Error(`Marketplace search failed: HTTP ${res.status}`);
    }
    return (await res.json()) as MarketplaceSearchResult;
  }

  /**
   * Get a single marketplace entry by id.
   */
  async getEntry(id: string): Promise<MarketplaceEntry> {
    const url = `${this.baseUrl}/entries/${encodeURIComponent(id)}`;
    const res = await this.fetch(url);
    if (!res.ok) {
      throw new Error(`Marketplace getEntry failed: HTTP ${res.status}`);
    }
    return (await res.json()) as MarketplaceEntry;
  }

  /**
   * List all available categories.
   */
  async listCategories(): Promise<string[]> {
    const url = `${this.baseUrl}/categories`;
    const res = await this.fetch(url);
    if (!res.ok) {
      throw new Error(`Marketplace listCategories failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as MarketplaceCategoryList;
    return data.categories;
  }
}

// ---------------------------------------------------------------------------
// MarketplaceInstaller
// ---------------------------------------------------------------------------

export class MarketplaceInstaller {
  constructor(private readonly fetch: FetchFn) {}

  /**
   * Download and install a marketplace entry to the target directory.
   * Returns the path where the plugin was installed.
   */
  async install(entry: MarketplaceEntry, targetDir: string): Promise<string> {
    const res = await this.fetch(entry.downloadUrl);
    if (!res.ok) {
      throw new Error(`Download failed for ${entry.id}: HTTP ${res.status}`);
    }

    const content = await res.text();
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const pluginDir = join(targetDir, entry.id);
    if (!existsSync(pluginDir)) {
      mkdirSync(pluginDir, { recursive: true });
    }

    const manifestPath = join(pluginDir, 'plugin.json');
    writeFileSync(manifestPath, content, 'utf8');

    return pluginDir;
  }

  /**
   * Verify an installed plugin matches its expected checksum.
   */
  verify(entry: MarketplaceEntry, installedPath: string): boolean {
    const manifestPath = join(installedPath, 'plugin.json');
    if (!existsSync(manifestPath)) return false;

    const content = readFileSync(manifestPath, 'utf8');
    const hash = createHash('sha256').update(content).digest('hex');
    return hash === entry.checksumSha256;
  }
}
