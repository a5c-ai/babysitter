/**
 * @process methodologies/rpikit/rpikit-plan
 * @description RPIKit Planning Phase - Transform research findings into actionable implementation plans with stakes-based rigor, test-first strategy, and human approval gates.
 * @inputs { topic: string, researchDocPath?: string, projectRoot?: string, stakesOverride?: string }
 * @outputs { success: boolean, planDocument: object, stakes: string, tasks: array, testStrategy: object, risks: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const loadResearchTask = defineTask('rpikit-load-research', async (args, _ctx) => {
  return { research: args };
}, {
  kind: 'agent',
  title: 'Load and Validate Research Findings',
  labels: ['rpikit', 'plan', 'research-input'],
  io: {
    inputs: { topic: 'string', researchDocPath: 'string', projectRoot: 'string' },
    outputs: { researchFound: 'boolean', findings: 'array', requirements: 'array', openQuestions: 'array', researchPath: 'string' }
  }
});

const classifyStakesTask = defineTask('rpikit-classify-stakes', async (args, _ctx) => {
  return { classification: args };
}, {
  kind: 'agent',
  title: 'Classify Change Stakes Level',
  labels: ['rpikit', 'plan', 'stakes'],
  io: {
    inputs: { topic: 'string', findings: 'array', requirements: 'array', stakesOverride: 'string' },
    outputs: { stakes: 'string', rationale: 'string', planningDepth: 'string', riskFactors: 'array' }
  }
});

const defineSuccessCriteriaTask = defineTask('rpikit-define-success', async (args, _ctx) => {
  return { criteria: args };
}, {
  kind: 'agent',
  title: 'Define Success Criteria',
  labels: ['rpikit', 'plan', 'success-criteria'],
  io: {
    inputs: { topic: 'string', requirements: 'array', stakes: 'string' },
    outputs: { functionalRequirements: 'array', nonFunctionalRequirements: 'array', acceptanceCriteria: 'array' }
  }
});

const decomposeTasksTask = defineTask('rpikit-decompose-tasks', async (args, _ctx) => {
  return { decomposition: args };
}, {
  kind: 'agent',
  title: 'Decompose Work into Granular Tasks',
  labels: ['rpikit', 'plan', 'task-decomposition'],
  io: {
    inputs: { topic: 'string', findings: 'array', successCriteria: 'object', stakes: 'string' },
    outputs: { phases: 'array', tasks: 'array', dependencies: 'object', complexityEstimates: 'object' }
  }
});

const planTestStrategyTask = defineTask('rpikit-plan-tests', async (args, _ctx) => {
  return { testPlan: args };
}, {
  kind: 'agent',
  title: 'Plan Test-First Strategy',
  labels: ['rpikit', 'plan', 'test-strategy'],
  io: {
    inputs: { tasks: 'array', successCriteria: 'object', stakes: 'string' },
    outputs: { unitTests: 'array', integrationTests: 'array', manualVerifications: 'array', coverageTargets: 'object' }
  }
});

const assessRisksTask = defineTask('rpikit-assess-risks', async (args, _ctx) => {
  return { risks: args };
}, {
  kind: 'agent',
  title: 'Assess Risks and Rollback Strategy',
  labels: ['rpikit', 'plan', 'risk-assessment'],
  io: {
    inputs: { tasks: 'array', stakes: 'string', dependencies: 'object' },
    outputs: { risks: 'array', mitigations: 'array', rollbackStrategy: 'string', breakingChanges: 'array' }
  }
});

const writePlanDocumentTask = defineTask('rpikit-write-plan', async (args, _ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Write Plan Document',
  labels: ['rpikit', 'plan', 'document'],
  io: {
    inputs: { topic: 'string', stakes: 'string', successCriteria: 'object', phases: 'array', tasks: 'array', testStrategy: 'object', risks: 'array', rollbackStrategy: 'string' },
    outputs: { planPath: 'string', summary: 'string', phaseCount: 'number', taskCount: 'number', status: 'string' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * RPIKit Planning Phase Process
 *
 * Transforms research findings into actionable implementation plans.
 * Scales rigor to stakes level: low (brief), medium (standard), high (comprehensive).
 * Enforces test-first strategy: every code-changing task specifies tests before implementation.
 *
 * Workflow:
 * 1. Load research findings (or determine if research needed)
 * 2. Classify stakes (low/medium/high)
 * 3. Define success criteria (functional, non-functional, acceptance)
 * 4. Decompose into granular tasks with file references
 * 5. Plan test-first strategy per task
 * 6. Assess risks and rollback strategy
 * 7. Write plan document with human approval gate
 *
 * Attribution: Adapted from https://github.com/bostonaholic/rpikit by Matthew Boston
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.topic - The topic or feature to plan
 * @param {string} inputs.researchDocPath - Path to research document
 * @param {string} inputs.projectRoot - Project root directory
 * @param {string} inputs.stakesOverride - Override stakes classification
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Plan with tasks, tests, and risk assessment
 */
export async function process(inputs, ctx) {
  const {
    topic,
    researchDocPath = '',
    projectRoot = '.',
    stakesOverride = ''
  } = inputs;

  ctx.log('RPIKit Plan: Creating actionable implementation plan');
  ctx.log('Principle: Plan before coding. Every task needs verification criteria.');

  // ============================================================================
  // STEP 1: LOAD RESEARCH
  // ============================================================================

  ctx.log('Step 1: Loading research findings');

  const research = await ctx.task(loadResearchTask, {
    topic,
    researchDocPath,
    projectRoot
  });

  if (!research.researchFound) {
    await ctx.breakpoint({
      question: `No research document found for "${topic}". Recommend running /rpikit:research first. Proceed with planning anyway?`,
      title: 'Missing Research',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 2: CLASSIFY STAKES
  // ============================================================================

  ctx.log('Step 2: Classifying change stakes');

  const stakesResult = await ctx.task(classifyStakesTask, {
    topic,
    findings: research.findings || [],
    requirements: research.requirements || [],
    stakesOverride
  });

  ctx.log(`Stakes classified as: ${stakesResult.stakes} (${stakesResult.rationale})`);

  // ============================================================================
  // STEP 3: DEFINE SUCCESS CRITERIA
  // ============================================================================

  ctx.log('Step 3: Defining success criteria');

  const successCriteria = await ctx.task(defineSuccessCriteriaTask, {
    topic,
    requirements: research.requirements || [],
    stakes: stakesResult.stakes
  });

  // ============================================================================
  // STEP 4: DECOMPOSE TASKS
  // ============================================================================

  ctx.log('Step 4: Decomposing work into granular tasks');

  const decomposition = await ctx.task(decomposeTasksTask, {
    topic,
    findings: research.findings || [],
    successCriteria,
    stakes: stakesResult.stakes
  });

  // ============================================================================
  // STEP 5: TEST-FIRST STRATEGY
  // ============================================================================

  ctx.log('Step 5: Planning test-first strategy');

  const testStrategy = await ctx.task(planTestStrategyTask, {
    tasks: decomposition.tasks,
    successCriteria,
    stakes: stakesResult.stakes
  });

  // ============================================================================
  // STEP 6: RISK ASSESSMENT
  // ============================================================================

  ctx.log('Step 6: Assessing risks and rollback strategy');

  const riskAssessment = await ctx.task(assessRisksTask, {
    tasks: decomposition.tasks,
    stakes: stakesResult.stakes,
    dependencies: decomposition.dependencies
  });

  // ============================================================================
  // STEP 7: WRITE PLAN DOCUMENT
  // ============================================================================

  ctx.log('Step 7: Writing plan document');

  const planDoc = await ctx.task(writePlanDocumentTask, {
    topic,
    stakes: stakesResult.stakes,
    successCriteria,
    phases: decomposition.phases,
    tasks: decomposition.tasks,
    testStrategy,
    risks: riskAssessment.risks,
    rollbackStrategy: riskAssessment.rollbackStrategy
  });

  // ============================================================================
  // APPROVAL GATE
  // ============================================================================

  await ctx.breakpoint({
    question: `Plan ready: "${topic}" [${stakesResult.stakes} stakes]. ${planDoc.phaseCount} phases, ${planDoc.taskCount} tasks. Document: ${planDoc.planPath}. Options: (1) Approve and implement, (2) Request changes, (3) Return to research.`,
    title: 'Plan Approval Gate',
    context: { runId: ctx.runId }
  });

  return {
    success: true,
    topic,
    planDocument: {
      path: planDoc.planPath,
      summary: planDoc.summary,
      status: planDoc.status
    },
    stakes: stakesResult.stakes,
    tasks: decomposition.tasks,
    testStrategy: {
      unitTests: testStrategy.unitTests.length,
      integrationTests: testStrategy.integrationTests.length,
      manualVerifications: testStrategy.manualVerifications.length
    },
    risks: riskAssessment.risks,
    metadata: {
      processId: 'methodologies/rpikit/rpikit-plan',
      attribution: 'https://github.com/bostonaholic/rpikit',
      author: 'Matthew Boston',
      timestamp: ctx.now()
    }
  };
}
