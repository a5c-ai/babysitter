import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import {
  ApprovalRequestRenderer,
  ApprovalGrantedRenderer,
  ApprovalDeniedRenderer,
  InputRequiredRenderer,
} from '../src/plugins/approval.js';
import type { AgentEvent } from '@a5c-ai/agent-mux';

const b = { runId: 'r', agent: 'claude-code' as const, timestamp: 't' };
const ev = (e: object): AgentEvent => ({ ...b, ...e }) as AgentEvent;

describe('approval renderers', () => {
  it('request renders action, risk level, detail', () => {
    const { lastFrame } = render(
      <ApprovalRequestRenderer
        event={ev({
          type: 'approval_request',
          interactionId: 'i1',
          action: 'delete repo',
          detail: 'rm -rf .',
          riskLevel: 'high',
        })}
      />,
    );
    const f = lastFrame() ?? '';
    expect(f).toContain('delete repo');
    expect(f).toContain('high');
    expect(f).toContain('rm -rf .');
  });

  it('granted / denied / input-required render expected content', () => {
    const g = render(
      <ApprovalGrantedRenderer event={ev({ type: 'approval_granted', interactionId: 'i1' })} />,
    );
    expect(g.lastFrame()).toContain('i1');

    const d = render(
      <ApprovalDeniedRenderer
        event={ev({ type: 'approval_denied', interactionId: 'i1', reason: 'nope' })}
      />,
    );
    expect(d.lastFrame()).toContain('nope');

    const i = render(
      <InputRequiredRenderer
        event={ev({
          type: 'input_required',
          interactionId: 'i2',
          question: 'what is your name?',
          source: 'agent',
        })}
      />,
    );
    expect(i.lastFrame()).toContain('what is your name?');
  });
});
