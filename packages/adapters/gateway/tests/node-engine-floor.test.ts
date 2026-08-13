/**
 * FIX-008 — the declared Node.js engine floor must match what the package root
 * can actually import.
 *
 * `packages/adapters/gateway/src/runtime/node-sqlite.ts` loads the built-in
 * `node:sqlite` module eagerly, and `src/index.ts` eagerly re-exports the
 * SQLite-backed token store, so *every* Node.js release accepted by
 * `engines.node` has to expose `node:sqlite` without a CLI flag. Node.js added
 * `node:sqlite` in v22.5.0 behind `--experimental-sqlite` and only unflagged it
 * in v22.13.0, so the historical `>=22.0.0` range accepted installs on runtimes
 * that crashed with ERR_UNKNOWN_BUILTIN_MODULE on the very first import.
 *
 * This suite is the gate that keeps the manifest, the runtime constant, the
 * README and the CI matrix pinned to one number, and proves the number is high
 * enough for every built-in reachable from the packed root entrypoint.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import { builtinModules } from 'node:module';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  GATEWAY_MINIMUM_NODE_VERSION,
  assertNodeSupportsGatewaySqlite,
} from '../src/runtime/node-sqlite.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..', '..', '..');
const manifestPath = path.join(packageRoot, 'package.json');
const readmePath = path.join(packageRoot, 'README.md');
const ciWorkflowPath = path.join(repoRoot, '.github', 'workflows', 'ci.yml');
const distEntrypoint = path.join(packageRoot, 'dist', 'index.js');

/**
 * First Node.js release in which each built-in reachable from the package root
 * can be imported without a CLI flag.
 *
 * Every built-in specifier found in the built root graph must have an entry
 * here. That is deliberate: a new built-in dependency is a runtime-floor
 * decision, so it has to be recorded (with its availability) rather than
 * silently assumed to be ancient.
 *
 * `node:sqlite`: added in v22.5.0 behind `--experimental-sqlite`, unflagged in
 * v22.13.0 — https://nodejs.org/docs/latest-v22.x/api/sqlite.html
 */
const BUILTIN_UNFLAGGED_SINCE: Record<string, string> = {
  events: '0.0.0',
  fs: '0.0.0',
  os: '0.0.0',
  path: '0.0.0',
  'node:child_process': '0.0.0',
  'node:crypto': '0.0.0',
  'node:fs': '0.0.0',
  'node:fs/promises': '14.0.0',
  'node:http': '0.0.0',
  'node:module': '0.0.0',
  'node:os': '0.0.0',
  'node:path': '0.0.0',
  'node:sqlite': '22.13.0',
  'node:url': '0.0.0',
  'node:util': '0.0.0',
};

function parseVersion(version: string): [number, number, number] {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(`Unrecognized version string: ${JSON.stringify(version)}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] < right[index] ? -1 : 1;
    }
  }
  return 0;
}

function readManifest(): { engines?: { node?: string }; name: string } {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function manifestFloor(): string {
  const engines = readManifest().engines;
  const range = engines?.node;
  if (typeof range !== 'string') {
    throw new Error('packages/adapters/gateway/package.json must declare engines.node');
  }
  const match = /^>=(\d+\.\d+\.\d+)$/.exec(range.trim());
  if (!match) {
    throw new Error(
      `engines.node must be an exact ">=x.y.z" floor so the CI matrix and docs can pin the same number, got ${JSON.stringify(range)}`,
    );
  }
  return match[1];
}

/**
 * Every runtime module reachable from the built package root, plus the built-in
 * specifiers each one loads. The built output is scanned (not the TypeScript
 * sources) because that is exactly what a consumer's `import
 * '@a5c-ai/adapters-gateway'` evaluates: type-only imports are already erased.
 */
function scanRootImportGraph(): { modules: string[]; builtins: Map<string, string[]> } {
  if (!fs.existsSync(distEntrypoint)) {
    throw new Error(
      `${path.relative(repoRoot, distEntrypoint)} is missing. Run "npm run build --workspace=@a5c-ai/adapters-gateway" before this gate.`,
    );
  }

  const patterns = [
    /(?:^|[\n;}])\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  const visited = new Set<string>();
  const builtins = new Map<string, string[]>();

  const visit = (file: string): void => {
    if (visited.has(file)) {
      return;
    }
    visited.add(file);
    const source = fs.readFileSync(file, 'utf8');
    const specifiers = new Set<string>();
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(source)) !== null) {
        specifiers.add(match[1]);
      }
    }
    for (const specifier of specifiers) {
      if (specifier.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), specifier);
        if (fs.existsSync(resolved)) {
          visit(resolved);
        } else {
          throw new Error(`${path.relative(repoRoot, file)} imports ${specifier}, which does not exist in dist`);
        }
        continue;
      }
      if (specifier.startsWith('node:') || builtinModules.includes(specifier)) {
        const owners = builtins.get(specifier) ?? [];
        owners.push(path.relative(repoRoot, file).split(path.sep).join('/'));
        builtins.set(specifier, owners);
      }
    }
  };

  visit(distEntrypoint);
  return { modules: [...visited], builtins };
}

/** Node.js binaries this machine can actually run the packed root under. */
function discoverNodeBinaries(): Array<{ version: string; execPath: string }> {
  const candidates = new Set<string>([process.execPath]);

  const fromEnv = process.env.GATEWAY_NODE_MATRIX;
  if (fromEnv) {
    for (const entry of fromEnv.split(path.delimiter)) {
      if (entry.trim()) {
        candidates.add(entry.trim());
      }
    }
  }

  const nvmRoot = path.join(os.homedir(), '.nvm', 'versions', 'node');
  if (fs.existsSync(nvmRoot)) {
    for (const entry of fs.readdirSync(nvmRoot)) {
      const candidate = path.join(nvmRoot, entry, 'bin', 'node');
      if (fs.existsSync(candidate)) {
        candidates.add(candidate);
      }
    }
  }

  const byVersion = new Map<string, string>();
  for (const candidate of candidates) {
    let version: string;
    try {
      version = execFileSync(candidate, ['--version'], { encoding: 'utf8' }).trim().replace(/^v/, '');
    } catch {
      continue;
    }
    if (!byVersion.has(version)) {
      byVersion.set(version, candidate);
    }
  }

  return [...byVersion.entries()]
    .map(([version, execPath]) => ({ version, execPath }))
    .sort((a, b) => compareVersions(a.version, b.version));
}

function importRootWith(execPath: string): { status: number | null; stderr: string } {
  const result = spawnSync(
    execPath,
    ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(distEntrypoint).href)});`],
    { encoding: 'utf8', timeout: 60_000 },
  );
  return { status: result.status, stderr: `${result.stderr ?? ''}${result.error ? String(result.error) : ''}` };
}

describe('gateway Node engine floor (FIX-008)', () => {
  it('declares one exact engine floor across the manifest, the runtime constant, the README and CI', () => {
    const floor = manifestFloor();

    expect(floor).toBe(GATEWAY_MINIMUM_NODE_VERSION);

    const readme = fs.readFileSync(readmePath, 'utf8');
    expect(readme).toContain(`Node.js >= ${GATEWAY_MINIMUM_NODE_VERSION}`);

    const workflow = fs.readFileSync(ciWorkflowPath, 'utf8');
    const jobMatch = /\n {2}gateway-node-engine:\n([\s\S]*?)(?=\n {2}\S|\n?$)/.exec(workflow);
    expect(
      jobMatch,
      '.github/workflows/ci.yml must define a gateway-node-engine job that exercises the declared minimum Node version',
    ).not.toBeNull();
    const matrixMatch = /node-version:\s*\[([^\]]*)\]/.exec(jobMatch![1]);
    expect(matrixMatch, 'the gateway-node-engine job must declare a node-version matrix').not.toBeNull();
    const matrixVersions = matrixMatch![1]
      .split(',')
      .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
    expect(matrixVersions).toContain(GATEWAY_MINIMUM_NODE_VERSION);
  });

  it('sets the floor at or above every built-in reachable from the package root', () => {
    const { builtins } = scanRootImportGraph();

    const unknown = [...builtins.keys()].filter(
      (specifier) => !Object.prototype.hasOwnProperty.call(BUILTIN_UNFLAGGED_SINCE, specifier),
    );
    expect(
      unknown,
      'record the first unflagged Node.js release of each new built-in in BUILTIN_UNFLAGGED_SINCE before shipping it',
    ).toEqual([]);

    let derivedFloor = '0.0.0';
    let derivedFrom = 'no built-ins';
    for (const specifier of builtins.keys()) {
      const since = BUILTIN_UNFLAGGED_SINCE[specifier];
      if (compareVersions(since, derivedFloor) > 0) {
        derivedFloor = since;
        derivedFrom = `${specifier} (${builtins.get(specifier)!.join(', ')})`;
      }
    }

    expect(derivedFloor).toBe('22.13.0');
    expect(derivedFrom).toContain('node:sqlite');
    expect(
      compareVersions(manifestFloor(), derivedFloor) >= 0,
      `engines.node floor ${manifestFloor()} is below ${derivedFloor}, required by ${derivedFrom}`,
    ).toBe(true);
  });

  it('reaches node:sqlite through the single guarded loader', () => {
    const { modules } = scanRootImportGraph();
    const loaders = modules
      .filter((file) => fs.readFileSync(file, 'utf8').includes("require('node:sqlite')"))
      .map((file) => path.relative(packageRoot, file).split(path.sep).join('/'));
    expect(loaders).toEqual(['dist/runtime/node-sqlite.js']);
  });

  it('rejects an explicitly unsupported Node version with an actionable diagnostic', () => {
    expect(() => assertNodeSupportsGatewaySqlite('22.12.0')).toThrowError(
      /requires Node\.js >=22\.13\.0[\s\S]*22\.12\.0[\s\S]*node:sqlite/,
    );
    expect(() => assertNodeSupportsGatewaySqlite('22.4.1')).toThrowError(/requires Node\.js >=22\.13\.0/);
    expect(() => assertNodeSupportsGatewaySqlite('20.19.0')).toThrowError(/requires Node\.js >=22\.13\.0/);
    expect(() => assertNodeSupportsGatewaySqlite(GATEWAY_MINIMUM_NODE_VERSION)).not.toThrow();
    expect(() => assertNodeSupportsGatewaySqlite('24.0.0')).not.toThrow();
  });

  it('imports the built package root on every locally available supported Node and fails loudly below the floor', () => {
    const floor = manifestFloor();
    const binaries = discoverNodeBinaries();
    const supported = binaries.filter((binary) => compareVersions(binary.version, floor) >= 0);
    const unsupported = binaries.filter((binary) => compareVersions(binary.version, floor) < 0);

    expect(
      supported.length,
      `no locally available Node.js >=${floor} to import the built package root with`,
    ).toBeGreaterThan(0);

    for (const binary of supported) {
      const { status, stderr } = importRootWith(binary.execPath);
      expect(status, `Node ${binary.version} failed to import the package root:\n${stderr}`).toBe(0);
    }

    // CI pins the declared minimum (see the gateway-node-engine matrix in
    // .github/workflows/ci.yml); locally this covers whatever nvm has.
    for (const binary of unsupported) {
      const { status, stderr } = importRootWith(binary.execPath);
      expect(status, `Node ${binary.version} is below the declared floor but imported the package root`).not.toBe(0);
      expect(stderr).toMatch(/requires Node\.js >=22\.13\.0|node:sqlite/);
    }
  }, 120_000);
});
