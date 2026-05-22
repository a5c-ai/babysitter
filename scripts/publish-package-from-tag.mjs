#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = getArg('--workspace');
const skipBuild = hasFlag('--skip-build') || process.env.PUBLISH_PACKAGE_FROM_TAG_SKIP_BUILD === '1';

if (!workspace) {
  fail('Usage: node scripts/publish-package-from-tag.mjs --workspace=<package-name>');
}

const packages = discoverPackages();
const target = packages.get(workspace);

if (!target) {
  fail(`Workspace not found: ${workspace}`);
}

const tag = npmDistTag();
const packageSpec = `${target.manifest.name}@${target.manifest.version}`;

if (npmView(packageSpec)) {
  if (!process.env.NODE_AUTH_TOKEN) {
    console.log(`${packageSpec} already exists; NODE_AUTH_TOKEN is not configured, so dist-tag ${tag} was not changed.`);
    process.exit(0);
  }
  console.log(`${packageSpec} already exists; ensuring dist-tag ${tag}.`);
  run('npm', ['dist-tag', 'add', packageSpec, tag], { allowFailure: true });
  process.exit(0);
}

if (!process.env.NODE_AUTH_TOKEN) {
  console.log('NODE_AUTH_TOKEN is not configured; skipping npm publish.');
  process.exit(0);
}

for (const dependency of collectInternalDependencies(target.manifest)) {
  if (!packages.has(dependency.name) && !dependency.range.startsWith('^') && !dependency.range.startsWith('~')) {
    if (!npmView(`${dependency.name}@${dependency.range}`)) {
      fail(`Required internal dependency ${dependency.name}@${dependency.range} is not published yet.`);
    }
  }
}

if (!skipBuild) {
  buildWorkspaceDependencies(target.manifest.name, new Set());
  buildWorkspace(target.manifest.name);
}
verifyWorkspaceRelease(target.manifest.name);
run('npm', ['publish', '--workspace', target.manifest.name, '--access', 'public', '--tag', tag, '--ignore-scripts']);

function hasFlag(name) {
  return process.argv.slice(2).includes(name);
}

function getArg(name) {
  const prefix = `${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

function npmDistTag() {
  const refName = process.env.GITHUB_REF_NAME || '';
  const branch = refName.match(/^babysitter\/([^/]+)\//)?.[1] || refName || 'develop';
  return branch === 'main' ? 'latest' : branch;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: options.stdio || 'inherit',
    encoding: options.encoding || 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0 && !options.allowFailure) {
    process.exit(result.status || 1);
  }
  return result;
}

function npmView(spec) {
  return run('npm', ['view', spec, 'version'], { allowFailure: true, stdio: 'pipe' }).status === 0;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function discoverPackages() {
  const discovered = new Map();
  for (const packageJsonPath of walkPackageJson(ROOT)) {
    const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (!manifest.name) continue;
    discovered.set(manifest.name, { manifest, dir: dirname(packageJsonPath) });
  }
  return discovered;
}

function walkPackageJson(dir) {
  const entries = [];
  for (const entry of readdirSync(dir)) {
    if (['.git', '.a5c', 'node_modules', 'artifacts', 'generated'].includes(entry)) continue;
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      entries.push(...walkPackageJson(fullPath));
    } else if (entry === 'package.json') {
      entries.push(fullPath);
    }
  }
  return entries;
}

function collectInternalDependencies(manifest) {
  const fields = ['dependencies', 'peerDependencies', 'optionalDependencies'];
  return fields.flatMap((field) =>
    Object.entries(manifest[field] || {})
      .filter(([name, range]) => name.startsWith('@a5c-ai/') && !String(range).startsWith('workspace:') && range !== '*')
      .map(([name, range]) => ({ name, range: String(range) })),
  );
}

function buildWorkspaceDependencies(packageName, seen) {
  if (seen.has(packageName)) return;
  seen.add(packageName);
  const pkg = packages.get(packageName);
  if (!pkg) return;
  for (const dependency of collectLocalDependencies(pkg.manifest)) {
    if (packages.has(dependency.name)) {
      buildWorkspaceDependencies(dependency.name, seen);
      buildWorkspace(dependency.name);
    }
  }
}

function collectLocalDependencies(manifest) {
  const fields = ['dependencies', 'peerDependencies', 'optionalDependencies'];
  return fields.flatMap((field) =>
    Object.entries(manifest[field] || {})
      .filter(([name, range]) => name.startsWith('@a5c-ai/') && !String(range).startsWith('workspace:'))
      .map(([name, range]) => ({ name, range: String(range) })),
  );
}

function buildWorkspace(packageName) {
  const pkg = packages.get(packageName);
  if (!pkg?.manifest.scripts?.build) return;
  run('npm', ['run', 'build', '--workspace', packageName]);
}

function verifyWorkspaceRelease(packageName) {
  const pkg = packages.get(packageName);
  if (!pkg?.manifest.scripts?.['verify:release']) return;
  run('npm', ['run', 'verify:release', '--workspace', packageName]);
}
