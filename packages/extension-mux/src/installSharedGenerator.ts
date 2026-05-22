// Generator for install-shared — generic plugin installation infrastructure.
// Only contains utilities any plugin would need: file ops, marketplace
// management, per-harness plugin paths.
// SDK-specific concepts (global state dirs, CLI resolution, process libraries)
// are provided by the plugin author via the manifest's `installSurface` field.

import * as fs from 'fs';
import * as path from 'path';
import type { A5cPluginManifest, TargetProfile } from './types.js';
import { resolveSdkConfig } from './sdkConfig.js';
import { resolveHarnessInstallSurfaceExports } from './transformHelpers.js';

function getHomeDirCode(targetProfile: TargetProfile, stateDir: string): string {
  const harnessHomeRelative = targetProfile.installLayout?.harnessHomeRelative;
  if (!harnessHomeRelative) {
    return `path.join(os.homedir(), '${stateDir}')`;
  }
  return `path.join(os.homedir(), ${JSON.stringify(harnessHomeRelative)})`;
}

function getPluginsDirCode(targetProfile: TargetProfile): string {
  const pluginsDirRelative = targetProfile.installLayout?.pluginsDirRelative;
  if (!pluginsDirRelative) {
    return `path.join(getHarnessHome(), 'plugins')`;
  }
  return `path.join(os.homedir(), ${JSON.stringify(pluginsDirRelative)})`;
}

function getMarketplacePathCode(targetProfile: TargetProfile): string {
  const marketplacePathRelative = targetProfile.installLayout?.marketplacePathRelative;
  if (!marketplacePathRelative) {
    return `path.join(getHarnessHome(), 'plugins', 'marketplace.json')`;
  }
  return `path.join(os.homedir(), ${JSON.stringify(marketplacePathRelative)})`;
}

export function generateInstallShared(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  sourceDir?: string
): string {
  const pluginName = manifest.name;
  const sdk = resolveSdkConfig(manifest);
  const authorName = typeof manifest.author === 'string' ? manifest.author : manifest.author.name;
  const homeDirCode = getHomeDirCode(targetProfile, sdk.stateDir);
  const pluginsDirCode = getPluginsDirCode(targetProfile);
  const marketplacePathCode = getMarketplacePathCode(targetProfile);

  const base = `'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN_NAME = ${JSON.stringify(pluginName)};
const PLUGIN_CATEGORY = 'Coding';

function getUserHome() {
  return os.homedir();
}

function getHarnessHome() {
  return ${homeDirCode};
}

function getHomePluginRoot(scope) {
  if (scope === 'workspace') return path.join(process.cwd(), '${sdk.stateDir}', 'plugins', PLUGIN_NAME);
  return path.join(${pluginsDirCode}, PLUGIN_NAME);
}

function getHomeMarketplacePath() {
  return ${marketplacePathCode};
}

function writeFileIfChanged(filePath, contents) {
  try {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === contents) return false;
  } catch {}
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
  return true;
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function copyPluginBundle(packageRoot, pluginRoot) {
  const bundleEntries = fs.readdirSync(packageRoot).filter(
    e => !['node_modules', '.git', 'test', 'dist'].includes(e)
  );
  fs.mkdirSync(pluginRoot, { recursive: true });
  for (const entry of bundleEntries) {
    const src = path.join(packageRoot, entry);
    const dest = path.join(pluginRoot, entry);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      copyRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\\n');
}

function ensureExecutable(filePath) {
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {}
}

function normalizeMarketplaceSourcePath(source, marketplacePath) {
  if (typeof source === 'string') {
    return path.relative(path.dirname(marketplacePath), source).replace(/\\\\/g, '/');
  }
  return source;
}

function ensureMarketplaceEntry(marketplacePath, pluginRoot) {
  let marketplace = readJson(marketplacePath) || {
    name: ${JSON.stringify(authorName)},
    plugins: [],
  };
  if (!Array.isArray(marketplace.plugins)) marketplace.plugins = [];
  const idx = marketplace.plugins.findIndex(p => p.name === PLUGIN_NAME);
  const relSource = './' + normalizeMarketplaceSourcePath(pluginRoot, marketplacePath);
  const entry = {
    name: PLUGIN_NAME,
    source: relSource,
    description: ${JSON.stringify(manifest.description)},
    version: ${JSON.stringify(manifest.version)},
    author: { name: ${JSON.stringify(authorName)} },
  };
  if (idx >= 0) marketplace.plugins[idx] = entry;
  else marketplace.plugins.push(entry);
  writeJson(marketplacePath, marketplace);
}

function removeMarketplaceEntry(marketplacePath) {
  const marketplace = readJson(marketplacePath);
  if (!marketplace || !Array.isArray(marketplace.plugins)) return;
  marketplace.plugins = marketplace.plugins.filter(p => p.name !== PLUGIN_NAME);
  writeJson(marketplacePath, marketplace);
}

function warnWindowsHooks() {
  if (process.platform === 'win32') {
    console.warn('[' + PLUGIN_NAME + '] Windows detected — shell hooks (.sh) require Git Bash or WSL.');
  }
}

function runPostInstall(pluginRoot) {
  const postInstall = path.join(pluginRoot, 'scripts', 'post-install.js');
  if (fs.existsSync(postInstall)) {
    spawnSync(process.execPath, [postInstall], {
      cwd: pluginRoot, stdio: 'inherit',
      env: { ...process.env, PLUGIN_ROOT: pluginRoot },
    });
  }
}
`;

  const baseExports = [
    'PLUGIN_NAME',
    'PLUGIN_CATEGORY',
    'getUserHome',
    'getHarnessHome',
    'getHomePluginRoot',
    'getHomeMarketplacePath',
    'writeFileIfChanged',
    'copyRecursive',
    'copyPluginBundle',
    'readJson',
    'writeJson',
    'ensureExecutable',
    'normalizeMarketplaceSourcePath',
    'ensureMarketplaceEntry',
    'removeMarketplaceEntry',
    'warnWindowsHooks',
    'runPostInstall',
  ];

  // Read plugin-specific surface (SDK concepts: global state, CLI resolution, etc.)
  let sdkSurface = '';
  const surfaceExports: string[] = [];
  if (sourceDir && manifest.installSurface) {
    const surfacePath = path.join(sourceDir, manifest.installSurface);
    if (fs.existsSync(surfacePath)) {
      sdkSurface = fs.readFileSync(surfacePath, 'utf-8');
    }
    if (manifest.installSurfaceExports) {
      surfaceExports.push(...manifest.installSurfaceExports);
    }
  }

  // Read per-harness surface (harness-specific installation logic)
  let harnessSurface = '';
  const harnessSurfaceExports = resolveHarnessInstallSurfaceExports(manifest, targetProfile);
  const override = manifest.targets?.[targetProfile.name];
  if (sourceDir && override?.harnessInstallSurface) {
    const surfacePath = path.join(sourceDir, override.harnessInstallSurface as string);
    if (fs.existsSync(surfacePath)) {
      harnessSurface = fs.readFileSync(surfacePath, 'utf-8');
    }
  }

  // Deduplicate: per-harness exports override base/SDK exports of the same name
  const overrideSet = new Set([...surfaceExports, ...harnessSurfaceExports]);
  const dedupedBase = baseExports.filter(e => !overrideSet.has(e));
  const allExports = [...dedupedBase, ...surfaceExports, ...harnessSurfaceExports];
  const exportsBlock = `\nmodule.exports = {\n  ${allExports.join(',\n  ')},\n};\n`;

  let result = base;
  if (sdkSurface) {
    result += '\n' + sdkSurface + '\n';
  }
  if (harnessSurface) {
    result += '\n' + harnessSurface + '\n';
  }
  return result + exportsBlock;
}
