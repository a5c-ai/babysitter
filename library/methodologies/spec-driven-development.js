/**
 * @process methodologies/spec-driven-development
 * @description GitHub Spec-Kit inspired workflow - executable specifications drive implementation
 * @inputs { projectName: string, initialRequirements?: string, developmentPhase?: string }
 * @outputs { success: boolean, constitution: object, specification: object, plan: object, tasks: array, implementation: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Spec-Driven Development Process
 *
 * GitHub Spec-Kit Methodology: Specifications become executable, directly generating
 * working implementations rather than just guiding them.
 *
 * Five-Step Development Cycle:
 * 1. Constitution - Establish governance principles
 * 2. Specification - Define requirements and user stories
 * 3. Technical Plan - Document stack and architecture
 * 4. Task Breakdown - Generate actionable steps
 * 5. Implementation - Execute according to plan
 *
 * Supports: Greenfield, Brownfield, Creative Exploration
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project/feature
 * @param {string} inputs.initialRequirements - High-level requirements description
 * @param {string} inputs.developmentPhase - greenfield|brownfield|exploration (default: greenfield)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with all specification artifacts
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    initialRequirements = '',
    developmentPhase = 'greenfield'
  } = inputs;

  // ============================================================================
  // STEP 1: ESTABLISH CONSTITUTION
  // ============================================================================

  const constitutionResult = await ctx.task(establishConstitutionTask, {
    projectName,
    initialRequirements,
    developmentPhase,
    existingStandards: inputs.existingStandards || null
  });

  // Breakpoint: Review project constitution
  await ctx.breakpoint({
    question: `Review the project constitution for "${projectName}". These principles will govern all development decisions. Approve to proceed?`,
    title: 'Constitution Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/specs/CONSTITUTION.md', format: 'markdown', label: 'Project Constitution' }
      ]
    }
  });

  // ============================================================================
  // STEP 2: CREATE SPECIFICATION
  // ============================================================================

  const specificationResult = await ctx.task(createSpecificationTask, {
    projectName,
    initialRequirements,
    constitution: constitutionResult,
    developmentPhase
  });

  // Check if clarification needed
  if (specificationResult.needsClarification) {
    const clarificationResult = await ctx.task(clarifySpecificationTask, {
      projectName,
      specification: specificationResult,
      constitution: constitutionResult
    });

    // Merge clarifications back into specification
    specificationResult.clarifications = clarificationResult.clarifications;
  }

  // Breakpoint: Review specification
  await ctx.breakpoint({
    question: `Review the feature specification for "${projectName}". User stories are prioritized and independently testable. Approve to proceed with planning?`,
    title: 'Specification Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/specs/SPECIFICATION.md', format: 'markdown', label: 'Feature Specification' },
        { path: 'artifacts/specs/user-stories.json', format: 'code', language: 'json', label: 'User Stories' }
      ]
    }
  });

  // ============================================================================
  // STEP 3: CREATE TECHNICAL PLAN
  // ============================================================================

  const planResult = await ctx.task(createTechnicalPlanTask, {
    projectName,
    specification: specificationResult,
    constitution: constitutionResult,
    developmentPhase,
    existingCodebase: inputs.existingCodebase || null
  });

  // Validate plan against constitution
  const constitutionCheckResult = await ctx.task(validateConstitutionTask, {
    plan: planResult,
    constitution: constitutionResult
  });

  if (!constitutionCheckResult.passes) {
    await ctx.breakpoint({
      question: `Plan validation found constitution violations. Review issues and decide: revise plan or update constitution?`,
      title: 'Constitution Check Failed',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/specs/PLAN.md', format: 'markdown', label: 'Technical Plan' },
          { path: 'artifacts/specs/constitution-check.md', format: 'markdown', label: 'Violations' }
        ]
      }
    });

    // Re-plan with feedback
    const revisedPlan = await ctx.task(createTechnicalPlanTask, {
      projectName,
      specification: specificationResult,
      constitution: constitutionResult,
      developmentPhase,
      existingCodebase: inputs.existingCodebase,
      constitutionFeedback: constitutionCheckResult.issues
    });

    planResult.plan = revisedPlan.plan;
  }

  // Breakpoint: Review technical plan
  await ctx.breakpoint({
    question: `Review the technical implementation plan for "${projectName}". Architecture and tech stack defined. Approve to proceed with task breakdown?`,
    title: 'Technical Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/specs/PLAN.md', format: 'markdown', label: 'Implementation Plan' }
      ]
    }
  });

  // ============================================================================
  // STEP 4: BREAK INTO TASKS
  // ============================================================================

  const tasksResult = await ctx.task(breakIntoTasksTask, {
    projectName,
    specification: specificationResult,
    plan: planResult,
    constitution: constitutionResult
  });

  // Analyze cross-artifact consistency
  const analysisResult = await ctx.task(analyzeConsistencyTask, {
    projectName,
    constitution: constitutionResult,
    specification: specificationResult,
    plan: planResult,
    tasks: tasksResult
  });

  if (analysisResult.hasInconsistencies) {
    await ctx.breakpoint({
      question: `Consistency analysis found misalignments between artifacts. Review issues and approve resolution plan?`,
      title: 'Consistency Check',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/specs/ANALYSIS.md', format: 'markdown', label: 'Consistency Analysis' }
        ]
      }
    });
  }

  // Breakpoint: Review task breakdown
  await ctx.breakpoint({
    question: `Review ${tasksResult.tasks.length} tasks organized in ${tasksResult.phases.length} phases. Tasks are ordered with dependencies and parallelization marked. Approve to proceed with implementation?`,
    title: 'Task Breakdown Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/specs/TASKS.md', format: 'markdown', label: 'Task List' }
      ]
    }
  });

  // ============================================================================
  // STEP 5: IMPLEMENT
  // ============================================================================

  const implementationResults = [];

  // Execute tasks phase by phase
  for (let phaseIdx = 0; phaseIdx < tasksResult.phases.length; phaseIdx++) {
    const phase = tasksResult.phases[phaseIdx];

    // Organize phase tasks into parallel waves
    const waves = organizeTasksIntoWaves(phase.tasks, tasksResult.tasks);

    for (let waveIdx = 0; waveIdx < waves.length; waveIdx++) {
      const wave = waves[waveIdx];

      // Execute wave in parallel
      const waveResults = await ctx.parallel.all(
        wave.map(taskId => async () => {
          const task = tasksResult.tasks.find(t => t.id === taskId);

          // Implement task
          const implResult = await ctx.task(implementTaskTask, {
            projectName,
            task,
            specification: specificationResult,
            plan: planResult,
            constitution: constitutionResult,
            previousImplementations: implementationResults
          });

          // Generate quality checklist
          const checklistResult = await ctx.task(generateChecklistTask, {
            task,
            implementation: implResult,
            constitution: constitutionResult
          });

          // Validate against checklist
          const validationResult = await ctx.task(validateChecklistTask, {
            task,
            implementation: implResult,
            checklist: checklistResult
          });

          return {
            task,
            implementation: implResult,
            checklist: checklistResult,
            validation: validationResult
          };
        })
      );

      implementationResults.push(...waveResults);

      // Check if any task failed validation
      const failedTasks = waveResults.filter(r => !r.validation.passed);
      if (failedTasks.length > 0) {
        await ctx.breakpoint({
          question: `${failedTasks.length} task(s) failed validation. Review issues and decide: fix and retry, skip, or abort?`,
          title: `Phase ${phaseIdx + 1} - Wave ${waveIdx + 1} Validation Failed`,
          context: {
            runId: ctx.runId,
            files: failedTasks.map(ft => ({
              path: `artifacts/implementation/${ft.task.id}/validation.md`,
              format: 'markdown',
              label: `${ft.task.id} Validation`
            }))
          }
        });
      }
    }

    // Phase completion checkpoint
    await ctx.breakpoint({
      question: `Phase ${phaseIdx + 1} "${phase.name}" complete. Review deliverables before proceeding to next phase?`,
      title: `Phase ${phaseIdx + 1} Complete`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/implementation/phase-${phaseIdx + 1}-summary.md`, format: 'markdown', label: 'Phase Summary' }
        ]
      }
    });
  }

  // ============================================================================
  // FINAL VALIDATION
  // ============================================================================

  // Verify all user stories are implemented
  const userStoryValidation = await ctx.task(validateUserStoriesTask, {
    specification: specificationResult,
    implementationResults
  });

  // Final breakpoint
  await ctx.breakpoint({
    question: `Implementation complete. All user stories validated: ${userStoryValidation.allPassed}. Review final deliverables and approve?`,
    title: 'Implementation Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/specs/CONSTITUTION.md', format: 'markdown', label: 'Constitution' },
        { path: 'artifacts/specs/SPECIFICATION.md', format: 'markdown', label: 'Specification' },
        { path: 'artifacts/specs/PLAN.md', format: 'markdown', label: 'Plan' },
        { path: 'artifacts/specs/TASKS.md', format: 'markdown', label: 'Tasks' },
        { path: 'artifacts/implementation/SUMMARY.md', format: 'markdown', label: 'Implementation Summary' }
      ]
    }
  });

  return {
    success: userStoryValidation.allPassed,
    projectName,
    developmentPhase,
    constitution: constitutionResult,
    specification: specificationResult,
    plan: planResult,
    tasks: tasksResult,
    implementation: implementationResults,
    validation: userStoryValidation,
    artifacts: {
      constitution: 'artifacts/specs/CONSTITUTION.md',
      specification: 'artifacts/specs/SPECIFICATION.md',
      plan: 'artifacts/specs/PLAN.md',
      tasks: 'artifacts/specs/TASKS.md',
      implementation: 'artifacts/implementation/'
    },
    metadata: {
      processId: 'methodologies/spec-driven-development',
      timestamp: ctx.now()
    }
  };
}

/**
 * Organize tasks into parallel execution waves based on dependencies
 */
function organizeTasksIntoWaves(phaseTaskIds, allTasks) {
  const waves = [];
  const remaining = new Set(phaseTaskIds);
  const completed = new Set();

  while (remaining.size > 0) {
    const wave = [];

    // Find tasks that can run (all dependencies completed)
    for (const taskId of remaining) {
      const task = allTasks.find(t => t.id === taskId);
      const canRun = task.dependencies.every(dep => completed.has(dep));

      if (canRun) {
        wave.push(taskId);
      }
    }

    if (wave.length === 0) {
      // Circular dependency or error - break
      console.error('Cannot resolve task dependencies', Array.from(remaining));
      break;
    }

    waves.push(wave);

    // Mark wave tasks as completed
    wave.forEach(taskId => {
      remaining.delete(taskId);
      completed.add(taskId);
    });
  }

  return waves;
}

// ============================================================================
// TASK DEFINITIONS
// (Abbreviated - see full version in cached installation for complete schemas)
// ============================================================================

export const establishConstitutionTask = defineTask('establish-constitution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Establish constitution: ${args.projectName}`,
  agent: { name: 'constitution-writer', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'constitution']
}));

export const createSpecificationTask = defineTask('create-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create specification: ${args.projectName}`,
  agent: { name: 'spec-writer', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'specification']
}));

export const clarifySpecificationTask = defineTask('clarify-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clarify ambiguous requirements',
  agent: { name: 'clarifier', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'clarification']
}));

export const createTechnicalPlanTask = defineTask('create-technical-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create technical plan: ${args.projectName}`,
  agent: { name: 'technical-planner', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'planning']
}));

export const validateConstitutionTask = defineTask('validate-constitution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate plan against constitution',
  agent: { name: 'constitution-validator', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'validation']
}));

export const breakIntoTasksTask = defineTask('break-into-tasks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Break into tasks: ${args.projectName}`,
  agent: { name: 'task-breaker', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'tasks']
}));

export const analyzeConsistencyTask = defineTask('analyze-consistency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cross-artifact consistency',
  agent: { name: 'consistency-analyzer', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'analysis']
}));

export const implementTaskTask = defineTask('implement-task', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement: ${args.task.id}`,
  agent: { name: 'implementer', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'implementation', args.task.id]
}));

export const generateChecklistTask = defineTask('generate-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate checklist: ${args.task.id}`,
  agent: { name: 'checklist-generator', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'checklist']
}));

export const validateChecklistTask = defineTask('validate-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate: ${args.task.id}`,
  agent: { name: 'checklist-validator', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'validation']
}));

export const validateUserStoriesTask = defineTask('validate-user-stories', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate all user stories',
  agent: { name: 'story-validator', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'validation']
}));

// NOTE: Full task definitions with complete prompts and schemas available in the full implementation
// See: C:\Users\tmusk\.claude\plugins\cache\a5c-ai\babysitter\4.0.42\skills\babysit\process\methodologies\spec-driven-development.js
