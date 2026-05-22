#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const DOCS_SURFACE_PATH = 'docs/generated/package-plugin-docs-coverage.json';
const BUGS_URL = 'https://github.com/a5c-ai/babysitter/issues';
const REPOSITORY_URL = 'git+https://github.com/a5c-ai/babysitter.git';

function fail(message) {
  console.error(`Metadata verification failed: ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    fail(`Unable to read ${relativePath}: ${error.message}`);
  }
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label} expected ${JSON.stringify(expected)} but found ${JSON.stringify(actual)}`);
  }
}

function expectDeepEqual(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    fail(`${label} expected ${expectedJson} but found ${actualJson}`);
  }
}

function expectPublicPackage(manifest, label) {
  if (manifest.private !== undefined && manifest.private !== false) {
    fail(`${label} private expected undefined or false but found ${JSON.stringify(manifest.private)}`);
  }
}

function normalizePath(value) {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
}

function isPublicStatus(status) {
  return typeof status === 'string' && status.startsWith('Public');
}

function isInternalStatus(status) {
  return typeof status === 'string' && status.startsWith('Internal');
}

function packageExists(surfacePath) {
  return fs.existsSync(path.join(repoRoot, surfacePath, 'package.json'));
}

function createCanonicalMetadata(surfacePath) {
  return {
    repository: {
      type: 'git',
      url: REPOSITORY_URL,
      directory: surfacePath,
    },
    homepage: `https://github.com/a5c-ai/babysitter/tree/main/${surfacePath}#readme`,
    bugs: {
      url: BUGS_URL,
    },
  };
}

function coversFileEntry(files, relativePath) {
  const target = normalizePath(relativePath);
  const targetRoot = target.split('/')[0];
  return files.some((entry) => {
    const normalized = normalizePath(entry).replace(/\/\*.*$/, '').replace(/\*.*$/, '');
    if (!normalized) {
      return false;
    }
    if (normalized === target) {
      return true;
    }
    if (target.startsWith(`${normalized}/`)) {
      return true;
    }
    return normalized === targetRoot;
  });
}

function addSurfacePath(target, value) {
  if (typeof value !== 'string') {
    return;
  }
  const normalized = normalizePath(value);
  if (!normalized || normalized === 'package.json') {
    return;
  }
  target.add(normalized);
}

function collectExportPaths(target, exportsField) {
  if (!exportsField || typeof exportsField !== 'object') {
    return;
  }
  for (const value of Object.values(exportsField)) {
    if (typeof value === 'string') {
      addSurfacePath(target, value);
      continue;
    }
    if (value && typeof value === 'object') {
      collectExportPaths(target, value);
    }
  }
}

function collectManifestSurfacePaths(manifest) {
  const surfacePaths = new Set();
  addSurfacePath(surfacePaths, manifest.main);
  addSurfacePath(surfacePaths, manifest.module);
  addSurfacePath(surfacePaths, manifest.types);

  if (manifest.bin && typeof manifest.bin === 'object') {
    for (const value of Object.values(manifest.bin)) {
      addSurfacePath(surfacePaths, value);
    }
  }

  collectExportPaths(surfacePaths, manifest.exports);
  return [...surfacePaths];
}

function shouldCheckExplicitFile(entry) {
  const normalized = normalizePath(entry);
  if (!normalized || normalized.includes('*') || normalized.endsWith('/')) {
    return false;
  }
  const root = normalized.split('/')[0];
  if (root === 'dist' || root === 'dist-types' || root === '.next') {
    return false;
  }
  return normalized.includes('.');
}

function listManagedPackageJsons() {
  const managed = [];
  for (const topLevel of ['packages', 'plugins']) {
    walkPackageJsons(path.join(repoRoot, topLevel), managed);
  }
  return managed;
}

function walkPackageJsons(dirPath, output) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (
      entry.name.startsWith('.') ||
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'dist-types' ||
      entry.name === 'coverage' ||
      entry.name === 'artifacts'
    ) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkPackageJsons(fullPath, output);
      continue;
    }
    if (entry.isFile() && entry.name === 'package.json') {
      output.push(fullPath);
    }
  }
}

const rootManifest = readJson('package.json');
expectEqual(rootManifest.private, true, 'package.json private');
expectEqual(rootManifest.license, 'MIT', 'package.json license');

const docsCoverage = readJson(DOCS_SURFACE_PATH);
const publicSurfaceEntries = docsCoverage.surfaces.filter((entry) => isPublicStatus(entry.status) && packageExists(entry.surface));
const internalSurfaceEntries = docsCoverage.surfaces.filter((entry) => isInternalStatus(entry.status) && packageExists(entry.surface));
const publicSurfacePaths = new Set(publicSurfaceEntries.map((entry) => entry.surface));

for (const entry of publicSurfaceEntries) {
  const packageDir = entry.surface;
  const relativePath = path.join(packageDir, 'package.json');
  const manifest = readJson(relativePath);
  const readmeRelativePath = path.join(packageDir, 'README.md');
  const readmeFullPath = path.join(repoRoot, readmeRelativePath);
  const canonical = createCanonicalMetadata(packageDir);

  expectPublicPackage(manifest, `${relativePath}`);
  expectEqual(manifest.license, 'MIT', `${relativePath} license`);
  expectEqual(manifest.publishConfig && manifest.publishConfig.access, 'public', `${relativePath} publishConfig.access`);
  expectDeepEqual(manifest.repository, canonical.repository, `${relativePath} repository`);
  expectEqual(manifest.homepage, canonical.homepage, `${relativePath} homepage`);
  expectDeepEqual(manifest.bugs, canonical.bugs, `${relativePath} bugs`);

  if (!fs.existsSync(readmeFullPath)) {
    fail(`${relativePath} is public but ${readmeRelativePath} is missing`);
  }

  if (!Array.isArray(manifest.files)) {
    fail(`${relativePath} must declare a files array for publish auditing`);
  }

  if (!manifest.files.includes('README.md')) {
    fail(`${relativePath} must include README.md in files for publish-surface parity`);
  }

  for (const surfacedPath of collectManifestSurfacePaths(manifest)) {
    if (!coversFileEntry(manifest.files, surfacedPath)) {
      fail(`${relativePath} entrypoint path ${JSON.stringify(surfacedPath)} is not covered by files`);
    }
  }

  for (const entry of manifest.files) {
    if (typeof entry !== 'string') {
      continue;
    }
    if (!shouldCheckExplicitFile(entry)) {
      continue;
    }
    const filePath = path.join(repoRoot, packageDir, entry);
    if (!fs.existsSync(filePath)) {
      fail(`${relativePath} references missing publish-surface file ${path.join(packageDir, entry)}`);
    }
  }
}

for (const entry of internalSurfaceEntries) {
  const relativePath = path.join(entry.surface, 'package.json');
  const manifest = readJson(relativePath);
  if (manifest.private !== true) {
    fail(`${relativePath} is internal-only in ${DOCS_SURFACE_PATH} but private is ${JSON.stringify(manifest.private)}`);
  }
}

for (const packageJsonPath of listManagedPackageJsons()) {
  const relativePath = normalizePath(path.relative(repoRoot, packageJsonPath));
  const packageDir = path.dirname(relativePath);
  const manifest = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const managedByNamespace = typeof manifest.name === 'string' && manifest.name.startsWith('@a5c-ai/');
  if (!managedByNamespace) {
    continue;
  }
  const looksPublic = manifest.private !== true || (manifest.publishConfig && manifest.publishConfig.access === 'public');
  if (looksPublic && !publicSurfacePaths.has(packageDir)) {
    fail(`${relativePath} looks public but is not listed as a public surface in ${DOCS_SURFACE_PATH}`);
  }
}

console.log('Metadata verification passed.');
