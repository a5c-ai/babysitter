import { describe, it, expect } from 'vitest';
import {
  resolveBreakpointPayload,
  BREAKPOINT_NO_QUESTION_FALLBACK,
} from '../breakpoint-payload';

/**
 * Unit tests for the shared UX-R2 §13.1 resolver (AC-30..AC-32 substrate).
 * Precedence per field:
 *   input.json > taskDef.inputs > taskDef.breakpoint > metadata.payload —
 * first source that carries the field wins; fields resolve independently.
 */
describe('resolveBreakpointPayload', () => {
  // SDK 6.0.2 `ctx.breakpoint` shape, copied from live evidence run
  // 01KWRJGED9BEE39SSPMH0M4JE3/tasks/01KWS6QP63XWADWW6N7HBGQ3GH/task.json:
  // question + options live under task.json → .breakpoint; metadata is null,
  // inputs carry no question, and NO input.json exists on disk.
  const sdk602BreakpointTaskDef = {
    kind: 'breakpoint',
    title: 'Owner: accept deliverables (everything stays local)',
    schemaVersion: '2026.01.tasks-v1',
    sdkVersion: '6.0.2',
    effectId: '01KWS6QP63XWADWW6N7HBGQ3GH',
    taskId: 'final-accept',
    invocationKey:
      'demo-client-upgrade-golive:final-accept.default.c7a8c6d8add5.0:final-accept',
    stepId: 'final-accept.default.c7a8c6d8add5.0',
    io: {
      inputJsonPath: 'tasks/01KWS6QP63XWADWW6N7HBGQ3GH/input.json',
      outputJsonPath: 'tasks/01KWS6QP63XWADWW6N7HBGQ3GH/result.json',
    },
    inputs: { attempt: 1, previousFeedback: null },
    metadata: null,
    breakpoint: {
      breakpointId: 'demo-client.upgrade.final-accept',
      expert: 'owner',
      options: ['Accept', 'Request changes'],
      question:
        'Accept the upgrade branch + runbooks + report? Nothing was pushed; the Dana hand-off (push/PR) and the live steps (2-org probe, staging dry-run, PITR drill) remain owner actions listed in the report.',
      tags: ['approval-gate', 'final'],
    },
  };

  it('reads question/options from task.json → .breakpoint (SDK 6.0.2 ctx.breakpoint shape)', () => {
    const resolved = resolveBreakpointPayload(sdk602BreakpointTaskDef);

    expect(resolved.question).toBe(sdk602BreakpointTaskDef.breakpoint.question);
    expect(resolved.questionSource).toBe('taskDefBreakpoint');
    expect(resolved.options).toEqual(['Accept', 'Request changes']);
    // No title inside .breakpoint — the task definition's own title wins.
    expect(resolved.title).toBe('Owner: accept deliverables (everything stays local)');
  });

  it('ranks taskDef.breakpoint above metadata.payload but below taskDef.inputs and input.json', () => {
    const withAllSources = {
      ...sdk602BreakpointTaskDef,
      metadata: { payload: { question: 'payload q?', options: ['payload-opt'] } },
    };

    // .breakpoint beats metadata.payload for every field.
    const bpWins = resolveBreakpointPayload(withAllSources);
    expect(bpWins.question).toBe(sdk602BreakpointTaskDef.breakpoint.question);
    expect(bpWins.questionSource).toBe('taskDefBreakpoint');
    expect(bpWins.options).toEqual(['Accept', 'Request changes']);

    // taskDef.inputs beats .breakpoint …
    const inputsWin = resolveBreakpointPayload({
      ...withAllSources,
      inputs: { question: 'inputs q?' },
    });
    expect(inputsWin.question).toBe('inputs q?');
    expect(inputsWin.questionSource).toBe('taskDefInputs');
    // … while options still resolve independently from .breakpoint.
    expect(inputsWin.options).toEqual(['Accept', 'Request changes']);

    // input.json beats everything.
    const inputJsonWins = resolveBreakpointPayload(withAllSources, {
      question: 'input.json q?',
    });
    expect(inputJsonWins.question).toBe('input.json q?');
    expect(inputJsonWins.questionSource).toBe('input');
  });

  const payloadOnlyTaskDef = {
    kind: 'breakpoint',
    title: 'breakpoint',
    metadata: {
      label: 'breakpoint',
      payload: {
        context: { fresh: { collision: false } },
        expert: 'owner',
        question: 'Payload question?\nSecond line.',
        tags: ['approval-gate'],
        title: 'Gate 1 — payload title',
      },
    },
    inputs: { label: 'breakpoint' },
  };

  it('reads question/title/context from metadata.payload when inputs carry none (v6 shape)', () => {
    const resolved = resolveBreakpointPayload(payloadOnlyTaskDef);

    expect(resolved.question).toBe('Payload question?\nSecond line.');
    expect(resolved.questionSource).toBe('metadataPayload');
    expect(resolved.title).toBe('Gate 1 — payload title');
    expect(resolved.context).toEqual({ fresh: { collision: false } });
  });

  it('gives input.json highest precedence for every field', () => {
    const resolved = resolveBreakpointPayload(
      {
        ...payloadOnlyTaskDef,
        inputs: { question: 'inputs q?', title: 'inputs t', options: ['a'] },
      },
      { question: 'input.json q?', title: 'input.json t', options: ['b'], context: { files: [] } },
    );

    expect(resolved.question).toBe('input.json q?');
    expect(resolved.questionSource).toBe('input');
    expect(resolved.title).toBe('input.json t');
    expect(resolved.options).toEqual(['b']);
    expect(resolved.context).toEqual({ files: [] });
  });

  it('gives taskDef.inputs precedence over metadata.payload', () => {
    const resolved = resolveBreakpointPayload({
      ...payloadOnlyTaskDef,
      inputs: { question: 'inputs q?' },
    });

    expect(resolved.question).toBe('inputs q?');
    expect(resolved.questionSource).toBe('taskDefInputs');
    // title/context still resolve from the payload — fields are independent.
    expect(resolved.title).toBe('Gate 1 — payload title');
    expect(resolved.context).toEqual({ fresh: { collision: false } });
  });

  it('returns the honest last-resort copy, flagged, when no source has a question (AC-32)', () => {
    const resolved = resolveBreakpointPayload({
      kind: 'breakpoint',
      metadata: { label: 'breakpoint' },
      inputs: { label: 'breakpoint' },
    });

    expect(resolved.question).toBe(
      // owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
      'Approval required: this breakpoint has no question text on disk.',
    );
    expect(resolved.question).toBe(BREAKPOINT_NO_QUESTION_FALLBACK);
    expect(resolved.questionSource).toBe('fallback');
  });

  it('falls back to the task definition title, then "Breakpoint"', () => {
    const withTaskTitle = resolveBreakpointPayload({
      kind: 'breakpoint',
      title: 'Approval Gate',
      inputs: { question: 'q?' },
    });
    expect(withTaskTitle.title).toBe('Approval Gate');

    const bare = resolveBreakpointPayload(null);
    expect(bare.title).toBe('Breakpoint');
    expect(bare.questionSource).toBe('fallback');
  });

  it('ignores non-object sources and empty strings', () => {
    const resolved = resolveBreakpointPayload(
      {
        kind: 'breakpoint',
        inputs: 'not-an-object',
        metadata: { payload: { question: '', title: 'payload title' } },
      },
      null,
    );

    expect(resolved.question).toBe(BREAKPOINT_NO_QUESTION_FALLBACK);
    expect(resolved.questionSource).toBe('fallback');
    expect(resolved.title).toBe('payload title');
  });
});
