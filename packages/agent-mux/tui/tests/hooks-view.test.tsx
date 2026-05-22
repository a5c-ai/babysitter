import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import HooksPlugin from '../src/plugins/hooks-view.js';
import { EventStream } from '../src/event-stream.js';

function extract() {
  const views: { component: React.ComponentType<unknown> }[] = [];
  HooksPlugin.register({
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

async function flush() {
  await new Promise((r) => setTimeout(r, 10));
}

async function waitFor(check: () => void, timeoutMs: number = 500) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      check();
      return;
    } catch (error) {
      lastError = error;
      await flush();
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Timed out waiting for hooks-view state');
}

let tmp: string;
let prevCwd: string;
let prevHome: string | undefined;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-hooks-'));
  prevCwd = process.cwd();
  prevHome = process.env.HOME;
  process.chdir(tmp);
  process.env.HOME = tmp;
  process.env.USERPROFILE = tmp;
});
afterEach(() => {
  process.chdir(prevCwd);
  if (prevHome === undefined) delete process.env.HOME;
  else process.env.HOME = prevHome;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('hooks-view', () => {
  it('lists registered hooks', async () => {
    fs.mkdirSync(path.join(tmp, '.amux'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.amux', 'hooks.json'), JSON.stringify({
      version: 1,
      hooks: [
        { id: 'h1', agent: '*', hookType: 'PreToolUse', handler: 'builtin', target: 'noop', enabled: true },
      ],
    }));
    const View = extract();
    const stream = new EventStream();
    const props = { client: {} as never, active: true, eventStream: stream, emit: () => {} };
    const { lastFrame, rerender } = render(<View {...props} />);

    await waitFor(() => {
      rerender(<View {...props} />);
      const frame = lastFrame() ?? '';
      expect(frame).toContain('Hooks');
      expect(frame).toContain('h1');
      expect(frame).toContain('PreToolUse');
    });
  });

  it('removes hook on d + y', async () => {
    const hooksPath = path.join(tmp, '.amux', 'hooks.json');
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
    fs.writeFileSync(hooksPath, JSON.stringify({
      version: 1,
      hooks: [
        { id: 'h1', agent: '*', hookType: 'PreToolUse', handler: 'builtin', target: 'noop', enabled: true },
      ],
    }));
    const View = extract();
    const stream = new EventStream();
    const props = { client: {} as never, active: true, eventStream: stream, emit: () => {} };
    const { stdin, lastFrame, rerender } = render(<View {...props} />);

    await waitFor(() => {
      rerender(<View {...props} />);
      expect(lastFrame() ?? '').toContain('h1');
    });

    stdin.write('d');

    await waitFor(() => {
      rerender(<View {...props} />);
      expect(lastFrame() ?? '').toContain('Remove hook h1? (y/n)');
    });

    stdin.write('y');

    await waitFor(() => {
      const after = JSON.parse(fs.readFileSync(hooksPath, 'utf8')) as { hooks: unknown[] };
      expect(after.hooks.length).toBe(0);
    });
  });
});
