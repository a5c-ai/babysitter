import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../../src/parse-args.js';
import { skillCommand } from '../../src/commands/skill.js';
import { ExitCode } from '../../src/exit-codes.js';

const client = {} as AgentMuxClient;

let tmp: string;
let prevCwd: string;

function args(sub: string | undefined, positionals: string[], flags: Record<string, unknown> = {}): ParsedArgs {
  return {
    command: 'skill',
    subcommand: sub,
    positionals,
    flags: flags as ParsedArgs['flags'],
  };
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-skill-'));
  prevCwd = process.cwd();
  process.chdir(tmp);
  fs.mkdirSync(path.join(tmp, '.a5c'));
});

afterEach(() => {
  process.chdir(prevCwd);
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('skill command', () => {
  it('agents subcommand lists known agents', async () => {
    const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = await skillCommand(client, args('agents', []));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(out).toHaveBeenCalledWith(expect.stringContaining('claude'));
  });

  it('rejects unknown agent', async () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const code = await skillCommand(client, args('list', ['totally-unknown']));
    expect(code).toBe(ExitCode.USAGE_ERROR);
  });

  it('add copies a folder into the project skills dir', async () => {
    const src = path.join(tmp, 'mySkill');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'SKILL.md'), '# hello\n');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = await skillCommand(client, args('add', ['claude', src], { project: true }));
    expect(code).toBe(ExitCode.SUCCESS);
    const installed = path.join(tmp, '.claude', 'skills', 'mySkill', 'SKILL.md');
    expect(fs.existsSync(installed)).toBe(true);
  });

  it('add refuses to overwrite without --force', async () => {
    const src = path.join(tmp, 'a');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'x.md'), 'x');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    expect(await skillCommand(client, args('add', ['claude', src], { project: true }))).toBe(ExitCode.SUCCESS);
    expect(await skillCommand(client, args('add', ['claude', src], { project: true }))).toBe(ExitCode.GENERAL_ERROR);
    expect(await skillCommand(client, args('add', ['claude', src], { project: true, force: true }))).toBe(ExitCode.SUCCESS);
  });

  it('list shows installed skill names', async () => {
    const dir = path.join(tmp, '.claude', 'skills', 'foo');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), '# foo');
    const writes: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((c) => {
      writes.push(String(c));
      return true;
    });
    const code = await skillCommand(client, args('list', ['claude'], { project: true }));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(writes.join('')).toContain('foo');
  });

  it('remove deletes the skill folder', async () => {
    const dir = path.join(tmp, '.claude', 'skills', 'bar');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), '# bar');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = await skillCommand(client, args('remove', ['claude', 'bar'], { project: true }));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(fs.existsSync(dir)).toBe(false);
  });

  it('where prints both scope paths', async () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((c) => {
      writes.push(String(c));
      return true;
    });
    const code = await skillCommand(client, args('where', ['claude']));
    expect(code).toBe(ExitCode.SUCCESS);
    const out = writes.join('');
    expect(out).toContain('global');
    expect(out).toContain('project');
  });
});
