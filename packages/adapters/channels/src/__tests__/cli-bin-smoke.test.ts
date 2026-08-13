/**
 * FIX-011 regression: the published bins must answer the harmless smoke
 * arguments the release gate uses.
 *
 * `scripts/verify-release-artifacts.mjs` invokes every declared bin from the
 * installed tarball with `--help` (see `binSmokeArgs` in
 * scripts/lib/package-surface.cjs). `adapters-channels --help` used to be
 * treated as the config path, so the published CLI answered its own usage flag
 * with "mcp-channels: invalid config" and exit 1 — and with the release gate's
 * tolerance removed, that fails the release. Usage is not an error: stdout,
 * exit 0, no config file required.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(HERE, '..', '..');
const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as {
  version: string;
  bin: Record<string, string>;
};

function runBin(binTarget: string, args: string[]): string {
  const entry = resolve(packageRoot, binTarget);
  if (!existsSync(entry)) {
    throw new Error(
      `${binTarget} is missing. Run "npm run build --workspace=@a5c-ai/channels-adapter" before this gate.`,
    );
  }
  return execFileSync(process.execPath, [entry, ...args], { encoding: 'utf8', timeout: 60_000 });
}

describe('channels-adapter bin smoke arguments (FIX-011)', () => {
  for (const [binName, binTarget] of Object.entries(manifest.bin)) {
    it(`${binName} --help prints usage on stdout and exits 0 without a config file`, () => {
      const stdout = runBin(binTarget, ['--help']);
      expect(stdout).toContain('Usage: adapters-channels <config.yml>');
      expect(stdout).not.toContain('invalid config');
    });

    it(`${binName} --version prints the package version and exits 0`, () => {
      expect(runBin(binTarget, ['--version']).trim()).toBe(manifest.version);
    });
  }
});
