/**
 * FIX-008 — derive which publishable packages actually reach the gateway's
 * `node:sqlite` loader from their published entrypoints.
 *
 * `@a5c-ai/adapters-gateway` calls `assertNodeSupportsGatewaySqlite()` at module
 * load, so *any* package whose published entrypoints evaluate the gateway root
 * inherits the gateway's Node.js floor. Declaring a lower `engines.node` than
 * that publishes an install contract the package cannot honour: npm accepts the
 * install and the very first `import` throws.
 *
 * A manifest-level dependency closure is too coarse to express this (a package
 * can depend on the gateway transitively and never evaluate it — for example
 * through a type-only import, or through a subpath such as
 * `@a5c-ai/adapters-cli/bootstrap` that does not pull the gateway in). This
 * module therefore walks the *value* import graph of the tracked sources,
 * starting from each package's published `exports` / `main` / `module` / `bin`
 * targets and crossing workspace package boundaries through the same
 * entrypoint resolution npm would use.
 *
 * Consumed by scripts/__tests__/gateway-engine-floor.test.mjs.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const GATEWAY_PACKAGE = '@a5c-ai/adapters-gateway';

/**
 * Static (module-evaluation-time) import/export edges only.
 *
 * `engines.node` describes what a consumer needs in order to *load* the
 * package: only statically imported modules are evaluated when the root is
 * imported. A lazy `await import(...)` inside a function body does not run at
 * load time, so it does not raise the load-time floor — that is exactly why
 * `@a5c-ai/babysitter-sdk` imports fine on Node 20 while `@a5c-ai/adapters-cli`
 * does not.
 */
const STATIC_EDGE_PATTERN =
  /(?:^|\n)\s*(import\s+type\s|export\s+type\s|import\s|export\s)(?:[^;'"]*?\sfrom\s*)?["']([^"'\n]+)["']/g;

function extractStaticSpecifiers(source) {
  const specifiers = [];
  let match;
  STATIC_EDGE_PATTERN.lastIndex = 0;
  while ((match = STATIC_EDGE_PATTERN.exec(source))) {
    const keyword = match[1];
    if (/^import\s+type\s$/.test(keyword) || /^export\s+type\s$/.test(keyword)) continue;
    specifiers.push(match[2]);
  }
  return specifiers;
}
const BUILTINS = new Set(builtinModules);
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];

/**
 * Every workspace member (public and private). Private members can sit on the
 * path between a published entrypoint and the gateway, so the traversal needs
 * all of them even though only public members are asserted on.
 */
function listWorkspacePackages(repoRoot) {
  const rootManifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const patterns = Array.isArray(rootManifest.workspaces) ? rootManifest.workspaces : [];
  const dirs = new Set();
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const base = pattern.replace(/\/\*+$/, '');
      const baseAbs = path.join(repoRoot, base);
      if (!fs.existsSync(baseAbs)) continue;
      for (const entry of fs.readdirSync(baseAbs, { withFileTypes: true })) {
        if (entry.isDirectory() && fs.existsSync(path.join(baseAbs, entry.name, 'package.json'))) {
          dirs.add(`${base}/${entry.name}`);
        }
      }
    } else if (fs.existsSync(path.join(repoRoot, pattern, 'package.json'))) {
      dirs.add(pattern);
    }
  }
  const packages = [];
  for (const dir of [...dirs].sort()) {
    const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, dir, 'package.json'), 'utf8'));
    if (typeof manifest.name !== 'string' || !manifest.name) continue;
    packages.push({ name: manifest.name, dir, manifest });
  }
  return packages;
}

/**
 * Read the single Node.js floor the gateway enforces at runtime.
 *
 * The constant lives in the gateway source so the manifest, the docs, the CI
 * matrix and this derivation all pin one number.
 */
function readGatewayMinimumNodeVersion(repoRoot) {
  const source = fs.readFileSync(
    path.join(repoRoot, 'packages/adapters/gateway/src/runtime/node-sqlite.ts'),
    'utf8',
  );
  const match = /GATEWAY_MINIMUM_NODE_VERSION\s*=\s*'(\d+\.\d+\.\d+)'/.exec(source);
  if (!match) {
    throw new Error(
      'packages/adapters/gateway/src/runtime/node-sqlite.ts must export a literal GATEWAY_MINIMUM_NODE_VERSION',
    );
  }
  return match[1];
}

function parseVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(`Unrecognized version string: ${JSON.stringify(version)}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] < right[index] ? -1 : 1;
    }
  }
  return 0;
}

/**
 * Exact `>=x.y.z` floor declared by a manifest, or null when `engines.node` is
 * absent. A non-exact range is an error: the CI matrix and the docs have to be
 * able to pin the same number.
 */
function manifestNodeFloor(manifest, packageName) {
  const range = manifest.engines && manifest.engines.node;
  if (typeof range !== 'string') {
    return null;
  }
  const match = /^>=(\d+\.\d+\.\d+)$/.exec(range.trim());
  if (!match) {
    throw new Error(
      `${packageName} declares engines.node ${JSON.stringify(range)}; an exact ">=x.y.z" floor is required ` +
        'so the CI matrix and the docs can pin the same number',
    );
  }
  return match[1];
}

function collectExportTargets(node, output) {
  if (typeof node === 'string') {
    output.push(node);
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    // `types` targets are erased at runtime and never evaluated.
    if (key === 'types') continue;
    collectExportTargets(value, output);
  }
}

/** Published targets a consumer can evaluate for one export subpath. */
function entryTargetsForSubpath(manifest, subpath) {
  const targets = [];
  if (manifest.exports && typeof manifest.exports === 'object' && !Array.isArray(manifest.exports)) {
    const keys = Object.keys(manifest.exports);
    const isSubpathMap = keys.some((key) => key === '.' || key.startsWith('./'));
    if (isSubpathMap) {
      if (Object.prototype.hasOwnProperty.call(manifest.exports, subpath)) {
        collectExportTargets(manifest.exports[subpath], targets);
      }
    } else if (subpath === '.') {
      collectExportTargets(manifest.exports, targets);
    }
  } else if (typeof manifest.exports === 'string' && subpath === '.') {
    targets.push(manifest.exports);
  }
  if (!targets.length && subpath === '.') {
    for (const field of ['main', 'module']) {
      if (typeof manifest[field] === 'string') targets.push(manifest[field]);
    }
  }
  return [...new Set(targets)];
}

function binTargets(manifest) {
  const bin = manifest.bin;
  if (typeof bin === 'string') return [bin];
  if (bin && typeof bin === 'object') return [...new Set(Object.values(bin))];
  return [];
}

const CODE_FILE_PATTERN = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;

function existingSourceFile(candidate) {
  if (!CODE_FILE_PATTERN.test(candidate)) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  return null;
}

/**
 * Map a published (built) target back to the tracked source file that produces
 * it. Every workspace package compiles `src/**` to `dist/**`, so the mapping is
 * a directory swap plus an extension probe.
 */
function resolveTrackedSource(packageDir, target) {
  const normalized = target.replace(/^\.\//, '');
  // The tracked source is authoritative: `dist/**` may be stale or absent in a
  // fresh checkout, and the published behaviour is compiled from `src/**`.
  const candidates = normalized.startsWith('dist/')
    ? [`src/${normalized.slice('dist/'.length)}`, normalized]
    : [normalized];
  for (const candidate of candidates) {
    const absolute = path.join(packageDir, candidate);
    const found = existingSourceFile(absolute);
    if (found) return found;
    const withoutExtension = absolute.replace(/\.[cm]?jsx?$/, '');
    for (const extension of SOURCE_EXTENSIONS) {
      const probe = existingSourceFile(`${withoutExtension}${extension}`);
      if (probe) return probe;
    }
    for (const extension of SOURCE_EXTENSIONS) {
      const probe = existingSourceFile(path.join(withoutExtension, `index${extension}`));
      if (probe) return probe;
    }
  }
  return null;
}

function resolveRelative(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const withoutExtension = base.replace(/\.[cm]?jsx?$/, '');
  const found = existingSourceFile(base);
  if (found) return found;
  for (const extension of SOURCE_EXTENSIONS) {
    const probe = existingSourceFile(`${withoutExtension}${extension}`);
    if (probe) return probe;
  }
  for (const extension of SOURCE_EXTENSIONS) {
    const probe = existingSourceFile(path.join(withoutExtension, `index${extension}`));
    if (probe) return probe;
  }
  return null;
}

/**
 * Remove template-literal spans before scanning for module edges.
 *
 * Code generators in this repository (e.g.
 * `packages/adapters/extensions/src/binTemplates.ts`) embed complete bin
 * scripts inside backtick templates. Those `require(...)` calls belong to the
 * *generated* package, not to the generator's own module graph, so leaving them
 * in produces phantom edges that can never be resolved. A real `import` or
 * `require` is never written inside a template literal.
 */
function stripTemplateLiterals(source) {
  let output = '';
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      output += source.slice(index, index + 2);
      index += 2;
      continue;
    }
    if (char === "'" || char === '"') {
      const quote = char;
      let cursor = index + 1;
      while (cursor < source.length && source[cursor] !== quote) {
        cursor += source[cursor] === '\\' ? 2 : 1;
      }
      output += source.slice(index, cursor + 1);
      index = cursor + 1;
      continue;
    }
    if (char === '`') {
      let cursor = index + 1;
      let depth = 0;
      while (cursor < source.length) {
        const current = source[cursor];
        if (current === '\\') {
          cursor += 2;
          continue;
        }
        if (current === '$' && source[cursor + 1] === '{') {
          depth += 1;
          cursor += 2;
          continue;
        }
        if (current === '}' && depth > 0) {
          depth -= 1;
          cursor += 1;
          continue;
        }
        if (current === '`' && depth === 0) break;
        cursor += 1;
      }
      output += '``';
      index = cursor + 1;
      continue;
    }
    output += char;
    index += 1;
  }
  return output;
}

function splitSpecifier(specifier) {
  if (specifier.startsWith('@')) {
    const segments = specifier.split('/');
    const name = segments.slice(0, 2).join('/');
    const rest = segments.slice(2).join('/');
    return { name, subpath: rest ? `./${rest}` : '.' };
  }
  const [name, ...rest] = specifier.split('/');
  return { name, subpath: rest.length ? `./${rest.join('/')}` : '.' };
}

/**
 * Walk the value-import graph of every publishable package and report the ones
 * whose published entrypoints evaluate the gateway root.
 *
 * @returns {{reaching: Array<{name: string, dir: string, manifest: object, via: string[]}>,
 *            unresolved: Array<{package: string, file: string, specifier: string}>}}
 */
function collectGatewayReachingPackages(repoRoot) {
  const workspace = listWorkspacePackages(repoRoot);
  const byName = new Map(workspace.map((entry) => [entry.name, entry]));
  const unresolved = [];
  const reaching = [];

  for (const pkg of workspace) {
    if (pkg.manifest.private === true) continue;
    if (!pkg.manifest.publishConfig || pkg.manifest.publishConfig.access !== 'public') continue;

    const visited = new Set();
    /** @type {Map<string, string>} file -> importer, for the shortest witness path */
    const parents = new Map();
    const queue = [];
    let witness = null;

    const seedTargets = [...entryTargetsForSubpath(pkg.manifest, '.'), ...binTargets(pkg.manifest)];
    for (const subpath of Object.keys(pkg.manifest.exports || {})) {
      if (subpath === '.' || !subpath.startsWith('./')) continue;
      seedTargets.push(...entryTargetsForSubpath(pkg.manifest, subpath));
    }
    for (const target of new Set(seedTargets)) {
      const source = resolveTrackedSource(path.join(repoRoot, pkg.dir), target);
      if (source && !visited.has(source)) {
        visited.add(source);
        queue.push(source);
      }
    }

    while (queue.length && !witness) {
      const file = queue.shift();
      const specifiers = extractStaticSpecifiers(stripTemplateLiterals(fs.readFileSync(file, 'utf8')));
      for (const specifier of specifiers) {
        if (specifier.startsWith('node:') || BUILTINS.has(specifier)) continue;
        if (/[\s${}()"'`\\]/.test(specifier)) continue;
        // Data assets cannot import anything, so they are graph leaves.
        if (/\.(?:json|css|svg|png|txt|md)$/.test(specifier)) continue;

        if (specifier.startsWith('.')) {
          const resolved = resolveRelative(file, specifier);
          if (!resolved) {
            unresolved.push({
              package: pkg.name,
              file: path.relative(repoRoot, file).split(path.sep).join('/'),
              specifier,
            });
            continue;
          }
          if (!visited.has(resolved)) {
            visited.add(resolved);
            parents.set(resolved, file);
            queue.push(resolved);
          }
          continue;
        }

        const { name, subpath } = splitSpecifier(specifier);
        if (name === GATEWAY_PACKAGE) {
          witness = { file, specifier };
          break;
        }
        const dependency = byName.get(name);
        if (!dependency) continue; // external package: its own graph is not ours
        for (const target of entryTargetsForSubpath(dependency.manifest, subpath)) {
          const resolved = resolveTrackedSource(path.join(repoRoot, dependency.dir), target);
          if (!resolved) {
            unresolved.push({
              package: pkg.name,
              file: path.relative(repoRoot, file).split(path.sep).join('/'),
              specifier,
            });
            continue;
          }
          if (!visited.has(resolved)) {
            visited.add(resolved);
            parents.set(resolved, file);
            queue.push(resolved);
          }
        }
      }
    }

    if (witness) {
      const via = [];
      let cursor = witness.file;
      while (cursor) {
        via.unshift(path.relative(repoRoot, cursor).split(path.sep).join('/'));
        cursor = parents.get(cursor);
      }
      via.push(GATEWAY_PACKAGE);
      reaching.push({ name: pkg.name, dir: pkg.dir, manifest: pkg.manifest, via });
    }
  }

  return { reaching, unresolved };
}

module.exports = {
  GATEWAY_PACKAGE,
  collectGatewayReachingPackages,
  compareVersions,
  manifestNodeFloor,
  readGatewayMinimumNodeVersion,
};
