import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { McpStartRenderer, McpResultRenderer, McpErrorRenderer } from '../src/plugins/mcp.js';
import {
  SubagentSpawnRenderer,
  SubagentResultRenderer,
  SubagentErrorRenderer,
} from '../src/plugins/subagent.js';
import {
  FileReadRenderer,
  FileWriteRenderer,
  FileCreateRenderer,
  FileDeleteRenderer,
} from '../src/plugins/file-ops.js';
import { SessionLifecycleRenderer } from '../src/plugins/session-lifecycle.js';
import type { AgentEvent } from '@a5c-ai/agent-mux';

const b = { runId: 'r', agent: 'claude-code' as const, timestamp: 't' };
const ev = (e: object): AgentEvent => ({ ...b, ...e }) as AgentEvent;

describe('MCP renderers', () => {
  it('renders start/result/error with server+tool', () => {
    const s = render(
      <McpStartRenderer event={ev({ type: 'mcp_tool_call_start', toolCallId: '1', server: 'github', toolName: 'create_issue', input: {} })} />,
    );
    expect(s.lastFrame()).toContain('github');
    expect(s.lastFrame()).toContain('create_issue');

    const r = render(
      <McpResultRenderer event={ev({ type: 'mcp_tool_result', toolCallId: '1', server: 'github', toolName: 'create_issue', output: {} })} />,
    );
    expect(r.lastFrame()).toContain('github');

    const e = render(
      <McpErrorRenderer event={ev({ type: 'mcp_tool_error', toolCallId: '1', server: 'github', toolName: 'x', error: 'boom' })} />,
    );
    expect(e.lastFrame()).toContain('boom');
  });
});

describe('Subagent renderers', () => {
  it('spawn/result/error show ids and text', () => {
    const s = render(
      <SubagentSpawnRenderer event={ev({ type: 'subagent_spawn', subagentId: 's1', agentName: 'codex', prompt: 'hi' })} />,
    );
    expect(s.lastFrame()).toContain('codex');
    expect(s.lastFrame()).toContain('s1');

    const r = render(
      <SubagentResultRenderer event={ev({ type: 'subagent_result', subagentId: 's1', agentName: 'codex', summary: 'done' })} />,
    );
    expect(r.lastFrame()).toContain('done');

    const e = render(
      <SubagentErrorRenderer event={ev({ type: 'subagent_error', subagentId: 's1', agentName: 'codex', error: 'oops' })} />,
    );
    expect(e.lastFrame()).toContain('oops');
  });
});

describe('File-ops renderers', () => {
  it('renders read/write/create/delete with paths', () => {
    expect(
      render(<FileReadRenderer event={ev({ type: 'file_read', path: 'a.ts' })} />).lastFrame(),
    ).toContain('a.ts');
    expect(
      render(<FileWriteRenderer event={ev({ type: 'file_write', path: 'b.ts', byteCount: 42 })} />).lastFrame(),
    ).toMatch(/b\.ts.*42/);
    expect(
      render(<FileCreateRenderer event={ev({ type: 'file_create', path: 'c.ts', byteCount: 7 })} />).lastFrame(),
    ).toContain('c.ts');
    expect(
      render(<FileDeleteRenderer event={ev({ type: 'file_delete', path: 'd.ts' })} />).lastFrame(),
    ).toContain('d.ts');
  });
});

describe('Session lifecycle renderer', () => {
  it('renders all five lifecycle variants', () => {
    const start = render(
      <SessionLifecycleRenderer event={ev({ type: 'session_start', sessionId: 'abc', resumed: true })} />,
    );
    expect(start.lastFrame()).toContain('abc');
    expect(start.lastFrame()).toContain('resumed');

    const resume = render(
      <SessionLifecycleRenderer event={ev({ type: 'session_resume', sessionId: 'abc', priorTurnCount: 5 })} />,
    );
    expect(resume.lastFrame()).toMatch(/5 prior turns/);

    const fork = render(
      <SessionLifecycleRenderer event={ev({ type: 'session_fork', sessionId: 'new', forkedFrom: 'old' })} />,
    );
    expect(fork.lastFrame()).toContain('old');

    const cp = render(
      <SessionLifecycleRenderer event={ev({ type: 'session_checkpoint', sessionId: 's', checkpointId: 'cp1' })} />,
    );
    expect(cp.lastFrame()).toContain('cp1');

    const end = render(
      <SessionLifecycleRenderer event={ev({ type: 'session_end', sessionId: 'abc', turnCount: 3 })} />,
    );
    expect(end.lastFrame()).toMatch(/3 turns/);
  });
});
