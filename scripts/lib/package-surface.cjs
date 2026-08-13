#!/usr/bin/env node
/**
 * Consumer-facing package surface enumeration.
 *
 * "What must a consumer be able to import and execute from this package" is
 * asked by two release gates, which must ask it the SAME way:
 *
 *   - scripts/verify-release-artifacts.mjs (FIX-011) — against the packed
 *     tarball, before publication;
 *   - scripts/verify-published-release.mjs (FIX-010) — against the exact
 *     version installed from npm, before the channel tag moves.
 *
 * Extracted here so the pre-publication and post-publication gates can never
 * drift into checking different surfaces.
 */
'use strict';

/**
 * Harmless smoke argument per bin. Default is `--help`; override per
 * "<package-name> <bin-name>" when a CLI needs a different harmless argument.
 */
const BIN_SMOKE_ARGS = new Map([
  // The atlas CLI intentionally exits 1 for --help (usage()); `stats` is its
  // harmless read-only smoke command.
  ['@a5c-ai/atlas atlas', ['stats']],
  ['@a5c-ai/atlas a5c-atlas', ['stats']],
]);

function binSmokeArgs(packageName, binName) {
  return BIN_SMOKE_ARGS.get(`${packageName} ${binName}`) ?? ['--help'];
}

function normalizeTarget(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  const normalized = value.replace(/\\/g, '/').replace(/^\.\//, '');
  return normalized.length > 0 ? normalized : null;
}

function collectExportTargets(exportsValue, sink) {
  if (typeof exportsValue === 'string') {
    sink.push(exportsValue);
    return;
  }
  if (Array.isArray(exportsValue)) {
    for (const entry of exportsValue) collectExportTargets(entry, sink);
    return;
  }
  if (exportsValue && typeof exportsValue === 'object') {
    for (const value of Object.values(exportsValue)) collectExportTargets(value, sink);
  }
}

/** Every declared file surface (`main`, `module`, `types`, `bin`, `exports`). */
function collectSurfaceTargets(manifest) {
  const targets = [];
  for (const kind of ['main', 'module', 'types']) {
    const target = normalizeTarget(manifest[kind]);
    if (target) targets.push({ kind, target });
  }
  for (const [binName, binTarget] of binEntries(manifest)) {
    const target = normalizeTarget(binTarget);
    if (target) targets.push({ kind: `bin:${binName}`, target });
  }
  const exportTargets = [];
  collectExportTargets(manifest.exports, exportTargets);
  for (const raw of exportTargets) {
    const target = normalizeTarget(raw);
    if (target && target !== 'package.json' && !target.includes('*')) {
      targets.push({ kind: 'exports', target });
    }
  }
  const seen = new Set();
  return targets.filter(({ kind, target }) => {
    const key = `${kind}\0${target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** @returns {Array<[string, string]>} declared `[binName, target]` pairs */
function binEntries(manifest) {
  if (manifest.bin && typeof manifest.bin === 'object') return Object.entries(manifest.bin);
  if (typeof manifest.bin === 'string') return [[manifest.name, manifest.bin]];
  return [];
}

function resolveRuntimeTarget(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = resolveRuntimeTarget(entry);
      if (resolved) return resolved;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [condition, conditionValue] of Object.entries(value)) {
      if (condition === 'types') continue;
      const resolved = resolveRuntimeTarget(conditionValue);
      if (resolved) return resolved;
    }
  }
  return null;
}

function hasTypesTarget(value) {
  if (Array.isArray(value)) return value.some(hasTypesTarget);
  if (value && typeof value === 'object') {
    return Object.entries(value).some(
      ([condition, conditionValue]) => condition === 'types' || hasTypesTarget(conditionValue),
    );
  }
  return false;
}

/**
 * Whether the manifest declares anything a consumer can import at the ROOT:
 * `exports`, `main`, or `module`.
 *
 * A bin-only package (`@a5c-ai/babysitter`: no `main`, no `module`, no
 * `exports`, `files` = `bin/` + `README.md`) declares none of them — its entire
 * consumer surface is its executable. Synthesizing a root import for it made
 * Node fall back to legacy main resolution, look for an `index.js` the package
 * deliberately never ships, and fail the release with ERR_MODULE_NOT_FOUND.
 * That false positive fired in BOTH release gates, so it also blocked channel
 * promotion (FIX-010).
 */
function hasImportableRoot(manifest) {
  return Boolean(
    manifest.exports || normalizeTarget(manifest.main) || normalizeTarget(manifest.module),
  );
}

/**
 * The import specifiers a consumer may use: the package root plus every
 * exported runtime subpath (types-only subpaths carry nothing to import).
 * A package with no importable root contributes no root specifier.
 *
 * @returns {Array<{id: string, json: boolean, types: boolean}>}
 */
function runtimeImportSpecs(manifest) {
  const exportsField = manifest.exports;
  if (!exportsField || typeof exportsField === 'string' || Array.isArray(exportsField)) {
    if (!hasImportableRoot(manifest)) return [];
    return [{ id: manifest.name, json: false, types: Boolean(manifest.types) }];
  }
  const keys = Object.keys(exportsField);
  const subpathKeys = keys.filter((key) => key === '.' || key.startsWith('./'));
  if (subpathKeys.length === 0) {
    // Top-level conditions object: the root is the only entrypoint.
    const target = resolveRuntimeTarget(exportsField);
    return [
      {
        id: manifest.name,
        json: Boolean(target && target.endsWith('.json')),
        types: Boolean(manifest.types) || hasTypesTarget(exportsField),
      },
    ];
  }
  const specs = [];
  for (const key of subpathKeys) {
    if (key === './package.json' || key.includes('*')) continue;
    const target = resolveRuntimeTarget(exportsField[key]);
    if (!target) continue; // types-only subpath: nothing to import at runtime
    specs.push({
      id: key === '.' ? manifest.name : `${manifest.name}${key.slice(1)}`,
      json: target.endsWith('.json'),
      types: hasTypesTarget(exportsField[key]) || (key === '.' && Boolean(manifest.types)),
    });
  }
  return specs;
}

/**
 * A package whose declared runtime is a bundler, not Node.
 *
 * React Native component libraries statically import `react-native`, whose own
 * entrypoint is Flow source (`import typeof * as ... from './index.js.flow'`).
 * No Node runtime can evaluate that, and no change to the *publishing* package
 * can make it evaluable: such a package is resolved by Metro (or webpack/Vite),
 * which is exactly what the standard top-level `"react-native"` resolution
 * field declares. Asking "does bare Node import this?" is the same category of
 * false positive as synthesizing a root import for a bin-only metapackage — the
 * gate asserting something the package never promised.
 *
 * The declaration must be IN THE MANIFEST, per package: there is no name-keyed
 * allowlist, and every other step (surfaces, install with the declared
 * install-strategy, consumer typecheck, bins, verify:release) still runs. The
 * "does this package own its direct runtime imports" question that the Node
 * import incidentally answered is covered for all 43 packages by the
 * dependency-ownership audit in scripts/lib/dependency-ownership.cjs.
 *
 * @returns {{field: string, target: string}|null}
 */
function bundlerOnlyRuntime(manifest) {
  const target = normalizeTarget(manifest['react-native']);
  return target ? { field: 'react-native', target } : null;
}

/**
 * "Nothing to check" is NOT a pass. Omitting the synthesized root import for
 * bin-only packages must not let a package with no importable root AND no bin
 * sail through both release gates having verified nothing at all. Such a
 * package is unusable by any consumer, and both gates must say so explicitly.
 *
 * @returns {string|null} the diagnostic, or null when the package has a surface
 */
function consumerSurfaceProblem(manifest) {
  if (runtimeImportSpecs(manifest).length > 0) return null;
  if (binEntries(manifest).length > 0) return null;
  return (
    `${manifest.name} declares no consumer surface: no importable root (main/module/exports), ` +
    'no exported runtime subpath and no bin. Nothing about this package can be imported or ' +
    'executed by a consumer, so the release gates cannot verify it.'
  );
}

/** Filesystem-safe report basename for a scoped package name. */
function safeReportName(packageName) {
  return packageName.replace(/^@/, '').replace(/\//g, '__');
}

module.exports = {
  BIN_SMOKE_ARGS,
  binEntries,
  bundlerOnlyRuntime,
  binSmokeArgs,
  collectExportTargets,
  collectSurfaceTargets,
  consumerSurfaceProblem,
  hasImportableRoot,
  hasTypesTarget,
  normalizeTarget,
  resolveRuntimeTarget,
  runtimeImportSpecs,
  safeReportName,
};
