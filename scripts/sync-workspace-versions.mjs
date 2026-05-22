#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const targetVersion = getArgValue('--version');

if (!targetVersion) {
  console.error('Usage: node scripts/sync-workspace-versions.mjs --version <semver>');
  process.exit(1);
}

const packageJsonPaths = new Set(['package.json']);
const localPackageNames = new Set();
const pluginManifestPaths = [
  'plugins/babysitter-unified/plugin.json',
];
const versionsJsonPaths = [
  'plugins/babysitter-unified/versions.json',
];
const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const skipDirs = new Set(['.git', '.a5c', 'node_modules', 'dist', 'build', 'coverage', 'artifacts', 'generated', 'examples']);

for (const rootDir of ['packages', 'plugins']) {
  collectPackageJsons(rootDir);
}

for (const packagePath of packageJsonPaths) {
  const manifest = readJson(packagePath);
  if (String(manifest.name || '').startsWith('@a5c-ai/')) {
    localPackageNames.add(manifest.name);
  }
}

for (const packagePath of packageJsonPaths) {
  const manifest = readJson(packagePath);
  let changed = false;

  if (packagePath === 'package.json' || localPackageNames.has(manifest.name)) {
    if (manifest.version !== targetVersion) {
      manifest.version = targetVersion;
      changed = true;
    }
  }

  for (const field of dependencyFields) {
    if (!manifest[field]) continue;
    for (const [dependencyName, currentValue] of Object.entries(manifest[field])) {
      if (!localPackageNames.has(dependencyName)) continue;
      if (currentValue !== targetVersion) {
        manifest[field][dependencyName] = targetVersion;
        changed = true;
      }
    }
  }

  if (changed) {
    writeJson(packagePath, manifest);
  }
}

for (const manifestPath of pluginManifestPaths) {
  if (!existsSync(resolvePath(manifestPath))) continue;
  const manifest = readJson(manifestPath);
  if (manifest.version !== targetVersion) {
    manifest.version = targetVersion;
    writeJson(manifestPath, manifest);
  }
}

for (const versionsPath of versionsJsonPaths) {
  const versions = existsSync(resolvePath(versionsPath)) ? readJson(versionsPath) : {};
  let changed = false;
  if (versions.sdkVersion !== targetVersion) {
    versions.sdkVersion = targetVersion;
    changed = true;
  }
  if ('extensionVersion' in versions && versions.extensionVersion !== targetVersion) {
    versions.extensionVersion = targetVersion;
    changed = true;
  }
  if (changed) {
    writeJson(versionsPath, versions);
  }
}

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index >= 0) {
    return args[index + 1] ?? null;
  }
  const prefixed = args.find((arg) => arg.startsWith(`${flag}=`));
  return prefixed ? prefixed.slice(flag.length + 1) : null;
}

function collectPackageJsons(relativeDir) {
  const dir = resolvePath(relativeDir);
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const relativePath = join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        collectPackageJsons(relativePath);
      }
      continue;
    }
    if (entry.isFile() && entry.name === 'package.json') {
      packageJsonPaths.add(relativePath.replaceAll('\\', '/'));
    }
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolvePath(relativePath), 'utf8'));
}

function writeJson(relativePath, data) {
  writeFileSync(resolvePath(relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function resolvePath(relativePath) {
  return join(ROOT, relativePath);
}
