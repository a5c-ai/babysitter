import { describe, expect, it } from 'vitest';

import { resolveDependencyBin } from '../resolveDependencyBin';

describe('resolveDependencyBin', () => {
  // @a5c-ai/hooks-adapter-cli is a bin-only package with no "main" — resolving via
  // require.resolve('<pkg>') would fail, so the resolver must read package.json
  // directly from node_modules.
  it('resolves the adapters-hooks bin from a bin-only dependency', () => {
    const entry = resolveDependencyBin('@a5c-ai/hooks-adapter-cli', 'adapters-hooks');
    expect(entry.replace(/\\/g, '/')).toContain('@a5c-ai/hooks-adapter-cli/');
    expect(entry.replace(/\\/g, '/')).toMatch(/main\.js$/);
  });

  // @a5c-ai/adapters ships a restrictive "exports" map that blocks
  // require.resolve('@a5c-ai/adapters/package.json') with ERR_PACKAGE_PATH_NOT_EXPORTED.
  // The fs-based lookup must bypass that.
  it('resolves the adapters bin past a restrictive exports map', () => {
    const entry = resolveDependencyBin('@a5c-ai/adapters', 'adapters');
    expect(entry.replace(/\\/g, '/')).toContain('@a5c-ai/adapters/');
    expect(entry.replace(/\\/g, '/')).toMatch(/adapters\.js$/);
  });

  it('throws for an unknown bin name', () => {
    expect(() => resolveDependencyBin('@a5c-ai/hooks-adapter-cli', 'nope')).toThrow(
      /does not declare a "nope" bin/
    );
  });
});
