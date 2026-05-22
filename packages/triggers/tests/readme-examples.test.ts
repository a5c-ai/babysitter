import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('README action examples', () => {
  it('keeps all documented action snippets parseable', async () => {
    const readme = await readFile(join(packageDir, 'README.md'), 'utf8');
    const snippets = [...readme.matchAll(/```yaml\n([\s\S]*?)```/g)].map((match) => match[1]);

    expect(snippets.length).toBeGreaterThanOrEqual(2);
    for (const snippet of snippets) {
      const parsed = parse(snippet!);
      if (!Array.isArray(parsed) || !parsed[0]?.uses) continue;
      expect(parsed[0].uses).toMatch(/(?:\.\/packages\/triggers|a5c-ai\/babysitter\/packages\/triggers@)/);
      expect(parsed[0].with).toBeDefined();
      expect(parsed[0].with['harness'] || parsed[0].with['trigger-query']).toBeTruthy();
    }
  });
});
