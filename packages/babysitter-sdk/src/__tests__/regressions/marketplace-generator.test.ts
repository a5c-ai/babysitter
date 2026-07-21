/**
 * Regression: codex marketplace generator format (C4 defect A).
 *
 * `scripts/sync-external-plugin-repos.mjs` synthesizes a self-contained
 * single-plugin marketplace manifest for every generated plugin repo, in the
 * FORMAT/LOCATION each harness expects:
 *   - Claude: `.claude-plugin/marketplace.json` with `source: "./"` (a string).
 *   - Codex:  `.agents/plugins/marketplace.json` with
 *             `source: { source: "local", path: "./" }` (an object).
 *
 * The codex format was previously wrong (claude-style string source /
 * claude location), which made `codex plugin marketplace add owner/repo`
 * fail with "marketplace root does not contain a supported manifest".
 *
 * This test exercises the real generator via `writeRepoMarketplace` and fails
 * if the codex `source` block is reverted to the claude schema.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const SCRIPT_PATH = path.join(REPO_ROOT, 'scripts', 'sync-external-plugin-repos.mjs');

type WriteRepoMarketplace = (repoDir: string) => void;

let writeRepoMarketplace: WriteRepoMarketplace;

beforeAll(async () => {
  const mod = (await import(pathToFileURL(SCRIPT_PATH).href)) as {
    writeRepoMarketplace: WriteRepoMarketplace;
  };
  writeRepoMarketplace = mod.writeRepoMarketplace;
});

function makeRepoFixture(): string {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mkt-gen-'));

  fs.mkdirSync(path.join(repoDir, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, '.claude-plugin', 'plugin.json'),
    JSON.stringify(
      {
        name: 'babysitter',
        version: '9.9.9-test',
        description: 'Test plugin',
        author: { name: 'a5c.ai', email: 'support@a5c.ai' },
      },
      null,
      2,
    ),
  );

  fs.mkdirSync(path.join(repoDir, '.codex-plugin'), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, '.codex-plugin', 'plugin.json'),
    JSON.stringify(
      {
        name: 'babysitter',
        version: '9.9.9-test',
        description: 'Test plugin',
        interface: { displayName: 'Babysitter', category: 'Coding' },
      },
      null,
      2,
    ),
  );

  return repoDir;
}

describe('sync-external-plugin-repos: writeRepoMarketplace', () => {
  it('exports the pure generator so it is importable without side effects', () => {
    expect(typeof writeRepoMarketplace).toBe('function');
  });

  it('writes a codex marketplace at .agents/plugins/marketplace.json with local-object source', () => {
    const repoDir = makeRepoFixture();
    try {
      writeRepoMarketplace(repoDir);

      const codexPath = path.join(repoDir, '.agents', 'plugins', 'marketplace.json');
      expect(fs.existsSync(codexPath)).toBe(true);

      const codex = JSON.parse(fs.readFileSync(codexPath, 'utf8'));
      expect(Array.isArray(codex.plugins)).toBe(true);
      expect(codex.plugins.length).toBeGreaterThan(0);

      const plugin = codex.plugins[0];
      // The load-bearing codex-format assertion.
      expect(plugin.source).toEqual({ source: 'local', path: './' });
      // Codex source MUST NOT be the claude string schema.
      expect(typeof plugin.source).toBe('object');
      expect(plugin.source).not.toBe('./');
      // Required fields.
      expect(plugin.name).toBe('babysitter');
      expect(plugin.version).toBe('9.9.9-test');

      // Codex manifest must NOT be written to the claude location.
      expect(fs.existsSync(path.join(repoDir, '.claude-plugin', 'marketplace.json'))).toBe(true);
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });

  it('writes a claude marketplace at .claude-plugin/marketplace.json with string source', () => {
    const repoDir = makeRepoFixture();
    try {
      writeRepoMarketplace(repoDir);

      const claudePath = path.join(repoDir, '.claude-plugin', 'marketplace.json');
      expect(fs.existsSync(claudePath)).toBe(true);

      const claude = JSON.parse(fs.readFileSync(claudePath, 'utf8'));
      expect(Array.isArray(claude.plugins)).toBe(true);
      const plugin = claude.plugins[0];
      // Claude uses the string source schema (distinct from codex's object).
      expect(plugin.source).toBe('./');
      expect(plugin.name).toBe('babysitter');
      expect(plugin.version).toBe('9.9.9-test');
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });
});
