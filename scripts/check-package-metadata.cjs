#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const DOCS_SURFACE_PATH = 'docs/generated/package-plugin-docs-coverage.json';
const BUGS_URL = 'https://github.com/a5c-ai/babysitter/issues';
const REPOSITORY_URL = 'git+https://github.com/a5c-ai/babysitter.git';
const TULA_CORE_SURFACE = 'packages/tula-core';
const TULA_CORE_PACKAGE = '@a5c-ai/tula-core';
const OLD_AGENT_CORE_SURFACE = 'packages/agent-core';
const OLD_AGENT_CORE_PACKAGE = '@a5c-ai/agent-core';
const TULA_RUNTIME_SURFACE = 'packages/tula-runtime';
const TULA_RUNTIME_PACKAGE = '@a5c-ai/tula-runtime';
const OLD_AGENT_RUNTIME_SURFACE = ['packages', 'agent-runtime'].join('/');
const OLD_AGENT_RUNTIME_PACKAGE = ['@a5c-ai', 'agent-runtime'].join('/');
const TOP_LEVEL_AGENT_MUX_PACKAGE_MOVES = [
  {
    oldPath: 'packages/transport-mux',
    newPath: 'packages/agent-mux/transport',
    oldName: '@a5c-ai/agent-mux-transport',
    newName: '@a5c-ai/agent-mux-transport',
  },
  {
    oldPath: 'packages/extension-mux',
    newPath: 'packages/agent-mux/extensions',
    oldName: '@a5c-ai/agent-mux-extensions',
    newName: '@a5c-ai/agent-mux-extensions',
  },
  {
    oldPath: 'packages/triggers-mux',
    newPath: 'packages/agent-mux/triggers',
    oldName: '@a5c-ai/agent-mux-triggers',
    newName: '@a5c-ai/agent-mux-triggers',
  },
  {
    oldPath: 'packages/tasks-mux',
    newPath: 'packages/agent-mux/tasks',
    oldName: '@a5c-ai/agent-mux-tasks',
    newName: '@a5c-ai/agent-mux-tasks',
  },
  {
    oldPath: 'packages/tool-mux',
    newPath: 'packages/agent-mux/tools',
    oldName: '@a5c-ai/agent-mux-tools',
    newName: '@a5c-ai/agent-mux-tools',
  },
];

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

function pathExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
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

function findMarketplacePluginEntry(manifest, pluginName) {
  if (Array.isArray(manifest.plugins)) {
    return manifest.plugins.find((entry) => entry && entry.name === pluginName) || null;
  }
  if (manifest.plugins && typeof manifest.plugins === 'object') {
    return manifest.plugins[pluginName] || null;
  }
  return null;
}

function verifyBabysitterPluginVersionSync() {
  const versions = readJson('plugins/babysitter-unified/versions.json');
  const unifiedPlugin = readJson('plugins/babysitter-unified/plugin.json');
  const expectedVersion = versions.sdkVersion;
  if (typeof expectedVersion !== 'string' || expectedVersion.trim() === '') {
    fail('plugins/babysitter-unified/versions.json sdkVersion must be a non-empty string');
  }
  expectEqual(unifiedPlugin.version, expectedVersion, 'plugins/babysitter-unified/plugin.json version');

  for (const manifestPath of [
    '.claude-plugin/marketplace.json',
    '.cursor-plugin/marketplace.json',
    '.agents/plugins/marketplace.json',
    '.github/plugin/marketplace.json',
  ]) {
    if (!fs.existsSync(path.join(repoRoot, manifestPath))) {
      continue;
    }
    const manifest = readJson(manifestPath);
    const entry = findMarketplacePluginEntry(manifest, 'babysitter');
    if (!entry) {
      continue;
    }
    expectEqual(entry.version, expectedVersion, `${manifestPath} babysitter version`);
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
  return pathExists(path.join(surfacePath, 'package.json'));
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

function verifyTulaCoreRename() {
  if (fs.existsSync(path.join(repoRoot, OLD_AGENT_CORE_SURFACE))) {
    fail(`${OLD_AGENT_CORE_SURFACE} must be renamed to ${TULA_CORE_SURFACE}`);
  }

  if (!fs.existsSync(path.join(repoRoot, TULA_CORE_SURFACE, 'package.json'))) {
    fail(`${TULA_CORE_SURFACE}/package.json must exist`);
  }

  const manifest = readJson(path.join(TULA_CORE_SURFACE, 'package.json'));
  expectEqual(manifest.name, TULA_CORE_PACKAGE, `${TULA_CORE_SURFACE}/package.json name`);
  expectDeepEqual(manifest.repository, createCanonicalMetadata(TULA_CORE_SURFACE).repository, `${TULA_CORE_SURFACE}/package.json repository`);
  expectEqual(manifest.homepage, createCanonicalMetadata(TULA_CORE_SURFACE).homepage, `${TULA_CORE_SURFACE}/package.json homepage`);

  const docsCoverage = readJson(DOCS_SURFACE_PATH);
  const tulaCoreSurface = docsCoverage.surfaces.find((entry) => entry.surface === TULA_CORE_SURFACE);
  if (!tulaCoreSurface) {
    fail(`${DOCS_SURFACE_PATH} must list ${TULA_CORE_SURFACE}`);
  }
  expectEqual(tulaCoreSurface.packageName, TULA_CORE_PACKAGE, `${DOCS_SURFACE_PATH} ${TULA_CORE_SURFACE} packageName`);

  const oldSurface = docsCoverage.surfaces.find((entry) => entry.surface === OLD_AGENT_CORE_SURFACE);
  if (oldSurface) {
    fail(`${DOCS_SURFACE_PATH} must not list ${OLD_AGENT_CORE_SURFACE}`);
  }
}

function verifyTulaCoreDependents() {
  const packageJsonPaths = [
    'packages/tula-platform/package.json',
    'packages/tula/package.json',
  ];
  for (const packageJsonPath of packageJsonPaths) {
    const manifest = readJson(packageJsonPath);
    if (manifest.dependencies && Object.prototype.hasOwnProperty.call(manifest.dependencies, OLD_AGENT_CORE_PACKAGE)) {
      fail(`${packageJsonPath} must depend on ${TULA_CORE_PACKAGE}, not ${OLD_AGENT_CORE_PACKAGE}`);
    }
  }

  const tsconfigPaths = [
    'packages/tula-platform/tsconfig.json',
    'packages/tula/tsconfig.json',
  ];
  for (const tsconfigPath of tsconfigPaths) {
    const config = readJson(tsconfigPath);
    const staleReference = (config.references || []).find((reference) => reference && reference.path === '../agent-core');
    if (staleReference) {
      fail(`${tsconfigPath} must reference ../tula-core, not ../agent-core`);
    }
  }

  const staleImportFiles = [
    'packages/tula-platform/src/harness/index.ts',
    'packages/tula-platform/src/harness/internal/createRun/utils.ts',
    'packages/tula-platform/src/harness/internal/createRun/planProcess/phaseHelpers.ts',
    'packages/tula-platform/src/harness/internal/createRun/orchestration/internalTools.ts',
    'packages/tula-platform/src/harness/internal/createRun/__tests__/createRun.test.ts',
    'packages/tula-platform/src/harness/internal/createRun/__tests__/utils.test.ts',
    'packages/tula-platform/src/harness/amux/__tests__/amuxInvokerWiring.test.ts',
    'packages/tula/src/index.ts',
    'packages/tula/src/cli/commands/harness/resumeRun.ts',
  ];
  for (const filePath of staleImportFiles) {
    const fullPath = path.join(repoRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    const contents = fs.readFileSync(fullPath, 'utf8');
    if (contents.includes(OLD_AGENT_CORE_PACKAGE)) {
      fail(`${filePath} must import ${TULA_CORE_PACKAGE}, not ${OLD_AGENT_CORE_PACKAGE}`);
    }
  }
}

function verifyTulaCoreExternalSurfaces() {
  const stalePatterns = [OLD_AGENT_CORE_PACKAGE, OLD_AGENT_CORE_SURFACE, 'packages/agent-core/', '../agent-core'];
  const files = [
    'package-lock.json',
    '.github/workflows/ci.yml',
    '.github/workflows/publish.yml',
    '.github/workflows/publish-packages-from-tag.yml',
    '.github/workflows/live-stack.yml',
    'docs/workspace-validation.md',
    'docs/package-and-plugin-map.md',
    'docs/testing/agent-mux-and-runtime-e2e.md',
    'docs/testing/current-test-command-inventory.md',
    'docs/testing/stack-permutations.md',
    'packages/tula/README.md',
    'packages/atlas/graph/coverage-checklist.md',
    'packages/atlas/graph/agent-stack/core-impls/tula-core-current.yaml',
  ];

  for (const filePath of files) {
    const fullPath = path.join(repoRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    const contents = fs.readFileSync(fullPath, 'utf8');
    const stalePattern = stalePatterns.find((pattern) => contents.includes(pattern));
    if (stalePattern) {
      fail(`${filePath} must not contain stale tula-core package identity ${JSON.stringify(stalePattern)}`);
    }
  }
}

function verifyTulaRuntimeRename() {
  if (fs.existsSync(path.join(repoRoot, OLD_AGENT_RUNTIME_SURFACE))) {
    fail(`${OLD_AGENT_RUNTIME_SURFACE} must be renamed to ${TULA_RUNTIME_SURFACE}`);
  }

  if (!fs.existsSync(path.join(repoRoot, TULA_RUNTIME_SURFACE, 'package.json'))) {
    fail(`${TULA_RUNTIME_SURFACE}/package.json must exist`);
  }

  const manifest = readJson(path.join(TULA_RUNTIME_SURFACE, 'package.json'));
  expectEqual(manifest.name, TULA_RUNTIME_PACKAGE, `${TULA_RUNTIME_SURFACE}/package.json name`);
  expectDeepEqual(manifest.repository, createCanonicalMetadata(TULA_RUNTIME_SURFACE).repository, `${TULA_RUNTIME_SURFACE}/package.json repository`);
  expectEqual(manifest.homepage, createCanonicalMetadata(TULA_RUNTIME_SURFACE).homepage, `${TULA_RUNTIME_SURFACE}/package.json homepage`);

  const docsCoverage = readJson(DOCS_SURFACE_PATH);
  const tulaRuntimeSurface = docsCoverage.surfaces.find((entry) => entry.surface === TULA_RUNTIME_SURFACE);
  if (!tulaRuntimeSurface) {
    fail(`${DOCS_SURFACE_PATH} must list ${TULA_RUNTIME_SURFACE}`);
  }
  expectEqual(tulaRuntimeSurface.packageName, TULA_RUNTIME_PACKAGE, `${DOCS_SURFACE_PATH} ${TULA_RUNTIME_SURFACE} packageName`);

  const oldSurface = docsCoverage.surfaces.find((entry) => entry.surface === OLD_AGENT_RUNTIME_SURFACE);
  if (oldSurface) {
    fail(`${DOCS_SURFACE_PATH} must not list ${OLD_AGENT_RUNTIME_SURFACE}`);
  }
}

function verifyTulaRuntimeDependents() {
  const packageJsonPaths = [
    'packages/tula-platform/package.json',
    'packages/tula-core/package.json',
    'packages/tula/package.json',
  ];
  for (const packageJsonPath of packageJsonPaths) {
    const manifest = readJson(packageJsonPath);
    if (manifest.dependencies && Object.prototype.hasOwnProperty.call(manifest.dependencies, OLD_AGENT_RUNTIME_PACKAGE)) {
      fail(`${packageJsonPath} must depend on ${TULA_RUNTIME_PACKAGE}, not ${OLD_AGENT_RUNTIME_PACKAGE}`);
    }
  }

  const tsconfigPaths = [
    'packages/tula-platform/tsconfig.json',
    'packages/tula/tsconfig.json',
  ];
  for (const tsconfigPath of tsconfigPaths) {
    const config = readJson(tsconfigPath);
    const staleRuntimeReference = `../${'agent-runtime'}`;
    const staleReference = (config.references || []).find((reference) => reference && reference.path === staleRuntimeReference);
    if (staleReference) {
      fail(`${tsconfigPath} must reference ../tula-runtime, not ../agent-runtime`);
    }
  }
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
  for (const topLevel of ['packages', 'plugins', 'blueprints']) {
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

function verifyTopLevelAgentMuxPackageMoves() {
  const workspaceEntries = new Set((rootManifest.workspaces || []).map(normalizePath));
  const rootReferences = new Set((readJson('tsconfig.json').references || []).map((entry) => normalizePath(entry.path || '')));

  for (const move of TOP_LEVEL_AGENT_MUX_PACKAGE_MOVES) {
    if (pathExists(move.oldPath)) {
      fail(`${move.oldPath} must be moved under packages/agent-mux`);
    }

    if (!packageExists(move.newPath)) {
      fail(`${move.newPath}/package.json is required for ${move.newName}`);
    }

    const manifest = readJson(path.join(move.newPath, 'package.json'));
    expectEqual(manifest.name, move.newName, `${move.newPath}/package.json name`);

    if (workspaceEntries.has(move.oldPath)) {
      fail(`package.json workspaces must not include stale ${move.oldPath}`);
    }

    if (!workspaceEntries.has('packages/agent-mux/*') && !workspaceEntries.has(move.newPath)) {
      fail(`package.json workspaces must include ${move.newPath} or packages/agent-mux/*`);
    }

    if (rootReferences.has(move.oldPath)) {
      fail(`tsconfig.json references must not include stale ${move.oldPath}`);
    }

    if (!rootReferences.has(move.newPath)) {
      fail(`tsconfig.json references must include ${move.newPath}`);
    }
  }
}

const rootManifest = readJson('package.json');
expectEqual(rootManifest.private, true, 'package.json private');
expectEqual(rootManifest.license, 'MIT', 'package.json license');
verifyTulaCoreRename();
verifyTulaCoreDependents();
verifyTulaCoreExternalSurfaces();
verifyTulaRuntimeRename();
verifyTulaRuntimeDependents();
verifyTopLevelAgentMuxPackageMoves();
verifyBabysitterPluginVersionSync();

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
