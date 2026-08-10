/**
 * Regression: command frontmatter must be valid YAML with string argument-hint (C6).
 *
 * `44a5d58b4` quoted the `observe` command's `argument-hint`. An unquoted
 * `[...]` value (e.g. `argument-hint: [--watch-dir <dir>]`) is parsed by YAML as
 * a flow SEQUENCE, not a string, which broke command loading.
 *
 * This test YAML-parses the frontmatter of every committed command markdown file
 * with a real YAML parser (js-yaml) and asserts:
 *   - the frontmatter parses without error, and
 *   - `argument-hint`, when present, is a string (never an array/object).
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { load as yamlLoad } from 'js-yaml';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

/** Recursively collect every `<...>/commands/*.md` file under a root dir. */
function findCommandMarkdown(rootDir: string): string[] {
  const results: string[] = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        path.basename(path.dirname(full)) === 'commands'
      ) {
        results.push(full);
      }
    }
  };
  walk(rootDir);
  return results;
}

function extractFrontmatter(content: string): string | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  return match ? match[1] : null;
}

const commandFiles = findCommandMarkdown(path.join(REPO_ROOT, 'plugins'));

describe('command frontmatter is valid YAML', () => {
  it('discovers committed command markdown files', () => {
    // Guard against a silently-empty sweep (e.g. moved directories).
    expect(commandFiles.length).toBeGreaterThan(0);
  });

  it.each(commandFiles.map((f) => [path.relative(REPO_ROOT, f), f] as const))(
    'parses %s frontmatter and keeps argument-hint a string',
    (_rel, file) => {
      const content = fs.readFileSync(file, 'utf8');
      const frontmatter = extractFrontmatter(content);
      expect(frontmatter, `no frontmatter block in ${file}`).not.toBeNull();

      let parsed: unknown;
      expect(() => {
        parsed = yamlLoad(frontmatter as string);
      }, `frontmatter did not parse as YAML in ${file}`).not.toThrow();

      expect(parsed).toBeTypeOf('object');
      const fm = parsed as Record<string, unknown>;

      if ('argument-hint' in fm && fm['argument-hint'] !== undefined && fm['argument-hint'] !== null) {
        expect(
          typeof fm['argument-hint'],
          `argument-hint must be a string in ${file}, got ${JSON.stringify(fm['argument-hint'])}`,
        ).toBe('string');
      }
    },
  );
});
