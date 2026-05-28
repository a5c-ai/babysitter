import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli.js';

const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

afterEach(() => {
  stdout.mockClear();
  stderr.mockClear();
});

describe('triggers CLI', () => {
  it('writes enriched events to an output file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'triggers-cli-'));
    const eventPath = join(dir, 'event.json');
    const outputPath = join(dir, 'enriched.json');
    await writeFile(eventPath, JSON.stringify({ comment: { body: '@develop-this' } }), 'utf8');

    const code = await main(['enrich', '--backend', 'github', '--event', 'issue_comment', '--event-path', eventPath, '--output', outputPath]);
    const output = JSON.parse(await readFile(outputPath, 'utf8'));

    expect(code).toBe(0);
    expect(output.eventName).toBe('issue_comment');
    expect(output.text).toContain('@develop-this');
  });

  it('returns 78 for trigger query non-matches', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'amux-cli-'));
    const eventPath = join(dir, 'event.json');
    await writeFile(eventPath, JSON.stringify({ comment: { body: 'plain comment' } }), 'utf8');

    const code = await main(['evaluate', '--backend', 'github', '--event', 'issue_comment', '--event-path', eventPath, '--query', 'text:@develop-this']);

    expect(code).toBe(78);
    expect(stdout.mock.calls.join('\n')).toContain('"matched": false');
  });

  it('prints help without error', async () => {
    await expect(main(['--help'])).resolves.toBe(0);
    expect(stdout.mock.calls.join('\n')).toContain('Usage: triggers');
  });

  it('reports unknown commands as errors', async () => {
    await expect(main(['wat'])).rejects.toThrow('Unknown command: wat');
  });

  it('writes evaluation output files for matches', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'triggers-cli-'));
    const eventPath = join(dir, 'event.json');
    const outputPath = join(dir, 'result.json');
    await writeFile(eventPath, JSON.stringify({ comment: { body: '@develop-this' } }), 'utf8');

    const code = await main(['evaluate', '--backend', 'github', '--event', 'issue_comment', '--event-path', eventPath, '--query', 'text:@develop-this', '--output', outputPath]);
    const result = JSON.parse(await readFile(outputPath, 'utf8'));

    expect(code).toBe(0);
    expect(result.matched).toBe(true);
  });});
