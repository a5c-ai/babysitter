import { describe, it, expect } from 'vitest';
import {
  MockProcess,
  AGENT_SCENARIOS,
  ERROR_SCENARIOS,
  INTERACTION_SCENARIOS,
  SUBPROCESS_HARNESS_PROFILES,
  resolveScenario,
  listScenarioNames,
  buildInteractiveScenario,
} from '../src/index.js';

describe('Per-agent scenarios', () => {
  const names = Object.keys(AGENT_SCENARIOS);

  it('covers the current subprocess harness matrix with at least two scenarios each', () => {
    const agents = Object.keys(SUBPROCESS_HARNESS_PROFILES);
    for (const agent of agents) {
      const profile = SUBPROCESS_HARNESS_PROFILES[agent]!;
      const forAgent = names.filter((n) => n.startsWith(`${agent}:`));
      expect(forAgent.length, `agent ${agent}`).toBeGreaterThanOrEqual(2);
      expect(profile.scenarios.every((name) => AGENT_SCENARIOS[name] != null), `profile ${agent}`).toBe(true);
    }
  });

  for (const name of Object.values(SUBPROCESS_HARNESS_PROFILES).flatMap((profile) => profile.scenarios)) {
    it(`scenario ${name} runs and exits 0`, async () => {
      const proc = new MockProcess(AGENT_SCENARIOS[name]!);
      proc.start();
      const res = await proc.waitForExit();
      expect(res.exitCode).toBeGreaterThanOrEqual(0);
      expect(res.stdout.length).toBeGreaterThan(0);
    });
  }
});

describe('resolveScenario / listScenarioNames', () => {
  it('lists agent + error + interactive names', () => {
    const all = listScenarioNames();
    expect(all).toContain('claude:stream-json');
    expect(all).toContain('amp:session');
    expect(all).toContain('droid:tool-call');
    expect(all).toContain('qwen:tool-call');
    expect(all).toContain('error:rate-limit');
    expect(all).toContain('interactive:yolo');
    expect(all).toContain('interactive:timeout');
  });

  it('returns undefined for unknown', () => {
    expect(resolveScenario('nope:nada')).toBeUndefined();
  });

  it('resolves agent scenario', () => {
    const s = resolveScenario('gemini:thinking-stream');
    expect(s?.name).toBe('gemini:thinking-stream');
  });

  it('resolves error scenario', () => {
    const s = resolveScenario('error:crash');
    expect(s).toBeDefined();
    expect(s?.process.crashAfterMs).toBeGreaterThan(0);
  });

  it('resolves interactive scenario', () => {
    const s = resolveScenario('interactive:deny');
    expect(s?.name).toBe('interactive:deny');
  });
});

describe('Error scenarios', () => {
  it('rate-limit exits nonzero and emits error line', async () => {
    const meta = ERROR_SCENARIOS['rate-limit']!;
    const proc = new MockProcess(meta.scenario);
    proc.start();
    const res = await proc.waitForExit();
    expect(res.exitCode).toBe(1);
    expect(res.stdout).toContain('Rate limit');
  });

  it('crash exits with signal code', async () => {
    const meta = ERROR_SCENARIOS['crash']!;
    const proc = new MockProcess(meta.scenario);
    proc.start();
    const res = await proc.waitForExit();
    expect([137, 143]).toContain(res.exitCode);
  });

  it('oom exits with 137', async () => {
    const meta = ERROR_SCENARIOS['oom']!;
    const proc = new MockProcess(meta.scenario);
    proc.start();
    const res = await proc.waitForExit();
    expect(res.exitCode).toBe(137);
  });

  it('timeout scenario hangs until killed', async () => {
    const meta = ERROR_SCENARIOS['timeout']!;
    const proc = new MockProcess(meta.scenario);
    proc.start();
    setTimeout(() => proc.kill(), 50);
    const res = await proc.waitForExit();
    expect(res.exitCode).toBe(143);
  });
});

describe('Interaction scenarios', () => {
  it('yolo auto-responds y', async () => {
    const scen = INTERACTION_SCENARIOS.yolo;
    const proc = new MockProcess(scen);
    const responses: string[] = [];
    proc.on('auto-response', (r: string) => responses.push(r));
    proc.start();
    await proc.waitForExit();
    expect(responses).toEqual(['y\n']);
  });

  it('deny auto-responds n', async () => {
    const scen = INTERACTION_SCENARIOS.deny;
    const proc = new MockProcess(scen);
    const responses: string[] = [];
    proc.on('auto-response', (r: string) => responses.push(r));
    proc.start();
    await proc.waitForExit();
    expect(responses).toEqual(['n\n']);
  });

  it('prompt mode has no auto-response configured', () => {
    const scen = buildInteractiveScenario('prompt');
    expect(scen.interactions).toHaveLength(1);
    expect(scen.interactions?.[0]?.response).toBe('');
  });

  it('deny mode is modeled as a real rejection, not a successful completion', async () => {
    const proc = new MockProcess(buildInteractiveScenario('deny'));
    proc.start();
    const res = await proc.waitForExit();
    expect(res.exitCode).toBeGreaterThan(0);
    expect(res.stdout).not.toContain('"subtype":"success"');
    expect(res.stdout).toContain('denied');
  });

  it('timeout mode is available as an explicit interactive scenario', async () => {
    const scen = buildInteractiveScenario('timeout');
    expect(scen.name).toBe('interactive:timeout');

    const proc = new MockProcess(scen);
    proc.start();
    const res = await proc.waitForExit();
    expect(res.exitCode).toBeGreaterThan(0);
    expect(res.stderr).toContain('timed out');
  });
});
