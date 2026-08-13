#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { parseReleaseTag, readReleasePlan, reconcileReleaseVersion } = require('./lib/release-version.cjs');

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

// FIX-001: the version being published is an INPUT, never something inferred
// from whatever manifest happens to be checked out. Every independently
// derived value — the caller's flag, the environment, the release plan carried
// by the publication workspace, and the release tag — must agree, and the
// workspace manifest must already be synchronized to it. The 2026-08-13
// incident promoted `latest` back to 6.0.0 precisely because this helper
// trusted a stale checked-out manifest (docs/release-incident-2026-08-13.md).
const release = resolveRelease();
const tag = release.distTag;
const packageSpec = `${target.manifest.name}@${release.releaseVersion}`;

if (target.manifest.version !== release.releaseVersion) {
  fail(
    `Refusing to publish or promote ${target.manifest.name}: the checked-out workspace manifest is ` +
      `${target.manifest.version} but the release version is ${release.releaseVersion} ` +
      `(source: ${release.origins.join(', ')}). Synchronize every manifest first with ` +
      `\`node scripts/sync-workspace-versions.mjs --version ${release.releaseVersion}\`. ` +
      'Publishing from a divergent workspace is what moved `latest` back to stale artifacts on 2026-08-13 ' +
      '(docs/release-incident-2026-08-13.md).',
  );
}

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

// FIX-005: every EXACTLY pinned internal dependency must already exist in the
// registry before we publish a package that pins it. The previous condition
// skipped this check whenever a same-named local workspace existed — which is
// always true inside this monorepo — so `@a5c-ai/hooks-adapter-cli` published
// successfully while pinning `@a5c-ai/hooks-adapter-genty`, a package that had
// never been published at all (docs/release-incident-2026-08-13.md). A local
// workspace proves nothing about what a clean consumer can install.
for (const dependency of collectInternalDependencies(target.manifest)) {
  if (!isExactVersion(dependency.range)) continue;
  if (!npmView(`${dependency.name}@${dependency.range}`)) {
    fail(
      `Required internal dependency ${dependency.name}@${dependency.range} is not published yet. ` +
        `Publish it before ${packageSpec} (dependency-ordered publication).`,
    );
  }
}

if (!skipBuild) {
  buildWorkspaceDependencies(target.manifest.name, new Set());
  buildWorkspace(target.manifest.name);
}
verifyWorkspaceRelease(target.manifest.name);
const publishResult = run('npm', ['publish', '--workspace', target.manifest.name, '--access', 'public', '--tag', tag, '--ignore-scripts'], { allowFailure: true, stdio: 'pipe' });
if (publishResult.status !== 0) {
  const stderr = (publishResult.stderr || '').toString();
  if (stderr.includes('You cannot publish over the previously published')) {
    console.log(`${packageSpec} was published by a concurrent job; ensuring dist-tag ${tag}.`);
    run('npm', ['dist-tag', 'add', packageSpec, tag], { allowFailure: true });
  } else {
    console.error(stderr);
    process.exit(publishResult.status || 1);
  }
}

function hasFlag(name) {
  return process.argv.slice(2).includes(name);
}

function getArg(name) {
  const prefix = `${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

/**
 * Collapse every source of "which version is being released" into one, or fail.
 *
 * Sources, all optional individually but at least one required, and all
 * required to agree:
 *   --release-version=<v>   explicit caller input
 *   RELEASE_VERSION         explicit environment input
 *   release-version.json    the release plan produced ONCE by the branch
 *                           release workflow and carried inside the
 *                           publication workspace
 *   GITHUB_REF_NAME         a `babysitter/<branch>/v<version>` release tag
 *
 * @returns {{releaseVersion: string, distTag: string, origins: string[]}}
 */
function resolveRelease() {
  const candidates = [];
  const distTags = [];

  const flagVersion = getArg('--release-version');
  if (flagVersion) candidates.push({ origin: '--release-version', version: flagVersion });

  const envVersion = process.env.RELEASE_VERSION;
  if (envVersion) candidates.push({ origin: 'RELEASE_VERSION', version: envVersion });

  let plan = null;
  try {
    plan = readReleasePlan(ROOT);
  } catch (error) {
    fail(error.message);
  }
  if (plan) {
    candidates.push({ origin: 'release-version.json', version: plan.releaseVersion });
    if (plan.distTag) distTags.push({ origin: 'release-version.json', distTag: plan.distTag });
  }

  const refName = process.env.GITHUB_REF_NAME || '';
  if (refName.startsWith('babysitter/')) {
    let parsed;
    try {
      parsed = parseReleaseTag(refName);
    } catch (error) {
      fail(error.message);
    }
    candidates.push({ origin: `tag ${refName}`, version: parsed.releaseVersion });
    distTags.push({ origin: `tag ${refName}`, distTag: parsed.distTag });
  } else if (refName && distTags.length === 0) {
    // The branch ref is the weakest channel signal: it only names the channel
    // when no release plan and no release tag do. It is never allowed to
    // contradict them (a manual recovery run dispatched from a feature branch
    // must still publish to the channel the tag names).
    distTags.push({ origin: `branch ${refName}`, distTag: refName === 'main' ? 'latest' : refName });
  }

  let releaseVersion;
  try {
    releaseVersion = reconcileReleaseVersion(candidates);
  } catch (error) {
    fail(error.message);
  }

  const distinctDistTags = [...new Set(distTags.map((entry) => entry.distTag))];
  if (distinctDistTags.length === 0) {
    fail(
      'No publication channel could be determined. Provide the release tag or branch through GITHUB_REF_NAME, ' +
        'or a release plan (release-version.json) that names the dist-tag.',
    );
  }
  if (distinctDistTags.length > 1) {
    fail(
      'Conflicting publication channels: ' +
        distTags.map((entry) => `${entry.origin}=${entry.distTag}`).join(', '),
    );
  }

  return {
    releaseVersion,
    distTag: distinctDistTags[0],
    origins: candidates.map((candidate) => candidate.origin),
  };
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

/**
 * True for an exactly pinned version (`6.0.0`, `6.0.3-staging.abc`) — the only
 * shape whose registry presence can be verified as a single exact version.
 * Ranges (`^`, `~`, `>=`, `x`) resolve against whatever the registry offers and
 * are intentionally not gated here.
 */
function isExactVersion(range) {
  return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(range);
}

/**
 * Dependencies this repository itself publishes: anything in the `@a5c-ai`
 * scope plus any dependency that resolves to a local workspace. Both must be
 * on the registry before a dependent is published.
 */
function collectInternalDependencies(manifest) {
  const fields = ['dependencies', 'peerDependencies', 'optionalDependencies'];
  return fields.flatMap((field) =>
    Object.entries(manifest[field] || {})
      .filter(
        ([name, range]) =>
          (name.startsWith('@a5c-ai/') || packages.has(name)) &&
          !String(range).startsWith('workspace:') &&
          range !== '*',
      )
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
