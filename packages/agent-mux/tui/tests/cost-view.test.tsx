import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { EventStream } from '../src/event-stream.js';
import CostViewPlugin from '../src/plugins/cost-view.js';
import type { AgentEvent } from '@a5c-ai/agent-mux';

function extractView() {
  const views: { component: React.ComponentType<unknown> }[] = [];
  CostViewPlugin.register({
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

const mkCost = (agent: string, usd: number): AgentEvent =>
  ({
    type: 'cost',
    runId: 'r',
    agent,
    timestamp: 't',
    cost: { totalUsd: usd },
  }) as AgentEvent;

const mkTokens = (agent: string, input: number, output: number): AgentEvent =>
  ({
    type: 'token_usage',
    runId: 'r',
    agent,
    timestamp: 't',
    inputTokens: input,
    outputTokens: output,
  }) as AgentEvent;

async function flush() {
  await new Promise((r) => setTimeout(r, 10));
}

describe('cost dashboard view', () => {
  it('shows zero totals when no events observed', () => {
    const View = extractView();
    const stream = new EventStream();
    const { lastFrame } = render(
      <View client={{}} active={true} eventStream={stream} emit={() => {}} />,
    );
    expect(lastFrame()).toMatch(/\$0\.0000/);
  });

  it('sums cost events across agents and shows per-agent breakdown', async () => {
    const View = extractView();
    const stream = new EventStream();
    const { lastFrame, rerender } = render(
      <View client={{}} active={true} eventStream={stream} emit={() => {}} />,
    );
    stream.push(mkCost('claude-code', 0.01));
    stream.push(mkCost('codex', 0.02));
    stream.push(mkCost('claude-code', 0.03));
    await flush();
    rerender(<View client={{}} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('claude-code');
    expect(f).toContain('codex');
    expect(f).toMatch(/\$0\.0600/); // total 0.01+0.02+0.03
    expect(f).toMatch(/\$0\.0400/); // claude-code subtotal
    expect(f).toMatch(/\$0\.0200/); // codex subtotal
  });

  it('accumulates token usage', async () => {
    const View = extractView();
    const stream = new EventStream();
    const { lastFrame, rerender } = render(
      <View client={{}} active={true} eventStream={stream} emit={() => {}} />,
    );
    stream.push(mkTokens('claude-code', 100, 50));
    stream.push(mkTokens('claude-code', 200, 25));
    await flush();
    rerender(<View client={{}} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('300'); // input
    expect(f).toContain('75'); // output
  });
});
