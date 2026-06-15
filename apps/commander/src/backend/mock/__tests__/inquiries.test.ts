/**
 * Breakpoint inquiries — option palettes (SPEC-V3 §V3-5): hook.request payload
 * shape (question + 2–5 icon-less options), hook.decision with optionId,
 * deterministic per-option branching (different follow-up events + phase
 * labels), classic tool approvals as one variety, deadline auto-default.
 */
import { describe, expect, it } from 'vitest';

import type { HookRequestFrame, ServerFrame } from '../../../contracts/gateway-protocol';
import { Simulation, type SimInquiryView } from '../simulation';
import { collectFrames, singlesIn, tickUntil } from './helpers';

/** Boot, start all singles, tick until the first inquiry opens. */
function simWithInquiry(seed = 42): {
  sim: Simulation;
  frames: ServerFrame[];
  inquiry: SimInquiryView;
} {
  const sim = new Simulation({ seed });
  const frames = collectFrames(sim);
  for (const c of singlesIn(sim, 'backlog')) sim.moveCard(c.taskId, 'do');
  const ok = tickUntil(sim, () => sim.listInquiries().length > 0, 2000);
  if (!ok) throw new Error('no inquiry fired within 2000 ticks');
  return { sim, frames, inquiry: sim.listInquiries()[0]! };
}

describe('inquiry payload shape (SPEC-V3 §V3-5)', () => {
  it('hook.request carries { question, options: [{id, caption, detail?, tone?}] } with 2–5 options', () => {
    const { frames, inquiry } = simWithInquiry();
    const frame = frames.find(
      (f): f is HookRequestFrame => f.type === 'hook.request' && f.hookRequestId === inquiry.hookRequestId,
    );
    expect(frame).toBeDefined();
    expect(frame!.hookKind).toBe('inquiry');
    const payload = frame!.payload as { question: string; options: Array<Record<string, unknown>> };
    expect(typeof payload.question).toBe('string');
    expect(payload.question.length).toBeGreaterThan(0);
    expect(payload.options.length).toBeGreaterThanOrEqual(2);
    expect(payload.options.length).toBeLessThanOrEqual(5);
    for (const option of payload.options) {
      expect(typeof option['id']).toBe('string');
      expect(typeof option['caption']).toBe('string');
      // Icons attach in the microagent phase — the payload is icon-less here.
      expect(option['icon']).toBeUndefined();
    }
  });

  it('the owning agent waits (awaiting_input) while the inquiry is open; breakpoint effect pends', () => {
    const { sim, inquiry } = simWithInquiry();
    const agent = sim.listActiveAgentViews().find((a) => a.unitId === inquiry.unitId)!;
    expect(agent.state).toBe('awaiting_input');
    expect(agent.pendingHookId).toBe(inquiry.hookRequestId);
    const obs = sim.getRunObservation(inquiry.taskId)!;
    expect(obs.pendingEffectsByKind['breakpoint']).toBe(1);
    expect(obs.observedState).toBe('waiting');
  });

  it('the sim rolls all four inquiry varieties (strategy, fix-approach, dependency-version, tool-approval)', () => {
    const sim = new Simulation({ seed: 42 });
    for (const c of singlesIn(sim, 'backlog')) sim.moveCard(c.taskId, 'do');
    const seen = new Set<string>();
    tickUntil(
      sim,
      () => {
        for (const inquiry of sim.listInquiries()) {
          seen.add(inquiry.inquiryKind);
          sim.answerInquiry(inquiry.hookRequestId, inquiry.options[0]!.id);
        }
        return seen.size >= 4;
      },
      6000,
    );
    expect([...seen].sort()).toEqual(
      ['dependency-version', 'fix-approach', 'strategy', 'tool-approval'].sort(),
    );
  });
});

describe('hook.decision with optionId resolves and branches', () => {
  it('answering via the protocol frame resolves the inquiry and logs inquiry_resolved with the caption', () => {
    const { sim, frames, inquiry } = simWithInquiry();
    const option = inquiry.options[1]!;
    sim.handleClientFrame({
      type: 'hook.decision',
      hookRequestId: inquiry.hookRequestId,
      decision: 'allow',
      optionId: option.id,
    });
    expect(
      sim.listInquiries().find((i) => i.hookRequestId === inquiry.hookRequestId),
    ).toBeUndefined();
    expect(
      frames.some((f) => f.type === 'hook.resolved' && f.hookRequestId === inquiry.hookRequestId),
    ).toBe(true);
    const resolved = frames.find(
      (f) => f.type === 'run.event' && f.event['type'] === 'inquiry_resolved',
    );
    expect(resolved).toBeDefined();
    expect(resolved!.type === 'run.event' && resolved!.event['optionId']).toBe(option.id);
    expect(resolved!.type === 'run.event' && resolved!.event['caption']).toBe(option.caption);
    // The agent resumes.
    const agent = sim.listActiveAgentViews().find((a) => a.unitId === inquiry.unitId)!;
    expect(agent.state).not.toBe('awaiting_input');
    // The breakpoint effect resolved in the journal.
    const obs = sim.getRunObservation(inquiry.taskId)!;
    expect(obs.pendingEffectsByKind['breakpoint']).toBeUndefined();
    expect(
      obs.journal.some((e) => e.type === 'EFFECT_RESOLVED' && e.data['optionId'] === option.id),
    ).toBe(true);
  });

  it('different optionId => different follow-up events (visible deterministic branching)', () => {
    const followUpsFor = (pick: number): string[] => {
      const { sim, frames, inquiry } = simWithInquiry();
      const option = inquiry.options[Math.min(pick, inquiry.options.length - 1)]!;
      sim.answerInquiry(inquiry.hookRequestId, option.id);
      sim.tick(10);
      return frames
        .filter((f) => f.type === 'run.event' && f.event['type'] === 'inquiry_followup')
        .map((f) => (f.type === 'run.event' ? String(f.event['text']) : ''));
    };
    const branchA = followUpsFor(0);
    const branchB = followUpsFor(1);
    expect(branchA.length).toBeGreaterThanOrEqual(1);
    expect(branchB.length).toBeGreaterThanOrEqual(1);
    expect(branchA).not.toEqual(branchB);
    // Follow-ups name the chosen option's path.
    const { inquiry } = simWithInquiry();
    expect(branchA[0]).toContain(`[${inquiry.options[0]!.id}]`);
    expect(branchB[0]).toContain(`[${inquiry.options[1]!.id}]`);
  });

  it('a non-tool inquiry rewrites a downstream phase label per the chosen option', () => {
    const { sim, inquiry } = simWithInquiry();
    expect(inquiry.inquiryKind).not.toBe('tool-approval'); // rotation starts at strategy
    const option = inquiry.options[2]!;
    sim.answerInquiry(inquiry.hookRequestId, option.id);
    const obs = sim.getRunObservation(inquiry.taskId)!;
    expect(obs.phases.some((p) => p.label.includes(`via ${option.id}`))).toBe(true);
  });

  it('legacy approve/deny without optionId maps to the degenerate 2-option case', () => {
    // Find a tool-approval inquiry (rotation index 4) and deny it bare.
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    for (const c of singlesIn(sim, 'backlog')) sim.moveCard(c.taskId, 'do');
    let inquiry: SimInquiryView | undefined;
    tickUntil(
      sim,
      () => {
        inquiry = sim.listInquiries().find((i) => i.inquiryKind === 'tool-approval');
        if (!inquiry) {
          for (const open of sim.listInquiries()) sim.answerInquiry(open.hookRequestId, open.options[0]!.id);
        }
        return inquiry !== undefined;
      },
      6000,
    );
    expect(inquiry).toBeDefined();
    expect(inquiry!.options.map((o) => o.id)).toEqual(['proceed', 'stand-down']);
    sim.handleClientFrame({
      type: 'hook.decision',
      hookRequestId: inquiry!.hookRequestId,
      decision: 'deny',
    });
    const resolved = frames.find(
      (f) => f.type === 'hook.resolved' && f.hookRequestId === inquiry!.hookRequestId,
    );
    expect(resolved).toMatchObject({ decision: 'deny' });
    const branch = frames.find(
      (f) => f.type === 'run.event' && f.event['type'] === 'inquiry_resolved' && f.event['hookRequestId'] === inquiry!.hookRequestId,
    );
    expect(branch!.type === 'run.event' && branch!.event['optionId']).toBe('stand-down');
  });

  it('unknown hookRequestId answers with an error frame', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    expect(sim.answerInquiry('hook-nope', 'x')).toBe(false);
    expect(frames.some((f) => f.type === 'error' && f.code === 'hook_not_found')).toBe(true);
  });
});

describe('deadline auto-default (board never deadlocks)', () => {
  it('an unanswered inquiry resolves to its first option at the deadline', () => {
    const { sim, frames, inquiry } = simWithInquiry();
    // 15s deadline = 60 ticks; tick past it without answering.
    sim.tick(70);
    expect(sim.listInquiries().find((i) => i.hookRequestId === inquiry.hookRequestId)).toBeUndefined();
    const resolved = frames.find(
      (f) =>
        f.type === 'run.event' &&
        f.event['type'] === 'inquiry_resolved' &&
        f.event['hookRequestId'] === inquiry.hookRequestId,
    );
    expect(resolved!.type === 'run.event' && resolved!.event['optionId']).toBe(inquiry.options[0]!.id);
  });
});
