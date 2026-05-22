/**
 * Mock integration: feed harness-mock scenario output through real adapter
 * parseEvent implementations and assert AgentEvents surface correctly.
 */

import { describe, it, expect } from 'vitest';
import { StreamAssembler } from '@a5c-ai/agent-mux-core';
import type { ParseContext, AgentEvent } from '@a5c-ai/agent-mux-core';

import { ClaudeAdapter } from '../src/claude-adapter.js';
import { CodexAdapter } from '../src/codex-adapter.js';
import { GeminiAdapter } from '../src/gemini-adapter.js';
import { CopilotAdapter } from '../src/copilot-adapter.js';
import { CursorAdapter } from '../src/cursor-adapter.js';
import { OpenCodeAdapter } from '../src/opencode-adapter.js';
import { PiAdapter } from '../src/pi-adapter.js';
import { OmpAdapter } from '../src/omp-adapter.js';
import { OpenClawAdapter } from '../src/openclaw-adapter.js';
import { HermesAdapter } from '../src/hermes-adapter.js';
import { AmpAdapter } from '../src/amp-adapter.js';
import { DroidAdapter } from '../src/droid-adapter.js';
import { QwenAdapter } from '../src/qwen-adapter.js';

import {
  AGENT_SCENARIOS,
  ERROR_SCENARIOS,
} from '../../harness-mock/src/index.js';
import type { HarnessScenario } from '../../harness-mock/src/types.js';

function makeContext(agent: string): ParseContext {
  return {
    runId: 'mock-run',
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

function feed(adapter: { parseEvent: (line: string, ctx: ParseContext) => AgentEvent | AgentEvent[] | null }, scenario: HarnessScenario, agent: string): AgentEvent[] {
  const ctx = makeContext(agent);
  const lines: string[] = [];
  for (const c of scenario.output) {
    if (c.stream !== 'stdout') continue;
    for (const raw of c.data.split('\n')) {
      if (raw.trim().length > 0) lines.push(raw);
    }
  }
  const events: AgentEvent[] = [];
  for (const line of lines) {
    const out = adapter.parseEvent(line, ctx);
    if (out == null) continue;
    if (Array.isArray(out)) events.push(...out);
    else events.push(out);
  }
  return events;
}

describe('adapter × mock scenarios', () => {
  const cases: Array<{
    agent: string;
    adapter: { parseEvent: (l: string, c: ParseContext) => AgentEvent | AgentEvent[] | null };
    scenarios: Array<{
      name: string;
      expected: Array<'text_delta' | 'thinking_delta' | 'session_start' | 'tool_call_start' | 'tool_result' | 'message_stop' | 'cost' | 'error'>;
    }>;
  }> = [
    { agent: 'claude', adapter: new ClaudeAdapter(), scenarios: [
      { name: 'claude:stream-json', expected: ['session_start', 'thinking_delta', 'text_delta', 'message_stop', 'cost'] },
      { name: 'claude:tool-call', expected: ['session_start', 'text_delta', 'tool_call_start', 'tool_result', 'message_stop'] },
    ] },
    { agent: 'codex', adapter: new CodexAdapter(), scenarios: [
      { name: 'codex:exec-turn', expected: ['session_start', 'thinking_delta', 'text_delta', 'message_stop', 'cost'] },
      { name: 'codex:code-generation', expected: ['session_start', 'thinking_delta', 'tool_call_start', 'tool_result', 'message_stop'] },
    ] },
    { agent: 'gemini', adapter: new GeminiAdapter(), scenarios: [
      { name: 'gemini:thinking-stream', expected: ['thinking_delta', 'text_delta'] },
      { name: 'gemini:tool-call', expected: ['text_delta', 'tool_call_start', 'tool_result'] },
    ] },
    { agent: 'copilot', adapter: new CopilotAdapter(), scenarios: [
      { name: 'copilot:plain-text', expected: ['text_delta'] },
    ] },
    { agent: 'cursor', adapter: new CursorAdapter(), scenarios: [
      { name: 'cursor:basic-text', expected: ['text_delta'] },
      { name: 'cursor:tool-call', expected: ['text_delta', 'tool_call_start'] },
    ] },
    { agent: 'opencode', adapter: new OpenCodeAdapter(), scenarios: [
      { name: 'opencode:session', expected: ['session_start', 'text_delta', 'message_stop', 'cost'] },
      { name: 'opencode:tool-call', expected: ['session_start', 'tool_call_start', 'tool_result'] },
    ] },
    { agent: 'pi', adapter: new PiAdapter(), scenarios: [
      { name: 'pi:basic-text', expected: ['text_delta'] },
      { name: 'pi:tool-call', expected: ['text_delta', 'tool_call_start'] },
    ] },
    { agent: 'omp', adapter: new OmpAdapter(), scenarios: [
      { name: 'omp:basic-text', expected: ['text_delta'] },
      { name: 'omp:tool-call', expected: ['text_delta', 'tool_call_start'] },
    ] },
    { agent: 'openclaw', adapter: new OpenClawAdapter(), scenarios: [
      { name: 'openclaw:basic-text', expected: ['text_delta'] },
      { name: 'openclaw:tool-call', expected: ['text_delta', 'tool_call_start'] },
    ] },
    { agent: 'hermes', adapter: new HermesAdapter(), scenarios: [
      { name: 'hermes:basic-text', expected: ['text_delta'] },
      { name: 'hermes:tool-call', expected: ['text_delta', 'tool_call_start'] },
    ] },
    { agent: 'amp', adapter: new AmpAdapter(), scenarios: [
      { name: 'amp:session', expected: ['session_start', 'text_delta', 'cost'] },
      { name: 'amp:tool-call', expected: ['session_start', 'tool_call_start', 'tool_result'] },
    ] },
    { agent: 'droid', adapter: new DroidAdapter(), scenarios: [
      { name: 'droid:session', expected: ['session_start', 'text_delta', 'message_stop', 'cost'] },
      { name: 'droid:tool-call', expected: ['session_start', 'tool_call_start', 'tool_result'] },
    ] },
    { agent: 'qwen', adapter: new QwenAdapter(), scenarios: [
      { name: 'qwen:basic-text', expected: ['text_delta'] },
      { name: 'qwen:tool-call', expected: ['text_delta', 'tool_call_start', 'tool_result'] },
    ] },
  ];

  for (const c of cases) {
    for (const scenarioCase of c.scenarios) {
      it(`${c.agent} parses ${scenarioCase.name}`, () => {
        const scen = AGENT_SCENARIOS[scenarioCase.name]!;
        const events = feed(c.adapter, scen, c.agent);
        expect(events.length).toBeGreaterThan(0);
        for (const eventType of scenarioCase.expected) {
          expect(events.some((e) => e.type === eventType), `${scenarioCase.name} -> ${eventType}`).toBe(true);
        }
      });
    }
  }

  it('rate-limit error scenario surfaces an error event', () => {
    const meta = ERROR_SCENARIOS['rate-limit']!;
    const events = feed(new ClaudeAdapter(), meta.scenario, 'claude');
    const err = events.find((e) => e.type === 'error') as AgentEvent & { message?: string } | undefined;
    expect(err).toBeDefined();
    expect(err?.message).toContain('Rate limit');
  });

  it('auth-required error scenario surfaces an error event', () => {
    const meta = ERROR_SCENARIOS['auth-required']!;
    const events = feed(new CodexAdapter(), meta.scenario, 'codex');
    const err = events.find((e) => e.type === 'error');
    expect(err).toBeDefined();
  });
});
