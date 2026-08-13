#!/usr/bin/env node
/**
 * One authoritative release version (FIX-001).
 *
 * The 2026-08-13 incident (docs/release-incident-2026-08-13.md) happened
 * because FOUR different places each inferred "the version being released"
 * independently:
 *
 *   1. `.github/workflows/publish.yml` computed a publish version and
 *      synchronized manifests to it — but only inside a temporary publication
 *      workspace;
 *   2. `.github/workflows/release-tags.yml` re-read the ORIGINAL checkout's
 *      root manifest to name the tag;
 *   3. `.github/workflows/publish-packages-from-tag.yml` re-synchronized
 *      manifests only for staging tags, so a main tag was published from the
 *      stale checked-in manifests;
 *   4. `scripts/publish-package-from-tag.mjs` then read each stale workspace
 *      manifest and assigned the channel dist-tag to THAT version.
 *
 * Net effect: a main release tag moved `latest` BACK to the stale 6.0.0
 * artifacts while 6.0.3 was the intended release.
 *
 * This module is the single resolver. Every release path derives the version
 * here exactly once, passes it explicitly, and validates it instead of
 * re-inferring it. There is deliberately NO fallback: an unknown branch, an
 * unparseable tag, or a missing version is a hard error, never a guess.
 *
 * Read-only with respect to the registry except for `npm view` queries.
 */
'use strict';

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { listPublishablePackages } = require('./publishable-packages.cjs');

/**
 * Release channels. A branch that is not listed here cannot be released:
 * inventing a dist-tag for an unknown branch is how stale artifacts reach
 * production channels.
 */
const CHANNELS = {
  main: { distTag: 'latest', prerelease: false },
  staging: { distTag: 'staging', prerelease: true },
  develop: { distTag: 'develop', prerelease: true },
};

const RELEASE_PLAN_FILENAME = 'release-version.json';
const TAG_PREFIX = 'babysitter';
const TAG_SOURCE_PUBLISH_WORKFLOW = 'publish-workflow';
const TAG_SOURCE_MANUAL = 'manual';

const RELEASE_VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
const SHORT_SHA_PATTERN = /^[0-9a-f]{7,40}$/;

/** Manifest trees synchronized by scripts/sync-workspace-versions.mjs. */
const SYNCED_ROOTS = ['packages', 'plugins'];
const SYNCED_SKIP_DIRS = new Set([
  '.git',
  '.a5c',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'artifacts',
  'generated',
  'examples',
]);
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const PLUGIN_MANIFEST_PATHS = ['plugins/babysitter-unified/plugin.json', 'plugins/atlas-unified/plugin.json'];
const VERSIONS_JSON_PATHS = ['plugins/babysitter-unified/versions.json', 'plugins/atlas-unified/versions.json'];

function listChannels() {
  return Object.keys(CHANNELS).sort();
}

function channelFor(branch) {
  const channel = CHANNELS[branch];
  if (!channel) {
    throw new Error(
      `Unsupported release branch ${JSON.stringify(branch)}; releasable branches: ${listChannels().join(', ')}`,
    );
  }
  return channel;
}

function parseSemver(version) {
  const core = String(version).split('+')[0];
  const dashIndex = core.indexOf('-');
  const numeric = dashIndex === -1 ? core : core.slice(0, dashIndex);
  const prerelease = dashIndex === -1 ? '' : core.slice(dashIndex + 1);
  const match = RELEASE_VERSION_PATTERN.exec(numeric);
  if (!match) {
    throw new Error(`Not a semantic version: ${JSON.stringify(version)}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease,
  };
}

/**
 * Ordering used only to detect BACKWARD channel movement. Prerelease
 * identifiers are compared as dot-separated semver identifiers; a release
 * outranks a prerelease of the same numeric version.
 *
 * @returns {number} negative when a < b, 0 when equal, positive when a > b
 */
function compareVersions(a, b) {
  const left = parseSemver(a);
  const right = parseSemver(b);
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] - right[key];
  }
  if (left.prerelease === right.prerelease) return 0;
  if (!left.prerelease) return 1;
  if (!right.prerelease) return -1;
  const leftIds = left.prerelease.split('.');
  const rightIds = right.prerelease.split('.');
  for (let i = 0; i < Math.max(leftIds.length, rightIds.length); i += 1) {
    const l = leftIds[i];
    const r = rightIds[i];
    if (l === undefined) return -1;
    if (r === undefined) return 1;
    const lNum = /^\d+$/.test(l);
    const rNum = /^\d+$/.test(r);
    if (lNum && rNum) {
      if (Number(l) !== Number(r)) return Number(l) - Number(r);
    } else if (lNum !== rNum) {
      return lNum ? -1 : 1;
    } else if (l !== r) {
      return l < r ? -1 : 1;
    }
  }
  return 0;
}

/**
 * THE resolver. Produces the immutable release identity for one branch at one
 * commit: the version every publication, tag, and external sync must use.
 *
 * @param {{branch: string, rootVersion: string, shortSha: string}} input
 * @returns {{branch: string, releaseVersion: string, distTag: string, releaseTag: string, shortSha: string, commit?: string}}
 */
function resolveReleaseVersion({ branch, rootVersion, shortSha }) {
  const channel = channelFor(branch);
  if (typeof rootVersion !== 'string' || rootVersion.length === 0) {
    throw new Error('rootVersion is required to resolve a release version');
  }
  const base = parseSemver(rootVersion);
  let releaseVersion;
  if (channel.prerelease) {
    if (typeof shortSha !== 'string' || !SHORT_SHA_PATTERN.test(shortSha)) {
      throw new Error(
        `Branch ${branch} publishes a commit-pinned prerelease and requires a short commit sha, got ${JSON.stringify(shortSha)}`,
      );
    }
    releaseVersion = `${base.major}.${base.minor}.${base.patch + 1}-${branch}.${shortSha}`;
  } else {
    releaseVersion = `${base.major}.${base.minor}.${base.patch}`;
  }
  return {
    branch,
    releaseVersion,
    distTag: channel.distTag,
    releaseTag: formatReleaseTag({ branch, releaseVersion }),
    shortSha: typeof shortSha === 'string' ? shortSha : '',
  };
}

/**
 * Tag naming contract: the tag NAME contains the exact release version and
 * nothing else, so `parseReleaseTag(formatReleaseTag(x)) === x`.
 *
 * The pre-FIX-001 format appended `-<sha>` to main tags
 * (`babysitter/main/v6.0.3-120926cf0abc`), which parses as the *different*
 * prerelease version `6.0.3-120926cf0abc`. That ambiguity is exactly what let
 * a tag-triggered run publish/promote something other than the released
 * version, so those tags are rejected rather than reinterpreted.
 */
function formatReleaseTag({ branch, releaseVersion }) {
  channelFor(branch);
  return `${TAG_PREFIX}/${branch}/v${releaseVersion}`;
}

/**
 * @param {string} tag e.g. `babysitter/main/v6.0.4`
 * @returns {{branch: string, releaseVersion: string, distTag: string, releaseTag: string}}
 */
function parseReleaseTag(tag) {
  const match = /^([^/]+)\/([^/]+)\/v(.+)$/.exec(String(tag));
  if (!match || match[1] !== TAG_PREFIX) {
    throw new Error(
      `Release tag ${JSON.stringify(tag)} does not match ${TAG_PREFIX}/<branch>/v<version>`,
    );
  }
  const [, , branch, releaseVersion] = match;
  const channel = channelFor(branch);
  const parsed = parseSemver(releaseVersion);
  if (channel.prerelease) {
    const expectedPrefix = `${branch}.`;
    if (!parsed.prerelease.startsWith(expectedPrefix) || !SHORT_SHA_PATTERN.test(parsed.prerelease.slice(expectedPrefix.length))) {
      throw new Error(
        `Release tag ${JSON.stringify(tag)} must encode a ${branch} prerelease of the form ` +
          `<major>.<minor>.<patch>-${branch}.<short-sha>`,
      );
    }
  } else if (parsed.prerelease) {
    throw new Error(
      `Release tag ${JSON.stringify(tag)} encodes prerelease version ${releaseVersion}, but ${branch} ` +
        'releases exact <major>.<minor>.<patch> versions. Pre-FIX-001 tags appended the commit sha to the ' +
        'version and are ambiguous (they name a version that was never published); re-tag with ' +
        `${TAG_PREFIX}/${branch}/v<published-version> instead of reinterpreting this tag.`,
    );
  }
  return {
    branch,
    releaseVersion,
    distTag: channel.distTag,
    releaseTag: `${TAG_PREFIX}/${branch}/v${releaseVersion}`,
  };
}

/**
 * Machine-readable provenance stored in the annotated tag object. The
 * tag-triggered workflow reads it to refuse a SECOND publication/dist-tag
 * mutation for a tag the branch release workflow already published.
 */
function formatTagMessage({ releaseVersion, branch, commit, source, runUrl }) {
  channelFor(branch);
  if (!releaseVersion) throw new Error('releaseVersion is required for a release tag message');
  if (source !== TAG_SOURCE_PUBLISH_WORKFLOW && source !== TAG_SOURCE_MANUAL) {
    throw new Error(
      `Unknown release tag source ${JSON.stringify(source)}; expected ` +
        `${TAG_SOURCE_PUBLISH_WORKFLOW} or ${TAG_SOURCE_MANUAL}`,
    );
  }
  const lines = [
    `babysitter release ${releaseVersion} (${branch})`,
    '',
    `babysitter-release-version: ${releaseVersion}`,
    `babysitter-release-branch: ${branch}`,
    `babysitter-release-source: ${source}`,
  ];
  if (commit) lines.push(`babysitter-release-commit: ${commit}`);
  if (runUrl) lines.push(`babysitter-release-run: ${runUrl}`);
  return `${lines.join('\n')}\n`;
}

/**
 * @param {string} message annotated tag body
 * @returns {{version: string|null, branch: string|null, source: string|null, commit: string|null, runUrl: string|null}}
 *   `source` is null for tags without release provenance (legacy or
 *   hand-created); callers must treat that as "not published by the release
 *   workflow" rather than assuming either way.
 */
function parseTagMessage(message) {
  const read = (key) => {
    const match = new RegExp(`^babysitter-release-${key}:[ \\t]*(.+)$`, 'm').exec(String(message || ''));
    return match ? match[1].trim() : null;
  };
  return {
    version: read('version'),
    branch: read('branch'),
    source: read('source'),
    commit: read('commit'),
    runUrl: read('run'),
  };
}

/**
 * Create the release tag if it is not already there, idempotently.
 *
 * Re-running the same release must be a no-op, and a release tag must never be
 * re-pointed at another commit or renamed onto a different version: the tag is
 * the immutable record of what was published.
 *
 * Never pushes — the caller decides when to publish the ref.
 *
 * @returns {{tag: string, created: boolean, commit: string}}
 */
function ensureReleaseTag({ repoRoot, releaseVersion, branch, commit, source, runUrl }) {
  const tag = formatReleaseTag({ branch, releaseVersion });
  const targetCommit =
    commit || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();

  const existing = spawnSync('git', ['rev-list', '-n', '1', `refs/tags/${tag}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (existing.status === 0) {
    const existingCommit = (existing.stdout || '').trim();
    if (existingCommit !== targetCommit) {
      throw new Error(
        `Release tag ${tag} already exists at ${existingCommit}, but this release is ${targetCommit}. ` +
          'A release tag is immutable; publish a new version instead of re-pointing it.',
      );
    }
    const metadata = parseTagMessage(readTagMessage(repoRoot, tag));
    if (metadata.version && metadata.version !== releaseVersion) {
      throw new Error(
        `Release tag ${tag} already exists and records version ${metadata.version}, not ${releaseVersion}.`,
      );
    }
    return { tag, created: false, commit: targetCommit };
  }

  const message = formatTagMessage({ releaseVersion, branch, commit: targetCommit, source, runUrl });
  const created = spawnSync('git', ['tag', '-a', tag, targetCommit, '-m', message], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (created.status !== 0) {
    throw new Error(`Could not create release tag ${tag}: ${(created.stderr || '').trim()}`);
  }
  return { tag, created: true, commit: targetCommit };
}

/** @returns {string} raw annotated-tag body, or '' for lightweight/unknown tags */
function readTagMessage(repoRoot, tag) {
  const result = spawnSync('git', ['for-each-ref', '--format=%(contents)', `refs/tags/${tag}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) return '';
  return result.stdout || '';
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Every manifest scripts/sync-workspace-versions.mjs is responsible for. */
function listSyncedManifests(repoRoot) {
  const manifests = ['package.json'];
  const walk = (relativeDir) => {
    const absolute = path.join(repoRoot, relativeDir);
    if (!fs.existsSync(absolute)) return;
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      const relativePath = `${relativeDir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!SYNCED_SKIP_DIRS.has(entry.name)) walk(relativePath);
      } else if (entry.isFile() && entry.name === 'package.json') {
        manifests.push(relativePath);
      }
    }
  };
  for (const root of SYNCED_ROOTS) walk(root);
  return manifests;
}

/**
 * Read-only counterpart of scripts/sync-workspace-versions.mjs: proves that a
 * checkout is actually AT one release version. This is the gate that would
 * have caught the incident — publication ran against a workspace whose
 * manifests said 6.0.0 while the release was 6.0.3.
 *
 * @returns {Array<{manifestPath: string, field: string, subject: string, expected: string, actual: string}>}
 */
function collectVersionDivergences({ repoRoot, releaseVersion }) {
  if (!releaseVersion) throw new Error('releaseVersion is required');
  const divergences = [];
  const manifests = listSyncedManifests(repoRoot).map((manifestPath) => ({
    manifestPath,
    manifest: readJson(path.join(repoRoot, manifestPath)),
  }));
  const localNames = new Set(
    manifests
      .map(({ manifest }) => manifest.name)
      .filter((name) => typeof name === 'string' && name.startsWith('@a5c-ai/')),
  );

  for (const { manifestPath, manifest } of manifests) {
    const owned = manifestPath === 'package.json' || localNames.has(manifest.name);
    if (owned && manifest.version !== releaseVersion) {
      divergences.push({
        manifestPath,
        field: 'version',
        subject: manifest.name || '(root)',
        expected: releaseVersion,
        actual: String(manifest.version),
      });
    }
    for (const field of DEPENDENCY_FIELDS) {
      for (const [dependency, range] of Object.entries(manifest[field] || {})) {
        if (!localNames.has(dependency)) continue;
        if (String(range) !== releaseVersion) {
          divergences.push({
            manifestPath,
            field,
            subject: dependency,
            expected: releaseVersion,
            actual: String(range),
          });
        }
      }
    }
  }

  // The same synchronization contract covers the plugin manifests that carry
  // the released version into the marketplace surfaces.
  for (const manifestPath of PLUGIN_MANIFEST_PATHS) {
    const absolute = path.join(repoRoot, manifestPath);
    if (!fs.existsSync(absolute)) continue;
    const manifest = readJson(absolute);
    if (manifest.version !== releaseVersion) {
      divergences.push({
        manifestPath,
        field: 'version',
        subject: manifest.name || manifestPath,
        expected: releaseVersion,
        actual: String(manifest.version),
      });
    }
  }
  for (const versionsPath of VERSIONS_JSON_PATHS) {
    const absolute = path.join(repoRoot, versionsPath);
    if (!fs.existsSync(absolute)) continue;
    const versions = readJson(absolute);
    for (const key of ['sdkVersion', 'extensionVersion']) {
      if (!(key in versions)) continue;
      if (versions[key] !== releaseVersion) {
        divergences.push({
          manifestPath: versionsPath,
          field: key,
          subject: versionsPath,
          expected: releaseVersion,
          actual: String(versions[key]),
        });
      }
    }
  }
  return divergences;
}

function npmDistTags({ packageName, npmBin = 'npm', cwd = process.cwd() }) {
  const result = spawnSync(npmBin, ['view', packageName, 'dist-tags', '--json'], {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) return { published: false, tags: {} };
  const stdout = (result.stdout || '').trim();
  if (!stdout) return { published: true, tags: {} };
  try {
    const parsed = JSON.parse(stdout);
    return { published: true, tags: parsed && typeof parsed === 'object' ? parsed : {} };
  } catch (error) {
    throw new Error(`Could not parse dist-tags for ${packageName}: ${error.message}`);
  }
}

/**
 * Channel-tag assertion over the FULL publishable inventory (never a sample).
 *
 * mode 'final'     — every package's channel tag must equal releaseVersion.
 *                    Re-running the same release is therefore idempotent and a
 *                    release that skipped packages fails loudly.
 * mode 'preflight' — no package's channel tag may already be NEWER than
 *                    releaseVersion; publishing would move the channel
 *                    backward.
 *
 * @returns {{mode: string, releaseVersion: string, distTag: string, checked: number, problems: Array<object>}}
 */
function assertChannelTags({ repoRoot, releaseVersion, distTag, mode = 'final', npmBin = 'npm', packages }) {
  if (!releaseVersion) throw new Error('releaseVersion is required');
  if (!distTag) throw new Error('distTag is required');
  if (mode !== 'final' && mode !== 'preflight') {
    throw new Error(`Unknown channel-tag assertion mode ${JSON.stringify(mode)}; expected final or preflight`);
  }
  const inventory = packages || listPublishablePackages(repoRoot).map((entry) => entry.name);
  const problems = [];
  for (const packageName of inventory) {
    const { published, tags } = npmDistTags({ packageName, npmBin, cwd: repoRoot });
    const current = tags[distTag];
    if (mode === 'final') {
      if (!published) {
        problems.push({ package: packageName, reason: 'not published', expected: releaseVersion, actual: null });
      } else if (current === undefined) {
        problems.push({ package: packageName, reason: `no ${distTag} dist-tag`, expected: releaseVersion, actual: null });
      } else if (current !== releaseVersion) {
        problems.push({
          package: packageName,
          reason: `${distTag} does not resolve to the release version`,
          expected: releaseVersion,
          actual: current,
        });
      }
      continue;
    }
    if (!published || current === undefined) continue;
    if (compareVersions(current, releaseVersion) > 0) {
      problems.push({
        package: packageName,
        reason: `${distTag} already resolves to a NEWER version; releasing would move the channel backward`,
        expected: releaseVersion,
        actual: current,
      });
    }
  }
  return { mode, releaseVersion, distTag, checked: inventory.length, problems };
}

/** Release identity persisted into the publication workspace (produced once). */
function writeReleasePlan(filePath, plan) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(plan, null, 2)}\n`);
}

function readReleasePlan(repoRoot) {
  const filePath = path.join(repoRoot, RELEASE_PLAN_FILENAME);
  if (!fs.existsSync(filePath)) return null;
  const plan = readJson(filePath);
  if (!plan || typeof plan.releaseVersion !== 'string' || plan.releaseVersion.length === 0) {
    throw new Error(`${RELEASE_PLAN_FILENAME} exists but declares no releaseVersion`);
  }
  return plan;
}

/**
 * Collapse every independently derived version into ONE, or fail.
 *
 * @param {Array<{origin: string, version: string}>} candidates
 * @returns {string}
 */
function reconcileReleaseVersion(candidates) {
  const present = candidates.filter((candidate) => candidate && candidate.version);
  if (present.length === 0) {
    throw new Error(
      'No release version was supplied. The release version must be produced once and passed explicitly ' +
        '(--release-version, RELEASE_VERSION, release-version.json, or a babysitter release tag); ' +
        'it is never inferred from a checked-out manifest.',
    );
  }
  const distinct = [...new Set(present.map((candidate) => candidate.version))];
  if (distinct.length > 1) {
    throw new Error(
      'Conflicting release versions: ' +
        present.map((candidate) => `${candidate.origin}=${candidate.version}`).join(', ') +
        '. Exactly one version must flow through validation, publication, tagging and promotion.',
    );
  }
  return distinct[0];
}

function gitShortSha(repoRoot) {
  return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
}

module.exports = {
  CHANNELS,
  RELEASE_PLAN_FILENAME,
  TAG_SOURCE_MANUAL,
  TAG_SOURCE_PUBLISH_WORKFLOW,
  assertChannelTags,
  channelFor,
  collectVersionDivergences,
  compareVersions,
  ensureReleaseTag,
  formatReleaseTag,
  formatTagMessage,
  gitShortSha,
  listChannels,
  listSyncedManifests,
  parseReleaseTag,
  parseSemver,
  parseTagMessage,
  readReleasePlan,
  readTagMessage,
  reconcileReleaseVersion,
  resolveReleaseVersion,
  writeReleasePlan,
};
