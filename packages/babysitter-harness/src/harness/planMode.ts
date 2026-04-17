/**
 * GAP-USER-012: Plan Mode with Verification
 *
 * Interactive plan-verify-execute loop. Generates structured plans,
 * presents for approval, executes with per-step verification,
 * and allows plan modification mid-execution.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single step in an execution plan. */
export interface PlanStep {
  /** Unique step identifier. */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Description of what this step does. */
  description: string;
  /** Step status. */
  status: PlanStepStatus;
  /** Dependencies (IDs of steps that must complete first). */
  dependsOn: string[];
  /** Verification criteria for this step. */
  verificationCriteria?: string;
  /** Task ID if this step was dispatched as an effect. */
  effectId?: string;
  /** Timestamp of completion. */
  completedAt?: string;
  /** Feedback received during verification. */
  feedback?: string;
}

export type PlanStepStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped" | "modified";

/** An execution plan. */
export interface ExecutionPlan {
  /** Plan ID. */
  id: string;
  /** Plan title. */
  title: string;
  /** Overall goal/description. */
  description: string;
  /** Ordered steps. */
  steps: PlanStep[];
  /** Plan status. */
  status: PlanStatus;
  /** Creation timestamp. */
  createdAt: string;
  /** Last update timestamp. */
  updatedAt: string;
}

export type PlanStatus = "draft" | "approved" | "executing" | "completed" | "failed" | "modified";

// ---------------------------------------------------------------------------
// Plan construction
// ---------------------------------------------------------------------------

/** Create a new execution plan. */
export function createPlan(
  id: string,
  title: string,
  description: string,
  steps: Array<Omit<PlanStep, "status">>,
): ExecutionPlan {
  const now = new Date().toISOString();
  return {
    id,
    title,
    description,
    steps: steps.map((s) => ({ ...s, status: "pending" as const })),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

/** Update a step's status. */
export function updateStepStatus(
  plan: ExecutionPlan,
  stepId: string,
  status: PlanStepStatus,
  feedback?: string,
): ExecutionPlan {
  const now = new Date().toISOString();
  const steps = plan.steps.map((s) => {
    if (s.id !== stepId) return s;
    return {
      ...s,
      status,
      completedAt: status === "completed" || status === "failed" ? now : s.completedAt,
      feedback: feedback ?? s.feedback,
    };
  });

  // Derive plan status from step statuses
  const allCompleted = steps.every((s) => s.status === "completed" || s.status === "skipped");
  const anyFailed = steps.some((s) => s.status === "failed");
  const anyInProgress = steps.some((s) => s.status === "in_progress");

  let planStatus: PlanStatus = plan.status;
  if (allCompleted) planStatus = "completed";
  else if (anyFailed) planStatus = "failed";
  else if (anyInProgress) planStatus = "executing";

  return { ...plan, steps, status: planStatus, updatedAt: now };
}

/** Insert a new step into the plan at a given position. */
export function insertStep(
  plan: ExecutionPlan,
  step: Omit<PlanStep, "status">,
  afterStepId?: string,
): ExecutionPlan {
  const now = new Date().toISOString();
  const newStep: PlanStep = { ...step, status: "pending" };
  const steps = [...plan.steps];

  if (afterStepId) {
    const idx = steps.findIndex((s) => s.id === afterStepId);
    if (idx >= 0) {
      steps.splice(idx + 1, 0, newStep);
    } else {
      steps.push(newStep);
    }
  } else {
    steps.push(newStep);
  }

  return { ...plan, steps, status: "modified", updatedAt: now };
}

/** Remove a step from the plan. Also removes it from other steps' dependsOn lists. */
export function removeStep(plan: ExecutionPlan, stepId: string): ExecutionPlan {
  const now = new Date().toISOString();
  const steps = plan.steps
    .filter((s) => s.id !== stepId)
    .map((s) => ({
      ...s,
      dependsOn: s.dependsOn.filter((dep) => dep !== stepId),
    }));
  return {
    ...plan,
    steps,
    status: "modified",
    updatedAt: now,
  };
}

/** Get the next executable step (all dependencies satisfied). */
export function getNextStep(plan: ExecutionPlan): PlanStep | undefined {
  const completedIds = new Set(
    plan.steps
      .filter((s) => s.status === "completed" || s.status === "skipped")
      .map((s) => s.id),
  );
  return plan.steps.find(
    (s) =>
      s.status === "pending" &&
      s.dependsOn.every((dep) => completedIds.has(dep)),
  );
}

/** Get plan progress summary. */
export function getPlanProgress(plan: ExecutionPlan): {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  percentComplete: number;
} {
  const total = plan.steps.length;
  const completed = plan.steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
  const failed = plan.steps.filter((s) => s.status === "failed").length;
  const pending = plan.steps.filter((s) => s.status === "pending").length;
  return {
    total,
    completed,
    failed,
    pending,
    percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/** Format plan for display. */
export function formatPlanForDisplay(plan: ExecutionPlan): string {
  const progress = getPlanProgress(plan);
  const lines: string[] = [
    `## ${plan.title}`,
    `Status: ${plan.status} | Progress: ${progress.completed}/${progress.total} (${progress.percentComplete}%)`,
    "",
    plan.description,
    "",
    "### Steps",
  ];

  for (const step of plan.steps) {
    const statusIcon = {
      pending: "[ ]",
      in_progress: "[~]",
      completed: "[x]",
      failed: "[!]",
      skipped: "[-]",
      modified: "[*]",
    }[step.status];
    lines.push(`${statusIcon} **${step.id}**: ${step.title}`);
    if (step.description) lines.push(`    ${step.description}`);
    if (step.dependsOn.length > 0) lines.push(`    Depends on: ${step.dependsOn.join(", ")}`);
    if (step.feedback) lines.push(`    Feedback: ${step.feedback}`);
  }

  return lines.join("\n");
}
