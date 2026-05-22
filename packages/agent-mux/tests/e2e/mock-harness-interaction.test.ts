/**
 * E2E: mock-harness interactive approval modes.
 *
 * Runs the mock-harness entry in-process (since dist is not guaranteed to be
 * built during CI) and verifies each approval mode exercises the right path:
 *   - yolo   → auto-accepts; no stdin needed
 *   - prompt → waits for user; stdin "y" is echoed and run succeeds
 *   - deny   → auto-denies; exits cleanly with "denied" marker
 */

import { describe, it, expect } from 'vitest';
import { PassThrough } from 'node:stream';
import { runMockHarness } from '../../harness-mock/src/bin/mock-harness.js';

function collect(): { stream: PassThrough; text: () => string } {
  const s = new PassThrough();
  const chunks: Buffer[] = [];
  s.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
  return { stream: s, text: () => Buffer.concat(chunks).toString('utf8') };
}

describe('mock-harness interactive e2e', () => {
  it('yolo mode completes without stdin', async () => {
    const so = collect(); const se = collect();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false, scenario: 'interactive:yolo', delay: 0 },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(0);
    expect(so.text()).toContain('"result":"done"');
  });

  it('deny mode exits cleanly with denied marker', async () => {
    const so = collect(); const se = collect();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false, scenario: 'interactive:deny', delay: 0 },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).toBe(0);
    expect(so.text()).toContain('denied');
  });

  it('prompt mode echoes user stdin via --stdin-echo', async () => {
    const so = collect(); const se = collect();
    const stdin = new PassThrough();
    const p = runMockHarness(
      { stdinEcho: true, list: false, help: false, scenario: 'interactive:prompt', delay: 0 },
      { stdout: so.stream, stderr: se.stream, stdin },
    );
    stdin.write('y\n');
    const code = await p;
    expect(code).toBe(0);
    expect(so.text()).toContain('stdin:y');
    expect(se.text()).toContain('Do you want to allow');
  });

  it('fail-after truncates output and exits nonzero', async () => {
    const so = collect(); const se = collect();
    const code = await runMockHarness(
      { stdinEcho: false, list: false, help: false, scenario: 'claude:multi-turn', delay: 0, failAfter: 2 },
      { stdout: so.stream, stderr: se.stream },
    );
    expect(code).not.toBe(0);
    // Only 2 chunks written; should contain system init but not final result
    expect(so.text()).toContain('"type":"system"');
    expect(so.text()).not.toContain('"type":"result"');
  });
});
