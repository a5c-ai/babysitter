/**
 * FIX-011 regression: the published bins must answer the harmless smoke
 * arguments the release gate uses.
 *
 * `scripts/verify-release-artifacts.mjs` invokes every declared bin from the
 * installed tarball with `--help` (see `binSmokeArgs` in
 * scripts/lib/package-surface.cjs). `adapters-transport-proxy --help` used to
 * fall through to configuration validation and exit 1 with
 * "Error: Missing targetProvider", so the published CLI could not even print
 * its own usage — and with the release gate's tolerance removed, that fails the
 * release. Usage is not an error: stdout, exit 0, no environment required.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
  version: string;
  bin: Record<string, string>;
};

/** Environment with every proxy variable removed, so nothing can mask the fix. */
function envWithoutProxyConfig(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith('AGENT_MUX_PROXY_')) delete env[key];
  }
  return env;
}

function runBin(binTarget: string, args: string[]): string {
  const entry = path.join(packageRoot, binTarget);
  if (!fs.existsSync(entry)) {
    throw new Error(
      `${binTarget} is missing. Run "npm run build --workspace=@a5c-ai/transport-adapter" before this gate.`,
    );
  }
  return execFileSync(process.execPath, [entry, ...args], {
    encoding: 'utf8',
    env: envWithoutProxyConfig(),
    timeout: 60_000,
  });
}

describe('transport-adapter bin smoke arguments (FIX-011)', () => {
  for (const [binName, binTarget] of Object.entries(manifest.bin)) {
    it(`${binName} --help prints usage on stdout and exits 0 with no configuration`, () => {
      const stdout = runBin(binTarget, ['--help']);
      expect(stdout).toContain('Usage: adapters-transport-proxy');
      expect(stdout).toContain('AGENT_MUX_PROXY_TARGET_PROVIDER');
      expect(stdout).not.toContain('Missing targetProvider');
    });

    it(`${binName} --version prints the package version and exits 0`, () => {
      expect(runBin(binTarget, ['--version']).trim()).toBe(manifest.version);
    });
  }
});
