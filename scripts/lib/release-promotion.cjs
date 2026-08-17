#!/usr/bin/env node
/**
 * Candidate publication and validated channel promotion (FIX-010).
 *
 * FIX-001 made ONE immutable release version flow through validation,
 * publication, tagging and promotion. It did not change *when* a production
 * channel moves: `scripts/publish-package-from-tag.mjs` published straight to
 * the channel dist-tag (`latest` / `staging` / `develop`), so the moment a
 * package was published, every consumer of that channel got it. Nothing had
 * ever installed the release from npm at that point:
 * `.github/workflows/live-stack-published.yml` — the only workflow that
 * installs the packages from the registry and exercises the live stack —
 * auto-triggered only when its own file changed, and `publish.yml` neither
 * dispatched nor depended on it.
 *
 * This module implements the promotion model the remediation plan requires:
 *
 *   1. publication targets a NON-PRODUCTION candidate dist-tag derived from the
 *      exact release version (`candidate-<version>`), never a channel;
 *   2. the published-consumer workflow validates that EXACT immutable version
 *      (never a mutable dist-tag) and records machine-readable evidence;
 *   3. only evidence that names the same exact version and reports every
 *      required check as successful unlocks channel promotion;
 *   4. promotion moves the channel tag of every publishable package to the
 *      tested version and then re-asserts it (FIX-001 `assert-channel-tags`).
 *
 * A failed validation therefore leaves the candidate versions on npm — fully
 * available for diagnosis under their candidate tag and by exact version — and
 * leaves the channel tag exactly where it was.
 *
 * There is no fallback anywhere in this file: missing evidence, evidence for a
 * different version, a missing required check, a mutable version input, or a
 * package whose exact version is absent from the registry are all hard errors
 * that stop the promotion before a single dist-tag is touched.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  CHANNELS,
  assertChannelTags,
  parseSemver,
} = require('./release-version.cjs');
const { listPublishablePackages } = require('./publishable-packages.cjs');

/** Prefix of the non-production dist-tag candidates are published under. */
const CANDIDATE_DIST_TAG_PREFIX = 'candidate-';

/** Evidence document kind written by the published-consumer validation. */
const VALIDATION_EVIDENCE_KIND = 'published-consumer-validation';

/**
 * Checks the plan requires before a channel may move. Evidence that omits any
 * of them — or reports one as anything other than `success` — cannot unlock a
 * promotion.
 */
const REQUIRED_VALIDATION_CHECKS = Object.freeze([
  'package-install',
  'root-import',
  'subpath-import',
  'bin-smoke',
  'live-stack',
]);

const CHANNEL_DIST_TAGS = Object.freeze(Object.values(CHANNELS).map((channel) => channel.distTag));

function isChannelDistTag(distTag) {
  return CHANNEL_DIST_TAGS.includes(String(distTag));
}

function listChannelDistTags() {
  return [...CHANNEL_DIST_TAGS].sort();
}

/**
 * The exact-version contract. Validation and promotion accept ONE immutable
 * version and nothing else: a dist-tag (`latest`), a range (`^6.0.4`), a
 * partial version (`6.0`) or a wildcard (`6.0.x`) all resolve to "whatever the
 * registry offers right now", which is precisely what must not be tested or
 * promoted.
 *
 * @param {string} version
 * @param {{context?: string}} [options]
 * @returns {string} the same version, once proven exact
 */
function assertExactReleaseVersion(version, { context = 'release version' } = {}) {
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error(
      `${context} is required and must be an exact immutable version such as 6.0.4 or ` +
        '6.0.4-staging.abc123def456.',
    );
  }
  if (version.trim() !== version) {
    throw new Error(`${context} ${JSON.stringify(version)} has surrounding whitespace; pass the exact version.`);
  }
  if (isChannelDistTag(version)) {
    throw new Error(
      `${context} ${JSON.stringify(version)} is a mutable dist-tag, not a version. Published-consumer ` +
        'validation and channel promotion must name the exact immutable version under test ' +
        `(one of the channels: ${listChannelDistTags().join(', ')}).`,
    );
  }
  try {
    parseSemver(version);
  } catch {
    throw new Error(
      `${context} ${JSON.stringify(version)} is not an exact version. Ranges, partial versions, ` +
        'wildcards and dist-tags are rejected: validation must install one immutable version ' +
        '(<major>.<minor>.<patch>[-prerelease]).',
    );
  }
  return version;
}

/**
 * The non-production dist-tag a release candidate is published under.
 *
 * Derived from the exact version so it is unique per release, and deliberately
 * not a valid semver string (npm refuses semver-shaped dist-tags) and never a
 * channel name.
 *
 * @param {string} releaseVersion
 * @returns {string}
 */
function candidateDistTagFor(releaseVersion) {
  assertExactReleaseVersion(releaseVersion, { context: 'candidate release version' });
  return `${CANDIDATE_DIST_TAG_PREFIX}${releaseVersion}`;
}

/**
 * Guards the one rule the candidate tag exists to enforce: publication never
 * writes a production channel.
 *
 * @param {string} distTag
 * @param {{releaseVersion?: string}} [options]
 */
function assertCandidateDistTag(distTag, { releaseVersion } = {}) {
  if (typeof distTag !== 'string' || distTag.length === 0) {
    throw new Error('A candidate dist-tag is required');
  }
  if (isChannelDistTag(distTag)) {
    throw new Error(
      `${distTag} is a production channel, not a candidate dist-tag. Candidates publish under ` +
        `${CANDIDATE_DIST_TAG_PREFIX}<version> and only move a channel after the published-consumer ` +
        'validation of that exact version succeeds (FIX-010).',
    );
  }
  if (!distTag.startsWith(CANDIDATE_DIST_TAG_PREFIX)) {
    throw new Error(
      `Candidate dist-tag ${JSON.stringify(distTag)} must start with ${CANDIDATE_DIST_TAG_PREFIX}`,
    );
  }
  if (releaseVersion !== undefined) {
    const expected = candidateDistTagFor(releaseVersion);
    if (distTag !== expected) {
      throw new Error(
        `Candidate dist-tag ${distTag} does not belong to release version ${releaseVersion} (expected ${expected})`,
      );
    }
  }
  return distTag;
}

/**
 * Machine-readable validation evidence. Written by the published-consumer
 * workflow, preserved as a workflow artifact for incident review, and consumed
 * by the promotion gate.
 *
 * @param {{releaseVersion: string, candidateDistTag?: string, checks: Array<{name: string, status: string, detail?: string}>, workflowRunUrl?: string, resolvedVersions?: Record<string,string>, recordedAt?: string}} input
 */
function buildValidationEvidence({
  releaseVersion,
  candidateDistTag,
  checks,
  workflowRunUrl,
  resolvedVersions,
  recordedAt,
}) {
  assertExactReleaseVersion(releaseVersion, { context: 'validated release version' });
  if (!Array.isArray(checks) || checks.length === 0) {
    throw new Error('Validation evidence requires at least one recorded check');
  }
  const normalized = checks.map((check) => {
    if (!check || typeof check.name !== 'string' || typeof check.status !== 'string') {
      throw new Error('Every validation check requires a name and a status');
    }
    if (check.status !== 'success' && check.status !== 'failure' && check.status !== 'skipped') {
      throw new Error(
        `Unknown validation check status ${JSON.stringify(check.status)} for ${check.name}; ` +
          'expected success, failure or skipped',
      );
    }
    return { name: check.name, status: check.status, detail: check.detail ? String(check.detail) : undefined };
  });
  const missing = REQUIRED_VALIDATION_CHECKS.filter(
    (name) => !normalized.some((check) => check.name === name),
  );
  const failed = normalized.filter((check) => check.status !== 'success').map((check) => check.name);
  return {
    kind: VALIDATION_EVIDENCE_KIND,
    releaseVersion,
    candidateDistTag: candidateDistTag ? assertCandidateDistTag(candidateDistTag, { releaseVersion }) : undefined,
    status: missing.length === 0 && failed.length === 0 ? 'success' : 'failure',
    requiredChecks: [...REQUIRED_VALIDATION_CHECKS],
    checks: normalized,
    missingChecks: missing,
    failedChecks: failed,
    resolvedVersions: resolvedVersions || undefined,
    workflowRunUrl: workflowRunUrl || undefined,
    recordedAt: recordedAt || new Date().toISOString(),
  };
}

/** @returns {object} parsed evidence; a missing or malformed file is a hard error. */
function readValidationEvidence(filePath) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(
      `No published-consumer validation evidence at ${absolute}. A channel tag may only move after the ` +
        'published-consumer workflow validated the exact release version and recorded its evidence (FIX-010).',
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (error) {
    throw new Error(`Validation evidence ${absolute} is not readable JSON: ${error.message}`);
  }
  if (!parsed || parsed.kind !== VALIDATION_EVIDENCE_KIND) {
    throw new Error(
      `Validation evidence ${absolute} is not a ${VALIDATION_EVIDENCE_KIND} document (kind=${JSON.stringify(parsed && parsed.kind)})`,
    );
  }
  return parsed;
}

/**
 * The promotion gate. Throws unless the evidence proves that THIS exact
 * version passed every required published-consumer check.
 *
 * @param {{releaseVersion: string, distTag: string, evidence: object}} input
 */
function assertPromotionAllowed({ releaseVersion, distTag, evidence }) {
  assertExactReleaseVersion(releaseVersion, { context: 'promoted release version' });
  if (!isChannelDistTag(distTag)) {
    throw new Error(
      `Refusing to promote to ${JSON.stringify(distTag)}: promotion moves a release channel ` +
        `(${listChannelDistTags().join(', ')}). Candidates are published under their candidate tag instead.`,
    );
  }
  if (!evidence || evidence.kind !== VALIDATION_EVIDENCE_KIND) {
    throw new Error(
      'Refusing to promote without published-consumer validation evidence: the channel tag may only move ' +
        'after the exact release version was installed from npm, imported, bin-smoked and exercised by the ' +
        'live stack (FIX-010).',
    );
  }
  if (evidence.releaseVersion !== releaseVersion) {
    throw new Error(
      `Refusing to promote ${releaseVersion}: the validation evidence covers ${JSON.stringify(evidence.releaseVersion)}. ` +
        'Only the exact version that was validated may be promoted.',
    );
  }
  const checks = Array.isArray(evidence.checks) ? evidence.checks : [];
  const missing = REQUIRED_VALIDATION_CHECKS.filter((name) => !checks.some((check) => check.name === name));
  if (missing.length) {
    throw new Error(
      `Refusing to promote ${releaseVersion} to ${distTag}: the validation evidence is missing required ` +
        `check(s) ${missing.join(', ')}.`,
    );
  }
  const failed = checks.filter((check) => check.status !== 'success');
  if (failed.length) {
    throw new Error(
      `Refusing to promote ${releaseVersion} to ${distTag}: ${failed.length} published-consumer check(s) did ` +
        `not succeed:\n${failed.map((check) => `  - ${check.name}: ${check.status}${check.detail ? ` (${check.detail})` : ''}`).join('\n')}\n` +
        `The candidate remains installable by exact version and under ${candidateDistTagFor(releaseVersion)} for diagnosis; ` +
        `${distTag} was not moved.`,
    );
  }
  if (evidence.status !== 'success') {
    throw new Error(
      `Refusing to promote ${releaseVersion} to ${distTag}: the validation evidence reports status ` +
        `${JSON.stringify(evidence.status)}.`,
    );
  }
  return true;
}

function runNpm(args, { npmBin = 'npm', cwd = process.cwd() } = {}) {
  return spawnSync(npmBin, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

/** @returns {boolean} true when the exact version exists on the registry */
function exactVersionExists({ packageName, releaseVersion, npmBin, cwd }) {
  const result = runNpm(['view', `${packageName}@${releaseVersion}`, 'version'], { npmBin, cwd });
  return result.status === 0;
}

/**
 * Everything promotion would do, computed before anything is mutated: the
 * inventory it covers, the packages whose exact version is missing from the
 * registry, and the dist-tag commands it would run.
 *
 * @returns {{releaseVersion: string, distTag: string, packages: string[], missing: string[], commands: string[][]}}
 */
function planChannelPromotion({ repoRoot, releaseVersion, distTag, packages, npmBin = 'npm' }) {
  assertExactReleaseVersion(releaseVersion, { context: 'promoted release version' });
  if (!isChannelDistTag(distTag)) {
    throw new Error(`Refusing to plan a promotion to non-channel dist-tag ${JSON.stringify(distTag)}`);
  }
  const inventory = packages || listPublishablePackages(repoRoot).map((entry) => entry.name);
  if (inventory.length === 0) {
    throw new Error('The publishable-package inventory is empty; refusing to "promote" nothing.');
  }
  const missing = inventory.filter(
    (packageName) => !exactVersionExists({ packageName, releaseVersion, npmBin, cwd: repoRoot }),
  );
  return {
    releaseVersion,
    distTag,
    packages: inventory,
    missing,
    commands: inventory.map((packageName) => [
      'dist-tag',
      'add',
      `${packageName}@${releaseVersion}`,
      distTag,
    ]),
  };
}

/**
 * Move every publishable package's channel tag to the validated version, then
 * assert the channel actually resolves to it.
 *
 * Registry-mutating: the ONLY dist-tag mutation in the release pipeline. Tests
 * drive it with a fake `npm` on PATH.
 *
 * @returns {{promoted: string[], plan: object, assertion: object}}
 */
function promoteChannelTags({ repoRoot, releaseVersion, distTag, evidence, packages, npmBin = 'npm' }) {
  assertPromotionAllowed({ releaseVersion, distTag, evidence });
  const plan = planChannelPromotion({ repoRoot, releaseVersion, distTag, packages, npmBin });
  if (plan.missing.length) {
    throw new Error(
      `Refusing to move ${distTag}: ${plan.missing.length} of ${plan.packages.length} public package(s) have ` +
        `no published ${releaseVersion} artifact (${plan.missing.slice(0, 10).join(', ')}` +
        `${plan.missing.length > 10 ? ', …' : ''}). A channel must never point at a version that was not ` +
        'published and validated as a whole.',
    );
  }
  const promoted = [];
  for (const command of plan.commands) {
    const result = runNpm(command, { npmBin, cwd: repoRoot });
    if (result.status !== 0) {
      throw new Error(
        `npm ${command.join(' ')} failed (exit ${result.status}): ${(result.stderr || '').trim()}. ` +
          `${promoted.length} package(s) were already promoted; re-run this promotion once the failure is fixed.`,
      );
    }
    promoted.push(command[2]);
  }
  // Post-promotion assertion (FIX-001 inventory-wide): the channel must now
  // resolve to exactly the version that was validated.
  const assertion = assertChannelTags({
    repoRoot,
    releaseVersion,
    distTag,
    mode: 'final',
    npmBin,
    packages: plan.packages,
  });
  if (assertion.problems.length) {
    throw new Error(
      `${assertion.problems.length} of ${assertion.checked} public package(s) do not resolve ${distTag}=` +
        `${releaseVersion} after promotion:\n` +
        assertion.problems
          .map((problem) => `  - ${problem.package}: ${problem.reason} (found ${problem.actual ?? 'nothing'})`)
          .join('\n'),
    );
  }
  return { promoted, plan, assertion };
}

/**
 * Prove that what a consumer actually installed is the exact release version.
 *
 * Consumes a parsed `npm ls --json` tree (global or project). A global install
 * that silently resolved a cached/older artifact is exactly the failure this
 * catches, and the resolved map is preserved as incident-review evidence.
 *
 * @param {{releaseVersion: string, packages: string[], tree: object}} input
 * @returns {{resolved: Record<string,string|null>, problems: Array<{package: string, expected: string, actual: string|null}>}}
 */
function assertInstalledExactVersions({ releaseVersion, packages, tree }) {
  assertExactReleaseVersion(releaseVersion, { context: 'installed release version' });
  if (!Array.isArray(packages) || packages.length === 0) {
    throw new Error('assertInstalledExactVersions requires the packages that must be installed');
  }
  const dependencies = (tree && (tree.dependencies || tree.packages)) || {};
  const resolved = {};
  const problems = [];
  for (const packageName of packages) {
    const entry = dependencies[packageName] || dependencies[`node_modules/${packageName}`];
    const actual = entry && typeof entry.version === 'string' ? entry.version : null;
    resolved[packageName] = actual;
    if (actual !== releaseVersion) {
      problems.push({ package: packageName, expected: releaseVersion, actual });
    }
  }
  return { resolved, problems };
}

module.exports = {
  CANDIDATE_DIST_TAG_PREFIX,
  REQUIRED_VALIDATION_CHECKS,
  VALIDATION_EVIDENCE_KIND,
  assertCandidateDistTag,
  assertExactReleaseVersion,
  assertInstalledExactVersions,
  assertPromotionAllowed,
  buildValidationEvidence,
  candidateDistTagFor,
  exactVersionExists,
  isChannelDistTag,
  listChannelDistTags,
  planChannelPromotion,
  promoteChannelTags,
  readValidationEvidence,
};
