'use strict';

/**
 * Copy the bundled microagent assets into `dist` after `tsc` (round-2 finding #3, D-49(1)).
 *
 * WHY THIS EXISTS. `resolveQaManifest` (`src/cli/ask.ts`) reads
 * `join(__dirname, "microagents", "graph-qa", "microagent.json")` at RUNTIME — a `readFileSync`, not
 * an `import` — so `tsc` provably never emits it: it type-checks and transpiles `.ts`, and copies no
 * JSON. Without this step `npm run build` produces a `dist` with no `dist/cli/microagents/`, and the
 * BUILT `kip ask` dies at `ERR_UNREGISTERED_MANIFEST` ("the kip CLI bundle is incomplete") before any
 * retrieval or model call — i.e. ADR-B8's headline consequence, "`kip ask` genuinely answers", is
 * false for every consumer of the built CLI. The frozen suites structurally cannot catch it: they
 * read the manifest from the `src` path, and every kip-cli/kip-mcp ask test injects its own manifest.
 *
 * Dependency-free by construction (ADR-B6: kip-sdk's runtime dep set stays exactly
 * `{isomorphic-git}`, and the lockfile is untouched) — `node:fs` only. Mirrors babysitter-sdk's
 * `scripts/copy-template-assets.cjs`, which solves the identical problem for its command templates.
 */

const fs = require('node:fs');
const path = require('node:path');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

/** `[source, target]`, package-root-relative. */
const COPY_PAIRS = [['src/cli/microagents', 'dist/cli/microagents']];

for (const [sourceRelative, targetRelative] of COPY_PAIRS) {
  const sourcePath = path.join(PACKAGE_ROOT, sourceRelative);
  const targetPath = path.join(PACKAGE_ROOT, targetRelative);

  if (!fs.existsSync(sourcePath)) {
    // Fail LOUD rather than silently shipping a bundle-incomplete dist — the exact failure this
    // script exists to prevent (N5: no silent degradation).
    console.error(`bundle-microagents: source asset directory is missing: ${sourcePath}`);
    process.exit(1);
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true });
}
