/**
 * FIX-008 — the CLI's declared Node.js engine floor must match what its package
 * root can actually import.
 *
 * `src/index.ts` statically imports `./commands/gateway/index.js`, which reaches
 * `@a5c-ai/adapters-gateway`; the gateway calls `assertNodeSupportsGatewaySqlite()`
 * at module load and throws below 22.13.0 (`node:sqlite` is unflagged only from
 * that release). While this package declared `engines.node >= 20.9.0`, npm
 * happily installed it on Node 20 and the very first `import` crashed — the
 * gateway defect class, one package downstream.
 *
 * The repo-wide derivation (which packages inherit the floor, and whether their
 * manifests and docs agree) lives in scripts/__tests__/gateway-engine-floor.test.mjs.
 * This suite is the *runtime* proof for this package: it imports the built root
 * under every Node.js binary available on the machine and requires success at or
 * above the floor and a loud, actionable failure below it.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..', '..', '..');
const manifestPath = path.join(packageRoot, 'package.json');
const readmePath = path.join(packageRoot, 'README.md');
const distEntrypoint = path.join(packageRoot, 'dist', 'index.js');
const gatewaySqliteSource = path.join(
  repoRoot,
  'packages/adapters/gateway/src/runtime/node-sqlite.ts',
);

/**
 * The gateway's floor is read from its source constant rather than imported:
 * importing `@a5c-ai/adapters-gateway` would itself evaluate the guard this
 * suite is about, and the constant must stay the single number the manifest,
 * the README, the CI matrix and this gate all pin.
 */
function gatewayMinimumNodeVersion(): string {
  const match = /GATEWAY_MINIMUM_NODE_VERSION\s*=\s*'(\d+\.\d+\.\d+)'/.exec(
    fs.readFileSync(gatewaySqliteSource, 'utf8'),
  );
  if (!match) {
    throw new Error(`${gatewaySqliteSource} must export a literal GATEWAY_MINIMUM_NODE_VERSION`);
  }
  return match[1];
}

const GATEWAY_MINIMUM_NODE_VERSION = gatewayMinimumNodeVersion();

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

function manifestFloor(): string {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    engines?: { node?: string };
  };
  const range = manifest.engines?.node;
  if (typeof range !== 'string') {
    throw new Error('packages/adapters/cli/package.json must declare engines.node');
  }
  const match = /^>=(\d+\.\d+\.\d+)$/.exec(range.trim());
  if (!match) {
    throw new Error(
      `engines.node must be an exact ">=x.y.z" floor so the docs can pin the same number, got ${JSON.stringify(range)}`,
    );
  }
  return match[1];
}

/** Node.js binaries this machine can actually run the built root under. */
function discoverNodeBinaries(): Array<{ version: string; execPath: string }> {
  const candidates = new Set<string>([process.execPath]);

  const fromEnv = process.env.GATEWAY_NODE_MATRIX;
  if (fromEnv) {
    for (const entry of fromEnv.split(path.delimiter)) {
      if (entry.trim()) candidates.add(entry.trim());
    }
  }

  const nvmRoot = path.join(os.homedir(), '.nvm', 'versions', 'node');
  if (fs.existsSync(nvmRoot)) {
    for (const entry of fs.readdirSync(nvmRoot)) {
      const candidate = path.join(nvmRoot, entry, 'bin', 'node');
      if (fs.existsSync(candidate)) candidates.add(candidate);
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
    if (!byVersion.has(version)) byVersion.set(version, candidate);
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

describe('adapters-cli Node engine floor (FIX-008)', () => {
  it('inherits exactly the gateway floor in the manifest and the README', () => {
    expect(manifestFloor()).toBe(GATEWAY_MINIMUM_NODE_VERSION);
    expect(fs.readFileSync(readmePath, 'utf8')).toContain(
      `Node.js >= ${GATEWAY_MINIMUM_NODE_VERSION}`,
    );
  });

  it('statically reaches the gateway from the built package root', () => {
    if (!fs.existsSync(distEntrypoint)) {
      throw new Error(
        `${path.relative(repoRoot, distEntrypoint)} is missing. Run "npm run build --workspace=@a5c-ai/adapters-cli" before this gate.`,
      );
    }
    // The gateway edge is the whole reason for the raised floor; if it ever
    // disappears the floor should be revisited deliberately, not silently kept.
    const serveModule = path.join(packageRoot, 'dist', 'commands', 'gateway', 'serve.js');
    expect(fs.existsSync(serveModule)).toBe(true);
    expect(fs.readFileSync(serveModule, 'utf8')).toContain('@a5c-ai/adapters-gateway');
  });

  it('imports the built package root on every supported Node and fails loudly below the floor', () => {
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

    for (const binary of unsupported) {
      const { status, stderr } = importRootWith(binary.execPath);
      expect(
        status,
        `Node ${binary.version} is below the declared floor but imported the package root`,
      ).not.toBe(0);
      expect(stderr).toMatch(
        new RegExp(`requires Node\\.js >=${GATEWAY_MINIMUM_NODE_VERSION.replace(/\./g, '\\.')}|node:sqlite`),
      );
    }
  }, 120_000);
});
