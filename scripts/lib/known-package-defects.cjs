#!/usr/bin/env node
/**
 * Schema and staleness discipline for scripts/known-package-defects.json.
 *
 * That file is the ONLY way a tracked defect is tolerated by the release gates,
 * so every list in it carries the same two obligations:
 *
 *   1. every entry is an object naming its package, the remediation-program FIX
 *      id that will delete it, and why it is tolerated;
 *   2. every entry expires — when the defect stops reproducing, the gate fails
 *      with a "stale allowlist entry" error until the entry is deleted. The
 *      enforced end-state of every list is EMPTY.
 *
 * The `installScripts` list was exempt from BOTH: it also accepted a bare
 * package-name string, and nothing ever detected that an entry had become
 * unnecessary. That is the one list which switches OFF a security control (the
 * clean-consumer install runs with `--ignore-scripts` for everyone else), so it
 * was the list with the least expiry pressure and the most consequence. This
 * module gives it the same discipline as the rest and is shared by both
 * readers — scripts/check-package-metadata.cjs and
 * scripts/verify-release-artifacts.mjs — so they can never disagree about what
 * a valid entry is.
 */
'use strict';

/** Every list in the file. All obey the same entry schema. */
const DEFECT_SECTIONS = ['dependencyOwnership', 'releaseMatrixCoverage', 'packedArtifact', 'installScripts'];

/**
 * npm's install lifecycle. A package declaring none of these has nothing for
 * the `installScripts` allowlist to tolerate: installing it with
 * `--ignore-scripts` behaves identically.
 */
const INSTALL_LIFECYCLE_SCRIPTS = ['preinstall', 'install', 'postinstall'];

const FIX_ID_PATTERN = /^FIX-\d+$/;

/**
 * @param {object} defects parsed known-package-defects.json
 * @param {string} source path used in diagnostics
 * @returns {string[]} schema problems, empty when the file is well-formed
 */
function collectSchemaProblems(defects, source) {
  const problems = [];
  for (const section of DEFECT_SECTIONS) {
    const entries = defects[section];
    if (entries === undefined) continue;
    if (!Array.isArray(entries)) {
      problems.push(`${source} ${section} must be an array, got ${JSON.stringify(entries)}`);
      continue;
    }
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        problems.push(
          `${source} ${section} entries must be objects ` +
            `({ "package": ..., "fixId": "FIX-0NN", "reason": ... }), got ${JSON.stringify(entry)}`,
        );
        continue;
      }
      if (typeof entry.package !== 'string' || entry.package.length === 0) {
        problems.push(`${source} ${section} entry ${JSON.stringify(entry)} must name a package`);
      }
      if (typeof entry.fixId !== 'string' || !FIX_ID_PATTERN.test(entry.fixId)) {
        problems.push(
          `${source} ${section} entry for ${JSON.stringify(entry.package)} must reference its FIX id ` +
            '(e.g. "FIX-002"); an allowlist entry with no fix to expire it never expires',
        );
      }
      if (typeof entry.reason !== 'string' || entry.reason.trim().length === 0) {
        problems.push(
          `${source} ${section} entry for ${JSON.stringify(entry.package)} must state why the defect ` +
            'is tolerated (a "reason")',
        );
      }
    }
  }
  return problems;
}

/**
 * Staleness rule for `installScripts`, deterministic from the manifests: an
 * entry is stale when the package left the publishable inventory, or when it no
 * longer declares any install lifecycle script — in either case the entry
 * tolerates nothing and must be deleted.
 *
 * @param {object} input
 * @param {object} input.defects parsed known-package-defects.json
 * @param {Array<{name: string, manifest: object}>} input.inventory publishable-package inventory
 * @returns {string[]} human-readable staleness reasons, empty when all entries still reproduce
 */
function collectStaleInstallScriptEntries({ defects, inventory }) {
  const byName = new Map(inventory.map((entry) => [entry.name, entry]));
  const stale = [];
  for (const entry of defects.installScripts || []) {
    const pkg = byName.get(entry.package);
    if (!pkg) {
      stale.push(`${entry.fixId}: ${entry.package} is not a publishable package any more`);
      continue;
    }
    const declared = INSTALL_LIFECYCLE_SCRIPTS.filter((name) => pkg.manifest && pkg.manifest.scripts?.[name]);
    if (declared.length === 0) {
      stale.push(
        `${entry.fixId}: ${entry.package} declares no install lifecycle script ` +
          `(${INSTALL_LIFECYCLE_SCRIPTS.join('/')}), so nothing needs allowlisting`,
      );
    }
  }
  return stale;
}

/**
 * Package names whose lifecycle scripts the packed-artifact gate leaves ENABLED
 * during the clean-consumer install.
 *
 * @throws when any entry is not the structured form. A malformed allowlist must
 *   never silently degrade into "allowlist nothing" or "allowlist everything".
 */
function installScriptAllowlist(defects, source) {
  const problems = collectSchemaProblems({ installScripts: defects.installScripts }, source);
  if (problems.length) throw new Error(problems.join('\n'));
  return (defects.installScripts || []).map((entry) => entry.package);
}

module.exports = {
  DEFECT_SECTIONS,
  INSTALL_LIFECYCLE_SCRIPTS,
  collectSchemaProblems,
  collectStaleInstallScriptEntries,
  installScriptAllowlist,
};
