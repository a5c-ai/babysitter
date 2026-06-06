/**
 * Prompt plan capture and tracking (OBS-003).
 *
 * Records a planned sequence of steps before execution begins, then
 * updates progress as each step completes. Useful for comparing the
 * "intended plan" against what actually happened in a run.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanStepStatus = 'pending' | 'in-progress' | 'completed' | 'skipped' | 'failed';

export interface PlanStep {
  id: string;
  label: string;
  status: PlanStepStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface PromptPlan {
  planId: string;
  title: string;
  steps: PlanStep[];
  capturedAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

/**
 * Create a new prompt plan from a list of step labels.
 * All steps start in `pending` status.
 */
export function capturePromptPlan(
  planId: string,
  title: string,
  stepLabels: string[],
  now?: string,
): PromptPlan {
  const timestamp = now ?? new Date().toISOString();
  return {
    planId,
    title,
    steps: stepLabels.map((label, idx) => ({
      id: `${planId}-step-${idx}`,
      label,
      status: 'pending',
    })),
    capturedAt: timestamp,
    updatedAt: timestamp,
  };
}

// ---------------------------------------------------------------------------
// Progress updates
// ---------------------------------------------------------------------------

/**
 * Update the status of a step within a plan. Returns a new PromptPlan
 * (immutable update).
 */
export function updatePlanProgress(
  plan: PromptPlan,
  stepId: string,
  status: PlanStepStatus,
  opts?: { error?: string; now?: string },
): PromptPlan {
  const timestamp = opts?.now ?? new Date().toISOString();
  return {
    ...plan,
    updatedAt: timestamp,
    steps: plan.steps.map((step) => {
      if (step.id !== stepId) return step;
      return {
        ...step,
        status,
        startedAt: status === 'in-progress' ? (step.startedAt ?? timestamp) : step.startedAt,
        completedAt:
          status === 'completed' || status === 'failed' || status === 'skipped'
            ? timestamp
            : step.completedAt,
        error: status === 'failed' ? opts?.error : step.error,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export interface PlanSummary {
  planId: string;
  title: string;
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  pending: number;
  inProgress: number;
  formatted: string;
}

/**
 * Produce a summary snapshot for a prompt plan.
 */
export function formatPlanSummary(plan: PromptPlan): PlanSummary {
  const counts: Record<PlanStepStatus, number> = {
    pending: 0,
    'in-progress': 0,
    completed: 0,
    skipped: 0,
    failed: 0,
  };
  for (const step of plan.steps) {
    counts[step.status]++;
  }

  const lines: string[] = [`Plan: ${plan.title} (${plan.planId})`];
  for (const step of plan.steps) {
    const icon =
      step.status === 'completed'
        ? '[x]'
        : step.status === 'failed'
          ? '[!]'
          : step.status === 'skipped'
            ? '[-]'
            : step.status === 'in-progress'
              ? '[>]'
              : '[ ]';
    const suffix = step.error ? ` -- ${step.error}` : '';
    lines.push(`  ${icon} ${step.label}${suffix}`);
  }
  lines.push(
    `Progress: ${counts.completed}/${plan.steps.length} completed, ${counts.failed} failed, ${counts.skipped} skipped`,
  );

  return {
    planId: plan.planId,
    title: plan.title,
    total: plan.steps.length,
    completed: counts.completed,
    failed: counts.failed,
    skipped: counts.skipped,
    pending: counts.pending,
    inProgress: counts['in-progress'],
    formatted: lines.join('\n'),
  };
}
