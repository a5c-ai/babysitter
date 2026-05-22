import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import {
  PluginLoadedRenderer,
  PluginInvokedRenderer,
  PluginErrorRenderer,
  SkillLoadedRenderer,
  SkillInvokedRenderer,
  AgentdocReadRenderer,
} from '../src/plugins/plugin-skill.js';
import { ImageOutputRenderer, ImageInputAckRenderer } from '../src/plugins/image.js';
import { ControlRenderer } from '../src/plugins/control.js';
import { LifecycleRenderer } from '../src/plugins/lifecycle.js';
import type { AgentEvent } from '@a5c-ai/agent-mux';

const b = { runId: 'r', agent: 'claude-code' as const, timestamp: 't' };
const ev = (e: object): AgentEvent => ({ ...b, ...e }) as AgentEvent;

describe('plugin/skill/agentdoc renderers', () => {
  it('plugin lifecycle renders id, name, version, error', () => {
    expect(
      render(<PluginLoadedRenderer event={ev({ type: 'plugin_loaded', pluginId: 'p1', pluginName: 'fs', version: '1.0.0' })} />).lastFrame(),
    ).toMatch(/fs.*1\.0\.0/);
    expect(
      render(<PluginInvokedRenderer event={ev({ type: 'plugin_invoked', pluginId: 'p1', pluginName: 'fs' })} />).lastFrame(),
    ).toContain('fs');
    expect(
      render(<PluginErrorRenderer event={ev({ type: 'plugin_error', pluginId: 'p1', pluginName: 'fs', error: 'boom' })} />).lastFrame(),
    ).toContain('boom');
  });

  it('skill + agentdoc render names', () => {
    expect(
      render(<SkillLoadedRenderer event={ev({ type: 'skill_loaded', skillName: 'tdd', source: 'plugin' })} />).lastFrame(),
    ).toContain('tdd');
    expect(
      render(<SkillInvokedRenderer event={ev({ type: 'skill_invoked', skillName: 'tdd' })} />).lastFrame(),
    ).toContain('tdd');
    expect(
      render(<AgentdocReadRenderer event={ev({ type: 'agentdoc_read', path: 'CLAUDE.md' })} />).lastFrame(),
    ).toContain('CLAUDE.md');
  });
});

describe('image renderers', () => {
  it('image_output shows mime + path; image_input_ack shows mime', () => {
    const o = render(
      <ImageOutputRenderer event={ev({ type: 'image_output', mimeType: 'image/png', filePath: 'a.png' })} />,
    );
    expect(o.lastFrame()).toContain('image/png');
    expect(o.lastFrame()).toContain('a.png');
    expect(
      render(<ImageInputAckRenderer event={ev({ type: 'image_input_ack', mimeType: 'image/jpeg' })} />).lastFrame(),
    ).toContain('image/jpeg');
  });
});

describe('control renderers', () => {
  const cases: { name: string; ev: AgentEvent; expects: RegExp[] }[] = [
    { name: 'rate_limited', ev: ev({ type: 'rate_limited', retryAfterMs: 500 }), expects: [/rate_limited/, /500/] },
    { name: 'context_limit_warning', ev: ev({ type: 'context_limit_warning', usedTokens: 90, maxTokens: 100, pctUsed: 90 }), expects: [/90\/100/] },
    { name: 'context_compacted', ev: ev({ type: 'context_compacted', summary: 'compacted', tokensSaved: 1000 }), expects: [/1000/] },
    { name: 'retry', ev: ev({ type: 'retry', attempt: 2, maxAttempts: 5, reason: 'flaky', delayMs: 100 }), expects: [/2\/5/, /flaky/] },
    { name: 'interrupted', ev: ev({ type: 'interrupted' }), expects: [/interrupted/] },
    { name: 'aborted', ev: ev({ type: 'aborted' }), expects: [/aborted/] },
    { name: 'paused', ev: ev({ type: 'paused' }), expects: [/paused/] },
    { name: 'resumed', ev: ev({ type: 'resumed' }), expects: [/resumed/] },
    { name: 'timeout', ev: ev({ type: 'timeout', kind: 'inactivity' }), expects: [/inactivity/] },
    { name: 'turn_limit', ev: ev({ type: 'turn_limit', maxTurns: 10 }), expects: [/10/] },
    { name: 'stream_fallback', ev: ev({ type: 'stream_fallback', capability: 'thinking', reason: 'unsupported' }), expects: [/thinking/, /unsupported/] },
    { name: 'auth_error', ev: ev({ type: 'auth_error', message: 'no key', guidance: 'run amux auth' }), expects: [/no key/, /amux auth/] },
    { name: 'rate_limit_error', ev: ev({ type: 'rate_limit_error', message: 'too fast', retryAfterMs: 1000 }), expects: [/too fast/] },
    { name: 'context_exceeded', ev: ev({ type: 'context_exceeded', usedTokens: 200, maxTokens: 100 }), expects: [/200\/100/] },
    { name: 'crash', ev: ev({ type: 'crash', exitCode: 137, stderr: 'oom' }), expects: [/137/, /oom/] },
    { name: 'error', ev: ev({ type: 'error', code: 'INTERNAL', message: 'boom', recoverable: true }), expects: [/boom/, /recoverable/] },
  ];
  for (const c of cases) {
    it(`renders ${c.name}`, () => {
      const f = render(<ControlRenderer event={c.ev} />).lastFrame() ?? '';
      for (const re of c.expects) expect(f).toMatch(re);
    });
  }
});

describe('lifecycle renderers', () => {
  const cases: { name: string; ev: AgentEvent; substr: string }[] = [
    { name: 'message_start', ev: ev({ type: 'message_start' }), substr: 'message_start' },
    { name: 'message_stop', ev: ev({ type: 'message_stop' }), substr: 'message_stop' },
    { name: 'thinking_start', ev: ev({ type: 'thinking_start' }), substr: 'thinking' },
    { name: 'thinking_stop', ev: ev({ type: 'thinking_stop' }), substr: 'thinking done' },
    { name: 'turn_start', ev: ev({ type: 'turn_start', turnIndex: 3 }), substr: 'turn 3 start' },
    { name: 'turn_end', ev: ev({ type: 'turn_end', turnIndex: 3 }), substr: 'turn 3 end' },
    { name: 'step_start', ev: ev({ type: 'step_start', turnIndex: 1, stepIndex: 2, stepType: 'tool' }), substr: 'step 1.2' },
    { name: 'step_end', ev: ev({ type: 'step_end', turnIndex: 1, stepIndex: 2, stepType: 'tool' }), substr: 'step 1.2 end' },
  ];
  for (const c of cases) {
    it(`renders ${c.name}`, () => {
      expect(render(<LifecycleRenderer event={c.ev} />).lastFrame()).toContain(c.substr);
    });
  }
});
