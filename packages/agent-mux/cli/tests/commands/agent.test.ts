import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../../src/parse-args.js';
import { agentCommand } from '../../src/commands/agent.js';
import { ExitCode } from '../../src/exit-codes.js';

const client = {} as AgentMuxClient;

let tmp: string;
let prevCwd: string;

function args(sub: string | undefined, positionals: string[], flags: Record<string, unknown> = {}): ParsedArgs {
  return {
    command: 'agent',
    subcommand: sub,
    positionals,
    flags: flags as ParsedArgs['flags'],
  };
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-agent-'));
  prevCwd = process.cwd();
  process.chdir(tmp);
});
afterEach(() => {
  process.chdir(prevCwd);
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('agent command', () => {
  it('agents subcommand lists known harnesses', async () => {
    const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = await agentCommand(client, args('agents', []));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(out).toHaveBeenCalledWith(expect.stringContaining('claude'));
    expect(out).toHaveBeenCalledWith(expect.stringContaining('gemini'));
    expect(out).toHaveBeenCalledWith(expect.stringContaining('copilot'));
  });

  it('rejects unknown agent', async () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const code = await agentCommand(client, args('list', ['totally-unknown']));
    expect(code).toBe(ExitCode.USAGE_ERROR);
  });

  it('add copies a single agent .md into the project agents dir', async () => {
    const src = path.join(tmp, 'my-agent.md');
    fs.writeFileSync(src, '---\nname: my-agent\n---\nhello\n');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = await agentCommand(client, args('add', ['claude', src], { project: true }));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(fs.existsSync(path.join(tmp, '.claude', 'agents', 'my-agent.md'))).toBe(true);
  });

  it('add copies a folder recursively', async () => {
    const src = path.join(tmp, 'bundle');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'a.md'), 'a');
    fs.writeFileSync(path.join(src, 'b.md'), 'b');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = await agentCommand(client, args('add', ['claude', src], { project: true }));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(fs.existsSync(path.join(tmp, '.claude', 'agents', 'bundle', 'a.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, '.claude', 'agents', 'bundle', 'b.md'))).toBe(true);
  });

  it('add refuses overwrite without --force', async () => {
    const src = path.join(tmp, 'x.md');
    fs.writeFileSync(src, 'x');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    expect(await agentCommand(client, args('add', ['claude', src], { project: true }))).toBe(ExitCode.SUCCESS);
    expect(await agentCommand(client, args('add', ['claude', src], { project: true }))).toBe(ExitCode.GENERAL_ERROR);
    expect(await agentCommand(client, args('add', ['claude', src], { project: true, force: true }))).toBe(ExitCode.SUCCESS);
  });

  it('list shows installed agent filenames', async () => {
    const dir = path.join(tmp, '.claude', 'agents');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'foo.md'), '# foo');
    fs.writeFileSync(path.join(dir, 'ignore.txt'), 'ignored'); // non-matching ext
    const writes: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((c) => {
      writes.push(String(c));
      return true;
    });
    const code = await agentCommand(client, args('list', ['claude'], { project: true }));
    expect(code).toBe(ExitCode.SUCCESS);
    const out = writes.join('');
    expect(out).toContain('foo.md');
    expect(out).not.toContain('ignore.txt');
  });

  it('remove deletes the agent file', async () => {
    const dir = path.join(tmp, '.claude', 'agents');
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, 'bar.md');
    fs.writeFileSync(f, '# bar');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = await agentCommand(client, args('remove', ['claude', 'bar.md'], { project: true }));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(fs.existsSync(f)).toBe(false);
  });

  it('where prints both scope paths', async () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((c) => {
      writes.push(String(c));
      return true;
    });
    const code = await agentCommand(client, args('where', ['claude']));
    expect(code).toBe(ExitCode.SUCCESS);
    const out = writes.join('');
    expect(out).toContain('global');
    expect(out).toContain('project');
  });

  it('add copies into the gemini and copilot project agent directories', async () => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const geminiSrc = path.join(tmp, 'gemini-agent.md');
    fs.writeFileSync(geminiSrc, 'gemini');
    expect(await agentCommand(client, args('add', ['gemini', geminiSrc], { project: true }))).toBe(ExitCode.SUCCESS);
    expect(fs.existsSync(path.join(tmp, '.gemini', 'agents', 'gemini-agent.md'))).toBe(true);

    const copilotSrc = path.join(tmp, 'copilot-agent.agent.md');
    fs.writeFileSync(copilotSrc, 'copilot');
    expect(await agentCommand(client, args('add', ['copilot', copilotSrc], { project: true }))).toBe(ExitCode.SUCCESS);
    expect(fs.existsSync(path.join(tmp, '.github', 'agents', 'copilot-agent.agent.md'))).toBe(true);
  });
});
