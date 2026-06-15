import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('built triggers binary', () => {
  it('evaluates event files from dist/cli.js after build', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'triggers-dist-'));
    const eventPath = join(dir, 'event.json');
    const outputPath = join(dir, 'result.json');
    await writeFile(eventPath, JSON.stringify({ comment: { body: '@develop-this from dist' } }), 'utf8');

    await execFileAsync(process.execPath, [
      join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'cli.js'),
      'evaluate',
      '--backend', 'github',
      '--event', 'issue_comment',
      '--event-path', eventPath,
      '--query', 'text:@develop-this',
      '--output', outputPath,
    ]);

    const result = JSON.parse(await readFile(outputPath, 'utf8'));
    expect(result.matched).toBe(true);
  });
});
