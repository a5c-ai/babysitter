/**
 * Regression: marketplace owner + sdk bin metadata (C5).
 *
 * 1. `6e8c63e09` added the top-level `owner` object to the repo-root
 *    `.claude-plugin/marketplace.json`. This is load-bearing metadata for the
 *    claude marketplace schema. (The `.cursor-plugin` and `.agents/plugins`
 *    manifests use DIFFERENT schemas that legitimately lack a top-level owner,
 *    so they are intentionally NOT asserted here.)
 *
 * 2. `bd11c5b1b` added `adapters-hooks` and `adapters` bins to
 *    `packages/babysitter-sdk/package.json`. Generated plugin hooks invoke the
 *    bare `adapters-hooks` binary, which npm only provisions when babysitter-sdk
 *    re-exports it as its own bin.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const SDK_PKG = path.resolve(__dirname, '..', '..', '..');

describe('repo-root .claude-plugin/marketplace.json owner', () => {
  it('has a top-level owner object with name and email', () => {
    const manifestPath = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(manifest.owner).toBeDefined();
    expect(typeof manifest.owner).toBe('object');
    expect(manifest.owner).not.toBeNull();
    expect(typeof manifest.owner.name).toBe('string');
    expect(manifest.owner.name.length).toBeGreaterThan(0);
    expect(typeof manifest.owner.email).toBe('string');
    expect(manifest.owner.email.length).toBeGreaterThan(0);
  });
});

describe('babysitter-sdk package.json bin', () => {
  it('exposes the adapters-hooks and adapters bins used for plugin-hook resolution', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(SDK_PKG, 'package.json'), 'utf8'));

    expect(pkg.bin).toBeDefined();
    expect(typeof pkg.bin).toBe('object');
    expect(Object.prototype.hasOwnProperty.call(pkg.bin, 'adapters-hooks')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(pkg.bin, 'adapters')).toBe(true);
    expect(typeof pkg.bin['adapters-hooks']).toBe('string');
    expect(pkg.bin['adapters-hooks'].length).toBeGreaterThan(0);
    expect(typeof pkg.bin['adapters']).toBe('string');
    expect(pkg.bin['adapters'].length).toBeGreaterThan(0);
  });
});
