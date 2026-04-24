import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import { EventStream } from '../src/event-stream.js';
import type { TuiPlugin } from '../src/plugin.js';

const SUPPORTED_SUBAGENT_AGENTS = [
  { agent: 'claude', projectDir: ['.claude', 'agents'] },
  { agent: 'codex', projectDir: ['.codex', 'agents'] },
  { agent: 'cursor', projectDir: ['.cursor', 'agents'] },
  { agent: 'opencode', projectDir: ['.opencode', 'agents'] },
  { agent: 'gemini', projectDir: ['.gemini', 'agents'] },
  { agent: 'copilot', projectDir: ['.github', 'agents'] },
] as const;

async function extract(modulePath: string) {
  const mod = (await import(modulePath)) as { default: TuiPlugin };
  const plugin = mod.default;
  const views: { component: React.ComponentType<unknown> }[] = [];
  plugin.register({
    client: {} as never,
    eventStream: new EventStream(),
    registerView: (v) => views.push(v as never),
    registerEventRenderer: () => {},
    registerCommand: () => {},
    registerPromptHandler: () => {},
    emit: () => {},
  });
  return views[0]!.component as React.ComponentType<{
    client: unknown;
    active: boolean;
    eventStream: EventStream;
    emit: () => void;
  }>;
}

let tmp: string;
let prevCwd: string;
let prevHome: string | undefined;
let prevUserProfile: string | undefined;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-view-'));
  prevCwd = process.cwd();
  prevHome = process.env.HOME;
  prevUserProfile = process.env.USERPROFILE;
  process.chdir(tmp);
  process.env.HOME = tmp;
  process.env.USERPROFILE = tmp;
});
afterEach(() => {
  process.chdir(prevCwd);
  if (prevHome === undefined) delete process.env.HOME;
  else process.env.HOME = prevHome;
  if (prevUserProfile === undefined) delete process.env.USERPROFILE;
  else process.env.USERPROFILE = prevUserProfile;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('skills-view', () => {
  it('lists installed project skills', async () => {
    fs.mkdirSync(path.join(tmp, '.claude', 'skills', 'foo'), { recursive: true });
    const View = await extract('../src/plugins/skills-view.js');
    const stream = new EventStream();
    const { lastFrame, rerender } = render(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 20));
    rerender(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('Skills');
    expect(f).toContain('claude');
    expect(f).toContain('foo');
  });

  it('deletes selected skill on d + y', async () => {
    const skillDir = path.join(tmp, '.claude', 'skills', 'zap');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'x');
    const View = await extract('../src/plugins/skills-view.js');
    const stream = new EventStream();
    const { stdin, rerender } = render(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 20));
    rerender(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    stdin.write('d');
    await new Promise((r) => setTimeout(r, 20));
    stdin.write('y');
    await new Promise((r) => setTimeout(r, 20));
    expect(fs.existsSync(skillDir)).toBe(false);
  });
});

describe('agents-view', () => {
  it('lists installed project sub-agents across the supported harness matrix', async () => {
    for (const entry of SUPPORTED_SUBAGENT_AGENTS) {
      const dir = path.join(tmp, ...entry.projectDir);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${entry.agent}.md`), entry.agent);
    }
    const View = await extract('../src/plugins/agents-view.js');
    const stream = new EventStream();
    const { lastFrame, rerender } = render(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 20));
    rerender(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('Sub-agents');
    for (const entry of SUPPORTED_SUBAGENT_AGENTS) {
      expect(f).toContain(entry.agent);
      expect(f).toContain(`${entry.agent}.md`);
    }
  });

  it('deletes selected sub-agent on d + y', async () => {
    const file = path.join(tmp, '.claude', 'agents', 'zap.md');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'x');
    const View = await extract('../src/plugins/agents-view.js');
    const stream = new EventStream();
    const { stdin, rerender } = render(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 20));
    rerender(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    stdin.write('d');
    await new Promise((r) => setTimeout(r, 20));
    stdin.write('y');
    await new Promise((r) => setTimeout(r, 20));
    expect(fs.existsSync(file)).toBe(false);
  });

  it('supports add flow for each supported harness and keeps claude-code as a non-picker alias', async () => {
    const View = await extract('../src/plugins/agents-view.js');
    const stream = new EventStream();
    const { stdin, lastFrame, rerender } = render(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 20));
    rerender(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);

    stdin.write('a');
    await new Promise((r) => setTimeout(r, 20));
    const picker = lastFrame() ?? '';
    for (const entry of SUPPORTED_SUBAGENT_AGENTS) expect(picker).toContain(entry.agent);
    expect(picker).not.toContain('claude-code');

    for (const [index, entry] of SUPPORTED_SUBAGENT_AGENTS.entries()) {
      const source = path.join(tmp, `${entry.agent}-source.md`);
      const inputSource = path.basename(source);
      fs.writeFileSync(source, entry.agent);

      stdin.write('a');
      await new Promise((r) => setTimeout(r, 20));
      for (let i = 0; i < index; i += 1) stdin.write('l');
      stdin.write('\r');
      await new Promise((r) => setTimeout(r, 20));
      stdin.write(inputSource);
      stdin.write('\r');
      await new Promise((r) => setTimeout(r, 30));

      expect(fs.existsSync(path.join(tmp, ...entry.projectDir, path.basename(source)))).toBe(true);
      rerender(<View client={{} as never} active={true} eventStream={stream} emit={() => {}} />);
    }
  });
});
