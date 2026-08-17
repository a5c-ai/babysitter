/**
 * FIX-009 — unit contract for the explicit, ESM-safe node-pty loader.
 *
 * These tests pin the CLASSIFICATION contract: absence of the optional peer
 * dependency is the ONLY condition that may ever permit a fallback to ordinary
 * pipes. An installed-but-broken node-pty (native binding built for a different
 * Node ABI, missing prebuild, corrupt install, wrong export shape) is an
 * environment defect and must fail loudly in BOTH pty modes.
 *
 * The built-artifact/consumer proof lives in tests/pty-consumer.packaged.test.ts.
 */
import { describe, it, expect } from 'vitest';

import {
  PTY_PACKAGE_NAME,
  PtyNotAvailableError,
  loadPtyModule,
  ptyFallbackIsPermitted,
  resolvePtyMode,
  type PtyRequireLike,
} from '../src/pty.js';

function moduleNotFound(specifier: string): NodeJS.ErrnoException {
  const error = new Error(`Cannot find module '${specifier}'`) as NodeJS.ErrnoException;
  error.code = 'MODULE_NOT_FOUND';
  return error;
}

function makeRequire(behaviour: {
  resolve: () => string;
  load: () => unknown;
}): PtyRequireLike {
  const fn = ((specifier: string) => {
    expect(specifier).toBe(PTY_PACKAGE_NAME);
    return behaviour.load();
  }) as PtyRequireLike;
  fn.resolve = ((specifier: string) => {
    expect(specifier).toBe(PTY_PACKAGE_NAME);
    return behaviour.resolve();
  }) as PtyRequireLike['resolve'];
  return fn;
}

const fakePtyModule = { spawn: () => ({}) };

describe('loadPtyModule classification', () => {
  it('reports module-missing only when node-pty itself cannot be resolved', () => {
    const result = loadPtyModule(
      makeRequire({
        resolve: () => {
          throw moduleNotFound(PTY_PACKAGE_NAME);
        },
        load: () => {
          throw new Error('must not load when resolution failed');
        },
      }),
    );

    expect(result.available).toBe(false);
    if (result.available) throw new Error('unreachable');
    expect(result.reason).toBe('module-missing');
    expect(result.message).toContain('node-pty');
    expect(ptyFallbackIsPermitted(result)).toBe(true);
  });

  it('reports module-load-failed when an INSTALLED node-pty throws while loading', () => {
    const nativeFailure = moduleNotFound('../build/Release/pty.node');
    const result = loadPtyModule(
      makeRequire({
        resolve: () => '/consumer/node_modules/node-pty/lib/index.js',
        load: () => {
          throw nativeFailure;
        },
      }),
    );

    expect(result.available).toBe(false);
    if (result.available) throw new Error('unreachable');
    // A nested MODULE_NOT_FOUND (the native binding) must NOT be mistaken for
    // "the optional peer dependency is not installed".
    expect(result.reason).toBe('module-load-failed');
    expect(result.resolvedPath).toBe('/consumer/node_modules/node-pty/lib/index.js');
    expect(result.cause).toBe(nativeFailure);
    expect(ptyFallbackIsPermitted(result)).toBe(false);
  });

  it('reports module-load-failed when resolution fails for a non-absence reason', () => {
    const exportsFailure = new Error('No "exports" main defined') as NodeJS.ErrnoException;
    exportsFailure.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
    const result = loadPtyModule(
      makeRequire({
        resolve: () => {
          throw exportsFailure;
        },
        load: () => {
          throw new Error('must not load when resolution failed');
        },
      }),
    );

    expect(result.available).toBe(false);
    if (result.available) throw new Error('unreachable');
    expect(result.reason).toBe('module-load-failed');
    expect(ptyFallbackIsPermitted(result)).toBe(false);
  });

  it('reports module-invalid when the installed package has no spawn()', () => {
    const result = loadPtyModule(
      makeRequire({
        resolve: () => '/consumer/node_modules/node-pty/lib/index.js',
        load: () => ({ notSpawn: true }),
      }),
    );

    expect(result.available).toBe(false);
    if (result.available) throw new Error('unreachable');
    expect(result.reason).toBe('module-invalid');
    expect(ptyFallbackIsPermitted(result)).toBe(false);
  });

  it('accepts a CommonJS node-pty and an ESM default-wrapped node-pty', () => {
    const cjs = loadPtyModule(
      makeRequire({ resolve: () => '/x/lib/index.js', load: () => fakePtyModule }),
    );
    expect(cjs.available).toBe(true);

    const esm = loadPtyModule(
      makeRequire({ resolve: () => '/x/lib/index.js', load: () => ({ default: fakePtyModule }) }),
    );
    expect(esm.available).toBe(true);
    if (!esm.available) throw new Error('unreachable');
    expect(esm.module.spawn).toBe(fakePtyModule.spawn);
    expect(esm.resolvedPath).toBe('/x/lib/index.js');
  });

  it('resolves the real node-pty (or classifies it) with no explicit require injected', () => {
    // The default loader must be ESM-safe: bare `require` is a ReferenceError in
    // an ESM module, so this call would throw instead of returning a result.
    const result = loadPtyModule();
    expect(typeof result.available).toBe('boolean');
    if (!result.available) {
      expect(['module-missing', 'module-load-failed', 'module-invalid']).toContain(result.reason);
    } else {
      expect(typeof result.module.spawn).toBe('function');
    }
  });
});

describe('resolvePtyMode', () => {
  it('defaults to preferred', () => {
    expect(resolvePtyMode(undefined, undefined)).toBe('preferred');
    expect(resolvePtyMode(undefined, false)).toBe('preferred');
  });

  it('defaults to required when the adapter declares capabilities.requiresPty', () => {
    expect(resolvePtyMode(undefined, true)).toBe('required');
  });

  it('lets an explicit RunOptions.ptyMode win over the capability default', () => {
    expect(resolvePtyMode('preferred', true)).toBe('preferred');
    expect(resolvePtyMode('required', false)).toBe('required');
  });
});

describe('PtyNotAvailableError', () => {
  it('carries the documented PTY_NOT_AVAILABLE code and the classification reason', () => {
    const error = new PtyNotAvailableError('module-load-failed', 'broken', new Error('boom'));
    expect(error.code).toBe('PTY_NOT_AVAILABLE');
    expect(error.recoverable).toBe(false);
    expect(error.reason).toBe('module-load-failed');
    expect(error.name).toBe('PtyNotAvailableError');
  });
});
