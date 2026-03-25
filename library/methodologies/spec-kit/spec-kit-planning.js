/**
 * @process methodologies/spec-kit/spec-kit-planning
 * @description Spec Kit planning workflow: technical architecture design + task decomposition + cross-artifact analysis. Converts a specification into an implementation-ready task list following GitHub's Spec-Driven Development.
 * @inputs { specification: object, constitution: object, projectType?: string, constraints?: object, existingArchitecture?: object }
 * @outputs { success: boolean, plan: object, tasks: array, analysis: object, dependencyGraph: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const assessTechStackTask = defineTask('spec-kit-plan-assess-stack', async (args, _ctx) => {
  return { assessment: args };
}, {
  kind: 'agent',
  title: 'Assess Technology Stack Options',
  labels: ['spec-kit', 'planning', 'tech-stack'],
  io: {
    inputs: { specification: 'object', constitution: 'object', projectType: 'string', existingArchitecture: 'object', constraints: 'object' },
    outputs: { recommendedStack: 'object', alternatives: 'array', tradeoffs: 'array', compatibility: 'object' }
  }
});

const designArchitectureTask = defineTask('spec-kit-plan-design-architecture', async (args, _ctx) => {
  return { architecture: args };
}, {
  kind: 'agent',
  title: 'Design System Architecture',
  labels: ['spec-kit', 'planning', 'architecture'],
  io: {
    inputs: { specification: 'object', constitution: 'object', techStack: 'object', constraints: 'object' },
    outputs: { components: 'array', interfaces: 'array', dataModel: 'object', integrationPoints: 'array', scalabilityPlan: 'object', securityArchitecture: 'object' }
  }
});

const defineImplementationStrategyTask = defineTask('spec-kit-plan-strategy', async (args, _ctx) => {
  return { strategy: args };
}, {
  kind: 'agent',
  title: 'Define Implementation Strategy',
  labels: ['spec-kit', 'planning', 'strategy'],
  io: {
    inputs: { architecture: 'object', specification: 'object', constitution: 'object' },
    outputs: { phases: 'array', milestones: 'array', riskMitigations: 'array', testingStrategy: 'object', deploymentStrategy: 'object' }
  }
});

const decomposeIntoTasksTask = defineTask('spec-kit-plan-decompose', async (args, _ctx) => {
  return { decomposition: args };
}, {
  kind: 'agent',
  title: 'Decompose Plan into Actionable Development Tasks',
  labels: ['spec-kit', 'planning', 'task-decomposition'],
  io: {
    inputs: { architecture: 'object', strategy: 'object', specification: 'object', constitution: 'object' },
    outputs: { tasks: 'array', dependencyGraph: 'object', estimatedEffort: 'string', parallelizable: 'array', criticalPath: 'array', testTasks: 'array' }
  }
});

const assessRisksTask = defineTask('spec-kit-plan-assess-risks', async (args, _ctx) => {
  return { risks: args };
}, {
  kind: 'agent',
  title: 'Assess Implementation Risks',
  labels: ['spec-kit', 'planning', 'risk-assessment'],
  io: {
    inputs: { architecture: 'object', tasks: 'array', specification: 'object', constraints: 'object' },
    outputs: { risks: 'array', mitigations: 'array', contingencies: 'array', riskScore: 'number' }
  }
});

const runConsistencyAnalysisTask = defineTask('spec-kit-plan-analyze-consistency', async (args, _ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Run Cross-Artifact Consistency Analysis',
  labels: ['spec-kit', 'planning', 'analysis'],
  io: {
    inputs: { constitution: 'object', specification: 'object', architecture: 'object', tasks: 'array', risks: 'object' },
    outputs: { consistencyScore: 'number', coverageMatrix: 'object', coverageGaps: 'array', conflictsFound: 'array', recommendations: 'array', readyForImplementation: 'boolean' }
  }
});

const generatePlanDocumentTask = defineTask('spec-kit-plan-generate-document', async (args, _ctx) => {
  return { document: args };
}, {
  kind: 'agent',
  title: 'Generate Implementation Plan Document',
  labels: ['spec-kit', 'planning', 'documentation'],
  io: {
    inputs: { architecture: 'object', strategy: 'object', tasks: 'array', risks: 'object', analysis: 'object' },
    outputs: { documentPath: 'string', planVersion: 'string', summary: 'string' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Spec Kit Planning Workflow
 *
 * Implements the Planning + Task Breakdown + Analysis phases from GitHub's Spec Kit.
 * Takes a specification and constitution, produces an implementation-ready task list
 * with architecture, strategy, risk assessment, and consistency analysis.
 *
 * Workflow:
 * 1. Assess technology stack options
 * 2. Design system architecture
 * 3. Define implementation strategy
 * 4. Decompose into actionable tasks (parallel with risk assessment)
 * 5. Run cross-artifact consistency analysis
 * 6. Generate plan document
 *
 * Attribution: Adapted from https://github.com/github/spec-kit
 *
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.specification - Feature specification from spec-kit-specification
 * @param {Object} inputs.constitution - Project constitution
 * @param {string} inputs.projectType - Project type
 * @param {Object} inputs.constraints - Technical constraints
 * @param {Object} inputs.existingArchitecture - Existing architecture for brownfield
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Plan, tasks, and analysis results
 */
export async function process(inputs, ctx) {
  const {
    specification,
    constitution,
    projectType = 'web',
    constraints = {},
    existingArchitecture = null
  } = inputs;

  ctx.log('Spec Kit Planning: Starting planning + task breakdown + analysis workflow');

  // ============================================================================
  // PHASE 1: TECHNICAL ARCHITECTURE
  // ============================================================================

  ctx.log('Phase 1: Assessing technology stack and designing architecture');

  const stackAssessment = await ctx.task(assessTechStackTask, {
    specification,
    constitution,
    projectType,
    existingArchitecture,
    constraints
  });

  const architecture = await ctx.task(designArchitectureTask, {
    specification,
    constitution,
    techStack: stackAssessment.recommendedStack,
    constraints
  });

  await ctx.breakpoint({
    question: `Architecture designed with ${(architecture.components || []).length} components, ${(architecture.interfaces || []).length} interfaces. Tech stack: ${JSON.stringify(stackAssessment.recommendedStack || {})}. Approve to proceed to implementation strategy.`,
    title: 'Spec Kit: Architecture Review',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 2: IMPLEMENTATION STRATEGY
  // ============================================================================

  ctx.log('Phase 2: Defining implementation strategy');

  const strategy = await ctx.task(defineImplementationStrategyTask, {
    architecture,
    specification,
    constitution
  });

  // ============================================================================
  // PHASE 3: TASK DECOMPOSITION + RISK ASSESSMENT (parallel)
  // ============================================================================

  ctx.log('Phase 3: Decomposing tasks and assessing risks in parallel');

  const [decomposition, riskAssessment] = await ctx.parallel.all([
    () => ctx.task(decomposeIntoTasksTask, {
      architecture,
      strategy,
      specification,
      constitution
    }),
    () => ctx.task(assessRisksTask, {
      architecture,
      tasks: [],
      specification,
      constraints
    })
  ]);

  await ctx.breakpoint({
    question: `Task breakdown: ${(decomposition.tasks || []).length} tasks, ${(decomposition.parallelizable || []).length} parallelizable groups, estimated effort: ${decomposition.estimatedEffort}. Risk score: ${riskAssessment.riskScore}/100 with ${(riskAssessment.risks || []).length} identified risks. Approve to run consistency analysis.`,
    title: 'Spec Kit: Task Breakdown Review',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 4: CROSS-ARTIFACT ANALYSIS
  // ============================================================================

  ctx.log('Phase 4: Running cross-artifact consistency analysis');

  const analysis = await ctx.task(runConsistencyAnalysisTask, {
    constitution,
    specification,
    architecture,
    tasks: decomposition.tasks,
    risks: riskAssessment
  });

  // ============================================================================
  // CONVERGENCE: Analysis Quality Gate
  // ============================================================================

  let iteration = 0;
  const maxIterations = 2;

  while (!analysis.readyForImplementation && iteration < maxIterations) {
    iteration++;
    ctx.log(`Analysis found issues (score: ${analysis.consistencyScore}/100). Remediation iteration ${iteration}/${maxIterations}.`);

    await ctx.breakpoint({
      question: `Consistency score: ${analysis.consistencyScore}/100. ${(analysis.coverageGaps || []).length} gaps, ${(analysis.conflictsFound || []).length} conflicts. Approve to refine tasks based on analysis recommendations, or skip to proceed as-is.`,
      title: `Spec Kit: Analysis Remediation (Attempt ${iteration})`,
      context: { runId: ctx.runId }
    });

    // Refine task decomposition based on analysis
    const refinedDecomposition = await ctx.task(decomposeIntoTasksTask, {
      architecture,
      strategy,
      specification,
      constitution
    });

    Object.assign(decomposition, refinedDecomposition);

    const reanalysis = await ctx.task(runConsistencyAnalysisTask, {
      constitution,
      specification,
      architecture,
      tasks: decomposition.tasks,
      risks: riskAssessment
    });

    Object.assign(analysis, reanalysis);
  }

  // ============================================================================
  // PHASE 5: PLAN DOCUMENT
  // ============================================================================

  ctx.log('Phase 5: Generating implementation plan document');

  const planDocument = await ctx.task(generatePlanDocumentTask, {
    architecture,
    strategy,
    tasks: decomposition.tasks,
    risks: riskAssessment,
    analysis
  });

  ctx.log(`Planning complete. Document: ${planDocument.documentPath}. Ready: ${analysis.readyForImplementation}`);

  return {
    success: true,
    plan: {
      architecture,
      techStack: stackAssessment.recommendedStack,
      strategy,
      risks: riskAssessment,
      document: planDocument
    },
    tasks: decomposition.tasks,
    dependencyGraph: decomposition.dependencyGraph,
    parallelizable: decomposition.parallelizable,
    criticalPath: decomposition.criticalPath,
    analysis,
    metadata: {
      processId: 'methodologies/spec-kit/spec-kit-planning',
      attribution: 'https://github.com/github/spec-kit',
      consistencyScore: analysis.consistencyScore,
      totalTasks: (decomposition.tasks || []).length,
      riskScore: riskAssessment.riskScore,
      remediationIterations: iteration,
      timestamp: ctx.now()
    }
  };
}
