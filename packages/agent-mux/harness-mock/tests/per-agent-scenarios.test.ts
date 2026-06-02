import { describe, it, expect } from 'vitest';
import { StreamAssembler } from '@a5c-ai/agent-mux-comm';
import type { AgentEvent, ParseContext } from '@a5c-ai/agent-mux-comm';
import { ClaudeAdapter } from '../../adapters/src/claude-adapter.js';
import { CodexAdapter } from '../../adapters/src/codex-adapter.js';
import { GeminiAdapter } from '../../adapters/src/gemini-adapter.js';
import { CopilotAdapter } from '../../adapters/src/copilot-adapter.js';
import { CursorAdapter } from '../../adapters/src/cursor-adapter.js';
import { OpenCodeAdapter } from '../../adapters/src/opencode-adapter.js';
import { PiAdapter } from '../../adapters/src/pi-adapter.js';
import { OmpAdapter } from '../../adapters/src/omp-adapter.js';
import { OpenClawAdapter } from '../../adapters/src/openclaw-adapter.js';
import { HermesAdapter } from '../../adapters/src/hermes-adapter.js';
import { AmpAdapter } from '../../adapters/src/amp-adapter.js';
import { DroidAdapter } from '../../adapters/src/droid-adapter.js';
import { QwenAdapter } from '../../adapters/src/qwen-adapter.js';
import {
  MockProcess,
  AGENT_SCENARIOS,
  ERROR_SCENARIOS,
  INTERACTION_SCENARIOS,
  SUBPROCESS_SCENARIO_EXPECTATIONS,
  SUBPROCESS_HARNESS_PROFILES,
  resolveScenario,
  listScenarioNames,
  buildInteractiveScenario,
} from '../src/index.js';
import type { HarnessScenario } from '../src/index.js';

const ADAPTERS = {
  claude: new ClaudeAdapter(),
  codex: new CodexAdapter(),
  gemini: new GeminiAdapter(),
  copilot: new CopilotAdapter(),
  cursor: new CursorAdapter(),
  opencode: new OpenCodeAdapter(),
  pi: new PiAdapter(),
  omp: new OmpAdapter(),
  openclaw: new OpenClawAdapter(),
  hermes: new HermesAdapter(),
  amp: new AmpAdapter(),
  droid: new DroidAdapter(),
  qwen: new QwenAdapter(),
} as const;

function makeContext(agent: string): ParseContext {
  return {
    runId: 'harness-mock-test',
    agent: agent as ParseContext['agent'],
    sessionId: undefined,
    turnIndex: 0,
    debug: false,
    outputFormat: 'jsonl',
    source: 'stdout',
    assembler: new StreamAssembler(),
    eventCount: 0,
    lastEventType: null,
    adapterState: {},
  };
}

function parseScenario(
  adapter: { parseEvent: (line: string, context: ParseContext) => AgentEvent | AgentEvent[] | null },
  scenario: HarnessScenario,
  agent: string,
): AgentEvent[] {
  const context = makeContext(agent);
  const events: AgentEvent[] = [];
  for (const chunk of scenario.output) {
    if (chunk.stream !== 'stdout') continue;
    for (const line of chunk.data.split('\n')) {
      if (!line.trim()) continue;
      const parsed = adapter.parseEvent(line, context);
      if (parsed == null) continue;
      if (Array.isArray(parsed)) {
        events.push(...parsed);
      } else {
        events.push(parsed);
      }
    }
  }
  return events;
}

describe('Per-agent scenarios', () => {
  it('profiles reference registered scenarios with parser-backed expectations', () => {
    const agents = Object.keys(SUBPROCESS_HARNESS_PROFILES);
    for (const agent of agents) {
      const profile = SUBPROCESS_HARNESS_PROFILES[agent]!;
      expect(profile.scenarios.every((name) => AGENT_SCENARIOS[name] != null), `profile ${agent}`).toBe(true);
      expect(profile.scenarios.every((name) => SUBPROCESS_SCENARIO_EXPECTATIONS[name] != null), `expectations ${agent}`).toBe(true);
    }
  });

  for (const [name, expectation] of Object.entries(SUBPROCESS_SCENARIO_EXPECTATIONS)) {
    it(`scenario ${name} parses through ${expectation.agent} and exits ${expectation.exitCode}`, async () => {
      const adapter = ADAPTERS[expectation.agent as keyof typeof ADAPTERS];
      expect(adapter, `adapter ${expectation.agent}`).toBeDefined();

      const events = parseScenario(
        adapter as { parseEvent: (line: string, context: ParseContext) => AgentEvent | AgentEvent[] | null },
        AGENT_SCENARIOS[name]!,
        expectation.agent,
      );

      expect(events.length, `${name} emitted parsed events`).toBeGreaterThan(0);
      for (const eventType of expectation.parsedEventTypes) {
        expect(events.some((event) => event.type === eventType), `${name} -> ${eventType}`).toBe(true);
      }

      const proc = new MockProcess(AGENT_SCENARIOS[name]!);
      proc.start();
      const res = await proc.waitForExit();
      expect(res.exitCode).toBe(expectation.exitCode);
      expect(res.stdout.length + res.stderr.length, `${name} emitted process output`).toBeGreaterThan(0);
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

  it('deny mode is modeled as a clean denial, not a successful completion', async () => {
    const proc = new MockProcess(buildInteractiveScenario('deny'));
    proc.start();
    const res = await proc.waitForExit();
    expect(res.exitCode).toBe(0);
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
