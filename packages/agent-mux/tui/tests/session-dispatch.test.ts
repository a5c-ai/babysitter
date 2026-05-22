import { describe, it, expect, vi } from 'vitest';
import type { FullSession, SessionManager } from '@a5c-ai/agent-mux';
import {
  buildCrossHarnessMigrationPrompt,
  CROSS_HARNESS_TRANSCRIPT_CHAR_BUDGET,
  CROSS_HARNESS_TRANSCRIPT_MESSAGE_LIMIT,
  resolveSessionDispatchPlan,
} from '../src/session-dispatch.js';

function makeSession(messages: FullSession['messages']): FullSession {
  return {
    agent: 'claude-code',
    sessionId: 'sess-1',
    unifiedId: 'claude-code:sess-1',
    title: 'Original session',
    createdAt: new Date('2026-04-24T00:00:00.000Z'),
    updatedAt: new Date('2026-04-24T00:00:00.000Z'),
    turnCount: messages.filter((message) => message.role === 'user').length,
    model: 'claude-sonnet',
    tags: [],
    cwd: '/repo',
    messages,
  };
}

describe('session-dispatch', () => {
  it('keeps native resume when the requested agent matches the source agent', async () => {
    const get = vi.fn<SessionManager['get']>();
    const plan = await resolveSessionDispatchPlan({
      sessions: { get },
      pendingResume: { agent: 'claude-code', sessionId: 'sess-1' },
      requestedAgent: 'claude-code',
      prompt: 'continue',
    });

    expect(plan).toEqual({
      agent: 'claude-code',
      prompt: 'continue',
      sessionId: 'sess-1',
    });
    expect(get).not.toHaveBeenCalled();
  });

  it('builds a transcript-backed cross-harness fork when the target agent changes', async () => {
    const source = makeSession([
      { role: 'system', content: 'You are reviewing a patch.' },
      { role: 'user', content: 'Find the bug in the resume flow.' },
      { role: 'assistant', content: 'The bug is in the native session handoff.' },
      {
        role: 'tool',
        content: '',
        toolResult: {
          toolCallId: 'tool-1',
          toolName: 'read_file',
          output: { path: 'src/app.tsx', lines: 30 },
        },
      },
    ]);
    const get = vi.fn(async () => source);

    const plan = await resolveSessionDispatchPlan({
      sessions: { get },
      pendingResume: { agent: 'claude-code', sessionId: 'sess-1' },
      requestedAgent: 'codex',
      prompt: 'Continue from there and implement the fix.',
    });

    expect(plan.agent).toBe('codex');
    expect(plan.sessionId).toBeUndefined();
    expect(plan.migration).toEqual({
      sourceAgent: 'claude-code',
      sourceSessionId: 'sess-1',
      importedMessageCount: 4,
      omittedMessageCount: 0,
    });
    expect(plan.prompt).toContain('Continue this conversation in a new codex session.');
    expect(plan.prompt).toContain('Source session: sess-1');
    expect(plan.prompt).toContain('[assistant] The bug is in the native session handoff.');
    expect(plan.prompt).toContain('Tool result read_file(tool-1): {"path":"src/app.tsx","lines":30}');
    expect(plan.prompt).toContain('Latest user instruction:\nContinue from there and implement the fix.');
  });

  it('keeps transcript imports bounded and deterministic', () => {
    const messages = Array.from({ length: CROSS_HARNESS_TRANSCRIPT_MESSAGE_LIMIT + 12 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `${String(index).padStart(2, '0')}: ${'x'.repeat(800)}`,
    })) as FullSession['messages'];

    const migration = buildCrossHarnessMigrationPrompt({
      sourceAgent: 'claude-code',
      sourceSessionId: 'sess-1',
      targetAgent: 'codex',
      sourceSession: makeSession(messages),
      prompt: 'Keep going.',
    });

    expect(migration.importedMessageCount).toBeLessThanOrEqual(CROSS_HARNESS_TRANSCRIPT_MESSAGE_LIMIT);
    expect(migration.omittedMessageCount).toBeGreaterThan(0);
    expect(migration.prompt).toContain('older messages omitted to fit the migration budget');
    expect(migration.prompt).toContain('[assistant] 59:');
    expect(migration.prompt).not.toContain('[user] 00:');
    expect(migration.prompt.length).toBeLessThan(CROSS_HARNESS_TRANSCRIPT_CHAR_BUDGET + 2_000);
  });
});
