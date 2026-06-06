import { describe, it, expect } from 'vitest';
import {
  capturePromptPlan,
  updatePlanProgress,
  formatPlanSummary,
} from '../promptPlan';

const NOW = '2026-06-03T12:00:00.000Z';

// ---------------------------------------------------------------------------
// capturePromptPlan
// ---------------------------------------------------------------------------

describe('capturePromptPlan', () => {
  it('creates a plan with all steps pending', () => {
    const plan = capturePromptPlan('p1', 'Build feature', ['Design', 'Implement', 'Test'], NOW);
    expect(plan.planId).toBe('p1');
    expect(plan.title).toBe('Build feature');
    expect(plan.steps).toHaveLength(3);
    expect(plan.steps.every((s) => s.status === 'pending')).toBe(true);
    expect(plan.capturedAt).toBe(NOW);
  });

  it('assigns sequential step ids', () => {
    const plan = capturePromptPlan('p2', 'Test', ['A', 'B'], NOW);
    expect(plan.steps[0].id).toBe('p2-step-0');
    expect(plan.steps[1].id).toBe('p2-step-1');
  });
});

// ---------------------------------------------------------------------------
// updatePlanProgress
// ---------------------------------------------------------------------------

describe('updatePlanProgress', () => {
  const base = capturePromptPlan('p1', 'Plan', ['Step A', 'Step B'], NOW);

  it('updates a step to in-progress', () => {
    const later = '2026-06-03T12:01:00.000Z';
    const updated = updatePlanProgress(base, 'p1-step-0', 'in-progress', { now: later });
    expect(updated.steps[0].status).toBe('in-progress');
    expect(updated.steps[0].startedAt).toBe(later);
    expect(updated.updatedAt).toBe(later);
    // Other steps unchanged
    expect(updated.steps[1].status).toBe('pending');
  });

  it('updates a step to completed', () => {
    const later = '2026-06-03T12:02:00.000Z';
    const updated = updatePlanProgress(base, 'p1-step-0', 'completed', { now: later });
    expect(updated.steps[0].status).toBe('completed');
    expect(updated.steps[0].completedAt).toBe(later);
  });

  it('records error on failure', () => {
    const later = '2026-06-03T12:03:00.000Z';
    const updated = updatePlanProgress(base, 'p1-step-1', 'failed', {
      error: 'timed out',
      now: later,
    });
    expect(updated.steps[1].status).toBe('failed');
    expect(updated.steps[1].error).toBe('timed out');
    expect(updated.steps[1].completedAt).toBe(later);
  });

  it('does not modify the original plan', () => {
    updatePlanProgress(base, 'p1-step-0', 'completed', { now: NOW });
    expect(base.steps[0].status).toBe('pending');
  });
});

// ---------------------------------------------------------------------------
// formatPlanSummary
// ---------------------------------------------------------------------------

describe('formatPlanSummary', () => {
  it('counts step statuses correctly', () => {
    let plan = capturePromptPlan('p1', 'Demo', ['A', 'B', 'C', 'D'], NOW);
    plan = updatePlanProgress(plan, 'p1-step-0', 'completed', { now: NOW });
    plan = updatePlanProgress(plan, 'p1-step-1', 'failed', { error: 'oops', now: NOW });
    plan = updatePlanProgress(plan, 'p1-step-2', 'skipped', { now: NOW });

    const summary = formatPlanSummary(plan);
    expect(summary.total).toBe(4);
    expect(summary.completed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.pending).toBe(1);
  });

  it('formats a human-readable report', () => {
    let plan = capturePromptPlan('p1', 'Quick test', ['Alpha', 'Beta'], NOW);
    plan = updatePlanProgress(plan, 'p1-step-0', 'completed', { now: NOW });

    const summary = formatPlanSummary(plan);
    expect(summary.formatted).toContain('Quick test');
    expect(summary.formatted).toContain('[x] Alpha');
    expect(summary.formatted).toContain('[ ] Beta');
    expect(summary.formatted).toContain('1/2 completed');
  });

  it('includes error in formatted output for failed steps', () => {
    let plan = capturePromptPlan('p1', 'Err', ['Step'], NOW);
    plan = updatePlanProgress(plan, 'p1-step-0', 'failed', { error: 'crash', now: NOW });

    const summary = formatPlanSummary(plan);
    expect(summary.formatted).toContain('[!] Step -- crash');
  });
});
