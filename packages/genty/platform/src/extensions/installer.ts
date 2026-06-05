import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ExtensionManifest, ExtensionSource } from '@a5c-ai/genty-core/extensions';

export interface InstalledExtension {
  manifest: ExtensionManifest;
  source: ExtensionSource;
  installPath: string;
  installedAt: string;
}

const EXTENSIONS_DIR = join(homedir(), '.genty', 'extensions');

export function getExtensionsDir(): string {
  return EXTENSIONS_DIR;
}

export function ensureExtensionsDir(): string {
  if (!existsSync(EXTENSIONS_DIR)) mkdirSync(EXTENSIONS_DIR, { recursive: true });
  return EXTENSIONS_DIR;
}

export function installFromNpm(packageName: string, version?: string): InstalledExtension {
  const dir = ensureExtensionsDir();
  const spec = version ? `${packageName}@${version}` : packageName;
  const installDir = join(dir, packageName.replace(/\//g, '-').replace(/^@/, ''));

  mkdirSync(installDir, { recursive: true });
  execSync(`npm install --prefix "${installDir}" "${spec}" --no-save`, { stdio: 'pipe' });

  const manifest = loadManifest(join(installDir, 'node_modules', packageName));
  return {
    manifest,
    source: { type: 'npm', packageName, version },
    installPath: join(installDir, 'node_modules', packageName),
    installedAt: new Date().toISOString(),
  };
}

export function installFromGit(url: string, ref?: string): InstalledExtension {
  const dir = ensureExtensionsDir();
  const repoName = url.split('/').pop()?.replace('.git', '') ?? 'unknown';
  const installDir = join(dir, repoName);

  const refArg = ref ? `--branch "${ref}"` : '';
  execSync(`git clone --depth 1 ${refArg} "${url}" "${installDir}"`, { stdio: 'pipe' });

  if (existsSync(join(installDir, 'package.json'))) {
    execSync(`npm install --prefix "${installDir}"`, { stdio: 'pipe' });
  }

  const manifest = loadManifest(installDir);
  return {
    manifest,
    source: { type: 'git', url, ref },
    installPath: installDir,
    installedAt: new Date().toISOString(),
  };
}

export function installFromLocal(localPath: string): InstalledExtension {
  const manifest = loadManifest(localPath);
  return {
    manifest,
    source: { type: 'local', path: localPath },
    installPath: localPath,
    installedAt: new Date().toISOString(),
  };
}

export function listInstalled(): InstalledExtension[] {
  const dir = getExtensionsDir();
  if (!existsSync(dir)) return [];

  const { readdirSync } = require('node:fs');
  const entries: InstalledExtension[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const extDir = join(dir, entry.name);
    try {
      const manifest = loadManifest(extDir);
      entries.push({
        manifest,
        source: { type: 'local', path: extDir },
        installPath: extDir,
        installedAt: '',
      });
    } catch {
      // Skip invalid extensions
    }
  }

  return entries;
}

function loadManifest(dir: string): ExtensionManifest {
  const manifestPath = join(dir, 'package.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`No package.json found at ${dir}`);
  }
  const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: pkg.main ?? 'index.js',
    engines: pkg.engines,
    permissions: pkg.genty?.permissions,
  };
}
