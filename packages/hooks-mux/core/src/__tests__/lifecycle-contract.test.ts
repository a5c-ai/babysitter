import { describe, expect, it } from 'vitest';
import type { CanonicalPhase, LifecycleScope } from '../types/lifecycle';

const ISSUE_636_PHASES = [
  'tool.after_failure',
  'tool.after_batch',
  'turn.stop_failure',
  'turn.prompt_expansion',
  'task.created',
  'task.completed',
  'team.idle',
  'session.setup',
  'session.instructions_loaded',
  'session.config_changed',
  'message.received',
  'model.before_request',
  'model.after_response',
  'planner.before_tool_selection',
] satisfies CanonicalPhase[];

const ISSUE_636_SCOPES = [
  'tool',
  'turn',
  'task',
  'team',
  'session',
  'notification',
  'model',
  'planner',
] satisfies LifecycleScope[];

describe('issue #636 lifecycle contract', () => {
  it('types every reconciled canonical phase', () => {
    expect(ISSUE_636_PHASES).toContain('tool.after_failure');
    expect(ISSUE_636_PHASES).toContain('session.config_changed');
    expect(ISSUE_636_PHASES).not.toContain('session.config_change');
  });

  it('types task and team lifecycle scopes', () => {
    expect(ISSUE_636_SCOPES).toContain('task');
    expect(ISSUE_636_SCOPES).toContain('team');
  });
});
