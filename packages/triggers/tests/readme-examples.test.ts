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

    expect(snippets.length).toBeGreaterThanOrEqual(3);
    for (const snippet of snippets) {
      const parsed = parse(snippet!);
      expect(parsed[0].uses).toBe('./packages/triggers');
      expect(parsed[0].with['trigger-query']).toBeTruthy();
    }
  });
});
