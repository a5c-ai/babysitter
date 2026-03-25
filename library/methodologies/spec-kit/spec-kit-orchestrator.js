/**
 * @process methodologies/spec-kit/spec-kit-orchestrator
 * @description Full Spec Kit pipeline: constitution -> specify -> clarify -> plan -> tasks -> analyze -> implement -> checklist. Progressive refinement from intent to code following GitHub's Spec-Driven Development methodology.
 * @inputs { projectName: string, featureDescription: string, projectType?: string, existingConstitution?: object, mode?: 'greenfield' | 'brownfield' | 'creative', constraints?: object }
 * @outputs { success: boolean, constitution: object, specification: object, plan: object, tasks: array, analysis: object, implementation: object, checklist: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const establishConstitutionTask = defineTask('spec-kit-establish-constitution', async (args, _ctx) => {
  return { constitution: args };
}, {
  kind: 'agent',
  title: 'Establish Project Constitution (Governing Principles)',
  labels: ['spec-kit', 'constitution', 'governance'],
  io: {
    inputs: { projectName: 'string', projectType: 'string', existingConstitution: 'object', constraints: 'object' },
    outputs: { devGuidelines: 'object', codeQuality: 'object', testing: 'object', ux: 'object', performance: 'object', security: 'object', architecture: 'object' }
  }
});

const writeSpecificationTask = defineTask('spec-kit-write-specification', async (args, _ctx) => {
  return { specification: args };
}, {
  kind: 'agent',
  title: 'Write Feature Specification (Requirements & User Stories)',
  labels: ['spec-kit', 'specification', 'requirements'],
  io: {
    inputs: { featureDescription: 'string', constitution: 'object', mode: 'string', projectName: 'string' },
    outputs: { requirements: 'array', userStories: 'array', acceptanceCriteria: 'array', nonFunctional: 'array', outOfScope: 'array' }
  }
});

const clarifySpecificationTask = defineTask('spec-kit-clarify-specification', async (args, _ctx) => {
  return { clarification: args };
}, {
  kind: 'agent',
  title: 'Clarify Underspecified Areas',
  labels: ['spec-kit', 'clarification', 'refinement'],
  io: {
    inputs: { specification: 'object', constitution: 'object' },
    outputs: { gaps: 'array', ambiguities: 'array', resolutions: 'array', updatedSpecification: 'object' }
  }
});

const designPlanTask = defineTask('spec-kit-design-plan', async (args, _ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Design Technical Plan (Architecture & Strategy)',
  labels: ['spec-kit', 'planning', 'architecture'],
  io: {
    inputs: { specification: 'object', constitution: 'object', projectType: 'string', constraints: 'object' },
    outputs: { architecture: 'object', techStack: 'object', implementationStrategy: 'object', riskAssessment: 'array', dependencies: 'array' }
  }
});

const decomposeTasksTask = defineTask('spec-kit-decompose-tasks', async (args, _ctx) => {
  return { tasks: args };
}, {
  kind: 'agent',
  title: 'Decompose Plan into Actionable Tasks',
  labels: ['spec-kit', 'tasks', 'decomposition'],
  io: {
    inputs: { plan: 'object', specification: 'object', constitution: 'object' },
    outputs: { tasks: 'array', dependencyGraph: 'object', estimatedEffort: 'string', parallelizable: 'array', criticalPath: 'array' }
  }
});

const analyzeArtifactsTask = defineTask('spec-kit-analyze-artifacts', async (args, _ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Cross-Artifact Consistency Analysis',
  labels: ['spec-kit', 'analysis', 'consistency'],
  io: {
    inputs: { constitution: 'object', specification: 'object', plan: 'object', tasks: 'array' },
    outputs: { consistencyScore: 'number', coverageGaps: 'array', conflictsFound: 'array', recommendations: 'array', readyForImplementation: 'boolean' }
  }
});

const implementTasksBatchTask = defineTask('spec-kit-implement-tasks-batch', async (args, _ctx) => {
  return { implementation: args };
}, {
  kind: 'agent',
  title: 'Implement Task Batch',
  labels: ['spec-kit', 'implementation', 'execution'],
  io: {
    inputs: { tasks: 'array', plan: 'object', constitution: 'object', specification: 'object' },
    outputs: { completedTasks: 'array', artifacts: 'array', testResults: 'object', issues: 'array' }
  }
});

const validateChecklistTask = defineTask('spec-kit-validate-checklist', async (args, _ctx) => {
  return { checklist: args };
}, {
  kind: 'agent',
  title: 'Quality Checklist Validation',
  labels: ['spec-kit', 'checklist', 'quality'],
  io: {
    inputs: { constitution: 'object', specification: 'object', implementation: 'object', customChecks: 'array' },
    outputs: { passed: 'boolean', score: 'number', checkResults: 'array', failedItems: 'array', recommendations: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Spec Kit Full Pipeline Orchestrator
 *
 * Implements the complete Spec-Driven Development workflow from GitHub's Spec Kit:
 * Constitution -> Specification -> Clarification -> Planning -> Task Breakdown -> Analysis -> Implementation -> Checklist
 *
 * Progressive refinement: intent -> spec -> plan -> tasks -> code
 *
 * Attribution: Adapted from https://github.com/github/spec-kit
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.featureDescription - What to build (business value, not technical)
 * @param {string} inputs.projectType - Project type (web, api, cli, library, etc.)
 * @param {Object} inputs.existingConstitution - Reuse existing constitution if available
 * @param {string} inputs.mode - Development mode: greenfield, brownfield, or creative
 * @param {Object} inputs.constraints - Performance, security, compatibility constraints
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Full pipeline results with all artifacts
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featureDescription,
    projectType = 'web',
    existingConstitution = null,
    mode = 'greenfield',
    constraints = {}
  } = inputs;

  ctx.log('Spec Kit Orchestrator: Starting full spec-driven development pipeline');
  ctx.log(`Mode: ${mode} | Project: ${projectName} | Feature: ${featureDescription}`);

  // ============================================================================
  // PHASE 1: CONSTITUTION
  // ============================================================================

  ctx.log('Phase 1: Establishing project constitution (governing principles)');

  let constitution;
  if (existingConstitution) {
    ctx.log('Using existing constitution');
    constitution = existingConstitution;
  } else {
    constitution = await ctx.task(establishConstitutionTask, {
      projectName,
      projectType,
      existingConstitution: null,
      constraints
    });

    await ctx.breakpoint({
      question: `Constitution established for "${projectName}". Review governing principles for dev guidelines, code quality, testing, UX, performance, security, and architecture. Approve to proceed to specification.`,
      title: 'Spec Kit: Constitution Review',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // PHASE 2: SPECIFICATION
  // ============================================================================

  ctx.log('Phase 2: Writing feature specification (requirements & user stories)');

  const specification = await ctx.task(writeSpecificationTask, {
    featureDescription,
    constitution,
    mode,
    projectName
  });

  // ============================================================================
  // PHASE 3: CLARIFICATION (Optional but recommended)
  // ============================================================================

  ctx.log('Phase 3: Clarifying underspecified areas');

  const clarification = await ctx.task(clarifySpecificationTask, {
    specification,
    constitution
  });

  const refinedSpec = clarification.updatedSpecification || specification;

  await ctx.breakpoint({
    question: `Specification complete with ${(refinedSpec.requirements || []).length} requirements and ${(refinedSpec.userStories || []).length} user stories. ${(clarification.gaps || []).length} gaps identified and resolved. Approve to proceed to technical planning.`,
    title: 'Spec Kit: Specification Review',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 4: PLANNING
  // ============================================================================

  ctx.log('Phase 4: Designing technical plan (architecture & strategy)');

  const plan = await ctx.task(designPlanTask, {
    specification: refinedSpec,
    constitution,
    projectType,
    constraints
  });

  // ============================================================================
  // PHASE 5: TASK BREAKDOWN
  // ============================================================================

  ctx.log('Phase 5: Decomposing plan into actionable tasks');

  const taskBreakdown = await ctx.task(decomposeTasksTask, {
    plan,
    specification: refinedSpec,
    constitution
  });

  // ============================================================================
  // PHASE 6: CROSS-ARTIFACT ANALYSIS
  // ============================================================================

  ctx.log('Phase 6: Running cross-artifact consistency analysis');

  const analysis = await ctx.task(analyzeArtifactsTask, {
    constitution,
    specification: refinedSpec,
    plan,
    tasks: taskBreakdown.tasks
  });

  if (!analysis.readyForImplementation) {
    ctx.log(`Analysis found ${(analysis.conflictsFound || []).length} conflicts and ${(analysis.coverageGaps || []).length} gaps`);
  }

  await ctx.breakpoint({
    question: `Analysis complete. Consistency score: ${analysis.consistencyScore}/100. ${(analysis.conflictsFound || []).length} conflicts, ${(analysis.coverageGaps || []).length} coverage gaps. Ready: ${analysis.readyForImplementation}. Approve to proceed to implementation.`,
    title: 'Spec Kit: Pre-Implementation Analysis',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 7: IMPLEMENTATION
  // ============================================================================

  ctx.log('Phase 7: Implementing tasks');

  const allTasks = taskBreakdown.tasks || [];
  const parallelizable = taskBreakdown.parallelizable || [];
  const criticalPath = taskBreakdown.criticalPath || allTasks;
  let allCompletedTasks = [];
  let allArtifacts = [];
  let allIssues = [];

  // Execute parallelizable tasks concurrently
  if (parallelizable.length > 0) {
    ctx.log(`Executing ${parallelizable.length} parallelizable task groups`);

    const parallelResults = await ctx.parallel.all(
      parallelizable.map(taskGroup => () =>
        ctx.task(implementTasksBatchTask, {
          tasks: Array.isArray(taskGroup) ? taskGroup : [taskGroup],
          plan,
          constitution,
          specification: refinedSpec
        })
      )
    );

    for (const result of parallelResults) {
      allCompletedTasks = allCompletedTasks.concat(result.completedTasks || []);
      allArtifacts = allArtifacts.concat(result.artifacts || []);
      allIssues = allIssues.concat(result.issues || []);
    }
  }

  // Execute critical path tasks sequentially
  const remainingTasks = criticalPath.filter(t => {
    const completedIds = allCompletedTasks.map(ct => ct.id || ct.taskId);
    return !completedIds.includes(t.id || t.taskId);
  });

  if (remainingTasks.length > 0) {
    ctx.log(`Executing ${remainingTasks.length} sequential critical-path tasks`);

    const seqResult = await ctx.task(implementTasksBatchTask, {
      tasks: remainingTasks,
      plan,
      constitution,
      specification: refinedSpec
    });

    allCompletedTasks = allCompletedTasks.concat(seqResult.completedTasks || []);
    allArtifacts = allArtifacts.concat(seqResult.artifacts || []);
    allIssues = allIssues.concat(seqResult.issues || []);
  }

  const implementation = {
    completedTasks: allCompletedTasks,
    artifacts: allArtifacts,
    issues: allIssues,
    totalTasks: allTasks.length,
    completedCount: allCompletedTasks.length
  };

  // ============================================================================
  // PHASE 8: QUALITY CHECKLIST
  // ============================================================================

  ctx.log('Phase 8: Running quality checklist validation');

  const checklist = await ctx.task(validateChecklistTask, {
    constitution,
    specification: refinedSpec,
    implementation,
    customChecks: inputs.customChecks || []
  });

  // ============================================================================
  // CONVERGENCE: Quality Gate
  // ============================================================================

  let iteration = 0;
  const maxIterations = 3;

  while (!checklist.passed && iteration < maxIterations) {
    iteration++;
    ctx.log(`Quality gate failed (score: ${checklist.score}/100). Iteration ${iteration}/${maxIterations} for remediation.`);

    await ctx.breakpoint({
      question: `Quality checklist failed with score ${checklist.score}/100. ${(checklist.failedItems || []).length} items failed. Review failures and approve remediation attempt ${iteration}/${maxIterations}, or skip to accept current state.`,
      title: `Spec Kit: Quality Remediation (Attempt ${iteration})`,
      context: { runId: ctx.runId }
    });

    // Re-implement failed items
    const failedTaskIds = (checklist.failedItems || []).map(f => f.taskId).filter(Boolean);
    const tasksToFix = allTasks.filter(t => failedTaskIds.includes(t.id || t.taskId));

    if (tasksToFix.length > 0) {
      const fixResult = await ctx.task(implementTasksBatchTask, {
        tasks: tasksToFix,
        plan,
        constitution,
        specification: refinedSpec
      });

      implementation.completedTasks = implementation.completedTasks.concat(fixResult.completedTasks || []);
      implementation.artifacts = implementation.artifacts.concat(fixResult.artifacts || []);
    }

    // Re-validate
    const recheck = await ctx.task(validateChecklistTask, {
      constitution,
      specification: refinedSpec,
      implementation,
      customChecks: inputs.customChecks || []
    });

    Object.assign(checklist, recheck);
  }

  ctx.log(`Spec Kit pipeline complete. Quality score: ${checklist.score}/100. Passed: ${checklist.passed}`);

  return {
    success: true,
    constitution,
    specification: refinedSpec,
    plan,
    tasks: taskBreakdown.tasks,
    analysis,
    implementation,
    checklist,
    artifacts: allArtifacts,
    metadata: {
      processId: 'methodologies/spec-kit/spec-kit-orchestrator',
      attribution: 'https://github.com/github/spec-kit',
      mode,
      projectName,
      qualityScore: checklist.score,
      totalTasks: allTasks.length,
      completedTasks: allCompletedTasks.length,
      remediationIterations: iteration,
      timestamp: ctx.now()
    }
  };
}
