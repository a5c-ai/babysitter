import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  listJsonlFiles,
  listJsonFiles,
  parseJsonlFile,
  readJsonFile,
  writeJsonFileAtomic,
  parseFlatYaml,
  stringifyFlatYaml,
  parseJsonlSessionFile,
  rowToMessage,
  writeTextFileAtomic,
} from '../src/session-fs.js';

async function mkTmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'sfs-'));
}

describe('session-fs helpers', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkTmp();
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('listJsonlFiles returns [] when dir missing', async () => {
    const files = await listJsonlFiles(path.join(dir, 'nope'));
    expect(files).toEqual([]);
  });

  it('listJsonlFiles walks recursively', async () => {
    await fs.mkdir(path.join(dir, 'sub'), { recursive: true });
    await fs.writeFile(path.join(dir, 'a.jsonl'), '{}\n');
    await fs.writeFile(path.join(dir, 'sub', 'b.jsonl'), '{}\n');
    await fs.writeFile(path.join(dir, 'c.txt'), 'nope');
    const files = await listJsonlFiles(dir);
    expect(files).toHaveLength(2);
    expect(files.every((f) => f.endsWith('.jsonl'))).toBe(true);
    expect(files.every((f) => !f.includes('\\'))).toBe(true); // forward slashes
  });

  it('listJsonFiles filters .json files', async () => {
    await fs.writeFile(path.join(dir, 'a.json'), '{}');
    await fs.writeFile(path.join(dir, 'b.jsonl'), '{}');
    const files = await listJsonFiles(dir);
    expect(files).toHaveLength(1);
  });

  it('parseJsonlFile skips blanks and malformed lines', async () => {
    const p = path.join(dir, 'file.jsonl');
    await fs.writeFile(p, '{"a":1}\n\n{bad}\n{"b":2}\n');
    const rows = await parseJsonlFile(p);
    expect(rows).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('parseJsonlFile returns [] for missing file', async () => {
    expect(await parseJsonlFile(path.join(dir, 'missing.jsonl'))).toEqual([]);
  });

  it('readJsonFile + writeJsonFileAtomic roundtrip', async () => {
    const p = path.join(dir, 'nested', 'c.json');
    await writeJsonFileAtomic(p, { hello: 'world', n: 42 });
    const data = await readJsonFile<{ hello: string; n: number }>(p);
    expect(data).toEqual({ hello: 'world', n: 42 });
  });

  it('readJsonFile returns null on missing', async () => {
    expect(await readJsonFile(path.join(dir, 'missing.json'))).toBeNull();
  });

  it('parseFlatYaml handles scalars, quotes, and nested one level', async () => {
    const yaml = [
      '# comment',
      'name: hermes',
      'port: 8080',
      'enabled: true',
      'nullish: null',
      'quoted: "hello world"',
      'nested:',
      '  key1: value1',
      '  key2: 99',
    ].join('\n');
    const parsed = parseFlatYaml(yaml);
    expect(parsed['name']).toBe('hermes');
    expect(parsed['port']).toBe(8080);
    expect(parsed['enabled']).toBe(true);
    expect(parsed['nullish']).toBeNull();
    expect(parsed['quoted']).toBe('hello world');
    expect(parsed['nested']).toEqual({ key1: 'value1', key2: 99 });
  });

  it('stringifyFlatYaml is roundtrip-compatible with parseFlatYaml', async () => {
    const src = { a: 'x', b: 5, nested: { k: 'v' } };
    const yaml = stringifyFlatYaml(src);
    const parsed = parseFlatYaml(yaml);
    expect(parsed).toEqual(src);
  });

  it('rowToMessage extracts role/content for known shapes', () => {
    expect(rowToMessage({ role: 'user', content: 'hi' })).toEqual({ role: 'user', content: 'hi' });
    expect(rowToMessage({ role: 'assistant', text: 'yo' })).toEqual({
      role: 'assistant',
      content: 'yo',
    });
    expect(rowToMessage({ role: 'model', message: 'resp' })).toEqual({
      role: 'assistant',
      content: 'resp',
    });
    expect(rowToMessage({ sender: 'system', content: 'sys' })).toEqual({
      role: 'system',
      content: 'sys',
    });
    expect(rowToMessage({
      type: 'assistant',
      timestamp: '2026-05-02T10:00:01.000Z',
      message: {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'inspect repo' },
          { type: 'text', text: 'I will inspect the repo.' },
          { type: 'tool_use', id: 'toolu_1', name: 'Read', input: { file_path: 'README.md' } },
        ],
      },
    })).toEqual({
      role: 'assistant',
      content: 'I will inspect the repo.',
      timestamp: new Date('2026-05-02T10:00:01.000Z'),
      thinking: 'inspect repo',
      toolCalls: [{ toolCallId: 'toolu_1', toolName: 'Read', input: { file_path: 'README.md' } }],
    });
    expect(rowToMessage({ foo: 'bar' })).toBeNull();
  });

  it('parseJsonlSessionFile derives timestamps + messages', async () => {
    const p = path.join(dir, 'sess-abc.jsonl');
    await fs.writeFile(
      p,
      ['{"role":"user","content":"hi"}', '{"role":"assistant","content":"hello"}'].join('\n'),
    );
    const parsed = await parseJsonlSessionFile(p, 'claude');
    expect(parsed.sessionId).toBe('sess-abc');
    expect(parsed.agent).toBe('claude');
    expect(parsed.turnCount).toBe(1);
    expect(parsed.messages).toHaveLength(2);
    expect(parsed.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('parseJsonlSessionFile normalizes Claude content blocks and tool results', async () => {
    const p = path.join(dir, 'claude-session.jsonl');
    await fs.writeFile(
      p,
      [
        JSON.stringify({
          type: 'user',
          timestamp: '2026-05-02T10:00:00.000Z',
          message: { role: 'user', content: 'Plan this change' },
        }),
        JSON.stringify({
          type: 'assistant',
          timestamp: '2026-05-02T10:00:01.000Z',
          message: {
            role: 'assistant',
            content: [
              { type: 'thinking', thinking: 'inspect repo' },
              { type: 'text', text: 'I will inspect the repo.' },
              { type: 'tool_use', id: 'toolu_1', name: 'Read', input: { file_path: 'README.md' } },
            ],
          },
        }),
        JSON.stringify({
          type: 'user',
          timestamp: '2026-05-02T10:00:02.000Z',
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: 'README contents', is_error: false }],
          },
        }),
      ].join('\n'),
    );

    const parsed = await parseJsonlSessionFile(p, 'claude');
    expect(parsed.messages).toHaveLength(3);
    expect(parsed.messages[0]).toEqual({
      role: 'user',
      content: 'Plan this change',
      timestamp: new Date('2026-05-02T10:00:00.000Z'),
    });
    expect(parsed.messages[1]).toEqual({
      role: 'assistant',
      content: 'I will inspect the repo.',
      timestamp: new Date('2026-05-02T10:00:01.000Z'),
      thinking: 'inspect repo',
      toolCalls: [{ toolCallId: 'toolu_1', toolName: 'Read', input: { file_path: 'README.md' } }],
    });
    expect(parsed.messages[2]).toEqual({
      role: 'tool',
      content: 'README contents',
      timestamp: new Date('2026-05-02T10:00:02.000Z'),
      toolResult: {
        toolCallId: 'toolu_1',
        toolName: 'Read',
        output: 'README contents',
      },
    });
  });

  it('writeTextFileAtomic creates parent dirs and writes', async () => {
    const p = path.join(dir, 'deep', 'inside', 'a.yaml');
    await writeTextFileAtomic(p, 'hello');
    expect(await fs.readFile(p, 'utf8')).toBe('hello');
  });
});
