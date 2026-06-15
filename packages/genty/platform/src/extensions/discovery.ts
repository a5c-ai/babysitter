import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { ExtensionRegistry } from '@a5c-ai/genty-core/extensions';
import type { GentyExtension, ExtensionManifest } from '@a5c-ai/genty-core/extensions';

const EXTENSIONS_DIR = join(homedir(), '.genty', 'extensions');

export interface DiscoveredExtension {
  manifest: ExtensionManifest;
  path: string;
  mainPath: string;
}

export function getDiscoveryDir(): string {
  return EXTENSIONS_DIR;
}

export function discoverExtensions(dir?: string): DiscoveredExtension[] {
  const searchDir = dir ?? EXTENSIONS_DIR;
  if (!existsSync(searchDir)) return [];

  const results: DiscoveredExtension[] = [];
  for (const entry of readdirSync(searchDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const extDir = join(searchDir, entry.name);
    const manifest = loadManifestSafe(extDir);
    if (!manifest) continue;

    const mainPath = join(extDir, manifest.main);
    if (!existsSync(mainPath)) continue;

    results.push({ manifest, path: extDir, mainPath });
  }
  return results;
}

export async function loadExtensionModule(mainPath: string): Promise<GentyExtension | undefined> {
  try {
    const mod = await import(mainPath);
    const ext = mod.default ?? mod;
    if (typeof ext.activate === 'function' && typeof ext.name === 'string') {
      return ext as GentyExtension;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function activateDiscoveredExtensions(
  registry: ExtensionRegistry,
  dir?: string,
): Promise<{ activated: string[]; failed: string[] }> {
  const discovered = discoverExtensions(dir);
  const activated: string[] = [];
  const failed: string[] = [];

  for (const ext of discovered) {
    try {
      const module = await loadExtensionModule(ext.mainPath);
      if (!module) {
        failed.push(ext.manifest.name);
        continue;
      }
      await registry.activate(module);
      activated.push(ext.manifest.name);
    } catch {
      failed.push(ext.manifest.name);
    }
  }

  return { activated, failed };
}

function loadManifestSafe(dir: string): ExtensionManifest | undefined {
  const manifestPath = join(dir, 'package.json');
  if (!existsSync(manifestPath)) return undefined;
  try {
    const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (!pkg.name || !pkg.version) return undefined;
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      main: pkg.main ?? 'index.js',
      engines: pkg.engines,
      permissions: pkg.genty?.permissions,
    };
  } catch {
    return undefined;
  }
}
