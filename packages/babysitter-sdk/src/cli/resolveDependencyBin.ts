import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface MinimalManifest {
  bin?: string | Record<string, string>;
}

/**
 * Resolve the absolute path to a dependency package's declared bin entry.
 *
 * Locates the package directory by scanning the node_modules resolution paths and
 * reading its `package.json` with `fs` directly. This deliberately avoids
 * `require.resolve('<pkg>/package.json')` (blocked by a restrictive `exports` map,
 * e.g. @a5c-ai/adapters) and `require.resolve('<pkg>')` (fails for bin-only
 * packages with no `main`, e.g. @a5c-ai/hooks-adapter-cli). Used by the
 * babysitter-sdk bin shims that re-expose dependency CLIs on PATH.
 */
export function resolveDependencyBin(packageName: string, binName: string): string {
  const searchPaths = require.resolve.paths(packageName) ?? [];
  for (const base of searchPaths) {
    const packageDir = join(base, ...packageName.split('/'));
    const manifestPath = join(packageDir, 'package.json');
    if (!existsSync(manifestPath)) {
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as MinimalManifest;
    const binValue =
      typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[binName];
    if (!binValue) {
      throw new Error(`${packageName} does not declare a "${binName}" bin`);
    }
    return join(packageDir, binValue);
  }
  throw new Error(`Unable to locate ${packageName} in node_modules`);
}
