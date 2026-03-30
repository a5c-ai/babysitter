/**
 * @process methodologies/cc10x/cc10x-plan
 * @description CC10X PLAN Workflow - Comprehensive planning with external research, brainstorming, and plan-to-build continuity via docs/plans/
 * @inputs { request: string, projectRoot?: string, memory?: object, includeResearch?: boolean }
 * @outputs { success: boolean, plan: object, planFile: string, researchFindings: object, alternatives: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const researchTask = defineTask('cc10x-plan-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'External Research and Pattern Discovery',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Planner - Research Phase',
      task: 'Research existing solutions, patterns, libraries, and best practices relevant to the planning request. Search GitHub repositories and documentation.',
      context: { ...args },
      instructions: [
        'Search for existing implementations of similar features/systems',
        'Identify relevant libraries, frameworks, and tools',
        'Find best practices and common patterns in the domain',
        'Check for known pitfalls and anti-patterns',
        'Review competitive/comparable solutions',
        'Summarize findings with links and confidence ratings',
        'Focus on actionable insights that inform the plan'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'plan', 'research']
}));

const brainstormTask = defineTask('cc10x-plan-brainstorm', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Brainstorm Alternative Approaches',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Planner - Brainstorming Phase',
      task: 'Generate multiple alternative approaches to the planning request. Evaluate trade-offs for each approach.',
      context: { ...args },
      instructions: [
        'Generate at least 3 distinct approaches to the problem',
        'For each approach, assess: complexity, time estimate, risk, scalability',
        'Consider build-vs-buy decisions',
        'Identify constraints that eliminate certain approaches',
        'Rank approaches by feasibility and alignment with project goals',
        'Include a recommended approach with justification'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'plan', 'brainstorming']
}));

const createPlanTask = defineTask('cc10x-plan-create', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Comprehensive Plan',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Planner - Plan Creation',
      task: 'Create a comprehensive, actionable plan with phases, milestones, dependencies, and risk assessment. Save to docs/plans/ for BUILD workflow continuity.',
      context: { ...args },
      instructions: [
        'Structure plan with phases, each containing specific tasks',
        'Define milestones and acceptance criteria for each phase',
        'Map dependencies between tasks and phases',
        'Include risk assessment with mitigation strategies',
        'Estimate effort and timeline for each phase',
        'Define the testing strategy (TDD requirements per phase)',
        'Save plan as markdown file in docs/plans/ directory',
        'Include metadata: plan ID, creation date, status, linked request',
        'Make the plan directly consumable by the BUILD workflow component-builder'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'plan', 'creation']
}));

const reviewGateTask = defineTask('cc10x-plan-review-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Review Gate',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Planner - Review Gate',
      task: 'Review the created plan for completeness, feasibility, and alignment with the original request. Gate the plan before it becomes available for BUILD.',
      context: { ...args },
      instructions: [
        'Verify plan covers all aspects of the original request',
        'Check that phases are logically ordered with correct dependencies',
        'Validate that risk mitigations are actionable',
        'Ensure TDD strategy is defined for each coding phase',
        'Verify plan is consumable by BUILD workflow (clear tasks, acceptance criteria)',
        'Score plan completeness (0-100)',
        'If score < 80, identify gaps and suggest improvements'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'plan', 'review-gate']
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * CC10X PLAN Workflow Process
 *
 * Comprehensive planning with research and build continuity:
 * 1. External research and pattern discovery
 * 2. Brainstorm alternative approaches
 * 3. Create comprehensive plan (saved to docs/plans/)
 * 4. Plan review gate
 *
 * Plans flow to BUILD workflow via planFile reference in memory.
 *
 * Agent: planner (with github-researcher for research)
 *
 * Attribution: Adapted from https://github.com/romiluz13/cc10x by Rom Iluz
 */
export async function process(inputs, ctx) {
  const {
    request,
    projectRoot = '.',
    memory = {},
    includeResearch = true
  } = inputs;

  ctx.log('CC10X PLAN: Starting comprehensive planning workflow', { request });

  // ========================================================================
  // STEP 1: PARALLEL RESEARCH + BRAINSTORMING
  // ========================================================================

  ctx.log('Step 1: Research and brainstorming');

  let researchResult = null;
  let brainstormResult;

  if (includeResearch) {
    [researchResult, brainstormResult] = await ctx.parallel.all([
      ctx.task(researchTask, { request, projectRoot, memory }),
      ctx.task(brainstormTask, { request, projectRoot, memory })
    ]);
  } else {
    brainstormResult = await ctx.task(brainstormTask, { request, projectRoot, memory });
  }

  // ========================================================================
  // STEP 2: CREATE PLAN
  // ========================================================================

  ctx.log('Step 2: Creating comprehensive plan');

  const plan = await ctx.task(createPlanTask, {
    request,
    researchFindings: researchResult,
    alternatives: brainstormResult.approaches,
    recommendedApproach: brainstormResult.recommended,
    projectRoot,
    memory
  });

  // ========================================================================
  // STEP 3: REVIEW GATE
  // ========================================================================

  ctx.log('Step 3: Plan review gate');

  const reviewGate = await ctx.task(reviewGateTask, {
    plan,
    request,
    projectRoot
  });

  if (reviewGate.score && reviewGate.score < 80) {
    await ctx.breakpoint({
      question: `Plan review score: ${reviewGate.score}/100. Gaps identified: ${(reviewGate.gaps || []).join('; ')}. Review the plan and approve or request improvements.`,
      title: 'CC10X PLAN - Review Gate',
      context: { runId: ctx.runId }
    });
  }

  return {
    success: (reviewGate.score || 0) >= 80,
    plan: plan.plan || plan,
    planFile: plan.planFile || `docs/plans/${Date.now()}-plan.md`,
    researchFindings: researchResult,
    alternatives: brainstormResult.approaches || [],
    reviewGate: {
      score: reviewGate.score,
      gaps: reviewGate.gaps,
      approved: (reviewGate.score || 0) >= 80
    },
    metadata: {
      processId: 'methodologies/cc10x/cc10x-plan',
      attribution: 'https://github.com/romiluz13/cc10x',
      author: 'Rom Iluz',
      timestamp: ctx.now()
    }
  };
}
