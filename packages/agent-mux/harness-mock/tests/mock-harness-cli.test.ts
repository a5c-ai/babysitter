import { describe, it, expect } from 'vitest';
import { PassThrough } from 'node:stream';
import { parseArgs, applyOverrides, runMockHarness } from '../src/bin/mock-harness.js';
import { AGENT_SCENARIOS } from '../src/scenarios/index.js';

function collectStream(): { stream: PassThrough; text: () => string } {
  const s = new PassThrough();
  const chunks: Buffer[] = [];
  s.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
  return { stream: s, text: () => Buffer.concat(chunks).toString('utf8') };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('mock-harness parseArgs', () => {
  it('parses flags', () => {
    const a = parseArgs(['--scenario', 'x:y', '--agent', 'claude', '--delay', '5', '--stdin-echo', '--exit-code', '7', '--fail-after', '2']);
    expect(a.scenario).toBe('x:y');
    expect(a.agent).toBe('claude');
    expect(a.delay).toBe(5);
    expect(a.stdinEcho).toBe(true);
    expect(a.exitCode).toBe(7);
    expect(a.failAfter).toBe(2);
  });

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['--wat'])).toThrow();
  });

  it('handles --list and --help', () => {
    expect(parseArgs(['--list']).list).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });
});

describe('mock-harness applyOverrides', () => {
  it('overrides delay and exit-code', () => {
    const scen = AGENT_SCENARIOS['claude:basic-text']!;
    const out = applyOverrides(scen, { stdinEcho: false, list: false, help: false, delay: 0, exitCode: 9 });
    expect(out.process.exitCode).toBe(9);
    expect(out.output.every((c) => c.delayMs === 0)).toBe(true);
  });

  it('fail-after truncates output', () => {
    const scen = AGENT_SCENARIOS['claude:multi-turn']!;
    const out = applyOverrides(scen, { stdinEcho: false, list: false, help: false, failAfter: 2 });
    expect(out.output.length).toBe(2);
    expect(out.process.exitCode).not.toBe(0);
  });
});

describe('mock-harness runMockHarness', () => {
  it('--list emits scenario names', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: true, help: false },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(0);
    expect(so.text()).toContain('claude:basic-text');
  });

  it('--list respects the --agent filter', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: true, help: false, agent: 'claude' },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(0);
    expect(so.text()).toContain('claude:stream-json');
    expect(so.text()).not.toContain('codex:exec-turn');
    expect(so.text()).not.toContain('interactive:yolo');
  });

  it('missing --scenario returns 2', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(2);
    expect(se.text()).toContain('--scenario');
  });

  it('unknown scenario returns 2', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false, scenario: 'nope:nada' },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(2);
    expect(se.text()).toContain('unknown scenario');
  });

  it('replays a scenario to stdout', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false, scenario: 'claude:basic-text', delay: 0 },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(0);
    expect(so.text()).toContain('"type":"system"');
    expect(so.text()).toContain('"type":"result"');
  });

  it('--agent resolves bare scenario names within the selected prefix', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false, agent: 'claude', scenario: 'stream-json', delay: 0 },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(0);
    expect(so.text()).toContain('"type":"system"');
    expect(so.text()).toContain('"type":"result"');
  });

  it('--agent rejects scenarios outside the selected prefix', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false, agent: 'claude', scenario: 'codex:error' },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(2);
    expect(se.text()).toContain('unknown scenario');
  });

  it('stdin-echo pipes stdin back to stdout', async () => {
    const so = collectStream(); const se = collectStream();
    const stdin = new PassThrough();
    const p = runMockHarness(
      { stdinEcho: true, list: false, help: false, scenario: 'claude:basic-text', delay: 0 },
      { stdout: so.stream, stderr: se.stream, stdin },
    );
    stdin.write('hello\n');
    const code = await p;
    expect(code).toBe(0);
    expect(so.text()).toContain('stdin:hello');
  });

  it('interactive:prompt waits for stdin before completing', async () => {
    const so = collectStream(); const se = collectStream();
    const stdin = new PassThrough();
    let settled = false;
    const run = runMockHarness(
      { stdinEcho: false, list: false, help: false, scenario: 'interactive:prompt', delay: 0 },
      { stdout: so.stream, stderr: se.stream, stdin },
    ).then((code) => {
      settled = true;
      return code;
    });

    await wait(140);
    expect(settled).toBe(false);
    expect(se.text()).toContain('Do you want to allow this tool call?');
    expect(so.text()).not.toContain('"type":"result"');

    stdin.write('y\n');
    const code = await run;
    expect(code).toBe(0);
    expect(so.text()).toContain('"subtype":"success"');
  });

  it('interactive:deny exits cleanly without a success result', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false, scenario: 'interactive:deny', delay: 0 },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(0);
    expect(se.text()).toContain('Do you want to allow this tool call?');
    expect(so.text()).not.toContain('"subtype":"success"');
    expect(so.text()).toContain('denied');
  });

  it('interactive:timeout exits after the approval window closes', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false, scenario: 'interactive:timeout', delay: 0 },
      { stdout: so.stream, stderr: se.stream, stdin: new PassThrough() },
    );
    expect(code).toBeGreaterThan(0);
    expect(se.text()).toContain('timed out');
    expect(so.text()).not.toContain('"subtype":"success"');
  });

  it('--help returns 0 and prints usage', async () => {
    const so = collectStream(); const se = collectStream();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: true },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(0);
    expect(se.text()).toContain('mock-harness');
    expect(se.text()).toContain('--agent <name>');
  });
});
